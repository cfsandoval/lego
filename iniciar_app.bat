@echo off
title LSP Virtual Studio 3D - LEGO Serious Play
cd /d "%~dp0"
echo ========================================================
echo   Iniciando LSP Virtual Studio 3D (Multijugador + WebGL)
echo   Frontend: http://localhost:5173
echo   Servidor Socket.IO: http://localhost:3001
echo ========================================================
start "" "http://localhost:5173"
npm run dev
pause

