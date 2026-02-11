Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
$names = @(
  'ipamorelin-10ml','ipamorelin-cjc-10ml','thymosin-alpha-10ml','kpv-10ml','pt-141-10ml','bpc-tb-10ml',
  'bpc-157-10ml','ghk-cu-10ml','tb-500-10ml','semaglutide-10ml','retatrutide-10ml','epitalon-10mg','foxo4-dri-10ml'
)
foreach ($n in $names) {
  $srcAvif = "public/optimized/products/$n-1024.avif"
  $dstAvif = "public/optimized/products/$n.avif"
  if (Test-Path $srcAvif) {
    Copy-Item -LiteralPath $srcAvif -Destination $dstAvif -Force
    Write-Output "Copied $srcAvif -> $dstAvif"
  }
  $srcWebp = "public/optimized/products/$n-1024.webp"
  $dstWebp = "public/optimized/products/$n.webp"
  if (Test-Path $srcWebp) {
    Copy-Item -LiteralPath $srcWebp -Destination $dstWebp -Force
    Write-Output "Copied $srcWebp -> $dstWebp"
  }
}

Write-Output 'Staging and committing size-less variants...'
git add public/optimized/products/*.avif public/optimized/products/*.webp -f
try { git commit -m "fix(images): add size-less optimized AVIF/WebP for frontend canonical paths" -a; Write-Output 'Committed' } catch { Write-Output 'Nothing to commit' }

Write-Output 'Deploying...'
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
