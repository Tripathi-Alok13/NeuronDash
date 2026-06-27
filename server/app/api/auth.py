from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.db_models import User, Organization
from app.schemas.pydantic_schemas import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Auto-generate a default organization for the user
    new_org = Organization(name=f"{user_in.full_name}'s Workspace")
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    # Create the user
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        org_id=new_org.id,
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # To mitigate user enumeration timing attacks, always run verify_password
    dummy_hash = "00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000:600000"
    if user:
        is_valid = verify_password(credentials.password, user.password_hash)
    else:
        verify_password(credentials.password, dummy_hash)
        is_valid = False

    if not user or not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
