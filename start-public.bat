@echo off
cd /d "%~dp0"
start "shared-server" cmd /k node server.js
start "public-tunnel" cmd /k lt --port 3002 --subdomain smartsalesapp
exit
