import os

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from core.security import verify_token


def credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_verify_token_accepts_internal_service_token(monkeypatch):
    monkeypatch.setenv("INTERNAL_SERVICE_TOKEN", "service-secret")
    monkeypatch.delenv("JWT_SECRET", raising=False)

    user = verify_token(credentials("service-secret"))

    assert user == {"username": "internal-service", "role": "admin"}


def test_verify_token_rejects_demo_prefix_without_config(monkeypatch):
    monkeypatch.delenv("INTERNAL_SERVICE_TOKEN", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)

    with pytest.raises(HTTPException) as exc:
        verify_token(credentials("valid-token-anything"))

    assert exc.value.status_code == 401
