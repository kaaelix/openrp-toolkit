import urllib.request
import re
import json

with open('/root/.openrp_mcp_auth.json') as f:
    auth = json.load(f)

headers = {'Authorization': f'Bearer {auth["token"]}', 'User-Agent': 'Mozilla/5.0'}
html = urllib.request.urlopen(urllib.request.Request('https://openrp.ai', headers=headers)).read().decode('utf-8')
chunks = re.findall(r'src="([^"]+\.js)"', html)

print(f'Starting deep scraper across {len(chunks)} JS chunks...')

routes = set()

for c in chunks:
    u = 'https://openrp.ai' + c if c.startswith('/') else c
    try:
        content = urllib.request.urlopen(urllib.request.Request(u, headers=headers)).read().decode('utf-8', errors='ignore')
        
        # Search for all API routes
        for m in re.finditer(r'/api/[a-zA-Z0-9_/\[\]-]+', content):
            r = m.group(0)
            if any(k in r for k in ['user', 'world', 'character', 'prompt', 'lore', 'behavior']):
                routes.add(r)
                
        # Search for mutation function names / actions
        for kw in ['Prompt', 'Character', 'World', 'prompts', 'characters', 'worlds']:
            for m in re.finditer(rf'["\'](/api/[^"\']*{kw}[^"\']*)["\']', content, re.IGNORECASE):
                routes.add(m.group(1))
    except Exception as e:
        pass

print('\n=== ALL DISCOVERED REST API ROUTES ===')
for r in sorted(routes):
    print('  ', r)

