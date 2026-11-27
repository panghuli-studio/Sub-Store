<script setup>
import {ref,onMounted,onBeforeUnmount,watch} from 'vue';
import {EditorView,basicSetup} from 'codemirror';
import {Compartment,EditorState} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {yaml} from '@codemirror/lang-yaml';
import {javascript} from '@codemirror/lang-javascript';
import {openSearchPanel} from '@codemirror/search';
import {undo,redo} from '@codemirror/commands';
import {parse,stringify} from 'yaml';
import IconButton from './IconButton.vue';
const props=defineProps({modelValue:{type:String,default:''},language:{type:String,default:'yaml'},readonly:Boolean});
const emit=defineEmits(['update:modelValue','notice']);
const host=ref();const root=ref();const input=ref();const language=ref(props.language);const expanded=ref(false);const status=ref('');let view;const compartment=new Compartment();
const extension=()=>language.value==='json'?json():language.value==='yaml'?yaml():language.value==='javascript'?javascript():[];
onMounted(()=>{view=new EditorView({parent:host.value,state:EditorState.create({doc:props.modelValue,extensions:[basicSetup,compartment.of(extension()),EditorState.readOnly.of(props.readonly),EditorView.lineWrapping,EditorView.theme({'&':{backgroundColor:'var(--bg)',color:'var(--text)'},'.cm-content':{caretColor:'var(--accent)',fontFamily:'ui-monospace, monospace'},'.cm-gutters':{backgroundColor:'var(--surface)',color:'var(--muted)',borderColor:'var(--line)'},'.cm-scroller':{overflow:'auto',maxHeight:'420px'},'.cm-activeLine':{backgroundColor:'var(--accent-soft)'},'.cm-selectionBackground':{backgroundColor:'var(--accent-soft) !important'},'.cm-panels':{backgroundColor:'var(--surface)',color:'var(--text)'}}),EditorView.updateListener.of(update=>{if(update.docChanged)emit('update:modelValue',update.state.doc.toString())})]})})});
onBeforeUnmount(()=>view?.destroy());watch(()=>props.modelValue,value=>{if(view&&value!==view.state.doc.toString())view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}})});watch(language,()=>view?.dispatch({effects:compartment.reconfigure(extension())}));
function set(value){if(view&&!props.readonly)view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}})}
async function copy(){try{await navigator.clipboard.writeText(props.modelValue);status.value='已复制内容'}catch{status.value='无法访问剪贴板，可在编辑器中选择并复制'}}
async function paste(){try{set(await navigator.clipboard.readText())}catch{status.value='剪贴板不可用，请在编辑器中粘贴'}}
function format(){try{set(language.value==='json'?JSON.stringify(JSON.parse(props.modelValue),null,2):language.value==='yaml'?stringify(parse(props.modelValue)):props.modelValue);status.value='已格式化'}catch(error){status.value='格式错误：'+error.message}}
async function load(event){const file=event.target.files[0];if(file)set(await file.text());event.target.value=''}
</script>
<template><section ref="root" class="code-editor" :class="{expanded}"><div class="editor-tools"><label class="sr-only" :for="'language-'+$.uid">代码语言</label><select :id="'language-'+$.uid" v-model="language"><option value="yaml">YAML</option><option value="json">JSON</option><option value="javascript">JavaScript</option><option value="text">纯文本</option></select><div class="tool-icons"><IconButton label="搜索内容" icon="faMagnifyingGlass" @activate="openSearchPanel(view)"/><IconButton label="复制内容" icon="faCopy" @activate="copy"/><template v-if="!readonly"><IconButton label="撤销" icon="faUndo" @activate="undo(view)"/><IconButton label="重做" icon="faRedo" @activate="redo(view)"/><IconButton label="格式化" icon="faCode" @activate="format"/><IconButton label="从文件导入" icon="faFileImport" @activate="input.click()"/><IconButton label="粘贴内容" icon="faPaste" @activate="paste"/><IconButton label="清空内容" icon="faTrashCan" danger @activate="set('')"/></template><IconButton :label="expanded?'退出全屏':'全屏编辑'" :icon="expanded?'faCompress':'faExpand'" @activate="expanded=!expanded"/></div></div><input ref="input" aria-label="选择要导入的代码文件" type="file" class="sr-only" tabindex="-1" @change="load"/><div ref="host" class="cm-host"></div><p v-if="status" class="field-note" role="status">{{status}}</p></section></template>
