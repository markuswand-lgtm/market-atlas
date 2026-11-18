import {compareStrategies} from '../lib/strategy-lab';
self.onmessage=({data})=>{
 try {self.postMessage({result:compareStrategies(data.points,data.from,data.to,data.variants,data.options),error:''});}
 catch(error){self.postMessage({result:null,error:(error as Error).message});}
};
