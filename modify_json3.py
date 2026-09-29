import json
import re

dictPl = 
dictEn = 

with open('src/locales/pl/translation.json', 'r', encoding='utf-8-sig') as f:
    pl = json.load(f)
for k, v in dictPl.items():
    pl['planned'][k] = v
with open('src/locales/pl/translation.json', 'w', encoding='utf-8') as f:
    json.dump(pl, f, indent=2, ensure_ascii=False)

with open('src/locales/en/translation.json', 'r', encoding='utf-8-sig') as f:
    en = json.load(f)
for k, v in dictEn.items():
    en['planned'][k] = v
with open('src/locales/en/translation.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
