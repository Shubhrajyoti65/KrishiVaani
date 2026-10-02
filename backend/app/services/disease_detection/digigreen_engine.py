"""
KrishiVaani — DigiGreen Multi-Task Crop Disease & Pest Detection Engine
Powered by Digital Green's 'DigiGreen/crop-disease-pest-detection-dg' model.
DaViT-Base architecture with 4 simultaneous prediction heads:
- Crop Head (110 crops)
- Category Head (3 categories: healthy, disease, pest/weed)
- Disease Head (285 disease classes, masked by predicted or selected crop)
- Pest Head (92 pest classes, unmasked)
"""
import os
import json
import logging
import numpy as np
from PIL import Image
from typing import Optional, Dict, Any, List, Tuple

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    torch = None
    nn = object
    HAS_TORCH = False

try:
    import torchvision.transforms as T
    HAS_TORCHVISION = True
except ImportError:
    T = None
    HAS_TORCHVISION = False

logger = logging.getLogger(__name__)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "digigreen_assets")

# Indian / Alternate agricultural crop names mapped to DigiGreen 110-crop vocabulary
CROP_SYNONYMS: Dict[str, str] = {
    "chilli": "chili pepper",
    "chili": "chili pepper",
    "mirch": "chili pepper",
    "pepper": "chili pepper",
    "bell pepper": "bell pepper",
    "capsicum": "bell pepper",
    "shimla mirch": "bell pepper",
    "paddy": "rice",
    "dhan": "rice",
    "corn": "maize",
    "makka": "maize",
    "makai": "maize",
    "peanut": "groundnut",
    "moongphali": "groundnut",
    "mungfali": "groundnut",
    "brinjal": "eggplant",
    "baingan": "eggplant",
    "aubergine": "eggplant",
    "ladyfinger": "okra",
    "bhindi": "okra",
    "bhendi": "okra",
    "alu": "potato",
    "aloo": "potato",
    "batata": "potato",
    "tamatar": "tomato",
    "gehun": "wheat",
    "gehu": "wheat",
    "ganna": "sugarcane",
    "pyaz": "onion",
    "kanda": "onion",
    "lahsun": "garlic",
    "adrak": "ginger",
    "kela": "banana",
    "seb": "apple",
    "aam": "mango",
    "kheera": "cucumber",
    "kakdi": "cucumber",
    "soyabean": "soybean",
    "arhar": "pigeon pea",
    "toor": "pigeon pea",
    "tur": "pigeon pea",
    "chana": "chickpea",
    "gram": "chickpea",
    "urad": "urd bean",
    "moong": "mungbean",
    "sarson": "mustard",
    "kapas": "cotton",
    "jowar": "sorghum",
    "bajra": "pearl millet",
    "gobhi": "cabbage",
    "patta gobhi": "cabbage",
    "phool gobhi": "cauliflower",
    "cauliflower": "cauliflower",
    "anar": "pomegranate",
    "papita": "papaya",
    "nimbu": "lemon",
    "santre": "orange",
    "angoor": "grape",
    "tarbooj": "watermelon"
}

# Catch-all or non-specific categories in DigiGreen 110-crop vocabulary
GENERIC_CROP_CLASSES = {
    "broadleaf plant",
    "other",
    "leafy vegetable",
    "grass-family crop",
    "cucurbit",
    "legume",
    "brassica"
}

class DigiGreenMultiTaskModel(nn.Module):
    def __init__(self, num_crops=110, num_categories=3, num_diseases=285, num_pests=92):
        super().__init__()
        import timm
        self.backbone = timm.create_model("davit_base.msft_in1k", pretrained=False, num_classes=0)
        dim = self.backbone.num_features
        self.crop_head = nn.Linear(dim, num_crops)
        self.category_head = nn.Linear(dim, num_categories)
        self.disease_head = nn.Linear(dim, num_diseases)
        self.pest_head = nn.Linear(dim, num_pests)

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        feat = self.backbone(x)
        return {
            "crop": self.crop_head(feat),
            "category": self.category_head(feat),
            "disease": self.disease_head(feat),
            "pest": self.pest_head(feat)
        }

class DigiGreenDetector:
    def __init__(self):
        self.model: Optional[DigiGreenMultiTaskModel] = None
        self.device = torch.device("cuda" if (HAS_TORCH and torch is not None and torch.cuda.is_available()) else "cpu") if (HAS_TORCH and torch is not None) else "cpu"
        self.is_loaded = False

        # Vocabularies
        self.crop_vocab: Dict[str, int] = {}
        self.category_vocab: Dict[str, int] = {}
        self.disease_vocab: Dict[str, int] = {}
        self.pest_vocab: Dict[str, int] = {}

        self.crop_idx_to_name: Dict[int, str] = {}
        self.cat_idx_to_name: Dict[int, str] = {}
        self.dis_idx_to_name: Dict[int, str] = {}
        self.pest_idx_to_name: Dict[int, str] = {}

        self.crop_disease_mask: Optional[np.ndarray] = None

        # Evaluated at native timm davit_base bicubic resolution
        if HAS_TORCHVISION and T is not None:
            self.transform = T.Compose([
                T.Resize(235, interpolation=T.InterpolationMode.BICUBIC, antialias=True),
                T.CenterCrop(224),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
        else:
            self.transform = self._pil_transform

        self._load_vocabularies()

    def _pil_transform(self, img: Image.Image):
        w, h = img.size
        if w < h:
            new_w = 235
            new_h = max(224, int(h * (235 / w)))
        else:
            new_h = 235
            new_w = max(224, int(w * (235 / h)))
        resized = img.resize((new_w, new_h), Image.BICUBIC)
        left = max(0, (new_w - 224) // 2)
        top = max(0, (new_h - 224) // 2)
        cropped = resized.crop((left, top, left + 224, top + 224))
        arr = np.array(cropped, dtype=np.float32) / 255.0
        if arr.ndim == 2:
            arr = np.stack([arr, arr, arr], axis=-1)
        elif arr.shape[2] == 4:
            arr = arr[:, :, :3]
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        arr = (arr - mean) / std
        arr = np.transpose(arr, (2, 0, 1))
        if HAS_TORCH and torch is not None:
            return torch.from_numpy(arr).float()
        return arr

    def _load_vocabularies(self):
        try:
            with open(os.path.join(ASSETS_DIR, "crop_vocab.json"), "r", encoding="utf-8") as f:
                self.crop_vocab = json.load(f)
            with open(os.path.join(ASSETS_DIR, "category_vocab.json"), "r", encoding="utf-8") as f:
                self.category_vocab = json.load(f)
            with open(os.path.join(ASSETS_DIR, "disease_vocab.json"), "r", encoding="utf-8") as f:
                self.disease_vocab = json.load(f)
            with open(os.path.join(ASSETS_DIR, "pest_vocab.json"), "r", encoding="utf-8") as f:
                self.pest_vocab = json.load(f)

            self.crop_idx_to_name = {v: k for k, v in self.crop_vocab.items()}
            self.cat_idx_to_name = {v: k for k, v in self.category_vocab.items()}
            self.dis_idx_to_name = {v: k for k, v in self.disease_vocab.items()}
            self.pest_idx_to_name = {v: k for k, v in self.pest_vocab.items()}

            mask_path = os.path.join(ASSETS_DIR, "crop_disease_mask.npy")
            if os.path.exists(mask_path):
                self.crop_disease_mask = np.load(mask_path)
            logger.info("DigiGreen vocabs and mask loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load DigiGreen vocabs: {e}")

    def load_model(self) -> bool:
        if self.is_loaded:
            return True

        try:
            logger.info("Loading DigiGreen/crop-disease-pest-detection-dg model...")
            from huggingface_hub import hf_hub_download
            from safetensors.torch import load_file

            weights_path = hf_hub_download(
                repo_id="DigiGreen/crop-disease-pest-detection-dg",
                filename="model.safetensors"
            )

            model = DigiGreenMultiTaskModel(
                num_crops=len(self.crop_vocab) or 110,
                num_categories=len(self.category_vocab) or 3,
                num_diseases=len(self.disease_vocab) or 285,
                num_pests=len(self.pest_vocab) or 92
            )
            state_dict = load_file(weights_path)
            model.load_state_dict(state_dict, strict=True)
            model.to(self.device)
            model.eval()

            self.model = model
            self.is_loaded = True
            logger.info("DigiGreen model weights loaded successfully into memory.")
            return True
        except Exception as e:
            logger.error(f"Failed to load DigiGreen model: {e}")
            return False

    def predict(self, image: Image.Image, crop_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Execute forward pass on image with DaViT-Base multi-task model.
        Returns predicted crop, category, masked disease, pest, and confidence scores.
        """
        if not self.is_loaded:
            success = self.load_model()
            if not success or self.model is None:
                return None

        try:
            rgb_image = image.convert("RGB")
            input_tensor = self.transform(rgb_image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                out = self.model(input_tensor)

            # 1. Crop Identification
            crop_logits = out["crop"][0].cpu()
            crop_probs = torch.softmax(crop_logits, dim=-1)

            crop_idx = None
            is_crop_user_selected = False

            if crop_hint:
                normalized_hint = crop_hint.lower().strip()
                # 1. Direct synonym mapping (e.g. chilli -> chili pepper, dhan -> rice)
                if normalized_hint in CROP_SYNONYMS:
                    syn_target = CROP_SYNONYMS[normalized_hint]
                    if syn_target in self.crop_vocab:
                        crop_idx = self.crop_vocab[syn_target]
                        is_crop_user_selected = True

                # 2. Exact match in 110-crop vocabulary
                if crop_idx is None and normalized_hint in self.crop_vocab:
                    crop_idx = self.crop_vocab[normalized_hint]
                    is_crop_user_selected = True

                # 3. Partial substring match
                if crop_idx is None:
                    for name, idx in self.crop_vocab.items():
                        if normalized_hint == name or (len(normalized_hint) >= 3 and (normalized_hint in name or name in normalized_hint)):
                            crop_idx = idx
                            is_crop_user_selected = True
                            break

            if crop_idx is None:
                # Joint Crop-Disease Scoring for Auto-Detection:
                # De-prioritize generic catch-all buckets (e.g. broadleaf plant, other, leafy vegetable)
                # and weigh by compatibility with unmasked disease probabilities.
                dis_logits_raw = out["disease"][0].cpu()
                unmasked_dis_probs = torch.softmax(dis_logits_raw, dim=-1)

                top_candidate_indices = torch.argsort(crop_probs, descending=True)[:15].tolist()
                best_crop_idx = top_candidate_indices[0]
                best_score = -1.0

                for c_cand in top_candidate_indices:
                    c_name = self.crop_idx_to_name.get(c_cand, "")
                    is_generic = c_name in GENERIC_CROP_CLASSES

                    if self.crop_disease_mask is not None and c_cand < self.crop_disease_mask.shape[0]:
                        valid_mask = self.crop_disease_mask[c_cand]
                        valid_indices = np.where(valid_mask == 1)[0]
                        max_compatible_dis = float(unmasked_dis_probs[valid_indices].max().item()) if len(valid_indices) > 0 else 0.01
                    else:
                        max_compatible_dis = 0.05

                    penalty = 0.20 if is_generic else 1.0
                    joint_score = (crop_probs[c_cand].item() ** 0.6) * (max_compatible_dis ** 0.4) * penalty

                    if joint_score > best_score:
                        best_score = joint_score
                        best_crop_idx = c_cand

                crop_idx = best_crop_idx
                is_crop_user_selected = False

            raw_crop_name = self.crop_idx_to_name.get(crop_idx, "plant").title()
            crop_conf = float(crop_probs[crop_idx].item())

            # 2. Category Prediction ('healthy', 'disease', 'pest/weed')
            cat_logits = out["category"][0].cpu()
            cat_probs = torch.softmax(cat_logits, dim=-1)
            cat_idx = torch.argmax(cat_probs).item()
            cat_name = self.cat_idx_to_name.get(cat_idx, "disease")
            cat_conf = float(cat_probs[cat_idx].item())

            # 3. Masked Disease Prediction
            disease_logits = out["disease"][0].cpu().clone()
            if self.crop_disease_mask is not None and crop_idx < self.crop_disease_mask.shape[0]:
                crop_mask = self.crop_disease_mask[crop_idx]
                for d_i in range(len(self.disease_vocab)):
                    if not crop_mask[d_i]:
                        disease_logits[d_i] = -1e9

            disease_probs = torch.softmax(disease_logits, dim=-1)
            top_disease_idx = torch.argmax(disease_probs).item()
            top_disease_name = self.dis_idx_to_name.get(top_disease_idx, "leaf spot")
            disease_conf = float(disease_probs[top_disease_idx].item())

            # 4. Pest Prediction (Unmasked)
            pest_logits = out["pest"][0].cpu()
            pest_probs = torch.softmax(pest_logits, dim=-1)
            top_pest_idx = torch.argmax(pest_probs).item()
            top_pest_name = self.pest_idx_to_name.get(top_pest_idx, "pest")
            pest_conf = float(pest_probs[top_pest_idx].item())

            # 5. Resolve final diagnostic conclusion
            is_healthy = False
            condition_type = "disease"
            final_condition = top_disease_name.title()
            final_conf = disease_conf

            if cat_name == "healthy":
                is_healthy = True
                condition_type = "healthy"
                final_condition = "Healthy Plant"
                final_conf = max(cat_conf, disease_conf)
            elif cat_name == "pest/weed":
                is_healthy = False
                condition_type = "pest"
                final_condition = top_pest_name.title()
                final_conf = max(pest_conf, cat_conf)
            else:
                # Category head predicted disease
                if top_disease_name == "healthy":
                    sorted_disease_indices = torch.argsort(disease_probs, descending=True).tolist()
                    non_healthy = [idx for idx in sorted_disease_indices if self.dis_idx_to_name.get(idx) != "healthy"]
                    if non_healthy and disease_probs[non_healthy[0]].item() > 0.05:
                        top_disease_idx = non_healthy[0]
                        top_disease_name = self.dis_idx_to_name.get(top_disease_idx, "leaf spot")
                        disease_conf = float(disease_probs[top_disease_idx].item())
                        is_healthy = False
                        condition_type = "disease"
                        final_condition = top_disease_name.title()
                        final_conf = disease_conf
                    else:
                        is_healthy = True
                        condition_type = "healthy"
                        final_condition = "Healthy Plant"
                        final_conf = max(cat_conf, disease_conf)
                else:
                    is_healthy = False
                    condition_type = "disease"
                    final_condition = top_disease_name.title()
                    final_conf = disease_conf

            # Realistic confidence calibration
            final_conf = max(0.05, min(float(final_conf), 0.98))

            # Get top 3 alternative differential diseases
            top_indices = torch.argsort(disease_probs, descending=True)[:3].tolist()
            top_diseases = [
                {"name": self.dis_idx_to_name.get(idx, "unknown").title(), "confidence": round(float(disease_probs[idx].item()), 3)}
                for idx in top_indices if disease_probs[idx] > 0.01 and self.dis_idx_to_name.get(idx) != top_disease_name
            ]

            return {
                "crop": raw_crop_name,
                "crop_confidence": round(crop_conf, 3),
                "is_crop_user_selected": is_crop_user_selected,
                "category": cat_name,
                "condition": final_condition,
                "condition_type": condition_type,
                "is_healthy": is_healthy,
                "confidence": round(min(final_conf, 0.98), 3),
                "top_diseases": top_diseases,
                "top_pest": top_pest_name.title(),
                "pest_confidence": round(pest_conf, 3),
                "model_source": "DigiGreen/crop-disease-pest-detection-dg"
            }
        except Exception as e:
            logger.error(f"Error during DigiGreen prediction: {e}")
            return None

# Singleton instance
digigreen_engine = DigiGreenDetector()
