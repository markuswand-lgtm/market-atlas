import {buildDebtExtensions} from './build-debt-extensions.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ASSETS} from '../lib/catalog.ts';
import {extendHistory,HISTORY_MODELS} from '../lib/history-model.ts';
import {sourceSegments} from '../lib/provenance.ts';
export async function buildHistoryModels(directory='work/data'){
 for(const definition of HISTORY_MODELS){
  const asset=ASSETS.find(a=>a.id===definition.id),actualAsset=ASSETS.find(a=>a.id===definition.actual),proxyAsset=ASSETS.find(a=>a.id===definition.proxy);
  const actual=JSON.parse(await fs.readFile(path.join(directory,definition.actual+'.json'),'utf8')),proxy=JSON.parse(await fs.readFile(path.join(directory,definition.proxy+'.json'),'utf8'));
  const result=extendHistory(actual.rows,proxy.rows,actualAsset.frequency,proxyAsset.frequency,definition.frequency,new Date().toISOString().slice(0,10));
  const method=`Näherungsmodell: ältere Werte aus ${proxyAsset.name}, multipliziert mit ${result.factor.toPrecision(10)}. Anker ${result.anchorDate}: Anbieter ${result.anchorActual}, Vergleich ${result.anchorProxy}. Unterstellt gleiche relative Entwicklung wie die Vergleichsreihe. Keine rekonstruierten Originalkurse; Unterschiede in Ländern, Zusammensetzung, Währung, Mittelwerten und Kontrakten bleiben bestehen.`;
  const provenance=[{from:result.modeledFrom,to:result.modeledTo,kind:'model',sourceName:proxyAsset.sourceName+' · eigenes Modell',sourceUrl:proxy.sourceUrl,frequency:definition.frequency,sourceId:proxyAsset.id,method},...sourceSegments(actualAsset,result.rows.filter(p=>p.date>=result.observedFrom),actual.sourceUrl).map(segment=>({...segment,frequency:definition.frequency,method:segment.method+' Auf gemeinsame Monats-/Jahresfrequenz verdichtet.'}))];
  const {rows,...model}=result,entry={id:asset.id,name:asset.name,sourceName:asset.sourceName,sourceUrl:actual.sourceUrl,retrievedAt:new Date().toISOString(),frequency:asset.frequency,unit:asset.unit,first:rows[0].date,last:rows.at(-1).date,count:rows.length,note:asset.note,rows,model:{...model,actual:definition.actual,proxy:definition.proxy,actualRetrievedAt:actual.retrievedAt,proxyRetrievedAt:proxy.retrievedAt},provenance,...(actual.refreshError||proxy.refreshError?{refreshError:'Mindestens eine Modellquelle verwendet den letzten verfügbaren Stand.'}:{})};
  await fs.writeFile(path.join(directory,asset.id+'.json'),JSON.stringify(entry));console.log(`${asset.id}: ${entry.first} → ${entry.last}; Modell bis ${result.modeledTo}, Anbieter ab ${result.observedFrom}`);
 }
 await buildDebtExtensions(directory);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildHistoryModels();
