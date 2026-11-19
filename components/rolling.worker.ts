import {rollingTest} from '../lib/rolling-test';
self.onmessage=({data})=>{try{self.postMessage({report:rollingTest(data,status=>self.postMessage({status}))});}catch(e){self.postMessage({error:(e as Error).message});}};
