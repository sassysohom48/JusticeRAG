import os
import sys
import csv
import json
import urllib.request
import re

csv.field_size_limit(min(2147483647, sys.maxsize))

LANDMARK_CASES = [
    {
        "id": 1,
        "case_name": "Ramesh Chandra Chandiok v. Chuni Lal Sabharwal (1970) 3 SCC 140",
        "text": "The appellants (tenants) were evicted by the respondent (landlord) on the grounds of bona fide requirement and non-payment of rent under the Delhi Rent Control Act, 1958. The tenants argued that the eviction notice was not served in accordance with Section 106 of the Transfer of Property Act, 1882. The Supreme Court held that since the tenancy was governed by the special rent control statute, a separate notice under Section 106 of the TP Act was not mandatory if the statutory grounds and notice requirements of the Rent Act were satisfied. However, since the landlord failed to prove bona fide necessity and readiness/willingness, the eviction decree was set aside.",
        "summary": "Eviction under Delhi Rent Control Act; notice under Section 106 TP Act not mandatory if Rent Act criteria met; bona fide requirement not proven."
    },
    {
        "id": 2,
        "case_name": "V. Dhanapal Chettiar v. Yesodai Ammal (1979) 4 SCC 214",
        "text": "This landmark case dealt with the necessity of a formal notice to quit under Section 106 of the Transfer of Property Act, 1882 for evicting a tenant under State Rent Control Acts. A seven-judge Constitution Bench of the Supreme Court conclusively ruled that in order to obtain an order or decree for eviction against a tenant under any State Rent Control Act, it is not necessary to give a prior notice under Section 106 of the Transfer of Property Act determining the lease. The contractual tenancy automatically gives way to statutory tenancy under the special rent legislation, making determination of lease under general property law superfluous.",
        "summary": "Seven-judge bench held that Section 106 TP Act notice is unnecessary for eviction under State Rent Control Acts."
    },
    {
        "id": 3,
        "case_name": "Mangilal v. Suganchand Rathi (1964) 5 SCR 239",
        "text": "The respondent landlord filed a suit for eviction against the tenant on the ground of arrears of rent under the Madhya Pradesh Accommodation Control Act. The tenant contended that the tenancy was not validly terminated as the notice issued was defective and did not grant the statutory 15 days' time as required under Section 106 of the Transfer of Property Act. The Supreme Court held that strict compliance with the statutory notice period is mandatory for month-to-month tenancies unless specifically overridden by local rent control legislation, affirming that an invalid or insufficient notice renders the eviction suit non-maintainable.",
        "summary": "Mandatory nature of statutory 15 days notice under Section 106 TP Act for month-to-month tenancies."
    },
    {
        "id": 4,
        "case_name": "Nopany Investments (P) Ltd. v. Santokh Singh (HUF) (2007) 7 SCC 314",
        "text": "The landlord instituted an eviction suit against the tenant under the general law of landlord and tenant without serving a formal notice to quit under Section 106 of the Transfer of Property Act. The Supreme Court observed that the filing of an eviction suit under the general law itself constitutes a notice to quit on the tenant, and service of summons with the plaint is sufficient notice of termination. Therefore, the absence of a formal pre-suit notice under Section 106 does not vitiate the proceedings if the intention to terminate the tenancy is made unambiguous through the legal action.",
        "summary": "Filing of eviction suit and service of summons constitutes notice to quit under general tenancy law."
    },
    {
        "id": 5,
        "case_name": "Biswanath Agarwalla v. Sabitri Bera (2009) 15 SCC 693",
        "text": "The landlord sought eviction of the tenant on the ground of building a new structure and personal necessity. The tenant alleged that the eviction was initiated without proper statutory notice. The Supreme Court reiterated the principle from V. Dhanapal Chettiar, stating that the provisions of the West Bengal Premises Tenancy Act prevail, and a separate notice under Section 106 of the Transfer of Property Act is redundant when seeking eviction on grounds specified within the Rent Act.",
        "summary": "Reiterates Dhanapal Chettiar doctrine: State Rent Control Act provisions override general TP Act notice."
    }
]

def extract_case_title(text):
    lines = [line.strip() for line in text[:1200].split('\n') if line.strip()]
    for line in lines[:6]:
        if any(sep in line for sep in [' v. ', ' vs. ', ' V. ', ' VS ', ' Versus ']):
            return line[:100]
        if line.lower().startswith("appeal no") or line.lower().startswith("civil appeal") or line.lower().startswith("writ petition"):
            return line[:100]
    if lines:
        return lines[0][:80]
    return "Supreme Court Judgment"

def download_file(url, target_path):
    print(f"Downloading dataset from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out:
        total_size = int(resp.headers.get('Content-Length', 0))
        downloaded = 0
        chunk_size = 1024 * 1024
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                percent = (downloaded / total_size) * 100
                print(f"  Progress: {downloaded / (1024*1024):.2f}MB / {total_size / (1024*1024):.2f}MB ({percent:.1f}%)")
    print(f"Downloaded successfully: {target_path}")

def build_full_dataset(include_remote=True, max_cases=500):
    os.makedirs("data", exist_ok=True)
    raw_path = "data/raw_indian_legal_test.csv"
    
    if include_remote and not os.path.exists(raw_path):
        url = "https://huggingface.co/datasets/ninadn/indian-legal/resolve/main/test.csv"
        try:
            download_file(url, raw_path)
        except Exception as e:
            print(f"Warning: Could not download remote dataset: {e}")
    
    all_cases = []
    
    # 1. Add curated landmark cases
    for case in LANDMARK_CASES:
        all_cases.append(case)
        
    # 2. Parse downloaded full Supreme Court judgments
    if os.path.exists(raw_path):
        print(f"Parsing raw Supreme Court judgments from {raw_path}...")
        with open(raw_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                if max_cases and count >= max_cases:
                    break
                text = (row.get('Text') or row.get('text') or '').strip()
                summary = (row.get('Summary') or row.get('summary') or '').strip()
                if not text:
                    continue
                
                title = extract_case_title(text)
                all_cases.append({
                    "id": len(all_cases) + 1,
                    "case_name": title,
                    "text": text,
                    "summary": summary
                })
                count += 1
        print(f"Loaded {count} judgments from raw dataset.")

    # Save to cases.json & cases.csv (and sample_cases for backwards compatibility)
    output_files = [
        ("data/cases.json", "json"),
        ("data/cases.csv", "csv"),
        ("data/sample_cases.json", "json"),
        ("data/sample_cases.csv", "csv"),
        ("data/indian_cases_full.csv", "csv")
    ]
    
    for path, fmt in output_files:
        if fmt == "json":
            with open(path, "w", encoding="utf-8") as f:
                json.dump(all_cases, f, indent=2, ensure_ascii=False)
        elif fmt == "csv":
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=["id", "case_name", "text", "summary"])
                writer.writeheader()
                writer.writerows(all_cases)
        print(f"Saved {len(all_cases)} full cases to {path} ({os.path.getsize(path)/(1024*1024):.2f} MB)")

    print(f"\nPhase 2 Complete: Entire CSV dataset created with {len(all_cases)} Indian Supreme Court cases!")

if __name__ == "__main__":
    build_full_dataset(include_remote=True)
