<#
  KongEr 生成器 —— 一键打包安卓 APK

  用法:
      powershell -ExecutionPolicy Bypass -File build-apk.ps1 -Version 1.1.0

  依赖: ..\.toolchain\   (JDK 17 + Android SDK；丢了的话见 README.md)
  产物: ..\APP\KongEr-<版本>.apk

  注意: aapt2 是 C++ 工具，参数走系统 ANSI 编码，**处理不了中文路径**。
        所以整个构建过程会先在 %TEMP% 下的纯 ASCII 目录里进行，
        最后再把 APK 拷回 APP\。别把这一步去掉。
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
$appSrc   = Join-Path $here 'app'
$outDir   = Join-Path $root 'APP'
$ksSrc    = Join-Path $here 'konger.keystore'
$ksPass   = 'konger123'

function Need($p, $label) {
    if (-not (Test-Path -LiteralPath $p)) { throw ('缺少' + $label + ': ' + $p) }
}
Need (Join-Path $jdk 'bin\javac.exe') 'JDK'
Need (Join-Path $bt 'aapt2.exe') 'Android build-tools 34.0.0'
Need $platform 'android.jar (platform 34)'
Need $ksSrc '签名密钥 konger.keystore（丢了无法覆盖安装，见 README.md）'

$env:JAVA_HOME = $jdk
$env:Path = (Join-Path $jdk 'bin') + ';' + $env:Path

Write-Host '[1/9] 同步网页资源 -> app/assets'
$assetsSrc = Join-Path $appSrc 'assets'
New-Item -ItemType Directory -Force -Path $assetsSrc | Out-Null
foreach ($f in @('index.html', 'konger.js', 'pinyin-data.js')) {
    Copy-Item -LiteralPath (Join-Path $root $f) -Destination $assetsSrc -Force
}

Write-Host ('[2/9] 写入版本号 ' + $Version)
$mfSrc = Join-Path $appSrc 'AndroidManifest.xml'
$mf = [IO.File]::ReadAllText($mfSrc)
$vc = 0
foreach ($seg in $Version.Split('.')) { $vc = $vc * 100 + [int]$seg }
$mf = [Text.RegularExpressions.Regex]::Replace($mf, 'android:versionName="[^"]*"', 'android:versionName="' + $Version + '"')
$mf = [Text.RegularExpressions.Regex]::Replace($mf, 'android:versionCode="[^"]*"', 'android:versionCode="' + $vc + '"')
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($mfSrc, $mf, $utf8)

Write-Host '[3/9] 准备纯 ASCII 构建目录'
$stage = Join-Path $env:TEMP 'konger-apk-build'
Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Copy-Item -LiteralPath $appSrc -Destination (Join-Path $stage 'app') -Recurse -Force
Copy-Item -LiteralPath $platform -Destination (Join-Path $stage 'android.jar') -Force
Copy-Item -LiteralPath $ksSrc -Destination (Join-Path $stage 'konger.keystore') -Force

$app   = Join-Path $stage 'app'
$asm   = Join-Path $stage 'android.jar'
$ks    = Join-Path $stage 'konger.keystore'
$build = Join-Path $stage 'build'
foreach ($d in @('compiled', 'gen', 'classes', 'dex')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $build $d) | Out-Null
}
$compiled = Join-Path $build 'compiled'
$gen      = Join-Path $build 'gen'
$classes  = Join-Path $build 'classes'
$dex      = Join-Path $build 'dex'

Write-Host '[4/9] aapt2 compile + link'
$aapt2 = Join-Path $bt 'aapt2.exe'
$resDir = Join-Path $app 'res'
Get-ChildItem -Path $resDir -Recurse -File | ForEach-Object {
    & $aapt2 compile -o $compiled $_.FullName 2>&1 | Out-Null
}
$baseApk = Join-Path $build 'base.apk'
$a2 = @('link', '-o', $baseApk, '-I', $asm,
        '--manifest', (Join-Path $app 'AndroidManifest.xml'),
        '--java', $gen, '--auto-add-overlay', '-A', (Join-Path $app 'assets'))
Get-ChildItem -Path $compiled -Filter *.flat -Recurse | ForEach-Object { $a2 += '-R'; $a2 += $_.FullName }
& $aapt2 @a2 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath $baseApk)) { throw 'aapt2 link 失败' }

Write-Host '[5/9] javac'
$srcs = @()
$srcs += (Get-ChildItem -Path (Join-Path $app 'java') -Recurse -Filter *.java | ForEach-Object { $_.FullName })
$srcs += (Get-ChildItem -Path $gen -Recurse -Filter *.java | ForEach-Object { $_.FullName })
& javac -source 8 -target 8 -bootclasspath $asm -encoding UTF-8 -nowarn -d $classes @srcs 2>&1 | Out-Null

Write-Host '[6/9] d8 -> classes.dex'
$jarPath = Join-Path $build 'classes.jar'
& jar cf $jarPath -C $classes . 2>&1 | Out-Null
& (Join-Path $bt 'd8.bat') --lib $asm --min-api 21 --output $dex $jarPath 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $dex 'classes.dex'))) { throw 'd8 失败' }

Write-Host '[7/9] 打入 dex + zipalign'
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

Write-Host '[8/9] 签名'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$final = Join-Path $outDir ('KongEr-' + $Version + '.apk')
Remove-Item -LiteralPath $final -Force -ErrorAction SilentlyContinue
& (Join-Path $bt 'apksigner.bat') sign --ks $ks --ks-pass ('pass:' + $ksPass) --key-pass ('pass:' + $ksPass) --out $final $aligned 2>&1 | Out-Null
if (-not (Test-Path -LiteralPath $final)) { throw 'apksigner 失败' }
& (Join-Path $bt 'apksigner.bat') verify $final 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw '签名校验没通过' }

Write-Host '[9/9] 校验 APK 内容'
$zipR = [IO.Compression.ZipFile]::OpenRead($final)
try { $names = @($zipR.Entries | ForEach-Object { $_.FullName }) } finally { $zipR.Dispose() }
$must = @('AndroidManifest.xml', 'resources.arsc', 'classes.dex', 'assets/index.html', 'assets/konger.js', 'assets/pinyin-data.js')
foreach ($n in $must) {
    if ($names -notcontains $n) { throw ('APK 校验失败：缺少 ' + $n + '（构建结果不可用，别发出去）') }
}

$size = [int]((Get-Item -LiteralPath $final).Length / 1KB)
Write-Host ''
Write-Host ('完成 -> ' + $final + '  (' + $size + ' KB)')
Write-Host ('校验通过：' + $names.Count + ' 个条目，网页资源齐全')
