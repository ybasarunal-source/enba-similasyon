$path = "components\wizard\detailed\DetStep2_Customers.jsx"
if (!(Test-Path $path)) { Write-Host "File not found"; exit }

$bytes = [System.IO.File]::ReadAllBytes($path)
$token = [System.Text.Encoding]::UTF8.GetBytes("Fire Toplu")

$found = -1
for ($i = 0; $i -lt $bytes.Length - 10; $i++) {
    if ($bytes[$i..($i+$token.Length-1)] -join "" -eq $token -join "") {
        $found = $i
        break
    }
}

if ($found -ne -1) {
    Write-Host "Token found at $found"
    # Take 15 bytes before the token to find the 'g' sequence
    $slice = $bytes[($found-15)..($found+2)]
    foreach ($b in $slice) {
        Write-Host ("{0:X2} " -f $b) -NoNewline
    }
    Write-Host ""
} else {
    Write-Host "Token not found"
}
