import {useEffect,useState} from 'react';import {encode,toTarget,Fmt} from './image';import {fmtBytes,outName,savings} from './format';
type Page='home'|'tools'|'convert'|'compress'|'settings';
type Res={name:string;from:number;to?:number;url?:string;out?:string;err?:string;note?:string};
const ls=(k:string,d:string)=>{try{return localStorage.getItem(k)??d}catch{return d}};
const save=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{/* storage unavailable */}};
const TOOLS=[{id:'convert' as Page,t:'Image Converter',d:'JPG, PNG, WEBP · batch · resize'},{id:'compress' as Page,t:'Image Compressor',d:'Quality or target size · real savings'}];

function ImageTool({mode,q0}:{mode:'convert'|'compress';q0:number}){
 const[files,setFiles]=useState<File[]>([]);const[fmt,setFmt]=useState<Fmt>(mode==='convert'?'image/webp':'image/jpeg');
 const[q,setQ]=useState(q0);const[scale,setScale]=useState(100);const[kb,setKb]=useState('');
 const[res,setRes]=useState<Res[]>([]);const[busy,setBusy]=useState(false);
 const run=async()=>{setBusy(true);res.forEach(r=>r.url&&URL.revokeObjectURL(r.url));const out:Res[]=[];
  for(const f of files){try{const bmp=await createImageBitmap(f);let blob:Blob,note='';
   if(mode==='compress'&&+kb>0){const t=await toTarget(bmp,fmt,+kb*1024);blob=t.blob;if(!t.met)note=`Could not reach ${kb} KB without extreme quality loss; smallest result shown.`}
   else blob=await encode(bmp,fmt,q/100,scale/100);
   bmp.close();out.push({name:f.name,from:f.size,to:blob.size,url:URL.createObjectURL(blob),out:outName(f.name,fmt,mode==='compress'?'-compressed':''),note})}
  catch(e){out.push({name:f.name,from:f.size,err:`Failed: ${(e as Error).message||'unsupported or corrupted image'}`})}}
  setRes(out);setBusy(false)};
 const lossy=fmt!=='image/png';
 return <section><h2>{mode==='convert'?'Image Converter':'Image Compressor'}</h2>
  <label className="file">Choose images<input type="file" accept="image/*" multiple onChange={e=>{setFiles([...(e.target.files??[])]);setRes([])}}/></label>
  <p className="muted">{files.length?`${files.length} file(s) selected · processed on this device, nothing is uploaded`:'Processed on this device, nothing is uploaded'}</p>
  <label>Output format<select value={fmt} onChange={e=>setFmt(e.target.value as Fmt)}><option value="image/webp">WEBP</option><option value="image/jpeg">JPG</option>{mode==='convert'&&<option value="image/png">PNG</option>}</select></label>
  {lossy&&<label>Quality: {q}%<input type="range" min="5" max="100" value={q} onChange={e=>setQ(+e.target.value)}/></label>}
  <label>Size: {scale}%<input type="range" min="10" max="100" value={scale} onChange={e=>setScale(+e.target.value)} disabled={mode==='compress'&&+kb>0}/></label>
  {mode==='compress'&&<label>Target size in KB (optional)<input type="number" min="1" inputMode="numeric" value={kb} onChange={e=>setKb(e.target.value)} placeholder="e.g. 50"/></label>}
  {fmt==='image/jpeg'&&<p className="muted">JPG has no transparency; transparent areas become white.</p>}
  <button className="primary" disabled={!files.length||busy} onClick={run}>{busy?'Working…':mode==='convert'?'Convert':'Compress'}</button>
  <ul className="results" aria-live="polite">{res.map((r,i)=><li key={i}>{r.err?<><b>{r.name}</b><span className="err">{r.err}</span></>:<><b>{r.name}</b>
   <span>{fmtBytes(r.from)} → {fmtBytes(r.to!)} ({savings(r.from,r.to!)>=0?'saved':'larger by'} {Math.abs(savings(r.from,r.to!))}%)</span>
   {r.note&&<span className="err">{r.note}</span>}<a className="dl" href={r.url} download={r.out}>Download {r.out}</a></>}</li>)}</ul></section>}

export default function App(){
 const[page,setPage]=useState<Page>('home');const[theme,setTheme]=useState(ls('theme','dark'));const[q0,setQ0]=useState(+ls('q0','80'));
 useEffect(()=>{document.documentElement.dataset.theme=theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):theme;save('theme',theme)},[theme]);
 const tab=page==='convert'||page==='compress'?'tools':page;
 return <div className="app"><main>
  {page==='home'&&<section><div className="hero"><img src="/owner.png" alt="Owner portrait (placeholder)" width="88" height="88"/><div><h1>@Create Global Mobile Studio</h1><p className="tag">Edit • Convert • Compress • Create</p><p className="muted">All in One</p></div></div>
   <p className="muted">Replace <code>public/owner.png</code> with your photo.</p>
   <div className="grid">{TOOLS.map(t=><button key={t.id} className="card" onClick={()=>setPage(t.id)}><b>{t.t}</b><span>{t.d}</span></button>)}
    <div className="card off" aria-disabled="true"><b>Global AI</b><span>Not built yet — needs the Gemini backend</span></div>
    <div className="card off" aria-disabled="true"><b>Remove BG</b><span>Not built yet</span></div></div></section>}
  {page==='tools'&&<section><h2>Tools</h2><div className="grid">{TOOLS.map(t=><button key={t.id} className="card" onClick={()=>setPage(t.id)}><b>{t.t}</b><span>{t.d}</span></button>)}</div></section>}
  {(page==='convert'||page==='compress')&&<><button className="back" onClick={()=>setPage('tools')}>← Back</button><ImageTool key={page} mode={page} q0={q0}/></>}
  {page==='settings'&&<section><h2>Settings</h2>
   <label>Theme<select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
   <label>Default quality: {q0}%<input type="range" min="5" max="100" value={q0} onChange={e=>{setQ0(+e.target.value);save('q0',e.target.value)}}/></label>
   <p className="muted">Version 0.1.0 · Phase 1. Files are processed locally and never uploaded.</p></section>}
 </main>
 <nav>{(['home','tools','settings'] as Page[]).map(p=><button key={p} className={tab===p?'on':''} onClick={()=>setPage(p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}</nav></div>}
