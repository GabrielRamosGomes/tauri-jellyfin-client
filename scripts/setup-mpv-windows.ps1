# Downloads the pinned libmpv build into src-tauri/lib/mpv and generates the MSVC import library.
# To upgrade, bump $Build and $Hash from https://github.com/shinchiro/mpv-winbuild-cmake/releases
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Build = '20261017'
$Hash = 'dde0671072'
$Asset = "mpv-dev-x86_64-$Build-git-$Hash.7z"
$Url = "https://github.com/shinchiro/mpv-winbuild-cmake/releases/download/$Build/$Asset"

$Root = Split-Path $PSScriptRoot -Parent
$MpvDir = Join-Path $Root 'src-tauri\lib\mpv'
$Marker = Join-Path $MpvDir '.build'

function Find-MsvcTool($Name) {
    $VsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $VsWhere) {
        $Path = & $VsWhere -latest -products * -find "VC\Tools\MSVC\**\bin\Hostx64\x64\$Name" | Select-Object -First 1
    }
    if (-not $Path) { throw "$Name not found. Install Visual Studio with the 'Desktop development with C++' workload." }
    $Path
}

New-Item -ItemType Directory -Force $MpvDir | Out-Null

if ((Get-Content $Marker -ErrorAction SilentlyContinue) -ne $Asset) {
    Get-ChildItem $MpvDir -Force | Remove-Item -Recurse -Force
    $Archive = Join-Path $env:TEMP $Asset
    Write-Host "Downloading $Asset..."
    Invoke-WebRequest $Url -OutFile $Archive
    & "$env:SystemRoot\System32\tar.exe" -xf $Archive -C $MpvDir
    if ($LASTEXITCODE) { throw "Failed to extract $Archive" }
    Remove-Item $Archive
    Set-Content $Marker $Asset
}

$Dumpbin = Find-MsvcTool 'dumpbin.exe'
$Lib = Find-MsvcTool 'lib.exe'

Push-Location $MpvDir
try {
    # The DLL also exports unrelated Java_* symbols from the bundled libbluray; only mpv_* are needed.
    $Exports = & $Dumpbin /exports libmpv-2.dll |
        Select-String '^\s+\d+\s+[0-9A-F]+\s+[0-9A-F]{8}\s+(mpv_\S+)' |
        ForEach-Object { $_.Matches[0].Groups[1].Value }
    @('EXPORTS') + $Exports | Out-File mpv.def -Encoding ascii

    # /name makes the exe load libmpv-2.dll at runtime instead of mpv.dll.
    & $Lib /nologo /def:mpv.def /name:libmpv-2.dll /out:mpv.lib /machine:x64
    if ($LASTEXITCODE) { throw 'lib.exe failed to generate mpv.lib' }
}
finally {
    Pop-Location
}

Write-Host "libmpv $Build ready in $MpvDir"

