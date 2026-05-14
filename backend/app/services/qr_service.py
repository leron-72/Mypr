import io
import qrcode
from qrcode.image.pure import PyPNGImage


def generate_qr_code(data: str, box_size: int = 10, border: int = 4) -> bytes:
    """Generate a QR code PNG image and return as bytes."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    output = io.BytesIO()
    img.save(output)
    return output.getvalue()


def generate_product_qr(part_number: str, product_url: str = "") -> bytes:
    """Generate QR code for a product's part number and URL."""
    qr_data = f"Part: {part_number}"
    if product_url:
        qr_data += f"\nURL: {product_url}"
    return generate_qr_code(qr_data)
