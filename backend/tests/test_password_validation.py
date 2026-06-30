import unittest

from pydantic import ValidationError

from app.api.schemas.auth import RegistrationRequest


class RegistrationRequestPasswordValidationTests(unittest.TestCase):
    def test_accepts_strong_password(self):
        request = RegistrationRequest(
            email="user@example.com",
            password="StrongPass1!",
            username="user",
            role="user",
        )
        self.assertEqual(request.password, "StrongPass1!")

    def test_rejects_short_password(self):
        with self.assertRaises(ValidationError) as context:
            RegistrationRequest(
                email="user@example.com",
                password="Short1!",
                username="user",
                role="user",
            )
        self.assertIn("at least 8 characters", str(context.exception))

    def test_rejects_password_without_letter(self):
        with self.assertRaises(ValidationError) as context:
            RegistrationRequest(
                email="user@example.com",
                password="12345678!",
                username="user",
                role="user",
            )
        self.assertIn("at least one letter", str(context.exception))

    def test_rejects_password_without_digit(self):
        with self.assertRaises(ValidationError) as context:
            RegistrationRequest(
                email="user@example.com",
                password="StrongPass!",
                username="user",
                role="user",
            )
        self.assertIn("at least one digit", str(context.exception))

    def test_rejects_password_without_special_character(self):
        with self.assertRaises(ValidationError) as context:
            RegistrationRequest(
                email="user@example.com",
                password="StrongPass1",
                username="user",
                role="user",
            )
        self.assertIn("at least one special character", str(context.exception))

    def test_rejects_common_weak_password(self):
        with self.assertRaises(ValidationError) as context:
            RegistrationRequest(
                email="user@example.com",
                password="Password123!",
                username="user",
                role="user",
            )
        self.assertIn("too common", str(context.exception))


if __name__ == "__main__":
    unittest.main()
