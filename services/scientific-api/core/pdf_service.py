from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader


class PdfExtractionError(ValueError):
    pass


class PdfService:
    def __init__(self, max_bytes: int = 25 * 1024 * 1024) -> None:
        self.max_bytes = max_bytes

    def extract_text(self, content: bytes) -> str:
        if not content:
            raise PdfExtractionError("The uploaded PDF is empty.")
        if len(content) > self.max_bytes:
            raise PdfExtractionError("The PDF exceeds the 25 MB limit.")

        try:
            reader = PdfReader(BytesIO(content), strict=False)
            pages: list[str] = []
            for page in reader.pages:
                text = page.extract_text() or ""
                if text.strip():
                    pages.append(text.strip())
        except Exception as error:
            raise PdfExtractionError("The file is not a readable PDF.") from error

        extracted = "\n\n".join(pages).strip()
        if len(extracted) < 100:
            raise PdfExtractionError("Text extraction was not sufficient for analysis.")
        return extracted
