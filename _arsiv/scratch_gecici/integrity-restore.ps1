$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.js, *.html, *.css -Exclude node_modules

$rep = [char]0xFFFD

foreach ($f in $files) {
    Write-Host "Restoring Integrity: $($f.Name)..."
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $old = $c
    
    # 1. REMOVE '?' ARTIFACTS IN CODEBLOCKS
    # These often appear in button labels or comments
    $c = $c.Replace($rep + " ", "⚡ ")
    $c = $c.Replace("g" + $rep, "⚡")
    $c = $c.Replace($rep + $rep, "⚡")
    
    # 2. RESTORE TURKISH CHARACTERS
    # Mapping based on observed corruption patterns
    $map = @{
        "ynetimi" = "yönetimi";
        "HZMETLER" = "HİZMETLER";
        "TESS" = "TESİS";
        "EKPMAN" = "EKİPMAN";
        "KRA" = "KİRA";
        "Tketim" = "Tüketim";
        "Kaynaklar" = "Kaynakları";
        "?irkete" = "Şirkete";
        "?ubat" = "Şubat";
        "Girişş" = "Giriş"
    }
    foreach ($k in $map.Keys) { $c = $c.Replace($k, $map[$k]) }
    
    # 3. FIX MOJIBAKE
    $mj = @{
        "Ä°" = "İ"; "Ä±" = "ı"; "ÅŸ" = "ş"; "Åž" = "Ş";
        "Ã¼" = "ü"; "Ãœ" = "Ü"; "Ã¶" = "ö"; "Ã–" = "Ö";
        "Ã§" = "ç"; "Ã‡" = "Ç"; "ÄŸ" = "ğ"
    }
    foreach ($k in $mj.Keys) { $c = $c.Replace($k, $mj[$k]) }

    # 4. ENSURE WINDOW ASSIGNMENTS
    if ($f.Name -eq "app.jsx" -and -not $c.Contains("window.App = App")) {
        $c += "`nwindow.App = App;"
    }
    if ($f.Name -eq "landing.jsx" -and -not $c.Contains("window.LandingPage = LandingPage")) {
        $c = $c.Replace("export default LandingPage;", "") + "`nwindow.LandingPage = LandingPage;"
    }

    if ($c -ne $old) {
        [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
        Write-Host ">>> RESTORED: $($f.Name)"
    }
}
Write-Host "INTEGRITY RESTORATION COMPLETE."
