'use client';
import './data-table.css';
import {Children,cloneElement,isValidElement,useState,type ReactNode,type ReactElement} from 'react';

type Cell=ReactElement<{children?:ReactNode;checked?:boolean;'aria-sort'?:'ascending'|'descending'|'none'}>;
function elements(children:ReactNode){return Children.toArray(children).filter((n):n is Cell=>isValidElement(n));}
function words(n:ReactNode):string{
 if(typeof n==='string'||typeof n==='number')return String(n);
 if(Array.isArray(n))return n.map(words).join(' ');
 if(!isValidElement<Cell['props']>(n))return '';
 if(typeof n.props.checked==='boolean')return n.props.checked?'an':'aus';
 return words(n.props.children);
}
function value(s:string){
 const date=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
 if(date)return Date.UTC(+date[3],+date[2]-1,+date[1]);
 if(/^\d{4}-\d\d-\d\d/.test(s))return Date.parse(s.slice(0,10));
 const number=s.replace(/^[€$£]\s*/,'').match(/^[+−-]?\d[\d.]*(?:,\d+)?/);
 return number?Number(number[0].replaceAll('.','').replace(',','.').replace('−','-')):NaN;
}
const collator=new Intl.Collator('de',{numeric:true,sensitivity:'base'});
export default function DataTable({children,className}:{children:ReactNode;className?:string}){
 const [query,setQuery]=useState(''),[sort,setSort]=useState({column:-1,direction:1});
 const parts=elements(children),header=parts.find(x=>x.type==='thead'),body=parts.find(x=>x.type==='tbody');
 const headRow=elements(header?.props.children)[0],headers=elements(headRow?.props.children);
 if(!header||!body||!headRow)return <table className={className}>{children}</table>;
 const tokens=query.toLocaleLowerCase('de').trim().split(/\s+/).filter(Boolean);
 const rows=elements(body.props.children);
 const visible=tokens.length||sort.column>=0?rows.map(row=>({row,cells:elements(row.props.children).map(c=>words(c).trim())})).filter(({cells})=>tokens.every(t=>cells.join(' ').toLocaleLowerCase('de').includes(t))).sort((a,b)=>{
  if(sort.column<0)return 0;
  const x=a.cells[sort.column]||'',y=b.cells[sort.column]||'';
  const missing=(s:string)=>!s||s==='—'||s==='–';if(missing(x)||missing(y))return Number(missing(x))-Number(missing(y));
  const nx=value(x),ny=value(y);
  return sort.direction*(Number.isFinite(nx)&&Number.isFinite(ny)?nx-ny:collator.compare(x,y));
 }).map(x=>x.row):rows;
 return <><div className="table-tools"><label>Tabelle filtern <input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>{tokens.length>0&&<span>{visible.length} von {rows.length}</span>}{(query||sort.column>=0)&&<button className="quiet-button" onClick={()=>{setQuery('');setSort({column:-1,direction:1});}}>Zurücksetzen</button>}</div>
 <table className={className}>{parts.map(part=>part===header?cloneElement(header,{},cloneElement(headRow,{},headers.map((h,i)=>!words(h)?h:cloneElement(h,{'aria-sort':sort.column!==i?'none':sort.direction===1?'ascending':'descending'},<button type="button" className="sort-column" onClick={()=>setSort({column:i,direction:sort.column===i?-sort.direction:1})}>{h.props.children} <span aria-hidden="true">{sort.column===i?(sort.direction===1?'↑':'↓'):'↕'}</span></button>)))):part===body?cloneElement(body,{},visible.length?visible:<tr><td colSpan={headers.length}>Keine passenden Zeilen.</td></tr>):part)}</table></>;
}
