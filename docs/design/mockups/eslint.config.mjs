import vue from 'eslint-plugin-vue';
export default [...vue.configs['flat/essential'],{ignores:['dist/**','versions/**']},{files:['site/**/*.{js,vue}'],languageOptions:{ecmaVersion:'latest',sourceType:'module'},rules:{'vue/no-parsing-error':'error','vue/no-duplicate-attributes':'error','vue/valid-template-root':'off','vue/multi-word-component-names':'off'}}];
