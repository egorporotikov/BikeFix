from fastapi import HTTPException
import os
import time
from typing import Optional, Dict, Any
import requests
from jose import jwt
import base64
from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePublicNumbers, SECP256R1
from cryptography.hazmat.primitives import serialization
from dotenv import load_dotenv
from dotenv import load_dotenv

# Load .env file manually (VS Code terminal may not load it)
load_dotenv()

# ============================
#  ENV VARIABLES
# ============================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # publishable key
EXPECTED_AUD = os.getenv("SUPABASE_AUD") or "authenticated"

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not set")

if not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_ANON_KEY (publishable key) is not set")

JWKS_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"

EXPECTED_ISSUER = f"{SUPABASE_URL.rstrip('/')}/auth/v1"

# ============================
#  JWKS CACHE
# ============================

_JWKS_CACHE: Dict[str, Any] = {"keys": None, "fetched_at": 0}
_JWKS_TTL = 3600  # 1 hour


def _fetch_jwks() -> Dict[str, Any]:
    """Fetch JWKS from Supabase Auth with publishable key."""
    now = int(time.time())

    if _JWKS_CACHE["keys"] and (now - _JWKS_CACHE["fetched_at"] < _JWKS_TTL):
        return _JWKS_CACHE["keys"]

    try:
        resp = requests.get(
            JWKS_URL,
            timeout=5,
            headers={"apikey": SUPABASE_ANON_KEY}  # REQUIRED for new Supabase Auth
        )
        resp.raise_for_status()
        jwks = resp.json()

        _JWKS_CACHE["keys"] = jwks
        _JWKS_CACHE["fetched_at"] = now
        return jwks

    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch JWKS: {exc}")


def _get_key_for_kid(kid: str) -> Dict[str, Any]:
    jwks = _fetch_jwks()
    keys = jwks.get("keys", [])
    for key in keys:
        if key.get("kid") == kid:
            return key
    raise HTTPException(status_code=401, detail="Public key not found for token")


def _base64url_to_int(val: str) -> int:
    rem = len(val) % 4
    if rem:
        val += "=" * (4 - rem)
    data = base64.urlsafe_b64decode(val.encode("utf-8"))
    return int.from_bytes(data, "big")


def _public_key_from_jwk(jwk: Dict[str, Any]):
    if jwk.get("kty") != "EC":
        raise HTTPException(status_code=401, detail="Unsupported key type")

    x_int = _base64url_to_int(jwk["x"])
    y_int = _base64url_to_int(jwk["y"])

    numbers = EllipticCurvePublicNumbers(x_int, y_int, SECP256R1())
    public_key = numbers.public_key()

    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )


def verify_supabase_token(token: str) -> dict:
    """Verify ES256 Supabase access token using JWKS."""
    try:
        unverified = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token header")

    kid = unverified.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token missing kid header")

    jwk = _get_key_for_kid(kid)
    pem = _public_key_from_jwk(jwk)

    try:
        payload = jwt.decode(
            token,
            pem,
            algorithms=["ES256"],
            audience=EXPECTED_AUD,
            issuer=EXPECTED_ISSUER,
            options={"verify_exp": True, "verify_aud": True, "verify_iss": True},
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


def get_current_user_from_token(authorization_header: Optional[str]) -> dict:
    if not authorization_header:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = parts[1]
    payload = verify_supabase_token(token)

    return payload
