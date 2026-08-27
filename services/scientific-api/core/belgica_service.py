from __future__ import annotations

from typing import Any

import httpx

from core.paper_analyzer import PaperAnalyzer
from core.paper_models import (
    AccessType,
    AnalysisStatus,
    PaperAnalysisResponse,
    PaperAvailability,
    ResearchPaper,
)
from core.pdf_service import PdfService


class BelgicaService:
    def __init__(self, llm: Any | None = None) -> None:
        self.pdf_service = PdfService()
        self.analyzer = PaperAnalyzer(llm)

    def availability(self, paper: ResearchPaper) -> PaperAvailability:
        source = (paper.source_url or "").lower()
        if "captcha" in source or "cloudflare" in source:
            access_type = AccessType.CAPTCHA_REQUIRED
            message = "The source requires human verification. Open it normally or upload a legally obtained PDF."
        elif paper.pdf_url and paper.full_text_available:
            access_type = AccessType.OPEN_ACCESS
            message = "A full-text source is available through the listed source."
        elif paper.abstract:
            access_type = AccessType.ABSTRACT_ONLY
            message = "Full text is not currently accessible. Belgica can provide an abstract-level analysis."
        else:
            access_type = AccessType.UNKNOWN
            message = "Only limited bibliographic information is available."

        return PaperAvailability(
            paper_id=paper.id,
            access_type=access_type,
            full_text_available=access_type == AccessType.OPEN_ACCESS,
            abstract_available=bool(paper.abstract),
            source_url=paper.source_url,
            pdf_url=paper.pdf_url,
            access_message=message,
            price=paper.price or "Price unavailable",
        )

    def analyze_abstract(self, paper: ResearchPaper) -> PaperAnalysisResponse:
        if not paper.abstract:
            return PaperAnalysisResponse(
                analysis_type="metadata",
                status=AnalysisStatus.NOT_AVAILABLE,
                answer="Belgica cannot produce a reliable analysis because no abstract or full text is available.",
                sources=[],
                access_message="Obtain the paper through a publisher or library, then upload the legally obtained PDF.",
            )
        return self.analyzer.analyze(paper.abstract, paper.doi or paper.id, "abstract")

    def analyze_pdf(self, content: bytes, source: str) -> PaperAnalysisResponse:
        text = self.pdf_service.extract_text(content)
        return self.analyzer.analyze(text, source, "full_text")

    async def analyze_accessible_pdf(self, paper: ResearchPaper) -> PaperAnalysisResponse:
        if not paper.pdf_url or not paper.open_access:
            return self.analyze_abstract(paper)
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(
                    paper.pdf_url,
                    headers={"User-Agent": "Polaris-Research-Portal/1.0"},
                )
                response.raise_for_status()
                content = response.content
            if not content.startswith(b"%PDF"):
                return self.analyze_abstract(paper)
            result = self.analyze_pdf(content, paper.pdf_url)
            return result
        except (httpx.HTTPError, ValueError):
            return self.analyze_abstract(paper)
