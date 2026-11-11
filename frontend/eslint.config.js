import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        __VUE_PROD_DEVTOOLS__: 'readonly',
        __VUE_OPTIONS_API__: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'vue/no-undef-properties': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'off',
    },
  },
];
