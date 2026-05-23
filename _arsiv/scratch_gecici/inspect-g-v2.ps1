$path = "components\wizard\detailed\DetStep2_Customers.jsx"
if (!(Test-Path $path)) { Write-Host "File not found"; exit }

$bytes = [System.IO.File]::ReadAllBytes($path)
$tokenString = "Fire Toplu"
$token = [System.Text.Encoding]::UTF8.GetBytes($tokenString)

$found = -1
for ($i = 0; $i -lt $bytes.Length - $token.Length; $i++) {
    $match = $true
    for ($j = 0; $j -lt $token.Length; $j++) {
        if ($bytes[$i + $j] -ne $token[$j]) {
            $match = $false
            break
        }
    }
    if ($match) {
        $found = $i
        break
    }
}

if ($found -ne -1) {
    Write-Host "Token '$tokenString' found at $found"
    # Take 20 bytes before the token
    $start = [Math]::Max(0, $found - 30)
    $slice = $bytes[$start..($found-1)]
    foreach ($b in $slice) {
        Write-Host ("{0:X2} " -f $b) -NoNewline
    }
    Write-Host " [TOKEN START]"
} else {
    Write-Host "Token not found"
}
