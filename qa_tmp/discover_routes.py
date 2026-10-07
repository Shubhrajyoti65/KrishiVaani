import requests
import json

url = "http://localhost:8000/openapi.json"
try:
    r = requests.get(url, timeout=5)
    schema = r.json()
    paths = schema.get("paths", {})
    print(f"Total endpoints discovered: {len(paths)}")
    for p, methods in sorted(paths.items()):
        for m, details in methods.items():
            summary = details.get("summary", "")
            tags = details.get("tags", [])
            print(f"  {m.upper():6s} {p:45s} [{', '.join(tags)}] {summary}")
    with open("qa_tmp/openapi_schema.json", "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
except Exception as e:
    print("Error connecting to backend:", e)
