"""Download the reviewed NMA gold table. Run: python -m pip install pypdf; python scripts/download-gold-history.py.
Raw data stay under ignored work/data. A changed PDF edition requires human visual review.
"""
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from hashlib import sha256
from io import BytesIO
import re, json, csv
from pypdf import PdfReader

url='https://nma.org/wp-content/uploads/2024/01/his_gold_prices_1833_pres_2024.pdf'
data=urlopen(Request(url, headers={'User-Agent':'MarketAtlas/0.3 (historical research)'}), timeout=45).read(20_000_001)
if len(data)>20_000_000: raise ValueError('Source exceeds20MB')
text='\n'.join(page.extract_text() for page in PdfReader(BytesIO(data)).pages)
rows=[{'date':f'{year}-01-01','value':float(value.replace(',',''))} for year,value in re.findall(r'(?<!\d)((?:18|19|20)\d{2})\*?\*?\s+([\d,]+\.\d+)',text) if 1850<=int(year)<=2024]
rows.sort(key=lambda row:row['date'])
if [r['date'] for r in rows]!=[f'{year}-01-01' for year in range(1850,2025)]:raise ValueError('PDF structure changed; review original table visually before importing.')
if next(r['value'] for r in rows if r['date']=='1890-01-01')!=18.94:raise ValueError('Reference value changed; source review required.')
out=Path('work/data');out.mkdir(parents=True,exist_ok=True)
payload={'id':'gold-historical','name':'Gold · Jahresmittel ab1850','frequency':'annual','unit':'USD/Feinunze','sourceUrl':url,'sourceName':'National Mining Association','retrievedAt':datetime.now(timezone.utc).isoformat(),'sourceSha256':sha256(data).hexdigest(),'first':rows[0]['date'],'last':rows[-1]['date'],'count':len(rows),'note':'London annual averages inUSD; reviewed2024edition.1833–49aggregate excluded. Source outliers retained. Jan1is a plotting key. Private research; no public redistribution license identified.','rows':rows}
(out/'gold-historical-source.pdf').write_bytes(data)
(out/'gold-historical.json').write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
with (out/'gold-historical.csv').open('w',newline='',encoding='utf-8') as f:
 writer=csv.DictWriter(f,fieldnames=['date','value']);writer.writeheader();writer.writerows(rows)
print(f'Gold: {len(rows)} verified annual values, {rows[0]["date"]} to {rows[-1]["date"]}')
