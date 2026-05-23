$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Latin1 = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

foreach ($file in $files) {
    Write-Host "Restoring $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Check for characteristic mojibake patterns (e.g., lowercase s dotless i)
        if ($content.Contains("ÅŸ") -or $content.Contains("Ä±") -or $content.Contains("Ã§")) {
            $bytes = $Latin1.GetBytes($content)
            $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
            [System.IO.File]::WriteAllText($file.FullName, $fixed, $Utf8NoBom)
            Write-Host "RESORED: $($file.Name)"
        }
    } catch {
        Write-Host "Error restoring $($file.FullName): $($_.Exception.Message)"
    }
}
Write-Host "Mojibake restoration FINISHED."
