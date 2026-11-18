import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {firebaseConfig} from './scripts/firebase-config.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root:root+'static-app',base:'./',publicDir:root+'public',plugins:[react()],define:{__MARKET_ATLAS_STATIC__:'true',__MARKET_ATLAS_FIREBASE_CONFIG__:JSON.stringify(firebaseConfig(process.env.MARKET_ATLAS_FIREBASE_CONFIG||readFileSync(new URL('./firebase/web-config.json',import.meta.url),'utf8')))},build:{outDir:root+'dist-static',emptyOutDir:true},server:{host:'127.0.0.1',port:4173}});
