import test from 'node:test';
import assert from 'node:assert/strict';
import {strategyRanking} from '../lib/strategy-ranking.ts';
test('Count wins within each case, keep separate parameter IDs and assign shared ranks',()=>{
 function row(id,capital,gain,drawdown){return {id,name:'Variante',metrics:{capital:100+capital},benchmark:{capital:100},trades:1,exposure:0.7,halted:false,delta:{capital,gain,drawdown},wins:[capital,gain,drawdown].filter(x=>x>0).length};}
 const scores=strategyRanking([row('a',1,2,3),row('a',0,-1,2),row('b',2,0,-1),row('c',5,4,1)]);
 assert.deepEqual(scores.map(s=>[s.id,s.rank,s.capital,s.gain,s.drawdown,s.all,s.cases]),[
 ['a',1,1,1,2,1,2],['c',1,1,1,1,1,1],['b',3,1,0,0,0,1]]);
});
