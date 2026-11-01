import re
import urllib.request

test_ids = ["F5wrgv2jCpw", "LhDWW8PhPoE", "Z4wF0h47fy8", "f7YQo-eYHdM"]
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

for pid in test_ids:
    url = f"https://unsplash.com/photos/{pid}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            title_m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
            desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
            title = title_m.group(1) if title_m else "N/A"
            desc = desc_m.group(1) if desc_m else "N/A"
            print(f"ID {pid}:\n  Title: {title}\n  Desc: {desc}\n")
    except Exception as e:
        print(f"ID {pid} error: {e}")
