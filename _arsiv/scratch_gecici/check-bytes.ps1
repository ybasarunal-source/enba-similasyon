$bytes = [System.IO.File]::ReadAllBytes("detailed-plan.jsx")
$maa = [System.Text.Encoding]::UTF8.GetBytes("maa")

$found = -1
for ($i = 0; $i -lt $bytes.Length - 3; $i++) {
    if ($bytes[$i] -eq $maa[0] -and $bytes[$i+1] -eq $maa[1] -and $bytes[$i+2] -eq $maa[2]) {
        $found = $i
        break
    }
}

if ($found -ne -1) {
    Write-Host "Found 'maa' at index $found"
    $slice = $bytes[$found..($found+10)]
    foreach ($b in $slice) {
        Write-Host ("{0:X2}" -f $b)
    }
} else {
    Write-Host "String 'maa' not found."
}
