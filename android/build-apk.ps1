<#
  KongEr 生成器 —— 一键打包安卓 APK

  用法:
      powershell -ExecutionPolicy Bypass -File build-apk.ps1 -Version 1.1.0

  依赖: ..\.toolchain\   (JDK 17 + Android SDK；丢了的话见 README.md)
  产物: ..\APP\KongEr-<版本>.apk
#>
param(
    [string]$Version = '1.0.0'
)

$ErrorActionPreference = 'Continue'

$here     = $PSScriptRoot
$root     = Split-Path $here -Parent
$tc       = Join-Path $root '.toolchain'
$jdk      = Join-Path $tc 'jdk'
$sdk      = Join-Path $tc 'sdk'
$bt       = Join-Path $sdk 'build-tools\34.0.0'
$platform = Join-Path $sdk 'platforms\android-34\android.jar'
$app      = Join-Path $here 'app'
$assets   = Join-Path $app 'assets'
$build    = Join-Path $here 'build'
$outDir   = Join-Path $root 'APP'
$ks       = Join-Path $here 'konger.keystore'
$ksPass   = 'konger123'

function Need($p, $label) {
    if (-not (Test-Path -LiteralPath $p)) { throw ('缺少' + $label + ': ' + $p) }
}
Need (Join-Path $jdk 'bin\javac.exe') 'JDK'
Need (Join-Path $bt 'aapt2.exe') 'Android build-tools 34.0.0'
Need $platform 'android.jar (platform 34)'
Need $ks '签名密钥 konger.keystore（丢了无法覆盖安装，见 README.md）'

$env:JAVA_HOME = $jdk
$env:Path = (Join-Path $jdk 'bin') + ';' + $env:Path

Write-Host '[1/8] 同步网页资源 -> assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
foreach ($f in @('index.html', 'konger.js', 'pinyin-data.js')) {
    Copy-Item -LiteralPath (Join-Path $root $f) -Destination $assets -Force
}

Write-Host ('[2/8] 写入版本号 ' + $Version)
$mfPath = Join-Path $app 'AndroidManifest.xml'
$mf = [IO.File]::ReadAllText($mfPath)
$vc = 0
foreach ($seg in $Version.Split('.')) { $vc = $vc * 100 + [int]$seg }
$mf = [Text.RegularExpressions.Regex]::Replace($mf, 'android:versionName="[^"]*"', 'android:versionName="' + $Version + '"')
$mf = [Text.RegularExpressions.Regex]::Replace($mf, 'android:versionCode="[^"]*"', 'android:versionCode="' + $vc + '"')
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($mfPath, $mf, $utf8)

Write-Host '[3/8] 清理 build'
Remove-Item -LiteralPath $build -Recurse -Force -ErrorAction SilentlyContinue
foreach ($d in @('compiled', 'gen', 'classes', 'dex')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $build $d) | Out-Null
}
$compiled = Join-Path $build 'compiled'
$gen      = Join-Path $build 'gen'
$classes  = Join-Path $build 'classes'
$dex      = Join-Path $build 'dex'

Write-Host '[4/8] aapt2 compile + link'
$aapt2 = Join-Path $bt 'aapt2.exe'
Get-ChildItem -Path (Join-Path $app 'res') -Recurse -File | ForEach-Object {
    & $aapt2 compile -o $compiled $_.FullName 2>&1 | Out-Null
}
$baseApk = Join-Path $build 'base.apk'
$a2 = @('link', '-o', $baseApk, '-I', $platform,
        '--manifest', (Join-Path $app 'AndroidManifest.xml'),
        '--java', $gen, '--auto-add-overlay', '-A', $assets)
Get-ChildItem -Path $compiled -Filter *.flat -Recurse | ForEach-Object { $a2 += '-R'; $a2 += $_.FullName }
& $aapt2 @a2 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath $baseApk)) { throw 'aapt2 link 失败' }

Write-Host '[5/8] javac'
$srcs = @()
$srcs += (Get-ChildItem -Path (Join-Path $app 'java') -Recurse -Filter *.java | ForEach-Object { $_.FullName })
$srcs += (Get-ChildItem -Path $gen -Recurse -Filter *.java | ForEach-Object { $_.FullName })
& javac -source 8 -target 8 -bootclasspath $platform -encoding UTF-8 -nowarn -d $classes @srcs 2>&1 | Out-Null

Write-Host '[6/8] d8 -> classes.dex'
$jarPath = Join-Path $build 'classes.jar'
& jar cf $jarPath -C $classes . 2>&1 | Out-Null
& (Join-Path $bt 'd8.bat') --lib $platform --min-api 21 --output $dex $jarPath 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $dex 'classes.dex'))) { throw 'd8 失败' }

Write-Host '[7/8] 打入 dex + zipalign'
$unsigned = Join-Path $build 'unsigned.apk'
Copy-Item -LiteralPath $baseApk -Destination $unsigned -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open($unsigned, 'Update')
try {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $dex 'classes.dex'), 'classes.dex', [IO.Compression.CompressionLevel]::Optimal) | Out-Null
} finally {
    $zip.Dispose()
}
$aligned = Join-Path $build 'aligned.apk'
& (Join-Path $bt 'zipalign.exe') -f -p 4 $unsigned $aligned 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath $aligned)) { throw 'zipalign 失败' }

Write-Host '[8/8] 签名'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$final = Join-Path $outDir ('KongEr-' + $Version + '.apk')
Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
& (Join-Path $bt 'apksigner.bat') sign --ks $ks --ks-pass ('pass:' + $ksPass) --key-pass ('pass:' + $ksPass) --out $final $aligned 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath $final)) { throw 'apksigner 失败' }

& (Join-Path $bt 'apksigner.bat') verify $final 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw '签名校验没通过' }

$size = [int]((Get-Item -LiteralPath $final).Length / 1KB)
Write-Host ''
Write-Host ('完成 -> ' + $final + '  (' + $size + ' KB)')
