export const fmtBytes=(n:number)=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;
export const EXT:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export const outName=(name:string,mime:string,tag='')=>`${name.replace(/\.[^.]+$/,'')||'image'}${tag}.${EXT[mime]??'bin'}`;
/** Percent saved; negative means the output is larger than the input. */
export const savings=(from:number,to:number)=>from>0?Math.round((1-to/from)*1000)/10:0;
