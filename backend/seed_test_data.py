"""Seed test data: UAV BOM tree."""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.product_group import ProductGroup
from app.models.product import Product, ProductStatus
from app.models.bom_item import BOMItem


PRODUCTS = [
    # (part_number, name, unit, status)
    ("001.01.0001", "БпЛА",                              "шт",  ProductStatus.active),
    ("002.01.0001", "Елемент крила",                     "шт",  ProductStatus.active),
    ("003.01.0001", "PLA пластик",                       "гр",  ProductStatus.active),
    ("004.01.0001", "Закладна втулка",                   "шт",  ProductStatus.active),
    ("005.01.0001", "Камера денна",                      "шт",  ProductStatus.active),
    ("006.01.0001", "Мотор",                             "шт",  ProductStatus.active),
    ("007.01.0001", "Алюмінієвий радіатор",              "шт",  ProductStatus.active),
    ("007.01.0002", "Алюмінієва заготовка радіатор",     "шт",  ProductStatus.active),
    ("008.01.0001", "Листовий алюміній 7075 10 мм лист", "м2",  ProductStatus.active),
]

# (parent_part, child_part, qty, unit, notes)
BOM = [
    ("001.01.0001", "002.01.0001", 4,   "шт", None),            # БпЛА → Елемент крила
    ("001.01.0001", "005.01.0001", 1,   "шт", None),            # БпЛА → Камера денна
    ("001.01.0001", "006.01.0001", 4,   "шт", None),            # БпЛА → Мотор
    ("001.01.0001", "007.01.0001", 4,   "шт", None),            # БпЛА → Алюм. радіатор
    ("002.01.0001", "003.01.0001", 200, "гр", None),            # Елемент крила → PLA пластик
    ("002.01.0001", "004.01.0001", 4,   "шт", None),            # Елемент крила → Закладна втулка
    ("007.01.0001", "007.01.0002", 1,   "шт", None),            # Радіатор → Заготовка
    ("007.01.0002", "008.01.0001", 1,   "м2", None),            # Заготовка → Лист алюмінію
]


async def main():
    async with AsyncSessionLocal() as db:
        # Get admin user
        result = await db.execute(select(User).where(User.email == "admin@system.local"))
        admin = result.scalar_one_or_none()
        if not admin:
            print("ERROR: admin user not found")
            return

        # Create product group
        result = await db.execute(select(ProductGroup).where(ProductGroup.code == "БПЛА"))
        group = result.scalar_one_or_none()
        if not group:
            group = ProductGroup(name="БпЛА та комплектуючі", code="БПЛА")
            db.add(group)
            await db.flush()
            print(f"  Created group: {group.name}")

        # Create products
        part_to_product: dict[str, Product] = {}
        for part_number, name, unit, status in PRODUCTS:
            result = await db.execute(select(Product).where(Product.part_number == part_number))
            product = result.scalar_one_or_none()
            if not product:
                product = Product(
                    part_number=part_number,
                    name=name,
                    unit=unit,
                    status=status,
                    group_id=group.id,
                    created_by=admin.id,
                )
                db.add(product)
                await db.flush()
                print(f"  Created product: {part_number} — {name}")
            else:
                print(f"  Exists: {part_number} — {name}")
            part_to_product[part_number] = product

        # Create BOM links
        for parent_part, child_part, qty, unit, notes in BOM:
            parent = part_to_product[parent_part]
            child = part_to_product[child_part]
            result = await db.execute(
                select(BOMItem).where(
                    BOMItem.parent_product_id == parent.id,
                    BOMItem.child_product_id == child.id,
                    BOMItem.deleted_at.is_(None),
                )
            )
            existing = result.scalar_one_or_none()
            if not existing:
                bom = BOMItem(
                    parent_product_id=parent.id,
                    child_product_id=child.id,
                    quantity=qty,
                    unit=unit,
                    notes=notes,
                )
                db.add(bom)
                print(f"  BOM: {parent_part} → {child_part} ({qty} {unit})")

        await db.commit()
        print("\nDone! Test data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(main())
