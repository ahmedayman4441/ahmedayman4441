@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File .\start-shared-server.ps1
