$path = 'C:\My-site\통합사이트\브랜드_통합_시스템\src\app\jobs\JobClient.tsx'
$outPath = 'C:\My-site\통합사이트\브랜드_통합_시스템\src\app\jobs\JobClient_fixed.tsx'
$c = Get-Content $path -Encoding UTF8
$n = $c[0..315] + $c[369..($c.Count-1)]
$n | Set-Content $outPath -Encoding UTF8
Write-Host "New count: $($n.Count)"
