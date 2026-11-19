import {jointSearch} from '../lib/joint-search';
self.onmessage=e=>{try{self.postMessage({report:jointSearch(e.data,status=>self.postMessage({status}))});}catch(error){self.postMessage({error:(error as Error).message});}};
