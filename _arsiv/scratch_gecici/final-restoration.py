import os
import re

# Character Mapping
BOLT = "⚡"
SEARCH = "🔍"
CHART = "📊"
TASKS = "📋"
STOCK = "📦"
S_CAP = "Ş"
I_CAP = "İ"

# Project path
path = r"c:\Users\Fujitsu\OneDrive\Desktop\Enba Similasyon"

def fix_file(file_path):
    print(f"Checking: {os.path.basename(file_path)}")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        original = content
        
        # 1. ICON RESTORATION ('g' + junk)
        # Patterns like: placeholder="g???" or <h3>g???
        content = re.sub(r'([>"\'])g[^\x00-\x7F]{1,4}\s*', r'\1' + BOLT + ' ', content)
        
        # 2. MOJIBAKE AND REPLACEMENT CHARS
        replacements = {
            "Ä°": "İ",
            "Ä±": "ı",
            "ÅŸ": "ş",
            "Åž": "Ş",
            "Ã¼": "ü",
            "Ãœ": "Ü",
            "Ã¶": "ö",
            "Ã–": "Ö",
            "Ã§": "ç",
            "Ã‡": "Ç",
            "ÄŸ": "ğ",
            "Ä": "Ğ",
            "\ufffdub": S_CAP + "ub", # Fix 'Şub'
            "\ufffdABLON": S_CAP + "ABLON", # Fix 'ŞABLON'
            "GiriÅŸ": "Giriş",
            "Girişş": "Giriş"
        }
        
        for p, r in replacements.items():
            content = content.replace(p, r)

        # 3. CONTEXTUAL REPAIR
        # If it's a placeholder, it's likely a search icon
        content = re.sub(r'placeholder="' + BOLT + r' ', 'placeholder="' + SEARCH + ' ', content)

        if content != original:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f">>> REPAIRED: {os.path.basename(file_path)}")
            return True
    except Exception as e:
        print(f"ERR: {e}")
    return False

# Main Loop
files = []
for root, dirs, filenames in os.walk(path):
    if "node_modules" in root: continue
    for f in filenames:
        if f.endswith(".jsx") or f.endswith(".html") or f.endswith(".css"):
            files.append(os.path.join(root, f))

repaired_count = 0
for f in files:
    if fix_file(f):
        repaired_count += 1

print(f"\nTOTAL REPAIRED: {repaired_count}")
