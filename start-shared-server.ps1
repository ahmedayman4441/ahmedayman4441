$ErrorActionPreference = 'SilentlyContinue'
$projectDir = 'E:\برنامج-المبيعات-الذكي-وتصدير-الإكسيل'

$server = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*node.exe' -and $_.StartInfo -match 'server.js' }
if ($server) { Stop-Process -Id $server.Id -Force }

Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $projectDir -WindowStyle Hidden
Start-Sleep -Seconds 2
Start-Process -FilePath 'C:\Users\ahmed\AppData\Roaming\npm\lt.cmd' -ArgumentList '--port 3002 --subdomain smartsalesapp' -WorkingDirectory $projectDir -WindowStyle Hidden
