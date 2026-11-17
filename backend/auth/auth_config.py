from datetime import UTC, datetime, timedelta
from typing import Annotated, Optional

import jwt
from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from config import settings
from schema.user import TokenData, User, UserInDB

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("dummypassword")

COOKIE_NAME = "access_token"

# Single admin user loaded directly from .env
fake_users_db = {
    settings.ADMIN_USERNAME: {
        "username": settings.ADMIN_USERNAME,
        "full_name": settings.ADMIN_FULL_NAME,
        "email": settings.ADMIN_EMAIL,
        "hashed_password": settings.ADMIN_HASHED_PASSWORD,
        "disabled": False,
    }
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def get_user(db: dict, username: str) -> Optional[UserInDB]:
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None


def authenticate_user(fake_db: dict, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        verify_password(password, DUMMY_HASH)
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def set_auth_cookie(response: Response, token: str) -> None:
    """Sets the JWT as a secure, HTTP-only cookie."""
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=max_age,
        expires=max_age,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )


def clear_auth_cookie(response: Response) -> None:
    """Clears the HTTP-only auth cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=False,
    )


async def get_current_user(
    request: Request,
    access_token: Annotated[Optional[str], Cookie()] = None,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    # 1. First look in HttpOnly Cookie
    token = access_token

    # 2. Optional fallback to Authorization: Bearer <token> header (e.g. for API clients/docs)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception

    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user
