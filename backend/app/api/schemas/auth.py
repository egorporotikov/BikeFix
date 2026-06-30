import re
from typing import Any

from pydantic import BaseModel

try:
    from pydantic import field_validator
except ImportError:  # pragma: no cover - compatibility with Pydantic v1
    from pydantic import validator as field_validator


class RegistrationRequest(BaseModel):
    email: str
    password: str
    username: str
    role: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Password must be a string")

        normalized = value.strip()
        if len(normalized) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Za-z]", normalized):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"\d", normalized):
            raise ValueError("Password must contain at least one digit")

        if not re.search(r"[^A-Za-z0-9]", normalized):
            raise ValueError("Password must contain at least one special character")

        weak_passwords = {
            "password",
            "password123",
            "password123!",
            "password1",
            "qwerty",
            "qwerty123",
            "welcome",
            "welcome123",
            "letmein",
            "letmein123",
            "admin",
            "admin123",
            "12345678",
            "12345678!",
            "abcd1234",
            "changeme",
            "iloveyou",
            "football",
            "baseball",
            "sunshine",
            "monkey",
            "dragon",
            "passw0rd",
            "passw0rd!",
        }
        if normalized.lower() in weak_passwords:
            raise ValueError("Password is too common and weak")

        return value
