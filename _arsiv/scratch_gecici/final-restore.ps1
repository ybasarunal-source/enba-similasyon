$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$W1252 = [System.Text.Encoding]::GetEncoding(1252)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$pattern1 = "$([char]0x00C5)$([char]0x0178)" # ÅŸ (broken ş)
$pattern2 = "$([char]0x00C4)$([char]0x00B1)" # Ä± (broken ı)

foreach ($file in $files) {
    Write-Host "Restoring $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        if ($content.Contains($pattern1) -or $content.Contains($pattern2)) {
            $bytes = $W1252.GetBytes($content)
            $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
            [System.IO.File]::WriteAllText($file.FullName, $fixed, $Utf8NoBom)
            Write-Host "SUCCESS: RESTORED $($file.Name)"
        }
    } catch {
        Write-Host "Error restoring $($file.FullName): $($_.Exception.Message)"
    }
}
Write-Host "Global restoration FINISHED."
