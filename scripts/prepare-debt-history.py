"""Recreate the historical inputs with IMF HPDD and Maddison Project real GDP (PPP)."""
import csv
import json
import sys
from pathlib import Path

hpdd = json.loads(Path(sys.argv[1]).read_text())["values"]["DEBT1"]
codes = "GBR CHN FRA ITA JPN CAN BRA ESP CHE IND".split()
series = {code: hpdd[code] for code in codes}
weights = {}
world = {}
with Path(sys.argv[2]).open(encoding="utf-8-sig") as source:
    for row in csv.DictReader(source):
        code, year = row["Code"], row["Year"]
        if not row["GDP"] or int(year) > 2015:
            continue
        gdp = float(row["GDP"])
        if code == "OWID_WRL":
            world[year] = gdp
        elif len(code) == 3 and year in hpdd.get(code, {}) and gdp > 0:
            weights.setdefault(year, []).append((gdp, hpdd[code][year]))
series["WORLD"] = {}
coverage = {}
benchmarks = sorted(map(int, world))
for left, right in zip(benchmarks, benchmarks[1:]):
    for year in range(left+1, right):
        fraction = (year-left)/(right-left)
        world[str(year)] = world[str(left)]*(world[str(right)]/world[str(left)])**fraction
for year, entries in sorted(weights.items()):
    total = sum(gdp for gdp, _ in entries)
    share = total / world[year] if world.get(year) else 0
    if len(entries) >= 8 and 0.5 <= share <= 1.01:
        series["WORLD"][year] = round(sum(gdp * ratio for gdp, ratio in entries) / total, 6)
        coverage[year] = [len(entries), round(share, 4)]
Path("data/historical-debt-inputs.json").write_text(json.dumps({"series": series, "coverage": coverage},separators=(",", ":")))
