"""
KrishiVaani — Disease Detection & Advisory Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Base64ImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of crop leaf image")
    crop_hint: Optional[str] = Field(None, description="Optional hint for crop species (e.g. rice, potato, tomato, cotton)")

class ChemicalOption(BaseModel):
    active_ingredient: str
    target_crop: str
    target_condition: str
    registered_use: str
    application_instructions: str
    safety_requirements: str
    pre_harvest_interval: str

class DiseaseDetectionResponse(BaseModel):
    # Standard format per project requirements
    crop: str
    condition_type: str = "disease"  # "disease", "pest", "healthy"
    condition: str
    confidence: float
    healthy_status: bool
    is_reliable: bool = True
    reliability_message: Optional[str] = None
    severity: str = "Moderate"

    # Step-by-step ordered advisory
    symptoms: List[str] = []
    immediate_actions: List[str] = []
    cultural_management: List[str] = []
    low_cost_measures: List[str] = []
    biological_organic_options: List[str] = []
    chemical_options: List[ChemicalOption] = []
    safety_instructions: List[str] = []
    preventive_measures: List[str] = []
    when_to_contact_expert: str = (
        "Contact your local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer "
        "if more than 25% of the field is affected or symptoms spread rapidly."
    )

    # DigiGreen Model Information
    model_source: Optional[str] = "DigiGreen/crop-disease-pest-detection-dg"
    crop_confidence: Optional[float] = None
    category: Optional[str] = None
    top_diseases: Optional[List[Dict[str, Any]]] = []
    top_pest: Optional[str] = None
    pest_confidence: Optional[float] = None
    is_crop_user_selected: Optional[bool] = False

    # Backward compatibility aliases
    crop_name: str
    disease_name: str
    is_healthy: bool
    chemical_treatments: List[str] = []
    organic_treatments: List[str] = []
    disease: Optional[str] = None
    treatment: Optional[str] = None
    organic: Optional[str] = None

    # Agricultural RAG & Grounded Evidence
    rag_citations: Optional[List[Dict[str, Any]]] = None
    llm_grounded_guidance: Optional[str] = None

class DiseaseAdviceRequest(BaseModel):
    crop: str
    condition: str
    confidence: Optional[float] = 0.90
