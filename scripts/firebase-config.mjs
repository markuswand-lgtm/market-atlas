export function firebaseConfig(raw){
 if(!raw)return null;
 const config=JSON.parse(raw),allowed=['apiKey','authDomain','projectId','databaseURL','appId'];
 if(Object.keys(config).some(k=>!allowed.includes(k)))throw new Error('Firebase web configuration contains unsupported fields; never pass service-account credentials here.');
 for(const key of allowed)if(typeof config[key]!=='string'||!config[key])throw new Error('Firebase web configuration missing '+key);
 if(!/^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)\/?$/.test(config.databaseURL))throw new Error('Invalid Firebase database URL');
 return config;
}
