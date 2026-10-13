import pytest
from fastapi.testclient import TestClient
from app.core.config import Settings
from app.models.user import User


def test_security_headers_present_on_responses(client: TestClient):
    """Verify standard OWASP security headers are present on all API responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert "1; mode=block" in resp.headers.get("x-xss-protection", "")
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in resp.headers.get("permissions-policy", "")


def test_secret_key_validator_rejects_insecure_defaults_in_production():
    """Verify Settings raises ValueError in production if an insecure SECRET_KEY is used."""
    # 1. Insecure default in production
    with pytest.raises(ValueError, match="Production Security Error"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="dev-secret-key-change-in-production-policygpt",
            DATABASE_URL="sqlite:///./test.db",
        )

    # 2. Too short key in production (< 32 chars)
    with pytest.raises(ValueError, match="Production Security Error"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="short_key_123",
            DATABASE_URL="sqlite:///./test.db",
        )

    # 3. Sufficiently long random secret key passes in production
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 64,
        DATABASE_URL="sqlite:///./test.db",
    )
    assert prod_settings.ENVIRONMENT == "production"


def test_user_phone_number_update_validation(client: TestClient, citizen_user: User, auth_headers):
    """Verify PUT /api/v1/users/me validates and normalizes phone numbers or returns 422 for invalid."""
    hdrs = auth_headers(citizen_user)

    # 1. Valid Indian 10-digit number is normalized to E.164
    resp = client.put(
        "/api/v1/users/me",
        headers=hdrs,
        json={"phone_number": "9876543210"},
    )
    assert resp.status_code == 200
    assert resp.json()["phone_number"] == "+919876543210"

    # 2. Invalid non-phone string is rejected with 422
    resp_invalid = client.put(
        "/api/v1/users/me",
        headers=hdrs,
        json={"phone_number": "invalid-letters-123"},
    )
    assert resp_invalid.status_code == 422
    assert "Invalid phone number" in resp_invalid.json()["detail"]


def test_request_size_limit_rejection(client: TestClient, citizen_user: User, auth_headers):
    """Verify request headers exceeding payload limits are rejected with 413."""
    hdrs = auth_headers(citizen_user)
    # Simulate a request header advertising a payload larger than 10MB
    hdrs["content-length"] = str(15 * 1024 * 1024)

    resp = client.post(
        "/api/v1/auth/login",
        headers=hdrs,
        json={"email": "test@example.com", "password": "password"},
    )
    assert resp.status_code == 413
    assert "Payload too large" in resp.json()["detail"]
