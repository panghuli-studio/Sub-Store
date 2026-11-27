import { createApp } from 'vue';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { plugin, defaultConfig } from '@formkit/vue';
import { zh } from '@formkit/i18n';
import App from './App.vue';
import './proto.css';
createApp(App).use(plugin, defaultConfig({locales:{zh},locale:'zh'})).use(FloatingVue, {delay:{show:300,hide:0},instantMove:false,distance:10,overflowPadding:8,themes:{tooltip:{triggers:['hover','focus'],popperTriggers:['hover']}}}).mount('#app');
