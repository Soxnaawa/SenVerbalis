CREATE OR REPLACE FUNCTION bloquer_modif_audit()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Modification du journal d''audit interdite.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_audit
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION bloquer_modif_audit();

CREATE TRIGGER no_delete_audit
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION bloquer_modif_audit();