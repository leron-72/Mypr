import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ProductStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    obsolete = "obsolete"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    part_number = Column(String(12), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    group_id = Column(Integer, ForeignKey("product_groups.id"), nullable=True)
    unit = Column(String(50), nullable=True)
    weight = Column(Numeric(12, 4), nullable=True)
    material = Column(String(255), nullable=True)
    status = Column(Enum(ProductStatus), nullable=False, default=ProductStatus.draft)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    group = relationship("ProductGroup", back_populates="products")
    creator = relationship("User", back_populates="products_created", foreign_keys=[created_by])
    versions = relationship("ProductVersion", back_populates="product")
    bom_as_parent = relationship(
        "BOMItem",
        back_populates="parent_product",
        foreign_keys="BOMItem.parent_product_id",
    )
    bom_as_child = relationship(
        "BOMItem",
        back_populates="child_product",
        foreign_keys="BOMItem.child_product_id",
    )
    files = relationship("FileAttachment", back_populates="product")
    change_logs = relationship("ChangeLog", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product id={self.id} part_number={self.part_number} name={self.name}>"
