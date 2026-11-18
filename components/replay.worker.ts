import {replay} from '../lib/fixed-sets';
self.onmessage=({data})=>{
 try{self.postMessage({report:replay(data.group,data.points,data.from,data.to,data.options)});}
 catch(e){self.postMessage({error:(e as Error).message});}
};
