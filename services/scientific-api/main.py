from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables (e.g. GOOGLE_API_KEY)
load_dotenv()

from core.rag import PolarisRAGAssistant

app = FastAPI(
    title="Polaris Scientific API",
    description="FastAPI microservice for AI-assisted research and data processing for the Polar Science Portal.",
    version="1.0.0"
)

# Allow CORS for the Next.js/React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG Assistant globally
# Warning: In a real production scenario, this might be loaded differently
# but for a microservice this is typical.
try:
    if not os.environ.get("GOOGLE_API_KEY"):
        print("WARNING: GOOGLE_API_KEY environment variable is not set. Gemini API calls will fail.")
    rag_assistant = PolarisRAGAssistant(data_dir="./data")
except Exception as e:
    print(f"Error initializing RAG Assistant: {e}")
    rag_assistant = None

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: list[str]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Polaris Scientific API. The RAG Assistant is running."}

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
