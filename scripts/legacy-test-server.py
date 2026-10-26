from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]/'dist'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.split('?')[0] in ('/','/index.html'):
   html=(ROOT/'index.html').read_text()
   html=re.sub(r'<script\b[^>]*type="module"[^>]*>.*?</script>','',html,flags=re.S)
   html=html.replace('nomodule','')
   probe='''<script>window.c47Errors=[];window.addEventListener('error',function(e){c47Errors.push(e.message)});NodeList.prototype.forEach=undefined;Object.entries=undefined;Array.prototype.flatMap=undefined;window.URL=undefined;window.URLSearchParams=undefined;window.AbortController=undefined;Element.prototype.scrollIntoView=function(){throw new Error('unsupported scrollIntoView options')};</script>'''
   html=html.replace('<head>','<head>'+probe)
   data=html.encode();self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(data)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
