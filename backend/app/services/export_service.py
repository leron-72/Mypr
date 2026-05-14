import csv
import io
from typing import List

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from app.models.product import Product
from app.models.bom_item import BOMItem


async def export_products_to_csv(products: List[Product]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "ID",
        "Part Number",
        "Name",
        "Description",
        "Group ID",
        "Unit",
        "Weight",
        "Material",
        "Status",
        "Created At",
        "Updated At",
    ])

    for p in products:
        writer.writerow([
            p.id,
            p.part_number,
            p.name,
            p.description or "",
            p.group_id or "",
            p.unit or "",
            str(p.weight) if p.weight is not None else "",
            p.material or "",
            p.status.value if p.status else "",
            p.created_at.isoformat() if p.created_at else "",
            p.updated_at.isoformat() if p.updated_at else "",
        ])

    return output.getvalue()


async def export_bom_to_excel(
    product: Product,
    bom_items: List[BOMItem],
    children_map: dict,
) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "BOM"

    # Title
    ws.merge_cells("A1:H1")
    title_cell = ws["A1"]
    title_cell.value = f"Bill of Materials: {product.part_number} - {product.name}"
    title_cell.font = Font(bold=True, size=14)
    title_cell.alignment = Alignment(horizontal="center")

    # Headers
    headers = [
        "Item #",
        "Part Number",
        "Name",
        "Description",
        "Quantity",
        "Unit",
        "Optional",
        "Notes",
    ]
    header_row = 3
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    # Data rows
    for row_idx, item in enumerate(bom_items, 1):
        child = children_map.get(item.child_product_id)
        ws.cell(row=header_row + row_idx, column=1, value=row_idx)
        ws.cell(row=header_row + row_idx, column=2, value=child.part_number if child else str(item.child_product_id))
        ws.cell(row=header_row + row_idx, column=3, value=child.name if child else "Unknown")
        ws.cell(row=header_row + row_idx, column=4, value=child.description if child else "")
        ws.cell(row=header_row + row_idx, column=5, value=float(item.quantity))
        ws.cell(row=header_row + row_idx, column=6, value=item.unit or "")
        ws.cell(row=header_row + row_idx, column=7, value="Yes" if item.is_optional else "No")
        ws.cell(row=header_row + row_idx, column=8, value=item.notes or "")

        # Alternate row shading
        if row_idx % 2 == 0:
            alt_fill = PatternFill(start_color="D6E4F0", end_color="D6E4F0", fill_type="solid")
            for col in range(1, 9):
                ws.cell(row=header_row + row_idx, column=col).fill = alt_fill

    # Auto-fit columns
    column_widths = [8, 15, 30, 40, 12, 10, 10, 30]
    for col_idx, width in enumerate(column_widths, 1):
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()
