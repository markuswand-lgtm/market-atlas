import {read,utils} from 'xlsx';
import {cleanPoints,type Point} from './analytics.ts';
export const PINK_SHEET_URL='https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx';
export function pinkSheetUrl(html:string){
 const links=[...html.matchAll(/https:\/\/thedocs\.worldbank\.org\/[^"'<>\s]+CMO-Historical-Data-Monthly\.xlsx/gi)].map(m=>m[0].replaceAll('&amp;','&'));
 return links[0]||PINK_SHEET_URL;
}
export function parsePinkSheet(bytes:Uint8Array,series:string,asOf=new Date().toISOString().slice(0,10)):Point[]{
 const book=read(bytes,{type:'array'}),sheet=book.Sheets['Monthly Prices'];if(!sheet)throw new Error('World Bank: Monthly Prices fehlt.');
 const rows=utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:true}),header=rows.findIndex(r=>r.includes(series));if(header<0)throw new Error('World Bank: Preisreihe nicht gefunden: '+series);
 const column=rows[header].indexOf(series);if(series==='Silver'&&rows[header+1]?.[column]!=='($/troy oz)')throw new Error('World Bank: unerwartete Silbereinheit.');
 const result=rows.slice(header+2).flatMap(row=>{const match=String(row[0]).match(/^(\d{4})M(\d{2})$/),v=row[column];if(!match||typeof v!=='number'||!Number.isFinite(v)||v<=0)return [];const date=`${match[1]}-${match[2]}-01`;return date.slice(0,7)<asOf.slice(0,7)?[{date,value:v}]:[];});
 if(!result.length)throw new Error('World Bank: keine vollständigen Monatswerte.');return cleanPoints(result);
}
