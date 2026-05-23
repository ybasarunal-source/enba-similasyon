$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$replacements = @{
    "ÅŸ" = "ş";
    "Ä±" = "ı";
    "Ã§" = "ç";
    "Ã¶" = "ö";
    "Ã¼" = "ü";
    "ÄŸ" = "ğ";
    "Ä°" = "İ";
    "Å" = "Ş";
    "Ã‡" = "Ç";
    "Ã–" = "Ö";
    "Ãœ" = "Ü";
    "ĞŸ" = "Ğ" # Potential variant
}

foreach ($file in $files) {
    Write-Host "Repairing $($file.FullName)..."
    $content = [System.IO.File]::ReadAllText($file.FullName)
    
    foreach ($key in $replacements.Keys) {
        $content = $content.Replace($key, $replacements[$key])
    }
    
    [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
}

Write-Host "Character repair COMPLETE."
