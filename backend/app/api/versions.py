from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.product import Product
from app.models.product_version import ProductVersion
from app.models.user import User
from app.schemas.product_version import ProductVersionCreate, ProductVersionResponse
from app.core.permissions import require_write_access, require_any_authenticated

router = APIRouter(tags=["versions"])


@router.get("/api/products/{product_id}/versions", response_model=List[ProductVersionResponse])
async def get_versions(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
        select(ProductVersion)
        .where(ProductVersion.product_id == product_id)
        .order_by(ProductVersion.created_at.desc())
    )
    versions = result.scalars().all()
    return [ProductVersionResponse.model_validate(v) for v in versions]


@router.post(
    "/api/products/{product_id}/versions",
    response_model=ProductVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_version(
    product_id: int,
    version_data: ProductVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access()),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    version = ProductVersion(
        product_id=product_id,
        version_type=version_data.version_type,
        version_number=version_data.version_number,
        revision_letter=version_data.revision_letter,
        changes_description=version_data.changes_description,
        created_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return ProductVersionResponse.model_validate(version)
