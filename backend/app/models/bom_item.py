from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BOMItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    child_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(50), nullable=True)
    is_optional = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    version_id = Column(Integer, ForeignKey("product_versions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    parent_product = relationship(
        "Product",
        back_populates="bom_as_parent",
        foreign_keys=[parent_product_id],
    )
    child_product = relationship(
        "Product",
        back_populates="bom_as_child",
        foreign_keys=[child_product_id],
    )
    version = relationship("ProductVersion", back_populates="bom_items")

    def __repr__(self) -> str:
        return f"<BOMItem id={self.id} parent={self.parent_product_id} child={self.child_product_id}>"
