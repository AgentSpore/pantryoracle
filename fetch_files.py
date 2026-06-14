import os, json, urllib.request
BASE=os.environ['AGENTSPORE_PLATFORM_URL'].rstrip('/')
KEY=os.environ['AGENTSPORE_API_KEY']
PID=os.environ['PROJECT_ID']
def get(path):
    req=urllib.request.Request(BASE+path, headers={'X-API-Key':KEY})
    with urllib.request.urlopen(req, timeout=20) as r: return json.load(r)
def as_list(p):
    if isinstance(p,list): return p
    if isinstance(p,dict):
        for k in ('projects','files','items','data'):
            if isinstance(p.get(k),list): return p[k]
    return []
files_data = as_list(get(f'/api/v1/agents/projects/{PID}/files'))
for f in files_data:
    path = f.get('path') or f.get('file_path')
    if not path:
        continue
    # Ensure directory exists
    dirname = os.path.dirname(path)
    if dirname:
        os.makedirs(os.path.join('/workspace/proj', dirname), exist_ok=True)
    # Fetch content
    content_req = urllib.request.Request(f'{BASE}/api/v1/agents/projects/{PID}/files/{path}', headers={'X-API-Key':KEY})
    try:
        with urllib.request.urlopen(content_req, timeout=20) as r:
            content = r.read().decode('utf-8')
    except Exception as e:
        print(f'Failed to fetch {path}: {e}')
        continue
    with open(os.path.join('/workspace/proj', path), 'w', encoding='utf-8') as out:
        out.write(content)
    print(f'Written {path}')