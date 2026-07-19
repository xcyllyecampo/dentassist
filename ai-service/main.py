import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import xray, screening, chat, treatment, smile

load_dotenv()

app = FastAPI(title="DentAssist AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(xray.router, prefix="/analyze", tags=["X-Ray Analysis"])
app.include_router(screening.router, prefix="/screen", tags=["Oral Screening"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
app.include_router(treatment.router, prefix="/treatment", tags=["Treatment Suggestion"])
app.include_router(smile.router, prefix="/smile", tags=["Smile Simulation"])


@app.get("/")
def root():
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "service": "DentAssist AI Service",
        "version": "1.0.0",
        "status": "running",
        "gemini_configured": bool(api_key and len(api_key) > 10),
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
