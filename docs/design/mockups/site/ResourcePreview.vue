<script setup>
import { computed, ref, watch } from 'vue';
import IconButton from './IconButton.vue';
import CodeEditor from './CodeEditor.vue';
const props=defineProps({item:Object,object:Object,kind:{type:String,default:'file'}});
const emit=defineEmits(['notice','open-logs','refresh']);
const text={sample:'示例预览 · 不下载订阅、不执行脚本',before:'处理前',after:'处理后',filtered:'已过滤节点',showBefore:'显示处理前',showAfter:'显示处理后',names:'节点信息',copyNames:'复制节点信息',copyPrompt:'复制节点分析提示词',copyNode:'复制节点属性',details:'节点属性',close:'关闭节点详情',language:'语言',search:'搜索内容',copy:'复制预览内容',refresh:'刷新示例预览',logs:'查看 Sub-Store 日志',find:'按名称查找节点',empty:'没有符合条件的节点',copied:'已复制示例内容',failed:'浏览器未允许复制，请在内容区域选择复制',filterOnly:'只看已过滤节点',nodeCount:'节点数量',noChange:'暂无此侧的节点信息'};
const originals=[{id:'a',name:'示例香港 01',type:'ss',server:'hk.example.invalid',port:443,udp:true,tfo:false,'skip-cert-verify':false,aead:true},{id:'b',name:'示例新加坡 02',type:'trojan',server:'sg.example.invalid',port:443,udp:true,tfo:true,'skip-cert-verify':false,aead:false},{id:'c',name:'示例美国 03',type:'vmess',server:'us.example.invalid',port:443,udp:false,tfo:false,'skip-cert-verify':true,aead:true}];
const processed=[{...originals[0],name:'香港 · 示例 01'},{...originals[1],name:'新加坡 · 示例 02'}];
const source=computed(()=>props.item||props.object||{});
const before=computed(()=>Array.isArray(source.value.previewBefore)?source.value.previewBefore:originals);
const after=computed(()=>Array.isArray(source.value.previewAfter)?source.value.previewAfter:processed);
const removed=computed(()=>before.value.filter(n=>!after.value.some(a=>a.id===n.id)));
const showBefore=ref(true);const showAfter=ref(true);const onlyFiltered=ref(false);const query=ref('');const language=ref('yaml');const search=ref('');const selected=ref(null);const namesSide=ref('');
const languages={yaml:'YAML',json:'JSON',javascript:'JavaScript',text:'纯文本'};
const baseContent=computed(()=>String(source.value.previewContent??'# 示例处理结果：未执行脚本\nmode: rule\nproxies: []\nproxy-groups: []\nrules:\n  - MATCH,DIRECT\n'));
const content=computed(()=>baseContent.value);
const filteredContent=computed(()=>search.value?content.value.split('\n').filter(line=>line.toLowerCase().includes(search.value.toLowerCase())).join('\n'):content.value);
const nodeRows=computed(()=>{const origin=onlyFiltered.value?removed.value:[...before.value,...after.value.filter(a=>!before.value.some(b=>b.id===a.id)).map(a=>({id:a.id,name:'新增节点：无处理前记录',type:'—'}))];return origin.map(b=>({id:b.id,before:b,after:onlyFiltered.value?null:after.value.find(a=>a.id===b.id)})).filter(row=>!query.value||[row.before?.name,row.after?.name].some(n=>n?.toLowerCase().includes(query.value.toLowerCase())))});
const namedNodes=computed(()=>namesSide.value==='before'?before.value:namesSide.value==='after'?after.value:removed.value);
const namesText=computed(()=>namedNodes.value.map(n=>`${n.name}\t${n.type}\t${n.server||'示例地址省略'}`).join('\n'));
const detailCode=computed(()=>JSON.stringify(selected.value,null,2));
async function copy(value){try{await navigator.clipboard.writeText(value);emit('notice',text.copied)}catch{emit('notice',text.failed)}}
function refresh(){emit('refresh');emit('notice','已刷新示例预览；没有请求后端或执行脚本')}
watch(()=>source.value,()=>{selected.value=null;namesSide.value='';query.value='';search.value=''});
</script>
<template>
 <section class="resource-preview">
  <p class="preview-example">{{ text.sample }}</p>
  <div class="preview-top-actions"><IconButton :label="text.refresh" icon="faArrowsRotate" @activate="refresh" /><IconButton :label="text.logs" icon="faTerminal" @activate="emit('open-logs')" /></div>
  <template v-if="kind==='file'">
   <div class="preview-file-controls"><FormKit type="select" v-model="language" :label="text.language" :options="languages" /><FormKit type="search" v-model="search" :label="text.search" placeholder="输入关键词，筛选匹配行" /><IconButton :label="text.copy" icon="faClone" @activate="copy(content)" /></div>
   <p class="preview-count" aria-live="polite">{{ search?`显示匹配行：${filteredContent?filteredContent.split('\n').length:0}`:'完整示例内容' }}</p>
   <CodeEditor :model-value="content" :language="language" readonly /><pre v-if="search" class="preview-search-results" aria-label="匹配内容">{{ filteredContent||'没有匹配内容' }}</pre>
  </template>
  <template v-else>
   <div class="preview-node-controls"><FormKit type="checkbox" v-model="showBefore" :label="text.showBefore" /><FormKit type="checkbox" v-model="showAfter" :label="text.showAfter" /><FormKit type="checkbox" v-model="onlyFiltered" :label="text.filterOnly" /><FormKit type="search" v-model="query" :label="text.find" /></div>
   <div class="preview-node-summary"><span>{{ text.before }} {{ before.length }} · {{ text.after }} {{ after.length }} · {{ text.filtered }} {{ removed.length }}</span><button class="button" :disabled="!before.length" @click="namesSide='before'">{{ text.before }}{{ text.names }}</button><button class="button" :disabled="!after.length" @click="namesSide='after'">{{ text.after }}{{ text.names }}</button><button class="button" :disabled="!removed.length" @click="onlyFiltered=true;namesSide='filtered'">{{ text.filtered }}</button></div>
   <div v-if="nodeRows.length&&(showBefore||showAfter)" class="node-compare" :class="{'one-side':!showBefore||!showAfter}"><template v-for="row in nodeRows" :key="row.id"><article v-if="showBefore" class="node-comparison-card"><span class="node-side">{{ text.before }}</span><button class="node-name" :aria-label="text.details+'：'+row.before.name" @click="selected=row.before">{{ row.before.name }}</button><dl><div v-for="key in ['type','udp','tfo','skip-cert-verify','aead']" :key="key"><dt>{{ key }}</dt><dd>{{ String(row.before[key]??'—') }}</dd></div></dl><IconButton :label="text.copyNode" icon="faClone" @activate="copy(JSON.stringify(row.before,null,2))" /></article><article v-if="showAfter" class="node-comparison-card" :class="{'node-removed':!row.after}"><span class="node-side">{{ text.after }}</span><template v-if="row.after"><button class="node-name" :aria-label="text.details+'：'+row.after.name" @click="selected=row.after">{{ row.after.name }}</button><dl><div v-for="key in ['type','udp','tfo','skip-cert-verify','aead']" :key="key"><dt>{{ key }}</dt><dd>{{ String(row.after[key]??'—') }}</dd></div></dl><IconButton :label="text.copyNode" icon="faClone" @activate="copy(JSON.stringify(row.after,null,2))" /></template><p v-else>{{ text.filtered }}</p></article></template></div>
   <p v-else class="preview-example">{{ text.empty }}</p>
   <section v-if="namesSide" class="preview-names"><div class="preview-section-title"><h3>{{ namesSide==='before'?text.before:namesSide==='after'?text.after:text.filtered }} · {{ text.names }}</h3><IconButton label="关闭节点信息" icon="faXmark" @activate="namesSide=''" /></div><CodeEditor :model-value="namesText" language="text" readonly /><div class="preview-node-summary"><button class="button" @click="copy(namesText)">{{ text.copyNames }}</button><button class="button" @click="copy('请分析以下示例节点名称、协议与地区，不包含真实凭据：\n'+namesText)">{{ text.copyPrompt }}</button></div></section>
   <section v-if="selected" class="preview-node-details"><div class="preview-section-title"><h3>{{ text.details }} · {{ selected.name }}</h3><IconButton :label="text.close" icon="faXmark" @activate="selected=null" /></div><CodeEditor :model-value="detailCode" language="json" readonly /><button class="button" @click="copy(detailCode)">{{ text.copyNode }}</button></section>
  </template>
 </section>
</template>
<style scoped>
.resource-preview{position:relative;min-width:0}.preview-example,.preview-count{font-size:12px;color:var(--muted);line-height:1.8;margin:0 0 16px}.preview-top-actions{display:flex;justify-content:flex-end;margin:0 0 12px}.preview-file-controls{display:grid;grid-template-columns:140px minmax(0,1fr) 44px;align-items:end;gap:16px}.preview-node-controls{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center}.preview-node-controls :deep(.formkit-outer[data-type=search]){flex:1;min-width:180px}.preview-node-summary{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0}.preview-node-summary>span{font-size:12px;color:var(--muted);margin-right:auto}.preview-node-summary .button{font-size:12px;padding:10px 12px}.node-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.node-compare.one-side{grid-template-columns:1fr}.node-comparison-card{padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);min-width:0;position:relative}.node-side{display:block;color:var(--accent);font-size:11px;margin-bottom:8px}.node-name{background:transparent;padding:0;color:var(--text);text-align:left;font-weight:600;overflow-wrap:anywhere;min-height:44px}.node-comparison-card dl{margin:12px 0;display:flex;flex-wrap:wrap;gap:8px 16px}.node-comparison-card dl>div{display:grid;gap:2px}.node-comparison-card dt{font-size:10px;color:var(--muted)}.node-comparison-card dd{font-size:12px;margin:0}.node-removed{opacity:.65}.node-removed>p{color:var(--muted);font-size:13px}.preview-names,.preview-node-details{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}.preview-section-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.preview-section-title h3{font-size:15px;margin:0;overflow-wrap:anywhere}.preview-node-details>.button{margin-top:12px}.resource-preview :deep(.formkit-outer){margin-bottom:12px}.resource-preview :deep(.formkit-label){font-size:12px}.resource-preview :deep(.formkit-input:not([type=checkbox])){min-height:44px;font-size:16px;width:100%}@media(max-width:600px){.preview-file-controls{grid-template-columns:minmax(0,1fr) 44px;gap:8px}.preview-file-controls>:first-child{grid-column:1/-1}.node-compare{gap:8px}.node-comparison-card{padding:12px}.node-comparison-card dt{font-size:9px}.node-comparison-card dl{gap:8px}.node-name{font-size:12px}}
</style>

<style scoped>
.preview-search-results{margin-top:12px;padding:12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 ui-monospace,monospace;color:var(--muted);max-height:200px;overflow:auto}
</style>
