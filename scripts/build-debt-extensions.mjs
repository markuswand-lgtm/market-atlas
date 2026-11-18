import fs from 'node:fs/promises';
import path from 'node:path';
import {ASSETS} from '../lib/catalog.ts';
import {extendHistory} from '../lib/history-model.ts';
import {sourceSegments} from '../lib/provenance.ts';

export async function buildDebtExtensions(directory){
 const inputs=JSON.parse(await fs.readFile('data/historical-debt-inputs.json','utf8'));
 for(const [code,years] of Object.entries(inputs.series)){
  const prefix='debt-'+code.toLowerCase();
  const asset=ASSETS.find(a=>a.id===prefix+'-long');
  const currentAsset=ASSETS.find(a=>a.id===prefix+'-gdp');
  const current=JSON.parse(await fs.readFile(path.join(directory,currentAsset.id+'.json'),'utf8'));
  const proxy=Object.entries(years).map(([year,value])=>({date:year+'-12-31',value}));
  const result=extendHistory(current.rows,proxy,'annual','annual','annual',new Date().toISOString().slice(0,10));
  const {rows,...model}=result;
  const segment={from:model.modeledFrom,to:model.modeledTo,kind:'model',sourceName:asset.sourceName,sourceUrl:asset.link,frequency:'annual',method:asset.note+' Anschlussfaktor '+model.factor.toFixed(6)+' im Jahr '+model.anchorDate.slice(0,4)+'.'};
  const provenance=[segment,...sourceSegments(currentAsset,current.rows,current.sourceUrl)];
  const entry={...current,id:asset.id,name:asset.name,note:asset.note,sourceName:asset.sourceName,first:rows[0].date,count:rows.length,rows,model,provenance};
  await fs.writeFile(path.join(directory,asset.id+'.json'),JSON.stringify(entry));
 }
}
