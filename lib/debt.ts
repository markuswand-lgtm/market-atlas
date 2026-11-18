import type {Asset} from './catalog';

export const DEBT_COUNTRIES=[
 ['usa','USA','USA','#96b7ff'],['deu','DEU','Deutschland','#71d6b1'],
 ['chn','CHN','China','#ef97a1'],['jpn','JPN','Japan','#eaa8c0'],
 ['gbr','GBR','Großbritannien','#c3a4ff'],['fra','FRA','Frankreich','#85cfdd'],
 ['ita','ITA','Italien','#e9c571'],['ind','IND','Indien','#f1a58c'],
 ['can','CAN','Kanada','#b6c5d6'],['bra','BRA','Brasilien','#a6d788'],
 ['esp','ESP','Spanien','#d2a3d9'],['che','CHE','Schweiz','#b7cad7'],
 ['world','WEOWORLD','Welt gesamt','#faf0b3'],
] as const;
const common='Bruttoverschuldung des Gesamtstaats, jährlich. Nur abgeschlossene Kalenderjahre; auch diese können IMF-Schätzungen enthalten und revidiert werden. Laufendes Jahr und Zukunftsprognosen sind ausgeschlossen. Keine handelbare Kursreihe. Der 31. Dezember dient als Jahreszuordnung; nationale Fiskaljahre können abweichen.';
export const DEBT_ASSETS:Asset[]=DEBT_COUNTRIES.flatMap(([id,code,name,color])=>[
 {id:`debt-${id}-gdp`,name:`${name} · Staatsschulden / BIP`,symbol:`${code} % BIP`,group:'Staatsverschuldung',unit:'% des BIP',color,provider:'imf',series:`GGXWDG_NGDP/${code}`,frequency:'annual',sourceName:'IMF · World Economic Outlook',link:`https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/${code}`,note:common+(id==='world'?' Offizielles IMF-Weltaggregat; keine Summe der hier ausgewählten Länder.':'')},
 {id:`debt-${id}-usd`,name:`${name} · Staatsschulden in USD (abgeleitet)`,symbol:`${code} USD`,group:'Staatsverschuldung',unit:'Mrd. USD',color,provider:'imf',series:`DEBT_USD/${code}`,frequency:'annual',sourceName:'IMF WEO · eigene Berechnung',link:`https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/${code}`,note:common+' Näherung: Schuldenquote GGXWDG_NGDP × nominales BIP NGDPD in Mrd. USD / 100, jeweils desselben Jahres und Quellenabrufs. Jahresdurchschnitts-Wechselkurse und gerundete Quoten; kein amtlicher Schuldenbetrag zum Stichtagskurs.'+(id==='world'?' Berechnet aus dem IMF-Weltaggregat und Welt-BIP; Abdeckung gemäß WEO.':'')}
]);
for(const [id,code,name,color] of DEBT_COUNTRIES.filter(x=>x[0]==='usa'||x[0]==='deu'))DEBT_ASSETS.push({id:`debt-${id}-history`,name:`${name} · Historische Staatsschuldenquote`,symbol:`${code} HIST`,group:'Staatsverschuldung',unit:'% des BIP',color,provider:'imf',series:`DEBT1/${code}`,frequency:'annual',historical:true,sourceName:'IMF · Historical Public Debt Database',link:`https://www.imf.org/external/datamapper/DEBT1@DEBT/${code}`,note:'Historische Bruttostaatsschuldenquote aus der IMF HPDD, Archiv bis 2015. USA ab 1800, Deutschland ab 1880, mit tatsächlichen Datenlücken. Staatsgebiete, Abgrenzungen und Quellen ändern sich über die Zeit. Eigenständige Archivreihe, nicht ungeprüft mit WEO verkettet. 31. Dezember dient als Jahreszuordnung.'});
for(const [id,code,name,color] of DEBT_COUNTRIES.filter(row=>!['usa','deu'].includes(row[0]))){
 const global=id==='world';
 DEBT_ASSETS.push({id:'debt-'+id+'-long',name:name+' · Staatsschulden/BIP · Langzeitmodell',symbol:code+' LANG',group:'Staatsverschuldung',unit:'% des BIP',color,provider:'model',series:'GGXWDG_NGDP/'+code,frequency:'annual',historical:true,modeled:true,sourceName:global?'IWF HPDD × Maddison Project GDP (PPP)':'IWF Historical Public Debt Database',link:'https://www.imf.org/external/datamapper/datasets/DEBT',note:(global?'Länderschuldenquoten mit realem BIP nach Kaufkraftparität gewichtet (Maddison Project über https://ourworldindata.org/grapher/gdp-maddison-project-database). Wechselnde Stichprobe, mindestens acht Länder und 50 % des Welt-BIP. Zwischen Welt-BIP-Stützjahren geometrische Interpolation nur zur Abdeckungsprüfung.':'Historische IWF-Schuldenquoten mit wechselnder staatlicher Abgrenzung.')+' Historischen Verlauf am ersten gemeinsamen positiven Jahreswert auf das WEO-Niveau skaliert. Fehlende Schuldenjahre bleiben offen.'});
}
export const DEBT_PRESET=['debt-usa-gdp','debt-deu-gdp','debt-world-gdp'];
export function canDeflate(asset:Asset){return asset.unit!=='% des BIP';}
