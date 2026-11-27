# 已确认设计稿

此目录为开发视觉基准。`DESIGN-COMMENTS.md` 保存逐项确认的设计约束；`FUNCTION-PARITY.md` 为功能核对清单；`review/` 为确认截图。原型仅使用示例数据，不作为生产数据层。

```sh
npm ci
npm run check
npm run dev
```

本机预览 `http://127.0.0.1:4318/`，页面通过 `#/subs`、`#/files`、`#/sync`、`#/shares`、`#/archives`、`#/my` 切换。

正式实现沿用原版 API、状态管理、字段与加工逻辑；不可用原型中的本地模拟操作替换。
