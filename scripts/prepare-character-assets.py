"""Rebuild the licensed character GLBs from the official Quaternius Standard ZIP.
Usage on macOS: python3 scripts/prepare-character-assets.py /path/to/archive.zip
Requires the built-in sips image optimizer; no downloaded code is executed.
"""
import json,pathlib,struct,shutil,subprocess,sys,tempfile,zipfile
work=tempfile.TemporaryDirectory(prefix='catgardens-characters-')
with zipfile.ZipFile(sys.argv[1]) as archive: archive.extractall(work.name)
src=pathlib.Path(work.name)/'Universal Base Characters[Standard]'
out=pathlib.Path(__file__).resolve().parents[1]/'public/models/characters';out.mkdir(exist_ok=True)
def pack(path,name):
 j=json.loads(path.read_text())
 # The game supplies skin, fabric and hair materials. Only eyes require bitmap textures.
 for m in j.get('materials',[]):
  if 'Eyes' not in m.get('name',''):
   m.pop('normalTexture',None)
   for key in ['baseColorTexture','metallicRoughnessTexture']:m.get('pbrMetallicRoughness',{}).pop(key,None)
 refs=[]
 for m in j.get('materials',[]):
  if 'normalTexture' in m:refs.append(m['normalTexture'])
  for key in ['baseColorTexture','metallicRoughnessTexture']:
   if key in m.get('pbrMetallicRoughness',{}):refs.append(m['pbrMetallicRoughness'][key])
 tids=sorted(set(r['index'] for r in refs));textures=[j['textures'][i] for i in tids]
 for r in refs:r['index']=tids.index(r['index'])
 iids=sorted(set(t['source'] for t in textures));images=[j['images'][i] for i in iids]
 for t in textures:t['source']=iids.index(t['source'])
 if textures:j['textures']=textures;j['images']=images
 else:j.pop('textures',None);j.pop('images',None)
 data=bytearray((path.parent/j['buffers'][0]['uri']).read_bytes())
 def append(b):
  while len(data)%4:data.append(0)
  start=len(data);data.extend(b);j['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(b)});return len(j['bufferViews'])-1
 # Embedded, reduced-size textures keep each avatar inexpensive on iPhones.
 for i,im in enumerate(j.get('images',[])):
  p=path.parent/im.pop('uri');tmp=pathlib.Path(work.name)/('cg-'+name+'-'+str(i)+'.png')
  if not p.exists(): p=p.with_name(p.name.replace('_png.png','.png'))
  subprocess.run(['sips','-Z','512',str(p),'--out',str(tmp)],stdout=subprocess.DEVNULL,check=True)
  im['bufferView']=append(tmp.read_bytes());im['mimeType']='image/png'
 j['buffers']=[{'byteLength':len(data)}]
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);data+=b'\x00'*((-len(data))%4)
 b=struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data
 (out/(name+'.glb')).write_bytes(b);print(name,len(b))
for sex in ['Female','Male']: pack(src/'Base Characters/Godot - UE'/f'Superhero_{sex}_FullBody.gltf',sex.lower())
for name in ['Long','Buns','BuzzedFemale','SimpleParted']:
 pack(src/'Hairstyles/Origin at 0/glTF (Godot)'/f'Hair_{name}.gltf','hair-'+name.lower())
shutil.copy(src/'License_Standard.txt',out/'LICENSE.txt')
