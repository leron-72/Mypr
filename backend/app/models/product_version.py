import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class VersionType(str, enum.Enum):
    minor = "minor"
    major = "major"


class ProductVersion(Base):
    __tablename__ = "product_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    version_type = Column(Enum(VersionType), nullable=False)
    version_number = Column(String(20), nullable=False)
    revision_letter = Column(String(5), nullable=True)
    changes_description = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="versions")
    creator = relationship("User", back_populates="versions_created", foreign_keys=[created_by])
    approver = relationship("User", back_populates="versions_approved", foreign_keys=[approved_by])
    bom_items = relationship("BOMItem", back_populates="version")

    def __repr__(self) -> str:
        return f"<ProductVersion id={self.id} product_id={self.product_id} version={self.version_number}>"
