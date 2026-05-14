from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from app.core.auth import get_current_user


def require_roles(*roles: UserRole):
    """Dependency that requires the current user to have one of the specified roles."""
    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    return _check_role


def require_admin():
    return require_roles(UserRole.admin)


def require_engineer_or_admin():
    return require_roles(UserRole.admin, UserRole.engineer)


def require_write_access():
    """engineer and admin can write."""
    return require_roles(UserRole.admin, UserRole.engineer)


def require_any_authenticated():
    """Any authenticated user (all roles)."""
    return require_roles(
        UserRole.admin,
        UserRole.engineer,
        UserRole.production,
        UserRole.accounting,
        UserRole.viewer,
    )
