import {describe,it,expect} from 'vitest';import {fmtBytes,outName,savings} from './format';
describe('format',()=>{
 it('formats bytes',()=>{expect(fmtBytes(512)).toBe('512 B');expect(fmtBytes(2048)).toBe('2.0 KB');expect(fmtBytes(3*1048576)).toBe('3.00 MB')});
 it('names outputs',()=>{expect(outName('photo.final.PNG','image/webp')).toBe('photo.final.webp');expect(outName('a.jpg','image/jpeg','-compressed')).toBe('a-compressed.jpg');expect(outName('.png','image/png')).toBe('image.png')});
 it('computes real savings incl. negative',()=>{expect(savings(1000,250)).toBe(75);expect(savings(1000,1200)).toBe(-20);expect(savings(0,5)).toBe(0)});
});
