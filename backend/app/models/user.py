import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    engineer = "engineer"
    production = "production"
    accounting = "accounting"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.viewer)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    products_created = relationship("Product", back_populates="creator", foreign_keys="Product.created_by")
    versions_created = relationship("ProductVersion", back_populates="creator", foreign_keys="ProductVersion.created_by")
    versions_approved = relationship("ProductVersion", back_populates="approver", foreign_keys="ProductVersion.approved_by")
    files_uploaded = relationship("FileAttachment", back_populates="uploader")
    change_logs = relationship("ChangeLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
