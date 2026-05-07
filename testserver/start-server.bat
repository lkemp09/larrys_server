@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe"

if exist "%NODE_EXE%" (
  "%NODE_EXE%" server.js
) else (
  node server.js
)
