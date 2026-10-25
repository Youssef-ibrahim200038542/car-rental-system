
from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = DATA_DIR / "dataset_report.txt"

if not DATA_DIR.exists():
    raise FileNotFoundError(f"Data folder not found: {DATA_DIR}")

csv_files = sorted(DATA_DIR.glob("*.csv"))

if not csv_files:
    raise FileNotFoundError(f"No CSV files found in: {DATA_DIR}")

report = []

for file in csv_files:
    print(f"Inspecting {file.name}...")

    try:
        df = pd.read_csv(file, low_memory=False)

        report.append("=" * 80)
        report.append(f"FILE: {file.name}")
        report.append(f"ROWS: {len(df)}")
        report.append(f"COLUMNS: {len(df.columns)}")
        report.append(f"COLUMN NAMES: {list(df.columns)}")
        report.append("\nDATA TYPES:")
        report.append(df.dtypes.to_string())
        report.append("\nMISSING VALUES:")
        report.append(df.isna().sum().to_string())
        report.append("\nDUPLICATE ROWS:")
        report.append(str(df.duplicated().sum()))
        report.append("\nSAMPLE ROWS:")
        report.append(df.head(3).to_string(index=False))
        report.append("")

    except Exception as exc:
        report.append("=" * 80)
        report.append(f"FILE: {file.name}")
        report.append(f"ERROR: {exc}")
        report.append("")

OUTPUT_FILE.write_text("\n".join(report), encoding="utf-8")

print(f"\nFinished! Inspected {len(csv_files)} CSV files.")
print(f"Report saved to: {OUTPUT_FILE}")
