"""Download curated Commons reference photographs and retain their attribution."""
import requests, json, re, html
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from pathlib import Path

selected = {
    'pads': ('Brake pads.JPG', 'Automotive brake pads removed from the brake assembly'),
    'rotors': ('Automobile brake pad.jpg', 'Brake disc and caliper on a car with the wheel removed'),
    'fluid': ('Brake fluid reservoir in Škoda Fabia I.jpg', 'Brake fluid reservoir in a car engine compartment'),
    'battery': ('Photo-CarBattery.jpg', 'An automotive low-voltage battery'),
    'plugs': ('Spark plug.jpg', 'A spark plug with its ceramic insulator and metal electrode'),
    'ignition': ('Ignition coil module.jpg', 'An automotive ignition coil module'),
    'charging': ('Photo-CarBattery.jpg', 'Related component: the 12-volt battery supplied by the charging system, not the converter itself'),
    'testing': ('OBD Auto Scanner connecting to the ECU.JPG', 'An automotive diagnostic scanner connected inside a car'),
}
out = Path('design/parts'); out.mkdir(parents=True, exist_ok=True)
session = requests.Session(); session.headers['User-Agent'] = 'CarraDemo/1.0 (reference photo attribution)'
session.mount('https://', HTTPAdapter(max_retries=Retry(total=2, backoff_factor=1, status_forcelist=[429,502,503], respect_retry_after_header=False)))
manifest = json.loads((out/'credits.json').read_text(encoding='utf-8')) if (out/'credits.json').exists() else {}
for kind, (title, alt) in selected.items():
    if manifest.get(kind,{}).get('title') == title and (out/(kind+'.jpg')).exists(): continue
    response = session.get('https://commons.wikimedia.org/w/api.php', params={'action':'query','titles':'File:'+title,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':640,'format':'json'}, timeout=30)
    response.raise_for_status()
    page = next(iter(response.json()['query']['pages'].values()))
    info = page['imageinfo'][0]; meta = info['extmetadata']
    clean = lambda name: html.unescape(re.sub('<[^>]+>', '', meta.get(name,{}).get('value',''))).strip()
    license = clean('LicenseShortName')
    if not (license.startswith('CC BY') or license in ['Public domain','CC0']): raise ValueError('License needs review: '+license)
    url = info.get('thumburl',info['url']).split('?')[0]
    photo = session.get(url, timeout=40); photo.raise_for_status()
    if not photo.headers.get('content-type','').startswith('image/'): raise ValueError('Not an image')
    (out / (kind+'.jpg')).write_bytes(photo.content)
    manifest[kind] = {'src':'design/parts/'+kind+'.jpg','alt':alt,'title':title,'author':clean('Artist'),'license':license,'licenseUrl':clean('LicenseUrl'),'source':info['descriptionurl'],'downloadUrl':url,'retrieved':'2026-09-19','changes':'Wikimedia thumbnail; displayed without cropping'}
    print(kind, license, len(photo.content))
for photo in manifest.values():
    if not photo['author']: photo['author'] = 'Author not listed in source metadata'
(out/'credits.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
Path('part-photos.js').write_text('window.CarraPartPhotos = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
