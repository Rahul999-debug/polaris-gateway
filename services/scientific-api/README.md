# Polaris Scientific API

This is the FastAPI microservice for the Polaris Gateway, providing AI-assisted features like the RAG-Powered Research Assistant (Polaris AI).

## Features

- **Polaris AI (RAG Assistant):** Endpoints to query the research repository using Retrieval-Augmented Generation. Extracts answers from PDFs and text files with direct citations.

## Setup Instructions

1. **Prerequisites:** Make sure you have Python 3.9+ installed.
2. **Navigate to the directory:**
   ```bash
   cd services/scientific-api
   ```
3. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
5. **Set Environment Variables:**
   Copy `.env.example` to `.env` and add your Gemini API Key.
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to include your `GOOGLE_API_KEY`.
6. **Add Data (Research Papers):**
   Place any PDF or TXT files you want the AI to learn from into the `data/` folder. A default sample report is generated automatically if empty.
7. **Run the Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Documentation

Once the server is running, you can view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Example Usage

**Endpoint:** `POST /api/chat`

**Payload:**
```json
{
  "query": "What were the key findings on ice-shelf melting in the 41st expedition?"
}
```

**Response:**
```json
{
  "query": "What were the key findings on ice-shelf melting in the 41st expedition?",
  "answer": "According to the research repository, the 41st Indian Scientific Expedition to Antarctica highlighted severe ice-shelf melting. The primary cause identified was warmer ocean currents under the ice shelves, with an average temperature anomaly of +1.2C.",
  "sources": [
    "data/sample_report.txt"
  ]
}
```
