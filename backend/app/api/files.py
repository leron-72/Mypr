from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.product import Product
from app.models.file_attachment import FileAttachment
from app.models.user import User
from app.schemas.file_attachment import FileAttachmentResponse
from app.core.permissions import require_write_access, require_any_authenticated
from app.services.storage_service import StorageService

router = APIRouter(tags=["files"])


@router.get("/api/products/{product_id}/files", response_model=List[FileAttachmentResponse])
async def list_files(
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
        select(FileAttachment)
        .where(FileAttachment.product_id == product_id)
        .order_by(FileAttachment.created_at.desc())
    )
    files = result.scalars().all()
    return [FileAttachmentResponse.model_validate(f) for f in files]


@router.post(
    "/api/products/{product_id}/files",
    response_model=FileAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access()),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    storage = StorageService()
    file_path, file_size = await storage.upload_file(
        file=file,
        folder=f"products/{product_id}",
    )

    attachment = FileAttachment(
        product_id=product_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return FileAttachmentResponse.model_validate(attachment)


@router.delete("/api/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_write_access()),
):
    result = await db.execute(
        select(FileAttachment).where(FileAttachment.id == file_id)
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="File not found")

    storage = StorageService()
    await storage.delete_file(attachment.file_path)

    await db.delete(attachment)
    await db.commit()
