from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_required
from app.database.connection import DatabaseManager

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    """Register a new user account."""
    existing_user = DatabaseManager.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    pwd_hash = hash_password(user_in.password)
    user_data = DatabaseManager.create_user(
        name=user_in.name,
        email=user_in.email,
        password_hash=pwd_hash,
        preferred_language=user_in.preferred_language
    )

    access_token = create_access_token({
        "sub": user_data["id"],
        "email": user_data["email"],
        "name": user_data["name"]
    })

    user_resp = UserResponse(
        id=user_data["id"],
        name=user_data["name"],
        email=user_data["email"],
        preferred_language=user_data.get("preferred_language", "en"),
        created_at=user_data["created_at"]
    )

    return TokenResponse(access_token=access_token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate with email and password."""
    user = DatabaseManager.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"]
    })

    user_resp = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        preferred_language=user.get("preferred_language", "en"),
        created_at=user["created_at"]
    )

    return TokenResponse(access_token=access_token, user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user_payload: dict = Depends(get_current_user_required)):
    """Retrieve currently authenticated user profile."""
    user = DatabaseManager.get_user_by_id(user_payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        preferred_language=user.get("preferred_language", "en"),
        created_at=user["created_at"]
    )

