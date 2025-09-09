import cloudscraper
from bs4 import BeautifulSoup
import csv
import time

scraper = cloudscraper.create_scraper()

all_problems = set() 

for page in range(1, 41):
    url = f"https://codeforces.com/problemset/page/{page}"
    print(f"[INFO] Scraping {url} ...")
    resp = scraper.get(url)
    if resp.status_code != 200:
        print(f"[WARN] Failed to fetch {url} (status {resp.status_code})")
        continue

    soup = BeautifulSoup(resp.text, "html.parser")
    
    for a in soup.select("a[href^='/problemset/problem/']"):
        href = a['href']
        full_url = "https://codeforces.com" + href
        all_problems.add(full_url)
    
    time.sleep(1) 

# Save to CSV
with open("codeforces_problem_links.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["problem_url"])
    for url in sorted(all_problems):
        writer.writerow([url])

print(f"[DONE] Saved {len(all_problems)} problem links to codeforces_problem_links.csv")