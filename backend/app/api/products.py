from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.product import Product, ProductStatus
from app.models.user import User
from app.models.change_log import ChangeLog
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.schemas.change_log import ChangeLogResponse
from app.core.auth import get_current_user
from app.core.permissions import require_write_access, require_any_authenticated

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    group_id: Optional[int] = Query(None),
    status: Optional[ProductStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    query = select(Product).where(Product.deleted_at.is_(None))

    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.part_number.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )
    if group_id is not None:
        query = query.where(Product.group_id == group_id)
    if status is not None:
        query = query.where(Product.status == status)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    query = query.offset((page - 1) * size).limit(size).order_by(Product.part_number)
    result = await db.execute(query)
    products = result.scalars().all()

    pages = (total + size - 1) // size if total > 0 else 1

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/export/csv")
async def export_products_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated()),
):
    from app.services.export_service import export_products_to_csv
    from fastapi.responses import StreamingResponse
    import io

    result = await db.execute(
        select(Product).where(Product.deleted_at.is_(None)).order_by(Product.part_number)
    )
    products = result.scalars().all()

    csv_content = await export_products_to_csv(products)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.get("/{product_id}/history", response_model=list[ChangeLogResponse])
async def get_product_history(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    logs_result = await db.execute(
        select(ChangeLog)
        .where(ChangeLog.product_id == product_id)
        .order_by(ChangeLog.created_at.desc())
    )
    logs = logs_result.scalars().all()
    return [ChangeLogResponse.model_validate(log) for log in logs]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access()),
):
    # Check part_number uniqueness
    existing = await db.execute(
        select(Product).where(Product.part_number == product_data.part_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with part number {product_data.part_number} already exists",
        )

    product = Product(
        part_number=product_data.part_number,
        name=product_data.name,
        description=product_data.description,
        group_id=product_data.group_id,
        unit=product_data.unit,
        weight=product_data.weight,
        material=product_data.material,
        status=product_data.status,
        created_by=current_user.id,
    )
    db.add(product)
    await db.flush()

    log = ChangeLog(
        product_id=product.id,
        user_id=current_user.id,
        action="create",
        field_name=None,
        old_value=None,
        new_value=product_data.part_number,
    )
    db.add(log)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = product_data.model_dump(exclude_unset=True)
    for field, new_value in update_dict.items():
        old_value = getattr(product, field)
        if str(old_value) != str(new_value):
            log = ChangeLog(
                product_id=product.id,
                user_id=current_user.id,
                action="update",
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
            )
            db.add(log)
        setattr(product, field, new_value)

    product.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.deleted_at = datetime.now(timezone.utc)
    log = ChangeLog(
        product_id=product.id,
        user_id=current_user.id,
        action="delete",
        field_name=None,
        old_value=product.part_number,
        new_value=None,
    )
    db.add(log)
    await db.commit()
