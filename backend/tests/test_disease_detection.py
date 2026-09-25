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
