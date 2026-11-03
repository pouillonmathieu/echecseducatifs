# Ajoute des traductions à pages.json : python3 outils/anglais/ajouter.py <section> < traductions.json
import json, sys, os
f = os.path.join(os.path.dirname(__file__), 'pages.json')
d = json.load(open(f, encoding='utf-8'))
section = sys.argv[1]
nouveau = json.load(sys.stdin)
if section == 'identiques':
    d['identiques'] = sorted(set(d.get('identiques', [])) | set(nouveau))
else:
    d.setdefault(section, {}).update(nouveau)
json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
