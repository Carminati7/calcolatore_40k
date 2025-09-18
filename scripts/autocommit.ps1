<#
Autocommit file watcher
- Watches the workspace for file changes (excluding .git)
- Debounces events and runs `git add -A` and `git commit -m "autosave: ..."`
- Does NOT push. You must run `git push` manually.

Usage:
- Run from the workspace root in a PowerShell terminal:
    .\scripts\autocommit.ps1
- Or use the included VS Code task (Tasks: Run Task -> Autocommit Watcher)

Notes:
- The script is intentionally conservative: it groups rapid changes into a single commit and only commits when `git status` shows changes.
- You can stop it with Ctrl+C in the terminal.
#>
param(
    [string]$WatchPath = "${PSScriptRoot}\.."
)

Set-Location -Path $WatchPath
Write-Host "Starting autocommit watcher in: $((Get-Location).ProviderPath)" -ForegroundColor Cyan

# Exclude .git and node_modules and hidden folders
$excludePattern = '\\\.git\\|\\\bnode_modules\\\b|\\\.vscode\\\b'

# Pending changes buffer
$pending = [System.Collections.Concurrent.ConcurrentDictionary[string,bool]]::new()

# Debounce timer (milliseconds)
$debounceMs = 2000
$timer = New-Object System.Timers.Timer $debounceMs
$timer.AutoReset = $false

# Timer elapsed: perform git add & commit if needed
$timer.add_Elapsed({
    try {
        if ($pending.Count -eq 0) { return }
        $files = $pending.Keys | Sort-Object
        $pending.Clear() | Out-Null

        # Check if there are changes to commit
        $status = git status --porcelain
        if ([string]::IsNullOrWhiteSpace($status)) {
            Write-Host "No changes to commit." -ForegroundColor Yellow
            return
        }

        # Stage and commit
        git add -A
        $summary = ($files -join ", ")
        if ($summary.Length -gt 120) { $summary = $summary.Substring(0,120) + '...' }
        $timestamp = (Get-Date).ToString('s')
        $msg = "autosave: $summary @ $timestamp"
        git commit -m $msg
        Write-Host "Autocommit created: $msg" -ForegroundColor Green
    } catch {
        Write-Host "Autocommit failed: $_" -ForegroundColor Red
    }
})

# FileSystemWatcher
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = (Get-Location).ProviderPath
$fsw.IncludeSubdirectories = $true
$fsw.Filter = '*.*'
$fsw.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, Size'

# Event handler for create/change/rename
$action = {
    $path = $Event.SourceEventArgs.FullPath
    if ($path -match $excludePattern) { return }
    if (Test-Path $path -PathType Container) { return }
    # Record pending change
    $null = $pending.TryAdd($path, $true)
    # Restart debounce timer
    $timer.Stop()
    $timer.Start()
}

Register-ObjectEvent $fsw Created -Action $action -SourceIdentifier FSW_Created | Out-Null
Register-ObjectEvent $fsw Changed -Action $action -SourceIdentifier FSW_Changed | Out-Null
Register-ObjectEvent $fsw Renamed -Action $action -SourceIdentifier FSW_Renamed | Out-Null

# Start watching
$fsw.EnableRaisingEvents = $true
Write-Host "Autocommit watcher is running. Press Ctrl+C to stop." -ForegroundColor Cyan

# Keep the script alive
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    # Cleanup
    Unregister-Event -SourceIdentifier FSW_Created -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier FSW_Changed -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier FSW_Renamed -ErrorAction SilentlyContinue
    $timer.Stop()
    $fsw.Dispose()
    Write-Host "Autocommit watcher stopped." -ForegroundColor Cyan
}
