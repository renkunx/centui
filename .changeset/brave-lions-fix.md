---
'@centui/react': patch
---

修复四项缺陷：ESM 产物泄漏 CJS require("react")（纯 ESM 环境崩溃，发行阻塞）、Stepper 受控初始值被 min/max 收敛 effect 错误钳位、Picker 无 defaultValue 时 confirm 返回空列值、TextareaItem maxlength 属性名告警。
