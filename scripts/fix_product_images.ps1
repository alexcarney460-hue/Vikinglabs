Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
$inbound = 'C:\Users\Claud\.openclaw\media\inbound'
$dest = Join-Path $PWD 'public\products'
if (-Not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

Write-Output 'Cleaning unintended inbound copies in public/products (file_*.jpg + PDFs)...'
Get-ChildItem -Path $dest -File -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^file_\d+---.*\.(jpg|jpeg|png|webp)$' -or $_.Name -match '\.pdf$' } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force; Write-Output "Removed: $($_.Name)" }

$map = @{
  'file_43' = 'ipamorelin-10ml.png'
  'file_44' = 'thymosin-alpha-10ml.png'
  'file_45' = 'kpv-10ml.png'
  'file_42' = 'pt-141-10ml.png'
  'file_41' = 'bpc-tb-10ml.png'
  'file_40' = 'ipamorelin-cjc-10ml.png'
  'file_39' = 'tb-500-10ml.png'
  'file_38' = 'semaglutide-10ml.png'
  'file_35' = 'ghk-cu-10ml.png'
  'file_36' = 'foxo4-dri-10ml.png'
  'file_37' = 'bpc-157-10ml.png'
  'file_49' = 'retatrutide-10ml.png'
  'file_50' = 'epitalon-10mg.png'
}

Write-Output 'Copying canonical product images from inbound...'
foreach ($entry in $map.GetEnumerator()) {
  $prefix = $entry.Key
  $targetName = $entry.Value
  $candidates = Get-ChildItem -Path $inbound -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$prefix---*.jpg" -or $_.Name -like "$prefix---*.jpeg" -or $_.Name -like "$prefix---*.png" }
  if ($null -eq $candidates -or $candidates.Count -eq 0) {
    Write-Output "WARN: No inbound match for $prefix (needed for $targetName)"
    continue
  }
  $src = $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $target = Join-Path $dest $targetName
  Copy-Item -LiteralPath $src.FullName -Destination $target -Force
  Write-Output "Copied $($src.Name) -> $targetName"
}

Write-Output 'Running optimizer...'
node scripts/optimize-images.js

Write-Output 'Committing + deploying...'
git add -A
try { git commit -m "fix: canonicalize product images and remove stray inbound files" -a; Write-Output 'Commit created' } catch { Write-Output 'Nothing to commit' }
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
