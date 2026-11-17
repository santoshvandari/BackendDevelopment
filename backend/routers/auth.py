from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from config import settings
from auth import (
    authenticate_user,
    clear_auth_cookie,
    create_access_token,
    fake_users_db,
    get_current_active_user,
    set_auth_cookie,
)
from schema.user import MessageResponse, User

router = APIRouter(prefix="/auth", tags=["Admin Auth"])


@router.post("/token", response_model=MessageResponse)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
) -> MessageResponse:
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    # Set secure HttpOnly cookie on response
    set_auth_cookie(response, access_token)
    return MessageResponse(message="Login successful")


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    clear_auth_cookie(response)
    return MessageResponse(message="Logout successful")


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    return current_user
