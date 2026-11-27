import { createI18n } from "vue-i18n";

import en from "./en";
import { getInitialLocale } from "./languages";
import ru from "./ru";
import zh from "./zh";

import {studioMessages} from './studio';
for(const [locale,message] of Object.entries({zh,en,ru})){Object.assign(message.editorPage.subConfig.editorTabs,locale==='zh'?{content:'来源与内容',display:'显示信息',request:'请求与输出',actions:'加工链'}:locale==='en'?{content:'Source',display:'Display',request:'Requests and output',actions:'Processing'}:{content:'Источник',display:'Отображение',request:'Запросы и вывод',actions:'Обработка'})}
const i18n = createI18n({
  locale: getInitialLocale(), // 初始化配置语言
  messages: {
    zh: {...zh,studio:studioMessages.zh},
    en: {...en,studio:studioMessages.en},
    ru: {...ru,studio:studioMessages.ru},
  },
});

export default i18n;
