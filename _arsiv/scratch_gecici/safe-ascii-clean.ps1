$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.js, *.html, *.css -Exclude node_modules

$rep = [char]0xFFFD

foreach ($f in $files) {
    Write-Host "Sanitizing: $($f.Name)..."
    try {
        $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $old = $c
        
        # Replace the 'replacement character' junk
        # Pattern 1: 'g' + replacement chars (The original corruption)
        $c = $c -replace 'g([char]0xFFFD)+', '⚡'
        
        # Pattern 2: Isolated replacement characters in words
        # y?netimi -> yönetimi
        $c = $c.Replace($rep + "netimi", [char]0x00F6 + "netimi") 
        $c = $c.Replace("H" + $rep + "ZMETLER", "H" + [char]0x0130 + "ZMETLER")
        $c = $c.Replace("Y" + $rep + "NET", "Y" + [char]0x00D6 + "NET")
        $c = $c.Replace("T" + $rep + "ketim", "T" + [char]0x00FC + "ketim")
        $c = $c.Replace("TES" + $rep + "S", "TES" + [char]0x0130 + "S")
        $c = $c.Replace("EK" + $rep + "PMAN", "EK" + [char]0x0130 + "PMAN")
        $c = $c.Replace($rep + "irkete", [char]0x015E + "irkete")
        $c = $c.Replace($rep + "ub", [char]0x015E + "ub")

        # Basic Cleanup
        $c = $c.Replace($rep, "⚡")

        # Component assignment check (Mandatory for app to load)
        if ($f.Name -eq "app.jsx" -and -not $c.Contains("window.App = App")) {
            $c += "`nwindow.App = App;"
        }
        if ($f.Name -eq "landing.jsx" -and -not $c.Contains("window.LandingPage = LandingPage")) {
            $c += "`nwindow.LandingPage = LandingPage;"
        }

        if ($c -ne $old) {
            [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
            Write-Host ">>> CLEANED: $($f.Name)"
        }
    } catch {
        Write-Host "FAIL: $($f.Name) - $($_.Exception.Message)"
    }
}
Write-Host "EMERGENCY SANITIZATION COMPLETE."
