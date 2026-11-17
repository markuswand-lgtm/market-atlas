import {read,utils} from 'xlsx';
import {cleanPoints,type Point} from './analytics.ts';

export function parseShiller(bytes:Uint8Array,field:'P'|'CPI',now=new Date()):Point[]{
 const workbook=read(bytes,{type:'array'}),sheet=workbook.Sheets.Data;
 if(!sheet)throw new Error('Shiller-Datenblatt fehlt.');
 const table=utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:true,defval:null});
 const header=table.findIndex(row=>row.includes('Date')&&row.includes('P')&&row.includes('CPI'));
 if(header<0)throw new Error('Shiller-Spalten nicht erkannt.');
 const dateColumn=table[header].indexOf('Date'),valueColumn=table[header].indexOf(field);
 const rows=table.slice(header+1).flatMap(row=>{
  const d=row[dateColumn],value=row[valueColumn];if(typeof d!=='number'||typeof value!=='number')return [];
  const year=Math.floor(d),month=Math.round((d-year)*100);
  if(year<1800||year>now.getUTCFullYear()||month<1||month>12)return [];
  return [{date:`${year}-${String(month).padStart(2,'0')}-01`,value}];
 });
 const clean=cleanPoints(rows),last=clean.at(-1)?.date;if(!last)throw new Error('Keine historischen Shiller-Werte.');
 const sourceMonth=new Date(last),currentMonth=now.toISOString().slice(0,7)+'-01';
 const cutoff=field==='CPI'?new Date(Date.UTC(sourceMonth.getUTCFullYear(),sourceMonth.getUTCMonth()-1,1)).toISOString().slice(0,10):currentMonth;
 return clean.filter(p=>p.date<cutoff&&p.date<currentMonth&&p.value>0);
}
export function parseEiaHistory(html:string,now=new Date()):Point[]{
 const clean=(s:string)=>s.replace(/<[^>]+>/g,'').replace(/&nbsp;|&#160;/g,' ').trim();
 const rows:Point[]=[];
 for(const tr of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...tr[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));
  if(cells.length!==11)continue;
  const match=cells[0].match(/^(\d{3}0)\s*\D*$/);if(!match)continue;
  const decade=Number(match[1]);
  cells.slice(1).forEach((raw,i)=>{const value=Number(raw.replace(/,/g,'')),year=decade+i;if(raw&&Number.isFinite(value)&&year>=1859&&year<now.getUTCFullYear())rows.push({date:`${year}-01-01`,value});});
 }
 const result=cleanPoints(rows);if(result[0]?.date!=='1859-01-01'||result.length<150)throw new Error('EIA-Langzeitformat oder Historienumfang nicht erkannt.');
 return result;
}
export function shillerDownloadUrl(html:string){
 const href=html.match(/href=["']([^"']*\/ie_data\.xls(?:\?[^"']*)?)["']/i)?.[1];
 if(!href)throw new Error('Shiller-Downloadlink nicht gefunden.');
 const url=new URL(href.replace(/&amp;/g,'&'),'https://shillerdata.com/');
 if(url.protocol!=='https:'||!['img1.wsimg.com','shillerdata.com','www.shillerdata.com'].includes(url.hostname))throw new Error('Unbekannter Shiller-Downloadhost.');
 return url.href;
}
