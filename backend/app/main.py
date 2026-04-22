from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
from app.api.timeline import router as timeline_router
from app.api.eligibility import router as eligibility_router
from app.api.glossary import router as glossary_router
from app.api.deadlines import router as deadlines_router
from app.api.chat import router as chat_router

app = FastAPI(
    title="MatdaanPath API",
    description="Backend API for the Election Process Education Assistant",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(timeline_router, prefix="/api/timeline", tags=["Timeline"])
app.include_router(eligibility_router, prefix="/api/eligibility", tags=["Eligibility"])
app.include_router(glossary_router, prefix="/api/glossary", tags=["Glossary"])
app.include_router(deadlines_router, prefix="/api/deadlines", tags=["Deadlines"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])



@app.get("/")
def read_root():
    return {"message": "Welcome to MatdaanPath API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

