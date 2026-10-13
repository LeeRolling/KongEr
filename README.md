# KongEr 生成器

[![Release](https://img.shields.io/github/v/release/LeeRolling/KongEr?color=3b6ef0)](https://github.com/LeeRolling/KongEr/releases)
[![License](https://img.shields.io/github/license/LeeRolling/KongEr?color=8ff0b8)](LICENSE)
[![Stars](https://img.shields.io/github/stars/LeeRolling/KongEr?color=f5c542)](https://github.com/LeeRolling/KongEr/stargazers)
[![在线体验](https://img.shields.io/website?url=https%3A%2F%2Fleerolling.github.io%2FKongEr%2F&label=online%20demo)](https://leerolling.github.io/KongEr/)

> 中文 → 英文谐音。**funny mud go pee** 那种。

把中文按拼音谐音翻译成一串英文单词。微信自带的机翻遇到这种东西基本原样返回，所以对方**翻译不出来**。

纯前端、离线、零依赖，双击 `index.html` 就能用。

## 效果

| 中文 | 空耳 |
| --- | --- |
| 放你妈的狗屁 | funny mud go pee |
| 你就是傻逼 | need juice sad bee |
| 你是猪吗 | knee she drew mud |
| 关你屁事 | gwan knee pee sure |
| 你有病吧 | knee yo bing bah |
| 你是不是有病 | knee she boo she yo bing |
| 牛逼 | new bee |
| 卧槽 | war tsow |
| 笑死我了 | show sir war luh |
| 我爱你 | wall may knee |
| 对不起 | dway boo chee |
| 谢谢你 | shee-eh shee-eh knee |
| 多喝热水 | dwaw her ruh shway |
| 早点睡 | dzow dee-en shway |
| 吃了吗 | chir luh mud |
| 明天见 | ming tee-en jee-en |
| 兄弟你太菜了 | shiong dee knee tie tsigh luh |
| 你等着 | knee dung juh |
| 我今天很开心 | war jean tee-en hun kite shin |
| 呵呵呵呵呵呵 | he he he he he he |

## 用法

1. `git clone` 本仓库，或者直接下载 zip
2. 双击 `index.html`（用浏览器打开）
3. 输入中文 → 点【生成】→ 点【复制这段】→ 粘进微信

不需要装任何东西，不联网，不上传任何数据。

## 功能

- **全覆盖拼音**：20924 个汉字、404 个拼音音节，打什么字都认识
- **400+ 音节对照表**：ni → need / knee、sha → sad、bi → bee、gou → go、pi → pee……
- **换一批**：同一个字有多个候选词，一直刷到最像、最好笑的那个再发
- **逐字对照**：结果下面显示每个字变成了什么，方便自己挑
- **经典成品语料**：内置十几条，输入整句直接命中（比如「放你妈的狗屁」→ funny mud go pee）
- **冷门音节兜底**：表里没有的走拼读规则，zh → j、q → ch、x → sh、ang → ong……

## 原理

    中文 → 拼音（无声调）→ 音节映射英文单词 → 拼成句子

1. 用 [mozillazg/pinyin-data](https://github.com/mozillazg/pinyin-data) 的汉字拼音表，取第一个读音并去掉声调
2. 每个音节在对照表里挑一个英文候选词（多候选时按种子随机）
3. 标点原样保留，直接拼成一句「英文」

## 它挡不住什么（请诚实使用）

- **挡不住 AI。** 把结果粘给任意大模型，基本秒破。所以这是**编码游戏**，不是加密
- 不保证每个音都像，多刷「换一批」挑满意的
- 生成的句子语法上毫无意义——这正是笑点所在

## 目录结构

    KongEr/
    ├── index.html        页面（双击这个）
    ├── konger.js         核心逻辑：音节表 + 生成算法
    ├── pinyin-data.js    汉字 → 拼音数据（构建产物，65 KB）
    ├── EXAMPLES.md       空耳语料库
    ├── LICENSE           MIT
    └── README.md

## 在线体验

本仓库可直接用 GitHub Pages 部署（根目录有 index.html）：

    https://leerolling.github.io/KongEr/

## 贡献

欢迎 PR，最欢迎这两类：

1. **补充音节对照表**：`konger.js` 里的 `SYL_RAW`，格式是 `音节:候选1,候选2|音节:...`。冷门音节、更妙的候选词都收
2. **补充经典语料**：`konger.js` 里的 `PHRASES`，格式是 `"中文": "kong er jie guo"`

## 数据来源与致谢

- 拼音数据：[mozillazg/pinyin-data](https://github.com/mozillazg/pinyin-data)（MIT）
- 灵感：中文互联网流传多年的「空耳」传统，以及 [javawz/taxx](https://github.com/javawz/taxx) 那个只留下一句 funny mud go pee 的仓库

## License

MIT