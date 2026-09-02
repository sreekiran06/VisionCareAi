from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from ...db.session import get_db
from ...core.security import verify_password, create_access_token
from ...core.config import settings
from ...models.user import User
from ...schemas.schemas import UserLogin, Token, UserMe
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserMe)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
