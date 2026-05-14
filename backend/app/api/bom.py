from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.bom_item import BOMItem
from app.models.product import Product
from app.models.user import User
from app.schemas.bom_item import BOMItemCreate, BOMItemUpdate, BOMItemResponse, BOMTreeNode
from app.core.permissions import require_write_access, require_any_authenticated

router = APIRouter(tags=["bom"])


def build_bom_tree(
    items: list[BOMItem],
    products_map: dict,
    parent_product_id: int,
    visited: set | None = None,
) -> List[BOMTreeNode]:
    if visited is None:
        visited = set()

    if parent_product_id in visited:
        return []  # Prevent circular references
    visited = visited | {parent_product_id}

    nodes = []
    for item in items:
        if item.parent_product_id == parent_product_id and item.deleted_at is None:
            child = products_map.get(item.child_product_id)
            if not child:
                continue
            node = BOMTreeNode(
                id=item.id,
                parent_product_id=item.parent_product_id,
                child_product_id=item.child_product_id,
                child_part_number=child.part_number,
                child_name=child.name,
                quantity=item.quantity,
                unit=item.unit,
                is_optional=item.is_optional,
                notes=item.notes,
                children=build_bom_tree(items, products_map, item.child_product_id, visited),
            )
            nodes.append(node)
    return nodes


@router.get("/api/products/{product_id}/bom", response_model=List[BOMTreeNode])
async def get_bom(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    # Get all bom items (for recursive tree building)
    bom_result = await db.execute(
        select(BOMItem).where(BOMItem.deleted_at.is_(None))
    )
    all_items = bom_result.scalars().all()

    # Get all products referenced
    product_ids = {item.child_product_id for item in all_items} | {item.parent_product_id for item in all_items}
    products_result = await db.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products_map = {p.id: p for p in products_result.scalars().all()}

    return build_bom_tree(list(all_items), products_map, product_id)


@router.post(
    "/api/products/{product_id}/bom/items",
    response_model=BOMItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_bom_item(
    product_id: int,
    item_data: BOMItemCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    # Validate parent product
    parent_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    if not parent_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Parent product not found")

    # Validate child product
    child_result = await db.execute(
        select(Product).where(Product.id == item_data.child_product_id, Product.deleted_at.is_(None))
    )
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Child product not found")

    if item_data.child_product_id == product_id:
        raise HTTPException(status_code=400, detail="A product cannot reference itself in BOM")

    bom_item = BOMItem(
        parent_product_id=product_id,
        child_product_id=item_data.child_product_id,
        quantity=item_data.quantity,
        unit=item_data.unit,
        is_optional=item_data.is_optional,
        notes=item_data.notes,
        version_id=item_data.version_id,
    )
    db.add(bom_item)
    await db.commit()
    await db.refresh(bom_item)
    return BOMItemResponse.model_validate(bom_item)


@router.put("/api/bom/{item_id}", response_model=BOMItemResponse)
async def update_bom_item(
    item_id: int,
    item_data: BOMItemUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(BOMItem).where(BOMItem.id == item_id, BOMItem.deleted_at.is_(None))
    )
    bom_item = result.scalar_one_or_none()
    if not bom_item:
        raise HTTPException(status_code=404, detail="BOM item not found")

    update_dict = item_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(bom_item, field, value)

    await db.commit()
    await db.refresh(bom_item)
    return BOMItemResponse.model_validate(bom_item)


@router.delete("/api/bom/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bom_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(BOMItem).where(BOMItem.id == item_id, BOMItem.deleted_at.is_(None))
    )
    bom_item = result.scalar_one_or_none()
    if not bom_item:
        raise HTTPException(status_code=404, detail="BOM item not found")

    bom_item.deleted_at = datetime.now(timezone.utc)
    await db.commit()
