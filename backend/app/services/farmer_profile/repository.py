import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.db.session import db_manager
from backend.app.services.farmer_profile.schema import (
    FarmerProfileCreate,
    FarmerProfileUpdate,
    FarmerProfileResponse,
    SoilTestRecordCreate,
    SoilTestRecordResponse,
)

# In-memory storage for test/standalone execution when MongoDB is not connected
_in_memory_farmers: Dict[str, Dict[str, Any]] = {}
_in_memory_soil_tests: Dict[str, List[Dict[str, Any]]] = {}

class FarmerRepository:
    
    async def create_farmer(self, farmer_in: FarmerProfileCreate) -> FarmerProfileResponse:
        farmer_id = f"f_{uuid.uuid4().hex[:12]}"
        now_str = datetime.utcnow().isoformat()
        
        farmer_doc = {
            "id": farmer_id,
            "phone_number": farmer_in.phone_number,
            "name": farmer_in.name,
            "state": farmer_in.state,
            "district": farmer_in.district,
            "village": farmer_in.village,
            "soil_type": farmer_in.soil_type,
            "land_area_acres": farmer_in.land_area_acres,
            "preferred_language": farmer_in.preferred_language,
            "created_at": now_str,
            "updated_at": now_str,
        }

        if db_manager.is_connected:
            await db_manager.db["farmers"].insert_one(farmer_doc)
        else:
            _in_memory_farmers[farmer_id] = farmer_doc

        return FarmerProfileResponse(**farmer_doc)

    async def get_farmer_by_id(self, farmer_id: str) -> Optional[FarmerProfileResponse]:
        if db_manager.is_connected:
            doc = await db_manager.db["farmers"].find_one({"id": farmer_id})
            if doc:
                return FarmerProfileResponse(**doc)
            return None
        else:
            doc = _in_memory_farmers.get(farmer_id)
            if doc:
                return FarmerProfileResponse(**doc)
            return None

    async def get_farmer_by_phone(self, phone_number: str) -> Optional[FarmerProfileResponse]:
        if db_manager.is_connected:
            doc = await db_manager.db["farmers"].find_one({"phone_number": phone_number})
            if doc:
                return FarmerProfileResponse(**doc)
            return None
        else:
            for farmer in _in_memory_farmers.values():
                if farmer["phone_number"] == phone_number:
                    return FarmerProfileResponse(**farmer)
            return None

    async def update_farmer(self, farmer_id: str, update_in: FarmerProfileUpdate) -> Optional[FarmerProfileResponse]:
        farmer = await self.get_farmer_by_id(farmer_id)
        if not farmer:
            return None

        update_data = update_in.model_dump(exclude_unset=True)
        if not update_data:
            return farmer

        update_data["updated_at"] = datetime.utcnow().isoformat()

        if db_manager.is_connected:
            await db_manager.db["farmers"].update_one(
                {"id": farmer_id},
                {"$set": update_data}
            )
            updated_doc = await db_manager.db["farmers"].find_one({"id": farmer_id})
            return FarmerProfileResponse(**updated_doc)
        else:
            farmer_dict = _in_memory_farmers[farmer_id]
            farmer_dict.update(update_data)
            return FarmerProfileResponse(**farmer_dict)

    async def add_soil_test(self, farmer_id: str, test_in: SoilTestRecordCreate) -> SoilTestRecordResponse:
        test_id = f"st_{uuid.uuid4().hex[:12]}"
        now_str = datetime.utcnow().isoformat()

        soil_doc = {
            "id": test_id,
            "farmer_id": farmer_id,
            "nitrogen": test_in.nitrogen,
            "phosphorus": test_in.phosphorus,
            "potassium": test_in.potassium,
            "temperature": test_in.temperature,
            "humidity": test_in.humidity,
            "ph": test_in.ph,
            "rainfall": test_in.rainfall,
            "notes": test_in.notes,
            "recorded_at": now_str,
        }

        if db_manager.is_connected:
            await db_manager.db["soil_tests"].insert_one(soil_doc)
        else:
            if farmer_id not in _in_memory_soil_tests:
                _in_memory_soil_tests[farmer_id] = []
            _in_memory_soil_tests[farmer_id].append(soil_doc)

        return SoilTestRecordResponse(**soil_doc)

    async def get_farmer_soil_tests(self, farmer_id: str) -> List[SoilTestRecordResponse]:
        if db_manager.is_connected:
            cursor = db_manager.db["soil_tests"].find({"farmer_id": farmer_id}).sort("recorded_at", -1)
            docs = await cursor.to_list(length=100)
            return [SoilTestRecordResponse(**doc) for doc in docs]
        else:
            docs = _in_memory_soil_tests.get(farmer_id, [])
            # Sort descending by recorded_at
            docs_sorted = sorted(docs, key=lambda x: x["recorded_at"], reverse=True)
            return [SoilTestRecordResponse(**doc) for doc in docs_sorted]

farmer_repository = FarmerRepository()
