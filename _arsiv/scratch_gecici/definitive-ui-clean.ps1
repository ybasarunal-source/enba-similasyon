$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$bolt    = [char]0x26A1 # ⚡
$tasks   = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$S_cap   = [char]0x15E   # Ş

foreach ($f in $files) {
    Write-Host "Final Polish: $($f.Name)..."
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $old = $c
    
    # 1. THE 'g' ICON ARTIFACTS (g + \uFFFD)
    # Tasks icon (router, tasks-module)
    $c = $c -replace 'g\uFFFD+[ \t]*', "$tasks "
    
    # Generic bolt icon (g + \uFFFD)
    $c = $c -replace 'g\uFFFD+', "$bolt"

    # 2. TYPOGRAPHY REPAIR
    # ?irkete -> Şirkete
    $c = $c -replace '\uFFFDirkete', "Şirkete"
    # ?ub -> Şub
    $c = $c -replace '\uFFFDub', "Şub"
    # ?ABLON -> ŞABLON
    $c = $c -replace '\uFFFDABLON', "ŞABLON"
    # Girişş -> Giriş
    $c = $c.Replace("Girişş", "Giriş")
    
    # 3. MOJIBAKE
    $replacements = @{
        "Ä°" = "İ"; "Ä±" = "ı"; "ÅŸ" = "ş"; "Åž" = "Ş";
        "Ã¼" = "ü"; "Ãœ" = "Ü"; "Ã¶" = "ö"; "Ã–" = "Ö";
        "Ã§" = "ç"; "Ã‡" = "Ç"; "ÄŸ" = "ğ"
    }
    foreach ($k in $replacements.Keys) { $c = $c.Replace($k, $replacements[$k]) }

    if ($c -ne $old) {
        [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
        Write-Host ">>> CLEANED: $($f.Name)"
    }
}
Write-Host "ALL UI ARTIFACTS ELIMINATED."
