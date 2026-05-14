"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension (optional, for future similarity search)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Enums
    op.execute(
        "CREATE TYPE userrole AS ENUM ('admin', 'engineer', 'production', 'accounting', 'viewer')"
    )
    op.execute(
        "CREATE TYPE productstatus AS ENUM ('draft', 'active', 'obsolete')"
    )
    op.execute(
        "CREATE TYPE versiontype AS ENUM ('minor', 'major')"
    )

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM(
                "admin", "engineer", "production", "accounting", "viewer",
                name="userrole", create_type=False
            ),
            nullable=False,
            server_default="viewer",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # product_groups
    op.create_table(
        "product_groups",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("product_groups.id"), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # products
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("part_number", sa.String(12), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("product_groups.id"), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("weight", sa.Numeric(12, 4), nullable=True),
        sa.Column("material", sa.String(255), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "draft", "active", "obsolete",
                name="productstatus", create_type=False
            ),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Full-text search index on products
    op.execute(
        "ALTER TABLE products ADD COLUMN search_vector tsvector "
        "GENERATED ALWAYS AS (to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED"
    )
    op.execute(
        "CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector)"
    )
    op.execute(
        "CREATE INDEX idx_products_part_number ON products (part_number)"
    )

    # product_versions
    op.create_table(
        "product_versions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column(
            "version_type",
            postgresql.ENUM("minor", "major", name="versiontype", create_type=False),
            nullable=False,
        ),
        sa.Column("version_number", sa.String(20), nullable=False),
        sa.Column("revision_letter", sa.String(5), nullable=True),
        sa.Column("changes_description", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # bom_items
    op.create_table(
        "bom_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("parent_product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("child_product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("is_optional", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("version_id", sa.Integer(), sa.ForeignKey("product_versions.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # file_attachments
    op.create_table(
        "file_attachments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(1024), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("mime_type", sa.String(128), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # change_logs
    op.create_table(
        "change_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("field_name", sa.String(100), nullable=True),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("change_logs")
    op.drop_table("file_attachments")
    op.drop_table("bom_items")
    op.drop_table("product_versions")
    op.drop_table("products")
    op.drop_table("product_groups")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS versiontype")
    op.execute("DROP TYPE IF EXISTS productstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
