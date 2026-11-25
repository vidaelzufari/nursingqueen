"""Fetch reusable Wikimedia food thumbnails and their attribution; no user data is sent."""
import json,urllib.request,urllib.parse,concurrent.futures,pathlib,time,re,html
ROOT=pathlib.Path(__file__).resolve().parent.parent
catalog=json.loads((ROOT/'src/assets/food-catalog.json').read_text())
def get(url):
 for attempt in range(3):
  try:return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NursingQueenFoodCatalog/1.0 (local asset preparation)'}),timeout=30).read()
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
def api(host,params):return json.loads(get('https://'+host+'/w/api.php?'+urllib.parse.urlencode(dict(params,format='json'))))
pages={}
for i in range(0,len(catalog),40):
 data=api('en.wikipedia.org',{'action':'query','titles':'|'.join(f['wiki'] for f in catalog[i:i+40]),'prop':'pageimages','piprop':'thumbnail|name','pithumbsize':320,'redirects':1})
 normalized={x['from']:x['to'] for key in ['normalized','redirects'] for x in data.get('query',{}).get(key,[])}
 bytitle={p['title']:p for p in data.get('query',{}).get('pages',{}).values()}
 for food in catalog[i:i+40]:
  title=food['wiki']
  for _ in range(4):title=normalized.get(title,title)
  page=bytitle.get(title,{})
  if page.get('pageimage') and '/commons/' in page.get('thumbnail',{}).get('source',''):pages[food['id']]=page
metadata={};names=list({p['pageimage'] for p in pages.values()})
for i in range(0,len(names),30):
 data=api('commons.wikimedia.org',{'action':'query','titles':'|'.join('File:'+n for n in names[i:i+30]),'prop':'imageinfo','iiprop':'extmetadata'})
 for p in data.get('query',{}).get('pages',{}).values():
  info=p.get('imageinfo',[{}])[0].get('extmetadata',{});metadata[p['title'][5:]]=info
print('Found',len(pages),'page photos;',len(metadata),'metadata entries',flush=True)
(ROOT/'artifacts/qa-2026-11-25/evidence/food-image-metadata.json').write_text(json.dumps({'pages':pages,'metadata':metadata},ensure_ascii=False))
out=ROOT/'assets/foods';out.mkdir(exist_ok=True)
def fetch(food):
 page=pages.get(food['id'])
 if not page:return None
 meta=metadata.get(page['pageimage'],metadata.get(page['pageimage'].replace('_',' '),{}));license=meta.get('LicenseShortName',{}).get('value','')
 if not any(x in license.lower() for x in ['cc by','cc-by','cc0','public domain']):return None
 url=page['thumbnail']['source'].split('?')[0];name=food['id']+'.jpg';dest=out/name
 try:
  if not dest.exists():dest.write_bytes(get(url))
  clean=lambda text:html.unescape(re.sub('<[^>]+>','',text)).strip()
  return {'id':food['id'],'file':name,'source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(page['pageimage']),'author':clean(meta.get('Artist',{}).get('value','Unknown')),'license':license,'licenseUrl':meta.get('LicenseUrl',{}).get('value',''),'url':url}
 except Exception as e:print('MISSING',food['id'],str(e),flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=[r for r in pool.map(fetch,catalog) if r]
(out/'attribution.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
code='// Wikimedia photos; full source, author and license in assets/foods/attribution.json.\nexport const FOOD_PHOTOS: Record<string, number> = {\n'+''.join('  '+json.dumps(r['id'])+': require("../../assets/foods/'+r['file']+'"),\n' for r in records)+'};\n'
(ROOT/'src/assets/foodPhotos.ts').write_text(code)
print('Downloaded',len(records),'of',len(catalog),'licensed food photos',flush=True)
