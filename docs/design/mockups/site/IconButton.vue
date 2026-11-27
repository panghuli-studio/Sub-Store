<script setup>
import { ref, useId, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as solid from './icons.js';
import { t } from './i18n.js';
const props=defineProps({label:String,icon:String,disabled:Boolean,danger:Boolean,quiet:Boolean,readOnly:Boolean,noTab:Boolean});
defineEmits(['activate']);
const tip=ref();
const group=useId();
const dismissed=ref(false);
const accessibleLabel=computed(()=>props.disabled?t(props.label)+'：'+t('disabled'):t(props.label));
async function resume(e){const wasDismissed=dismissed.value;dismissed.value=false;if(wasDismissed||e.type==='focusin'){await nextTick();tip.value.show({skipDelay:e.type==='focusin'})}}
const dismiss=e=>{if(e.key==='Escape')dismissed.value=true};
onMounted(()=>document.addEventListener('keydown',dismiss,true));
onBeforeUnmount(()=>document.removeEventListener('keydown',dismiss,true));
</script>
<template>
 <VTooltip ref="tip" :show-group="group" :placement="'top'" :disabled="dismissed" :container="false" @mouseenter="resume" @focusin="resume">
  <span v-if="readOnly" class="icon-button read-only" role="img" :tabindex="noTab?-1:0" :aria-label="accessibleLabel"><FontAwesomeIcon :icon="solid[icon]" aria-hidden="true" /></span>
  <span v-else-if="disabled" class="icon-button is-disabled" tabindex="0" role="button" aria-disabled="true" :aria-label="accessibleLabel"><FontAwesomeIcon :icon="solid[icon]" aria-hidden="true" /></span>
  <button v-else type="button" class="icon-button" :class="{danger,quiet}" :aria-label="accessibleLabel" @click.stop="$emit('activate')"><FontAwesomeIcon :icon="solid[icon]" aria-hidden="true" /></button>
  <template #popper>{{ accessibleLabel }}</template>
 </VTooltip>
</template>
