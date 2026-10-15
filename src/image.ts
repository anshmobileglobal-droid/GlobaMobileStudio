export type Fmt='image/jpeg'|'image/png'|'image/webp';
export async function encode(bmp:ImageBitmap,mime:Fmt,quality:number,scale=1):Promise<Blob>{
 const w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')!;
 if(mime==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,w,h)} // JPEG has no alpha
 x.drawImage(bmp,0,0,w,h);
 const b=await new Promise<Blob|null>(r=>c.toBlob(r,mime,quality));
 if(!b||b.size===0||b.type!==mime)throw new Error(`this browser cannot encode ${mime}`);
 return b}
/** Largest quality under target; falls back to downscaling. met=false if unreachable. */
export async function toTarget(bmp:ImageBitmap,mime:Fmt,target:number){
 let lo=.05,hi=.95,best:Blob|null=null;
 for(let i=0;i<7;i++){const q=(lo+hi)/2,b=await encode(bmp,mime,q);if(b.size<=target){best=b;lo=q}else hi=q}
 if(best)return{blob:best,met:true};
 for(let s=.9;s>=.1;s-=.1){const b=await encode(bmp,mime,.5,s);if(b.size<=target)return{blob:b,met:true}}
 return{blob:await encode(bmp,mime,.05,.1),met:false}}
