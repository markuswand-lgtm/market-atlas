import {initializeApp,type FirebaseOptions} from 'firebase/app';
import {getAuth,signOut,type Auth} from 'firebase/auth';
import {getDatabase,get,ref,type Database} from 'firebase/database';
import {decodeSqliteTransfer} from './sqlite-transfer.ts';

declare const __MARKET_ATLAS_FIREBASE_CONFIG__:FirebaseOptions|null;
const config=typeof __MARKET_ATLAS_FIREBASE_CONFIG__==='undefined'?null:__MARKET_ATLAS_FIREBASE_CONFIG__;
export const AUTH_ENABLED=!!config;
let auth:Auth|undefined,database:Database|undefined;
export function browserAuth(){
 if(!config)throw new Error('Der Anmeldedienst ist noch nicht eingerichtet.');
 if(!auth){const app=initializeApp(config);auth=getAuth(app);auth.languageCode='de';database=getDatabase(app);}
 return auth;
}
export async function authenticatedData(path:string){
 const user=browserAuth().currentUser;
 if(!user?.emailVerified)throw new Error('Bitte anmelden und die E-Mail-Adresse bestätigen.');
 // Realtime Database rules validate the signed token on every server read.
 const result=await get(ref(database!,path));
 if(!result.exists())throw new Error('Dieser Datenstand ist noch nicht verfügbar. Bitte neu laden.');
 return result.val();
}
export async function logout(){await signOut(browserAuth());window.location.reload();}
export async function downloadDatabase(snapshot:string){
 if(!/^[a-f0-9]{16}$/.test(snapshot))throw new Error('Ungültiger Datenstand.');
 const bytes=await decodeSqliteTransfer(await authenticatedData(`snapshots/${snapshot}/sqlite`));
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.sqlite3'}));
 const a=document.createElement('a');a.href=url;a.download='market-atlas.sqlite';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
