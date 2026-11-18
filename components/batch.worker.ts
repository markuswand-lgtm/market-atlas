import {batchSearch} from '../lib/batch-search';
self.onmessage=event=>{
 try{
  const report=batchSearch(event.data,(name,done,total)=>self.postMessage({status:name+' · '+done+' / '+total}));
  self.postMessage({report});
 }catch(e){self.postMessage({error:(e as Error).message});}
};
