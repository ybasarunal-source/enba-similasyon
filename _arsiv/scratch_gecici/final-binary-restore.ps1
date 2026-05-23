$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Replacement function using byte arrays for total safety
function Fix-Binary($filePath) {
    Write-Host "Binary Scanning: $($filePath)..."
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $modified = $false

    # Pattern Mapping: [Pattern (Bytes)] -> [Replacement (Bytes)]
    $map = @(
        # 1. Icons: Remove 'g' (0x67) prefix from UTF-8 emojis
        # Bolt (⚡): 67 E2 9A A1 -> E2 9A A1
        @([byte[]](0x67, 0xE2, 0x9A, 0xA1), [byte[]](0xE2, 0x9A, 0xA1)),
        # Rocket (🚀): 67 F0 9F 9A 80 -> F0 9F 9A 80
        @([byte[]](0x67, 0xF0, 0x9F, 0x9A, 0x80), [byte[]](0xF0, 0x9F, 0x9A, 0x80)),
        # Search (🔍): 67 F0 9F 94 8D -> F0 9F 94 8D
        @([byte[]](0x67, 0xF0, 0x9F, 0x94, 0x8D), [byte[]](0xF0, 0x9F, 0x94, 0x8D)),
        # Chart (📊): 67 F0 9F 93 8A -> F0 9F 93 8A
        @([byte[]](0x67, 0xF0, 0x9F, 0x93, 0x8A), [byte[]](0xF0, 0x9F, 0x93, 0x8A)),
        
        # 2. Turkish Mojibake
        # İ (C3 84 C2 B0 -> C4 B0)
        @([byte[]](0xC3, 0x84, 0xC2, 0xB0), [byte[]](0xC4, 0xB0)),
        # ı (C3 84 C2 B1 -> C4 B1)
        @([byte[]](0xC3, 0x84, 0xC2, 0xB1), [byte[]](0xC4, 0xB1)),
        # ş (C3 85 C5 B8 -> C5 9F)
        @([byte[]](0xC3, 0x85, 0xC5, 0xB8), [byte[]](0xC5, 0x9F)),
        # Ş (C3 85 C5 BE -> C5 9E)
        @([byte[]](0xC3, 0x85, 0xC5, 0xBE), [byte[]](0xC5, 0x9E)),
        # ü (C3 83 C2 BC -> C3 BC)
        @([byte[]](0xC3, 0x83, 0xC2, 0xBC), [byte[]](0xC3, 0xBC)),
        # Ü (C3 83 C2 9C -> C3 9C) 
        @([byte[]](0xC3, 0x83, 0x85),       [byte[]](0xC3, 0x9C)),
        
        # 3. Specific contextual fixes
        # Replacement char in months (?ub -> Şub)
        @([byte[]](0xEF, 0xBF, 0xBD, 0x75, 0x62), [byte[]](0xC5, 0x9E, 0x75, 0x62))
    )

    foreach ($item in $map) {
        $p = $item[0]; $r = $item[1]
        for ($i = 0; $i -le $bytes.Length - $p.Length; $i++) {
            $match = $true
            for ($j = 0; $j -lt $p.Length; $j++) {
                if ($bytes[$i + $j] -ne $p[$j]) { $match = $false; break }
            }
            if ($match) {
                $newBytes = New-Object System.Collections.Generic.List[byte]
                if ($i -gt 0) { $newBytes.AddRange($bytes[0..($i - 1)]) }
                $newBytes.AddRange($r)
                if ($i + $p.Length -lt $bytes.Length) { $newBytes.AddRange($bytes[($i + $p.Length)..($bytes.Length - 1)]) }
                $bytes = $newBytes.ToArray()
                $modified = $true
                $i += $r.Length - 1 # Avoid re-matching same spot
            }
        }
    }

    if ($modified) {
        [System.IO.File]::WriteAllBytes($filePath, $bytes)
        Write-Host ">>> REPAIRED: $($filePath)"
    }
}

foreach ($f in $files) { Fix-Binary $f.FullName }
Write-Host "FINAL BINARY PROJECT-WIDE RESTORATION COMPLETE."
