Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
$map = @(
  'retatrutide-10ml','semaglutide-10ml','ghk-cu-10ml','bpc-157-10ml','foxo4-dri-10ml','ipamorelin-10ml','ipamorelin-cjc-10ml','kpv-10ml','tb-500-10ml','thymosin-alpha-10ml','pt-141-10ml','bpc-tb-10ml','epitalon-10mg'
)
$prod = Join-Path $PWD 'public\products'
foreach ($n in $map) {
  $src = Join-Path $prod ($n + '.png')
  $dst = Join-Path $prod ($n + '-label.png')
  if (Test-Path $src) {
    Copy-Item -LiteralPath $src -Destination $dst -Force
    Write-Output "Created label PNG: $dst"
  } else {
    Write-Output ($n + ': ' + $src)
  }
}

git add public/products/*-label.png -f
try { git commit -m "fix(images): add -label.png fallbacks used in templates" -a; Write-Output 'Committed' } catch { Write-Output 'Nothing to commit' }
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
