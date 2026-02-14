Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
Write-Output 'Scanning product image folders...'
$prod = Join-Path $PWD 'public\products'
$opt = Join-Path $PWD 'public\optimized\products'
$toRemove = @()
if (Test-Path $prod) {
    $toRemove += Get-ChildItem -Path $prod -Recurse -File -Force | Where-Object { ($_ -ne $null) -and (-not ($_.Name -match 'logo|hero')) }
}
if (Test-Path $opt) {
    $toRemove += Get-ChildItem -Path $opt -Recurse -File -Force | Where-Object { $_ -ne $null }
}
if ($toRemove.Count -eq 0) {
    Write-Output 'No product images found to delete.'
    exit 0
}
Write-Output "Found $($toRemove.Count) files to delete. Deleting now..."
foreach ($f in $toRemove) {
    try {
        Remove-Item -LiteralPath $f.FullName -Force -ErrorAction Stop
        Write-Output "Removed: $($f.FullName)"
    } catch {
        Write-Output "Failed to remove: $($f.FullName) -- $_"
    }
}
# Remove empty directories under these paths
Get-ChildItem -Path $prod -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object { (Get-ChildItem -Path $_.FullName -Force -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0 } | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse; Write-Output "Removed empty directory: $($_.FullName)" }
Get-ChildItem -Path $opt -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object { (Get-ChildItem -Path $_.FullName -Force -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0 } | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse; Write-Output "Removed empty directory: $($_.FullName)" }
# Git commit
Write-Output 'Updating .gitignore to ensure node_modules is ignored...'
if (-Not (Test-Path .gitignore)) { New-Item -Path .gitignore -ItemType File -Force }
if (-Not (Select-String -Path .gitignore -Pattern '^node_modules/' -Quiet -ErrorAction SilentlyContinue)) { Add-Content -Path .gitignore -Value 'node_modules/'; Write-Output 'Added node_modules/ to .gitignore' } else { Write-Output '.gitignore already contains node_modules/' }
try { git rm -r --cached node_modules -q } catch { Write-Output 'git rm --cached node_modules returned non-zero or not present' }
Write-Output 'Staging changes...'
git add -A
try {
    git commit -m "chore: remove product images (public/products & public/optimized/products)" -a
    Write-Output 'Commit created.'
} catch {
    Write-Output 'Commit failed or nothing to commit.'
}
# Deploy via vercel
Write-Output 'Starting vercel deploy --prod --yes'
try {
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','vercel --prod --yes' -NoNewWindow -PassThru -Wait
    Write-Output "vercel exit code: $($proc.ExitCode)"
} catch {
    Write-Output "Failed to run vercel CLI: $_"
}
Write-Output 'Done.'
