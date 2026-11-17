import {env} from 'cloudflare:workers';
import {ASSETS,ARCHIVED_IDS} from '../../../lib/catalog';
import {download} from '../../../lib/providers';
import {applyRefresh} from '../../../lib/refresh';

export function GET(){return Response.json({ids:ASSETS.filter(a=>!ARCHIVED_IDS.includes(a.id)).map(a=>a.id),archivedIds:ARCHIVED_IDS,instructions:'POST JSON {"id":"<id>"} to this endpoint for each active series in ids sequentially. Archived historical series remain stored at their documented source edition without daily refresh. Repeat the same id while remaining > 0. Retry transient failures up to twice, then continue and report failures. Read GET /api/data afterwards to verify persisted retrieved_at, count and last_date. Source errors preserve existing data. Requires owner-private Site service access, without a browser session.'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Origin nicht erlaubt.'},{status:403});
 try{
  const text=await req.text();if(text.length>1000)return Response.json({error:'Anfrage zu groß.'},{status:413});
  const {id}=JSON.parse(text),asset=ASSETS.find(a=>a.id===id);
  if(!asset)return Response.json({error:'Unbekannte Reihe.'},{status:400});
  if(!env.DB)throw new Error('Datenbank nicht verfügbar.');
  const snapshot=await download(asset);
  return Response.json(await applyRefresh(env.DB,asset.id,snapshot),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Aktualisierung fehlgeschlagen.'},{status:502});}
}
