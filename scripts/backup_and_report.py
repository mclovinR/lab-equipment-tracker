"""Back up the Lab Equipment Tracker database and generate a usage report.

Usage (with the containers running):
    python scripts/backup_and_report.py              # backup + report
    python scripts/backup_and_report.py --report-only
    python scripts/backup_and_report.py --backup-only

By default the script talks to Postgres inside the Docker container.
Use --local to call a psql/pg_dump installed on this machine instead
(it reads the DATABASE_URL environment variable).

Only the Python standard library is used, so there is nothing to install.
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKUP_DIR = ROOT / "backups"
REPORT_DIR = ROOT / "reports"

# One row per equipment: how many active reservations it has and how many hours they add up to.
# LEFT JOIN keeps equipment that was never reserved (it appears with 0).
USAGE_QUERY = """
SELECT e.id,
       e.name,
       e.category,
       e.status,
       COUNT(r.id)                                                        AS reservations,
       COALESCE(ROUND(SUM(EXTRACT(EPOCH FROM (r.ends_at - r.starts_at))) / 3600, 2), 0) AS hours
FROM equipment e
LEFT JOIN reservations r
       ON r.equipment_id = e.id
      AND r.status = 'active'
GROUP BY e.id, e.name, e.category, e.status
ORDER BY hours DESC, e.id
"""

CSV_HEADER = ["equipment_id", "name", "category", "status", "reservations", "reserved_hours"]


@dataclass
class UsageRow:
    equipment_id: int
    name: str
    category: str
    status: str
    reservations: int
    reserved_hours: float


class Database:
    """Runs psql / pg_dump either inside the Docker container or on this machine."""

    def __init__(self, local: bool) -> None:
        self.local = local
        self.database_url = os.environ.get("DATABASE_URL", "postgres://lab:lab@localhost:5432/labtracker")

    def _command(self, tool: str, *args: str) -> list[str]:
        if self.local:
            return [tool, self.database_url, *args]
        return ["docker", "compose", "exec", "-T", "db", tool, "-U", "lab", "-d", "labtracker", *args]

    def query(self, sql: str) -> list[list[str]]:
        # -A unaligned, -t tuples only, -F a separator that will not appear in names.
        cmd = self._command("psql", "-A", "-t", "-F", "\t", "-c", sql)
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, check=True)
        return [line.split("\t") for line in result.stdout.strip().splitlines() if line]

    def dump(self, target: Path) -> None:
        cmd = self._command("pg_dump")
        with target.open("w", encoding="utf-8") as fh:
            subprocess.run(cmd, cwd=ROOT, stdout=fh, check=True)


def parse_rows(raw: list[list[str]]) -> list[UsageRow]:
    return [
        UsageRow(
            equipment_id=int(row[0]),
            name=row[1],
            category=row[2],
            status=row[3],
            reservations=int(row[4]),
            reserved_hours=float(row[5]),
        )
        for row in raw
    ]


def backup(db: Database) -> Path:
    BACKUP_DIR.mkdir(exist_ok=True)
    target = BACKUP_DIR / f"labtracker_{datetime.now():%Y%m%d_%H%M%S}.sql"
    db.dump(target)
    return target


def write_csv(rows: list[UsageRow], target: Path) -> None:
    with target.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(CSV_HEADER)
        for r in rows:
            writer.writerow([r.equipment_id, r.name, r.category, r.status, r.reservations, r.reserved_hours])


def print_summary(rows: list[UsageRow]) -> None:
    total_reservations = sum(r.reservations for r in rows)
    total_hours = sum(r.reserved_hours for r in rows)
    print(f"\n{'Equipment':<32} {'Reservations':>12} {'Hours':>8}")
    print("-" * 54)
    for r in rows:
        print(f"{r.name[:32]:<32} {r.reservations:>12} {r.reserved_hours:>8.2f}")
    print("-" * 54)
    print(f"{'TOTAL':<32} {total_reservations:>12} {total_hours:>8.2f}")
    unused = [r.name for r in rows if r.reservations == 0]
    if unused:
        print(f"\nNever reserved: {', '.join(unused)}")


def report(db: Database) -> Path:
    REPORT_DIR.mkdir(exist_ok=True)
    rows = parse_rows(db.query(USAGE_QUERY))
    target = REPORT_DIR / f"usage_{datetime.now():%Y%m%d}.csv"
    write_csv(rows, target)
    print_summary(rows)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Back up the database and build a usage report.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--backup-only", action="store_true", help="only create the database backup")
    group.add_argument("--report-only", action="store_true", help="only create the usage report")
    parser.add_argument("--local", action="store_true", help="use local psql/pg_dump instead of Docker")
    args = parser.parse_args()

    db = Database(local=args.local)
    try:
        if not args.report_only:
            print(f"Backup saved to {backup(db)}")
        if not args.backup_only:
            print(f"\nReport saved to {report(db)}")
    except FileNotFoundError as exc:
        print(f"Command not found: {exc.filename}. Is Docker (or psql, with --local) installed?", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() if exc.stderr else ""
        print(f"Database command failed. Are the containers running? (docker compose up -d)\n{detail}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
