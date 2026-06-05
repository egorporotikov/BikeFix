from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, constr, field_validator
from bcrypt import hashpw, gensalt, checkpw
from app.utils.supabase_client import insert_row, fetch_rows
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: constr(min_length=3, max_length=50)  # type: ignore
    email: EmailStr
    password: constr(min_length=6, max_length=128)  # type: ignore


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    username: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user.
    """
    if len(request.username) < 3 or len(request.username) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 50 characters"
        )
    
    if len(request.password) < 6 or len(request.password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be between 6 and 128 characters"
        )
    
    existing_users = fetch_rows("users", {"email": request.email})
    if existing_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hashpw(request.password.encode(), gensalt()).decode()
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": request.email,
        "username": request.username,
        "hashed_password": hashed_password,
        "first_name": None,
        "last_name": None,
        "phone": None,
        "is_active": True,
    }

    insert_row("users", user_data)

    return UserResponse(
        user_id=user_id,
        email=request.email,
        username=request.username
    )


@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    """
    Login user with email and password.
    """
    users = fetch_rows("users", {"email": request.email})
    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user = users[0]
    if not checkpw(request.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return UserResponse(
        user_id=user["id"],
        email=user["email"],
        username=user["username"]
    )


