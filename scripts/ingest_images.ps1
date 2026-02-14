Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
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
    'file_34' = 'epitalon-10mg-2.png'
}
$inbound = 'C:\Users\Claud\.openclaw\media\inbound'
$dest = Join-Path $PWD 'public\products'
if (-Not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
$added = @()
foreach ($f in Get-ChildItem -Path $inbound -File -ErrorAction SilentlyContinue) {
    $base = ($f.BaseName)
    if ($map.ContainsKey($base)) {
        $target = Join-Path $dest $map[$base]
    } else {
        # fallback: use original name
        $target = Join-Path $dest $f.Name
    }
    try {
        Copy-Item -LiteralPath $f.FullName -Destination $target -Force
        $added += $target
        Write-Output "Copied $($f.Name) -> $target"
    } catch {
        Write-Output "Failed to copy $($f.FullName): $_"
    }
}
# Run optimizer
Write-Output 'Running image optimizer (node scripts/optimize-images.js)'
try {
    node scripts/optimize-images.js
} catch {
    Write-Output "Optimizer failed: $_"
}
# Update catalog data.ts (simple replacement: ensure filenames present)
$catalog = 'src\app\catalog\data.ts'
if (Test-Path $catalog) {
    $content = Get-Content $catalog -Raw
    foreach ($k in $map.GetEnumerator()) {
        # naive replace: replace any common old basename with new path
        $old = $k.Key
        $new = "/products/" + $k.Value
        $content = $content -replace [regex]::Escape($old), $new
    }
    Set-Content -Path $catalog -Value $content
    Write-Output 'Updated catalog data.ts (naive replacements applied)'
} else {
    Write-Output 'Catalog file not found; skipping catalog update.'
}
# Git add/commit
git add -A
try { git commit -m "feat: add product images and optimized variants (ingest)" -a; Write-Output 'Commit created' } catch { Write-Output 'No changes to commit' }
# Deploy
Write-Output 'Deploying via vercel --prod --yes'
cmd.exe /c "vercel --prod --yes"
Write-Output 'Done.'
