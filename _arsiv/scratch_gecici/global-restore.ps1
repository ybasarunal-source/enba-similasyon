$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$bolt    = [char]0x26A1 # ⚡
$search  = [char]::ConvertFromUtf32(0x1F50D) # 🔍
$S_cap   = [char]0x15E   # Ş

foreach ($f in $files) {
    Write-Host "Scrubbing: $($f.Name)..."
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $orig = $c
    
    # Contextual Icon fixes (Common patterns observed in view_file)
    # The 'g ' artifact often appears with ? replacement characters
    $c = $c.Replace("placeholder=""g" + [char]0xFFFD + [char]0xFFFD + [char]0xFFFD + " ", "placeholder=""$search ")
    $c = $c.Replace(">g" + [char]0xFFFD + [char]0xFFFD + [char]0xFFFD + " ", ">$bolt ")
    $c = $c.Replace(" g" + [char]0xFFFD + [char]0xFFFD + [char]0xFFFD + " ", " $bolt ")
    
    # Simple 'g ' fix for modules where it's 1-byte
    $c = $c.Replace("placeholder=""g ", "placeholder=""$search ")
    $c = $c.Replace(">g ", ">$bolt ")
    
    # Month fix
    $c = $c.Replace("'Oca'," + [char]0xFFFD + "ub'", "'Oca','$S_cap" + "ub'")
    
    # Mojibake Fix
    $c = $c.Replace("Ä°", "İ")
    $c = $c.Replace("Ä±", "ı")
    $c = $c.Replace("ÅŸ", "ş")
    $c = $c.Replace("Åž", "Ş")
    $c = $c.Replace("Ã¼", "ü")
    $c = $c.Replace("Ãœ", "Ü")
    $c = $c.Replace("Ã¶", "ö")
    $c = $c.Replace("Ã–", "Ö")
    $c = $c.Replace("Ã§", "ç")
    $c = $c.Replace("Ã‡", "Ç")
    $c = $c.Replace("ÄŸ", "ğ")

    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
        Write-Host ">>> REPAIRED: $($f.Name)"
    }
}
Write-Host "GLOBAL RESTORATIONS COMPLETE."
