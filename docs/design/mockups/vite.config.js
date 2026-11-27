import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],root:'site',server:{host:'127.0.0.1',port:4318},build:{outDir:'../dist',emptyOutDir:true}});
