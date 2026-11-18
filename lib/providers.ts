import type {Asset} from './catalog.ts';
import {sourceUrl} from './catalog.ts';
import {cleanPoints,type Point} from './analytics.ts';
import {parseEiaHistory,parseShiller,shillerDownloadUrl} from './history-providers.ts';
import {downloadImfDebt} from './debt-provider.ts';
export function parseCsv(text:string){const rows:string[][]=[];let row:string[]=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}if(quoted)throw new Error('Ungültige CSV-Anführungszeichen.');return rows;}
export function parseSource(a:Asset,text:string):Point[]{
 let rows:Point[]=[];
 if(a.provider==='eia-history')rows=parseEiaHistory(text);
 else if(a.provider==='yahoo'){const body=JSON.parse(text);const r=body.chart?.result?.[0];if(!r||r.meta?.dataGranularity!=='1d')throw new Error('Anbieter liefert keine Tageshistorie.');const close=r.indicators?.quote?.[0]?.close;if(!Array.isArray(close)||!Array.isArray(r.timestamp))throw new Error('Kursformat nicht erkannt.');rows=r.timestamp.flatMap((t:number,i:number)=>typeof close[i]==='number'?[{date:new Date((t+(r.meta.gmtoffset||0))*1000).toISOString().slice(0,10),value:close[i]}]:[]);}
 else{const csv=parseCsv(text),header=csv.shift()||[];const di=header.indexOf(a.provider==='ecb'?'TIME_PERIOD':'observation_date'),vi=header.indexOf(a.provider==='ecb'?'OBS_VALUE':a.series);if(di<0||vi<0)throw new Error('Quelle liefert keine passende CSV-Tabelle.');rows=csv.flatMap(r=>{const value=r[vi]?.trim();if(!value||value==='.'||!Number.isFinite(Number(value)))return [];const date=r[di]?.trim();return [{date:date?.length===7?date+'-01':date,value:Number(value)*(a.scale??1)}];});}
 const clean=cleanPoints(rows).filter(p=>p.date<=new Date().toISOString().slice(0,10));if(!clean.length)throw new Error('Quelle enthält keine gültigen Beobachtungen.');return clean;
}
let shillerCache:{expires:number;promise:Promise<{bytes:Uint8Array;url:string;retrievedAt:string}>}|undefined;
async function sourceFetch(url:string){const r=await fetch(url,{headers:{Accept:'*/*','User-Agent':'MarketAtlas/0.3 (historical research)'},signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error(`Datenquelle antwortet mit HTTP ${r.status}.`);if(Number(r.headers.get('content-length'))>20_000_000)throw new Error('Quelldatei überschreitet 20 MB.');return r;}
export async function download(a:Asset){
 if(a.provider==='imf')return downloadImfDebt(a.series);
 if(a.provider==='archive')throw new Error('Geprüftes PDF-Archiv. Erneuter Import über scripts/download-gold-history.py; der gespeicherte Bestand bleibt erhalten.');
 if(a.provider==='shiller'){
  if(!shillerCache||shillerCache.expires<Date.now()){const promise=(async()=>{const html=await (await sourceFetch(sourceUrl(a))).text();const url=shillerDownloadUrl(html),bytes=new Uint8Array(await (await sourceFetch(url)).arrayBuffer());if(bytes.length>20_000_000)throw new Error('Quelldatei überschreitet 20 MB.');return {url,bytes,retrievedAt:new Date().toISOString()};})();shillerCache={expires:Date.now()+300000,promise};}
  try{const s=await shillerCache.promise;return {url:s.url,retrievedAt:s.retrievedAt,rows:parseShiller(s.bytes,a.series as 'P'|'CPI')};}catch(e){shillerCache=undefined;throw e;}
 }
 const url=sourceUrl(a),text=await (await sourceFetch(url)).text();if(text.length>20_000_000)throw new Error('Quelldatei überschreitet 20 MB.');return {rows:parseSource(a,text),url,retrievedAt:new Date().toISOString()};
}
