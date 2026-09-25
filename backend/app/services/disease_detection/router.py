from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from typing import Optional
from backend.app.services.disease_detection.schema import (
    Base64ImageRequest,
    DiseaseDetectionResponse,
)
from backend.app.services.disease_detection.model import disease_model

router = APIRouter(
    prefix="/disease-detection",
    tags=["Crop Disease Detection Computer Vision Engine"]
)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "bmp"}

@router.post(
    "/analyze",
    response_model=DiseaseDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze crop leaf image file for disease detection",
    description="Upload a crop leaf image (.jpg, .png, .webp). The AI model diagnoses leaf health status, identifies crop disease, confidence percentage, severity level, symptoms, and recommends organic and chemical remedies."
)
async def analyze_crop_image(
    file: UploadFile = File(..., description="Crop leaf image file"),
    crop_hint: Optional[str] = Form(None, description="Optional crop hint (e.g. rice, potato, tomato)")
) -> DiseaseDetectionResponse:
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in ALLOWED_EXTENSIONS and file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    try:
        contents = await file.read()
        return disease_model.analyze_image_bytes(contents, crop_hint=crop_hint)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disease detection processing failed: {str(e)}"
        )

@router.post(
    "/analyze-base64",
    response_model=DiseaseDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze base64 encoded crop leaf image",
    description="Accepts base64 encoded image string (convenient for mobile app or WhatsApp chatbot image uploads)."
)
async def analyze_crop_image_base64(request: Base64ImageRequest) -> DiseaseDetectionResponse:
    try:
        return disease_model.analyze_base64(request.image_base64, crop_hint=request.crop_hint)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Base64 disease detection processing failed: {str(e)}"
        )
