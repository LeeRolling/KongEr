# 安卓版构建说明

这个目录是网页版外面套的一层 WebView 壳子。**核心代码全在 `app/assets/`，由构建脚本从仓库根目录自动同步过来**，不要手改。

## 目录

    android/
    ├── app/
    │   ├── AndroidManifest.xml   包名 / 版本 / 权限声明
    │   ├── java/com/konger/app/MainActivity.java   就一个 WebView
    │   ├── res/                  图标 + 字符串资源
    │   └── assets/               ← 构建时自动生成，已在 .gitignore 里
    ├── konger.keystore           签名密钥（重要，见下）
    ├── build-apk.ps1             一键打包脚本
    └── build/                    中间产物，可随时删

## 重新打包

改完仓库根目录的 `index.html` / `konger.js` / `pinyin-data.js` 之后，跑一条命令：

    powershell -ExecutionPolicy Bypass -File build-apk.ps1 -Version 1.0.1

脚本会自动：

1. 把根目录三个网页文件复制进 `app/assets/`
2. 更新 `AndroidManifest.xml` 里的版本号
3. aapt2 编译资源 → javac → d8 生成 dex → 打包 → zipalign → 签名
4. 产物丢到 `..\APP\KongEr-<版本>.apk`

## ⚠️ 签名密钥千万别丢

`konger.keystore`（密码 `konger123`）是**覆盖安装的唯一凭证**。

- 用它签的新 APK 可以直接覆盖旧版安装，数据保留
- **丢了就只能让用户卸载重装**
- 已加入 `.gitignore`，不会上传到 GitHub
- **建议自己再抄一份存别处**

## 工具链（.toolchain）

打包需要 JDK 17 + Android SDK（build-tools 34.0.0、platform android-34），放在仓库根的 `.toolchain/`，约 1.5 GB，**不进版本库**。

如果哪天删掉了，重建步骤：

1. JDK 17：https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse
   解压到 `.toolchain/jdk`（让 `.toolchain/jdk/bin/javac.exe` 存在）
2. Android 命令行工具：https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip
   解压到 `.toolchain/sdk/cmdline-tools/latest`
3. 装组件：

       $env:JAVA_HOME = "<仓库>\.toolchain\jdk"
       & "<仓库>\.toolchain\sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="<仓库>\.toolchain\sdk" "platforms;android-34" "build-tools;34.0.0"

## ⚠️ 一个必须记住的坑：中文路径

`aapt2` 是 C++ 工具，参数走系统 ANSI 编码，**遇到中文路径不会报错，但会静默地不打包 assets**——
结果就是 APK 打出来了、签名也过了，装上去却是一片白屏。

所以脚本会在 `%TEMP%\konger-apk-build\`（纯 ASCII）里完成全部构建，最后再把 APK 拷回 `APP\`。
**别把这一步去掉**，也别把工程放到中文路径下直接构建。

脚本最后还有一道**产物校验**：检查 APK 里有没有 `assets/index.html`、`assets/konger.js`、
`assets/pinyin-data.js`、`classes.dex`、`resources.arsc`，缺任何一个就直接抛错，不让坏包流出去。

## 说明

- 包名 `com.konger.app`，minSdk 21（Android 5.0+），targetSdk 34
- 不需要任何权限，不联网
- 自签名证书，装的时候系统会提示「未知来源」，正常现象
