import os
import hmac
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def chiffrer(cle: bytes, donnee: str) -> tuple[bytes, bytes]:
    """Chiffre une donnée avec AES-256-GCM."""
    iv = os.urandom(12)
    aesgcm = AESGCM(cle)
    chiffre = aesgcm.encrypt(iv, donnee.encode(), None)
    return iv, chiffre


def dechiffrer(cle: bytes, iv: bytes, chiffre: bytes) -> str:
    """Déchiffre une donnée avec AES-256-GCM."""
    aesgcm = AESGCM(cle)
    return aesgcm.decrypt(iv, chiffre, None).decode()


def deriver_cle(mot_de_passe: str, sel: bytes) -> bytes:
    """Dérive une clé de 256 bits depuis un mot de passe via PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=sel,
        iterations=100000,
    )
    return kdf.derive(mot_de_passe.encode())


def get_cle_serveur() -> bytes:
    """Retourne la clé serveur depuis les variables d'environnement."""
    cle_raw = os.environ.get("SERVER_AES_KEY", "senverbalis_cle_serveur_2026")
    return hashlib.sha256(cle_raw.encode()).digest()


def get_cle_hmac() -> bytes:
    """Retourne la clé HMAC depuis les variables d'environnement."""
    cle_raw = os.environ.get("SERVER_HMAC_KEY", "senverbalis_hmac_key_2026")
    return hashlib.sha256(cle_raw.encode()).digest()


def signer_pv(donnees_pv: str) -> str:
    """Signe les données immuables d'un PV avec HMAC-SHA256."""
    cle = get_cle_hmac()
    return hmac.new(cle, donnees_pv.encode(), hashlib.sha256).hexdigest()


def verifier_signature_pv(donnees_pv: str, signature: str) -> bool:
    """Vérifie la signature HMAC-SHA256 d'un PV."""
    sig_calculee = signer_pv(donnees_pv)
    return hmac.compare_digest(sig_calculee, signature)