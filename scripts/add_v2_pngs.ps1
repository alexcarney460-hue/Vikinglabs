Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
$skus=@('retatrutide-10ml','semaglutide-10ml','ghk-cu-10ml','bpc-157-10ml','foxo4-dri-10ml','ipamorelin-10ml','ipamorelin-cjc-10ml','kpv-10ml','tb-500-10ml','thymosin-alpha-10ml','pt-141-10ml','bpc-tb-10ml','epitalon-10mg')
foreach($s in $skus){
  $src = Join-Path $PWD "public\products\$s.png"
  $dst = Join-Path $PWD "public\products\$s.v2.png"
  if(Test-Path $src){ Copy-Item -LiteralPath $src -Destination $dst -Force; Write-Output "Copied $src -> $dst" } else { Write-Output "Missing $src" }
}

git add public/products/*-v2.png -f
try{ git commit -m 'fix(images): add .v2.png fallbacks for templates' -a; Write-Output 'Committed' } catch { Write-Output 'Nothing to commit' }
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
