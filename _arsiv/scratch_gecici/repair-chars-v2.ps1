$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$replacements = @{
    "$([char]0x00C5)$([char]0x009F)" = "ş";
    "$([char]0x00C4)$([char]0x00B1)" = "ı";
    "$([char]0x00C3)$([char]0x00A7)" = "ç";
    "$([char]0x00C3)$([char]0x00B6)" = "ö";
    "$([char]0x00C3)$([char]0x00BC)" = "ü";
    "$([char]0x00C4)$([char]0x009F)" = "ğ";
    "$([char]0x00C4)$([char]0x00B0)" = "İ";
    "$([char]0x00C3)$([char]0x0087)" = "Ç";
    "$([char]0x00C3)$([char]0x0096)" = "Ö";
    "$([char]0x00C3)$([char]0x009C)" = "Ü";
    "$([char]0x00C5)$([char]0x009E)" = "Ş";
    "$([char]0x00C4)$([char]0x009E)" = "Ğ";
}

foreach ($file in $files) {
    Write-Host "Repairing $($file.FullName)..."
    $content = [System.IO.File]::ReadAllText($file.FullName)
    
    foreach ($key in $replacements.Keys) {
        if ($content.Contains($key)) {
            $content = $content.Replace($key, $replacements[$key])
        }
    }
    
    [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
}

Write-Host "Character repair COMPLETE (via Unicode Escapes)."
