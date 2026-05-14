from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.product import ProductResponse
from app.core.permissions import require_any_authenticated
from app.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=List[ProductResponse])
async def search_products(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated()),
):
    service = SearchService(db)
    results = await service.full_text_search(q, limit=limit)
    return [ProductResponse.model_validate(p) for p in results]
