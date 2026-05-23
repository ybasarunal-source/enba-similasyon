$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.js, *.html, *.css -Exclude node_modules

$repString = [char]0xFFFD | Out-String
$repString = $repString.Trim()

foreach ($f in $files) {
    Write-Host "Forced Sanitizing: $($f.Name)..."
    try {
        $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $old = $c
        
        # Unified Replacement for the 'Replacement Character'
        $c = $c.Replace($repString, "⚡")
        
        # Word Fixes
        $c = $c.Replace("y⚡netimi", "yönetimi")
        $c = $c.Replace("H⚡ZMETLER", "HİZMETLER")
        $c = $c.Replace("T⚡ketim", "Tüketim")
        $c = $c.Replace("TES⚡S", "TESİS")
        $c = $c.Replace("EK⚡PMAN", "EKİPMAN")
        $c = $c.Replace("Y⚡NET", "YÖNET")

        # Essential window assignments
        if ($f.Name -eq "app.jsx" -and -not $c.Contains("window.App = App")) {
            $c += "`nwindow.App = App;"
        }
        if ($f.Name -eq "landing.jsx" -and -not $c.Contains("window.LandingPage = LandingPage")) {
            $c += "`nwindow.LandingPage = LandingPage;"
        }

        if ($c -ne $old) {
            [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
            Write-Host ">>> RECOVERED: $($f.Name)"
        }
    } catch {
        Write-Host "ERROR: $($f.Name) - $($_.Exception.Message)"
    }
}
Write-Host "FINAL EMERGENCY CLEAN COMPLETE."
