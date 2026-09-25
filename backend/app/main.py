from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.db.session import db_manager
from backend.app.services.crop_recommendation.router import router as crop_router
from backend.app.services.farmer_profile.router import router as farmer_router
from backend.app.services.yield_prediction.router import router as yield_router
from backend.app.services.weather_service.router import router as weather_router
from backend.app.services.disease_detection.router import router as disease_router
from backend.app.services.satellite_service.router import router as satellite_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB connection
    await db_manager.connect()
    yield
    # Shutdown: Close DB connection
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="KrishiVaani AI/ML Farming Assistant Platform Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base health check route
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database_connected": db_manager.is_connected,
        "version": "1.0.0"
    }

# Include routers
app.include_router(crop_router, prefix=settings.API_V1_STR)
app.include_router(farmer_router, prefix=settings.API_V1_STR)
app.include_router(yield_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(disease_router, prefix=settings.API_V1_STR)
app.include_router(satellite_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
