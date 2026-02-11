Set-Location -Path 'C:\Users\Claud\.openclaw\workspace\site-template'
Write-Output 'Listing remaining backup files...'
Get-ChildItem -Path .\public\products -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '\.orig$|\.bak$|\.old$|\.backup$|\.bak\.' } | Select-Object FullName | Format-Table -AutoSize
Write-Output 'Listing backup directories...'
Get-ChildItem -Path .\public\products -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^backups$|_backup' } | Select-Object FullName | Format-Table -AutoSize
Write-Output 'Deleting matched files (this is permanent)...'
$items = Get-ChildItem -Path .\public\products -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { ($_.PSIsContainer -and ($_.Name -match '(^backups$|_backup)')) -or ($_.PSIsContainer -eq $false -and $_.Name -match '\.orig$|\.bak$|\.old$|\.backup$|\.bak\.') }
if ($null -ne $items -and $items.Count -gt 0) {
    foreach ($i in $items) {
        try {
            Remove-Item -LiteralPath $i.FullName -Force -Recurse -ErrorAction Stop
            Write-Output "Removed: $($i.FullName)"
        } catch {
            Write-Output "Failed to remove: $($i.FullName) -- $_"
        }
    }
} else {
    Write-Output 'No matched items found to delete.'
}
