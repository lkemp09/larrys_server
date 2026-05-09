# postscript-project

A small PostScript starter project.

## Render

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\render.ps1
```

This writes `build\hello.pdf`.

## Project Layout

- `src\hello.ps` - sample PostScript document
- `scripts\render.ps1` - Ghostscript render helper
- `build\` - generated files
