$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$AnsiTurkish = [System.Text.Encoding]::GetEncoding(1254)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

foreach ($file in $files) {
    Write-Host "Re-encoding $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content.Contains("aaÅŸ")) {
            $bytes = $AnsiTurkish.GetBytes($content)
            $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
            [System.IO.File]::WriteAllText($file.FullName, $fixed, $Utf8NoBom)
            Write-Host "Fixed: $($file.Name)"
        }
    } catch {
        Write-Host "Error fixing $($file.FullName): $($_.Exception.Message)"
    }
}
Write-Host "Repair process FINISHED."
