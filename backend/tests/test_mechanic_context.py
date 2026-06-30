from app.api.services.mechanic_context import get_mechanic_context


def test_get_mechanic_context_prefers_mechanics_table(monkeypatch):
    profile_row = {"id": "profile-1", "username": "bikeguy", "email": "bike@example.com"}
    mechanic_row = {"profile_id": "profile-1", "name": "Alex", "profile_image_url": "https://img", "is_verified": True}

    def fake_fetch_rows(table, filters=None):
        if table == "profiles":
            return [profile_row]
        if table == "mechanics":
            return [mechanic_row]
        return []

    monkeypatch.setattr("app.api.services.mechanic_context.fetch_rows", fake_fetch_rows)

    context = get_mechanic_context("profile-1")

    assert context["name"] == "Alex"
    assert context["profile_image_url"] == "https://img"
    assert context["is_verified"] is True


def test_get_mechanic_context_falls_back_to_profile(monkeypatch):
    profile_row = {"id": "profile-2", "username": "bikeguy", "email": "bike@example.com", "profile_image_url": "https://profile-img", "is_verified": True}

    def fake_fetch_rows(table, filters=None):
        if table == "profiles":
            return [profile_row]
        if table == "mechanics":
            return []
        return []

    monkeypatch.setattr("app.api.services.mechanic_context.fetch_rows", fake_fetch_rows)

    context = get_mechanic_context("profile-2")

    assert context["name"] == "bikeguy"
    assert context["profile_image_url"] == "https://profile-img"
    assert context["is_verified"] is True
