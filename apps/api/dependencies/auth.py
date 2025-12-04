"""Authentication and authorization dependencies."""

from fastapi import Header, HTTPException, Depends
from typing import Optional
from gotrue import SyncGoTrueClient
from gotrue.errors import AuthApiError
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize GoTrue client for Supabase auth
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.")

auth_client = SyncGoTrueClient(
    url=supabase_url,
    headers={"apikey": supabase_key}
)

async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
) -> str:
    """
    Validate the user.
    Prioritizes X-User-Id header for internal proxy requests.
    Falls back to Authorization header for direct API calls.
    """
    # 1. Trust internal proxy if X-User-Id is present
    # In a real production env, you should also verify a shared secret here
    if x_user_id:
        return x_user_id

    # 2. Fallback to Supabase Auth (GoTrue)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")

    token = authorization.split(" ")[1]

    try:
        # Validate the token and get user info
        user_response = auth_client.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token or user not found")

        return str(user.id)

    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {e.message}")
    except Exception as e:
        print(f"An unexpected error occurred during authentication: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during authentication")

async def require_auth(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Dependency to ensure a user is authenticated.

    This function simply depends on `get_current_user_id`, which handles all
    the validation and exception raising. If `get_current_user_id` succeeds,
    it returns the user_id. If not, it raises an HTTPException.
    """
    return user_id
