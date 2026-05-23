$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# We match the broken start of the header specifically
$replacements = @(
    @{ Pattern = ">g Fire Toplu Giriş"; Replace = ">⚡ Şu anki Fire Toplu Giriş" },
    @{ Pattern = ">g Tek Seferde"; Replace = ">⚡ Tek Seferde" },
    @{ Pattern = "g Fire Toplu"; Replace = "⚡ Fire Toplu" },
    @{ Pattern = "Åžablon"; Replace = "Şablon" },
    @{ Pattern = "Åž"; Replace = "Ş" },
    @{ Pattern = " "; Replace = "⚡" },
    @{ Pattern = "g "; Replace = "⚡ " } # Wide sweep for the 'g' artifact at starts
)

foreach ($file in $files) {
    Write-Host "Polishing icons in $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        # Specific fix for the 'g' that accompanies Fire Toplu Giriş
        if ($content -match "g Fire Toplu Giriş") {
            $content = $content -replace "g Fire Toplu Giriş", "⚡ Şu anki Fire Toplu Giriş"
            $modified = $true
        }

        # Global fix for the '?' ablon pattern
        if ($content.Contains("?ablon")) {
            $content = $content.Replace("?ablon", "Şablon")
            $modified = $true
        }

        # Fix for the 'g' character observed by the user (only if followed by a space or specific keywords)
        $content = $content -replace ">g ", ">⚡ "
        $content = $content -replace " g ", " ⚡ "
        
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host "CLEANED: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
Write-Host "Final Icon Restoration FINISHED."
