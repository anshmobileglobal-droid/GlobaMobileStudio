"""E2E checks against the production build (vite preview). Run: npm run build && python3 e2e/e2e.py"""
import subprocess,time,random,sys,os,json,urllib.request
from PIL import Image
from playwright.sync_api import sync_playwright
os.makedirs('/tmp/e2e',exist_ok=True)
random.seed(1)
# transparent-corner PNG, plus a noisy JPG that compresses poorly
png=Image.new('RGBA',(400,300),(0,0,0,0));[png.putpixel((x,y),(x%256,y%256,128,255)) for x in range(50,350) for y in range(50,250)];png.save('/tmp/e2e/t.png')
n=Image.new('RGB',(800,600));n.putdata([(random.randrange(256),random.randrange(256),random.randrange(256)) for _ in range(480000)]);n.save('/tmp/e2e/noise.jpg',quality=95)
open('/tmp/e2e/bad.png','w').write('not an image')
srv=subprocess.Popen(['npx','vite','preview','--port','4173'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(3)
R=[]
def go(pg,label):
    old=pg.evaluate("document.querySelector('a.dl')?.href||''")
    pg.get_by_role('button',name=label).click()
    pg.wait_for_function("old=>{const a=document.querySelector('a.dl');return a&&a.href!==old}",arg=old)
def check(name,ok,info=''):R.append(ok);print(('PASS' if ok else 'FAIL'),name,info)
def blob_info(page):
    return page.evaluate("""async()=>{const a=document.querySelector('a.dl');const b=await (await fetch(a.href)).blob();const u=new Uint8Array(await b.arrayBuffer());
      const bm=await createImageBitmap(b);const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.drawImage(bm,0,0);
      return{type:b.type,size:b.size,head:Array.from(u.slice(0,12)),name:a.download,corner:Array.from(x.getImageData(2,2,1,1).data),w:bm.width}}""")
try:
  with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context();pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:4173/');check('home renders brand',pg.get_by_role('heading',name='@Create Global Mobile Studio').is_visible())
    pg.get_by_role('button',name='Tools').click();pg.get_by_role('button',name='Image Converter').click()
    # convert PNG->WEBP
    pg.set_input_files('input[type=file]','/tmp/e2e/t.png');go(pg,'Convert')
    i=blob_info(pg);check('PNG->WEBP is real WebP',bytes(i['head'][:4])==b'RIFF' and bytes(i['head'][8:12])==b'WEBP' and i['name']=='t.webp',str(i['size']))
    check('WEBP keeps transparency',i['corner'][3]==0,str(i['corner']))
    # PNG->PNG
    pg.select_option('select','image/png');go(pg,'Convert')
    i=blob_info(pg);check('PNG->PNG real PNG + transparent',bytes(i['head'][1:4])==b'PNG' and i['corner'][3]==0)
    # PNG->JPG
    pg.select_option('select','image/jpeg');go(pg,'Convert')
    i=blob_info(pg);check('PNG->JPG real JPEG, flattened white',i['head'][:3]==[255,216,255] and i['corner'][:3]==[255,255,255],str(i['corner']))
    # resize
    pg.locator('input[type=range]').nth(1).fill('50');go(pg,'Convert')
    check('resize 50% halves width',blob_info(pg)['w']==200)
    # bad file reports failure, batch continues
    pg.set_input_files('input[type=file]',['/tmp/e2e/bad.png','/tmp/e2e/t.png']);pg.get_by_role('button',name='Convert').click();pg.wait_for_selector('.err')
    check('corrupt file -> accurate error, other file still ok',pg.locator('.results li').count()==2 and pg.locator('.err').first.inner_text().startswith('Failed') and pg.locator('a.dl').count()==1)
    # compress target size
    pg.get_by_role('button',name='Back').click();pg.get_by_role('button',name='Image Compressor').click()
    pg.set_input_files('input[type=file]','/tmp/e2e/noise.jpg');pg.fill('input[type=number]','60');go(pg,'Compress')
    i=blob_info(pg);check('target 60 KB reached',i['size']<=60*1024 and i['name']=='noise-compressed.jpg',f"{i['size']} B")
    pg.fill('input[type=number]','1');pg.get_by_role('button',name='Compress').click();pg.wait_for_selector('.results .err')
    check('unreachable target is reported honestly',pg.locator('.results').inner_text().find('Could not reach 1 KB')>=0)
    # settings theme persists
    pg.get_by_role('button',name='Settings').click();pg.select_option('select','light');pg.reload()
    check('light theme persists',pg.evaluate("document.documentElement.dataset.theme")=='light')
    # PWA: manifest, icons, SW, offline
    m=json.load(urllib.request.urlopen('http://localhost:4173/manifest.webmanifest'))
    ok=all(urllib.request.urlopen('http://localhost:4173/'+ic['src']).status==200 for ic in m['icons']) and m['display']=='standalone'
    check('manifest valid, icons 200',ok)
    pg.evaluate("navigator.serviceWorker.ready.then(()=>1)");time.sleep(1.5);pg.reload();time.sleep(1)
    ctx.set_offline(True);pg.reload();check('works offline after first load',pg.get_by_role('heading',name='Settings').is_visible() or pg.get_by_role('button',name='Home').is_visible())
    pg.get_by_role('button',name='Tools').click();pg.get_by_role('button',name='Image Converter').click();pg.set_input_files('input[type=file]','/tmp/e2e/t.png');go(pg,'Convert')
    check('conversion works offline',True)
    check('no uncaught page errors',not errs,str(errs));b.close()
finally:srv.terminate()
print(f"{sum(R)}/{len(R)} passed");sys.exit(0 if all(R) else 1)
