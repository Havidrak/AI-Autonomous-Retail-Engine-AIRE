@echo off
setlocal
cd /d "%~dp0.."
node scripts/dev-with-api.mjs --api-only
