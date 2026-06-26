import logging
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger("senverbalis.triggers")

# ── SQLite Triggers DDL ───────────────────────────────────────────────────
SQLITE_TRIGGERS = [
    # audit_logs table
    """
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    BEGIN
        SELECT RAISE(FAIL, 'Modification du journal d''audit interdite.');
    END;
    """,
    """
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    BEGIN
        SELECT RAISE(FAIL, 'Suppression du journal d''audit interdite.');
    END;
    """,
    # pvs table
    """
    CREATE TRIGGER IF NOT EXISTS pvs_no_delete
    BEFORE DELETE ON pvs
    BEGIN
        SELECT RAISE(FAIL, 'Suppression d''un PV interdite.');
    END;
    """,
    """
    CREATE TRIGGER IF NOT EXISTS pvs_no_update_physical
    BEFORE UPDATE ON pvs
    WHEN OLD.id != NEW.id OR
         OLD.agent_id != NEW.agent_id OR
         OLD.num_permis_chiffre != NEW.num_permis_chiffre OR
         OLD.iv != NEW.iv OR
         OLD.num_permis_hash != NEW.num_permis_hash OR
         OLD.plaque != NEW.plaque OR
         OLD.type_infraction != NEW.type_infraction OR
         OLD.lieu != NEW.lieu OR
         OLD.montant != NEW.montant OR
         OLD.signature != NEW.signature OR
         OLD.date_creation != NEW.date_creation
    BEGIN
        SELECT RAISE(FAIL, 'Modification des donnees physiques du PV interdite. Seul le statut peut etre modifie.');
    END;
    """
]

# ── PostgreSQL Triggers DDL ───────────────────────────────────────────────
POSTGRES_TRIGGERS = [
    # Function for audit_logs
    """
    CREATE OR REPLACE FUNCTION block_audit_log_changes()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Modification ou suppression du journal d''audit interdite.';
    END;
    $$ LANGUAGE plpgsql;
    """,
    # Trigger for audit_logs update
    """
    DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
    """,
    """
    CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION block_audit_log_changes();
    """,
    # Trigger for audit_logs delete
    """
    DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
    """,
    """
    CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION block_audit_log_changes();
    """,
    # Function for pvs
    """
    CREATE OR REPLACE FUNCTION block_pv_changes()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Suppression d''un PV interdite.';
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.id IS DISTINCT FROM NEW.id OR
               OLD.agent_id IS DISTINCT FROM NEW.agent_id OR
               OLD.num_permis_chiffre IS DISTINCT FROM NEW.num_permis_chiffre OR
               OLD.iv IS DISTINCT FROM NEW.iv OR
               OLD.num_permis_hash IS DISTINCT FROM NEW.num_permis_hash OR
               OLD.plaque IS DISTINCT FROM NEW.plaque OR
               OLD.type_infraction IS DISTINCT FROM NEW.type_infraction OR
               OLD.lieu IS DISTINCT FROM NEW.lieu OR
               OLD.montant IS DISTINCT FROM NEW.montant OR
               OLD.signature IS DISTINCT FROM NEW.signature OR
               OLD.date_creation IS DISTINCT FROM NEW.date_creation THEN
                RAISE EXCEPTION 'Modification des donnees physiques du PV interdite. Seul le statut peut etre modifie.';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """,
    # Trigger for pvs delete
    """
    DROP TRIGGER IF EXISTS pvs_no_delete ON pvs;
    """,
    """
    CREATE TRIGGER pvs_no_delete
    BEFORE DELETE ON pvs
    FOR EACH ROW EXECUTE FUNCTION block_pv_changes();
    """,
    # Trigger for pvs update
    """
    DROP TRIGGER IF EXISTS pvs_no_update ON pvs;
    """,
    """
    CREATE TRIGGER pvs_no_update
    BEFORE UPDATE ON pvs
    FOR EACH ROW EXECUTE FUNCTION block_pv_changes();
    """
]


def appliquer_triggers(db: Session):
    """Détecte la base de données et applique les triggers correspondants."""
    bind = db.get_bind()
    dialect_name = bind.dialect.name
    
    logger.info("Application des triggers SQL de sécurité (Dialect: %s)", dialect_name)
    
    try:
        if dialect_name == "sqlite":
            for sql in SQLITE_TRIGGERS:
                db.execute(text(sql))
            db.commit()
            logger.info("✅ Triggers SQLite appliqués avec succès.")
        elif dialect_name == "postgresql":
            for sql in POSTGRES_TRIGGERS:
                db.execute(text(sql))
            db.commit()
            logger.info("✅ Triggers PostgreSQL appliqués avec succès.")
        else:
            logger.warning("⚠️ Dialecte de base de données non supporté pour les triggers de sécurité : %s", dialect_name)
    except Exception as e:
        db.rollback()
        logger.error("❌ Échec de l'application des triggers de sécurité : %s", e)
        raise e
