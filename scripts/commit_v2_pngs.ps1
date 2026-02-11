Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
Write-Output 'Staging .v2.png fallbacks...'
git add public/products/*.v2.png
try { git commit -m "fix(images): add .v2.png fallbacks used on product pages" -a; Write-Output 'Committed' } catch { Write-Output 'Nothing to commit' }
Write-Output 'Deploying...'
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
