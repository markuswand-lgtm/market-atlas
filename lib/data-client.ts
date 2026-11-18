declare const __MARKET_ATLAS_STATIC__: boolean;
import {AUTH_ENABLED,authenticatedData} from './browser-auth.ts';
export const STATIC_HOSTING=typeof __MARKET_ATLAS_STATIC__!=='undefined'&&__MARKET_ATLAS_STATIC__;
type Manifest={snapshot:string;series:unknown[];warning?:string};
let manifest:Manifest|undefined;
export function publicPath(path:string){return STATIC_HOSTING?'./'+path.replace(/^\//,''):'/'+path.replace(/^\//,'');}
async function readJson(url:string,init?:RequestInit){
 const r=await fetch(url,init);
 if(!r.headers.get('content-type')?.includes('json'))throw new Error(r.status===401?'Anmeldung abgelaufen. Bitte die App neu öffnen.':`Daten nicht verfügbar (HTTP ${r.status}). Bitte später erneut laden.`);
 const data=await r.json() as any;if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data;
}
export async function apiJson(url:string,body?:unknown){
 if(!STATIC_HOSTING)return readJson(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
 if(body)throw new Error('Die Kursdaten werden zentral durch den täglichen Download-Job aktualisiert.');
 const route=new URL(url,'https://market-atlas.invalid');
 if(route.pathname!=='/api/data')throw new Error('Unbekannter Datenabruf.');
 const id=route.searchParams.get('id');
 if(!id||!manifest){const result=AUTH_ENABLED?await authenticatedData('manifest'):await readJson(publicPath('data/manifest.json'),{cache:'no-store'});if(!/^[a-f0-9]{16}$/.test(result.snapshot)||!Array.isArray(result.series))throw new Error('Ungültiges Datenmanifest.');manifest=result;}
 if(!id)return manifest;
 if(!/^[a-z0-9-]+$/.test(id))throw new Error('Unbekannte Reihe.');
 return AUTH_ENABLED?authenticatedData(`snapshots/${manifest!.snapshot}/series/${id}`):readJson(publicPath(`data/${manifest!.snapshot}/${id}.json`));
}
