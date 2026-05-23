$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$replacements = @(
    @{ Pattern = "\?ablon"; Replace = "Şablon" },
    @{ Pattern = "\?u anki"; Replace = "Şu anki" },
    @{ Pattern = "maa\?"; Replace = "maaş" },
    @{ Pattern = "Maa\?"; Replace = "Maaş" },
    @{ Pattern = "M\?teri"; Replace = "Müşteri" },
    @{ Pattern = "Mteri"; Replace = "Müşteri" },
    @{ Pattern = "Giri"; Replace = "Giriş" },
    @{ Pattern = "Dzenle"; Replace = "Düzenle" }
)

foreach ($file in $files) {
    Write-Host "Polishing $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        foreach ($r in $replacements) {
            if ($content -match $r.Pattern) {
                $content = [regex]::Replace($content, $r.Pattern, $r.Replace)
                $modified = $true
            }
        }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host "SUCCESS: Polished $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
Write-Host "Final polishing complete."
