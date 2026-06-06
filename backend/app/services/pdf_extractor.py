from io import BytesIO

from pypdf import PdfReader


class PdfExtractionError(Exception):
    pass


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes, page by page."""
    if not file_bytes.startswith(b"%PDF"):
        raise PdfExtractionError("File is not a valid PDF")

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception as exc:
        raise PdfExtractionError("Unable to read PDF file") from exc

    pages: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            pages.append(page_text.strip())

    if not pages:
        raise PdfExtractionError("No text could be extracted from the PDF")

    return "\n\n".join(pages)
