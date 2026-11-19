import {compareRanges} from '../lib/multi-replay';
self.onmessage=({data})=>{
 try{self.postMessage(compareRanges(data.asset,data.points,data.ranges,data.group,data.options));}
 catch(e){self.postMessage({rows:[],charts:[],errors:[data.asset+' · '+(e as Error).message]});}
};
