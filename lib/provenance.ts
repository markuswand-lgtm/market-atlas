import type {Point} from './analytics.ts';
export type SourceKind='provider'|'archive'|'vendor-model'|'model';
export type SourceSegment={from:string;to:string;kind:SourceKind;sourceName:string;sourceUrl:string;frequency:string;method:string;sourceId?:string};
export const SOURCE_KINDS:Record<SourceKind,{label:string;color:string}>={provider:{label:'Anbieterwerte',color:'#79c8eb'},archive:{label:'Historische Quelle / Vorgängerreihe',color:'#82c9a6'},'vendor-model':{label:'Rückrechnung des Indexanbieters',color:'#b6a5eb'},model:{label:'Eigenes Näherungsmodell',color:'#e6b16d'}};
type SourceAsset={id:string;sourceName:string;link:string;frequency:string;note:string;historical?:boolean};
export function sourceSegments(asset:SourceAsset,rows:Point[],sourceUrl=asset.link):SourceSegment[]{
 if(!rows.length)return [];
 const sourceName=asset.id.startsWith('debt-')&&sourceUrl.includes('worldbank.org')?'IMF WEO via Weltbank Data360':asset.sourceName;
 const base={from:rows[0].date,to:rows.at(-1)!.date,kind:asset.historical?'archive' as const:'provider' as const,sourceName,sourceUrl,frequency:asset.frequency,method:asset.note,sourceId:asset.id};
 if(asset.id==='msci-world'&&base.from<'1986-03-31')return [{...base,to:base.to<'1986-03-31'?base.to:'1986-03-30',kind:'vendor-model',method:'MSCI führt die Historie vor dem Indexstart am 31.03.1986 als rückgerechnet; Anbieterwerte via Yahoo.'},...(base.to>='1986-03-31'?[{...base,from:'1986-03-31'}]:[])];
 return [base];
}
