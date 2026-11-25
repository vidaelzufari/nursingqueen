"""Use alternative French Wikimedia page photos for catalogue items without a reusable thumbnail."""
import json,pathlib,urllib.request,urllib.parse,concurrent.futures,re,html
R=pathlib.Path(__file__).resolve().parent.parent
rows=json.loads((R/'assets/foods/attribution.json').read_text());present={r['id'] for r in rows}
fallback={'broccoli':'Brocoli','green_bean':'Haricot vert','asparagus':'Asperge','cabbage':'Chou commun','apple':'Pomme','apricot':'Abricot','plantain':'Banane plantain','chickpea':'Pois chiche','kidney_bean':'Haricot rouge','sea_bass':'Bar commun','parsley':'Persil'}
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NursingQueenFoodCatalog/1.0'}),timeout=30).read()
def api(host,params):return json.loads(get('https://'+host+'/w/api.php?'+urllib.parse.urlencode(dict(params,format='json'))))
d=api('fr.wikipedia.org',{'action':'query','titles':'|'.join(fallback.values()),'prop':'pageimages','piprop':'thumbnail|name','pithumbsize':320,'redirects':1})['query'];aliases={x['from']:x['to'] for k in ['normalized','redirects'] for x in d.get(k,[])};pages={p['title']:p for p in d['pages'].values()};lookup={}
for key,title in fallback.items():
 for _ in range(4):title=aliases.get(title,title)
 p=pages.get(title,{})
 if key not in present and p.get('pageimage') and '/commons/' in p.get('thumbnail',{}).get('source',''):lookup[key]=p
names={p['pageimage'] for p in lookup.values()};meta=api('commons.wikimedia.org',{'action':'query','titles':'|'.join('File:'+n for n in names),'prop':'imageinfo','iiprop':'extmetadata'})['query']['pages'];metadata={p['title'][5:].replace('_',' '):p.get('imageinfo',[{}])[0].get('extmetadata',{}) for p in meta.values()}
for key,p in lookup.items():
 m=metadata.get(p['pageimage'].replace('_',' '),{});license=m.get('LicenseShortName',{}).get('value','')
 if not any(x in license.lower() for x in ['cc by','cc-by','public domain','cc0']):print('NO REUSABLE',key,license);continue
 url=p['thumbnail']['source'].split('?')[0]
 try:
  (R/f'assets/foods/{key}.jpg').write_bytes(get(url));clean=lambda s:html.unescape(re.sub('<[^>]+>','',s)).strip();rows.append({'id':key,'file':key+'.jpg','source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(p['pageimage']),'author':clean(m.get('Artist',{}).get('value','Unknown')),'license':license,'licenseUrl':m.get('LicenseUrl',{}).get('value',''),'url':url});print('ADDED',key)
 except Exception as e:print('FAILED',key,str(e))
(R/'assets/foods/attribution.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
(R/'src/assets/foodPhotos.ts').write_text('// Licensed Wikimedia food photos; see assets/foods/attribution.json.\nexport const FOOD_PHOTOS: Record<string, number> = {\n'+''.join('  '+json.dumps(r['id'])+': require("../../assets/foods/'+r['file']+'"),\n' for r in rows)+'};\n')
print('Photos',len(rows))
