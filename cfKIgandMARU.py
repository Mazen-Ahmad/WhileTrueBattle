import os
import csv
import cloudscraper
import time
from urllib.parse import urlparse

# Ensure problems folder exists
os.makedirs("problems", exist_ok=True)

scraper = cloudscraper.create_scraper()

# Read URLs from CSV
with open("codeforces_problem_links.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    urls = [row["problem_url"] for row in reader]

print(f"[INFO] Found {len(urls)} problem URLs in CSV.")

# Iterate and download
for i, url in enumerate(urls, start=1):
    try:
        print(f"[{i}/{len(urls)}] Fetching {url} ...")
        html = scraper.get(url).text

        # Extract problem ID and letter from URL for filename
        path_parts = urlparse(url).path.strip("/").split("/")
        # Example path_parts = ['problemset', 'problem', '2130', 'B']
        if len(path_parts) >= 4:
            problem_id = path_parts[2]
            problem_letter = path_parts[3]
            filename = f"{problem_id}_{problem_letter}.html"
        else:
            filename = f"problem_{i}.html"

        filepath = os.path.join("problems", filename)
        with open(filepath, "w", encoding="utf-8") as f_out:
            f_out.write(html)

        time.sleep(1)  # polite delay

    except Exception as e:
        print(f"[ERROR] Failed {url}: {e}")

print("[DONE] All problems downloaded into 'problems/' folder.")