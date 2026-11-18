export type SqliteTransfer={encoding:'base64-chunks';byteLength:number;sha256:string;chunks:string[]};
export async function decodeSqliteTransfer(value:unknown):Promise<Uint8Array<ArrayBuffer>>{
 const payload=value as SqliteTransfer;
 if(!payload||payload.encoding!=='base64-chunks'||!Number.isSafeInteger(payload.byteLength)||payload.byteLength<=0||payload.byteLength>100*1024*1024||!/^[a-f0-9]{64}$/.test(payload.sha256)||!Array.isArray(payload.chunks)||!payload.chunks.length||payload.chunks.length>256)throw new Error('Datenbankformat nicht erkannt.');
 const result=new Uint8Array(payload.byteLength);let offset=0;
 for(const chunk of payload.chunks){
  if(typeof chunk!=='string'||chunk.length>1024*1024)throw new Error('Ungültiger Datenbankblock.');
  let decoded:string;try{decoded=atob(chunk);}catch{throw new Error('Ungültiger Datenbankblock.');}
  if(offset+decoded.length>result.length)throw new Error('Unvollständiger Datenbankdownload.');
  for(let i=0;i<decoded.length;i++)result[offset++]=decoded.charCodeAt(i);
 }
 if(offset!==result.length)throw new Error('Unvollständiger Datenbankdownload.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',result)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==payload.sha256)throw new Error('Die Prüfsumme der Datenbank stimmt nicht. Bitte erneut laden.');
 return result;
}
