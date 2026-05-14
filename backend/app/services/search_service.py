from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, or_

from app.models.product import Product


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def full_text_search(self, query: str, limit: int = 20) -> List[Product]:
        """
        Full-text search using PostgreSQL tsvector with Russian language support.
        Falls back to ILIKE if tsvector search fails.
        """
        try:
            # Try tsvector search first
            result = await self.db.execute(
                select(Product)
                .where(
                    Product.deleted_at.is_(None),
                    text("search_vector @@ plainto_tsquery('russian', :q)").bindparams(q=query),
                )
                .limit(limit)
            )
            products = result.scalars().all()
            if products:
                return list(products)
        except Exception:
            pass

        # Fallback: ILIKE search on name, part_number, description
        result = await self.db.execute(
            select(Product)
            .where(
                Product.deleted_at.is_(None),
                or_(
                    Product.name.ilike(f"%{query}%"),
                    Product.part_number.ilike(f"%{query}%"),
                    Product.description.ilike(f"%{query}%"),
                ),
            )
            .limit(limit)
        )
        return list(result.scalars().all())
