import os
import urllib.request
import csv
import json
import re

def download_file(url, target_path):
    print(f"Downloading from {url} to {target_path}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out:
        total_size = int(resp.headers.get('Content-Length', 0))
        downloaded = 0
        chunk_size = 1024 * 1024  # 1MB
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                percent = (downloaded / total_size) * 100
                print(f"Progress: {downloaded / (1024*1024):.2f}MB / {total_size / (1024*1024):.2f}MB ({percent:.1f}%)")
            else:
                print(f"Downloaded: {downloaded / (1024*1024):.2f}MB")
    print(f"Download complete: {target_path}")

import sys
csv.field_size_limit(min(2147483647, sys.maxsize))

def extract_case_title(text):
    # Try to find case title or parties in the first few lines
    lines = [line.strip() for line in text[:1000].split('\n') if line.strip()]
    for line in lines[:5]:
        if ' v. ' in line or ' vs. ' in line or ' V. ' in line or ' VS ' in line:
            return line
        if line.lower().startswith("appeal no") or line.lower().startswith("civil appeal"):
            return line
    if lines:
        return lines[0][:80]
    return "Supreme Court Case"

def process_dataset(raw_csv_path, output_csv_path, output_json_path, max_records=None):
    print(f"Processing {raw_csv_path}...")
    records = []
    
    with open(raw_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if max_records and i >= max_records:
                break
            text = row.get('Text', '') or row.get('text', '') or row.get('full_text', '')
            summary = row.get('Summary', '') or row.get('summary', '')
            
            if not text.strip():
                continue
                
            case_title = extract_case_title(text)
            
            records.append({
                "id": i + 1,
                "case_name": case_title,
                "text": text.strip(),
                "summary": summary.strip() if summary else ""
            })
            
    print(f"Parsed {len(records)} case records.")
    
    # Save CSV
    fieldnames = ["id", "case_name", "text", "summary"]
    with open(output_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    print(f"Saved {len(records)} cases to {output_csv_path}")
    
    # Save JSON
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(records)} cases to {output_json_path}")

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    
    # We download the test.csv (3.1 MB) first for an immediate complete dataset of hundreds of real Supreme Court decisions
    raw_test_path = "data/raw_indian_legal_test.csv"
    download_file(
        "https://huggingface.co/datasets/ninadn/indian-legal/resolve/main/test.csv",
        raw_test_path
    )
    
    process_dataset(
        raw_test_path,
        "data/indian_cases_full.csv",
        "data/indian_cases_full.json"
    )
