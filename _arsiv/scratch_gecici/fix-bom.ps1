$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules
foreach ($file in $files) {
    Write-Host "Fixing $($file.FullName)..."
    $content = [System.IO.File]::ReadAllText($file.FullName)
    [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
}
Write-Host "DONE"
