import json
import csv
import os
import sys

csv.field_size_limit(min(2147483647, sys.maxsize))

def json_to_csv(json_path="data/cases.json", csv_path="data/cases.csv"):
    if not os.path.exists(json_path):
        json_path = "data/sample_cases.json"
        csv_path = "data/sample_cases.csv"
        
    if not os.path.exists(json_path):
        print(f"JSON file not found at {json_path}.")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not data:
        print("No data to convert.")
        return
        
    keys = ["id", "case_name", "text", "summary"]
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys, extrasaction='ignore')
        dict_writer.writeheader()
        dict_writer.writerows(data)
        
    print(f"Successfully exported {len(data)} cases to {csv_path}!")

def csv_to_json(csv_path="data/cases.csv", json_path="data/cases.json"):
    if not os.path.exists(csv_path):
        csv_path = "data/sample_cases.csv"
        json_path = "data/sample_cases.json"
        
    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}.")
        return
        
    records = []
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            records.append({
                "id": int(row.get("id", i + 1)),
                "case_name": row.get("case_name", f"Case {i+1}"),
                "text": row.get("text", ""),
                "summary": row.get("summary", "")
            })
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully converted {len(records)} cases from CSV to {json_path}!")

if __name__ == "__main__":
    json_to_csv()
