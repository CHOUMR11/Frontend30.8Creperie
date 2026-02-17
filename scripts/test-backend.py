import urllib.request
import json

BASE = "https://backendmenu-3.onrender.com"
endpoints = ["/api/orders", "/api/menu", "/api/bills", "/api/commandes"]

for path in endpoints:
    url = BASE + path
    print(f"\n===== GET {path} =====")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            data = resp.read().decode("utf-8")
            print(f"Status: {status}")
            try:
                j = json.loads(data)
                if isinstance(j, list):
                    print(f"Array with {len(j)} items")
                    if len(j) > 0:
                        print(f"First item keys: {list(j[0].keys())}")
                        print(f"First item: {json.dumps(j[0], indent=2, ensure_ascii=False)[:800]}")
                    if len(j) > 1:
                        print(f"Second item: {json.dumps(j[1], indent=2, ensure_ascii=False)[:800]}")
                elif isinstance(j, dict):
                    print(f"Object keys: {list(j.keys())}")
                    if "data" in j and isinstance(j["data"], list):
                        print(f"json.data: Array with {len(j['data'])} items")
                        if len(j["data"]) > 0:
                            print(f"First data item: {json.dumps(j['data'][0], indent=2, ensure_ascii=False)[:800]}")
                    else:
                        print(f"Response: {json.dumps(j, indent=2, ensure_ascii=False)[:800]}")
            except json.JSONDecodeError:
                print(f"Raw text: {data[:500]}")
    except Exception as e:
        print(f"ERROR: {e}")
