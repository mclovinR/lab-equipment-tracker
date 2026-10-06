"""Day 7 starter: back up the database and generate a CSV usage report.

Usage (with containers running):
    python scripts/backup_and_report.py

The backup part already works. The report is yours to finish (see TODO).
"""

import csv
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKUP_DIR = ROOT / "backups"
REPORT_DIR = ROOT / "reports"


def run_sql(query: str) -> list[list[str]]:
    """Runs a query inside the db container and returns rows as lists of strings."""
    result = subprocess.run(
        ["docker", "compose", "exec", "-T", "db",
         "psql", "-U", "lab", "-d", "labtracker", "-A", "-F", ",", "-t", "-c", query],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return [line.split(",") for line in result.stdout.strip().splitlines() if line]


def backup() -> Path:
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = BACKUP_DIR / f"labtracker_{stamp}.sql"
    with target.open("w", encoding="utf-8") as fh:
        subprocess.run(
            ["docker", "compose", "exec", "-T", "db", "pg_dump", "-U", "lab", "labtracker"],
            cwd=ROOT, stdout=fh, check=True,
        )
    return target


def report() -> Path:
    REPORT_DIR.mkdir(exist_ok=True)
    # TODO (day 7): once reservations exist, change this query to count
    # reservations and total reserved hours per equipment.
    rows = run_sql("SELECT id, name, category, status FROM equipment ORDER BY id")
    target = REPORT_DIR / f"equipment_{datetime.now():%Y%m%d}.csv"
    with target.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["id", "name", "category", "status"])
        writer.writerows(rows)
    return target


def main() -> int:
    try:
        print(f"Backup saved to {backup()}")
        print(f"Report saved to {report()}")
    except subprocess.CalledProcessError as exc:
        print(f"Command failed: {exc}. Are the containers running? (docker compose up -d)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
