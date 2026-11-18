import type {Point} from './analytics';
type ImfResponse={values?:Record<string,Record<string,Record<string,unknown>>>};
const cache=new Map<string,{expires:number;promise:Promise<ImfResponse>}>();
export function parseImfDebt(indicator:string,country:string,body:ImfResponse,gdp?:ImfResponse,now=new Date()):Point[]{
 const values=body.values?.[indicator]?.[country];
 if(!values||typeof values!=='object')throw new Error(`IMF-Reihe fehlt: ${indicator}/${country}`);
 const cutoff=now.getUTCFullYear();
 return Object.entries(values).flatMap(([year,value])=>{
  if(!/^\d{4}$/.test(year)||+year>=cutoff||typeof value!=='number'||!Number.isFinite(value)||value<0)return [];
  if(gdp){const nominal=gdp.values?.NGDPD?.[country]?.[year];if(typeof nominal!=='number'||!Number.isFinite(nominal)||nominal<=0)return [];value=value*nominal/100;}
  return [{date:year+'-12-31',value:value as number}];
 }).sort((a,b)=>a.date.localeCompare(b.date));
}
export async function downloadImfDebt(series:string){
 const [requested,country]=series.split('/');
 if(!['GGXWDG_NGDP','DEBT_USD','DEBT1'].includes(requested)||!country)throw new Error('Unbekannte IMF-Reihe.');
 const indicator=requested==='DEBT_USD'?'GGXWDG_NGDP':requested;
 async function get(id:string){
  if(!cache.has(id)||cache.get(id)!.expires<Date.now())cache.set(id,{expires:Date.now()+300000,promise:(async()=>{const r=await fetch(`https://www.imf.org/external/datamapper/api/v1/${id}`,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`IMF HTTP ${r.status}`);return await r.json() as ImfResponse;})().catch(e=>{cache.delete(id);throw e;})});
  return cache.get(id)!.promise;
 }
 const body=await get(indicator),gdp=requested==='DEBT_USD'?await get('NGDPD'):undefined;
 const rows=parseImfDebt(indicator,country,body,gdp);
 if(!rows.length)throw new Error(`Keine historischen IMF-Daten für ${country}.`);
 return {rows,url:`https://www.imf.org/external/datamapper/api/v1/${indicator}/${country}`,retrievedAt:new Date().toISOString()};
}
