$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Character Constants (Hex only)
$bolt    = [char]0x26A1 # ⚡
$tasks   = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$S_cap   = [char]0x15E   # Ş
$s_low   = [char]0x15F   # ş
$I_cap   = [char]0x130   # İ
$i_low   = [char]0x131   # ı
$u_low   = [char]0x00FC  # ü
$U_cap   = [char]0x00DC  # Ü
$repChar = [char]0xFFFD  # 

foreach ($f in $files) {
    Write-Host "Scrubbing: $($f.Name)..."
    try {
        $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $old = $c
        
        # 1. THE 'g' ICON ARTIFACTS
        # Regex for 'g' followed by any number of replacement characters
        $gPattern = "g" + [regex]::Escape($repChar) + "+"
        if ($c -match $gPattern) {
            # Fix Tasks specifically where found
            $c = $c -replace "gorevler.*$gPattern", "gorevler', label: '$tasks "
            # Fix General
            $c = $c -replace "$gPattern", "$bolt "
            $m = $true
        }

        # 2. TYPOGRAPHY REPAIR
        if ($c.Contains($repChar + "irkete")) { $c = $c.Replace($repChar + "irkete", $S_cap + "irkete"); $m = $true }
        if ($c.Contains($repChar + "ub"))     { $c = $c.Replace($repChar + "ub", $S_cap + "ub"); $m = $true }
        if ($c.Contains($repChar + "ABLON"))  { $c = $c.Replace($repChar + "ABLON", $S_cap + "ABLON"); $m = $true }
        
        # 3. MOJIBAKE
        $mj = @(
            @("Ä°", $I_cap), @("Ä±", $i_low), @("ÅŸ", $s_low), @("Åž", $S_cap),
            @("Ã¼", $u_low), @("Ãœ", $U_cap)
        )
        foreach ($p in $mj) {
            if ($c.Contains($p[0])) { $c = $c.Replace($p[0], $p[1]); $m = $true }
        }

        if ($m) {
            [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
            Write-Host ">>> REPAIRED: $($f.Name)"
        }
    } catch {
        Write-Host "FAIL: $($f.Name) - $($_.Exception.Message)"
    }
}
Write-Host "UNIVERSAL UI RESTORATION COMPLETE."
