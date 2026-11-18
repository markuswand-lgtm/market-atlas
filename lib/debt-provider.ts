import type {Point} from './analytics';
type ImfResponse={values?:Record<string,Record<string,Record<string,unknown>>>};
const cache=new Map<string,{expires:number;promise:Promise<ImfResponse>}>();
const worldBankCache=new Map<string,{expires:number;promise:Promise<{body:ImfResponse;url:string}>}>();
export function parseWorldBankImf(indicator:string,country:string,body:{count?:number;value?:Record<string,unknown>[]}):ImfResponse{
 if(!Array.isArray(body.value)||body.value.length!==body.count)throw new Error('Unvollständige World-Bank-IMF-Antwort.');
 const years:Record<string,number>={};
 for(const row of body.value){
  if(row.REF_AREA!==country||row.INDICATOR!==`IMF_WEO_${indicator}`||row.DATABASE_ID!=='IMF_WEO'||row.FREQ!=='A'||row.COMP_BREAKDOWN_1!=='V_LST')throw new Error('Unerwartete IMF-Reihe im World-Bank-Abruf.');
  if(row.UNIT_MEASURE!==(indicator==='NGDPD'?'USD':'PT_GDP')||Number(row.UNIT_MULT)!==(indicator==='NGDPD'?9:0))throw new Error('World-Bank-IMF-Einheit hat sich geändert.');
  const year=String(row.TIME_PERIOD);if(!/^\d{4}$/.test(year))continue;
  if(row.OBS_VALUE==null||String(row.OBS_VALUE).trim()==='')continue;
  const value=Number(row.OBS_VALUE);if(!Number.isFinite(value))continue;
  if(year in years)throw new Error('Mehrere IMF-Quellenstände für dasselbe Jahr.');
  // Data360 returns USD base units even though UNIT_MULT records the source's billions.
  years[year]=indicator==='NGDPD'?value/1e9:value;
 }
 return {values:{[indicator]:{[country]:years}}};
}
async function worldBank(indicator:string,country:string){
 const key=indicator+'/'+country;
 if(!worldBankCache.has(key)||worldBankCache.get(key)!.expires<Date.now())worldBankCache.set(key,{expires:Date.now()+300000,promise:(async()=>{const url=new URL('https://data360api.worldbank.org/data360/data');url.search=new URLSearchParams({DATABASE_ID:'IMF_WEO',INDICATOR:`IMF_WEO_${indicator}`,REF_AREA:country,COMP_BREAKDOWN_1:'V_LST'}).toString();const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`World Bank IMF HTTP ${r.status}`);return {url:String(url),body:parseWorldBankImf(indicator,country,await r.json() as any)};})().catch(e=>{worldBankCache.delete(key);throw e;})});
 return worldBankCache.get(key)!.promise;
}
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
  if(!cache.has(id)||cache.get(id)!.expires<Date.now())cache.set(id,{expires:Date.now()+300000,promise:(async()=>{const r=await fetch(`https://www.imf.org/external/datamapper/api/v2/${id}`,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`IMF HTTP ${r.status}`);return await r.json() as ImfResponse;})()});
  return cache.get(id)!.promise;
 }
 let body:ImfResponse,gdp:ImfResponse|undefined,url=`https://www.imf.org/external/datamapper/api/v2/${indicator}/${country}`;
 try{body=await get(indicator);gdp=requested==='DEBT_USD'?await get('NGDPD'):undefined;}
 catch(e){
  // Data360 officially redistributes WEO countries, but not the IMF world aggregate or HPDD.
  if(indicator==='DEBT1'||country==='WEOWORLD')throw e;
  const alternate=await worldBank(indicator,country);body=alternate.body;url=alternate.url;
  gdp=requested==='DEBT_USD'?(await worldBank('NGDPD',country)).body:undefined;
 }
 const rows=parseImfDebt(indicator,country,body,gdp);
 if(!rows.length)throw new Error(`Keine historischen IMF-Daten für ${country}.`);
 return {rows,url,retrievedAt:new Date().toISOString()};
}
