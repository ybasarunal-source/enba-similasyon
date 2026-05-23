$Utf8 = [System.Text.Encoding]::UTF8
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules
$suspects = @()

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, $Utf8)
        # Find any non-ASCII character (excluding standard Turkish ones)
        if ($content -match '[^\x00-\x7FğüşöçİĞÜŞÖÇ\s\w\d\.\,\;\:\'\!\?\-\=\+\(\)\[\]\{\}\/\\\"\#\%\&\*\<\>\|\@]') {
            $matches = [regex]::Matches($content, '[^\x00-\x7FğüşöçİĞÜŞÖÇ\s\w\d\.\,\;\:\'\!\?\-\=\+\(\)\[\]\{\}\/\\\"\#\%\&\*\<\>\|\@]')
            foreach ($m in $matches) {
                $suspects += $m.Value
            }
        }
    } catch {}
}

$suspects | Select-Object -Unique | ForEach-Object {
    $bytes = $Utf8.GetBytes($_)
    $hex = ($bytes | ForEach-Object { "{0:X2}" -f $_ }) -join " "
    Write-Host "$($hex) : $($_)"
}
