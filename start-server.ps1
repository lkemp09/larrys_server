$nodeCandidates = @(
  "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe",
  "node"
)

$nodePath = $null

foreach ($candidate in $nodeCandidates) {
  $command = Get-Command $candidate -ErrorAction SilentlyContinue

  if ($command) {
    $nodePath = $command.Source
    break
  }
}

if (-not $nodePath) {
  Write-Error "Node.js was not found. Install Node.js or update start-server.ps1 with the path to node.exe."
  exit 1
}

& $nodePath "$PSScriptRoot\server.js"
