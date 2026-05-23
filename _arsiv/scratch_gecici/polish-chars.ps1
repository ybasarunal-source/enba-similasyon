$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$wordReplacements = @{
    "\?ablon" = "Şablon";
    "\?u anki" = "Şu anki";
    "maa\?" = "maaş";
    "Maa\?" = "Maaş";
    "M\?teri" = "Müşteri";
    "Mteri" = "Müşteri";
    "Giri" = "Giriş";
    "Dzenle" = "Düzenle";
    "" = "ş"; # Single stubborn byte
}

foreach ($file in $files) {
    Write-Host "Polishing $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        foreach ($key in $wordReplacements.Keys) {
            if ($content -match $key) {
                # Use regex replace for the tricky patterns
                $content = [regex]::Replace($content, $key, $wordReplacements[$key])
                $modified = $true
            }
        }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host "POLISHED: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
Write-Host "Polishing complete."
