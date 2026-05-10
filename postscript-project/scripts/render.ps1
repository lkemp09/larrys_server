$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$name = if ($args.Count -gt 0) { $args[0] } else { "hello" }
$src = Join-Path $projectRoot "src\$name.ps"
$buildDir = Join-Path $projectRoot "build"
$out = Join-Path $buildDir "$name.pdf"

if (-not (Test-Path -LiteralPath $src)) {
  throw "PostScript source not found: $src"
}

New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

gswin64c `
  -dBATCH `
  -dNOPAUSE `
  -dSAFER `
  -sDEVICE=pdfwrite `
  "-sOutputFile=$out" `
  $src

Write-Host "Rendered $out"
