from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables (e.g. GOOGLE_API_KEY)
load_dotenv()

from core.research import ResearchPaperService
from core.belgica_service import BelgicaService
from core.paper_models import (
    AnalysisStatus,
    BelgicaPaperRequest,
    PaperAnalysisResponse,
    PaperAvailability,
    PaperSearchResponse,
    ResearchPaper,
    UploadedAnalysisResponse,
)

app = FastAPI(
    title="Polaris Scientific API",
    description="FastAPI microservice for AI-assisted research and data processing for the Polar Science Portal.",
    version="1.0.0"
)

cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "SCIENTIFIC_API_CORS_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG Assistant globally
# Warning: In a real production scenario, this might be loaded differently
# but for a microservice this is typical.
try:
    from core.rag import PolarisRAGAssistant

    if not os.environ.get("GOOGLE_API_KEY"):
        print("WARNING: GOOGLE_API_KEY environment variable is not set. Gemini API calls will fail.")
    rag_assistant = PolarisRAGAssistant(data_dir="./data")
except Exception as e:
    print(f"Error initializing RAG Assistant: {e}")
    rag_assistant = None

research_paper_service = ResearchPaperService()
belgica_service = BelgicaService(getattr(rag_assistant, "llm", None))

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: list[str]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Polaris Scientific API. The RAG Assistant is running."}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "rag": "ready" if rag_assistant else "unavailable",
        "belgica": "ready" if belgica_service.analyzer.llm else "analysis_unavailable",
        "research_service": "ready",
    }

@app.get("/api/research/papers")
async def search_research_papers(
    query: str = "Antarctica",
    page: int = 1,
    per_page: int = 200,
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if page < 1 or per_page < 1 or per_page > 200:
        raise HTTPException(status_code=400, detail="Page must be positive and per_page must be between 1 and 200.")

    try:
        return {
            "query": query,
            "page": page,
            "per_page": per_page,
            "papers": await research_paper_service.search(query, page, per_page),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Research discovery failed: {e}") from e

@app.get("/papers/search", response_model=PaperSearchResponse)
async def search_papers(
    query: str = Query("Antarctica", alias="q"),
    page: int = 1,
    per_page: int = 50,
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if page < 1 or per_page < 1 or per_page > 200:
        raise HTTPException(status_code=400, detail="Page must be positive and per_page must be between 1 and 200.")
    try:
        raw_papers = await research_paper_service.search(query, page, per_page)
        papers = [
            ResearchPaper(
                id=str(paper.get("source_id") or f"openalex-{index}"),
                title=str(paper.get("title") or "Untitled paper"),
                authors=paper.get("authors") or [],
                abstract=paper.get("abstract"),
                year=paper.get("year"),
                journal=paper.get("journal"),
                doi=paper.get("doi"),
                source_url=paper.get("paper_url"),
                pdf_url=paper.get("pdf_url"),
                full_text_available=bool(paper.get("pdf_url") and paper.get("open_access")),
                access_type="open_access" if paper.get("open_access") and paper.get("pdf_url") else "abstract_only",
                citation_count=paper.get("citation_count"),
                publisher=paper.get("publisher"),
                open_access=bool(paper.get("open_access")),
            )
            for index, paper in enumerate(raw_papers)
        ]
        return PaperSearchResponse(query=query, page=page, per_page=per_page, papers=papers)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Research discovery failed.") from error

@app.get("/papers/{paper_id}", response_model=ResearchPaper)
async def get_paper(paper_id: str):
    try:
        paper = await research_paper_service.get(paper_id)
        return ResearchPaper(
            id=str(paper.get("source_id") or paper_id),
            title=str(paper.get("title") or "Untitled paper"),
            authors=paper.get("authors") or [],
            abstract=paper.get("abstract"),
            year=paper.get("year"),
            journal=paper.get("journal"),
            doi=paper.get("doi"),
            source_url=paper.get("paper_url"),
            pdf_url=paper.get("pdf_url"),
            full_text_available=bool(paper.get("pdf_url") and paper.get("open_access")),
            access_type="open_access" if paper.get("open_access") and paper.get("pdf_url") else "abstract_only",
            citation_count=paper.get("citation_count"),
            publisher=paper.get("publisher"),
            open_access=bool(paper.get("open_access")),
        )
    except Exception as error:
        raise HTTPException(status_code=404, detail="Paper was not found.") from error

@app.get("/papers/{paper_id}/availability", response_model=PaperAvailability)
async def paper_availability(paper_id: str):
    try:
        paper = await research_paper_service.get(paper_id)
        metadata = ResearchPaper(
            id=str(paper.get("source_id") or paper_id),
            title=str(paper.get("title") or "Untitled paper"),
            authors=paper.get("authors") or [],
            abstract=paper.get("abstract"),
            year=paper.get("year"),
            journal=paper.get("journal"),
            doi=paper.get("doi"),
            source_url=paper.get("paper_url"),
            pdf_url=paper.get("pdf_url"),
            full_text_available=bool(paper.get("pdf_url") and paper.get("open_access")),
            access_type="open_access" if paper.get("open_access") and paper.get("pdf_url") else "abstract_only",
            publisher=paper.get("publisher"),
            open_access=bool(paper.get("open_access")),
        )
        return belgica_service.availability(metadata)
    except Exception as error:
        raise HTTPException(status_code=404, detail="Paper was not found.") from error

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    if not rag_assistant:
        raise HTTPException(status_code=500, detail="RAG Assistant is not initialized.")
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        response = rag_assistant.ask(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/belgica/analyze", response_model=PaperAnalysisResponse)
async def analyze_with_belgica(request: BelgicaPaperRequest):
    """
    Analyse a research paper using only content currently available
    to the scientific API.

    At this stage:
    - abstract available -> abstract analysis
    - no abstract -> refuse to fabricate a summary

    Full PDF analysis will be added in the next stage.
    """

    try:
        return await belgica_service.analyze_accessible_pdf(request.paper)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

@app.post("/papers/analyze-upload", response_model=UploadedAnalysisResponse)
async def analyze_uploaded_paper(file: UploadFile = File(...)):
    filename = file.filename or "uploaded-paper.pdf"

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    if file.content_type not in {
        "application/pdf",
        "application/octet-stream",
        None,
    }:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file must be a PDF.",
        )

    content = await file.read(25 * 1024 * 1024 + 1)

    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="The PDF exceeds the 25 MB limit.",
        )

    try:
        result = belgica_service.analyze_pdf(
            content,
            f"User-uploaded PDF: {filename}",
        )

        return UploadedAnalysisResponse(
            filename=filename,
            **result.model_dump(),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except RuntimeError as error:
        # Useful during development and still avoids returning a traceback.
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

@app.post("/papers/{paper_id}/analyze", response_model=PaperAnalysisResponse)
async def analyze_paper(paper_id: str, request: BelgicaPaperRequest):
    if request.paper.id != paper_id:
        raise HTTPException(status_code=400, detail="Paper ID does not match the request body.")
    try:
        return await belgica_service.analyze_accessible_pdf(request.paper)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error