"""Authentication and authorization dependencies."""

from fastapi import Header, HTTPException
from typing import Optional


async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Extract user ID from authorization header.

    For now, this is a placeholder. In production, this should:
    1. Validate the JWT token
    2. Extract user ID from the token
    3. Verify the user exists

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        User ID if authenticated, None otherwise
    """
    if not authorization:
        return None

    # TODO: Implement proper JWT validation
    # For now, just extract a basic token
    if authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        # In production, decode and validate the JWT here
        return token

    return None


async def require_auth(user_id: Optional[str] = None) -> str:
    """
    Require authentication for protected endpoints.

    Args:
        user_id: User ID from get_current_user_id dependency

    Returns:
        Validated user ID

    Raises:
        HTTPException: If user is not authenticated
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
