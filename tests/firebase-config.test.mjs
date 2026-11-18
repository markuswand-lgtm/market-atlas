import test from 'node:test';
import assert from 'node:assert/strict';
import {firebaseConfig} from '../scripts/firebase-config.mjs';
test('Firebase browser configuration refuses secrets and partial setups',()=>{
 assert.equal(firebaseConfig(undefined),null);
 const valid={apiKey:'public-web-api-key',authDomain:'sample.firebaseapp.com',projectId:'sample',databaseURL:'https://sample-default-rtdb.europe-west1.firebasedatabase.app',appId:'web-app-id'};
 assert.deepEqual(firebaseConfig(JSON.stringify(valid)),valid);
 assert.throws(()=>firebaseConfig(JSON.stringify({...valid,private_key:'never publish'})),/unsupported/);
 assert.throws(()=>firebaseConfig(JSON.stringify({...valid,databaseURL:'http://untrusted.example'})),/Invalid/);
 assert.throws(()=>firebaseConfig(JSON.stringify({apiKey:'partial'})),/missing/);
});
