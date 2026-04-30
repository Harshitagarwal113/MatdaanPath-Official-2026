from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException

from app.core.settings import get_settings
from app.services.google_auth import verify_firebase_token


@dataclass
class RequestIdentity:
    user_id: str
    is_admin: bool
    auth_provider: str
    email: str | None = None


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    prefix = "bearer "
    if authorization.lower().startswith(prefix):
        return authorization[len(prefix) :].strip()  # noqa: E203
    return ""  # pragma: no cover


def get_request_identity(
    authorization: str | None = Header(default=None),
) -> RequestIdentity:
    settings = get_settings()
    token = _extract_bearer_token(authorization)

    if (
        token
        and settings.admin_api_token
        and token == settings.admin_api_token
    ):  # noqa: E501
        return RequestIdentity(
            user_id="admin-token",
            is_admin=True,
            auth_provider="admin_api_token",
        )

    decoded_firebase_token = verify_firebase_token(token)
    if decoded_firebase_token:
        is_admin = bool(
            decoded_firebase_token.get("admin")
        )  # pragma: no cover  # noqa: E501
        return RequestIdentity(  # pragma: no cover
            user_id=str(decoded_firebase_token.get("uid", "firebase-user")),
            is_admin=is_admin,
            auth_provider="firebase",
            email=decoded_firebase_token.get("email"),
        )

    if settings.allow_insecure_admin:
        return RequestIdentity(  # pragma: no cover
            user_id="insecure-admin",
            is_admin=True,
            auth_provider="insecure_admin",
        )

    raise HTTPException(status_code=401, detail="Authentication required.")


def require_admin(
    identity: RequestIdentity = Depends(get_request_identity),
) -> RequestIdentity:
    if not identity.is_admin:
        raise HTTPException(  # pragma: no cover
            status_code=403, detail="Admin privileges required."
        )
    return identity


def get_optional_request_identity(
    authorization: str | None = Header(default=None),
) -> RequestIdentity:
    try:
        return get_request_identity(authorization=authorization)
    except HTTPException:
        return RequestIdentity(
            user_id="anonymous",
            is_admin=False,
            auth_provider="anonymous",
        )
