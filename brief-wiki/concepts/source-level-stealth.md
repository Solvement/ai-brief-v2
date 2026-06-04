---
name: "源码级隐身"
slug: "source-level-stealth"
kind: "concept"
tags:
  - "anti-detection"
  - "stealth"
maturity: "active"
first_seen_in: "cloakbrowser"
related_content:
  - "cloakbrowser"
related_concepts: []
explanation: "在浏览器引擎源代码层面（C++）修改指纹数据，使得浏览器在底层看起来与真实用户无异，规避 JavaScript 指纹检测。"
examples:
  - "CloakBrowser 对 canvas、WebGL、audio 等指纹进行 C++ 级替换。"
common_misunderstandings:
  - "认为只需修改 navigator.webdriver 等 JS 属性即可绕过后端检测，实际上现代反爬会检查渲染一致性、底层 API 行为等。"
open_questions:
  - "反爬厂商是否会针对特定二进制构建指纹库进行防御？"
---

## Explanation

在浏览器引擎源代码层面（C++）修改指纹数据，使得浏览器在底层看起来与真实用户无异，规避 JavaScript 指纹检测。 出处:https://github.com/cloakhq/cloakbrowser。See [[content/cloakbrowser]]。

## Supported by
- [[claims/cloakbrowser-main-claim]]
