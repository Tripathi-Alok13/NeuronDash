import jwt
import hashlib
import os
from datetime import datetime, timedelta
from typing import Union, Any
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_password_hash(password: str) -> str:
    """
    Computes a secure PBKDF2-HMAC-SHA256 hash using 100,000 iterations and a 16-byte salt.
    """
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + db_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against its stored salt and PBKDF2 hash.
    """
    try:
        if ":" not in hashed_password:
            return False
        salt_hex, hash_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        db_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return db_hash.hex() == hash_hex
    except Exception:
        return False
