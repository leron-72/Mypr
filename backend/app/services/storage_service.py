import io
import uuid
from typing import Tuple

from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error

from app.config import settings


class StorageService:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error:
            pass  # Bucket may already exist or permissions may vary

    async def upload_file(
        self, file: UploadFile, folder: str = "uploads"
    ) -> Tuple[str, int]:
        """Upload a file to MinIO and return (file_path, file_size)."""
        content = await file.read()
        file_size = len(content)

        ext = ""
        if file.filename and "." in file.filename:
            ext = "." + file.filename.rsplit(".", 1)[-1]

        unique_name = f"{uuid.uuid4().hex}{ext}"
        object_name = f"{folder}/{unique_name}"

        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=io.BytesIO(content),
            length=file_size,
            content_type=file.content_type or "application/octet-stream",
        )

        return object_name, file_size

    async def delete_file(self, file_path: str) -> None:
        """Delete a file from MinIO."""
        try:
            self.client.remove_object(self.bucket, file_path)
        except S3Error:
            pass  # Ignore if file doesn't exist

    def get_presigned_url(self, file_path: str, expires_seconds: int = 3600) -> str:
        """Generate a presigned URL for temporary file access."""
        from datetime import timedelta
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket,
                object_name=file_path,
                expires=timedelta(seconds=expires_seconds),
            )
            return url
        except S3Error:
            return ""
