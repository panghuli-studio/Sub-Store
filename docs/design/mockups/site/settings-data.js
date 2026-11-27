const choices = (entries) => Object.fromEntries(entries);
const field = (name, label, type = 'text', extra = {}) => ({ $formkit: type, name, label, preserve: true, ...extra });
const number = (name, label, placeholder, help) => field(name, label, 'number', { min: 0, step: 1, validation: 'min:0', placeholder: String(placeholder), help });
const select = (name, label, options, extra = {}) => field(name, label, 'select', { options, ...extra });
const toggle = (name, label, extra = {}) => field(name, label, 'checkbox', extra);
const modes = choices([['expanded','展开'],['collapsed','收起'],['hidden','不显示']]);
const themeOptions = { dark: '深色', light: '浅色' };
export const settingsCards = [
 ['github','GitHub 配置','用户名、令牌、上传格式与代理','faCloudArrowUp'],
 ['requests','请求配置','代理、User-Agent、超时与后端并发','faArrowsRotate'],
 ['cache','缓存配置','资源、响应头、脚本缓存与日志条数','faBoxArchive'],
 ['frontend','前端配置','请求并发与 API 超时','faSliders'],
 ['appearance','外观与交互','主题、卡片、编辑器与导航','faGear'],
 ['backends','后端管理','切换、新建与管理多个后端','faLink'],
 ['backup','备份与恢复','Gist 同步或手动管理示例数据','faFileExport'],
 ['logs','Sub-Store 日志','查看、筛选与管理后端日志','faTerminal'],
 ['language','语言','界面语言偏好','faGlobe'],
 ['about','关于','前后端版本、项目与帮助','faCircleInfo'],
];
export const settingsSchemas = {
 github: [
  field('githubUser','GitHub 用户名','text',{placeholder:'example-user'}),
  field('gistToken','GitHub 令牌','password',{help:'只填写示例值。正式使用需要有 Gist 访问权限的令牌。', autocomplete:'off'}),
  select('gistUpload','Gist 上传格式',{base64:'Base64 编码',plaintext:'明文（不带 GitHub Token）',age:'age 加密'}),
  select('gistDownloadTokenStrategy','下载时 Token',{ask:'每次询问',overwrite:'覆盖 Token',keep:'保留当前 Token'},{help:'保留当前 Token 需要后端 ≥ 2.19.83。'}),
  field('ageSecretKey','age 备份解密私钥','password',{if:'$values.gistUpload === "age"',help:'选择 age 上传格式时显示。密钥助手可生成示例密钥。',autocomplete:'off'}),
  field('githubApiUrl','GitHub API 地址','url',{placeholder:'https://api.github.com',validation:'url'}),
  number('githubApiTimeout','GitHub API 超时（毫秒）',10000),
  number('artifactSyncBatchSize','同步上传分批大小',10),
  field('githubProxy','GitHub 加速代理','text',{placeholder:'https://proxy.example.invalid/'}),
  field('githubProxyRegex','加速代理匹配正则','text',{help:'仅保存在演示浏览器，不会发起代理请求。'}),
 ],
 requests: [
  field('defaultProxy','默认代理／策略'),field('defaultUserAgent','默认 User-Agent'),field('defaultFlowUserAgent','流量信息 User-Agent'),
  number('defaultTimeout','默认请求超时（毫秒）',8000),number('githubApiTimeout','GitHub API 超时（毫秒）',10000),
  number('backendRequestConcurrency','后端请求并发数',10),number('backendRequestConcurrencyWaitTime','后端并发等待（毫秒）',0),
 ],
 cache: [number('cacheThreshold','缓存阈值（KB）',1024),number('resourceCacheTtl','资源缓存（秒）',3600),number('headersCacheTtl','响应头缓存（秒）',60),number('scriptCacheTtl','脚本缓存（秒）',172800),number('logsMaxCount','最大日志条数',0,'0 表示关闭后端日志缓存。')],
 frontend: [number('concurrency','前端请求并发数',3),number('concurrencyWaitTime','并发等待（毫秒）',0),number('apiCheckTimeout','API 检测超时（毫秒）',3000),number('apiRequestTimeout','前端请求超时（毫秒）',50000)],
 appearance: [
  {$el:'h3',children:'主题'},toggle('themeAuto','跟随系统主题'),
  select('themeDark','系统深色时使用',themeOptions,{if:'$values.themeAuto === true'}),
  select('themeLight','系统浅色时使用',themeOptions,{if:'$values.themeAuto === true'}),
  select('themeName','主题',themeOptions,{if:'$values.themeAuto !== true'}),
  {$el:'h3',children:'卡片与图标'},toggle('isSimpleMode','简洁模式'),toggle('isSimpleReicon','简洁模式显示刷新按钮'),toggle('isSimpleShowRemark','简洁模式显示备注'),
  toggle('isDefaultIcon','恢复默认图标'),toggle('isShowIcon','显示图标'),toggle('isIconColor','自定义图标使用原始颜色'),
  select('iconFit','图标填充模式',{contain:'完整显示',cover:'填满裁切',fill:'拉伸填满','scale-down':'按需缩小',none:'原始大小'}),
  toggle('isLeftRight','卡片右滑呼出菜单'),toggle('isSubItemMenuFold','收纳订阅页菜单'),select('subProgressStyle','订阅进度样式',{hidden:'不显示',background:'显示为背景'}),
  toggle('hidePublicLinkActionButton','隐藏订阅官网按钮'),toggle('displayPreviewInWebPage','在网页中预览'),
  {$el:'h3',children:'编辑器'},select('editorGroupingMode','详情页分组模式',{'edit-only':'仅编辑页',disabled:'不分组',always:'总是分组'}),
  select('editorCommonDisplayMode','详情页常用配置',modes),select('actionButtonsDisplayMode','节点／文件操作按钮',{responsive:'响应式',compact:'紧凑',loose:'宽松'}),
  select('manualSubscriptionsDisplayMode','手动选择的订阅',{expanded:'展开',collapsed:'收起'}),
  {$el:'h3',children:'列表与导航'},select('createItemPosition','新条目位置',{top:'最上面',bottom:'最下面'}),toggle('showFloatingAddButton','显示悬浮添加按钮'),toggle('showFloatingRefreshButton','显示悬浮刷新按钮',{help:'保留原版设置；当前确认稿不显示列表工具栏刷新按钮。'}),
  toggle('istabBar2','隐藏文件页'),toggle('istabBar3','隐藏分享页'),toggle('istabBar','隐藏 Gist 同步页'),
  select('listPageViewMode','列表布局',{'single-column':'单列','dual-column':'双列'}),select('listPageViewModeInWideScreenNarrowMode','宽屏窄导航时的列表布局',{'single-column':'单列','dual-column':'双列'}),toggle('useNarrowModeOnWideScreen','宽屏使用窄导航'),
  toggle('invalidShareFakeNode','无效分享返回假节点',{if:'$capabilities.share',help:'防止客户端继续使用无效分享的缓存。'}),
 ],
 language: [select('locale','界面语言',{zh:'简体中文',en:'English',ru:'Русский'},{help:'保存语言偏好；整个原型的翻译由根应用接入，当前设置说明仍用中文。'})],
 backup: [select('storageType','管理方式',{gist:'Gist 同步',manual:'手动管理'})],
};
export const backendSchema = [field('name','后端名称','text',{validation:'required',placeholder:'演示后端'}),field('url','后端地址','text',{validation:'required',help:'支持完整 URL、相对路径或带端口的主机地址。',placeholder:'https://backend.example.invalid/api-path'}),field('shareBaseUrl','分享基础地址','text',{help:'可选的独立分享入口，仅支持 http/https 完整地址。',placeholder:'https://share.example.invalid'})];
export const defaultSettings = {
 github:{githubUser:'example-user',gistToken:'DEMO-TOKEN-NOT-VALID',gistUpload:'base64',gistDownloadTokenStrategy:'ask',ageSecretKey:'',githubApiUrl:'https://api.github.com',githubApiTimeout:10000,artifactSyncBatchSize:10,githubProxy:'',githubProxyRegex:''},
 requests:{defaultProxy:'',defaultUserAgent:'',defaultFlowUserAgent:'',defaultTimeout:8000,githubApiTimeout:10000,backendRequestConcurrency:10,backendRequestConcurrencyWaitTime:0},
 cache:{cacheThreshold:1024,resourceCacheTtl:3600,headersCacheTtl:60,scriptCacheTtl:172800,logsMaxCount:0},
 frontend:{concurrency:3,concurrencyWaitTime:0,apiCheckTimeout:3000,apiRequestTimeout:50000},
 appearance:{themeAuto:false,themeName:'dark',themeDark:'dark',themeLight:'light',isSimpleMode:false,isSimpleReicon:true,isSimpleShowRemark:true,isDefaultIcon:false,isShowIcon:true,isIconColor:false,iconFit:'contain',isLeftRight:false,isSubItemMenuFold:false,subProgressStyle:'background',hidePublicLinkActionButton:false,displayPreviewInWebPage:true,editorGroupingMode:'edit-only',editorCommonDisplayMode:'expanded',actionButtonsDisplayMode:'responsive',manualSubscriptionsDisplayMode:'expanded',createItemPosition:'top',showFloatingAddButton:false,showFloatingRefreshButton:false,istabBar:false,istabBar2:false,istabBar3:false,listPageViewMode:'dual-column',listPageViewModeInWideScreenNarrowMode:'single-column',useNarrowModeOnWideScreen:false,invalidShareFakeNode:false},
 language:{locale:'zh'},backup:{storageType:'gist'},
 backends:[{id:'default',name:'默认后端',url:'https://backend.example.invalid',shareBaseUrl:'',isDefault:true},{id:'demo',name:'演示备用后端',url:'https://secondary.example.invalid',shareBaseUrl:'https://share.example.invalid',isDefault:false}],currentBackend:'default',
};
export const copy = {
 demo:'示例设置保存在当前浏览器。不会连接、修改或清除真实后端；请勿输入真实凭据。',close:'关闭设置详情',save:'保存设置',cancel:'取消',saved:'已保存到当前浏览器',back:'返回设置',current:'当前使用',default:'默认后端',backendAdd:'添加后端',backendEdit:'编辑后端',backendSwitch:'切换后端',backendDelete:'删除后端',backendCopy:'复制前端入口',backendPreview:'解析后的地址',backendCheck:'连通性检查',checkDemo:'演示：不会请求该地址，实际连通性尚未验证',backendDuplicate:'已有相同地址，请切换到该后端，或确认覆盖名称与分享地址。',duplicateSwitch:'切换到已有后端',duplicateOverwrite:'覆盖已有配置',backendBad:'请输入合法地址；主机地址需要端口，分享地址必须为 http/https 完整 URL。',backendNameDuplicate:'后端名称不能重复',copied:'已复制示例入口',copyFailed:'浏览器未允许复制，请手动选择地址复制',confirmDelete:'确认删除这个演示后端？不会影响真实后端。',confirm:'确认',empty:'没有其他后端',githubNotice:'Gist 上传与下载只演示操作反馈，使用此处保存的示例 GitHub 设置。',gotoGithub:'配置 GitHub',upload:'上传到 Gist',download:'从 Gist 下载',manualBackup:'导出示例备份',manualRestore:'恢复示例备份',file:'选择 JSON 示例备份',exported:'已下载示例设置备份',restored:'已恢复示例设置备份',restoreInvalid:'备份不是本原型支持的 JSON 格式',tokenTitle:'下载时如何处理 Token',tokenKeep:'保留当前 Token',tokenOverwrite:'覆盖 Token',remember:'以后使用本次选择',downloadDemo:'已演示下载；未请求 Gist',uploadDemo:'已演示上传；未请求 Gist',lastSync:'最近同步',never:'尚未同步',keyHelper:'打开密钥助手',keyType:'密钥类型',keySecret:'示例私钥',keyGenerate:'生成示例密钥',keyCopy:'复制示例私钥',keyApply:'填入当前字段',keyClear:'清空私钥',keyClose:'收起密钥助手',noGistToken:'请先在 GitHub 配置中填写示例令牌后再演示同步',keyNotice:'演示密钥不可用于加密；正式密钥由后端 age 密钥工具生成。',clearFront:'清除演示前端数据',clearBackend:'清除后端数据（演示）',clearConfirm:'确认清除本原型保存的设置？不影响原版、真实后端或其他项目。',clearBackendConfirm:'确认演示清除后端数据？实际不会发送请求。',clearDone:'已清除本原型的本地设置',clearBackendDone:'已演示确认；真实后端数据未变更',cancelled:'已取消',share:'分享管理',archives:'已归档',aboutVersion:'设计基准：Sub-Store 前端 2.34.4；后端版本未连接，未知。',aboutLinks:'项目与帮助',backendEnv:'当前为示例后端。真实环境、后端名称、图标、版本及更新状态需连接后端获取。',updated:'有新版本（示例）',status:'操作结果',restoreHelp:'仅接受本原型导出的示例设置，不导入真实订阅或节点。',languages:'语言偏好已保存；全站语言由根应用处理。',ageCopied:'已生成演示密钥，请勿用于真实加密。',downloadHint:'保留当前 Token 需要后端 ≥ 2.19.83；此处不验证真实后端版本。',shareUnavailable:'当前演示未启用分享能力',archiveUnavailable:'当前演示未启用归档能力',
};
export const aboutLinks = [
 ['前端项目','https://github.com/sub-store-org/Sub-Store-Front-End'],['前端更新记录','https://github.com/sub-store-org/Sub-Store-Front-End/releases'],['代理 App 模块','https://github.com/sub-store-org/Sub-Store/tree/master/config'],['项目团队','https://github.com/sub-store-org'],['团队 Telegram','https://telegram.me/cool_scripts'],['脚本教程 Telegram','https://telegram.me/zhetengsha/214'],['后端项目','https://github.com/sub-store-org/Sub-Store'],['脚本教程','https://github.com/sub-store-org/Sub-Store/wiki'],['更新记录','https://github.com/sub-store-org/Sub-Store/releases'],
];
