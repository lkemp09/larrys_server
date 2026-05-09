$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$src = Join-Path $projectRoot "src\hello.ps"
$buildDir = Join-Path $projectRoot "build"
$out = Join-Path $buildDir "hello.pdf"

New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

gswin64c `
  -dBATCH `
  -dNOPAUSE `
  -dSAFER `
  -sDEVICE=pdfwrite `
  "-sOutputFile=$out" `
  $src

Write-Host "Rendered $out"

