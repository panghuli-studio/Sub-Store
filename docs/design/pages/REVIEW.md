# 界面验收

## 基线和范围

视觉基线是提交 `cac2e970` 中的确认稿与评论。源码基线是 Sub-Store-Front-End 2.34.4。截图位于本目录的 `review/`，覆盖六个主页面的 1280、375 两种宽度和深浅两种主题。

浏览器检查包含 Chromium、Firefox、WebKit。正常浏览器测试使用 HTTP 测试替身；真实后端测试另起回环地址服务和独立数据目录，两者不混用。

## 几何核对

以下数值由浏览器的 `getBoundingClientRect` 断言，见 `web/tests/geometry.spec.ts` 和 `details.spec.ts`。

| 对象 | 1280 宽 | 375 宽 |
|---|---|---|
| 订阅卡片左缘 | 248px | 16px |
| 默认订阅卡片 | 486 × 191px | 343 × 176px |
| 卡片行距 | 20px | 20px |
| 同步、分享、归档首卡顶边 | 128px | 112px |
| 设置卡片 | 780 × 100px | 343 × 100px |
| 编辑弹层宽度 | 520px | 343px |
| 设置路由弹层宽度 | 680px | 343px |

文件默认仅显示完整配置；每张文件卡片的操作数为 3 + 4。默认订阅卡片为 4 个主操作。设置主页为 10 个分类。布局测试同时检查横向溢出。

## 设计自查

| 检查 | 结果与证据 |
|---|---|
| 信息重复 | 分享卡片分别显示来源类型、到期信息和操作区，不重复堆叠到期信息；归档显示类型和归档时间。 |
| 层级 | 搜索是列表入口，标题属于卡片；没有被要求删除的页面眉题与大标题。 |
| 对齐 | 主列表左缘、列宽和设置卡片尺寸有上述几何断言。 |
| 颜色 | 标准深浅主题沿用确认稿变量；自定义主题通过原主题设置映射，另有回归检查。 |
| 留白 | 卡片行距 20px；原版分组标题和隐藏工具行不会继续占位。 |
| 交互入口 | 新建和管理在手机端可见；订阅保持四个主操作，文件保持七个操作；其余能力进入管理与设置。 |
| 状态 | 原加载、空态、错误提示与能力开关沿用；保存仍经过原校验与 API。 |
| 尺寸 | 卡片操作桌面 40px、手机 44px；新工具栏按钮 44px。 |
| 窄屏 | 375 宽单列，无横向溢出；手机新建订阅可进入链接编辑；设置列表可滚动到底部。 |
| 功能与视觉关系 | 保留原 API、store、处理链、编辑器和验证逻辑；确认稿的示例数据没有进入生产入口。 |

## 验证项目

- `pnpm lint`：Vue 脚本和模板可编译，新增原生控件受组件基线约束。
- `pnpm typecheck`、`pnpm build`：类型检查与正式构建。
- `pnpm design:check`：确认稿摘要与生成设计变量。
- `pnpm test`：故意增加原生按钮时，组件门禁必须拒绝。
- 浏览器检查：主页面截图、布局尺寸、六页无障碍、详情弹层、搜索、管理筛选、分组展开、编辑器四分类、请求字段、加工链、副本、导出、设置保存、主题、图标隐藏、自动同步开关、窄导航和手机新建。
- 真实后端：订阅链接更新与设置保存、文件分类可达、文件归档与恢复后的内容一致。

无障碍自动检查范围是六个主页面的 WCAG 2 A/AA、2.1 AA、2.2 AA 规则；不把它扩大表述成所有原版高级编辑器都经过完整无障碍认证。

详情页按路径、宽度和主题独立运行，保留各自的尺寸、截图和页面错误断言，不把多个页面的加载与截图累计在同一个用例时限内。

截图与无障碍检查先等待主区域的 `aria-busy=false`、指定主题及字体绘制完成。启动通知通过其关闭按钮处理，不依赖自动关闭计时器：后台标签页会按原配置暂停该计时器。回归用例阻塞设置响应并暂停通知，验证这两种状态不会被误当成就绪界面。

Gist、GitLab 和外部订阅请求没有使用真实账户在本次检查中执行；保留原实现与协议，不将这些外部服务记为实测通过。生产发布尚未执行。

## 登录回调与离线缓存

旧缓存会将 `/cdn-cgi/access/authorized` 导航交给应用页面，导致登录回调显示“地址未找到”。正式构建的原生服务工作线程回归检查在修复前无法收到网络回调标记，修复后通过。检查覆盖三种内核的回调直达网络、有旧页面时升级工作线程，以及普通页面离线导航。此项不再以禁用服务工作线程的页面检查代替。

## 检查结果

- 静态检查、类型检查、设计摘要检查、组件门禁自测和正式构建通过。
- 全量浏览器运行：72 项通过；9 个未设置真实后端地址的项目跳过，真实后端独立运行。
- 手机工具栏修订后的受影响检查：三内核共 54 项通过，包含新增的手机订阅链接入口回归。其他几何、详情和文档加载检查没有改动对应实现。
- 独立真实后端：3 项通过。检查脚本、种子数据和服务启动参数已入库，CI 执行同一流程。
- 标准主页面无障碍检查：三内核共 18 项通过，结果包含在上述浏览器检查中，不重复累计。

Saved list filters are surfaced inside search only while active, with a tooltip and a keyboard-accessible clear action. A persisted remote-only subscription filter previously hid local subscriptions and collections with no visible explanation. The regression fails before the toolbar change and passes after it at 390px and 1440px in Chromium, Firefox and WebKit; clearing restores local/combined resources and survives reload. Default search/card geometry remains covered by the existing interaction and geometry checks. Mobile and desktop screenshots were read. No backend data, source classification or filtering capability is changed.
