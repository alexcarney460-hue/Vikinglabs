Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
$pages=@('https://vikinglabs.co/catalog','https://vikinglabs.co/catalog/retatrutide','https://vikinglabs.co/catalog/semaglutide')
foreach($p in $pages){
  Write-Output "\n--- PAGE: $p ---"
  try{
    $html=(Invoke-WebRequest -Uri $p -UseBasicParsing -ErrorAction Stop).Content
  } catch { Write-Output "Failed to fetch $p : $($_.Exception.Message)"; continue }
  $imgs = @()
  $matches = [regex]::Matches($html,'<img[^>]+src=(?:"|\')(.*?)(?:"|\')', 'IgnoreCase')
  foreach($m in $matches){ $imgs += $m.Groups[1].Value }
  $sources = [regex]::Matches($html,'<source[^>]+srcset=(?:"|\')(.*?)(?:"|\')', 'IgnoreCase')
  foreach($s in $sources){ $parts = $s.Groups[1].Value -split '\s*,\s*'; foreach($part in $parts){ $u = $part -split '\s+'; $imgs += $u[0] } }
  $imgs = $imgs | Where-Object { $_ -ne $null -and $_ -ne '' } | Select-Object -Unique
  foreach($img in $imgs){
    if($img -notmatch '^https?://'){ $url = 'https://vikinglabs.co' + $img } else { $url = $img }
    Write-Output "IMG: $url"
    try{
      $h = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
      $ct = $h.Headers['Content-Type'] -join ','
      $len = $h.Headers['Content-Length'] -join ','
      $cache = $h.Headers['X-Vercel-Cache'] -join ','
      Write-Output "  -> Status: $($h.StatusCode) Content-Type: $ct Length: $len Cache: $cache"
    } catch { Write-Output "  -> ERROR: $($_.Exception.Message)" }
  }
}
