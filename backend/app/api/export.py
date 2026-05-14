import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.product import Product
from app.models.bom_item import BOMItem
from app.models.user import User
from app.core.permissions import require_any_authenticated
from app.services.export_service import export_products_to_csv, export_bom_to_excel

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/products/csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
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


@router.get("/products/{product_id}/bom/excel")
async def export_bom_excel(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    bom_result = await db.execute(
        select(BOMItem).where(
            BOMItem.parent_product_id == product_id,
            BOMItem.deleted_at.is_(None),
        )
    )
    bom_items = bom_result.scalars().all()

    # Get child products
    child_ids = [item.child_product_id for item in bom_items]
    children_map = {}
    if child_ids:
        children_result = await db.execute(
            select(Product).where(Product.id.in_(child_ids))
        )
        children_map = {p.id: p for p in children_result.scalars().all()}

    excel_bytes = await export_bom_to_excel(product, bom_items, children_map)
    filename = f"bom_{product.part_number.replace('.', '_')}.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
