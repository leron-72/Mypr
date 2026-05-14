from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.database import get_db
from app.models.product_group import ProductGroup
from app.models.user import User
from app.schemas.product_group import (
    ProductGroupCreate,
    ProductGroupUpdate,
    ProductGroupResponse,
    ProductGroupTree,
)
from app.core.auth import get_current_user
from app.core.permissions import require_write_access, require_any_authenticated

router = APIRouter(prefix="/api/groups", tags=["groups"])


def build_tree(groups: list, parent_id=None) -> List[ProductGroupTree]:
    tree = []
    for g in groups:
        if g.parent_id == parent_id and g.deleted_at is None:
            node = ProductGroupTree(
                id=g.id,
                name=g.name,
                code=g.code,
                parent_id=g.parent_id,
                description=g.description,
                children=build_tree(groups, g.id),
            )
            tree.append(node)
    return tree


@router.get("/tree", response_model=List[ProductGroupTree])
async def get_groups_tree(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    result = await db.execute(
        select(ProductGroup).order_by(ProductGroup.name)
    )
    groups = result.scalars().all()
    return build_tree(list(groups), parent_id=None)


@router.get("", response_model=List[ProductGroupResponse])
async def list_groups(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    result = await db.execute(
        select(ProductGroup).where(ProductGroup.deleted_at.is_(None)).order_by(ProductGroup.name)
    )
    groups = result.scalars().all()
    return [ProductGroupResponse.model_validate(g) for g in groups]


@router.get("/{group_id}", response_model=ProductGroupResponse)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    result = await db.execute(
        select(ProductGroup).where(ProductGroup.id == group_id, ProductGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Product group not found")
    return ProductGroupResponse.model_validate(group)


@router.post("", response_model=ProductGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: ProductGroupCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    existing = await db.execute(
        select(ProductGroup).where(ProductGroup.code == group_data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group with code '{group_data.code}' already exists",
        )

    group = ProductGroup(
        name=group_data.name,
        code=group_data.code,
        parent_id=group_data.parent_id,
        description=group_data.description,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return ProductGroupResponse.model_validate(group)


@router.put("/{group_id}", response_model=ProductGroupResponse)
async def update_group(
    group_id: int,
    group_data: ProductGroupUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(ProductGroup).where(ProductGroup.id == group_id, ProductGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Product group not found")

    update_dict = group_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(group, field, value)

    await db.commit()
    await db.refresh(group)
    return ProductGroupResponse.model_validate(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(ProductGroup).where(ProductGroup.id == group_id, ProductGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Product group not found")

    group.deleted_at = datetime.now(timezone.utc)
    await db.commit()
