from __future__ import annotations

import unittest

from core.belgica_service import BelgicaService
from core.paper_models import AccessType, AnalysisStatus, ResearchPaper
from core.pdf_service import PdfExtractionError, PdfService


class BelgicaServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = BelgicaService()

    def test_abstract_only_is_explicit(self) -> None:
        paper = ResearchPaper(id="p1", title="Antarctic study", abstract="A useful abstract.")
        result = self.service.analyze_abstract(paper)
        self.assertEqual(result.analysis_type, "abstract")
        self.assertEqual(result.status, AnalysisStatus.NOT_AVAILABLE)
        self.assertIn("language model", result.answer)

    def test_metadata_without_abstract_does_not_fabricate(self) -> None:
        paper = ResearchPaper(id="p1", title="Antarctic study")
        result = self.service.analyze_abstract(paper)
        self.assertEqual(result.analysis_type, "metadata")
        self.assertEqual(result.status, AnalysisStatus.NOT_AVAILABLE)
        self.assertIn("cannot produce", result.answer)

    def test_captcha_access_is_not_treated_as_open(self) -> None:
        paper = ResearchPaper(
            id="p1",
            title="Antarctic study",
            source_url="https://example.org/captcha-paper",
            abstract="An abstract.",
        )
        availability = self.service.availability(paper)
        self.assertEqual(availability.access_type, AccessType.CAPTCHA_REQUIRED)
        self.assertFalse(availability.full_text_available)

    def test_invalid_pdf_is_rejected(self) -> None:
        with self.assertRaises(PdfExtractionError):
            PdfService().extract_text(b"not a PDF")


if __name__ == "__main__":
    unittest.main()
