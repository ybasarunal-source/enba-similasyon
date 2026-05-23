$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Latin1 = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$pattern = "$([char]0x00C5)$([char]0x009F)" # 'ş' broken (ÅŸ)

foreach ($file in $files) {
    Write-Host "Restoring $($file.FullName)..."
    try {
        $rawBytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $content = [System.Text.Encoding]::UTF8.GetString($rawBytes)
        
        if ($content.Contains($pattern)) {
            $originalBytes = $Latin1.GetBytes($content)
            $fixedString = [System.Text.Encoding]::UTF8.GetString($originalBytes)
            [System.IO.File]::WriteAllText($file.FullName, $fixedString, $Utf8NoBom)
            Write-Host "RESTORED: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
Write-Host "Process complete."
