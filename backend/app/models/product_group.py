from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ProductGroup(Base):
    __tablename__ = "product_groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("product_groups.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Self-referential relationship for tree hierarchy
    children = relationship(
        "ProductGroup",
        backref="parent",
        foreign_keys=[parent_id],
        lazy="selectin",
    )
    products = relationship("Product", back_populates="group")

    def __repr__(self) -> str:
        return f"<ProductGroup id={self.id} code={self.code} name={self.name}>"
