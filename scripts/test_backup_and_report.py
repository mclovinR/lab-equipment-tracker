"""Unit tests for the report script (standard library only).

Run with:  python -m unittest discover -s scripts
"""

import csv
import tempfile
import unittest
from pathlib import Path

from backup_and_report import CSV_HEADER, UsageRow, parse_rows, write_csv


class ParseRowsTest(unittest.TestCase):
    def test_converts_psql_text_into_typed_rows(self):
        rows = parse_rows([["2", "Raspberry Pi 5", "computing", "available", "3", "6.50"]])
        self.assertEqual(
            rows,
            [UsageRow(2, "Raspberry Pi 5", "computing", "available", 3, 6.5)],
        )

    def test_handles_equipment_with_no_reservations(self):
        rows = parse_rows([["4", "ESP32 DevKit", "microcontrollers", "available", "0", "0"]])
        self.assertEqual(rows[0].reservations, 0)
        self.assertEqual(rows[0].reserved_hours, 0.0)


class WriteCsvTest(unittest.TestCase):
    def test_writes_header_and_one_line_per_equipment(self):
        rows = [
            UsageRow(1, "Oscilloscope", "measurement", "available", 2, 4.0),
            UsageRow(2, "Raspberry Pi 5", "computing", "maintenance", 0, 0.0),
        ]
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "report.csv"
            write_csv(rows, target)
            with target.open(encoding="utf-8") as fh:
                lines = list(csv.reader(fh))

        self.assertEqual(lines[0], CSV_HEADER)
        self.assertEqual(len(lines), 3)
        self.assertEqual(lines[1], ["1", "Oscilloscope", "measurement", "available", "2", "4.0"])


if __name__ == "__main__":
    unittest.main()
