import io
import base64
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def create_dummy_leaf_image_bytes(color=(34, 139, 34)) -> bytes:
    # Create 100x100 RGB image
    img = Image.new("RGB", (100, 100), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_disease_detection_image_upload_healthy():
    img_bytes = create_dummy_leaf_image_bytes(color=(34, 175, 34))  # Bright green
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}
    data = {"crop_hint": "rice"}

    response = client.post("/api/v1/disease-detection/analyze", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["crop_name"] == "Rice"
    assert res["is_healthy"] is True
    assert res["confidence"] > 0.8
    assert res["severity"] == "Healthy"
    assert len(res["symptoms"]) > 0

def test_disease_detection_image_upload_diseased():
    img_bytes = create_dummy_leaf_image_bytes(color=(160, 50, 20))  # Brown / reddish spot
    files = {"file": ("diseased_leaf.png", img_bytes, "image/png")}
    data = {"crop_hint": "potato"}

    response = client.post("/api/v1/disease-detection/analyze", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["crop_name"] == "Potato"
    assert res["is_healthy"] is False
    assert "Late Blight" in res["disease_name"]
    assert len(res["organic_treatments"]) > 0
    assert len(res["chemical_treatments"]) > 0

def test_disease_detection_base64_endpoint():
    img_bytes = create_dummy_leaf_image_bytes(color=(50, 160, 50))
    b64_str = base64.b64encode(img_bytes).decode("utf-8")

    payload = {
        "image_base64": f"data:image/jpeg;base64,{b64_str}",
        "crop_hint": "rice"
    }

    response = client.post("/api/v1/disease-detection/analyze-base64", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["crop_name"] == "Rice"
    assert "confidence" in res
    assert "preventive_measures" in res

def test_disease_detection_invalid_format_fails():
    dummy_txt = b"Hello world text file content"
    files = {"file": ("document.txt", dummy_txt, "text/plain")}

    response = client.post("/api/v1/disease-detection/analyze", files=files)
    assert response.status_code == 400
    assert "Unsupported image file format" in response.json()["detail"]

def test_digigreen_model_provenance_and_metadata():
    img_bytes = create_dummy_leaf_image_bytes(color=(34, 175, 34))
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/disease-detection/analyze", files=files, data={"crop_hint": "rice"})
    assert response.status_code == 200
    res = response.json()
    assert "DigiGreen/crop-disease-pest-detection-dg" in res.get("model_source", "")
    assert "category" in res
    assert isinstance(res.get("top_diseases"), list)

def test_disease_advisory_endpoint():
    payload = {
        "crop": "Rice",
        "condition": "Blast",
        "confidence": 0.92
    }
    response = client.post("/api/v1/disease-detection/advice", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["crop"] == "Rice"
    assert "Blast" in res["condition"]
    assert len(res["chemical_options"]) > 0
    assert res["chemical_options"][0]["active_ingredient"].startswith("Tricyclazole")
    assert len(res["biological_organic_options"]) > 0

def test_disease_detection_tomato_crop_selection():
    img_bytes = create_dummy_leaf_image_bytes(color=(34, 175, 34))
    files = {"file": ("tomato_leaf.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/disease-detection/analyze", files=files, data={"crop_hint": "tomato"})
    assert response.status_code == 200
    res = response.json()
    assert res["crop"] == "Tomato"
    assert res["crop_name"] == "Tomato"
    assert res.get("is_crop_user_selected") is True
    assert "DigiGreen/crop-disease-pest-detection-dg" in res.get("model_source", "")

def test_disease_detection_crop_synonyms():
    # Test Indian agricultural synonyms like chilli -> chili pepper, dhan -> rice, corn -> maize
    img_bytes = create_dummy_leaf_image_bytes(color=(34, 175, 34))
    
    # Test chilli synonym
    files = {"file": ("chilli_leaf.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/disease-detection/analyze", files=files, data={"crop_hint": "chilli"})
    assert response.status_code == 200
    res = response.json()
    assert res.get("is_crop_user_selected") is True
    assert "Chil" in res["crop"]

    # Test dhan synonym
    files = {"file": ("dhan_leaf.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/disease-detection/analyze", files=files, data={"crop_hint": "dhan"})
    assert response.status_code == 200
    res = response.json()
    assert res.get("is_crop_user_selected") is True
    assert res["crop"] == "Rice"


