/**
 * Shared utility for interacting with Farmer Profile and Farm History endpoints
 */

export async function getActiveFarmerId() {
  let farmerId = localStorage.getItem('krishivaani_farmer_id');
  if (farmerId) return farmerId;

  // Try looking up default farmer profile
  const phone = localStorage.getItem('krishivaani_farmer_phone') || '9876543210';
  try {
    const res = await fetch(`http://localhost:8000/api/v1/farmers/phone/${phone}`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('krishivaani_farmer_id', data.id);
      localStorage.setItem('krishivaani_farmer_phone', phone);
      return data.id;
    }
    
    // Auto-create default test farmer profile if not found
    const createRes = await fetch('http://localhost:8000/api/v1/farmers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rajesh Kumar Patel',
        phone_number: phone,
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Samrala',
        land_area_acres: 4.5,
        soil_type: 'Alluvial',
        irrigation_source: 'Canal',
        primary_crops: ['Wheat', 'Rice'],
        preferred_language: 'en'
      })
    });
    if (createRes.ok) {
      const created = await createRes.json();
      localStorage.setItem('krishivaani_farmer_id', created.id);
      localStorage.setItem('krishivaani_farmer_phone', phone);
      return created.id;
    }
  } catch (e) {
    console.warn("Unable to initialize farmer profile:", e);
  }
  return null;
}

export async function logCropToFarmHistory(record) {
  const farmerId = await getActiveFarmerId();
  if (!farmerId) {
    throw new Error("Farmer profile not initialized. Please visit the Farmer Profile tab to register.");
  }

  const payload = {
    crop: record.crop || record.crop_name,
    season: record.season || 'Kharif',
    year: Number(record.year || new Date().getFullYear()),
    area_acres: Number(record.area_acres || record.land_area_acres || 2.0),
    yield_obtained_quintals: Number(record.yield_obtained_quintals || record.yield_quintals || 0),
    production_cost_inr: Number(record.production_cost_inr || record.cost_incurred_inr || 0),
    revenue_inr: Number(record.revenue_inr || record.gross_return_inr || 0),
    disease_experienced: record.disease_experienced || null,
    soil_condition_note: record.soil_condition_note || record.notes || null,
  };

  const res = await fetch(`http://localhost:8000/api/v1/farmers/${farmerId}/farm-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to record farm history (${res.status})`);
  }

  return await res.json();
}
