<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as icons from './icons.js';
import IconButton from './IconButton.vue';
import SettingsView from './SettingsView.vue';
import ResourceEditor from './ResourceEditor.vue';
import ResourcePreview from './ResourcePreview.vue';
import LogsPanel from './LogsPanel.vue';
import QRCode from 'qrcode';
import { t, actionHelp } from './i18n.js';
import { files as fileFixtures, lists } from './data.js';
const nav=[['subs','faLink'],['files','faLayerGroup'],['sync','faArrowsRotate'],['shares','faShareNodes'],['archives','faBoxArchive'],['my','faGear']];
const fullAppearance=ref(JSON.parse(localStorage.getItem('sub-store-design-settings-v2')||'{}').values?.appearance||{});
const workspace=ref();
const visibleNav=computed(()=>nav.filter(([key])=>!(key==='files'&&fullAppearance.value.istabBar2)&&!(key==='sync'&&fullAppearance.value.istabBar)&&!(key==='shares'&&fullAppearance.value.istabBar3)));
const page=ref(location.hash.replace('#/','')||'files');
const params=new URLSearchParams(location.search);
const reference=false;
const theme=ref(params.get('theme')||'dark');
const state=ref(params.get('state')||'ready');
const query=ref('');const filter=ref(page.value==='files'?'config':'all');const single=ref(fullAppearance.value.listPageViewMode==='single-column');
const subscriptions=ref(lists.subs.map(item=>({...item})));
const otherLists=ref(JSON.parse(JSON.stringify(lists)));otherLists.value.archives=otherLists.value.archives.map(item=>({...item,archivedAt:'2026-11-26T12:00:00Z'}));const selectedIds=ref([]);const typeFilter=ref('');const tagFilter=ref('');const globalCron=ref(localStorage.getItem('sub-store-design-cron')||'');watch(globalCron,value=>localStorage.setItem('sub-store-design-cron',value));const importInput=ref();const dragIndex=ref(null);
const storageKey='sub-store-design-resources-v2';
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved){subscriptions.value=saved.subs;otherLists.value=saved.others}}catch{}
const items=ref([...fileFixtures]);
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved)items.value=saved.files}catch{}
watch([subscriptions,items,otherLists],()=>localStorage.setItem(storageKey,JSON.stringify({subs:subscriptions.value,files:items.value,others:otherLists.value})),{deep:true});
const allSources=computed(()=>[...subscriptions.value.map(item=>({...item,resourceKind:'sub'})),...items.value.map(item=>({...item,resourceKind:'file'}))].map(item=>({...item,name:t(item.name)})));
const currentSource=computed(()=>page.value==='files'?items.value:page.value==='subs'?subscriptions.value:(otherLists.value[page.value]||[]));
const listTypes=computed(()=>page.value==='shares'?['sub','col','file']:page.value==='archives'?['sub','col','file','artifact','share']:[...new Set(currentSource.value.map(item=>item.type))]);
const kindName=key=>({sub:'单订阅',col:'组合订阅',file:'文件',artifact:'同步产物',share:'分享'})[key]||t(key);
const listTags=computed(()=>[...new Set(currentSource.value.map(item=>item.tag).filter(Boolean))]);const activeItem=ref(null);const dialog=ref();const dialogKind=ref('');const activePreview=ref('processed');const logCleared=ref(false);const toast=ref('');const nameInput=ref('');const contentInput=ref(t('editorSample'));const saving=ref(false);const cron=ref(true);
const returnEditor=ref(null);const qr=ref('');const shareLink=ref('');
const subUrl=ref('');const subContent=ref('');const subMembers=ref([]);
const title=computed(()=>t(page.value));
const rows=computed(()=>{
 const source=page.value==='files'?items.value:page.value==='subs'?subscriptions.value:(otherLists.value[page.value]||[]);
 return source.filter(item=>(filter.value==='all'||item.type===filter.value)&&(!typeFilter.value||(item.itemType||item.type)===typeFilter.value)&&(!tagFilter.value||item.tag===tagFilter.value)&&(!query.value||[t(item.name),item.displayName,item.remark,item.tag].join(' ').toLowerCase().includes(query.value.toLowerCase())));
});
const disabled=computed(()=>state.value==='readonly');
const isList=computed(()=>!['my','help','notes'].includes(page.value));
const stateKeys=['ready','loading','empty','error','disconnected','readonly'];
let toastTimer;
const notify=key=>{toast.value=t(key);clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2400)};
function navigateFromChild(key){page.value=key;location.hash='/'+key}
function navigate(key){selectedIds.value=[];typeFilter.value='';tagFilter.value='';workspace.value?.navigate('/'+key);page.value=key;location.hash='/'+key;filter.value=key==='files'?'config':'all';query.value='';window.scrollTo(0,0)}
window.addEventListener('hashchange',()=>{const next=location.hash.replace('#/','');if(['help','notes',...nav.map(n=>n[0])].includes(next)){page.value=next;filter.value=next==='files'?'config':'all';query.value=''}});
watch(theme,value=>{document.documentElement.dataset.theme=value;updateUrl()},{immediate:true});
watch(state,()=>updateUrl());
function updateUrl(){const q=new URLSearchParams({theme:theme.value,state:state.value});if(reference)q.set('reference','1');history.replaceState({},'',location.pathname+'?'+q.toString()+'#/'+page.value)}
function show(kind,item=null){toast.value='';activeItem.value=item;dialogKind.value=kind;nameInput.value=item?t(item.name):'';activePreview.value='processed';subUrl.value=item?(item.url||'https://example.com/subscription'):'';subContent.value=item?.content||'vless://example-node';subMembers.value=[...(item?.members||['jms','bywave'])];nextTick(()=>dialog.value.showModal())}
function close(){dialog.value?.close();dialogKind.value='';returnEditor.value=null}
async function copyLink(item,action){const url='https://demo.example.invalid/'+(action==='shareCopy'?'share/':'download/')+encodeURIComponent(action==='shareCopy'?(item.token||item.id):t(item.name));try{await navigator.clipboard.writeText(url);notify('已复制示例链接')}catch{notify('无法复制，请在分享详情中手动选择链接')}}
function childPanel(kind,value){returnEditor.value={kind:dialogKind.value,item:{...value,id:activeItem.value?.id}};show(kind,value)}
function resumeEditor(){const previous=returnEditor.value;returnEditor.value=null;show(previous.kind,previous.item)}
async function shareDetails(item){shareLink.value='https://demo.example.invalid/share/'+encodeURIComponent(item.token||item.id);qr.value=await QRCode.toDataURL(shareLink.value,{width:220,margin:2});show('shareDetails',item)}
function add(){show(page.value==='sync'?'sync':page.value==='shares'?'share':page.value==='subs'?'sub':'editor')}
function refresh(){const before=state.value;state.value='loading';setTimeout(()=>{state.value=before==='disconnected'?'disconnected':'ready';notify('refreshed')},550)}
function perform(action,item){
 if(disabled.value)return;
 if(['fileCopy','shareCopy','subCopy','syncCopy','copyContent','logCopy'].includes(action))return copyLink(item,action);
 if(action==='duplicate'){currentSource.value.push({...JSON.parse(JSON.stringify(item)),name:t(item.name)+' 副本',id:item.id+'-copy-'+Date.now()});return notify('created')}
 if(action==='export'||action==='backup')return download(item||currentSource.value);
 if(['delete','shareDelete','subDelete','syncDelete','permanentlyDelete'].includes(action))return show('delete',item);
 if(action==='restore')return restoreItems([item]);
 if(action==='fileEdit')return show('editor',item);if(action==='shareSource')return show('share',item);
 if(action==='shareEdit'||action==='fileShare'||action==='subShare')return show('share',item);
 if(action==='subEdit')return show('sub',item);
 if(action==='syncEdit')return show('sync',item);
 if(action==='syncNow'){notify('演示：已展示上传流程，未请求远端');return}
 if(action==='preview')return show('preview',item);
}
async function legacySave(){if(!nameInput.value.trim()&&dialogKind.value!=='connection')return; saving.value=true;await new Promise(r=>setTimeout(r,450));saving.value=false;if(dialogKind.value==='sub'){if(activeItem.value){activeItem.value.name=nameInput.value.trim();activeItem.value.url=subUrl.value;activeItem.value.content=subContent.value;activeItem.value.members=[...subMembers.value]}else{subscriptions.value.push({id:'sub-'+Date.now(),name:nameInput.value.trim(),type:'remote',detail:'subMetaA',url:subUrl.value})}}close();notify('saved')}
function remove(archived){const targets=activeItem.value?[activeItem.value]:currentSource.value.filter(item=>selectedIds.value.includes(item.id));if(archived&&page.value!=='archives')otherLists.value.archives.push(...targets.map(item=>({...item,id:'archive-'+crypto.randomUUID(),archivedAt:new Date().toISOString(),originPage:page.value,itemType:({subs:item.type==='collection'?'col':'sub',files:'file',sync:'artifact',shares:'share'})[page.value],snapshot:JSON.parse(JSON.stringify(item))})));const ids=new Set(targets.map(item=>item.id));if(page.value==='files')items.value=items.value.filter(item=>!ids.has(item.id));else if(page.value==='subs')subscriptions.value=subscriptions.value.filter(item=>!ids.has(item.id));else otherLists.value[page.value]=currentSource.value.filter(item=>!ids.has(item.id));selectedIds.value=[];close();notify(archived?'archived':'deleted')}
function restoreItems(targets){if(disabled.value)return;for(const item of targets){const target=item.originPage||({sub:'subs',col:'subs',file:'files',artifact:'sync',share:'shares'})[item.itemType||item.type]||'files';const value=item.snapshot||{...item,id:'restored-'+crypto.randomUUID(),type:({sub:'remote',col:'collection',file:'config',artifact:'remote',share:'file'})[item.itemType||item.type]||item.type};if(target==='files')items.value.push(value);else if(target==='subs')subscriptions.value.push(value);else otherLists.value[target].push(value)}otherLists.value.archives=otherLists.value.archives.filter(item=>!targets.includes(item));selectedIds.value=[];notify('restored')}
function saveResource(value){if(disabled.value)return; if(dialogKind.value==='share'){value.mode=value.expirationMode;if(value.expirationMode==='datetime')value.expiresAt=value.exactDatetime;else if(value.expirationMode==='duration'&&value.expiresUnit!=='lifetime')value.expiresAt=new Date(Date.now()+Number(value.expiresValue||1)*({day:1,month:30,season:90,year:365}[value.expiresUnit]||1)*86400000).toISOString();}const existing=activeItem.value;const type=dialogKind.value==='sub'?(value.type==='collection'?'collection':value.source):dialogKind.value==='editor'?(value.outputCategory||'config'):dialogKind.value==='share'?({subscription:'sub',collection:'col',file:'file'}[value.sourceType]||'file'):value.sourceType||existing?.type||'remote';const entry={...value,fileType:dialogKind.value==='editor'?value.type:undefined,id:existing?.id||crypto.randomUUID(),name:value.name,type,detail:value.remark||'本地演示配置'};if(existing){const index=currentSource.value.findIndex(item=>item.id===existing.id);if(index>=0)currentSource.value.splice(index,1,entry);else currentSource.value.push(entry)}else fullAppearance.value.createItemPosition==='bottom'?currentSource.value.push(entry):currentSource.value.unshift(entry);close();notify('已保存到浏览器示例数据')}
function download(value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sub-store-demo.json';a.click();URL.revokeObjectURL(url);notify('已导出演示配置')}
async function importResources(event){if(disabled.value)return;try{const file=event.target.files[0];const data=JSON.parse(await file.text());const array=Array.isArray(data)?data:[data];if(array.some(item=>!item||typeof item.name!=='string'))throw Error();currentSource.value.push(...array.map(item=>({...item,id:crypto.randomUUID(),type:item.type||'remote'})));notify('已导入到示例列表')}catch{notify('导入失败：需要包含名称的 JSON 配置')}event.target.value=''}
function bulk(action){const targets=currentSource.value.filter(item=>selectedIds.value.includes(item.id));if(!targets.length)return notify('请先选择条目');if(action==='restore')return restoreItems(targets);if(action==='delete'){activeItem.value=null;return show('delete')}if(action==='export')return download(targets)}
function reorder(from,to){if(from===null||from===to)return;const array=currentSource.value;array.splice(to,0,array.splice(from,1)[0]);dragIndex.value=null}
function settingsChanged(event){const a=event.values.appearance||{};fullAppearance.value=a;if(event.section==='appearance')theme.value=document.documentElement.dataset.theme}
function labelForIcon(type){return type==='remote'?'groupRemote':type==='collection'?'groupCollection':'groupLocal'}
const dialogTitle=computed(()=>({listTools:'筛选与批量管理',editor:'editorTitle',preview:'previewTitle',share:'shareTitle',shareDetails:'shareTitle',flow:'流量详情',sync:'syncTitle',sub:'subTitle',delete:'deleteTitle',logs:'logTitle',connection:'connectionTitle',appearance:'settingsAppearance',backup:'settingsData'})[dialogKind.value]||'editorTitle');
onMounted(()=>{document.title=t('app')+' · '+t('prototype')});
</script>

<template>
 <a href="#main" class="skip-link">{{ t('skipContent') }}</a>
 <div class="prototype-banner"><span class="prototype-tag">{{ t('prototype') }}</span><span>{{ t('sample') }}</span><a href="#/notes" @click.prevent="navigate('notes')">{{ t('noteTitle') }}</a></div>
 <div class="app-shell" :class="{'preview-narrow':fullAppearance.useNarrowModeOnWideScreen,'hide-resource-icons':fullAppearance.isShowIcon===false,'simple-cards':fullAppearance.isSimpleMode}">
  <aside class="sidebar">
   <a class="brand" href="#/files" @click.prevent="navigate('files')"><span class="brand-mark" aria-hidden="true">S</span><span>{{ t('app') }}</span></a>
   <nav :aria-label="t('app')">
    <a v-for="[key,icon] in visibleNav" :key="key" :href="'#/'+key" class="nav-item" :aria-label="t(key)" :class="{active:page===key}" :aria-current="page===key?'page':undefined" @click.prevent="navigate(key)"><IconButton :label="key" :icon="icon" read-only no-tab /><span>{{ t(key) }}</span></a>
   </nav>
   <span class="sidebar-version">{{ t('version') }}</span>
  </aside>
  <main id="main" tabindex="-1" :class="{'full-workspace':reference&&!['help','notes'].includes(page)}">
   <h1 class="sr-only">{{ title }}</h1>
   <template v-if="isList">
    <section class="list-toolbar" :aria-label="t('meaning')">
     <label class="toolbar-search"><FontAwesomeIcon :icon="icons.faMagnifyingGlass" aria-hidden="true" /><input v-model="query" type="search" :aria-label="t('search_'+page)" :placeholder="t('search_'+page)" /></label>
     <div class="toolbar-actions"><IconButton label="筛选与批量管理" icon="faSliders" @activate="show('listTools')"/><IconButton v-if="page!=='archives'" label="add" icon="faPlus" :disabled="disabled" @activate="add" /><IconButton :label="single?'gridMode':'listMode'" :icon="single?'faGrip':'faTableList'" @activate="single=!single" /></div>
    </section>
    <input ref="importInput" aria-label="选择要导入的 JSON 配置文件" type="file" accept="application/json,.json" class="sr-only" tabindex="-1" @change="importResources"/>

    <div v-if="page==='files'" class="filters file-filters"><button v-for="key in ['config','nodes','local']" :key="key" class="filter" :class="{selected:filter===key}" :aria-pressed="filter===key" @click="filter=key">{{ key==='local'?'普通文件':t(key) }}</button></div>
    <div v-if="state==='loading'" class="cards-grid skeleton-grid" aria-live="polite"><article v-for="n in 4" :key="n" class="card skeleton"><span></span><div></div></article><span class="sr-only">{{ t('loading') }}</span></div>
    <section v-else-if="['empty','error','disconnected'].includes(state)" class="state-panel" aria-live="polite">
     <FontAwesomeIcon :icon="state==='error'?icons.faTriangleExclamation:state==='disconnected'?icons.faLink:icons.faFolderOpen" aria-hidden="true" />
     <h2>{{ t(state==='empty'?'emptyTitle':state==='error'?'errorTitle':'disconnectedTitle') }}</h2><p>{{ t(state==='empty'?'emptyBody':state==='error'?'errorBody':'disconnectedBody') }}</p>
     <button v-if="!(page==='archives'&&state==='empty')" class="button primary" @click="state==='empty'?add():state==='disconnected'?show('connection'):refresh()">{{ t(state==='empty'?'emptyAdd':state==='error'?'retry':'connect') }}</button>
    </section>
    <section v-else-if="rows.length" class="cards-grid" :class="{'single-column':single}" :aria-label="title">
     <article v-for="item in rows" :key="item.id" class="card" draggable="true" @dragstart="dragIndex=currentSource.indexOf(item)" @dragover.prevent @drop.prevent="reorder(dragIndex,currentSource.indexOf(item))" :class="{'card-disabled':disabled}">
      <div class="card-main">
       <div class="file-symbol" :class="'type-'+item.type"><IconButton :label="labelForIcon(item.type)" :icon="item.type==='collection'?'faLayerGroup':item.type==='remote'?'faGlobe':'faFileLines'" read-only /></div>
       <div class="card-content"><h2><button class="name-button" :disabled="disabled" @click="page==='shares'?shareDetails(item):show('preview',item)">{{ item.displayName||t(item.name) }}</button></h2><p class="item-type">{{ kindName(item.type) }}</p><p v-if="!fullAppearance.isSimpleMode||fullAppearance.isSimpleShowRemark" class="item-detail">{{ item.remark||t(item.detail) }}</p><a v-if="item.website" :href="item.website" class="card-link" target="_blank" rel="noopener">官网 ↗</a><p v-if="item.archivedAt" class="field-note">归档于 {{new Date(item.archivedAt).toLocaleString()}}</p></div>
      </div>
      <div class="card-footer">
       <span class="card-kind">{{ t(page==='files'?(item.type==='nodes'?'nodes':item.type==='config'?'config':'local'):page) }}</span>
       <div class="card-actions" v-if="page==='files'">
        <IconButton label="fileShare" icon="faShareNodes" :disabled="disabled" @activate="perform('fileShare',item)" /><IconButton label="fileCopy" icon="faClone" :disabled="disabled" @activate="perform('fileCopy',item)" /><IconButton label="fileEdit" icon="faPenNib" :disabled="disabled" @activate="perform('fileEdit',item)" />
       </div>
       <div class="card-actions" v-else-if="page==='shares'">
        <IconButton label="shareSource" icon="faLink" :disabled="disabled" @activate="perform('shareSource',item)" /><IconButton label="shareCopy" icon="faClone" :disabled="disabled" @activate="perform('shareCopy',item)" /><IconButton label="shareEdit" icon="faPenNib" :disabled="disabled" @activate="perform('shareEdit',item)" /><IconButton label="shareDelete" icon="faTrashCan" danger :disabled="disabled" @activate="perform('shareDelete',item)" />
       </div>
       <div class="card-actions" v-else-if="page==='subs'">
        <IconButton label="subRefresh" icon="faArrowsRotate" :disabled="disabled" @activate="notify('演示：未请求远端订阅更新')" /><IconButton label="subShare" icon="faShareNodes" :disabled="disabled" @activate="perform('subShare',item)" /><IconButton label="subCopy" icon="faClone" :disabled="disabled" @activate="perform('subCopy',item)" /><IconButton label="subEdit" icon="faPenNib" :disabled="disabled" @activate="perform('subEdit',item)" />
       </div>
       <div class="card-actions" v-else-if="page==='sync'">
        <label class="item-selection"><input type="checkbox" v-model="item.upload" aria-label="启用此同步产物"/></label><IconButton label="下载远端同步产物" icon="faDownload" @activate="notify('演示：未请求远端下载')"/><IconButton label="预览产物" icon="faEye" @activate="show('preview',item)"/>
        <IconButton label="syncNow" icon="faCloudArrowUp" :disabled="disabled||saving" @activate="perform('syncNow',item)" /><IconButton label="syncCopy" icon="faClone" :disabled="disabled" @activate="perform('syncCopy',item)" /><IconButton label="syncEdit" icon="faPenNib" :disabled="disabled" @activate="perform('syncEdit',item)" /><IconButton label="syncDelete" icon="faTrashCan" danger :disabled="disabled" @activate="perform('syncDelete',item)" />
       </div>
       <div class="card-actions" v-else-if="page==='archives'"><IconButton label="restore" icon="faReply" :disabled="disabled" @activate="perform('restore',item)" /><IconButton label="permanentlyDelete" icon="faTrashCan" danger :disabled="disabled" @activate="perform('permanentlyDelete',item)" /></div>
      </div>
      <div v-if="page==='files'" class="expanded-actions">
       <IconButton label="preview" icon="faEye" :disabled="disabled" @activate="perform('preview',item)" /><IconButton label="duplicate" icon="faPaste" :disabled="disabled" @activate="perform('duplicate',item)" /><IconButton label="export" icon="faFileExport" :disabled="disabled" @activate="perform('export',item)" /><IconButton label="delete" icon="faTrashCan" danger :disabled="disabled" @activate="perform('delete',item)" />
      </div>
     </article>
    </section>
    <section v-else class="state-panel"><h2>{{ t('noSearch') }}</h2><p>{{ t('noSearchBody') }}</p></section>
   </template>
   <SettingsView v-else-if="page==='my'" @open-logs="show('logs')" @change="settingsChanged" @navigate="navigate" />
   <section v-else-if="page==='help'" class="help-page">
    <p class="help-note">{{ t('helpProposal') }}</p>
    <div class="help-head"><span>{{ t('context') }}</span><span>{{ t('action') }}</span><span>{{ t('explanation') }}</span></div>
    <article v-for="[context,action,explanation] in actionHelp" :key="context+action" class="help-row"><span class="context-chip">{{ t(context) }}</span><strong>{{ t(action) }}</strong><p>{{ t(explanation) }}</p></article>
   </section>
   <section v-else class="notes-page"><p class="lead">{{ t('noteLead') }}</p><article v-for="[heading,body] in [['coverage','coverageBody'],['facts','factsBody'],['proposals','proposalBody'],['review','reviewBody']]" :key="heading"><h2>{{ t(heading) }}</h2><p>{{ t(body) }}</p></article></section>
  </main>
 </div>
 <nav class="mobile-nav" :aria-label="t('app')"><a v-for="[key,icon] in visibleNav" :key="key" :href="'#/'+key" :class="{active:page===key}" @click.prevent="navigate(key)"><FontAwesomeIcon :icon="icons[icon]" aria-hidden="true" /><span>{{ t(key) }}</span></a></nav>
 <div v-if="toast" class="toast" role="status"><FontAwesomeIcon :icon="icons.faCheck" aria-hidden="true" />{{ toast }}</div>
 <dialog ref="dialog" aria-labelledby="resource-dialog-title" :class="{'wide-dialog':dialogKind==='preview'||dialogKind==='logs'}" @close="dialogKind=''" @click="event=>event.target===dialog&&close()">
  <div v-if="toast" class="dialog-toast" role="status">{{ toast }}</div>
  <div class="dialog-heading"><div><p v-if="activeItem" class="eyebrow">{{ t(activeItem.name) }}</p><h2 id="resource-dialog-title">{{ t(dialogTitle) }}</h2></div><IconButton label="close" icon="faXmark" @activate="close" /></div>
  <button v-if="returnEditor" class="button" @click="resumeEditor">返回编辑，保留草稿</button>
  <section v-if="dialogKind==='listTools'" class="list-management">
<div class="list-extras"><label class="sr-only" for="type-filter">按类型筛选</label><select v-if="page!=='files'" id="type-filter" v-model="typeFilter"><option value="">按类型筛选</option><option v-for="type in listTypes" :key="type" :value="type">{{kindName(type)}}</option></select><label class="sr-only" for="tag-filter">按标签筛选</label><select id="tag-filter" v-model="tagFilter"><option value="">按标签筛选</option><option v-for="tag in listTags" :key="tag" :value="tag">{{tag}}</option></select><IconButton v-if="page!=='archives'" label="导入 JSON 配置" icon="faFileImport" @activate="importInput.click()"/><IconButton v-if="page==='shares'" label="选择已过期分享" icon="faFilter" @activate="selectedIds=rows.filter(item=>item.expiresAt&&new Date(item.expiresAt)<new Date()).map(item=>item.id)"/><IconButton label="选择当前筛选结果" icon="faCheckDouble" @activate="selectedIds=selectedIds.length?[]:rows.map(item=>item.id)"/><div class="bulk-actions"><span v-if="selectedIds.length" class="field-note">已选 {{selectedIds.length}}</span><IconButton v-if="selectedIds.length" label="导出所选配置" icon="faFileExport" @activate="bulk('export')"/><IconButton v-if="page==='archives'&&selectedIds.length" label="恢复所选条目" icon="faReply" @activate="bulk('restore')"/><IconButton v-if="selectedIds.length" label="删除所选条目" icon="faTrashCan" danger @activate="bulk('delete')"/><template v-if="page==='sync'"><IconButton label="上传所有同步产物" icon="faCloudArrowUp" @activate="notify('演示：未请求远端批量上传')"/><IconButton label="下载所有同步产物" icon="faDownload" @activate="notify('演示：未请求远端批量下载')"/><label class="field-note">全局定时<input v-model="globalCron" aria-label="全局定时表达式" placeholder="0 0 * * *"/></label></template></div></div>
   <div class="management-results"><article v-for="item in rows" :key="item.id" class="management-item"><label class="item-selection"><input v-model="selectedIds" type="checkbox" :value="item.id" :aria-label="'选择 '+t(item.name)"/><span>{{item.displayName||t(item.name)}}<small v-if="item.tag">{{item.tag}}</small></span></label><div class="card-actions"><IconButton v-if="page==='subs'" label="查看流量详情" icon="faCircleInfo" @activate="show('flow',item)"/><IconButton v-if="page!=='archives'" label="preview" icon="faEye" @activate="show('preview',item)"/><IconButton v-if="['subs','files'].includes(page)" label="duplicate" icon="faPaste" :disabled="disabled" @activate="perform('duplicate',item)"/><IconButton v-if="page!=='archives'" label="export" icon="faFileExport" @activate="perform('export',item)"/><IconButton v-if="page==='archives'" label="restore" icon="faReply" :disabled="disabled" @activate="perform('restore',item)"/><IconButton label="delete" icon="faTrashCan" danger :disabled="disabled" @activate="perform('delete',item)"/></div></article></div>
   <footer class="dialog-actions"><button v-if="typeFilter||tagFilter" type="button" class="button" @click="typeFilter='';tagFilter=''">清除筛选</button><button type="button" class="button primary" @click="close">完成</button></footer>
  </section>
  <section v-else-if="dialogKind==='shareDetails'" class="share-details"><p class="field-note">示例分享链接，不连接后端。</p><img :src="qr" alt="示例分享链接二维码" width="220" height="220"/><label>分享地址<input :value="shareLink" readonly/></label><button class="button" @click="copyLink(activeItem,'shareCopy')">复制链接</button><button class="button primary" @click="show('share',activeItem)">编辑分享</button></section>
  <section v-else-if="dialogKind==='flow'" class="form-stack"><p class="field-note">以下为示例流量，未请求机场订阅。</p><dl><dt>已上传</dt><dd>1.2 GB</dd><dt>已下载</dt><dd>12.8 GB</dd><dt>总额度</dt><dd>100 GB</dd><dt>到期时间</dt><dd>2026-12-31</dd></dl><a class="card-link" href="https://example.invalid" target="_blank" rel="noopener">订阅官网 ↗</a></section>
  <ResourcePreview v-else-if="dialogKind==='preview'" :item="activeItem" :kind="page==='subs'?'sub':'file'" @notice="notify" @open-logs="show('logs')" @refresh="notify('演示：处理结果使用示例数据')" />
  <LogsPanel v-else-if="dialogKind==='logs'" @notice="notify" />
  <template v-else-if="dialogKind==='delete'"><p class="dialog-copy">{{ t('deleteBody') }}</p><footer class="dialog-actions"><button class="button" @click="close">{{ t('cancel') }}</button><button class="button" @click="remove(true)">{{ t('archive') }}</button><button class="button danger-button" @click="remove(false)">{{ t('permanentlyDelete') }}</button></footer></template>
  <ResourceEditor v-else-if="['sub','editor','sync','share'].includes(dialogKind)" :key="dialogKind+'-'+(activeItem?.id||'new')" :kind="dialogKind" :item="activeItem?{...activeItem,name:t(activeItem.name)}:null" :sources="allSources" @save="saveResource" @cancel="close" @logs="childPanel('logs',$event)" @preview="childPanel('preview',$event)" />
  <p v-else class="field-note">后端连接请到设置中的后端管理修改。</p>
 </dialog>
</template>
