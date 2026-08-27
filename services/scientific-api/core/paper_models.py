from __future__ import annotations

from enum import StrEnum

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AccessType(StrEnum):
    OPEN_ACCESS = "open_access"
    ABSTRACT_ONLY = "abstract_only"
    PURCHASE_OR_SUBSCRIPTION = "purchase_or_subscription"
    CAPTCHA_REQUIRED = "captcha_required"
    USER_UPLOADED = "user_uploaded"
    UNKNOWN = "unknown"


class AnalysisStatus(StrEnum):
    AVAILABLE = "available"
    NOT_AVAILABLE = "not_available"
    ANALYZED = "analyzed"
    FAILED = "failed"


class ResearchPaper(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    authors: list[str] = Field(default_factory=list)
    abstract: str | None = None
    year: int | None = None
    journal: str | None = None
    doi: str | None = None
    publisher: str | None = None
    source: str = "OpenAlex"
    source_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("source_url", "paper_url"),
    )
    pdf_url: str | None = None
    full_text_available: bool = False
    open_access: bool = False
    access_type: AccessType = AccessType.UNKNOWN
    access_message: str | None = None
    price: str | None = None
    citation_count: int | None = None
    analysis_status: AnalysisStatus = AnalysisStatus.NOT_AVAILABLE


class PaperSearchResponse(BaseModel):
    query: str
    page: int
    per_page: int
    papers: list[ResearchPaper]


class PaperAvailability(BaseModel):
    paper_id: str
    access_type: AccessType
    full_text_available: bool
    abstract_available: bool
    source_url: str | None = None
    pdf_url: str | None = None
    access_message: str
    price: str | None = None


class PaperAnalysisResponse(BaseModel):
    analysis_type: str
    status: AnalysisStatus
    answer: str
    sources: list[str] = Field(default_factory=list)
    access_message: str | None = None


class BelgicaPaperRequest(BaseModel):
    paper: ResearchPaper


class UploadedAnalysisResponse(PaperAnalysisResponse):
    filename: str
