import fs from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {initializeApp,cert,deleteApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {firebaseConfig} from './firebase-config.mjs';
const config=firebaseConfig(process.env.MARKET_ATLAS_FIREBASE_CONFIG);
if(!config){console.log('Public deployment: Firebase is not enabled.');process.exit(0);}
if(!process.env.FIREBASE_SERVICE_ACCOUNT)throw new Error('Firebase enabled but upload credential missing. Publication stopped.');
const credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if(credential.project_id!==config.projectId)throw new Error('Firebase project does not match the upload credential.');
const app=initializeApp({credential:cert(credential),databaseURL:config.databaseURL});
try{
 const directory=path.resolve('dist-static/data'),manifest=JSON.parse(await fs.readFile(path.join(directory,'manifest.json'),'utf8'));
 if(!/^[a-f0-9]{16}$/.test(manifest.snapshot)||!Array.isArray(manifest.series))throw new Error('Invalid exported manifest.');
 const series={};for(const a of manifest.series){if(!/^[a-z0-9-]+$/.test(a.id))throw new Error('Invalid series ID');series[a.id]=JSON.parse(await fs.readFile(path.join(directory,manifest.snapshot,a.id+'.json'),'utf8'));}
 const database=getDatabase(app);
 // Defense against accidentally deploying public or writable database rules.
 const rules=JSON.parse((await database.getRules()).source),expected=JSON.parse(await fs.readFile('firebase/database.rules.json','utf8'));
 if(!isDeepStrictEqual(rules,expected))throw new Error('Deploy and verify the committed Firebase access rules before publication.');
 const sqliteBase64=(await fs.readFile(path.join(directory,'market-atlas.sqlite'))).toString('base64');
 // Publish an entire snapshot and its manifest in one atomic server operation.
 const history=(await database.ref('_publicationHistory').get()).val()||{};
 const retained=Object.entries(history).filter(([id])=>/^[a-f0-9]{16}$/.test(id)&&id!==manifest.snapshot).sort((a,b)=>String(b[1]).localeCompare(String(a[1]))).slice(0,2);
 const nextHistory=Object.fromEntries([...retained,[manifest.snapshot,manifest.publishedAt]]);
 const changes={['snapshots/'+manifest.snapshot]:{series,sqliteBase64},manifest,_publicationHistory:nextHistory};
 for(const id of Object.keys(history))if(/^[a-f0-9]{16}$/.test(id)&&!nextHistory[id])changes['snapshots/'+id]=null;
 await database.ref().update(changes);
 // GitHub Pages must receive no public copy of the protected data.
 const expectedDirectory=path.join(process.cwd(),'dist-static','data');
 if(directory!==expectedDirectory)throw new Error('Unexpected data output directory.');
 await fs.rm(directory,{recursive:true,force:true});
 console.log(`Protected snapshot published: ${manifest.series.length} series. Public data files removed from Pages output.`);
}finally{await deleteApp(app);}
