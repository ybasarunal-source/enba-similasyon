import os
import re

path = r"c:\Users\Fujitsu\OneDrive\Desktop\Enba Similasyon"

files = []
for root, dirs, filenames in os.walk(path):
    if "node_modules" in root: continue
    for f in filenames:
        if f.endswith(".jsx") or f.endswith(".js") or f.endswith(".html") or f.endswith(".css"):
            files.append(os.path.join(root, f))

words = set()
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fp:
            content = fp.read()
            matches = re.findall(r'[a-zA-Z0-9_]*âš¡[a-zA-Z0-9_\?]*', content, re.IGNORECASE)
            for m in matches:
                words.add(m)
    except Exception as e:
        pass

for w in sorted(list(words)):
    print(w)
