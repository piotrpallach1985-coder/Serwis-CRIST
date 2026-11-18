var SD=Object.defineProperty;var PD=(r,e,t)=>e in r?SD(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var q=(r,e,t)=>PD(r,typeof e!="symbol"?e+"":e,t);const ND=()=>{};var wf={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fg=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},OD=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){const i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=r[t++],o=r[t++],a=r[t++],u=((s&7)<<18|(i&63)<<12|(o&63)<<6|a&63)-65536;e[n++]=String.fromCharCode(55296+(u>>10)),e[n++]=String.fromCharCode(56320+(u&1023))}else{const i=r[t++],o=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},Cg={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){const i=r[s],o=s+1<r.length,a=o?r[s+1]:0,u=s+2<r.length,l=u?r[s+2]:0,B=i>>2,d=(i&3)<<4|a>>4;let C=(a&15)<<2|l>>6,g=l&63;u||(g=64,o||(C=64)),n.push(t[B],t[d],t[C],t[g])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(fg(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):OD(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){const i=t[r.charAt(s++)],a=s<r.length?t[r.charAt(s)]:0;++s;const l=s<r.length?t[r.charAt(s)]:64;++s;const d=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||a==null||l==null||d==null)throw new FD;const C=i<<2|a>>4;if(n.push(C),l!==64){const g=a<<4&240|l>>2;if(n.push(g),d!==64){const D=l<<6&192|d;n.push(D)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class FD extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const kD=function(r){const e=fg(r);return Cg.encodeByteArray(e,!0)},gu=function(r){return kD(r).replace(/\./g,"")},pg=function(r){try{return Cg.decodeString(r,!0)}catch{}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gg(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LD=()=>gg().__FIREBASE_DEFAULTS__,xD=()=>{if(typeof process>"u"||typeof wf>"u")return;const r=wf.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},VD=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&pg(r[1]);return e&&JSON.parse(e)},Wu=()=>{try{return ND()||LD()||xD()||VD()}catch{return}},mg=r=>{var e,t;return(t=(e=Wu())==null?void 0:e.emulatorHosts)==null?void 0:t[r]},_g=r=>{const e=mg(r);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const n=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),n]:[e.substring(0,t),n]},Eg=()=>{var r;return(r=Wu())==null?void 0:r.config},Ig=r=>{var e;return(e=Wu())==null?void 0:e[`_${r}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dg{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MD(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},n=e||"demo-project",s=r.iat||0,i=r.sub||r.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...r};return[gu(JSON.stringify(t)),gu(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $e(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function GD(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test($e())}function wg(){var e;const r=(e=Wu())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function UD(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function HD(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function qD(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function jD(){const r=$e();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function yg(){return!wg()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Tg(){return!wg()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function vB(){try{return typeof indexedDB=="object"}catch{return!1}}function Ag(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}function KD(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const JD="FirebaseError";class Kt extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=JD,Object.setPrototypeOf(this,Kt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ys.prototype.create)}}class ys{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?zD(i,n):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new Kt(s,a,n)}}function zD(r,e){try{let t=0,n="";for(;t<r.length;){const s=r.indexOf("{$",t);if(s===-1){n+=r.substring(t);break}const i=r.indexOf("}",s+2);if(i===-1){n+=r.substring(t);break}const o=r.substring(s+2,i),a=e[o];n+=r.substring(t,s)+(a!=null?String(a):`<${o}?>`),t=i+1}return n}catch{return r}}function $D(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function gr(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const s of t){if(!n.includes(s))return!1;const i=r[s],o=e[s];if(yf(i)&&yf(o)){if(!gr(i,o))return!1}else if(i!==o)return!1}for(const s of n)if(!t.includes(s))return!1;return!0}function yf(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xo(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function ao(r){const e={};return r.replace(/^\?/,"").split("&").forEach(n=>{if(n){const[s,i]=n.split("=");e[decodeURIComponent(s)]=decodeURIComponent(i)}}),e}function uo(r){const e=r.indexOf("?");if(!e)return"";const t=r.indexOf("#",e);return r.substring(e,t>0?t:void 0)}function QD(r,e){const t=new WD(r,e);return t.subscribe.bind(t)}class WD{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");YD(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=ll),s.error===void 0&&(s.error=ll),s.complete===void 0&&(s.complete=ll);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch{}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function YD(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function ll(){}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const XD=1e3,ZD=2,ew=4*60*60*1e3,tw=.5;function PF(r,e=XD,t=ZD){const n=e*Math.pow(t,r),s=Math.round(tw*n*(Math.random()-.5)*2);return Math.min(ew,n+s)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ce(r){return r&&r._delegate?r._delegate:r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gn(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Yu(r){return(await fetch(r,{credentials:"include"})).ok}class Lt{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gr="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nw{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new Dg;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(sw(e))try{this.getOrInitializeService({instanceIdentifier:Gr})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=Gr){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Gr){return this.instances.has(e)}getOptions(e=Gr){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(i);n===a&&o.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:rw(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=Gr){return this.component?this.component.multipleInstances?e:Gr:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function rw(r){return r===Gr?void 0:r}function sw(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iw{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new nw(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var he;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(he||(he={}));const ow={debug:he.DEBUG,verbose:he.VERBOSE,info:he.INFO,warn:he.WARN,error:he.ERROR,silent:he.SILENT},aw=he.INFO,uw={[he.DEBUG]:"log",[he.VERBOSE]:"log",[he.INFO]:"info",[he.WARN]:"warn",[he.ERROR]:"error"},cw=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),s=uw[e];if(!s)throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class SB{constructor(e){this.name=e,this._logLevel=aw,this._logHandler=cw,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in he))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ow[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,he.DEBUG,...e),this._logHandler(this,he.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,he.VERBOSE,...e),this._logHandler(this,he.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,he.INFO,...e),this._logHandler(this,he.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,he.WARN,...e),this._logHandler(this,he.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,he.ERROR,...e),this._logHandler(this,he.ERROR,...e)}}const lw=(r,e)=>e.some(t=>r instanceof t);let Tf,Af;function Bw(){return Tf||(Tf=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function hw(){return Af||(Af=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Rg=new WeakMap,Vl=new WeakMap,bg=new WeakMap,Bl=new WeakMap,PB=new WeakMap;function dw(r){const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("success",i),r.removeEventListener("error",o)},i=()=>{t(yn(r.result)),s()},o=()=>{n(r.error),s()};r.addEventListener("success",i),r.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&Rg.set(t,r)}).catch(()=>{}),PB.set(e,r),e}function fw(r){if(Vl.has(r))return;const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("complete",i),r.removeEventListener("error",o),r.removeEventListener("abort",o)},i=()=>{t(),s()},o=()=>{n(r.error||new DOMException("AbortError","AbortError")),s()};r.addEventListener("complete",i),r.addEventListener("error",o),r.addEventListener("abort",o)});Vl.set(r,e)}let Ml={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return Vl.get(r);if(e==="objectStoreNames")return r.objectStoreNames||bg.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return yn(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function Cw(r){Ml=r(Ml)}function pw(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=r.call(hl(this),e,...t);return bg.set(n,e.sort?e.sort():[e]),yn(n)}:hw().includes(r)?function(...e){return r.apply(hl(this),e),yn(Rg.get(this))}:function(...e){return yn(r.apply(hl(this),e))}}function gw(r){return typeof r=="function"?pw(r):(r instanceof IDBTransaction&&fw(r),lw(r,Bw())?new Proxy(r,Ml):r)}function yn(r){if(r instanceof IDBRequest)return dw(r);if(Bl.has(r))return Bl.get(r);const e=gw(r);return e!==r&&(Bl.set(r,e),PB.set(e,r)),e}const hl=r=>PB.get(r);function Xu(r,e,{blocked:t,upgrade:n,blocking:s,terminated:i}={}){const o=indexedDB.open(r,e),a=yn(o);return n&&o.addEventListener("upgradeneeded",u=>{n(yn(o.result),u.oldVersion,u.newVersion,yn(o.transaction),u)}),t&&o.addEventListener("blocked",u=>t(u.oldVersion,u.newVersion,u)),a.then(u=>{i&&u.addEventListener("close",()=>i()),s&&u.addEventListener("versionchange",l=>s(l.oldVersion,l.newVersion,l))}).catch(()=>{}),a}function Za(r,{blocked:e}={}){const t=indexedDB.deleteDatabase(r);return e&&t.addEventListener("blocked",n=>e(n.oldVersion,n)),yn(t).then(()=>{})}const mw=["get","getKey","getAll","getAllKeys","count"],_w=["put","add","delete","clear"],dl=new Map;function Rf(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(dl.get(e))return dl.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,s=_w.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(s||mw.includes(t)))return;const i=async function(o,...a){const u=this.transaction(o,s?"readwrite":"readonly");let l=u.store;return n&&(l=l.index(a.shift())),(await Promise.all([l[t](...a),s&&u.done]))[0]};return dl.set(e,i),i}Cw(r=>({...r,get:(e,t,n)=>Rf(e,t)||r.get(e,t,n),has:(e,t)=>!!Rf(e,t)||r.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ew{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Iw(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function Iw(r){const e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Gl="@firebase/app",bf="0.16.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pn=new SB("@firebase/app"),Dw="@firebase/app-compat",ww="@firebase/analytics-compat",yw="@firebase/analytics",Tw="@firebase/app-check-compat",Aw="@firebase/app-check",Rw="@firebase/auth",bw="@firebase/auth-compat",vw="@firebase/database",Sw="@firebase/data-connect",Pw="@firebase/database-compat",Nw="@firebase/functions",Ow="@firebase/functions-compat",Fw="@firebase/installations",kw="@firebase/installations-compat",Lw="@firebase/messaging",xw="@firebase/messaging-compat",Vw="@firebase/performance",Mw="@firebase/performance-compat",Gw="@firebase/remote-config",Uw="@firebase/remote-config-compat",Hw="@firebase/storage",qw="@firebase/storage-compat",jw="@firebase/firestore",Kw="@firebase/ai",Jw="@firebase/firestore-compat",zw="firebase",$w="12.19.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ul="[DEFAULT]",Qw={[Gl]:"fire-core",[Dw]:"fire-core-compat",[yw]:"fire-analytics",[ww]:"fire-analytics-compat",[Aw]:"fire-app-check",[Tw]:"fire-app-check-compat",[Rw]:"fire-auth",[bw]:"fire-auth-compat",[vw]:"fire-rtdb",[Sw]:"fire-data-connect",[Pw]:"fire-rtdb-compat",[Nw]:"fire-fn",[Ow]:"fire-fn-compat",[Fw]:"fire-iid",[kw]:"fire-iid-compat",[Lw]:"fire-fcm",[xw]:"fire-fcm-compat",[Vw]:"fire-perf",[Mw]:"fire-perf-compat",[Gw]:"fire-rc",[Uw]:"fire-rc-compat",[Hw]:"fire-gcs",[qw]:"fire-gcs-compat",[jw]:"fire-fst",[Jw]:"fire-fst-compat",[Kw]:"fire-vertex","fire-js":"fire-js",[zw]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vo=new Map,Ww=new Map,Hl=new Map;function vf(r,e){try{r.container.addComponent(e)}catch(t){Pn.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function Ht(r){const e=r.name;if(Hl.has(e))return Pn.debug(`There were multiple attempts to register component ${e}.`),!1;Hl.set(e,r);for(const t of vo.values())vf(t,r);for(const t of Ww.values())vf(t,r);return!0}function Ar(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function pt(r){return r==null?!1:r.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yw={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},In=new ys("app","Firebase",Yw);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xw{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Lt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw In.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ts=$w;function Zw(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:Ul,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw In.create("bad-app-name",{appName:String(s)});if(t||(t=Eg()),!t)throw In.create("no-options");const i=vo.get(s);if(i)if(gr(t,i.options)){if(gr(n,i.config))return i;throw In.create("duplicate-app",{appName:s,mismatchedParam:"config",oldValue:JSON.stringify(i.config),newValue:JSON.stringify(n)})}else throw In.create("duplicate-app",{appName:s,mismatchedParam:"options",oldValue:JSON.stringify(i.options),newValue:JSON.stringify(t)});const o=new iw(s);for(const u of Hl.values())o.addComponent(u);const a=new Xw(t,n,o);return vo.set(s,a),a}function Zu(r=Ul){const e=vo.get(r);if(!e&&r===Ul&&Eg())return Zw();if(!e)throw In.create("no-app",{appName:r});return e}function NF(){return Array.from(vo.values())}function ct(r,e,t){let n=Qw[r]??r;t&&(n+=`-${t}`);const s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${n}" with version "${e}":`];s&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Pn.warn(o.join(" "));return}Ht(new Lt(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ey="firebase-heartbeat-database",ty=1,So="firebase-heartbeat-store";let fl=null;function vg(){return fl||(fl=Xu(ey,ty,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(So)}catch{}}}}).catch(r=>{throw In.create("idb-open",{originalErrorMessage:r.message})})),fl}async function ny(r){try{const t=(await vg()).transaction(So),n=await t.objectStore(So).get(Sg(r));return await t.done,n}catch(e){if(e instanceof Kt)Pn.warn(e.message);else{const t=In.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Pn.warn(t.message)}}}async function Sf(r,e){try{const n=(await vg()).transaction(So,"readwrite");await n.objectStore(So).put(e,Sg(r)),await n.done}catch(t){if(t instanceof Kt)Pn.warn(t.message);else{const n=In.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Pn.warn(n.message)}}}function Sg(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ry=1024,sy=30;class iy{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new ay(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Pf();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>sy){const o=uy(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){Pn.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Pf(),{heartbeatsToSend:n,unsentEntries:s}=oy(this._heartbeatsCache.heartbeats),i=gu(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Pn.warn(t),""}}}function Pf(){return new Date().toISOString().substring(0,10)}function oy(r,e=ry){const t=[];let n=r.slice();for(const s of r){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),Nf(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),Nf(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class ay{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return vB()?Ag().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await ny(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Sf(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Sf(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function Nf(r){return gu(JSON.stringify({version:2,heartbeats:r})).length}function uy(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cy(r){Ht(new Lt("platform-logger",e=>new Ew(e),"PRIVATE")),Ht(new Lt("heartbeat",e=>new iy(e),"PRIVATE")),ct(Gl,bf,r),ct(Gl,bf,"esm2020"),ct("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */cy("");var Of=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var dr,Pg;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(y,E){function w(){}w.prototype=E.prototype,y.F=E.prototype,y.prototype=new w,y.prototype.constructor=y,y.D=function(b,R,N){for(var I=Array(arguments.length-2),_t=2;_t<arguments.length;_t++)I[_t-2]=arguments[_t];return E.prototype[R].apply(b,I)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(y,E,w){w||(w=0);const b=Array(16);if(typeof E=="string")for(var R=0;R<16;++R)b[R]=E.charCodeAt(w++)|E.charCodeAt(w++)<<8|E.charCodeAt(w++)<<16|E.charCodeAt(w++)<<24;else for(R=0;R<16;++R)b[R]=E[w++]|E[w++]<<8|E[w++]<<16|E[w++]<<24;E=y.g[0],w=y.g[1],R=y.g[2];let N=y.g[3],I;I=E+(N^w&(R^N))+b[0]+3614090360&4294967295,E=w+(I<<7&4294967295|I>>>25),I=N+(R^E&(w^R))+b[1]+3905402710&4294967295,N=E+(I<<12&4294967295|I>>>20),I=R+(w^N&(E^w))+b[2]+606105819&4294967295,R=N+(I<<17&4294967295|I>>>15),I=w+(E^R&(N^E))+b[3]+3250441966&4294967295,w=R+(I<<22&4294967295|I>>>10),I=E+(N^w&(R^N))+b[4]+4118548399&4294967295,E=w+(I<<7&4294967295|I>>>25),I=N+(R^E&(w^R))+b[5]+1200080426&4294967295,N=E+(I<<12&4294967295|I>>>20),I=R+(w^N&(E^w))+b[6]+2821735955&4294967295,R=N+(I<<17&4294967295|I>>>15),I=w+(E^R&(N^E))+b[7]+4249261313&4294967295,w=R+(I<<22&4294967295|I>>>10),I=E+(N^w&(R^N))+b[8]+1770035416&4294967295,E=w+(I<<7&4294967295|I>>>25),I=N+(R^E&(w^R))+b[9]+2336552879&4294967295,N=E+(I<<12&4294967295|I>>>20),I=R+(w^N&(E^w))+b[10]+4294925233&4294967295,R=N+(I<<17&4294967295|I>>>15),I=w+(E^R&(N^E))+b[11]+2304563134&4294967295,w=R+(I<<22&4294967295|I>>>10),I=E+(N^w&(R^N))+b[12]+1804603682&4294967295,E=w+(I<<7&4294967295|I>>>25),I=N+(R^E&(w^R))+b[13]+4254626195&4294967295,N=E+(I<<12&4294967295|I>>>20),I=R+(w^N&(E^w))+b[14]+2792965006&4294967295,R=N+(I<<17&4294967295|I>>>15),I=w+(E^R&(N^E))+b[15]+1236535329&4294967295,w=R+(I<<22&4294967295|I>>>10),I=E+(R^N&(w^R))+b[1]+4129170786&4294967295,E=w+(I<<5&4294967295|I>>>27),I=N+(w^R&(E^w))+b[6]+3225465664&4294967295,N=E+(I<<9&4294967295|I>>>23),I=R+(E^w&(N^E))+b[11]+643717713&4294967295,R=N+(I<<14&4294967295|I>>>18),I=w+(N^E&(R^N))+b[0]+3921069994&4294967295,w=R+(I<<20&4294967295|I>>>12),I=E+(R^N&(w^R))+b[5]+3593408605&4294967295,E=w+(I<<5&4294967295|I>>>27),I=N+(w^R&(E^w))+b[10]+38016083&4294967295,N=E+(I<<9&4294967295|I>>>23),I=R+(E^w&(N^E))+b[15]+3634488961&4294967295,R=N+(I<<14&4294967295|I>>>18),I=w+(N^E&(R^N))+b[4]+3889429448&4294967295,w=R+(I<<20&4294967295|I>>>12),I=E+(R^N&(w^R))+b[9]+568446438&4294967295,E=w+(I<<5&4294967295|I>>>27),I=N+(w^R&(E^w))+b[14]+3275163606&4294967295,N=E+(I<<9&4294967295|I>>>23),I=R+(E^w&(N^E))+b[3]+4107603335&4294967295,R=N+(I<<14&4294967295|I>>>18),I=w+(N^E&(R^N))+b[8]+1163531501&4294967295,w=R+(I<<20&4294967295|I>>>12),I=E+(R^N&(w^R))+b[13]+2850285829&4294967295,E=w+(I<<5&4294967295|I>>>27),I=N+(w^R&(E^w))+b[2]+4243563512&4294967295,N=E+(I<<9&4294967295|I>>>23),I=R+(E^w&(N^E))+b[7]+1735328473&4294967295,R=N+(I<<14&4294967295|I>>>18),I=w+(N^E&(R^N))+b[12]+2368359562&4294967295,w=R+(I<<20&4294967295|I>>>12),I=E+(w^R^N)+b[5]+4294588738&4294967295,E=w+(I<<4&4294967295|I>>>28),I=N+(E^w^R)+b[8]+2272392833&4294967295,N=E+(I<<11&4294967295|I>>>21),I=R+(N^E^w)+b[11]+1839030562&4294967295,R=N+(I<<16&4294967295|I>>>16),I=w+(R^N^E)+b[14]+4259657740&4294967295,w=R+(I<<23&4294967295|I>>>9),I=E+(w^R^N)+b[1]+2763975236&4294967295,E=w+(I<<4&4294967295|I>>>28),I=N+(E^w^R)+b[4]+1272893353&4294967295,N=E+(I<<11&4294967295|I>>>21),I=R+(N^E^w)+b[7]+4139469664&4294967295,R=N+(I<<16&4294967295|I>>>16),I=w+(R^N^E)+b[10]+3200236656&4294967295,w=R+(I<<23&4294967295|I>>>9),I=E+(w^R^N)+b[13]+681279174&4294967295,E=w+(I<<4&4294967295|I>>>28),I=N+(E^w^R)+b[0]+3936430074&4294967295,N=E+(I<<11&4294967295|I>>>21),I=R+(N^E^w)+b[3]+3572445317&4294967295,R=N+(I<<16&4294967295|I>>>16),I=w+(R^N^E)+b[6]+76029189&4294967295,w=R+(I<<23&4294967295|I>>>9),I=E+(w^R^N)+b[9]+3654602809&4294967295,E=w+(I<<4&4294967295|I>>>28),I=N+(E^w^R)+b[12]+3873151461&4294967295,N=E+(I<<11&4294967295|I>>>21),I=R+(N^E^w)+b[15]+530742520&4294967295,R=N+(I<<16&4294967295|I>>>16),I=w+(R^N^E)+b[2]+3299628645&4294967295,w=R+(I<<23&4294967295|I>>>9),I=E+(R^(w|~N))+b[0]+4096336452&4294967295,E=w+(I<<6&4294967295|I>>>26),I=N+(w^(E|~R))+b[7]+1126891415&4294967295,N=E+(I<<10&4294967295|I>>>22),I=R+(E^(N|~w))+b[14]+2878612391&4294967295,R=N+(I<<15&4294967295|I>>>17),I=w+(N^(R|~E))+b[5]+4237533241&4294967295,w=R+(I<<21&4294967295|I>>>11),I=E+(R^(w|~N))+b[12]+1700485571&4294967295,E=w+(I<<6&4294967295|I>>>26),I=N+(w^(E|~R))+b[3]+2399980690&4294967295,N=E+(I<<10&4294967295|I>>>22),I=R+(E^(N|~w))+b[10]+4293915773&4294967295,R=N+(I<<15&4294967295|I>>>17),I=w+(N^(R|~E))+b[1]+2240044497&4294967295,w=R+(I<<21&4294967295|I>>>11),I=E+(R^(w|~N))+b[8]+1873313359&4294967295,E=w+(I<<6&4294967295|I>>>26),I=N+(w^(E|~R))+b[15]+4264355552&4294967295,N=E+(I<<10&4294967295|I>>>22),I=R+(E^(N|~w))+b[6]+2734768916&4294967295,R=N+(I<<15&4294967295|I>>>17),I=w+(N^(R|~E))+b[13]+1309151649&4294967295,w=R+(I<<21&4294967295|I>>>11),I=E+(R^(w|~N))+b[4]+4149444226&4294967295,E=w+(I<<6&4294967295|I>>>26),I=N+(w^(E|~R))+b[11]+3174756917&4294967295,N=E+(I<<10&4294967295|I>>>22),I=R+(E^(N|~w))+b[2]+718787259&4294967295,R=N+(I<<15&4294967295|I>>>17),I=w+(N^(R|~E))+b[9]+3951481745&4294967295,y.g[0]=y.g[0]+E&4294967295,y.g[1]=y.g[1]+(R+(I<<21&4294967295|I>>>11))&4294967295,y.g[2]=y.g[2]+R&4294967295,y.g[3]=y.g[3]+N&4294967295}n.prototype.v=function(y,E){E===void 0&&(E=y.length);const w=E-this.blockSize,b=this.C;let R=this.h,N=0;for(;N<E;){if(R==0)for(;N<=w;)s(this,y,N),N+=this.blockSize;if(typeof y=="string"){for(;N<E;)if(b[R++]=y.charCodeAt(N++),R==this.blockSize){s(this,b),R=0;break}}else for(;N<E;)if(b[R++]=y[N++],R==this.blockSize){s(this,b),R=0;break}}this.h=R,this.o+=E},n.prototype.A=function(){var y=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);y[0]=128;for(var E=1;E<y.length-8;++E)y[E]=0;E=this.o*8;for(var w=y.length-8;w<y.length;++w)y[w]=E&255,E/=256;for(this.v(y),y=Array(16),E=0,w=0;w<4;++w)for(let b=0;b<32;b+=8)y[E++]=this.g[w]>>>b&255;return y};function i(y,E){var w=a;return Object.prototype.hasOwnProperty.call(w,y)?w[y]:w[y]=E(y)}function o(y,E){this.h=E;const w=[];let b=!0;for(let R=y.length-1;R>=0;R--){const N=y[R]|0;b&&N==E||(w[R]=N,b=!1)}this.g=w}var a={};function u(y){return-128<=y&&y<128?i(y,function(E){return new o([E|0],E<0?-1:0)}):new o([y|0],y<0?-1:0)}function l(y){if(isNaN(y)||!isFinite(y))return d;if(y<0)return x(l(-y));const E=[];let w=1;for(let b=0;y>=w;b++)E[b]=y/w|0,w*=4294967296;return new o(E,0)}function B(y,E){if(y.length==0)throw Error("number format error: empty string");if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(y.charAt(0)=="-")return x(B(y.substring(1),E));if(y.indexOf("-")>=0)throw Error('number format error: interior "-" character');const w=l(Math.pow(E,8));let b=d;for(let N=0;N<y.length;N+=8){var R=Math.min(8,y.length-N);const I=parseInt(y.substring(N,N+R),E);R<8?(R=l(Math.pow(E,R)),b=b.j(R).add(l(I))):(b=b.j(w),b=b.add(l(I)))}return b}var d=u(0),C=u(1),g=u(16777216);r=o.prototype,r.m=function(){if(P(this))return-x(this).m();let y=0,E=1;for(let w=0;w<this.g.length;w++){const b=this.i(w);y+=(b>=0?b:4294967296+b)*E,E*=4294967296}return y},r.toString=function(y){if(y=y||10,y<2||36<y)throw Error("radix out of range: "+y);if(D(this))return"0";if(P(this))return"-"+x(this).toString(y);const E=l(Math.pow(y,6));var w=this;let b="";for(;;){const R=se(w,E).g;w=J(w,R.j(E));let N=((w.g.length>0?w.g[0]:w.h)>>>0).toString(y);if(w=R,D(w))return N+b;for(;N.length<6;)N="0"+N;b=N+b}},r.i=function(y){return y<0?0:y<this.g.length?this.g[y]:this.h};function D(y){if(y.h!=0)return!1;for(let E=0;E<y.g.length;E++)if(y.g[E]!=0)return!1;return!0}function P(y){return y.h==-1}r.l=function(y){return y=J(this,y),P(y)?-1:D(y)?0:1};function x(y){const E=y.g.length,w=[];for(let b=0;b<E;b++)w[b]=~y.g[b];return new o(w,~y.h).add(C)}r.abs=function(){return P(this)?x(this):this},r.add=function(y){const E=Math.max(this.g.length,y.g.length),w=[];let b=0;for(let R=0;R<=E;R++){let N=b+(this.i(R)&65535)+(y.i(R)&65535),I=(N>>>16)+(this.i(R)>>>16)+(y.i(R)>>>16);b=I>>>16,N&=65535,I&=65535,w[R]=I<<16|N}return new o(w,w[w.length-1]&-2147483648?-1:0)};function J(y,E){return y.add(x(E))}r.j=function(y){if(D(this)||D(y))return d;if(P(this))return P(y)?x(this).j(x(y)):x(x(this).j(y));if(P(y))return x(this.j(x(y)));if(this.l(g)<0&&y.l(g)<0)return l(this.m()*y.m());const E=this.g.length+y.g.length,w=[];for(var b=0;b<2*E;b++)w[b]=0;for(b=0;b<this.g.length;b++)for(let R=0;R<y.g.length;R++){const N=this.i(b)>>>16,I=this.i(b)&65535,_t=y.i(R)>>>16,Fr=y.i(R)&65535;w[2*b+2*R]+=I*Fr,X(w,2*b+2*R),w[2*b+2*R+1]+=N*Fr,X(w,2*b+2*R+1),w[2*b+2*R+1]+=I*_t,X(w,2*b+2*R+1),w[2*b+2*R+2]+=N*_t,X(w,2*b+2*R+2)}for(y=0;y<E;y++)w[y]=w[2*y+1]<<16|w[2*y];for(y=E;y<2*E;y++)w[y]=0;return new o(w,0)};function X(y,E){for(;(y[E]&65535)!=y[E];)y[E+1]+=y[E]>>>16,y[E]&=65535,E++}function Z(y,E){this.g=y,this.h=E}function se(y,E){if(D(E))throw Error("division by zero");if(D(y))return new Z(d,d);if(P(y))return E=se(x(y),E),new Z(x(E.g),x(E.h));if(P(E))return E=se(y,x(E)),new Z(x(E.g),E.h);if(y.g.length>30){if(P(y)||P(E))throw Error("slowDivide_ only works with positive integers.");for(var w=C,b=E;b.l(y)<=0;)w=ue(w),b=ue(b);var R=ae(w,1),N=ae(b,1);for(b=ae(b,2),w=ae(w,2);!D(b);){var I=N.add(b);I.l(y)<=0&&(R=R.add(w),N=I),b=ae(b,1),w=ae(w,1)}return E=J(y,R.j(E)),new Z(R,E)}for(R=d;y.l(E)>=0;){for(w=Math.max(1,Math.floor(y.m()/E.m())),b=Math.ceil(Math.log(w)/Math.LN2),b=b<=48?1:Math.pow(2,b-48),N=l(w),I=N.j(E);P(I)||I.l(y)>0;)w-=b,N=l(w),I=N.j(E);D(N)&&(N=C),R=R.add(N),y=J(y,I)}return new Z(R,y)}r.B=function(y){return se(this,y).h},r.and=function(y){const E=Math.max(this.g.length,y.g.length),w=[];for(let b=0;b<E;b++)w[b]=this.i(b)&y.i(b);return new o(w,this.h&y.h)},r.or=function(y){const E=Math.max(this.g.length,y.g.length),w=[];for(let b=0;b<E;b++)w[b]=this.i(b)|y.i(b);return new o(w,this.h|y.h)},r.xor=function(y){const E=Math.max(this.g.length,y.g.length),w=[];for(let b=0;b<E;b++)w[b]=this.i(b)^y.i(b);return new o(w,this.h^y.h)};function ue(y){const E=y.g.length+1,w=[];for(let b=0;b<E;b++)w[b]=y.i(b)<<1|y.i(b-1)>>>31;return new o(w,y.h)}function ae(y,E){const w=E>>5;E%=32;const b=y.g.length-w,R=[];for(let N=0;N<b;N++)R[N]=E>0?y.i(N+w)>>>E|y.i(N+w+1)<<32-E:y.i(N+w);return new o(R,y.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,Pg=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=l,o.fromString=B,dr=o}).apply(typeof Of<"u"?Of:typeof self<"u"?self:typeof window<"u"?window:{});var La=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ng,co,Og,eu,ql,Fg,kg,Lg;(function(){var r,e=Object.defineProperty;function t(c){c=[typeof globalThis=="object"&&globalThis,c,typeof window=="object"&&window,typeof self=="object"&&self,typeof La=="object"&&La];for(var h=0;h<c.length;++h){var f=c[h];if(f&&f.Math==Math)return f}throw Error("Cannot find global object")}var n=t(this);function s(c,h){if(h)e:{var f=n;c=c.split(".");for(var p=0;p<c.length-1;p++){var S=c[p];if(!(S in f))break e;f=f[S]}c=c[c.length-1],p=f[c],h=h(p),h!=p&&h!=null&&e(f,c,{configurable:!0,writable:!0,value:h})}}s("Symbol.dispose",function(c){return c||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(c){return c||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(c){return c||function(h){var f=[],p;for(p in h)Object.prototype.hasOwnProperty.call(h,p)&&f.push([p,h[p]]);return f}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function a(c){var h=typeof c;return h=="object"&&c!=null||h=="function"}function u(c,h,f){return c.call.apply(c.bind,arguments)}function l(c,h,f){return l=u,l.apply(null,arguments)}function B(c,h){var f=Array.prototype.slice.call(arguments,1);return function(){var p=f.slice();return p.push.apply(p,arguments),c.apply(this,p)}}function d(c,h){function f(){}f.prototype=h.prototype,c.Z=h.prototype,c.prototype=new f,c.prototype.constructor=c,c.Ob=function(p,S,F){for(var $=Array(arguments.length-2),le=2;le<arguments.length;le++)$[le-2]=arguments[le];return h.prototype[S].apply(p,$)}}var C=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?c=>c&&AsyncContext.Snapshot.wrap(c):c=>c;function g(c){const h=c.length;if(h>0){const f=Array(h);for(let p=0;p<h;p++)f[p]=c[p];return f}return[]}function D(c,h){for(let p=1;p<arguments.length;p++){const S=arguments[p];var f=typeof S;if(f=f!="object"?f:S?Array.isArray(S)?"array":f:"null",f=="array"||f=="object"&&typeof S.length=="number"){f=c.length||0;const F=S.length||0;c.length=f+F;for(let $=0;$<F;$++)c[f+$]=S[$]}else c.push(S)}}class P{constructor(h,f){this.i=h,this.j=f,this.h=0,this.g=null}get(){let h;return this.h>0?(this.h--,h=this.g,this.g=h.next,h.next=null):h=this.i(),h}}function x(c){o.setTimeout(()=>{throw c},0)}function J(){var c=y;let h=null;return c.g&&(h=c.g,c.g=c.g.next,c.g||(c.h=null),h.next=null),h}class X{constructor(){this.h=this.g=null}add(h,f){const p=Z.get();p.set(h,f),this.h?this.h.next=p:this.g=p,this.h=p}}var Z=new P(()=>new se,c=>c.reset());class se{constructor(){this.next=this.g=this.h=null}set(h,f){this.h=h,this.g=f,this.next=null}reset(){this.next=this.g=this.h=null}}let ue,ae=!1,y=new X,E=()=>{const c=Promise.resolve(void 0);ue=()=>{c.then(w)}};function w(){for(var c;c=J();){try{c.h.call(c.g)}catch(f){x(f)}var h=Z;h.j(c),h.h<100&&(h.h++,c.next=h.g,h.g=c)}ae=!1}function b(){this.u=this.u,this.C=this.C}b.prototype.u=!1,b.prototype.dispose=function(){this.u||(this.u=!0,this.N())},b.prototype[Symbol.dispose]=function(){this.dispose()},b.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function R(c,h){this.type=c,this.g=this.target=h,this.defaultPrevented=!1}R.prototype.h=function(){this.defaultPrevented=!0};var N=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var c=!1,h=Object.defineProperty({},"passive",{get:function(){c=!0}});try{const f=()=>{};o.addEventListener("test",f,h),o.removeEventListener("test",f,h)}catch{}return c}();function I(c){return/^[\s\xa0]*$/.test(c)}function _t(c,h){R.call(this,c?c.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,c&&this.init(c,h)}d(_t,R),_t.prototype.init=function(c,h){const f=this.type=c.type,p=c.changedTouches&&c.changedTouches.length?c.changedTouches[0]:null;this.target=c.target||c.srcElement,this.g=h,h=c.relatedTarget,h||(f=="mouseover"?h=c.fromElement:f=="mouseout"&&(h=c.toElement)),this.relatedTarget=h,p?(this.clientX=p.clientX!==void 0?p.clientX:p.pageX,this.clientY=p.clientY!==void 0?p.clientY:p.pageY,this.screenX=p.screenX||0,this.screenY=p.screenY||0):(this.clientX=c.clientX!==void 0?c.clientX:c.pageX,this.clientY=c.clientY!==void 0?c.clientY:c.pageY,this.screenX=c.screenX||0,this.screenY=c.screenY||0),this.button=c.button,this.key=c.key||"",this.ctrlKey=c.ctrlKey,this.altKey=c.altKey,this.shiftKey=c.shiftKey,this.metaKey=c.metaKey,this.pointerId=c.pointerId||0,this.pointerType=c.pointerType,this.state=c.state,this.i=c,c.defaultPrevented&&_t.Z.h.call(this)},_t.prototype.h=function(){_t.Z.h.call(this);const c=this.i;c.preventDefault?c.preventDefault():c.returnValue=!1};var Fr="closure_listenable_"+(Math.random()*1e6|0),XI=0;function ZI(c,h,f,p,S){this.listener=c,this.proxy=null,this.src=h,this.type=f,this.capture=!!p,this.ha=S,this.key=++XI,this.da=this.fa=!1}function Ia(c){c.da=!0,c.listener=null,c.proxy=null,c.src=null,c.ha=null}function Da(c,h,f){for(const p in c)h.call(f,c[p],p,c)}function eD(c,h){for(const f in c)h.call(void 0,c[f],f,c)}function Id(c){const h={};for(const f in c)h[f]=c[f];return h}const Dd="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function wd(c,h){let f,p;for(let S=1;S<arguments.length;S++){p=arguments[S];for(f in p)c[f]=p[f];for(let F=0;F<Dd.length;F++)f=Dd[F],Object.prototype.hasOwnProperty.call(p,f)&&(c[f]=p[f])}}function wa(c){this.src=c,this.g={},this.h=0}wa.prototype.add=function(c,h,f,p,S){const F=c.toString();c=this.g[F],c||(c=this.g[F]=[],this.h++);const $=Uc(c,h,p,S);return $>-1?(h=c[$],f||(h.fa=!1)):(h=new ZI(h,this.src,F,!!p,S),h.fa=f,c.push(h)),h};function Gc(c,h){const f=h.type;if(f in c.g){var p=c.g[f],S=Array.prototype.indexOf.call(p,h,void 0),F;(F=S>=0)&&Array.prototype.splice.call(p,S,1),F&&(Ia(h),c.g[f].length==0&&(delete c.g[f],c.h--))}}function Uc(c,h,f,p){for(let S=0;S<c.length;++S){const F=c[S];if(!F.da&&F.listener==h&&F.capture==!!f&&F.ha==p)return S}return-1}var Hc="closure_lm_"+(Math.random()*1e6|0),qc={};function yd(c,h,f,p,S){if(Array.isArray(h)){for(let F=0;F<h.length;F++)yd(c,h[F],f,p,S);return null}return f=Rd(f),c&&c[Fr]?c.J(h,f,a(p)?!!p.capture:!1,S):tD(c,h,f,!1,p,S)}function tD(c,h,f,p,S,F){if(!h)throw Error("Invalid event type");const $=a(S)?!!S.capture:!!S;let le=Kc(c);if(le||(c[Hc]=le=new wa(c)),f=le.add(h,f,p,$,F),f.proxy)return f;if(p=nD(),f.proxy=p,p.src=c,p.listener=f,c.addEventListener)N||(S=$),S===void 0&&(S=!1),c.addEventListener(h.toString(),p,S);else if(c.attachEvent)c.attachEvent(Ad(h.toString()),p);else if(c.addListener&&c.removeListener)c.addListener(p);else throw Error("addEventListener and attachEvent are unavailable.");return f}function nD(){function c(f){return h.call(c.src,c.listener,f)}const h=rD;return c}function Td(c,h,f,p,S){if(Array.isArray(h))for(var F=0;F<h.length;F++)Td(c,h[F],f,p,S);else p=a(p)?!!p.capture:!!p,f=Rd(f),c&&c[Fr]?(c=c.i,F=String(h).toString(),F in c.g&&(h=c.g[F],f=Uc(h,f,p,S),f>-1&&(Ia(h[f]),Array.prototype.splice.call(h,f,1),h.length==0&&(delete c.g[F],c.h--)))):c&&(c=Kc(c))&&(h=c.g[h.toString()],c=-1,h&&(c=Uc(h,f,p,S)),(f=c>-1?h[c]:null)&&jc(f))}function jc(c){if(typeof c!="number"&&c&&!c.da){var h=c.src;if(h&&h[Fr])Gc(h.i,c);else{var f=c.type,p=c.proxy;h.removeEventListener?h.removeEventListener(f,p,c.capture):h.detachEvent?h.detachEvent(Ad(f),p):h.addListener&&h.removeListener&&h.removeListener(p),(f=Kc(h))?(Gc(f,c),f.h==0&&(f.src=null,h[Hc]=null)):Ia(c)}}}function Ad(c){return c in qc?qc[c]:qc[c]="on"+c}function rD(c,h){if(c.da)c=!0;else{h=new _t(h,this);const f=c.listener,p=c.ha||c.src;c.fa&&jc(c),c=f.call(p,h)}return c}function Kc(c){return c=c[Hc],c instanceof wa?c:null}var Jc="__closure_events_fn_"+(Math.random()*1e9>>>0);function Rd(c){return typeof c=="function"?c:(c[Jc]||(c[Jc]=function(h){return c.handleEvent(h)}),c[Jc])}function st(){b.call(this),this.i=new wa(this),this.M=this,this.G=null}d(st,b),st.prototype[Fr]=!0,st.prototype.removeEventListener=function(c,h,f,p){Td(this,c,h,f,p)};function dt(c,h){var f,p=c.G;if(p)for(f=[];p;p=p.G)f.push(p);if(c=c.M,p=h.type||h,typeof h=="string")h=new R(h,c);else if(h instanceof R)h.target=h.target||c;else{var S=h;h=new R(p,c),wd(h,S)}S=!0;let F,$;if(f)for($=f.length-1;$>=0;$--)F=h.g=f[$],S=ya(F,p,!0,h)&&S;if(F=h.g=c,S=ya(F,p,!0,h)&&S,S=ya(F,p,!1,h)&&S,f)for($=0;$<f.length;$++)F=h.g=f[$],S=ya(F,p,!1,h)&&S}st.prototype.N=function(){if(st.Z.N.call(this),this.i){var c=this.i;for(const h in c.g){const f=c.g[h];for(let p=0;p<f.length;p++)Ia(f[p]);delete c.g[h],c.h--}}this.G=null},st.prototype.J=function(c,h,f,p){return this.i.add(String(c),h,!1,f,p)},st.prototype.K=function(c,h,f,p){return this.i.add(String(c),h,!0,f,p)};function ya(c,h,f,p){if(h=c.i.g[String(h)],!h)return!0;h=h.concat();let S=!0;for(let F=0;F<h.length;++F){const $=h[F];if($&&!$.da&&$.capture==f){const le=$.listener,Ke=$.ha||$.src;$.fa&&Gc(c.i,$),S=le.call(Ke,p)!==!1&&S}}return S&&!p.defaultPrevented}function sD(c,h){if(typeof c!="function")if(c&&typeof c.handleEvent=="function")c=l(c.handleEvent,c);else throw Error("Invalid listener argument");return Number(h)>2147483647?-1:o.setTimeout(c,h||0)}function bd(c){c.g=sD(()=>{c.g=null,c.i&&(c.i=!1,bd(c))},c.l);const h=c.h;c.h=null,c.m.apply(null,h)}class iD extends b{constructor(h,f){super(),this.m=h,this.l=f,this.h=null,this.i=!1,this.g=null}j(h){this.h=arguments,this.g?this.i=!0:bd(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Vi(c){b.call(this),this.h=c,this.g={}}d(Vi,b);var vd=[];function Sd(c){Da(c.g,function(h,f){this.g.hasOwnProperty(f)&&jc(h)},c),c.g={}}Vi.prototype.N=function(){Vi.Z.N.call(this),Sd(this)},Vi.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var zc=o.JSON.stringify,oD=o.JSON.parse,aD=class{stringify(c){return o.JSON.stringify(c,void 0)}parse(c){return o.JSON.parse(c,void 0)}};function Pd(){}function Nd(){}var Mi={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function $c(){R.call(this,"d")}d($c,R);function Qc(){R.call(this,"c")}d(Qc,R);var kr={},Od=null;function Ta(){return Od=Od||new st}kr.Ia="serverreachability";function Fd(c){R.call(this,kr.Ia,c)}d(Fd,R);function Gi(c){const h=Ta();dt(h,new Fd(h))}kr.STAT_EVENT="statevent";function kd(c,h){R.call(this,kr.STAT_EVENT,c),this.stat=h}d(kd,R);function ft(c){const h=Ta();dt(h,new kd(h,c))}kr.Ja="timingevent";function Ld(c,h){R.call(this,kr.Ja,c),this.size=h}d(Ld,R);function Ui(c,h){if(typeof c!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){c()},h)}function Hi(){this.g=!0}Hi.prototype.ua=function(){this.g=!1};function uD(c,h,f,p,S,F){c.info(function(){if(c.g)if(F){var $="",le=F.split("&");for(let we=0;we<le.length;we++){var Ke=le[we].split("=");if(Ke.length>1){const We=Ke[0];Ke=Ke[1];const Zt=We.split("_");$=Zt.length>=2&&Zt[1]=="type"?$+(We+"="+Ke+"&"):$+(We+"=redacted&")}}}else $=null;else $=F;return"XMLHTTP REQ ("+p+") [attempt "+S+"]: "+h+`
`+f+`
`+$})}function cD(c,h,f,p,S,F,$){c.info(function(){return"XMLHTTP RESP ("+p+") [ attempt "+S+"]: "+h+`
`+f+`
`+F+" "+$})}function Fs(c,h,f,p){c.info(function(){return"XMLHTTP TEXT ("+h+"): "+BD(c,f)+(p?" "+p:"")})}function lD(c,h){c.info(function(){return"TIMEOUT: "+h})}Hi.prototype.info=function(){};function BD(c,h){if(!c.g)return h;if(!h)return null;try{const F=JSON.parse(h);if(F){for(c=0;c<F.length;c++)if(Array.isArray(F[c])){var f=F[c];if(!(f.length<2)){var p=f[1];if(Array.isArray(p)&&!(p.length<1)){var S=p[0];if(S!="noop"&&S!="stop"&&S!="close")for(let $=1;$<p.length;$++)p[$]=""}}}}return zc(F)}catch{return h}}var Aa={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},xd={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Vd;function Wc(){}d(Wc,Pd),Wc.prototype.g=function(){return new XMLHttpRequest},Vd=new Wc;function qi(c){return encodeURIComponent(String(c))}function hD(c){var h=1;c=c.split(":");const f=[];for(;h>0&&c.length;)f.push(c.shift()),h--;return c.length&&f.push(c.join(":")),f}function qn(c,h,f,p){this.j=c,this.i=h,this.l=f,this.S=p||1,this.V=new Vi(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Md}function Md(){this.i=null,this.g="",this.h=!1}var Gd={},Yc={};function Xc(c,h,f){c.M=1,c.A=ba(Xt(h)),c.u=f,c.R=!0,Ud(c,null)}function Ud(c,h){c.F=Date.now(),Ra(c),c.B=Xt(c.A);var f=c.B,p=c.S;Array.isArray(p)||(p=[String(p)]),ef(f.i,"t",p),c.C=0,f=c.j.L,c.h=new Md,c.g=_f(c.j,f?h:null,!c.u),c.P>0&&(c.O=new iD(l(c.Y,c,c.g),c.P)),h=c.V,f=c.g,p=c.ba;var S="readystatechange";Array.isArray(S)||(S&&(vd[0]=S.toString()),S=vd);for(let F=0;F<S.length;F++){const $=yd(f,S[F],p||h.handleEvent,!1,h.h||h);if(!$)break;h.g[$.key]=$}h=c.J?Id(c.J):{},c.u?(c.v||(c.v="POST"),h["Content-Type"]="application/x-www-form-urlencoded",c.g.ea(c.B,c.v,c.u,h)):(c.v="GET",c.g.ea(c.B,c.v,null,h)),Gi(),uD(c.i,c.v,c.B,c.l,c.S,c.u)}qn.prototype.ba=function(c){c=c.target;const h=this.O;h&&Jn(c)==3?h.j():this.Y(c)},qn.prototype.Y=function(c){try{if(c==this.g)e:{const le=Jn(this.g),Ke=this.g.ya(),we=this.g.ca();if(!(le<3)&&(le!=3||this.g&&(this.h.h||this.g.la()||uf(this.g)))){this.K||le!=4||Ke==7||(Ke==8||we<=0?Gi(3):Gi(2)),Zc(this);var h=this.g.ca();this.X=h;var f=dD(this);if(this.o=h==200,cD(this.i,this.v,this.B,this.l,this.S,le,h),this.o){if(this.U&&!this.L){t:{if(this.g){var p,S=this.g;if((p=S.g?S.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!I(p)){var F=p;break t}}F=null}if(c=F)Fs(this.i,this.l,c,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,el(this,c);else{this.o=!1,this.m=3,ft(12),Lr(this),ji(this);break e}}if(this.R){c=!0;let We;for(;!this.K&&this.C<f.length;)if(We=fD(this,f),We==Yc){le==4&&(this.m=4,ft(14),c=!1),Fs(this.i,this.l,null,"[Incomplete Response]");break}else if(We==Gd){this.m=4,ft(15),Fs(this.i,this.l,f,"[Invalid Chunk]"),c=!1;break}else Fs(this.i,this.l,We,null),el(this,We);if(Hd(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),le!=4||f.length!=0||this.h.h||(this.m=1,ft(16),c=!1),this.o=this.o&&c,!c)Fs(this.i,this.l,f,"[Invalid Chunked Response]"),Lr(this),ji(this);else if(f.length>0&&!this.W){this.W=!0;var $=this.j;$.g==this&&$.aa&&!$.P&&($.j.info("Great, no buffering proxy detected. Bytes received: "+f.length),ul($),$.P=!0,ft(11))}}else Fs(this.i,this.l,f,null),el(this,f);le==4&&Lr(this),this.o&&!this.K&&(le==4?Cf(this.j,this):(this.o=!1,Ra(this)))}else bD(this.g),h==400&&f.indexOf("Unknown SID")>0?(this.m=3,ft(12)):(this.m=0,ft(13)),Lr(this),ji(this)}}}catch{}finally{}};function dD(c){if(!Hd(c))return c.g.la();const h=uf(c.g);if(h==="")return"";let f="";const p=h.length,S=Jn(c.g)==4;if(!c.h.i){if(typeof TextDecoder>"u")return Lr(c),ji(c),"";c.h.i=new o.TextDecoder}for(let F=0;F<p;F++)c.h.h=!0,f+=c.h.i.decode(h[F],{stream:!(S&&F==p-1)});return h.length=0,c.h.g+=f,c.C=0,c.h.g}function Hd(c){return c.g?c.v=="GET"&&c.M!=2&&c.j.Aa:!1}function fD(c,h){var f=c.C,p=h.indexOf(`
`,f);return p==-1?Yc:(f=Number(h.substring(f,p)),isNaN(f)?Gd:(p+=1,p+f>h.length?Yc:(h=h.slice(p,p+f),c.C=p+f,h)))}qn.prototype.cancel=function(){this.K=!0,Lr(this)};function Ra(c){c.T=Date.now()+c.H,qd(c,c.H)}function qd(c,h){if(c.D!=null)throw Error("WatchDog timer not null");c.D=Ui(l(c.aa,c),h)}function Zc(c){c.D&&(o.clearTimeout(c.D),c.D=null)}qn.prototype.aa=function(){this.D=null;const c=Date.now();c-this.T>=0?(lD(this.i,this.B),this.M!=2&&(Gi(),ft(17)),Lr(this),this.m=2,ji(this)):qd(this,this.T-c)};function ji(c){c.j.I==0||c.K||Cf(c.j,c)}function Lr(c){Zc(c);var h=c.O;h&&typeof h.dispose=="function"&&h.dispose(),c.O=null,Sd(c.V),c.g&&(h=c.g,c.g=null,h.abort(),h.dispose())}function el(c,h){try{var f=c.j;if(f.I!=0&&(f.g==c||tl(f.h,c))){if(!c.L&&tl(f.h,c)&&f.I==3){try{var p=f.Ba.g.parse(h)}catch{p=null}if(Array.isArray(p)&&p.length==3){var S=p;if(S[0]==0){e:if(!f.v){if(f.g)if(f.g.F+3e3<c.F)Oa(f),Pa(f);else break e;al(f),ft(18)}}else f.xa=S[1],0<f.xa-f.K&&S[2]<37500&&f.F&&f.A==0&&!f.C&&(f.C=Ui(l(f.Va,f),6e3));Jd(f.h)<=1&&f.ta&&(f.ta=void 0)}else Vr(f,11)}else if((c.L||f.g==c)&&Oa(f),!I(h))for(S=f.Ba.g.parse(h),h=0;h<S.length;h++){let we=S[h];const We=we[0];if(!(We<=f.K))if(f.K=We,we=we[1],f.I==2)if(we[0]=="c"){f.M=we[1],f.ba=we[2];const Zt=we[3];Zt!=null&&(f.ka=Zt,f.j.info("VER="+f.ka));const Mr=we[4];Mr!=null&&(f.za=Mr,f.j.info("SVER="+f.za));const zn=we[5];zn!=null&&typeof zn=="number"&&zn>0&&(p=1.5*zn,f.O=p,f.j.info("backChannelRequestTimeoutMs_="+p)),p=f;const $n=c.g;if($n){const ka=$n.g?$n.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(ka){var F=p.h;F.g||ka.indexOf("spdy")==-1&&ka.indexOf("quic")==-1&&ka.indexOf("h2")==-1||(F.j=F.l,F.g=new Set,F.h&&(nl(F,F.h),F.h=null))}if(p.G){const cl=$n.g?$n.g.getResponseHeader("X-HTTP-Session-Id"):null;cl&&(p.wa=cl,ve(p.J,p.G,cl))}}f.I=3,f.l&&f.l.ra(),f.aa&&(f.T=Date.now()-c.F,f.j.info("Handshake RTT: "+f.T+"ms")),p=f;var $=c;if(p.na=mf(p,p.L?p.ba:null,p.W),$.L){zd(p.h,$);var le=$,Ke=p.O;Ke&&(le.H=Ke),le.D&&(Zc(le),Ra(le)),p.g=$}else df(p);f.i.length>0&&Na(f)}else we[0]!="stop"&&we[0]!="close"||Vr(f,7);else f.I==3&&(we[0]=="stop"||we[0]=="close"?we[0]=="stop"?Vr(f,7):ol(f):we[0]!="noop"&&f.l&&f.l.qa(we),f.A=0)}}Gi(4)}catch{}}var CD=class{constructor(c,h){this.g=c,this.map=h}};function jd(c){this.l=c||10,o.PerformanceNavigationTiming?(c=o.performance.getEntriesByType("navigation"),c=c.length>0&&(c[0].nextHopProtocol=="hq"||c[0].nextHopProtocol=="h2")):c=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=c?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Kd(c){return c.h?!0:c.g?c.g.size>=c.j:!1}function Jd(c){return c.h?1:c.g?c.g.size:0}function tl(c,h){return c.h?c.h==h:c.g?c.g.has(h):!1}function nl(c,h){c.g?c.g.add(h):c.h=h}function zd(c,h){c.h&&c.h==h?c.h=null:c.g&&c.g.has(h)&&c.g.delete(h)}jd.prototype.cancel=function(){if(this.i=$d(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const c of this.g.values())c.cancel();this.g.clear()}};function $d(c){if(c.h!=null)return c.i.concat(c.h.G);if(c.g!=null&&c.g.size!==0){let h=c.i;for(const f of c.g.values())h=h.concat(f.G);return h}return g(c.i)}var Qd=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function pD(c,h){if(c){c=c.split("&");for(let f=0;f<c.length;f++){const p=c[f].indexOf("=");let S,F=null;p>=0?(S=c[f].substring(0,p),F=c[f].substring(p+1)):S=c[f],h(S,F?decodeURIComponent(F.replace(/\+/g," ")):"")}}}function jn(c){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let h;c instanceof jn?(this.l=c.l,Ki(this,c.j),this.o=c.o,this.g=c.g,Ji(this,c.u),this.h=c.h,rl(this,tf(c.i)),this.m=c.m):c&&(h=String(c).match(Qd))?(this.l=!1,Ki(this,h[1]||"",!0),this.o=zi(h[2]||""),this.g=zi(h[3]||"",!0),Ji(this,h[4]),this.h=zi(h[5]||"",!0),rl(this,h[6]||"",!0),this.m=zi(h[7]||"")):(this.l=!1,this.i=new Qi(null,this.l))}jn.prototype.toString=function(){const c=[];var h=this.j;h&&c.push($i(h,Wd,!0),":");var f=this.g;return(f||h=="file")&&(c.push("//"),(h=this.o)&&c.push($i(h,Wd,!0),"@"),c.push(qi(f).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),f=this.u,f!=null&&c.push(":",String(f))),(f=this.h)&&(this.g&&f.charAt(0)!="/"&&c.push("/"),c.push($i(f,f.charAt(0)=="/"?_D:mD,!0))),(f=this.i.toString())&&c.push("?",f),(f=this.m)&&c.push("#",$i(f,ID)),c.join("")},jn.prototype.resolve=function(c){const h=Xt(this);let f=!!c.j;f?Ki(h,c.j):f=!!c.o,f?h.o=c.o:f=!!c.g,f?h.g=c.g:f=c.u!=null;var p=c.h;if(f)Ji(h,c.u);else if(f=!!c.h){if(p.charAt(0)!="/")if(this.g&&!this.h)p="/"+p;else{var S=h.h.lastIndexOf("/");S!=-1&&(p=h.h.slice(0,S+1)+p)}if(S=p,S==".."||S==".")p="";else if(S.indexOf("./")!=-1||S.indexOf("/.")!=-1){p=S.lastIndexOf("/",0)==0,S=S.split("/");const F=[];for(let $=0;$<S.length;){const le=S[$++];le=="."?p&&$==S.length&&F.push(""):le==".."?((F.length>1||F.length==1&&F[0]!="")&&F.pop(),p&&$==S.length&&F.push("")):(F.push(le),p=!0)}p=F.join("/")}else p=S}return f?h.h=p:f=c.i.toString()!=="",f?rl(h,tf(c.i)):f=!!c.m,f&&(h.m=c.m),h};function Xt(c){return new jn(c)}function Ki(c,h,f){c.j=f?zi(h,!0):h,c.j&&(c.j=c.j.replace(/:$/,""))}function Ji(c,h){if(h){if(h=Number(h),isNaN(h)||h<0)throw Error("Bad port number "+h);c.u=h}else c.u=null}function rl(c,h,f){h instanceof Qi?(c.i=h,DD(c.i,c.l)):(f||(h=$i(h,ED)),c.i=new Qi(h,c.l))}function ve(c,h,f){c.i.set(h,f)}function ba(c){return ve(c,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),c}function zi(c,h){return c?h?decodeURI(c.replace(/%25/g,"%2525")):decodeURIComponent(c):""}function $i(c,h,f){return typeof c=="string"?(c=encodeURI(c).replace(h,gD),f&&(c=c.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c):null}function gD(c){return c=c.charCodeAt(0),"%"+(c>>4&15).toString(16)+(c&15).toString(16)}var Wd=/[#\/\?@]/g,mD=/[#\?:]/g,_D=/[#\?]/g,ED=/[#\?@]/g,ID=/#/g;function Qi(c,h){this.h=this.g=null,this.i=c||null,this.j=!!h}function xr(c){c.g||(c.g=new Map,c.h=0,c.i&&pD(c.i,function(h,f){c.add(decodeURIComponent(h.replace(/\+/g," ")),f)}))}r=Qi.prototype,r.add=function(c,h){xr(this),this.i=null,c=ks(this,c);let f=this.g.get(c);return f||this.g.set(c,f=[]),f.push(h),this.h+=1,this};function Yd(c,h){xr(c),h=ks(c,h),c.g.has(h)&&(c.i=null,c.h-=c.g.get(h).length,c.g.delete(h))}function Xd(c,h){return xr(c),h=ks(c,h),c.g.has(h)}r.forEach=function(c,h){xr(this),this.g.forEach(function(f,p){f.forEach(function(S){c.call(h,S,p,this)},this)},this)};function Zd(c,h){xr(c);let f=[];if(typeof h=="string")Xd(c,h)&&(f=f.concat(c.g.get(ks(c,h))));else for(c=Array.from(c.g.values()),h=0;h<c.length;h++)f=f.concat(c[h]);return f}r.set=function(c,h){return xr(this),this.i=null,c=ks(this,c),Xd(this,c)&&(this.h-=this.g.get(c).length),this.g.set(c,[h]),this.h+=1,this},r.get=function(c,h){return c?(c=Zd(this,c),c.length>0?String(c[0]):h):h};function ef(c,h,f){Yd(c,h),f.length>0&&(c.i=null,c.g.set(ks(c,h),g(f)),c.h+=f.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const c=[],h=Array.from(this.g.keys());for(let p=0;p<h.length;p++){var f=h[p];const S=qi(f);f=Zd(this,f);for(let F=0;F<f.length;F++){let $=S;f[F]!==""&&($+="="+qi(f[F])),c.push($)}}return this.i=c.join("&")};function tf(c){const h=new Qi;return h.i=c.i,c.g&&(h.g=new Map(c.g),h.h=c.h),h}function ks(c,h){return h=String(h),c.j&&(h=h.toLowerCase()),h}function DD(c,h){h&&!c.j&&(xr(c),c.i=null,c.g.forEach(function(f,p){const S=p.toLowerCase();p!=S&&(Yd(this,p),ef(this,S,f))},c)),c.j=h}function wD(c,h){const f=new Hi;if(o.Image){const p=new Image;p.onload=B(Kn,f,"TestLoadImage: loaded",!0,h,p),p.onerror=B(Kn,f,"TestLoadImage: error",!1,h,p),p.onabort=B(Kn,f,"TestLoadImage: abort",!1,h,p),p.ontimeout=B(Kn,f,"TestLoadImage: timeout",!1,h,p),o.setTimeout(function(){p.ontimeout&&p.ontimeout()},1e4),p.src=c}else h(!1)}function yD(c,h){const f=new Hi,p=new AbortController,S=setTimeout(()=>{p.abort(),Kn(f,"TestPingServer: timeout",!1,h)},1e4);fetch(c,{signal:p.signal}).then(F=>{clearTimeout(S),F.ok?Kn(f,"TestPingServer: ok",!0,h):Kn(f,"TestPingServer: server error",!1,h)}).catch(()=>{clearTimeout(S),Kn(f,"TestPingServer: error",!1,h)})}function Kn(c,h,f,p,S){try{S&&(S.onload=null,S.onerror=null,S.onabort=null,S.ontimeout=null),p(f)}catch{}}function TD(){this.g=new aD}function sl(c){this.i=c.Sb||null,this.h=c.ab||!1}d(sl,Pd),sl.prototype.g=function(){return new va(this.i,this.h)};function va(c,h){st.call(this),this.H=c,this.o=h,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}d(va,st),r=va.prototype,r.open=function(c,h){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=c,this.D=h,this.readyState=1,Yi(this)},r.send=function(c){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const h={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};c&&(h.body=c),(this.H||o).fetch(new Request(this.D,h)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Wi(this)),this.readyState=0},r.Pa=function(c){if(this.g&&(this.l=c,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=c.headers,this.readyState=2,Yi(this)),this.g&&(this.readyState=3,Yi(this),this.g)))if(this.responseType==="arraybuffer")c.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in c){if(this.j=c.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;nf(this)}else c.text().then(this.Oa.bind(this),this.ga.bind(this))};function nf(c){c.j.read().then(c.Ma.bind(c)).catch(c.ga.bind(c))}r.Ma=function(c){if(this.g){if(this.o&&c.value)this.response.push(c.value);else if(!this.o){var h=c.value?c.value:new Uint8Array(0);(h=this.B.decode(h,{stream:!c.done}))&&(this.response=this.responseText+=h)}c.done?Wi(this):Yi(this),this.readyState==3&&nf(this)}},r.Oa=function(c){this.g&&(this.response=this.responseText=c,Wi(this))},r.Na=function(c){this.g&&(this.response=c,Wi(this))},r.ga=function(){this.g&&Wi(this)};function Wi(c){c.readyState=4,c.l=null,c.j=null,c.B=null,Yi(c)}r.setRequestHeader=function(c,h){this.A.append(c,h)},r.getResponseHeader=function(c){return this.h&&this.h.get(c.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const c=[],h=this.h.entries();for(var f=h.next();!f.done;)f=f.value,c.push(f[0]+": "+f[1]),f=h.next();return c.join(`\r
`)};function Yi(c){c.onreadystatechange&&c.onreadystatechange.call(c)}Object.defineProperty(va.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(c){this.m=c?"include":"same-origin"}});function rf(c){let h="";return Da(c,function(f,p){h+=p,h+=":",h+=f,h+=`\r
`}),h}function il(c,h,f){e:{for(p in f){var p=!1;break e}p=!0}p||(f=rf(f),typeof c=="string"?f!=null&&qi(f):ve(c,h,f))}function Ve(c){st.call(this),this.headers=new Map,this.L=c||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}d(Ve,st);var AD=/^https?$/i,RD=["POST","PUT"];r=Ve.prototype,r.Fa=function(c){this.H=c},r.ea=function(c,h,f,p){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+c);h=h?h.toUpperCase():"GET",this.D=c,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Vd.g(),this.g.onreadystatechange=C(l(this.Ca,this));try{this.B=!0,this.g.open(h,String(c),!0),this.B=!1}catch(F){sf(this,F);return}if(c=f||"",f=new Map(this.headers),p)if(Object.getPrototypeOf(p)===Object.prototype)for(var S in p)f.set(S,p[S]);else if(typeof p.keys=="function"&&typeof p.get=="function")for(const F of p.keys())f.set(F,p.get(F));else throw Error("Unknown input type for opt_headers: "+String(p));p=Array.from(f.keys()).find(F=>F.toLowerCase()=="content-type"),S=o.FormData&&c instanceof o.FormData,!(Array.prototype.indexOf.call(RD,h,void 0)>=0)||p||S||f.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[F,$]of f)this.g.setRequestHeader(F,$);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(c),this.v=!1}catch(F){sf(this,F)}};function sf(c,h){c.h=!1,c.g&&(c.j=!0,c.g.abort(),c.j=!1),c.l=h,c.o=5,of(c),Sa(c)}function of(c){c.A||(c.A=!0,dt(c,"complete"),dt(c,"error"))}r.abort=function(c){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=c||7,dt(this,"complete"),dt(this,"abort"),Sa(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Sa(this,!0)),Ve.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?af(this):this.Xa())},r.Xa=function(){af(this)};function af(c){if(c.h&&typeof i<"u"){if(c.v&&Jn(c)==4)setTimeout(c.Ca.bind(c),0);else if(dt(c,"readystatechange"),Jn(c)==4){c.h=!1;try{const F=c.ca();e:switch(F){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var h=!0;break e;default:h=!1}var f;if(!(f=h)){var p;if(p=F===0){let $=String(c.D).match(Qd)[1]||null;!$&&o.self&&o.self.location&&($=o.self.location.protocol.slice(0,-1)),p=!AD.test($?$.toLowerCase():"")}f=p}if(f)dt(c,"complete"),dt(c,"success");else{c.o=6;try{var S=Jn(c)>2?c.g.statusText:""}catch{S=""}c.l=S+" ["+c.ca()+"]",of(c)}}finally{Sa(c)}}}}function Sa(c,h){if(c.g){c.m&&(clearTimeout(c.m),c.m=null);const f=c.g;c.g=null,h||dt(c,"ready");try{f.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function Jn(c){return c.g?c.g.readyState:0}r.ca=function(){try{return Jn(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(c){if(this.g){var h=this.g.responseText;return c&&h.indexOf(c)==0&&(h=h.substring(c.length)),oD(h)}};function uf(c){try{if(!c.g)return null;if("response"in c.g)return c.g.response;switch(c.F){case"":case"text":return c.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in c.g)return c.g.mozResponseArrayBuffer}return null}catch{return null}}function bD(c){const h={};c=(c.g&&Jn(c)>=2&&c.g.getAllResponseHeaders()||"").split(`\r
`);for(let p=0;p<c.length;p++){if(I(c[p]))continue;var f=hD(c[p]);const S=f[0];if(f=f[1],typeof f!="string")continue;f=f.trim();const F=h[S]||[];h[S]=F,F.push(f)}eD(h,function(p){return p.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Xi(c,h,f){return f&&f.internalChannelParams&&f.internalChannelParams[c]||h}function cf(c){this.za=0,this.i=[],this.j=new Hi,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Xi("failFast",!1,c),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Xi("baseRetryDelayMs",5e3,c),this.Za=Xi("retryDelaySeedMs",1e4,c),this.Ta=Xi("forwardChannelMaxRetries",2,c),this.va=Xi("forwardChannelRequestTimeoutMs",2e4,c),this.ma=c&&c.xmlHttpFactory||void 0,this.Ua=c&&c.Rb||void 0,this.Aa=c&&c.useFetchStreams||!1,this.O=void 0,this.L=c&&c.supportsCrossDomainXhr||!1,this.M="",this.h=new jd(c&&c.concurrentRequestLimit),this.Ba=new TD,this.S=c&&c.fastHandshake||!1,this.R=c&&c.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=c&&c.Pb||!1,c&&c.ua&&this.j.ua(),c&&c.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&c&&c.detectBufferingProxy||!1,this.ia=void 0,c&&c.longPollingTimeout&&c.longPollingTimeout>0&&(this.ia=c.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=cf.prototype,r.ka=8,r.I=1,r.connect=function(c,h,f,p){ft(0),this.W=c,this.H=h||{},f&&p!==void 0&&(this.H.OSID=f,this.H.OAID=p),this.F=this.X,this.J=mf(this,null,this.W),Na(this)};function ol(c){if(lf(c),c.I==3){var h=c.V++,f=Xt(c.J);if(ve(f,"SID",c.M),ve(f,"RID",h),ve(f,"TYPE","terminate"),Zi(c,f),h=new qn(c,c.j,h),h.M=2,h.A=ba(Xt(f)),f=!1,o.navigator&&o.navigator.sendBeacon)try{f=o.navigator.sendBeacon(h.A.toString(),"")}catch{}!f&&o.Image&&(new Image().src=h.A,f=!0),f||(h.g=_f(h.j,null),h.g.ea(h.A)),h.F=Date.now(),Ra(h)}gf(c)}function Pa(c){c.g&&(ul(c),c.g.cancel(),c.g=null)}function lf(c){Pa(c),c.v&&(o.clearTimeout(c.v),c.v=null),Oa(c),c.h.cancel(),c.m&&(typeof c.m=="number"&&o.clearTimeout(c.m),c.m=null)}function Na(c){if(!Kd(c.h)&&!c.m){c.m=!0;var h=c.Ea;ue||E(),ae||(ue(),ae=!0),y.add(h,c),c.D=0}}function vD(c,h){return Jd(c.h)>=c.h.j-(c.m?1:0)?!1:c.m?(c.i=h.G.concat(c.i),!0):c.I==1||c.I==2||c.D>=(c.Sa?0:c.Ta)?!1:(c.m=Ui(l(c.Ea,c,h),pf(c,c.D)),c.D++,!0)}r.Ea=function(c){if(this.m)if(this.m=null,this.I==1){if(!c){this.V=Math.floor(Math.random()*1e5),c=this.V++;const S=new qn(this,this.j,c);let F=this.o;if(this.U&&(F?(F=Id(F),wd(F,this.U)):F=this.U),this.u!==null||this.R||(S.J=F,F=null),this.S)e:{for(var h=0,f=0;f<this.i.length;f++){t:{var p=this.i[f];if("__data__"in p.map&&(p=p.map.__data__,typeof p=="string")){p=p.length;break t}p=void 0}if(p===void 0)break;if(h+=p,h>4096){h=f;break e}if(h===4096||f===this.i.length-1){h=f+1;break e}}h=1e3}else h=1e3;h=hf(this,S,h),f=Xt(this.J),ve(f,"RID",c),ve(f,"CVER",22),this.G&&ve(f,"X-HTTP-Session-Id",this.G),Zi(this,f),F&&(this.R?h="headers="+qi(rf(F))+"&"+h:this.u&&il(f,this.u,F)),nl(this.h,S),this.Ra&&ve(f,"TYPE","init"),this.S?(ve(f,"$req",h),ve(f,"SID","null"),S.U=!0,Xc(S,f,null)):Xc(S,f,h),this.I=2}}else this.I==3&&(c?Bf(this,c):this.i.length==0||Kd(this.h)||Bf(this))};function Bf(c,h){var f;h?f=h.l:f=c.V++;const p=Xt(c.J);ve(p,"SID",c.M),ve(p,"RID",f),ve(p,"AID",c.K),Zi(c,p),c.u&&c.o&&il(p,c.u,c.o),f=new qn(c,c.j,f,c.D+1),c.u===null&&(f.J=c.o),h&&(c.i=h.G.concat(c.i)),h=hf(c,f,1e3),f.H=Math.round(c.va*.5)+Math.round(c.va*.5*Math.random()),nl(c.h,f),Xc(f,p,h)}function Zi(c,h){c.H&&Da(c.H,function(f,p){ve(h,p,f)}),c.l&&Da({},function(f,p){ve(h,p,f)})}function hf(c,h,f){f=Math.min(c.i.length,f);const p=c.l?l(c.l.Ka,c.l,c):null;e:{var S=c.i;let le=-1;for(;;){const Ke=["count="+f];le==-1?f>0?(le=S[0].g,Ke.push("ofs="+le)):le=0:Ke.push("ofs="+le);let we=!0;for(let We=0;We<f;We++){var F=S[We].g;const Zt=S[We].map;if(F-=le,F<0)le=Math.max(0,S[We].g-100),we=!1;else try{F="req"+F+"_"||"";try{var $=Zt instanceof Map?Zt:Object.entries(Zt);for(const[Mr,zn]of $){let $n=zn;a(zn)&&($n=zc(zn)),Ke.push(F+Mr+"="+encodeURIComponent($n))}}catch(Mr){throw Ke.push(F+"type="+encodeURIComponent("_badmap")),Mr}}catch{p&&p(Zt)}}if(we){$=Ke.join("&");break e}}$=void 0}return c=c.i.splice(0,f),h.G=c,$}function df(c){if(!c.g&&!c.v){c.Y=1;var h=c.Da;ue||E(),ae||(ue(),ae=!0),y.add(h,c),c.A=0}}function al(c){return c.g||c.v||c.A>=3?!1:(c.Y++,c.v=Ui(l(c.Da,c),pf(c,c.A)),c.A++,!0)}r.Da=function(){if(this.v=null,ff(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var c=4*this.T;this.j.info("BP detection timer enabled: "+c),this.B=Ui(l(this.Wa,this),c)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,ft(10),Pa(this),ff(this))};function ul(c){c.B!=null&&(o.clearTimeout(c.B),c.B=null)}function ff(c){c.g=new qn(c,c.j,"rpc",c.Y),c.u===null&&(c.g.J=c.o),c.g.P=0;var h=Xt(c.na);ve(h,"RID","rpc"),ve(h,"SID",c.M),ve(h,"AID",c.K),ve(h,"CI",c.F?"0":"1"),!c.F&&c.ia&&ve(h,"TO",c.ia),ve(h,"TYPE","xmlhttp"),Zi(c,h),c.u&&c.o&&il(h,c.u,c.o),c.O&&(c.g.H=c.O);var f=c.g;c=c.ba,f.M=1,f.A=ba(Xt(h)),f.u=null,f.R=!0,Ud(f,c)}r.Va=function(){this.C!=null&&(this.C=null,Pa(this),al(this),ft(19))};function Oa(c){c.C!=null&&(o.clearTimeout(c.C),c.C=null)}function Cf(c,h){var f=null;if(c.g==h){Oa(c),ul(c),c.g=null;var p=2}else if(tl(c.h,h))f=h.G,zd(c.h,h),p=1;else return;if(c.I!=0){if(h.o)if(p==1){f=h.u?h.u.length:0,h=Date.now()-h.F;var S=c.D;p=Ta(),dt(p,new Ld(p,f)),Na(c)}else df(c);else if(S=h.m,S==3||S==0&&h.X>0||!(p==1&&vD(c,h)||p==2&&al(c)))switch(f&&f.length>0&&(h=c.h,h.i=h.i.concat(f)),S){case 1:Vr(c,5);break;case 4:Vr(c,10);break;case 3:Vr(c,6);break;default:Vr(c,2)}}}function pf(c,h){let f=c.Qa+Math.floor(Math.random()*c.Za);return c.isActive()||(f*=2),f*h}function Vr(c,h){if(c.j.info("Error code "+h),h==2){var f=l(c.bb,c),p=c.Ua;const S=!p;p=new jn(p||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||Ki(p,"https"),ba(p),S?wD(p.toString(),f):yD(p.toString(),f)}else ft(2);c.I=0,c.l&&c.l.pa(h),gf(c),lf(c)}r.bb=function(c){c?(this.j.info("Successfully pinged google.com"),ft(2)):(this.j.info("Failed to ping google.com"),ft(1))};function gf(c){if(c.I=0,c.ja=[],c.l){const h=$d(c.h);(h.length!=0||c.i.length!=0)&&(D(c.ja,h),D(c.ja,c.i),c.h.i.length=0,g(c.i),c.i.length=0),c.l.oa()}}function mf(c,h,f){var p=f instanceof jn?Xt(f):new jn(f);if(p.g!="")h&&(p.g=h+"."+p.g),Ji(p,p.u);else{var S=o.location;p=S.protocol,h=h?h+"."+S.hostname:S.hostname,S=+S.port;const F=new jn(null);p&&Ki(F,p),h&&(F.g=h),S&&Ji(F,S),f&&(F.h=f),p=F}return f=c.G,h=c.wa,f&&h&&ve(p,f,h),ve(p,"VER",c.ka),Zi(c,p),p}function _f(c,h,f){if(h&&!c.L)throw Error("Can't create secondary domain capable XhrIo object.");return h=c.Aa&&!c.ma?new Ve(new sl({ab:f})):new Ve(c.ma),h.Fa(c.L),h}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function Ef(){}r=Ef.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Fa(){}Fa.prototype.g=function(c,h){return new bt(c,h)};function bt(c,h){st.call(this),this.g=new cf(h),this.l=c,this.h=h&&h.messageUrlParams||null,c=h&&h.messageHeaders||null,h&&h.clientProtocolHeaderRequired&&(c?c["X-Client-Protocol"]="webchannel":c={"X-Client-Protocol":"webchannel"}),this.g.o=c,c=h&&h.initMessageHeaders||null,h&&h.messageContentType&&(c?c["X-WebChannel-Content-Type"]=h.messageContentType:c={"X-WebChannel-Content-Type":h.messageContentType}),h&&h.sa&&(c?c["X-WebChannel-Client-Profile"]=h.sa:c={"X-WebChannel-Client-Profile":h.sa}),this.g.U=c,(c=h&&h.Qb)&&!I(c)&&(this.g.u=c),this.A=h&&h.supportsCrossDomainXhr||!1,this.v=h&&h.sendRawJson||!1,(h=h&&h.httpSessionIdParam)&&!I(h)&&(this.g.G=h,c=this.h,c!==null&&h in c&&(c=this.h,h in c&&delete c[h])),this.j=new Ls(this)}d(bt,st),bt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},bt.prototype.close=function(){ol(this.g)},bt.prototype.o=function(c){var h=this.g;if(typeof c=="string"){var f={};f.__data__=c,c=f}else this.v&&(f={},f.__data__=zc(c),c=f);h.i.push(new CD(h.Ya++,c)),h.I==3&&Na(h)},bt.prototype.N=function(){this.g.l=null,delete this.j,ol(this.g),delete this.g,bt.Z.N.call(this)};function If(c){$c.call(this),c.__headers__&&(this.headers=c.__headers__,this.statusCode=c.__status__,delete c.__headers__,delete c.__status__);var h=c.__sm__;if(h){e:{for(const f in h){c=f;break e}c=void 0}(this.i=c)&&(c=this.i,h=h!==null&&c in h?h[c]:void 0),this.data=h}else this.data=c}d(If,$c);function Df(){Qc.call(this),this.status=1}d(Df,Qc);function Ls(c){this.g=c}d(Ls,Ef),Ls.prototype.ra=function(){dt(this.g,"a")},Ls.prototype.qa=function(c){dt(this.g,new If(c))},Ls.prototype.pa=function(c){dt(this.g,new Df)},Ls.prototype.oa=function(){dt(this.g,"b")},Fa.prototype.createWebChannel=Fa.prototype.g,bt.prototype.send=bt.prototype.o,bt.prototype.open=bt.prototype.m,bt.prototype.close=bt.prototype.close,Lg=function(){return new Fa},kg=function(){return Ta()},Fg=kr,ql={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Aa.NO_ERROR=0,Aa.TIMEOUT=8,Aa.HTTP_ERROR=6,eu=Aa,xd.COMPLETE="complete",Og=xd,Nd.EventType=Mi,Mi.OPEN="a",Mi.CLOSE="b",Mi.ERROR="c",Mi.MESSAGE="d",st.prototype.listen=st.prototype.J,co=Nd,Ve.prototype.listenOnce=Ve.prototype.K,Ve.prototype.getLastError=Ve.prototype.Ha,Ve.prototype.getLastErrorCode=Ve.prototype.ya,Ve.prototype.getStatus=Ve.prototype.ca,Ve.prototype.getResponseJson=Ve.prototype.La,Ve.prototype.getResponseText=Ve.prototype.la,Ve.prototype.send=Ve.prototype.ea,Ve.prototype.setWithCredentials=Ve.prototype.Fa,Ng=Ve}).apply(typeof La<"u"?La:typeof self<"u"?self:typeof window<"u"?window:{});/*!
* re2js
* RE2JS is the JavaScript port of RE2, a regular expression engine that provides linear time matching
*
* @version v2.8.6
* @author Oleksii Vasyliev
* @homepage https://github.com/le0pard/re2js#readme
* @repository github:le0pard/re2js
* @license MIT
*/var ye,M=(ye=class{},q(ye,"FOLD_CASE",1),q(ye,"LITERAL",2),q(ye,"CLASS_NL",4),q(ye,"DOT_NL",8),q(ye,"ONE_LINE",16),q(ye,"NON_GREEDY",32),q(ye,"PERL_X",64),q(ye,"UNICODE_GROUPS",128),q(ye,"WAS_DOLLAR",256),q(ye,"LOOKBEHIND",512),q(ye,"MATCH_NL",ye.CLASS_NL|ye.DOT_NL),q(ye,"PERL",ye.CLASS_NL|ye.ONE_LINE|ye.PERL_X|ye.UNICODE_GROUPS),q(ye,"POSIX",0),q(ye,"UNANCHORED",0),q(ye,"ANCHOR_START",1),q(ye,"ANCHOR_BOTH",2),ye);const xs={CASE_INSENSITIVE:1,DOTALL:2,MULTILINE:4,DISABLE_UNICODE_GROUPS:8,LONGEST_MATCH:16,LOOKBEHINDS:512},Po=128,jl=new Int32Array(Po),Kl=new Int32Array(Po),xa=65535;for(let r=0;r<Po;r++)r>=97&&r<=122?jl[r]=r-32:jl[r]=r,r>=65&&r<=90?Kl[r]=r+32:Kl[r]=r;var xl,k=(xl=class{static toUpperCase(r){if(r<Po)return jl[r];const e=String.fromCodePoint(r).toUpperCase(),t=e.codePointAt(0)>xa?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toLowerCase(),s=n.codePointAt(0)>xa?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}static toLowerCase(r){if(r<Po)return Kl[r];const e=String.fromCodePoint(r).toLowerCase(),t=e.codePointAt(0)>xa?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toUpperCase(),s=n.codePointAt(0)>xa?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}},q(xl,"CODES",new Map([["\x07",7],["\b",8],["	",9],[`
`,10],["\v",11],["\f",12],["\r",13],[" ",32],['"',34],["$",36],["&",38],["'",39],["(",40],[")",41],["*",42],["+",43],["-",45],[".",46],["0",48],["1",49],["2",50],["3",51],["4",52],["5",53],["6",54],["7",55],["8",56],["9",57],[":",58],["<",60],[">",62],["?",63],["A",65],["B",66],["C",67],["F",70],["P",80],["Q",81],["U",85],["Z",90],["[",91],["\\",92],["]",93],["^",94],["_",95],["`",96],["a",97],["b",98],["f",102],["i",105],["m",109],["n",110],["r",114],["s",115],["t",116],["v",118],["x",120],["z",122],["{",123],["|",124],["}",125]])),xl),m=class{constructor(r,e=!1){this.data=r,this.isStride1=e,this.SIZE=e?2:3}getLo(r){return this.data[r*this.SIZE]}getHi(r){return this.data[r*this.SIZE+1]}getStride(r){return this.isStride1?1:this.data[r*this.SIZE+2]}get length(){return this.data.length/this.SIZE}};const xg=new Uint8Array(256);for(let r=0,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";r<64;r++)xg[e.charCodeAt(r)]=r;const Vg=r=>{const e=[];let t=0,n=0;for(let s=0;s<r.length;s++){let i=xg[r.charCodeAt(s)];t|=(i&31)<<n,i&32?n+=5:(e.push(t),t=0,n=0)}return e},_=(r,e)=>{const t=Vg(r),n=e?t.length/2:t.length/3,s=new Uint32Array(n*3);let i=0,o=0;for(let a=0;a<n;a++)i+=t[o++],s[a*3]=i,i+=t[o++],s[a*3+1]=i,s[a*3+2]=e?1:t[o++];return s},ly=r=>{const e=Vg(r),t=new Map;let n=0;for(let s=0;s<e.length;s+=2){n+=e[s];const i=e[s+1],o=i>>>1^-(i&1);t.set(n,n+o)}return t};var Va=class{constructor(r){this.initializer=r,this.cache=new Map}has(r){return r in this.initializer}get(r){if(this.cache.has(r))return this.cache.get(r);const e=this.initializer[r],t=e?e():null;return this.cache.set(r,t),t}},tr,It=(tr=class{static get CASE_ORBIT(){return this._CASE_ORBIT||(this._CASE_ORBIT=ly("rCgCIgCY+rQI4QiCuuBLgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCCgCBgCBgCBgCBgCBgCBgCB+7OB-BB-BB-BB-BB-BBskQB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BC-BB-BB-BB-BB-BB-BB-BByHBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBxHBCBBBCBBBCBBB3SBmMBkNBCBBBCBBB8MBCBBB6MB6MBCBBC+EB0MB2MBCBBB6MB+MBiGBmNBiNBCBBBmKBikzCBmNBqNBkIBsNBCBBBCBBBCBBB0NBCBBB0NDCBBB0NBCBBByNByNBCBBBCBBB2NBCBBDCBBCwDFCBCBDBCBCBDBCBCBDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB9EBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBCBDBCBBBhGBvDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBjICCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBH2iVBCBBBlKBwiVB+jVB+jVBCBBBlMBqEBuEBCBBBCBBBCBBBCBBBCBBB+hVB4hVB8hVBjNB7MC5MB5MCzMC1MB+0yCE5MB20yCC9MBu2yCBwyyCBo0yCChNBlNBo0yCBu-UBi0yCDlNC6-UBpNDrNIu+UDzNCm0yCBzNE0yyCBzNBpEBxNBxNBtEG1NLqxyCBkxyCnFoFrBCBBBCBBDCBBEkIBkIBkICoHHsCCqCBqCBqCCgEC+DB+DBmkOBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCC+BBgCBgCBgCBgCBgCBgCBgCBgCBrCBpCBpCBpCBmjOB-BB8BB-BB-BBgEB-BB-BByBBqgOBsDB-BBtwBB-BB-BB-BBsBBgDBCB-BB-BB-BBeB-BB-BB61OB-BB-BB-DB9DB9DBQB7DBmCE9CBrDBPBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBrFB-EBOBnHB3FB-FCCBBBNBCBBCjIBjIBjIBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB8kMB-BB6kMB-BB-BB-BB-BB-BB-BB-BB-BB-BBokMB-BB-BBkkMBkkMB-BB-BB-BB-BB-BB-BB-BB4jMB-BB-BB-BB-BB-BB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EBCBBBCBoiMBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBJCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBeBCBBBCBBBCBBBCBBBCBBBCBBBCBBBdBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDL-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-C64CgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOCgmOGgmODg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FDg8FBg8FBg8FhVg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBQBQBQBQBQBQDPBPBPBPBPBPjkC7mMB5mMBnmMBjmMBCBlmMB3lMBpiMBk8kCBCBBG-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FD-7FB-7FB-7F6FoglCEsuHRwjlCyDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCB0DBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBG1DD97OCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPEQCQCQCQCPCPCPCPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPB0EB0EBsFBsFBsFBsFBoGBoGBgIBgIBgHBgHB8HB8HDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQCSFPBPBzEBzEBRCxnOFSFrFBrFBrFBrFBREQBQClkOFPBPBnGBnGFQBQCljOCODPBPB-GB-GBNHSF-HB-HB7HB7HBRqJ53OE9tQBrmQH4Bc3BSgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfECBByZ0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzB34BgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CBCBBBt-UBruHBt+UB1iVBviVBCBBBCBBBCBBB3hVB5-UB9hVB7hVCCBBCCBBI9jVB9jVBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBICBBBCBBECBBN-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOC-lOG-lOzoeCBBBCBBBCBBBCBBBCBBBCBl8kCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBTCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBnECBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBKCBBBCBBBnglCBCBBBCBBBCBBBCBBBCBBECBBBvyyCDCBBBCBBBgDCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBn0yCB90yCB10yCBh0yCBn0yCCjxyCBzyyCBpxyCBg6BBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB-CBl0yCBvjlCBCBBBCBBBt2yCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBhkzCZCBB9a-5Bd-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCm6TCBB7gBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCH-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BmlBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvChDwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCFvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvC1DuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCCuCBuCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCCtCBtCk2BgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEO-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-D+CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCL-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-B74CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhrVgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BD1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BtxekCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjC")),this._CASE_ORBIT}static get Print(){return this._Print||(this._Print=new m(_("hB9CBjBLBCpWBDFBFGBCCCBSBCsMBClBBDxBBDCBC2BBJaBFFBSVBC-FBCvBBD6BBDkDBP6BBDwBBDOBCbBDCCBJBGfBIqCBCgFBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYBDCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPBLCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGBCCBCHBDBBDVBCGBCBBCEBDIBDBBDCBICBFBBCEBDRBLBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBGMBCCBCWBCPBDIBCCBCDBIBBCCBCBBDDBDJBIVBCCBCWBCJBCEBDIBCCBCDBIBBGCBCDBDJBCCBNMBCCBCyBBCCBCFBFPBDZBCCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBN5BBFcBmBBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDBhBnCBCjBBFmBBCjBBCOBCMBmBlGBCGGD4LBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBH1CBDFBD-TBCbBE4CBIVBKXBKTBNMBCCBCBBN9CBDJBHJBHNBCKBH4CBIqBBGlCBLeBCLBFLBFEEBoBBDEBMrBBFZBHKBE9BBDgCBCcBDKBHJBHNBDtBBDLBVsCBClFBJ7BBEOBE9BBGqBBDKBJqBBG1QBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBSXBJuBBSBBDaBCMBEhBBPgBBQrEBF5UBXKBWz4BBD9LBGsBBCGGD3BBIBBPXBKGBCGBCGBCGBCGBCGBCGBCGBC9DBjBZBC4CBN1GBbPBC+BBC1CBDmDBGqBBC9CBC1CBKvBBCszcBE2BBK7KBV3FBJ8GBV7BBEJBH3BBJlCBJLBHzDBMdBEtCBCKBFgBBC2BBKNBDJBDmDBZbBLFBDFBDFBKGBCGBC7BBF9DBDJBHj9KBNWBFwBBloItLBDpDBnBGBNEBGZBCEBCCCBCCBCCBoUBhBpBBHyBBCSBCDBFEBCmEBF9FBEFBDFBDFBDCBEGBCGBOBBDLBCZBCSBCBBCOBDNBjB6DBGCBFsBBE3CBCMBEwBwBBsBBjEcBEwBBQbBFjBBKdBGqBBGdBCkBBFNBrB9EBDJBHjBBFjBBFnBBJzBBMLBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBCnCBJIBxBSBCBBGgBBEaBGaBnB3BBFTBDxBBCBBGHBCCBCcBDCBFJBIIBI-BBhBmBBFLBK1BBEcBDaBGZBIDBNGBxCoCB4ByBBOyBBItBBJJBHlBBEcBJBBxGeBCpBBCCBDBBRFBJIBiBtBBJpBBXZBnBbBVWBKtCBFjBBK9BBCEBOYBIJBH0BBCRBJmBBK-CBCTBMRBCuBB-BGBCCCBCBCOBCKBH6BBGJBHDBCHBDBBDVBCGBCBBCEBCJBDBBDCBDHHGGBDGBEEBMJBCDDClBBCJBCDDCDBCJBCBBJBBe7CBCEBfnCBJJBnF1BBDlBBjBkCBMJBHMBU5BBHJBHTBdaBDOBFWB6F7BBlDyCBNHBDDDBGBCBBCdBCBBDLBKJBnCHBDtBBDKBcnCBJyCBOoCBIJB3CHB5ChBBPJBHIBCsBBCNBLcBEfBDVBCNBqCGBCBBCrBBECCBCCBHBJJBHFBCBBCkBBCBBCFBIJBHrBBFJB3HYBIQBCoBBEcB2CQQBwBBO6cBnDuDBCEBMjGBtyCiDBOvhBBRVBL68DBGmSB61G5BBn2B4RBIeBCJBFwCBCJBHdBDFBLlCBLJBCGBCUBGSBxN5BBnG6CBGYBDYBtBqCBF4BBIQBhCEBMGBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBDDBh7D8HBEzNBHWBQQBQtBBDWBKzDB9B1HBLmBBDpCBJvDBWlCB7DTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBD9VBQEBCOBxiBeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBENBDJBFBBhKeBS5BBGxOxOBoBB3GqBBFhGhGBdBCVBJBBhHGBCDBCBBCOBCkGBDPBqBrCBFJBFBByYjCBtC8BBjGDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBBvIrBBFjDBNOBDOBCOBCkBBLtFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBmgB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIBnkzVvHB",!1))),this._Print}static get Upper(){return this.CATEGORIES.get("Lu")}},q(tr,"_CASE_ORBIT",null),q(tr,"_Print",null),q(tr,"CATEGORIES",new Va({C:()=>new m(_("AfBgDgBBOrWrWBHHBCBICCVuMuMnBBBzBBBE4B4BBGBcDBHQBXhGhGxBBB8BBBmDNB8BBByBBBQddBCCMEBhBGBsCiFiFJBBDBBXIICCBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBPMMBEB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKMMBDBbEByBPBDBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCB-FCBHBBHBBHBBECBIIIBLBDBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIB-BGGBLBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMBxhBPBXJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBF-6DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBrCHBxDUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIlkzVBxHvw-FB",!1)),Cc:()=>new m(_("AfgDgB",!0)),Cf:()=>new m(_("tFzqBzqBBEBXhGhGyBhMhMBxCxCs5D9-B9-BBDBbEByBEBCJBw03B6H6HBBBimEQQj7IPBhjiBDBwmFHBn0rYffB+CB",!1)),Cn:()=>new m(_("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBDBvzIBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-BB---BBB---BBB",!1)),Co:()=>new m(_("gg4B-nGh4hc9--BD9--B",!0)),Cs:()=>new m(_("gg2B--B",!0)),L:()=>new m(_("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICCiEEBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoCaBFDBuBqBBkBBBCiDBCQQBIIBLLBBBDRRCdBe4CBMZZBfBKBBFGGBUBFKKEYYBXBIKBGXBCGBRpBB7B1BBETTIJBQPBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNGB7BBBCCCBDBCXBCCCBIBCBBKDDBDBCWWBCBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNSSBkBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBkBFFkC4CBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBzC+C+CBtBBSHB3BdBOBBLrBBbjBBqBCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBhC1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBF1B1BB8zC8zCBjHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBxC2O2OBrBrBBDBGBBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBReBDlCByBIBDmDBDxCBVQBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBdRRBDBCJBLEBCoBBYCBCHBVWBEEEBwBBCEEBDDBDBDCCZCBDKBICBNFBDFBDFBKGBCGBCqBBCNBHyDBej9KBNWBFwBBloItLBDpDBnBGBNEBGCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBxB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOjBBnBbBKWB7HpBBHBBRFB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB1D-BBgBHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBqBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBGjCjCBLBhCBBCPPBNNB0mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBn7F0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFBmI9BBzEsBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCCBCBBCGBDEBKBBhHGBCDBCBBCOBCkGB8BjCBI1lB1lBBCBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),LC:()=>new m(_("hCZBHZB7BLLBVBCeBCiGBCDBFvGBDZBhGDBDBBECBCHHCCBCCCBSBCyCBCqEBJlFBClBBKoBB44ClBBCGGDqBBDCBhV1CBDFBjkCKBGqBBDCBhCrBBgCMBChBBmD1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGBmIFFDJBCEEBDBHGCBCBCFBFDDBCBGEBF1B1BB8zC8zCB6DBDmDBHDBEBBNlBBCGGzoetBBTbBnEtCBCWBEDBCsCBZBBE2Z2ZBpBBGIBIvCBh6TGBNEBqgBZBHZBmlBvCBhDjBBFjBB1DKBCOBCGBCBBCKBCOBCGBCBBk2ByBBOyBB+CVBLVB74C-BBhrV-BBhBYBDYBtpZ0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BJBCTBHFB2uCjCB",!1)),Ll:()=>new m(_("hDZB7BqBqBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDZBiGCCEEEBBBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBDCB5XFBjkCIBC2D2DBqBBgCMBChBBnD0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBBzIEEBEEcKFDBBJDBF2B2Bs1CvBBCEEBGCFCCBCCBEBGiDCBIICFFNlBBCGG0oesBCUaCoEMCBBBC+BCBGBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCbEE2ZqBBGIBIvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFB4vChBB",!1)),Lm:()=>new m(_("wVRBFLBPEBICCmEGG-OnHnHlFBBuIBBFgBgBKEEhFoFoF1mBgEgE2R72B72BsDkTkTxOFBvF+BBOjBjBBjBByVOORMBg-CBByHgGgG2OsBsBBDBGiDiDB+C+CBBB34bjnBjnBBEBvIzDzDdBB6DIBxCYYpDDBEBB2OXXqEtDtDWBBoDDBKngVngVuBBBh-BFBCpBBCIB0sBhBhB2K04D04DnrTDB9PCBpBBBnRMBhCBBCPPB9-P9-PBCBCGBCBByhM9BBqGGBud0Q0QsSAB",!1)),Lo:()=>new m(_("qFQQhIFFBCBxGBB7ZaBFDBuBfBCJBkBBBCiDBCZZBLLBBBDRRCdBe4CBMZZBfBWVBrBYBIKBGXBCGBRoBB8B1BBETTIJBROBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNFB8BBBCCCBDBCXBCCCBIBCBBKDDBDBYDBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNyDyDBnKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPByDrTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBpBkCkCBhBBC0BBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBxFuBBSHB3BdBOBBLrBBbjBBqBCBLdByDDBCFBCBBE7hB7hBBCB4-C3BBZWBKGBCGBCGBCGBCGBCGBCGBCGBoR2B2BF1CBJCCB4CBFGGBpBBC9CBSfBxBPBhQ-tGBhC0wUBC2jBBkCnBBJrIBFPBLBBjCyByBBkCBqFoDoDEGBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBuBEBDIBLEBCoBBYCBCHBVPBCFBEEEBwBBCEEBDDBDBDCCZBBEKBIPPBEBDFBDFBKGBCGByEiBBej9KBNWBFwBBloItLBDpDBkCCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBqDJBCsBBDeBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBhEtCBjDnBBJzBB9CzBBN2JBKVBLHB5EFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4FjBBnBDBCxJxJBoBBHBBRCBCBB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB0GHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBnBBCBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBB0BUBGSB0NnBB2MqCBGwFwFB0mHBqBfBiDyDBuwIiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBxzI2P2PBrBBiBiKiKBcBTrBBlPaBmHdBDwGwGBdBCCBCBBCGBDEBKiHiHBFBCDBCBBCOBCkGB8pBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Lt:()=>new m(_("lOGDnB2sH2sHBGBJHBJHBNQQwBAB",!1)),Lu:()=>new m(_("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBG+B+B9zCvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBB",!1)),M:()=>new m(_("gYvDB0IGBoIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCgBB3BCBCRBCGBLBBeCB5BCCBFBDBBDCBKLLBbbDCB5BCCBDBFBBDCBEffBEEMCB5BCCBGBCCBCCBVBBXFBCCB5BCCBFBDBBDCBICBLBBf8B8BBDBECBCDBKpBpBBDB4BCCBFBCCBCDBIBBMBBeCB5BCCBFBCCBCDBIBBMBBQNNBCB4BBBCGBCCBCDBKLLBeeBBBnCFFBEBCCCBGBTBB+BDDBFBNHBjDDDBHBMGBqCBBcECFBByBTBCBBGKBCjBBKlDlDBSBYDBFCBCCBDGBEDBOLBCLLBCBgWCBzdDBdCBeBBfBBhCfBKuBuBBBBC2D2DBjBjB3DLBFLB8GEB6BJBCcBDxBxBBsBBDLBVEBwBQBnBIBNCBfMB5BNBxBTB5ECBCUBFHHDCBnG-BBxWgBB--CCBuEhDhDBeBrRFBqDBB1udDBCJBhBBBxCBBxIEEFYYBDBF0C0CBzBzBBQBbRBOnBnBBGBaMBtBDBwBNBlBkCkCBMBNJJBuBuBBBBzBCCBBBDBBGBBCqBqBBDBGBBtHHBCBBx5TiXiXBOBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB7DCB2BOBqBDDBLLBCBuBKBI+B+BBBBlBNBRBBtBNNBBBxBNBJDBCBB9CLBHDD+ELBWDB4BBBCGBDBBDCBKLLBDDBFBEEBkCIBCDDCDBCEBCPPBzCzCBQBYyCyCBSBsHGBDIBcBBzCQBrDMBmDOBhIOB2HFBCBBDDBCCCBuEuEBFBDGBEddBIBpBGBCDBJKKBJBvBPBnGHBoGHBCHBzCVBCNB7DFBECCBCCBFBCjCjCBDBCBBCEB8KDBKBBCxBxBBFBEEBYmnFmnFHOBpmLRBhuCEB8BGB5gBCCB1BBIDByCMMBslTslTBizEizEBsBBDWB-QEBEFBJHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),Mc:()=>new m(_("joC4B4BDCBJDBCBBzBBB7BCBHBBDBBLsBsB7BCBjC7B7BBBBJCCB2B2BB7B7BCHHBDDBLLnDBBCBBECBCCBLqBqBBBB+BDB+BBB7BCCBDBDBBCBBKBBdPPB7B7BBBBGCBCCBLrBrBBsCsCBBBHHBTBBrKBBgCsFsFBFFHDDBaaBLLBBBDGBWBBDFBDLLBBB5zBffiEIIBGBCBB7KDBDCBFBBCFBhHBB7BCCKCCBJJBEByExBxBGCCBDBCBB+BffFBBD9B9BDCBCEEBxBxBBGBJBBsFWW35EBB0-dBBD5C5CBzBzBBOBvEBBwBxBxBBFFBDDBBBvDBBDBBZuBuBCuDuDDBBGuHuHBCCBCCBCC0gZCCgEuBuBBBBFBB0DZZB8B8BxBCBKBBO+C+CBBBEBBCrFrFBBBgBBB7BBBCDBDBBDCBKLLB1C1CBBBIDDCDBCBBCmDmDBBBJBBErDrDBBBHCCBCBDuHuHBBBHDBDyDyDBBBJBBCuDuDCBBHoDoDCBBFmImIBBBK4H4HBEBCBBFDDCvEvEBBBJDBF1C1CeBB-BqGqGECCoGPPrDIID2G2GBDBFBBC-K-KBNNxBBBJBBCpvQpvQBBBlxD2BBpDBB0rYBBHFB",!1)),Me:()=>new m(_("okBBB1xF-wB-wBBCBCCBsshBCB",!1)),Mn:()=>new m(_("gYvDB0IEBqIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCfB4BCCFHBFEEBFBLBBe7B7BFDBJVVBbbDBB6BFFBFFBDDBBBEffBEEMBB6BFFBDBCBBFVVBXXBEBC7B7BDCCBCBJIIBMMBff+BNNzBEE4BCCBBBGCBCDBIBBMBBe7B7BDHHGBBVBBdBB6BBBFDBJVVBeepCIIBBBC7C7CDGBNHBjDDDBHBMGBqCBBcEC4BNBCEBCBBGKBCjBBKnDnDBCBCFBCBBDBBaBBFCBRDBODDBHHQgWgWBBBzdCBeBBfBBfBBhCBBCGBJDDBJBKuBuBBBBC2D2DBjBjB3DCBFBBKHHBBB8GBBD7B7BCGBCCCDHBHJBDxBxBBMBCeBDLBVDBxBCCBDBCGGpBIBNBBhBDBDBBCCB5BCCBEECCB7BHBDBB5ECBCMBCGBFHHEBBnG-BBxWMBFEEBKB--CCBuEhDhDBeBrRDBsDBB1udFFBIBhBBBxCBBxIEEFaaBGG4EBBbRBOnBnBBGBaKBvBCBxBDDBCBDBBoBkCkCBEBDBBDBBNJJwB0B0BCCBDBBGBBCrBrBBJJvHDDFx5Tx5TiXPBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB8D3B3BBNBqBDDBLLBBByBDBDBBI+B+BBBBlBEBCHB-BNNB1B1BBHBLDBDgDgDBBBDCCBHHD+E+EEHBWBB6BBBEmBmBBFBEEBnCFBOECPBB2CHBDCBCYY1CFBCFFBCCBvHvHBCBHBBCBBcBB2CHBDCCBrDrDCDDBEBCmDmDCDDBCBCEBkIIBCBBhIBBCFFxEDBDBBFhBhBBIBpBFBDDBJKKBEBDCBvBMBCBBnGCCBBBCqGqGBFBCFBCzCzCBUBDGBCBBCBB7DFBECCBCCBFBCpCpCBEEC8K8KBMMB1B1BBDBGCCYmnFmnFHOBpmLLBECBhuCEB8BGB5gBgCgCBCByC5lT5lTBizEizEBsBBDWBhRCBSHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),N:()=>new m(_("wBJB5DBBGDDBBBitBJBnEJBnGJB9MJB3DJBFFBtDJB3DJB3DJBDFBvDMB0DJBJGBoDJBpDGBISBuDJBhDJB3DJBnCTBtIJBnCJBwWTBybCBwHJBHJBXJBtJJBhEKBmFJBHJB3FJB3CJBnEJBHJB3gBEEBEBHJBnGyBBDEB3W7BBvCVB3TdBqrBqYqYaIBPCB4KDBrEJBfHBCOBhBJBoBOBh7cJB9FJBhKFB7EJBnBJBnGJBXJB3CJB3MJB34UJBuPsBBN4BBSBB2KaBlBDBeJJnEEBrGJBvdHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBxBJBHJB3IeB-EJBrBDBxDGBnEdBhEJB9BJBxEJBITB8HJB3KJB3DJB3LJBnDJBHTBtCLBlNSB+CJB3UJB3CcBkHJBnCJB3BJBnLJBnDUBshBuDBimPJBnpCJB3CJBnEJBCGBvQJBnIWB+KCB6nXJBnuBTBNTBtDYB2iBxBBhqCJBnNJB3PJB4HJBtWIBhEJB4Y6BBCCBCDBtCsBBCOBjeMBk3CJB",!1)),Nd:()=>new m(_("wBJnxBJnEJnGJ9MJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJhDJ3DJnCJ3IJnCJn6BJnBJtJJhEJnFJHJ3FJ3CJnEJHJnuiBJnVJnBJnGJXJ3CJ3MJ34UJnsBJnkCJHJ9YJhEJ9BJxEJ3IJ3KJ3DJ3LJnDJHTtCJnNJnDJ3UJ3CJ3HJnCJ3BJnLJ3uQJnpCJ3CJnEJ3QJ37XJ12CxBhqCJnNJ3PJ4HJ2aJ30EJ",!0)),Nl:()=>new m(_("u3FCBwzCiBBDDB-zDaaBHBPCBs1dJBxyW0BBtOJJnEEBrhIuDBm8SCB",!1)),No:()=>new m(_("yFBBGDDBBB2pCFB5LFB5DCBmEGB6GGBSIByNJB2hBTB0jBJBhP20B20BEFBHJBnGPBqB3W3WB6BBvCVB3TdBqrB1kB1kBBCBrEJBfHBCOBhBJBoBOBxrdFBymWsBBiCDBSBB2KaBlBDB1pBHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBhLeB-EJBrBDBxDGBnETB8LTBmqBBBvNIBobSB0aUBn8SGB-YWBqhZTBNTBtDYBvqFIBid6BBCCBCDBtCsBBCOBjeMB",!1)),P:()=>new m(_("hBCBCFBCDBLBBEBBbCBCccCkBkBGEELBBEEE-VJJzOFBqBBB0BCCDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCmBmBBCBoCrCrCBDBFBBwDFBsFlTlTBHB4EuTuTtBBBvCCBoCBB+ECBCCBmBKB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBM9Z9ZBWBJTBCMBCLBfBBPBB6TDBeBB+hBNBwCBBgBJB0MVBgCDBhBBB8XDBCBBxDwEwEBtBBCfBDLBkNCBFJBDLBRNNjD7C7CjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HzqUzqUBxGxGBIBXiBBCNBCFFCBB2ECBCFBCDBLBBEBBbCBCccCCCBFB7MCB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDByO-J-JjBlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Pc:()=>new m(_("-Cg-Hg-HBUU-u3BBBZCBwHAB",!1)),Pd:()=>new m(_("tB9qB9qB0BiyDiyDmgBqgCqgCBEBiwDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Pe:()=>new m(_("pB0B0BgB+1D+1DC-6B-6BqtC4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECtBGCtNICEGCDBB-ozB6G6GeOCESSCCCrF0B0BgBGD",!1)),Pf:()=>new m(_("7F+6H+6HEddpuDCCFDDQEE",!1)),Pi:()=>new m(_("rFt7Ht7HDBBDaapuDCCFDDQEE",!1)),Po:()=>new m(_("hBCBCCBDECBLLBEEBcclCGGPBBI-V-VJzOzOBEBqB3B3BDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCxDxDrCEBFBBwDFBsFlTlTBHBmY9D9DBBBoCBB+ECBCCBmBFBCDB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBMjajaBJJBGBJIBDDBDCBEKBCCCBIB7kDDBCBBxDwEwEBFFBBBDDDBHBCBBCDDBLLBDBCJBDDBCCCBLBDCBtNCB6B+F+FjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HlxUlxUBFBDXXVBBDDBECBCDBICBHCCB2E2EBBBCCBDECBLLBEEBcclBDDB7M7MBBB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDB0ZlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Ps:()=>new m(_("oBzBzBgB-1D-1DC-6B-6B-rCEEnB4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECaTTCECtNICEGCDipzBipzB4GeeCMCESSCCCrFzBzBgBEEDAB",!1)),S:()=>new m(_("kBHHRCBgBCCcCCkBEBCBBDCCBCBDEEfgBgBrODBNNBGGBCCCBPB2DPPBxDxDsErIrIBBB3DCBDDDBvGvGLUUB4H4HIBBpEqLqLBHHB2H2H-DjEjEBGBlEwGwGqBmGmGiGCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WuLuLlL+E+EBgBBiLJBKIBhiBCCBBBMCBOCBOCBOBBmCOOoBCBOCBUhBB-BBBCDBCBBLCCBBBGFBCECFMMBFFBDBGDBC7B7BBFFB2LBFcBD+HBXKByCtCBXnTBtBwBBDeBLyMBX+BBFfBD1LBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBB8CBB0HBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BB6RWBKBBoDBB+EDBLDB+RCBiHPPB+9T+9TpEgBBuLPBhCBB3BHBtBDBjDCCBBBD7E7EHRRBBBgBCCcCCiEGBCGBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSmWmWBiKiKBGBnjC2kC2kCBbBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQQBgDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBrbaagBaagBaagBaagBaa9B-PB4BDBzBHBCNBCBBp2BwNwNttCEE+DiOiOBvIvIBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Sc:()=>new m(_("kB+D+DBCBqnB8D8DzPBBzPBBI2H2HoImSmS8sClmClmCBgBB37hBkuVkuVtD7E7E8GBBEBB3-HDB-4wBxtCxtC",!1)),Sk:()=>new m(_("+CCCoCHHFEEqQDBNNBGGBCCCBPB2DPPBjoBjoB15FCCBBBMCBOCBOCBOBB9kEBBkzdWBKBBoDBBxePPBniUniUBPB8bCCjF4g9B4g9BBDB",!1)),Sm:()=>new m(_("rBRRBBB+BCCuBFFmBgBgB-XwQwQBBB8xGOOoBCBOCBsEoBoBBDBHlClCBDBGBBFGDIgBgBBDDCgBgBBqIBhBBB7CffBXBpBFB2OKK3BHBwDxKxKBDBDeBLPBhIiEBX+BBFfBDhIBxBUBDFB9+zB5Z5ZCCBlFRRBBB+BCCkEHHBCBitDBBhrwBx+Bx+BagBgBagBgBagBgBagBgBat5Ft5FB-uC-uCBHB",!1)),So:()=>new m(_("mFDDFCCyerIrIBgEgEBvGvGLUUB4H4HkQ2L2LjEFBClElEwGqBqBoMCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WzWzW+EhBBiLJBKIBksBBBCDBCBBLCCBHHBEBCECFMMBPPCBBC7B7BBKKBDBDDBCBBCBBCGBCeBDBBCCCBdBtIHBFTBDGBDwCBCdBanBBHnCBXKByCtCBX2FBCIBC1BBJuDBC3HBtBrBBhC-HBhQvBBWBBHmBBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBBxKBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BBibDBLBBC+R+RBBBqqUPBuLPBhCBB3BHBuBCBlPEEFBBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSpgBpgBBGBnjC2kC2kCBGBFQBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQPBhDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBqlB-PB4BDBzBHBCNBCBBp2B96C96CiEyWyWBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E6HBG4WBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBB-B3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Z:()=>new m(_("gBgEgEgvFgsCgsCBJBeBBGwBwBh9DAB",!1)),Zl:()=>new m(_("ohIA",!0)),Zp:()=>new m(_("phIA",!0)),Zs:()=>new m(_("gBgEgEgvFgsCgsCBJBlBwBwBh9DAB",!1)),ASCII_Hex_Digit:()=>new m(_("wBJIFbF",!0)),Alphabetic:()=>new m(_("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICC3CeeBQBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoBNBCCCBCCBCCJaBFDBeKBG3BBCGBPlDBCHBFHBFCBLCBDRRBuBBOkDBZgBBKBBFGGBWBDSBUYBIKBGXBCGBIJJBoBBLLBEGBHrCBCPBCCBFOBOSBCHBDBBDVBCGBCEEBCBEHBDBBDBBCJJFBBCEBNBBLFFBBBCFBFBBDVBCGBCBBCBBCBBFEBFBBDBBFIIBCBCSSBEBMCBCIBCCBCVBCGBCBBCEBEIBCCBCBBEQQBCBWDBFCBCHBDBBDVBCGBCBBCEBEHBDBBDBBKBBFBBCEBORRBCCBEBECBCDBEBBCCCBEEBEEBBBELBFEBECBCCBEHHpBMBCCBCWBCPBEHBCCBCCBJBBCCBCBBDDBdDBCHBCCBCWBCJBCEBEHBCCBCCBJBBGCBCDBOCBNMBCCBCoBBDHBCCBCCBCGGBCBIEBXFBCCBCRBEXBCIBCDDBFBJFBCCCBGBTBBO5BBGGBH0B0BBECBDBCXBCCCBRBCCBDEBCHHPDBhBgCgCBGBCjBBFSBFPBCjBBkC2BBCDDBDBR-BBLDBDlBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBEKBITBMUBNTBNMBCCBCBBNzBBDSBPFFkC4CBIqBBGlCBLeBCLBFIBYdBDEBMrBBFZB3BbBF+BBDTBzBYYBMMBBByBzBBCOBCHB0BpBBDDBLrBBCKBP2BBXCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBUhBBM1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBFSSBnBBuZzBB34BkHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBCfBwB2O2OBBBaIBIEBDEBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBGHBEwDBoBIBDmDBDxCBVUBCgBBZzBBNjCBCtBtBBEBECCBBBLgBBGiBBOcBEyBBCLBQRRBOBLEBC2BBKNBTWBEkCBCCCZCBDPBDDBMFBDFBDFBKGBCGBCqBBCNBH6DBWj9KBNWBFwBBloItLBDpDBnBGBNEBGLBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmC0BBsIcBEwBBwBfBOdBGqBBGdBDjBBFHBCEBrB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCDBCBBGHBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOnBBjBbBEGGBVB7HpBBCBBEBBRFBzBCBEcBLJJBUBrBRBvBUBcWBKlCBsBEBL4BBKOOBXBYyBBSDBJiBBEKKB+BBCDBKBBLCCkBRBChBBDHHBCB-BGBCCCBCBCOBCJBI4BBYDBCHBDBBDVBCGBCBBCEBEHBDBBDBBEHHGGBdJBCDDClBBCJBCDDCDBCBBECCtBhCBCCBCDBVCBfhCBDBBC5F5FB0BBDGBaFBjB+BBCEE8B1BBDoCoCBZBDNBWGB6F4BBoD-BBgBHBDDDBGBCBBCdBCBBDBBDDB+CHBDtBBDFBCCCBccBxBBDJBSnCBGTTBnCBoDHB5CgBBgBIBCsBBCGBCyByBBcBDVBCNBqCGBCBBCrBBECCBCCBBBCDDBZZBEBCBBCkBBCBBCDBCYYBqBBlIWBKQBCoBBECBwDwCwCB4cBnDuDBSjGBtyCgDBQvhBBSFBa68DBGmSB61GuBBy2B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBF4BBIQBhCBBCNNBFBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBFi7Fi7FBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCVBJBBhHGBCDBCBBCOBCkGB8BjCBEEE1lBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1TZBHZBHZB3zD-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Dash:()=>new m(_("tB9qB9qB0BiyDiyDmgBqgCqgCBEB+BoBoBQnMnMlgDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Emoji:()=>new m(_("jBHHGJBwDFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDrGrGhFBBNBBPDDBIBsCZBCBBYVVDIBWBBvFhBBDvDBDBBCCBDyCBDCBCmIBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDDBEJBECCBEEDJBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Emoji_Component:()=>new m(_("jBHHGJB0+H2G2Gsp3B3+8B3+8BBYB8PEBxtBDBtzhY-CB",!1)),Emoji_Modifier:()=>new m(_("7-8DE",!0)),Emoji_Modifier_Base:()=>new m(_("9wJ8G8GRDB4jzD9B9BBBBDDDBBB2DBBDKBWSBEFFBBBCCBICCZqGqGBFFWFFBvFvFBBBEEB0CRRBBBKMMgSDDJHBHKKBIBDCB5B+B+BBCCBCCSCBCMBmHCBrBIB",!1)),Emoji_Presentation:()=>new m(_("64IBBuGDBEDDqQBBWBBzBLBsBUUOJJBSSBGGBJJGWWIBBCFFDIIFBBdkBkBCFFBBBC+B+BBBBZPP8aBB0BFFvlxDrGrG-FDDBIBsCZBCZZVDDBDBCCBWBBvFgBBNIBClCBCVBNqBBFEBNQBEEEBlCBCCCB5FBD+BBODBCXBTbbBOO3C0CBxBlCBHEEBBBDDBEDBMBBIIBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Extended_Pictographic:()=>new m(_("pFFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDoBoBBCBlDLBQBBQPPBmBmBBIBxDBBNBBPDDBIBU3BBcOBLVVDIBCDBKWBH7FBDvDBDBBCCBDyCBDCBCDBG9HBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDQBECCBEBDMB7GlBBNDB5BHBLFBpBHBfBBNDBDNBKmBBNuBBCJBC4FB5CHBPxEBhI9fB",!1)),Hex_Digit:()=>new m(_("wBJIFbFq1-BJIFbF",!0)),Lowercase:()=>new m(_("hDZBwBLLFlBlBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDiBBIBBfEBhDsBsBCEEDDBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBCDB5XFBjkCIBC2D2DB+FBiC0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBB6DOORMBuDEEBEEcKFDBBJDBFiBiBBOBFsasaBYBn6BvBBCEEBGCFCCBCCBGBEiDCBIICFFNlBBCGG0oesBCUaCBBBmEMCBBBC8BCBIBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCWDBCCCBBB2ZqBBCNBHvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBkODDBBBCpBBCIBmoByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFBmI9BB1lChBB",!1)),Math:()=>new m(_("rBRRBBBgBeeCuBuBFmBmBgB5W5WBBBDbbBDDBBBwQCBuwGccBBBMEEOPPBCBWEBMEBiCMBFEEBFFBDBTFFDJBCDDBEBHEEBDDBCCBBBCFBENBClClCBWBCFBCBBFBBFfBCHHBPPBqIBJDBVBB7CffBZBCZZMGB+NBBNJBFFBFBBDBBEEBPCCDFBMHBGBB6BCCeDBKCBxK-BBhI-PBxBUBDFB9+zB4Z4ZBEBCjFjFRCBeCCeCCkEHHBCBitDBBhrwBwoBwoBBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBBhwFDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB-uCIB",!1)),Quotation_Mark:()=>new m(_("iBFFkEQQ96HHBaBBowDqOqOBCBOCBixzBDB+FFF7CBB",!1)),Terminal_Punctuation:()=>new m(_("hBLLCMMBEE-ZJJiQ6B6BpCPPCCB1FsBsBBJBCsHsHB3B3BBEBCHBgBmImIB1nB1nBBtFtFFFB4JBB2YHBmY9D9DBBBoCBB+ECBEoBoBBCBDBB7JBBjLDBjFBBLBBCCBeCB8FEB-BBBldYYBKKBBBwlDCBzJOOFLLCBBEBBtNBB8ndBBuICBkHEB-LBB3CBBgD4E4EBBB0ECBgERRB6H6HnxUDDB6B6BBBBCDBqFLLCMMBEEiCDD7hBxBxBnkBoGoG3JBB5EFBlCFB6CDB5dEBtBDB+FGBxDDBgECBiEBBHRRB5C5CBDBtDrJrJB2D2DBBBNBBnLDBEOBqDBB6HCBmQCC8HBB4CBBFBB-MCBuBmUmUBrCrCBspBspBBDB6vRBBmEiCiCBBBLqRqRBoJoJBnwTnwTovHDB",!1)),Uppercase:()=>new m(_("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBGbbBOBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBBvgCZBHZBHZB",!1)),White_Space:()=>new m(_("JEBTlDlDbgvFgvFgsCKBeBBGwBwBh9DAB",!1))})),q(tr,"SCRIPTS",new Va({Adlam:()=>new m(_("go6DrCFJFB",!0)),Ahom:()=>new m(_("g4lCaDOFW",!0)),Anatolian_Hieroglyphs:()=>new m(_("ggxCmS",!0)),Arabic:()=>new m(_("gwBEBCFBCNBCCBCfBCJBMZBCrDBChBBxCvBBxHhBBGqCBCcBxy8BtPBDvEBhBPBxDEBCmEBk7DeBkCFBJIBiBFBh43BDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB",!1)),Armenian:()=>new m(_("xpBlBDxBDCks9BE",!0)),Avestan:()=>new m(_("g4iC1BEG",!0)),Balinese:()=>new m(_("g4GsCCxB",!0)),Bamum:()=>new m(_("g1pB3CpowB4R",!0)),Bassa_Vah:()=>new m(_("w26CdDF",!0)),Batak:()=>new m(_("g+GzBJD",!0)),Bengali:()=>new m(_("gsCDBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYB",!1)),Beria_Erfe:()=>new m(_("g17CYDY",!0)),Bhaiksuki:()=>new m(_("ggnCICsBCNLc",!0)),Bopomofo:()=>new m(_("qXB6wLqBxDf",!0)),Brahmi:()=>new m(_("ggkCtCFjBKA",!0)),Braille:()=>new m(_("ggK-H",!0)),Buginese:()=>new m(_("gwGbDB",!0)),Buhid:()=>new m(_("g6FT",!0)),Canadian_Aboriginal:()=>new m(_("ggF-TxRlC7tgCP",!0)),Carian:()=>new m(_("g1gCwB",!0)),Caucasian_Albanian:()=>new m(_("wphCzBMA",!0)),Chakma:()=>new m(_("gokC0BCR",!0)),Cham:()=>new m(_("gwqB2BKNDJDD",!0)),Cherokee:()=>new m(_("g9E1CDFz7lBvC",!0)),Chorasmian:()=>new m(_("w9jCb",!0)),Common:()=>new m(_("AgCBbFBbuBBCOBCEBYgBgBiOmBBGEBDTB1DKKHCC+THHPEEhB9E9ElQiEiEB6mB6mB2MDBjJwvBwvBBBBoCBBsGBBCumBumBOIIBCBCFBCCBDmYmYBKBD2CBCKBEKBCOBShBB-BlBBCCBDFBCaBCQBqBCBF5UBXKBW-cBhIzTBDpEBhQ9CBzMUBCCCBXBQHBFDB8CBBE7C7CB0E0EBOBhBlBBKxBxBB+BBgBwCBwB5C5CBmFBhuG-BBhoWhBBnDCBmFJB1HhFhFsMPPBzuUzuUBxGxGBIBXiBBCSBCDB0ECCBeBbFBbKBLuBuBBhChCBFBCGBLEBjICBFsBBEIBxCMB0BsBBlHaBltuBDB96D8HBEzNBHWBQQBgDzDB9B1HBLmBBD9BBEQBJBBIdBF8BB2GTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBByjFjCBtC8BBjWrBBFjDBNOBDOBCOBCkBBLtFB5BZBCBBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBnghYffB+CB",!1)),Coptic:()=>new m(_("ifNxkKzDGG",!0)),Cuneiform:()=>new m(_("ggoC5cnDuDCEMjG",!0)),Cypriot:()=>new m(_("ggiCFBDCCBqBBCBBEDD",!1)),Cypro_Minoan:()=>new m(_("w8rCiD",!0)),Cyrillic:()=>new m(_("ggBkEBDoFBx6FKBhFtCtCojEfBhie-CBv8VBBhw4B9BBiBAB",!1)),Deseret:()=>new m(_("gghCvC",!0)),Devanagari:()=>new m(_("goCwCFODZh7nBfhwcJ",!0)),Dives_Akuru:()=>new m(_("gomCGBDDDBGBCBBCdBCBBDLBKJB",!1)),Dogra:()=>new m(_("ggmC7B",!0)),Duployan:()=>new m(_("ggvDqDGMEIIJDD",!0)),Egyptian_Hieroglyphs:()=>new m(_("ggsC1iBL68D",!0)),Elbasan:()=>new m(_("gohCnB",!0)),Elymaic:()=>new m(_("g-jCW",!0)),Ethiopic:()=>new m(_("gwEoCBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBnvGWBKGBCGBCGBCGBCGBCGBCGBCGBjpfFBDFBDFBKGBCGBylvCGBCDBCBBCOB",!1)),Garay:()=>new m(_("gqjClBEcJB",!0)),Georgian:()=>new m(_("glElBBCGGDqBBCDBx8CqBBDCBhiElBBCGG",!1)),Glagolitic:()=>new m(_("ggL-Ch9sDGCQDGCBCE",!0)),Gothic:()=>new m(_("w5gCa",!0)),Grantha:()=>new m(_("g4kCDBCHBDBBDVBCGBCBBCEBDIBDBBDCBDHHGGBDGBEEB",!1)),Greek:()=>new m(_("wbDBCCBDDBCFFCCCBBBCCCBSBC+BBPPBnpGEBzBEBFEB1ChKhKBUBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBoJ-xiB-xiB7uVuCBSgj0Bgj0BBkCB",!1)),Gujarati:()=>new m(_("h0CCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGB",!1)),Gunjala_Gondi:()=>new m(_("grnCFCBCkBCBCFIJ",!0)),Gurmukhi:()=>new m(_("hwCCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPB",!1)),Gurung_Khema:()=>new m(_("go4C5B",!0)),Han:()=>new m(_("g0LZBC4CBN1GBwBCCaIBPDBle-tGBhC-vUBhoWtLBDpDBpodBBNGBqgkB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Hangul:()=>new m(_("goE-HvxHBiI9CyDeiCei3dckUj9KNWFwBl9JeEFDFDFDC",!0)),Hanifi_Rohingya:()=>new m(_("gojCnBJJ",!0)),Hanunoo:()=>new m(_("g5FU",!0)),Hatran:()=>new m(_("gniCSCBGE",!0)),Hebrew:()=>new m(_("xsB2BBJaBFFBpp9BZBCEBCCCBCCBCCBIB",!1)),Hiragana:()=>new m(_("hiM1CBHCBi7-C+IBTeeBBBulQAB",!1)),Imperial_Aramaic:()=>new m(_("giiCVCI",!0)),Inherited:()=>new m(_("gYvDB2IBBlOKBbhXhXBCB8qEtBBDLBlPCBCMBCGBFHHEBBnG-BBtQBBjGgBB65DDBsDBBmrzBPBRNBwejHjH7iEl+uBl+uBBsBBDWBhRCBSHBDGBfDBz6rYvHB",!1)),Inscriptional_Pahlavi:()=>new m(_("g7iCSGH",!0)),Inscriptional_Parthian:()=>new m(_("g6iCVDH",!0)),Javanese:()=>new m(_("gsqBtCDJFB",!0)),Kaithi:()=>new m(_("gkkCiCLA",!0)),Kannada:()=>new m(_("gkDMCCCWCJCEDICCCDIBGCCDDJCC",!0)),Katakana:()=>new m(_("hlM5CBDCBxHPBxGuBBC3CBvgzBJBCsBBzisBDBCGBCBBCgJgJBBBzBPPBCB",!1)),Kawi:()=>new m(_("g4nCQCoBEc",!0)),Kayah_Li:()=>new m(_("goqBtBCA",!0)),Kharoshthi:()=>new m(_("gwiCDCBGHCCCcDCFJII",!0)),Khitan_Small_Script:()=>new m(_("k-7C84G84GB0OBqBAB",!1)),Khmer:()=>new m(_("g8F9CDJHJnPf",!0)),Khojki:()=>new m(_("gwkCRCuB",!0)),Khudawadi:()=>new m(_("w1kC6BGJ",!0)),Kirat_Rai:()=>new m(_("gq7C5B",!0)),Lao:()=>new m(_("h0DBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDB",!1)),Latin:()=>new m(_("hCZBHZBwBQQGWBCeBCgOBoBEB8wGlBBHwBBGDBGMBClCBiC-HByLOORMBuEBBHccSoBB42CfBj1elDBExCBVOBxZqBBCIBCDB38TGB7gBZBHZBmhCFBCpBBCIBm61BeBHFB",!1)),Lepcha:()=>new m(_("ggH3BEOEC",!0)),Limbu:()=>new m(_("goGeBCLBFLBFEEBKB",!1)),Linear_A:()=>new m(_("gwhC2JKVLH",!0)),Linear_B:()=>new m(_("gggCLCZCSCBCODNjB6D",!0)),Lisu:()=>new m(_("wmpBvBx1eA",!0)),Lycian:()=>new m(_("g0gCc",!0)),Lydian:()=>new m(_("gpiCZGA",!0)),Mahajani:()=>new m(_("wqkCmB",!0)),Makasar:()=>new m(_("g3nCY",!0)),Malayalam:()=>new m(_("goDMCCCyBCCCFFPDZ",!0)),Mandaic:()=>new m(_("giCbDA",!0)),Manichaean:()=>new m(_("g2iCmBFL",!0)),Marchen:()=>new m(_("wjnCfDVCN",!0)),Masaram_Gondi:()=>new m(_("gonCGBCBBCrBBECCBCCBHBJJB",!1)),Medefaidrin:()=>new m(_("gy7C6C",!0)),Meetei_Mayek:()=>new m(_("g3qBWqGtBDJ",!0)),Mende_Kikakui:()=>new m(_("gg6DkGDP",!0)),Meroitic_Cursive:()=>new m(_("gtiCXFTDtB",!0)),Meroitic_Hieroglyphs:()=>new m(_("gsiCf",!0)),Miao:()=>new m(_("g47CqCF4BIQ",!0)),Modi:()=>new m(_("gwlCkCMJ",!0)),Mongolian:()=>new m(_("ggGBBDCCBSBH4CBIqBB2t-BMB",!1)),Mro:()=>new m(_("gy6CeCJFB",!0)),Multani:()=>new m(_("g0kCGBCCCBCBCOBCKB",!1)),Myanmar:()=>new m(_("ggE-EhqmBeiDfxibT",!0)),Nabataean:()=>new m(_("gkiCeJI",!0)),Nag_Mundari:()=>new m(_("wm5DpB",!0)),Nandinagari:()=>new m(_("gtmCHDtBDK",!0)),New_Tai_Lue:()=>new m(_("gsGrBFZHKEB",!0)),Newa:()=>new m(_("gglC7CCE",!0)),Nko:()=>new m(_("g+B6BDC",!0)),Nushu:()=>new m(_("h-7CvsQvsQBqMB",!1)),Nyiakeng_Puachue_Hmong:()=>new m(_("go4DsBENDJFB",!0)),Ogham:()=>new m(_("g0Fc",!0)),Ol_Chiki:()=>new m(_("wiHvB",!0)),Ol_Onal:()=>new m(_("wu5DqBFA",!0)),Old_Hungarian:()=>new m(_("gkjCyBOyBIF",!0)),Old_Italic:()=>new m(_("g4gCjBKC",!0)),Old_North_Arabian:()=>new m(_("g0iCf",!0)),Old_Permic:()=>new m(_("w6gCqB",!0)),Old_Persian:()=>new m(_("g9gCjBFN",!0)),Old_Sogdian:()=>new m(_("g4jCnB",!0)),Old_South_Arabian:()=>new m(_("gziCf",!0)),Old_Turkic:()=>new m(_("ggjCoC",!0)),Old_Uyghur:()=>new m(_("w7jCZ",!0)),Oriya:()=>new m(_("h4CCCHDBDVCGCBCEDIDBDCICFBCEDR",!0)),Osage:()=>new m(_("wlhCjBFjB",!0)),Osmanya:()=>new m(_("gkhCdDJ",!0)),Pahawh_Hmong:()=>new m(_("g46ClCLJCGCUGS",!0)),Palmyrene:()=>new m(_("gjiCf",!0)),Pau_Cin_Hau:()=>new m(_("g2mC4B",!0)),Phags_Pa:()=>new m(_("giqB3B",!0)),Phoenician:()=>new m(_("goiCbEA",!0)),Psalter_Pahlavi:()=>new m(_("g8iCRIDNG",!0)),Rejang:()=>new m(_("wpqBjBMA",!0)),Runic:()=>new m(_("g1FqCEK",!0)),Samaritan:()=>new m(_("ggCtBDO",!0)),Saurashtra:()=>new m(_("gkqBlCJL",!0)),Sharada:()=>new m(_("gskC-ChsCH",!0)),Shavian:()=>new m(_("wihCvB",!0)),Siddham:()=>new m(_("gslC1BDlB",!0)),Sidetic:()=>new m(_("gqiCZ",!0)),SignWriting:()=>new m(_("gg2DrUQECO",!0)),Sinhala:()=>new m(_("hsDCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBt-gCTB",!1)),Sogdian:()=>new m(_("w5jCpB",!0)),Sora_Sompeng:()=>new m(_("wmkCYIJ",!0)),Soyombo:()=>new m(_("wymCyC",!0)),Sundanese:()=>new m(_("g8G-BhIH",!0)),Sunuwar:()=>new m(_("g+mChBPJ",!0)),Syloti_Nagri:()=>new m(_("ggqBsB",!0)),Syriac:()=>new m(_("g4BNC7BDCxIK",!0)),Tagalog:()=>new m(_("g4FVKA",!0)),Tagbanwa:()=>new m(_("g7FMCCCB",!0)),Tai_Le:()=>new m(_("wqGdDE",!0)),Tai_Tham:()=>new m(_("gxG+BCcDKHJHN",!0)),Tai_Viet:()=>new m(_("g0qBiCZE",!0)),Tai_Yo:()=>new m(_("g25DeCVJB",!0)),Takri:()=>new m(_("g0lC5BHJ",!0)),Tamil:()=>new m(_("i8CBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBm+kCxBBOAB",!1)),Tangsa:()=>new m(_("wz6CuCCJ",!0)),Tangut:()=>new m(_("g-7CgBgBB+3GBhQeBiDyDB",!1)),Telugu:()=>new m(_("ggDMCCCWCPDICCCDIBCCCBDDDJII",!0)),Thaana:()=>new m(_("g8BxB",!0)),Thai:()=>new m(_("hwD5BGb",!0)),Tibetan:()=>new m(_("g4DnCCjBFmBCjBCOCGFB",!0)),Tifinagh:()=>new m(_("wpL3BIBPA",!0)),Tirhuta:()=>new m(_("gklCnCJJ",!0)),Todhri:()=>new m(_("guhCzB",!0)),Tolong_Siki:()=>new m(_("wtnCrBFJ",!0)),Toto:()=>new m(_("w04De",!0)),Tulu_Tigalari:()=>new m(_("g8kCJBCDDClBBCJBCDDCDBCJBCBBJBB",!1)),Ugaritic:()=>new m(_("g8gCdCA",!0)),Unknown:()=>new m(_("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-FB",!1)),Vai:()=>new m(_("gopBrJ",!0)),Vithkuqi:()=>new m(_("wrhCKCOCGCBCKCOCGCB",!0)),Wancho:()=>new m(_("g24D5BGA",!0)),Warang_Citi:()=>new m(_("glmCyCNA",!0)),Yezidi:()=>new m(_("g0jCpBCCDB",!0)),Yi:()=>new m(_("ggoBskBE2B",!0)),Zanabazar_Square:()=>new m(_("gwmCnC",!0))})),q(tr,"FOLD_CATEGORIES",new Va({L:()=>new m(_("laA",!0)),LC:()=>new m(_("laA",!0)),Ll:()=>new m(_("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGC3HrBrBCEEJHHCCBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHxC9zC9zCBuBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Lt:()=>new m(_("kOCCBCCBCClBCCtsHHBJHBJHBMQQwBAB",!1)),Lu:()=>new m(_("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpL2B2Bs1CvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1)),M:()=>new m(_("5cgBgBlgHAB",!1)),Mn:()=>new m(_("5cgBgBlgHAB",!1)),Emoji:()=>new m(_("8mJA",!0)),Extended_Pictographic:()=>new m(_("8mJA",!0)),Lowercase:()=>new m(_("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHuBPBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Math:()=>new m(_("ycGDCHHFMMDDDCHHFAB",!1)),Uppercase:()=>new m(_("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpLiBiBBOBFsasaBYBn6BvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1))})),q(tr,"FOLD_SCRIPT",new Va({Common:()=>new m(_("8cgBgB",!1)),Greek:()=>new m(_("1FwUwU",!1)),Inherited:()=>new m(_("5cgBgBlgHAB",!1))})),tr),Te,W=(Te=class{static is32(e,t){let n=0,s=e.length;for(;n<s;){const i=n+Math.floor((s-n)/2),o=e.getLo(i),a=e.getHi(i);if(o<=t&&t<=a){const u=e.getStride(i);return(t-o)%u===0}t<o?s=i:n=i+1}return!1}static is(e,t){if(t<=Te.MAX_LATIN1){for(let n=0;n<e.length;n++){if(t>e.getHi(n))continue;const s=e.getLo(n);if(t<s)return!1;const i=e.getStride(n);return(t-s)%i===0}return!1}return e.length>0&&t>=e.getLo(0)&&Te.is32(e,t)}static isUpper(e){if(e<=Te.MAX_LATIN1){const t=String.fromCodePoint(e);return t.toUpperCase()===t&&t.toLowerCase()!==t}return Te.is(It.Upper,e)}static isPrint(e){return e<=Te.MAX_LATIN1?e>=32&&e<Te.MAX_ASCII||e>=161&&e!==173:Te.is(It.Print,e)}static simpleFold(e){if(It.CASE_ORBIT.has(e))return It.CASE_ORBIT.get(e);const t=k.toLowerCase(e);return t!==e?t:k.toUpperCase(e)}static equalsIgnoreCase(e,t){if(e===t)return!0;if(e<0||t<0)return!1;if(e<=Te.MAX_ASCII&&t<=Te.MAX_ASCII)return 65<=e&&e<=90&&(e|=32),65<=t&&t<=90&&(t|=32),e===t;for(let n=Te.simpleFold(e);n!==e;n=Te.simpleFold(n))if(n===t)return!0;return!1}},q(Te,"MAX_RUNE",1114111),q(Te,"MAX_ASCII",127),q(Te,"MAX_LATIN1",255),q(Te,"MAX_BMP",65535),q(Te,"MIN_FOLD",65),q(Te,"MAX_FOLD",125251),q(Te,"MIN_HIGH_SURROGATE",55296),q(Te,"MAX_HIGH_SURROGATE",56319),q(Te,"MIN_LOW_SURROGATE",56320),q(Te,"MAX_LOW_SURROGATE",57343),q(Te,"MIN_SUPPLEMENTARY_CODE_POINT",65536),Te);const NB=256,Mg=new Uint8Array(NB);for(let r=0;r<NB;r++)Mg[r]=97<=r&&r<=122||65<=r&&r<=90||48<=r&&r<=57||r===95?1:0;let Cl=null,pl=null;var Pe,te=(Pe=class{static emptyInts(){return[]}static isByteArray(e){return Array.isArray(e)||e instanceof Uint8Array}static isalnum(e){return k.CODES.get("0")<=e&&e<=k.CODES.get("9")||k.CODES.get("a")<=e&&e<=k.CODES.get("z")||k.CODES.get("A")<=e&&e<=k.CODES.get("Z")}static unhex(e){return k.CODES.get("0")<=e&&e<=k.CODES.get("9")?e-k.CODES.get("0"):k.CODES.get("a")<=e&&e<=k.CODES.get("f")?e-k.CODES.get("a")+10:k.CODES.get("A")<=e&&e<=k.CODES.get("F")?e-k.CODES.get("A")+10:-1}static escapeRune(e){let t="";if(W.isPrint(e))Pe.METACHARACTERS.indexOf(String.fromCodePoint(e))>=0&&(t+="\\"),t+=String.fromCodePoint(e);else switch(e){case k.CODES.get('"'):t+='\\"';break;case k.CODES.get("\\"):t+="\\\\";break;case k.CODES.get("	"):t+="\\t";break;case k.CODES.get(`
`):t+="\\n";break;case k.CODES.get("\r"):t+="\\r";break;case k.CODES.get("\b"):t+="\\b";break;case k.CODES.get("\f"):t+="\\f";break;default:{let n=e.toString(16);e<256?(t+="\\x",n.length===1&&(t+="0"),t+=n):t+=`\\x{${n}}`;break}}return t}static stringToRunes(e){const t=String(e),n=[];let s=0;for(;s<t.length;){const i=t.codePointAt(s);n.push(i),s+=i>W.MAX_BMP?2:1}return n}static runeToString(e){return String.fromCodePoint(e)}static isWordRune(e){return e<NB?Mg[e]===1:!1}static emptyOpContext(e,t){let n=0;return e<0&&(n|=Pe.EMPTY_BEGIN_TEXT|Pe.EMPTY_BEGIN_LINE),e===10&&(n|=Pe.EMPTY_BEGIN_LINE),t<0&&(n|=Pe.EMPTY_END_TEXT|Pe.EMPTY_END_LINE),t===10&&(n|=Pe.EMPTY_END_LINE),Pe.isWordRune(e)!==Pe.isWordRune(t)?n|=Pe.EMPTY_WORD_BOUNDARY:n|=Pe.EMPTY_NO_WORD_BOUNDARY,n}static quoteMeta(e){return e.split("").map(t=>Pe.METACHARACTERS.indexOf(t)>=0?`\\${t}`:t).join("")}static charCount(e){return e>W.MAX_BMP?2:1}static toArray(e){const t=e.length,n=new Array(t);for(let s=0;s<t;s++)n[s]=e[s];return n}static stringToUtf8ByteArray(e){if(globalThis.TextEncoder)return Cl||(Cl=new TextEncoder),Cl.encode(e);{let t=[],n=0;for(let s=0;s<e.length;s++){let i=e.charCodeAt(s);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===W.MIN_HIGH_SURROGATE&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===W.MIN_LOW_SURROGATE?(i=W.MIN_SUPPLEMENTARY_CODE_POINT+((i&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t}}static utf8ByteArrayToString(e){if(globalThis.TextDecoder){pl||(pl=new TextDecoder("utf-8"));const t=e instanceof Uint8Array?e:new Uint8Array(e);return pl.decode(t)}else{let t=[],n=0,s=0;for(;n<e.length;){let i=e[n++];if(i<128)t[s++]=String.fromCharCode(i);else if(i>191&&i<224){let o=e[n++];t[s++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){let o=e[n++],a=e[n++],u=e[n++],l=((i&7)<<18|(o&63)<<12|(a&63)<<6|u&63)-W.MIN_SUPPLEMENTARY_CODE_POINT;t[s++]=String.fromCharCode(W.MIN_HIGH_SURROGATE+(l>>10)),t[s++]=String.fromCharCode(W.MIN_LOW_SURROGATE+(l&1023))}else{let o=e[n++],a=e[n++];t[s++]=String.fromCharCode((i&15)<<12|(o&63)<<6|a&63)}}return t.join("")}}},q(Pe,"METACHARACTERS","\\.+*?()|[]{}^$"),q(Pe,"EMPTY_BEGIN_LINE",1),q(Pe,"EMPTY_END_LINE",2),q(Pe,"EMPTY_BEGIN_TEXT",4),q(Pe,"EMPTY_END_TEXT",8),q(Pe,"EMPTY_WORD_BOUNDARY",16),q(Pe,"EMPTY_NO_WORD_BOUNDARY",32),q(Pe,"EMPTY_ALL",-1),Pe);const Gg=(r=[],e=0)=>{const t=Object.create(null);for(let n=0;n<r.length;n++){const s=r[n],i=e+n;t[s]=i,t[i]=s}return Object.freeze(t)};var hr,cs=(hr=class{getEncoding(){throw Error("not implemented")}asCharSequence(){throw Error("not implemented")}asBytes(){throw Error("not implemented")}length(){throw Error("not implemented")}isUTF8Encoding(){return this.getEncoding()===hr.Encoding.UTF_8}isUTF16Encoding(){return this.getEncoding()===hr.Encoding.UTF_16}},q(hr,"Encoding",Gg(["UTF_16","UTF_8"])),hr),Ff=class extends cs{constructor(r=null){super(),this.bytes=r}getEncoding(){return cs.Encoding.UTF_8}asCharSequence(){return te.utf8ByteArrayToString(this.bytes)}asBytes(){return this.bytes}length(){return this.bytes.length}},By=class extends cs{constructor(r=null){super(),this.charSequence=r}getEncoding(){return cs.Encoding.UTF_16}asCharSequence(){return this.charSequence}asBytes(){return te.stringToUtf8ByteArray(this.charSequence.toString())}length(){return this.charSequence.length}},Qr=class{static utf16(r){return new By(r)}static utf8(r){return te.isByteArray(r)?new Ff(r):new Ff(te.stringToUtf8ByteArray(r))}},gt=class{static EOF(){return-8}constructor(){this.end=0}canCheckPrefix(){return!0}endPos(){return this.end}hasString(){return!1}hasAnyString(){return!1}prefixLength(){return 0}},hy=class extends gt{constructor(r,e=0,t=r.length){super(),this.bytes=r,this.start=e,this.end=t}hasString(r,e){const t=r.bytes;if(t.length===0)return!0;const n=this.indexOf(this.bytes,t,this.start+e);return n!==-1&&n<=this.end-t.length}hasAnyString(r,e){return r.ac8?r.ac8.searchUTF8(this.bytes,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return gt.EOF();const e=this.bytes[r]&255;if(e<128)return e<<3|1;if(e>=194&&e<=223&&r+1<this.end){const t=this.bytes[r+1]&255;return(t&192)!==128?e<<3|1:((e&31)<<6|t&63)<<3|2}else if(e>=224&&e<=239&&r+2<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;return(n&192)!==128?e<<3|1:((e&15)<<12|(t&63)<<6|n&63)<<3|3}else if(e>=240&&e<=244&&r+3<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;if((n&192)!==128)return e<<3|1;const s=this.bytes[r+3]&255;return(s&192)!==128?e<<3|1:((e&7)<<18|(t&63)<<12|(n&63)<<6|s&63)<<3|4}else return e<<3|1}index(r,e){e+=this.start;const t=this.indexOf(this.bytes,r.prefixUTF8,e);return t<0?t:t-e}context(r){r+=this.start;let e=-1;if(r>this.start&&r<=this.end){let n=r-1;if(e=this.bytes[n--],e>=128){let s=r-4;for(s<this.start&&(s=this.start);n>=s&&(this.bytes[n]&192)===128;)n--;n<this.start&&(n=this.start),e=this.step(n-this.start)>>3}}const t=r<this.end?this.step(r-this.start)>>3:-1;return te.emptyOpContext(e,t)}indexOf(r,e,t=0){let n=e.length;if(n===0)return t<=this.end?t:-1;const s=e[0];let i=this.end-n;const o=typeof r.indexOf=="function";let a=t;for(;a<=i;){if(o){if(a=r.indexOf(s,a),a===-1||a>i)return-1}else{for(;a<=i&&r[a]!==s;)a++;if(a>i)return-1}let u=!0;for(let l=1;l<n;l++)if(r[a+l]!==e[l]){u=!1;break}if(u)return a;a++}return-1}prefixLength(r){return r.prefixUTF8.length}},dy=class extends gt{constructor(r,e=0,t=r.length){super(),this.charSequence=r,this.start=e,this.end=t}hasString(r,e){const t=this.charSequence.indexOf(r.str,this.start+e);return t!==-1&&t<=this.end-r.str.length}hasAnyString(r,e){return r.ac16?r.ac16.searchUTF16(this.charSequence,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return gt.EOF();const e=this.charSequence.charCodeAt(r);if(e<W.MIN_HIGH_SURROGATE||e>W.MAX_HIGH_SURROGATE||r+1>=this.end)return e<<3|1;const t=this.charSequence.charCodeAt(r+1);return t>=W.MIN_LOW_SURROGATE&&t<=W.MAX_LOW_SURROGATE?(e-W.MIN_HIGH_SURROGATE)*1024+(t-W.MIN_LOW_SURROGATE)+W.MIN_SUPPLEMENTARY_CODE_POINT<<3|2:e<<3|1}index(r,e){e+=this.start;const t=this.charSequence.indexOf(r.prefix,e);return t<0||t>this.end-r.prefix.length?-1:t-e}context(r){r+=this.start;const e=r>this.start&&r<=this.end?this.charSequence.charCodeAt(r-1):-1,t=r<this.end?this.charSequence.charCodeAt(r):-1;return te.emptyOpContext(e,t)}prefixLength(r){return r.prefix.length}},Se=class{static fromUTF8(r,e=0,t=r.length){return new hy(r,e,t)}static fromUTF16(r,e=0,t=r.length){return new dy(r,e,t)}},Zo=class extends Error{constructor(r){super(r),this.name="RE2JSException"}},Re=class extends Zo{constructor(r,e=null){let t=`error parsing regexp: ${r}`;e&&(t+=`: \`${e}\``),super(t),this.name="RE2JSSyntaxException",this.message=t,this.error=r,this.input=e}getDescription(){return this.error}getPattern(){return this.input}},fy=class extends Zo{constructor(r){super(r),this.name="RE2JSCompileException"}},Et=class extends Zo{constructor(r){super(r),this.name="RE2JSGroupException"}},Cy=class extends Zo{constructor(r){super(r),this.name="RE2JSFlagsException"}},fo=class extends Zo{constructor(r){super(r),this.name="RE2JSInternalException"}},es,kf=(es=class{static quoteReplacement(e,t=!1){return t?e.indexOf("\\")<0&&e.indexOf("$")<0?e:e.split("").map(n=>{const s=n.codePointAt(0);return s===k.CODES.get("\\")||s===k.CODES.get("$")?`\\${n}`:n}).join(""):e.indexOf("$")<0?e:e.split("").map(n=>n.codePointAt(0)===k.CODES.get("$")?"$$":n).join("")}constructor(e,t){if(e===null)throw new Error("pattern is null");this.patternInput=e;const n=this.patternInput.re2();this.patternGroupCount=n.numberOfCapturingGroups(),this.groups=[],this.namedGroups=n.namedGroups,this.numberOfInstructions=n.numberOfInstructions(),t instanceof cs?this.resetMatcherInput(t):te.isByteArray(t)?this.resetMatcherInput(Qr.utf8(t)):this.resetMatcherInput(Qr.utf16(t))}pattern(){return this.patternInput}reset(){return this.matcherInputLength=this.matcherInput.length(),this.appendPos=0,this.hasMatch=!1,this.hasGroups=!1,this.anchorFlag=0,this}resetMatcherInput(e){if(e===null)throw new Error("input is null");return e instanceof cs||(te.isByteArray(e)?e=Qr.utf8(e):e=Qr.utf16(e)),this.matcherInput=e,this.reset(),this}start(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new Et(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e]}end(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new Et(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e+1]}programSize(){return this.numberOfInstructions}group(e=0){if(typeof e=="string"){const s=this.namedGroups[e];if(!Number.isFinite(s))throw new Et(`group '${e}' not found`);e=s}const t=this.start(e),n=this.end(e);return t<0&&n<0?null:this.substring(t,n)}getNamedGroups(){if(!this.hasMatch)throw new Et("perhaps no match attempted");const e=Object.create(null);for(const t of Object.keys(this.namedGroups))e[t]=this.group(t);return e}groupCount(){return this.patternGroupCount}loadGroup(e){if(e<0||e>this.patternGroupCount)throw new Et(`Group index out of bounds: ${e}`);if(!this.hasMatch)throw new Et("perhaps no match attempted");if(e===0||this.hasGroups)return;const t=this.matcherInputLength,n=this.patternInput.re2().matchMachineInput(this.matcherInput,this.groups[0],t,this.anchorFlag,1+this.patternGroupCount);if(!n[0])throw new Et("inconsistency in matching group data");this.groups=n[1],this.hasGroups=!0}matches(){return this.genMatch(0,M.ANCHOR_BOTH)}lookingAt(){return this.genMatch(0,M.ANCHOR_START)}find(e=null){if(e!==null){if(e<0||e>this.matcherInputLength)throw new Et(`start index out of bounds: ${e}`);return this.reset(),this.genMatch(e,0)}if(e=0,this.hasMatch&&(e=this.groups[1],this.groups[0]===this.groups[1])){const t=(this.matcherInput.isUTF16Encoding()?Se.fromUTF16(this.matcherInput.asCharSequence(),0,this.matcherInputLength):Se.fromUTF8(this.matcherInput.asBytes(),0,this.matcherInputLength)).step(e);t<0?e++:e+=t&7}return this.genMatch(e,M.UNANCHORED)}genMatch(e,t){const n=this.patternInput.re2().matchMachineInput(this.matcherInput,e,this.matcherInputLength,t,1);return n[0]?(this.groups=n[1],this.hasMatch=!0,this.hasGroups=this.patternGroupCount===0,this.anchorFlag=t,!0):(this.hasMatch=!1,!1)}substring(e,t){return this.matcherInput.isUTF8Encoding()?te.utf8ByteArrayToString(this.matcherInput.asBytes().slice(e,t)):this.matcherInput.asCharSequence().substring(e,t).toString()}inputLength(){return this.matcherInputLength}appendReplacement(e,t=!1){let n="";const s=this.start(),i=this.end();return this.appendPos<s&&(n+=this.substring(this.appendPos,s)),this.appendPos=i,n+=t?this.appendReplacementInternalJava(e):this.appendReplacementInternalJs(e),n}appendReplacementInternalJava(e){let t="",n=0;const s=e.length;let i=0;for(;i<s;){const o=e.codePointAt(i);if(o===k.CODES.get("\\")){if(n<i&&(t+=e.substring(n,i)),i++,i>=s)throw new Et("character to be escaped is missing");n=i,i++;continue}if(o===k.CODES.get("$")){if(n<i&&(t+=e.substring(n,i)),i+1>=s)throw new Et("Illegal group reference: group index is missing");const a=e.codePointAt(i+1);if(k.CODES.get("0")<=a&&a<=k.CODES.get("9")){let u=a-k.CODES.get("0"),l=i+2;for(;l<s;l++){const d=e.codePointAt(l);if(d<k.CODES.get("0")||d>k.CODES.get("9")||u*10+d-k.CODES.get("0")>this.patternGroupCount)break;u=u*10+d-k.CODES.get("0")}if(u>this.patternGroupCount)throw new Et(`n > number of groups: ${u}`);const B=this.group(u);B!==null&&(t+=B),i=l,n=i}else if(a===k.CODES.get("{")){let u=i+2;for(;u<s&&e.codePointAt(u)!==k.CODES.get("}");)u++;if(u>=s)throw new Et("named capture group is missing trailing '}'");const l=e.substring(i+2,u),B=this.group(l);B!==null&&(t+=B),i=u+1,n=i}else throw new Et("Illegal group reference");continue}i++}return n<s&&(t+=e.substring(n,s)),t}appendReplacementInternalJs(e){let t="",n=0;const s=e.length;for(let i=0;i<s-1;i++)if(e.codePointAt(i)===k.CODES.get("$")){let o=e.codePointAt(i+1);if(k.CODES.get("$")===o){n<i&&(t+=e.substring(n,i)),t+="$",i++,n=i+1;continue}else if(k.CODES.get("&")===o){n<i&&(t+=e.substring(n,i));const a=this.group(0);a!==null?t+=a:t+="$&",i++,n=i+1;continue}else if(k.CODES.get("`")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(0,this.start(0)),i++,n=i+1;continue}else if(k.CODES.get("'")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(this.end(0),this.matcherInputLength),i++,n=i+1;continue}else if(k.CODES.get("1")<=o&&o<=k.CODES.get("9")){let a=o-k.CODES.get("0");for(n<i&&(t+=e.substring(n,i)),i+=2;i<s&&(o=e.codePointAt(i),!(o<k.CODES.get("0")||o>k.CODES.get("9")||a*10+o-k.CODES.get("0")>this.patternGroupCount));i++)a=a*10+o-k.CODES.get("0");if(a>this.patternGroupCount){t+=`$${a}`,n=i,i--;continue}const u=this.group(a);u!==null&&(t+=u),n=i,i--;continue}else if(o===k.CODES.get("<")){n<i&&(t+=e.substring(n,i)),i++;let a=i+1;for(;a<e.length&&e.codePointAt(a)!==k.CODES.get(">")&&e.codePointAt(a)!==k.CODES.get(" ");)a++;if(a===e.length||e.codePointAt(a)!==k.CODES.get(">")){t+=e.substring(i-1,a+1),n=a+1,i=a;continue}const u=e.substring(i+1,a);if(Object.prototype.hasOwnProperty.call(this.namedGroups,u)){const l=this.group(u);l!==null&&(t+=l)}else t+=`$<${u}>`;n=a+1,i=a;continue}}return n<s&&(t+=e.substring(n,s)),t}appendTail(){return this.substring(this.appendPos,this.matcherInputLength)}replaceAll(e,t=!1){return this.replace(e,!0,t)}replaceFirst(e,t=!1){return this.replace(e,!1,t)}replace(e,t=!0,n=!1){let s="";this.reset();const i=typeof e=="function",o=Object.keys(this.namedGroups).length>0;let a=null;if(i){if(this.groupCount()>=es.MAX_REPLACER_ARGS)throw new Et("Too many capture groups to safely invoke replacer function");a=this.matcherInput.isUTF8Encoding()?this.matcherInput.asBytes():this.matcherInput.asCharSequence()}for(;this.find()&&(s+=i?this.appendReplacementFunc(e,o,a):this.appendReplacement(e,n),!!t););return s+=this.appendTail(),s}appendReplacementFunc(e,t,n){let s="";const i=this.start(),o=this.end();this.appendPos<i&&(s+=this.substring(this.appendPos,i)),this.appendPos=o;const a=this.buildReplacerArgs(i,t,n);return s+=String(e(...a)),s}buildReplacerArgs(e,t,n){const s=[this.group(0)],i=this.groupCount();for(let o=1;o<=i;o++){const a=this.start(o);a<0?s.push(void 0):s.push(this.substring(a,this.end(o)))}if(s.push(e),s.push(n),t){const o=this.getNamedGroups();for(const a in o)o[a]===null&&(o[a]=void 0);s.push(o)}return s}},q(es,"MAX_REPLACER_ARGS",65535),es),fe,L=(fe=class{static isRuneOp(e){return fe.RUNE<=e&&e<=fe.RUNE_ANY_NOT_NL}static escapeRunes(e){let t='"';for(let n of e)t+=te.escapeRune(n);return t+='"',t}constructor(e){this.op=e,this.out=0,this.arg=0,this.runes=[],this.next=null}matchRune(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&M.FOLD_CASE?W.equalsIgnoreCase(o,e):e===o}const t=this.runes.length;if(t===0)return!1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return!1;if(e<=this.runes[o+1])return!0}return!1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]}matchRunePos(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&M.FOLD_CASE?W.equalsIgnoreCase(o,e)?0:-1:e===o?0:-1}const t=this.runes.length;if(t===0)return-1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return-1;if(e<=this.runes[o+1])return Math.floor(o/2)}return-1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]?i:-1}toString(){switch(this.op){case fe.ALT:return`alt -> ${this.out}, ${this.arg}`;case fe.ALT_MATCH:return`altmatch -> ${this.out}, ${this.arg}`;case fe.CAPTURE:return`cap ${this.arg} -> ${this.out}`;case fe.EMPTY_WIDTH:return`empty ${this.arg} -> ${this.out}`;case fe.MATCH:return`match${this.arg!==0?` ${this.arg}`:""}`;case fe.FAIL:return"fail";case fe.NOP:return`nop -> ${this.out}`;case fe.LB_WRITE:return`lbwrite ${this.arg} -> ${this.out}`;case fe.LB_CHECK:return`lbcheck ${this.arg} -> ${this.out}`;case fe.RUNE:return this.runes===null?"rune <null>":["rune ",fe.escapeRunes(this.runes),this.arg&M.FOLD_CASE?"/i":""," -> ",this.out].join("");case fe.RUNE1:return`rune1 ${fe.escapeRunes(this.runes)} -> ${this.out}`;case fe.RUNE_ANY:return`any -> ${this.out}`;case fe.RUNE_ANY_NOT_NL:return`anynotnl -> ${this.out}`;default:throw new Error("unhandled case in Inst.toString")}}},q(fe,"ALT",1),q(fe,"ALT_MATCH",2),q(fe,"CAPTURE",3),q(fe,"EMPTY_WIDTH",4),q(fe,"FAIL",5),q(fe,"MATCH",6),q(fe,"NOP",7),q(fe,"RUNE",8),q(fe,"RUNE1",9),q(fe,"RUNE_ANY",10),q(fe,"RUNE_ANY_NOT_NL",11),q(fe,"LB_WRITE",12),q(fe,"LB_CHECK",13),fe),Lf=class{constructor(r){this.sparse=new Int32Array(r),this.densePcs=new Int32Array(r),this.denseCaps=null,this.size=0,this.ncap=0}init(r){this.ncap=r;const e=this.densePcs.length*r;(!this.denseCaps||this.denseCaps.length<e)&&(this.denseCaps=new Int32Array(e))}contains(r){const e=this.sparse[r];return e<this.size&&this.densePcs[e]===r}isEmpty(){return this.size===0}add(r){const e=this.size++;return this.sparse[r]=e,this.densePcs[e]=r,e}clear(){this.size=0}toString(){let r="{";for(let e=0;e<this.size;e++)e!==0&&(r+=", "),r+=this.densePcs[e];return r+="}",r}},py=class Jl{static fromRE2(e){const t=new Jl;return t.prog=e.prog,t.re2=e,t.q0=new Lf(t.prog.numInst()),t.q1=new Lf(t.prog.numInst()),t.matched=!1,t.matchcap=new Int32Array(t.prog.numCap<2?2:t.prog.numCap),t.ncap=0,t}static fromMachine(e){return Jl.fromRE2(e.re2)}constructor(){this.prog=null,this.re2=null,this.q0=null,this.q1=null,this.matched=!1,this.matchcap=null,this.ncap=0,this.lbTable=null}init(e){this.ncap=e,e>this.matchcap.length?this.matchcap=new Int32Array(e).fill(-1):this.matchcap.fill(-1),this.q0.init(e),this.q1.init(e),this.prog.numLb>0&&((!this.lbTable||this.lbTable.length<this.prog.numLb+1)&&(this.lbTable=new Int32Array(this.prog.numLb+1)),this.lbTable.fill(-1))}submatches(){return this.ncap===0?te.emptyInts():te.toArray(this.matchcap.subarray(0,this.ncap))}match(e,t,n){const s=this.re2.cond;if(s===te.EMPTY_ALL||(n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&t!==0)return!1;this.matched=!1,this.matchcap.fill(-1);let i=this.prog.numLb>0?0:t,o=t,a=this.q0,u=this.q1,l=e.step(i),B=l>>3,d=l&7,C=-1,g=0;l!==gt.EOF()&&(l=e.step(i+d),C=l>>3,g=l&7);let D;for(i===0?D=te.emptyOpContext(-1,B):D=e.context(i);;){if(a.isEmpty()){if(s&te.EMPTY_BEGIN_TEXT&&i!==0||(n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&i!==0||this.matched)break;if(this.prog.numLb===0&&this.re2.prefix.length!==0&&C!==this.re2.prefixRune&&e.canCheckPrefix()){const J=e.index(this.re2,i);if(J<0)break;i+=J,l=e.step(i),B=l>>3,d=l&7,l=e.step(i+d),C=l>>3,g=l&7,D=e.context(i)}}if(i===0&&this.prog.numLb>0)for(let J=0;J<this.prog.lbStarts.length;J++)this.add(a,this.prog.lbStarts[J],i,this.matchcap,0,D);!this.matched&&(i===0||n===M.UNANCHORED)&&i>=o&&(this.ncap>0&&(this.matchcap[0]=i),this.add(a,this.prog.start,i,this.matchcap,0,D));const P=i+d;if(D=e.context(P),this.step(a,u,i,P,B,D,n,i===e.endPos()),d===0||this.ncap===0&&this.matched)break;i+=d,B=C,d=g,B!==-1&&(l=e.step(i+d),C=l>>3,g=l&7);const x=a;a=u,u=x}return u.clear(),this.matched}matchSet(e,t,n){const s=this.re2.cond;if(s===te.EMPTY_ALL)return[];if((n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&t!==0)return[];let i=this.prog.numLb>0?0:t,o=t,a=this.q0,u=this.q1,l=e.step(i),B=l>>3,d=l&7,C=-1,g=0;l!==gt.EOF()&&(l=e.step(i+d),C=l>>3,g=l&7);let D=i===0?te.emptyOpContext(-1,B):e.context(i);const P=new Set;for(;!(a.isEmpty()&&(s&te.EMPTY_BEGIN_TEXT&&i!==0||(n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&i!==0));){if(i===0&&this.prog.numLb>0)for(let X=0;X<this.prog.lbStarts.length;X++)this.add(a,this.prog.lbStarts[X],i,this.matchcap,0,D);(i===0||n===M.UNANCHORED)&&i>=o&&this.add(a,this.prog.start,i,this.matchcap,0,D);const x=i+d;D=e.context(x);for(let X=0;X<a.size;X++){const Z=a.densePcs[X],se=this.prog.inst[Z],ue=X*this.ncap;let ae=!1;switch(se.op){case L.MATCH:if(n===M.ANCHOR_BOTH&&i!==e.endPos())break;P.add(se.arg);break;case L.RUNE:ae=se.matchRune(B);break;case L.RUNE1:ae=B===se.runes[0];break;case L.RUNE_ANY:ae=!0;break;case L.RUNE_ANY_NOT_NL:ae=B!==10;break;default:continue}ae&&this.add(u,se.out,x,a.denseCaps,ue,D)}if(a.clear(),d===0)break;i+=d,B=C,d=g,B!==-1&&(l=e.step(i+d),C=l>>3,g=l&7);const J=a;a=u,u=J}return u.clear(),Array.from(P).sort((x,J)=>x-J)}step(e,t,n,s,i,o,a,u){const l=this.re2.longest;for(let B=0;B<e.size;B++){const d=e.densePcs[B],C=B*this.ncap;if(l&&this.matched&&this.ncap>0&&this.matchcap[0]<e.denseCaps[C])continue;const g=this.prog.inst[d];let D=!1;switch(g.op){case L.MATCH:if(a===M.ANCHOR_BOTH&&!u)break;if(this.ncap>0&&(!l||!this.matched||this.matchcap[1]<n)){e.denseCaps[C+1]=n;for(let P=0;P<this.ncap;P++)this.matchcap[P]=e.denseCaps[C+P]}l||(e.size=0),this.matched=!0;break;case L.RUNE:D=g.matchRune(i);break;case L.RUNE1:D=i===g.runes[0];break;case L.RUNE_ANY:D=!0;break;case L.RUNE_ANY_NOT_NL:D=i!==10;break;default:continue}D&&this.add(t,g.out,s,e.denseCaps,C,o)}e.clear()}add(e,t,n,s,i,o){for(;;){if(t===0||e.contains(t))return;const a=e.add(t),u=this.prog.inst[t];switch(u.op){case L.FAIL:return;case L.ALT:case L.ALT_MATCH:this.add(e,u.out,n,s,i,o),t=u.arg;continue;case L.EMPTY_WIDTH:if(!(u.arg&~o)){t=u.out;continue}return;case L.NOP:t=u.out;continue;case L.CAPTURE:if(u.arg<this.ncap){const l=s[i+u.arg];s[i+u.arg]=n,this.add(e,u.out,n,s,i,o),s[i+u.arg]=l;return}else{t=u.out;continue}case L.LB_WRITE:this.lbTable[Math.abs(u.arg)]=n,t=u.out;continue;case L.LB_CHECK:if(u.arg>0){if(this.lbTable[u.arg]===n){t=u.out;continue}}else if(this.lbTable[-u.arg]!==n){t=u.out;continue}return;case L.MATCH:case L.RUNE:case L.RUNE1:case L.RUNE_ANY:case L.RUNE_ANY_NOT_NL:if(this.ncap>0){const l=a*this.ncap;for(let B=0;B<this.ncap;B++)e.denseCaps[l+B]=s[i+B]}return;default:throw new fo("unhandled")}}}};const xf=r=>{let e=-2128831035;for(let t=0;t<r.length;t++)e^=r[t],e=Math.imul(e,16777619);return e},gy=(r,e)=>{if(r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0};var my=class{constructor(r,e,t=[]){this.nfaStates=r,this.isMatch=e,this.matchIDs=t,this.nextLatin1=new Array(W.MAX_LATIN1+1).fill(null),this.nextLatin1Anchored=new Array(W.MAX_LATIN1+1).fill(null),this.transKeys=[],this.transVals=[],this.lastSeen=0}},En,_y=(En=class{constructor(e,t=8388608){this.prog=e,this.stateCache=new Map,this.stateCount=0,this.startState=null,this.stateLimit=Math.max(1,Math.floor(t/En.STATE_MEMORY_ESTIMATE)),this.cacheClears=0,this.failed=!1,this.clock=0}computeClosure(e){const t=new Set,n=[...e];let s=!1;const i=[];for(;n.length>0;){const a=n.pop();if(t.has(a))continue;t.add(a);const u=this.prog.getInst(a);switch(u.op){case L.MATCH:s=!0,i.includes(u.arg)||i.push(u.arg);break;case L.ALT:case L.ALT_MATCH:n.push(u.out),n.push(u.arg);break;case L.NOP:case L.CAPTURE:n.push(u.out);break;case L.EMPTY_WIDTH:case L.LB_WRITE:case L.LB_CHECK:return null}}const o=Int32Array.from(t).sort();return i.sort((a,u)=>a-u),{pcs:o,isMatch:s,matchIDs:i}}getState(e){const t=this.computeClosure(e);if(!t)return null;const n=t.pcs,s=xf(n);let i=this.stateCache.get(s);if(i)for(let a=0;a<i.length;a++){const u=i[a];if(gy(u.nfaStates,n))return u.lastSeen=++this.clock,u}else i=[],this.stateCache.set(s,i);if(this.failed)return null;if(this.stateCount>=this.stateLimit){if(this.cacheClears++,this.cacheClears>=En.MAX_CACHE_CLEARS)return this.failed=!0,this.stateCache.clear(),this.stateCount=0,this.startState=null,null;this.evictCache(),i=this.stateCache.get(s),i||(i=[],this.stateCache.set(s,i))}const o=new my(n,t.isMatch,t.matchIDs);return o.lastSeen=++this.clock,i.push(o),this.stateCount++,o}evictCache(){const e=[];for(const o of this.stateCache.values())for(let a=0;a<o.length;a++)e.push(o[a]);e.sort((o,a)=>o.lastSeen-a.lastSeen);const t=Math.max(1,Math.floor(this.stateLimit/2)),n=e.length-t,s=e.slice(n),i=new Set(s);this.stateCache.clear(),this.stateCount=0;for(let o=0;o<s.length;o++){const a=s[o];a.nextLatin1.fill(null),a.nextLatin1Anchored.fill(null),a.transKeys.length=0,a.transVals.length=0;const u=xf(a.nfaStates);let l=this.stateCache.get(u);l||(l=[],this.stateCache.set(u,l)),l.push(a),this.stateCount++}this.startState&&!i.has(this.startState)&&(this.startState=null)}step(e,t,n){if(t<=W.MAX_LATIN1)if(n===M.UNANCHORED){const o=e.nextLatin1[t];if(o!==null)return o}else{const o=e.nextLatin1Anchored[t];if(o!==null)return o}else{const o=t+(n===M.UNANCHORED?0:W.MAX_RUNE+1),a=e.transKeys,u=a.length;for(let l=0;l<u;l++)if(a[l]===o)return e.transVals[l]}const s=[];for(let o=0;o<e.nfaStates.length;o++){const a=e.nfaStates[o],u=this.prog.getInst(a);L.isRuneOp(u.op)&&u.matchRune(t)&&s.push(u.out)}n===M.UNANCHORED&&s.push(this.prog.start);const i=this.getState(s);if(t<=W.MAX_LATIN1)n===M.UNANCHORED?e.nextLatin1[t]=i:e.nextLatin1Anchored[t]=i;else{const o=t+(n===M.UNANCHORED?0:W.MAX_RUNE+1);e.transKeys.push(o),e.transVals.push(i)}return i}match(e,t,n){if((n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&t!==0)return!1;if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;if(i.isMatch)if(n===M.ANCHOR_BOTH){if(t===s)return!0}else return!0;let o=t;for(;o<s;){const a=e.step(o),u=a>>3,l=a&7;if(l===0)break;if(i=n===M.UNANCHORED&&u<=W.MAX_LATIN1&&i.nextLatin1[u]||this.step(i,u,n),i===null)return null;if(i.lastSeen=++this.clock,i.isMatch)if(n===M.ANCHOR_BOTH){if(o+l===s)return!0}else return!0;if(i.nfaStates.length===0&&n!==M.UNANCHORED)return!1;o+=l}return!1}matchSet(e,t,n){if((n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&t!==0)return[];if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;const o=new Set,a=(l,B)=>{l.isMatch&&(n===M.ANCHOR_BOTH?B===s&&l.matchIDs.forEach(d=>o.add(d)):l.matchIDs.forEach(d=>o.add(d)))};a(i,t);let u=t;for(;u<s;){const l=e.step(u),B=l>>3,d=l&7;if(d===0)break;if(i=n===M.UNANCHORED&&B<=W.MAX_LATIN1&&i.nextLatin1[B]||this.step(i,B,n),i===null)return null;if(i.lastSeen=++this.clock,u+=d,a(i,u),i.nfaStates.length===0&&n!==M.UNANCHORED)break}return Array.from(o).sort((l,B)=>l-B)}},q(En,"MAX_CACHE_CLEARS",5),q(En,"STATE_MEMORY_ESTIMATE",838),En);const Ey=32,Iy=500,gl=256,Dy=256*1024;var wy=class{constructor(){this.end=0,this.cap=new Int32Array(0),this.matchcap=new Int32Array(0),this.ncap=0,this.jobPc=new Int32Array(gl),this.jobArg=new Uint8Array(gl),this.jobPos=new Int32Array(gl),this.jobLen=0,this.visited=new Uint32Array(0)}reset(r,e,t){this.end=e,this.jobLen=0,this.ncap=t;const n=r.numInst()*(e+1)+Ey-1>>>5;this.visited.length<n?this.visited=new Uint32Array(n):this.visited.fill(0,0,n),this.cap.length<t?this.cap=new Int32Array(t).fill(-1):this.cap.fill(-1,0,t),this.matchcap.length<t?this.matchcap=new Int32Array(t).fill(-1):this.matchcap.fill(-1,0,t)}shouldVisit(r,e){const t=r*(this.end+1)+e,n=t>>>5,s=1<<(t&31);return this.visited[n]&s?!1:(this.visited[n]|=s,!0)}push(r,e,t,n){if(r.prog.getInst(e).op!==L.FAIL&&(n||this.shouldVisit(e,t))){if(this.jobLen>=this.jobPc.length){const s=this.jobPc.length*2,i=new Int32Array(s);i.set(this.jobPc),this.jobPc=i;const o=new Uint8Array(s);o.set(this.jobArg),this.jobArg=o;const a=new Int32Array(s);a.set(this.jobPos),this.jobPos=a}this.jobPc[this.jobLen]=e,this.jobArg[this.jobLen]=n?1:0,this.jobPos[this.jobLen]=t,this.jobLen++}}tryBacktrack(r,e,t,n,s){const i=r.longest;for(this.push(r,t,n,!1);this.jobLen>0;){this.jobLen--;let o=this.jobPc[this.jobLen],a=this.jobArg[this.jobLen]===1,u=this.jobPos[this.jobLen],l=!0;for(;!(!l&&!this.shouldVisit(o,u));){l=!1;const B=r.prog.getInst(o);switch(B.op){case L.FAIL:throw new fo("unexpected InstFail");case L.ALT:if(a){a=!1,o=B.arg;continue}else{this.push(r,o,u,!0),o=B.out;continue}case L.ALT_MATCH:{const d=r.prog.getInst(B.out);if(L.isRuneOp(d.op)){this.push(r,B.arg,u,!1),o=B.arg,u=this.end;continue}this.push(r,B.out,this.end,!1),o=B.out;continue}case L.RUNE:{const d=e.step(u);if(d===gt.EOF()||!B.matchRune(d>>3))break;u+=d&7,o=B.out;continue}case L.RUNE1:{const d=e.step(u);if(d===gt.EOF()||d>>3!==B.runes[0])break;u+=d&7,o=B.out;continue}case L.RUNE_ANY_NOT_NL:{const d=e.step(u);if(d===gt.EOF()||d>>3===10)break;u+=d&7,o=B.out;continue}case L.RUNE_ANY:{const d=e.step(u);if(d===gt.EOF())break;u+=d&7,o=B.out;continue}case L.CAPTURE:if(a){this.cap[B.arg]=u;break}else{B.arg<this.ncap&&(this.push(r,o,this.cap[B.arg],!0),this.cap[B.arg]=u),o=B.out;continue}case L.EMPTY_WIDTH:{const d=e.context(u);if(B.arg&~d)break;o=B.out;continue}case L.NOP:o=B.out;continue;case L.MATCH:{if(s===M.ANCHOR_BOTH&&u!==this.end)break;if(this.ncap===0)return!0;this.ncap>1&&(this.cap[1]=u);const d=this.matchcap[1];if((d===-1||i&&u>0&&u>d)&&this.matchcap.set(this.cap),!i||u===this.end)return!0;break}case L.LB_WRITE:case L.LB_CHECK:throw new fo("Backtracker cannot evaluate Lookbehind instructions");default:throw new fo("bad inst")}break}}return i&&this.matchcap.length>1&&this.matchcap[1]>=0}};const Ma=[];var Ga=class Ug{static shouldBacktrack(e){return e.numInst()<=Iy}static maxBitStateLen(e){return Ug.shouldBacktrack(e)?Math.floor(Dy/e.numInst()):0}static execute(e,t,n,s,i){const o=e.cond;if(o===te.EMPTY_ALL||(s===M.ANCHOR_START||s===M.ANCHOR_BOTH)&&n!==0||o&te.EMPTY_BEGIN_TEXT&&n!==0)return null;const a=Ma.length>0?Ma.pop():new wy,u=t.endPos();a.reset(e.prog,u,i);let l=!1;if(o&te.EMPTY_BEGIN_TEXT||s===M.ANCHOR_START||s===M.ANCHOR_BOTH)a.ncap>0&&(a.cap[0]=n),a.tryBacktrack(e,t,e.prog.start,n,s)&&(l=!0);else{let d=-1;for(;n<=u&&d!==0;n+=d){if(e.prefix.length>0){const g=t.index(e,n);if(g<0)break;n+=g}if(a.ncap>0&&(a.cap[0]=n),a.tryBacktrack(e,t,e.prog.start,n,s)){l=!0;break}const C=t.step(n);d=C===gt.EOF()?0:C&7}}if(!l)return Ma.push(a),null;const B=i===0?[]:te.toArray(a.matchcap.subarray(0,i));return Ma.push(a),B}},Vf=class{constructor(r){this.sparse=new Uint32Array(r),this.dense=new Uint32Array(r),this.size=0,this.nextIndex=0}empty(){return this.nextIndex>=this.size}next(){return this.dense[this.nextIndex++]}clear(){this.size=0,this.nextIndex=0}contains(r){return r<this.sparse.length&&this.sparse[r]<this.size&&this.dense[this.sparse[r]]===r}insert(r){this.contains(r)||this.insertNew(r)}insertNew(r){r>=this.sparse.length||(this.sparse[r]=this.size,this.dense[this.size]=r,this.size++)}};const yy=(r,e,t,n)=>{const s=r.length,i=e.length;let o=0,a=0;const u=[],l=[];let B=!0,d=-1;const C=g=>{const D=g?r:e,P=g?o:a,x=g?t:n;return d>0&&D[P]<=u[d]?!1:(u.push(D[P],D[P+1]),g?o+=2:a+=2,d+=2,l.push(x),!0)};for(;o<s||a<i;)if(a>=i?B=C(!0):o>=s||e[a]<r[o]?B=C(!1):B=C(!0),!B)return null;return{merged:u,next:l}};var Ty=class{constructor(r){this.start=r.start,this.numCap=r.numCap,this.inst=new Array(r.inst.length);for(let e=0;e<r.inst.length;e++){const t=r.inst[e],n=new L(t.op);n.out=t.out,n.arg=t.arg,n.runes=t.runes?t.runes.slice():[],n.next=null,this.inst[e]=n}}};const Ay=r=>{const e=new Ty(r);for(let t=0;t<e.inst.length;t++){const n=e.inst[t];if(n.op!==L.ALT&&n.op!==L.ALT_MATCH)continue;let s="out",i="arg",o=e.inst[n[i]];if(o.op!==L.ALT&&o.op!==L.ALT_MATCH&&(s="arg",i="out",o=e.inst[n[i]],o.op!==L.ALT&&o.op!==L.ALT_MATCH))continue;const a=e.inst[n[s]];if(a.op===L.ALT||a.op===L.ALT_MATCH)continue;let u="out",l="arg",B=!1;o.out===t?B=!0:o.arg===t&&(B=!0,u="arg",l="out"),B&&(o[u]=n[s]),n[s]===o[u]&&(n[i]=o[l])}return e},Ry=r=>{if(r.inst.length>=1e3)return null;const e=new Vf(r.inst.length),t=new Vf(r.inst.length),n=new Array(r.inst.length),s=new Array(r.inst.length).fill(!1),i=o=>{let a=!0;const u=r.inst[o];if(t.contains(o))return!0;switch(t.insert(o),u.op){case L.ALT:case L.ALT_MATCH:{a=i(u.out)&&i(u.arg);let l=s[u.out],B=s[u.arg];if(l&&B)return!1;if(B){const D=u.out;u.out=u.arg,u.arg=D;const P=l;l=B,B=P}l&&(s[o]=!0,u.op=L.ALT_MATCH);const d=n[u.out]||[],C=n[u.arg]||[],g=yy(d,C,u.out,u.arg);if(!g)return!1;n[o]=g.merged,u.next=new Uint32Array(g.next);break}case L.CAPTURE:case L.EMPTY_WIDTH:case L.NOP:a=i(u.out),s[o]=s[u.out],n[o]=n[u.out]?n[u.out].slice():[],u.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(u.out);break;case L.MATCH:case L.FAIL:s[o]=u.op===L.MATCH;break;case L.RUNE:{if(s[o]=!1,u.next&&u.next.length>0)break;if(e.insert(u.out),!u.runes||u.runes.length===0){n[o]=[],u.next=new Uint32Array([u.out]);break}let l=[];if(u.runes.length===1&&u.arg&M.FOLD_CASE){const B=u.runes[0];l.push(B,B);for(let d=W.simpleFold(B);d!==B;d=W.simpleFold(d))l.push(d,d);l.sort((d,C)=>d-C)}else for(let B=0;B<u.runes.length;B++)l.push(u.runes[B]);n[o]=l,u.next=new Uint32Array(Math.floor(l.length/2)+1).fill(u.out),u.op=L.RUNE;break}case L.RUNE1:{if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out);let l=[];if(u.arg&M.FOLD_CASE){const B=u.runes[0];l.push(B,B);for(let d=W.simpleFold(B);d!==B;d=W.simpleFold(d))l.push(d,d);l.sort((d,C)=>d-C)}else l.push(u.runes[0],u.runes[0]);n[o]=l,u.next=new Uint32Array(Math.floor(l.length/2)+1).fill(u.out),u.op=L.RUNE;break}case L.RUNE_ANY:if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out),n[o]=[0,W.MAX_RUNE],u.next=new Uint32Array([u.out]);break;case L.RUNE_ANY_NOT_NL:if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out),n[o]=[0,9,11,W.MAX_RUNE],u.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(u.out);break}return a};for(e.clear(),e.insert(r.start);!e.empty();)if(t.clear(),!i(e.next()))return null;for(let o=0;o<r.inst.length;o++)n[o]&&(r.inst[o].runes=n[o]);return r},by=(r,e)=>{for(let t=0;t<e.inst.length;t++){const n=e.inst[t];switch(n.op){case L.ALT:case L.ALT_MATCH:case L.RUNE:break;case L.CAPTURE:case L.EMPTY_WIDTH:case L.NOP:case L.MATCH:case L.FAIL:r.inst[t].next=null;break;case L.RUNE1:case L.RUNE_ANY:case L.RUNE_ANY_NOT_NL:r.inst[t].next=null,r.inst[t].op=n.op,r.inst[t].runes=n.runes?n.runes.slice():[];break}}};var Mf=class Hg{static compile(e){if(e.start===0||e.numLb>0)return null;const t=e.inst[e.start];if(t.op!==L.EMPTY_WIDTH||!(t.arg&te.EMPTY_BEGIN_TEXT))return null;let n=!1;for(let i=0;i<e.inst.length;i++)if(e.inst[i].op===L.ALT||e.inst[i].op===L.ALT_MATCH){n=!0;break}for(let i=0;i<e.inst.length;i++){const o=e.inst[i],a=e.inst[o.out].op;switch(o.op){case L.ALT:case L.ALT_MATCH:if(a===L.MATCH||e.inst[o.arg].op===L.MATCH)return null;break;case L.EMPTY_WIDTH:if(a===L.MATCH){if((o.arg&te.EMPTY_END_TEXT)===te.EMPTY_END_TEXT)continue;return null}break;default:if(a===L.MATCH&&n)return null;break}}let s=Ay(e);return s=Ry(s),s!==null&&by(s,e),s}static next(e,t){const n=e.matchRunePos(t);return n>=0?e.next[n]:e.op===L.ALT_MATCH?e.out:0}static execute(e,t,n,s,i){const o=e.onepass;if(!o)return null;const a=new Int32Array(i).fill(-1);let u=!1,l=t.step(n),B=l>>3,d=l&7,C=gt.EOF(),g=-1,D=0;l!==gt.EOF()&&(C=t.step(n+d),C!==gt.EOF()&&(g=C>>3,D=C&7));let P=n===0?te.emptyOpContext(-1,B):t.context(n),x=o.start,J;for(;;){switch(J=o.inst[x],x=J.out,J.op){case L.MATCH:return s===M.ANCHOR_BOTH&&n!==t.endPos()?null:(u=!0,a.length>0&&(a[0]=0,a[1]=n),i===0?[]:te.toArray(a));case L.RUNE:if(!J.matchRune(B))return null;break;case L.RUNE1:if(B!==J.runes[0])return null;break;case L.RUNE_ANY:break;case L.RUNE_ANY_NOT_NL:if(B===10)return null;break;case L.ALT:case L.ALT_MATCH:x=Hg.next(J,B);continue;case L.FAIL:return null;case L.NOP:continue;case L.EMPTY_WIDTH:if(J.arg&~P)return null;continue;case L.CAPTURE:J.arg<a.length&&(a[J.arg]=n);continue;default:throw new fo("bad inst")}if(d===0)break;P=te.emptyOpContext(B,g),n+=d,B=g,d=D,B!==-1&&(C=t.step(n+d),C!==gt.EOF()?(g=C>>3,D=C&7):(g=-1,D=0))}return u?i===0?[]:te.toArray(a):null}},ne,A=(ne=class{static isPseudoOp(e){return e>=ne.Op.LEFT_PAREN}static emptySubs(){return[]}static quoteIfHyphen(e){return e===k.CODES.get("-")?"\\":""}static fromRegexp(e){const t=new ne(e.op);return t.flags=e.flags,t.subs=e.subs,t.runes=e.runes,t.cap=e.cap,t.min=e.min,t.max=e.max,t.name=e.name,t.namedGroups=e.namedGroups,t.lb=e.lb,t}constructor(e){this.op=e,this.flags=0,this.subs=ne.emptySubs(),this.runes=[],this.min=0,this.max=0,this.cap=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}reinit(){this.flags=0,this.subs=ne.emptySubs(),this.runes=[],this.cap=0,this.min=0,this.max=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}toString(){return this.appendTo()}appendTo(){let e="";switch(this.op){case ne.Op.NO_MATCH:e+="[^\\x00-\\x{10FFFF}]";break;case ne.Op.EMPTY_MATCH:e+="(?:)";break;case ne.Op.STAR:case ne.Op.PLUS:case ne.Op.QUEST:case ne.Op.REPEAT:{const t=this.subs[0];switch(t.op>ne.Op.CAPTURE||t.op===ne.Op.LITERAL&&t.runes.length>1?e+=`(?:${t.appendTo()})`:e+=t.appendTo(),this.op){case ne.Op.STAR:e+="*";break;case ne.Op.PLUS:e+="+";break;case ne.Op.QUEST:e+="?";break;case ne.Op.REPEAT:e+=`{${this.min}`,this.min!==this.max&&(e+=",",this.max>=0&&(e+=this.max)),e+="}";break}this.flags&M.NON_GREEDY&&(e+="?");break}case ne.Op.CONCAT:for(let t of this.subs)t.op===ne.Op.ALTERNATE?e+=`(?:${t.appendTo()})`:e+=t.appendTo();break;case ne.Op.ALTERNATE:{let t="";for(let n of this.subs)e+=t,t="|",e+=n.appendTo();break}case ne.Op.LITERAL:this.flags&M.FOLD_CASE&&(e+="(?i:");for(let t of this.runes)e+=te.escapeRune(t);this.flags&M.FOLD_CASE&&(e+=")");break;case ne.Op.ANY_CHAR_NOT_NL:e+="(?-s:.)";break;case ne.Op.ANY_CHAR:e+="(?s:.)";break;case ne.Op.PLB:e+=`(?<=${this.subs[0].appendTo()})`;break;case ne.Op.NLB:e+=`(?<!${this.subs[0].appendTo()})`;break;case ne.Op.CAPTURE:this.name===null||this.name.length===0?e+="(":e+=`(?P<${this.name}>`,this.subs[0].op!==ne.Op.EMPTY_MATCH&&(e+=this.subs[0].appendTo()),e+=")";break;case ne.Op.BEGIN_TEXT:e+="\\A";break;case ne.Op.END_TEXT:this.flags&M.WAS_DOLLAR?e+="(?-m:$)":e+="\\z";break;case ne.Op.BEGIN_LINE:e+="^";break;case ne.Op.END_LINE:e+="$";break;case ne.Op.WORD_BOUNDARY:e+="\\b";break;case ne.Op.NO_WORD_BOUNDARY:e+="\\B";break;case ne.Op.CHAR_CLASS:if(this.runes.length%2!==0){e+="[invalid char class]";break}if(e+="[",this.runes.length===0)e+="^\\x00-\\x{10FFFF}";else if(this.runes[0]===0&&this.runes[this.runes.length-1]===W.MAX_RUNE){e+="^";for(let t=1;t<this.runes.length-1;t+=2){const n=this.runes[t]+1,s=this.runes[t+1]-1;e+=ne.quoteIfHyphen(n),e+=te.escapeRune(n),n!==s&&(e+="-",e+=ne.quoteIfHyphen(s),e+=te.escapeRune(s))}}else for(let t=0;t<this.runes.length;t+=2){const n=this.runes[t],s=this.runes[t+1];e+=ne.quoteIfHyphen(n),e+=te.escapeRune(n),n!==s&&(e+="-",e+=ne.quoteIfHyphen(s),e+=te.escapeRune(s))}e+="]";break;default:e+=this.op;break}return e}maxCap(){let e=0;if(this.op===ne.Op.CAPTURE&&(e=this.cap),this.subs!==null)for(let t of this.subs){const n=t.maxCap();e<n&&(e=n)}return e}equals(e){if(!(e!==null&&e instanceof ne)||this.op!==e.op)return!1;switch(this.op){case ne.Op.END_TEXT:if((this.flags&M.WAS_DOLLAR)!==(e.flags&M.WAS_DOLLAR))return!1;break;case ne.Op.LITERAL:case ne.Op.CHAR_CLASS:if(this.runes===null&&e.runes===null)break;if(this.runes===null||e.runes===null||this.runes.length!==e.runes.length)return!1;for(let t=0;t<this.runes.length;t++)if(this.runes[t]!==e.runes[t])return!1;break;case ne.Op.ALTERNATE:case ne.Op.CONCAT:if(this.subs.length!==e.subs.length)return!1;for(let t=0;t<this.subs.length;++t)if(!this.subs[t].equals(e.subs[t]))return!1;break;case ne.Op.STAR:case ne.Op.PLUS:case ne.Op.QUEST:if((this.flags&M.NON_GREEDY)!==(e.flags&M.NON_GREEDY)||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.REPEAT:if((this.flags&M.NON_GREEDY)!==(e.flags&M.NON_GREEDY)||this.min!==e.min||this.max!==e.max||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.CAPTURE:if(this.cap!==e.cap||(this.name===null?e.name!==null:this.name!==e.name)||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.PLB:case ne.Op.NLB:if(this.lb!==e.lb||!this.subs[0].equals(e.subs[0]))return!1;break}return!0}},q(ne,"Op",Gg(["NO_MATCH","EMPTY_MATCH","LITERAL","CHAR_CLASS","ANY_CHAR_NOT_NL","ANY_CHAR","BEGIN_LINE","END_LINE","BEGIN_TEXT","END_TEXT","WORD_BOUNDARY","NO_WORD_BOUNDARY","CAPTURE","STAR","PLUS","QUEST","REPEAT","CONCAT","ALTERNATE","PLB","NLB","LEFT_PAREN","VERTICAL_BAR"])),ne),Gf=class{constructor(r){this.next=[Object.create(null)],this.fail=[0],this.match=[!1];for(const t of r){let n=0;for(let s=0;s<t.length;s++){const i=t[s];i in this.next[n]||(this.next.push(Object.create(null)),this.fail.push(0),this.match.push(!1),this.next[n][i]=this.next.length-1),n=this.next[n][i]}this.match[n]=!0}const e=[];for(const t in this.next[0])if(Object.prototype.hasOwnProperty.call(this.next[0],t)){const n=this.next[0][t];this.fail[n]=0,e.push(n)}for(;e.length>0;){const t=e.shift();for(const n in this.next[t])if(Object.prototype.hasOwnProperty.call(this.next[t],n)){const s=this.next[t][n];let i=this.fail[t];for(;i!==0&&!(n in this.next[i]);)i=this.fail[i];n in this.next[i]?this.fail[s]=this.next[i][n]:this.fail[s]=0,this.match[s]=this.match[s]||this.match[this.fail[s]],e.push(s)}}}searchUTF16(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r.charCodeAt(s);for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}searchUTF8(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r[s];for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}},un,me=(un=class{constructor(e){this.type=e,this.subs=[],this.str="",this.bytes=null,this.ac16=null,this.ac8=null}eval(e,t){switch(this.type){case un.Type.NONE:return!0;case un.Type.EXACT:return e.hasString(this,t);case un.Type.AND:for(let n=0;n<this.subs.length;n++)if(!this.subs[n].eval(e,t))return!1;return!0;case un.Type.OR:if(this.ac16&&this.ac8)return e.hasAnyString(this,t);for(let n=0;n<this.subs.length;n++)if(this.subs[n].eval(e,t))return!0;return!1;default:return!0}}},q(un,"Type",{NONE:0,EXACT:1,AND:2,OR:3}),un),vy=class gn{static build(e){const t=gn.fromRegexp(e);return gn.simplify(t)}static fromRegexp(e){if(!e)return new me(me.Type.NONE);switch(e.op){case A.Op.PLB:case A.Op.NLB:case A.Op.NO_MATCH:case A.Op.EMPTY_MATCH:case A.Op.BEGIN_LINE:case A.Op.END_LINE:case A.Op.BEGIN_TEXT:case A.Op.END_TEXT:case A.Op.WORD_BOUNDARY:case A.Op.NO_WORD_BOUNDARY:case A.Op.CHAR_CLASS:case A.Op.ANY_CHAR_NOT_NL:case A.Op.ANY_CHAR:return new me(me.Type.NONE);case A.Op.LITERAL:{if(e.runes.length===0||e.flags&M.FOLD_CASE)return new me(me.Type.NONE);const t=new me(me.Type.EXACT);let n="";for(let s=0;s<e.runes.length;s++)n+=String.fromCodePoint(e.runes[s]);return t.str=n,t.bytes=te.stringToUtf8ByteArray(t.str),t}case A.Op.CAPTURE:case A.Op.PLUS:return gn.fromRegexp(e.subs[0]);case A.Op.REPEAT:return e.min>=1?gn.fromRegexp(e.subs[0]):new me(me.Type.NONE);case A.Op.CONCAT:{const t=new me(me.Type.AND);for(const n of e.subs)t.subs.push(gn.fromRegexp(n));return t}case A.Op.ALTERNATE:{const t=new me(me.Type.OR);for(const n of e.subs)t.subs.push(gn.fromRegexp(n));return t}default:return new me(me.Type.NONE)}}static simplify(e){if(e.type===me.Type.EXACT||e.type===me.Type.NONE)return e;if(e.type===me.Type.AND){const t=[];for(const n of e.subs){const s=gn.simplify(n);if(s.type!==me.Type.NONE)if(s.type===me.Type.AND)for(let i=0;i<s.subs.length;i++)t.push(s.subs[i]);else t.push(s)}return t.length===0?new me(me.Type.NONE):t.length===1?t[0]:(e.subs=t,e)}if(e.type===me.Type.OR){const t=[];for(const o of e.subs){const a=gn.simplify(o);if(a.type===me.Type.NONE)return new me(me.Type.NONE);if(a.type===me.Type.OR)for(let u=0;u<a.subs.length;u++)t.push(a.subs[u]);else t.push(a)}if(t.length===0)return new me(me.Type.NONE);if(t.length===1)return t[0];const n=new Set,s=[];for(const o of t)o.type===me.Type.EXACT?n.has(o.str)||(n.add(o.str),s.push(o)):s.push(o);e.subs=s;let i=!0;for(const o of s)if(o.type!==me.Type.EXACT){i=!1;break}return i&&s.length>1&&(e.ac16=new Gf(s.map(o=>{const a=[];for(let u=0;u<o.str.length;u++)a.push(o.str.charCodeAt(u));return a})),e.ac8=new Gf(s.map(o=>o.bytes))),e}return e}},Mt=class{constructor(r=0,e=0){this.head=r,this.tail=e}},Sy=class{constructor(){this.inst=[],this.start=0,this.numCap=2,this.lbStarts=[],this.numLb=0}getInst(r){return this.inst[r]}numInst(){return this.inst.length}addInst(r){this.inst.push(new L(r))}skipNop(r){let e=this.inst[r];for(;e.op===L.NOP||e.op===L.CAPTURE;)e=this.inst[r],r=e.out;return e}prefix(){let r="",e=this.skipNop(this.start);if(!L.isRuneOp(e.op)||e.runes.length!==1)return[e.op===L.MATCH,r];for(;L.isRuneOp(e.op)&&e.runes.length===1&&!(e.arg&M.FOLD_CASE);)r+=String.fromCodePoint(e.runes[0]),e=this.skipNop(e.out);return[e.op===L.MATCH,r]}startCond(){let r=0,e=this.start;e:for(;;){const t=this.inst[e];switch(t.op){case L.EMPTY_WIDTH:r|=t.arg;break;case L.FAIL:return-1;case L.CAPTURE:case L.NOP:break;default:break e}e=t.out}return r}patch(r,e){let t=r.head;for(;t!==0;){const n=this.inst[t>>1];t&1?(t=n.arg,n.arg=e):(t=n.out,n.out=e)}}append(r,e){if(r.head===0)return e;if(e.head===0)return r;const t=this.inst[r.tail>>1];return r.tail&1?t.arg=e.head:t.out=e.head,new Mt(r.head,e.tail)}toString(){let r="";for(let e=0;e<this.inst.length;e++){const t=r.length;r+=e,e===this.start&&(r+="*"),r+="        ".substring(r.length-t),r+=this.inst[e],r+=`
`}return r}},Ua=class{constructor(r=0,e=new Mt,t=!1){this.i=r,this.out=e,this.nullable=t}},Py=class Js{static ANY_RUNE_NOT_NL(){return[0,k.CODES.get(`
`)-1,k.CODES.get(`
`)+1,W.MAX_RUNE]}static ANY_RUNE(){return[0,W.MAX_RUNE]}static compileRegexp(e){const t=new Js,n=t.compile(e);return t.prog.patch(n.out,t.newInst(L.MATCH).i),t.prog.start=n.i,t.prog}static compileSet(e){const t=new Js;if(e.length===0)return t.prog.start=t.newInst(L.FAIL).i,t.prog;let n=[];for(let i=0;i<e.length;i++){const o=t.compile(e[i]),a=t.newInst(L.MATCH);t.prog.getInst(a.i).arg=i,t.prog.patch(o.out,a.i),n.push(o.i)}let s=n[0];for(let i=1;i<n.length;i++){const o=t.newInst(L.ALT),a=t.prog.getInst(o.i);a.out=s,a.arg=n[i],s=o.i}return t.prog.start=s,t.prog}constructor(){this.prog=new Sy,this.newInst(L.FAIL)}newInst(e){return this.prog.addInst(e),new Ua(this.prog.numInst()-1,new Mt,!0)}nop(){const e=this.newInst(L.NOP);return e.out=new Mt(e.i<<1,e.i<<1),e}fail(){return new Ua}cap(e){const t=this.newInst(L.CAPTURE);return t.out=new Mt(t.i<<1,t.i<<1),this.prog.getInst(t.i).arg=e,this.prog.numCap<e+1&&(this.prog.numCap=e+1),t}cat(e,t){return e.i===0||t.i===0?this.fail():(this.prog.patch(e.out,t.i),new Ua(e.i,t.out,e.nullable&&t.nullable))}alt(e,t){if(e.i===0)return t;if(t.i===0)return e;const n=this.newInst(L.ALT),s=this.prog.getInst(n.i);return s.out=e.i,s.arg=t.i,n.out=this.prog.append(e.out,t.out),n.nullable=e.nullable||t.nullable,n}loop(e,t){const n=this.newInst(L.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Mt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Mt(n.i<<1|1,n.i<<1|1)),this.prog.patch(e.out,n.i),n}quest(e,t){const n=this.newInst(L.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Mt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Mt(n.i<<1|1,n.i<<1|1)),n.out=this.prog.append(n.out,e.out),n}star(e,t){return e.nullable?this.quest(this.plus(e,t),t):this.loop(e,t)}plus(e,t){return new Ua(e.i,this.loop(e,t).out,e.nullable)}empty(e){const t=this.newInst(L.EMPTY_WIDTH);return this.prog.getInst(t.i).arg=e,t.out=new Mt(t.i<<1,t.i<<1),t}rune(e,t){const n=this.newInst(L.RUNE);n.nullable=!1;const s=this.prog.getInst(n.i);return s.runes=e,t&=M.FOLD_CASE,(e.length!==1||W.simpleFold(e[0])===e[0])&&(t&=-2),s.arg=t,n.out=new Mt(n.i<<1,n.i<<1),!(t&M.FOLD_CASE)&&e.length===1||e.length===2&&e[0]===e[1]?s.op=L.RUNE1:e.length===2&&e[0]===0&&e[1]===W.MAX_RUNE?s.op=L.RUNE_ANY:e.length===4&&e[0]===0&&e[1]===k.CODES.get(`
`)-1&&e[2]===k.CODES.get(`
`)+1&&e[3]===W.MAX_RUNE&&(s.op=L.RUNE_ANY_NOT_NL),n}lookBehind(e,t){const n=this.newInst(L.LB_WRITE);this.prog.getInst(n.i).arg=t;const s=this.rune(Js.ANY_RUNE(),0),i=this.star(s,!0),o=this.cat(i,e);this.prog.patch(o.out,n.i);const a=this.newInst(L.LB_CHECK);return this.prog.getInst(a.i).arg=t,this.prog.lbStarts.push(o.i),Math.abs(t)>this.prog.numLb&&(this.prog.numLb=Math.abs(t)),a.out=new Mt(a.i<<1,a.i<<1),a}compile(e){switch(e.op){case A.Op.NO_MATCH:return this.fail();case A.Op.EMPTY_MATCH:return this.nop();case A.Op.LITERAL:if(e.runes.length===0)return this.nop();{let t=null;for(let n of e.runes){const s=this.rune([n],e.flags);t=t===null?s:this.cat(t,s)}return t}case A.Op.CHAR_CLASS:return this.rune(e.runes,e.flags);case A.Op.ANY_CHAR_NOT_NL:return this.rune(Js.ANY_RUNE_NOT_NL(),0);case A.Op.ANY_CHAR:return this.rune(Js.ANY_RUNE(),0);case A.Op.BEGIN_LINE:return this.empty(te.EMPTY_BEGIN_LINE);case A.Op.END_LINE:return this.empty(te.EMPTY_END_LINE);case A.Op.BEGIN_TEXT:return this.empty(te.EMPTY_BEGIN_TEXT);case A.Op.END_TEXT:return this.empty(te.EMPTY_END_TEXT);case A.Op.WORD_BOUNDARY:return this.empty(te.EMPTY_WORD_BOUNDARY);case A.Op.NO_WORD_BOUNDARY:return this.empty(te.EMPTY_NO_WORD_BOUNDARY);case A.Op.PLB:case A.Op.NLB:return this.lookBehind(this.compile(e.subs[0]),e.lb);case A.Op.CAPTURE:{const t=this.cap(e.cap<<1),n=this.compile(e.subs[0]),s=this.cap(e.cap<<1|1);return this.cat(this.cat(t,n),s)}case A.Op.STAR:return this.star(this.compile(e.subs[0]),(e.flags&M.NON_GREEDY)!==0);case A.Op.PLUS:return this.plus(this.compile(e.subs[0]),(e.flags&M.NON_GREEDY)!==0);case A.Op.QUEST:return this.quest(this.compile(e.subs[0]),(e.flags&M.NON_GREEDY)!==0);case A.Op.CONCAT:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.cat(t,s)}return t}case A.Op.ALTERNATE:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.alt(t,s)}return t}default:throw new fy("regexp: unhandled case in compile")}}},Ny=class vt{static simplify(e){if(e===null)return null;switch(e.op){case A.Op.PLB:case A.Op.NLB:case A.Op.CAPTURE:{const t=vt.simplify(e.subs[0]);if(t!==e.subs[0]){const n=A.fromRegexp(e);return n.runes=[],n.subs=[t],n}return e}case A.Op.CONCAT:case A.Op.ALTERNATE:{const t=[];let n=!1;for(let s=0;s<e.subs.length;s++){const i=e.subs[s],o=vt.simplify(i);if(o!==i&&(n=!0),e.op===A.Op.CONCAT){if(o.op===A.Op.NO_MATCH)return new A(A.Op.NO_MATCH);if(o.op===A.Op.EMPTY_MATCH){n=!0;continue}if(o.op===A.Op.CONCAT){n=!0;for(let a=0;a<o.subs.length;a++)t.push(o.subs[a]);continue}}else if(e.op===A.Op.ALTERNATE){if(o.op===A.Op.NO_MATCH){n=!0;continue}if(o.op===A.Op.ALTERNATE){n=!0;for(let a=0;a<o.subs.length;a++)t.push(o.subs[a]);continue}}t.push(o)}if(n){if(t.length===0)return new A(e.op===A.Op.CONCAT?A.Op.EMPTY_MATCH:A.Op.NO_MATCH);if(t.length===1)return t[0];const s=A.fromRegexp(e);return s.runes=[],s.subs=t,s}return e}case A.Op.CHAR_CLASS:return e.runes===null?e:e.runes.length===0?new A(A.Op.NO_MATCH):e.runes.length===2&&e.runes[0]===0&&e.runes[1]===W.MAX_RUNE?new A(A.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===k.CODES.get(`
`)-1&&e.runes[2]===k.CODES.get(`
`)+1&&e.runes[3]===W.MAX_RUNE?new A(A.Op.ANY_CHAR_NOT_NL):e;case A.Op.STAR:case A.Op.PLUS:case A.Op.QUEST:{const t=vt.simplify(e.subs[0]);return vt.simplify1(e.op,e.flags,t,e)}case A.Op.REPEAT:{if(e.min===0&&e.max===0)return new A(A.Op.EMPTY_MATCH);const t=vt.simplify(e.subs[0]);if(e.max===-1){if(e.min===0)return vt.simplify1(A.Op.STAR,e.flags,t,null);if(e.min===1)return vt.simplify1(A.Op.PLUS,e.flags,t,null);const s=new A(A.Op.CONCAT),i=[];for(let o=0;o<e.min-1;o++)i.push(t);return i.push(vt.simplify1(A.Op.PLUS,e.flags,t,null)),s.subs=i.slice(0),vt.simplify(s)}if(e.min===1&&e.max===1)return t;let n=null;if(e.min>0){n=[];for(let s=0;s<e.min;s++)n.push(t)}if(e.max>e.min){let s=vt.simplify1(A.Op.QUEST,e.flags,t,null);for(let i=e.min+1;i<e.max;i++){const o=new A(A.Op.CONCAT);o.subs=[t,s],s=vt.simplify1(A.Op.QUEST,e.flags,o,null)}if(n===null)return s;n.push(s)}if(n!==null){const s=new A(A.Op.CONCAT);return s.subs=n.slice(0),vt.simplify(s)}return new A(A.Op.NO_MATCH)}}return e}static simplify1(e,t,n,s){if(n.op===A.Op.EMPTY_MATCH)return n;if(n.op===A.Op.NO_MATCH)return e===A.Op.PLUS?n:new A(A.Op.EMPTY_MATCH);if(e===n.op&&(t&M.NON_GREEDY)===(n.flags&M.NON_GREEDY))return n;if(s!==null&&s.op===e&&(s.flags&M.NON_GREEDY)===(t&M.NON_GREEDY)&&n===s.subs[0])return s;const i=new A(e);return i.flags=t,i.subs=[n],i}},ge=class{constructor(r,e){this.sign=r,this.cls=e}};const Uf=[48,57],Hf=[9,10,12,13,32,32],qf=[48,57,65,90,95,95,97,122],jf=new Map([["\\d",new ge(1,Uf)],["\\D",new ge(-1,Uf)],["\\s",new ge(1,Hf)],["\\S",new ge(-1,Hf)],["\\w",new ge(1,qf)],["\\W",new ge(-1,qf)]]),Kf=[48,57,65,90,97,122],Jf=[65,90,97,122],zf=[0,127],$f=[9,9,32,32],Qf=[0,31,127,127],Wf=[48,57],Yf=[33,126],Xf=[97,122],Zf=[32,126],eC=[33,47,58,64,91,96,123,126],tC=[9,13,32,32],nC=[65,90],rC=[48,57,65,90,95,95,97,122],sC=[48,57,65,70,97,102],iC=new Map([["[:alnum:]",new ge(1,Kf)],["[:^alnum:]",new ge(-1,Kf)],["[:alpha:]",new ge(1,Jf)],["[:^alpha:]",new ge(-1,Jf)],["[:ascii:]",new ge(1,zf)],["[:^ascii:]",new ge(-1,zf)],["[:blank:]",new ge(1,$f)],["[:^blank:]",new ge(-1,$f)],["[:cntrl:]",new ge(1,Qf)],["[:^cntrl:]",new ge(-1,Qf)],["[:digit:]",new ge(1,Wf)],["[:^digit:]",new ge(-1,Wf)],["[:graph:]",new ge(1,Yf)],["[:^graph:]",new ge(-1,Yf)],["[:lower:]",new ge(1,Xf)],["[:^lower:]",new ge(-1,Xf)],["[:print:]",new ge(1,Zf)],["[:^print:]",new ge(-1,Zf)],["[:punct:]",new ge(1,eC)],["[:^punct:]",new ge(-1,eC)],["[:space:]",new ge(1,tC)],["[:^space:]",new ge(-1,tC)],["[:upper:]",new ge(1,nC)],["[:^upper:]",new ge(-1,nC)],["[:word:]",new ge(1,rC)],["[:^word:]",new ge(-1,rC)],["[:xdigit:]",new ge(1,sC)],["[:^xdigit:]",new ge(-1,sC)]]);var Qn=class nr{static charClassToString(e,t){let n="[";for(let s=0;s<t;s+=2){s>0&&(n+=" ");const i=e[s],o=e[s+1];i===o?n+=`0x${i.toString(16)}`:n+=`0x${i.toString(16)}-0x${o.toString(16)}`}return n+="]",n}static cmp(e,t,n,s){const i=e[t]-n;return i!==0?i:s-e[t+1]}static qsortIntPair(e,t,n){const s=((t+n)/2|0)&-2,i=e[s],o=e[s+1];let a=t,u=n;for(;a<=u;){for(;a<n&&nr.cmp(e,a,i,o)<0;)a+=2;for(;u>t&&nr.cmp(e,u,i,o)>0;)u-=2;if(a<=u){if(a!==u){let l=e[a];e[a]=e[u],e[u]=l,l=e[a+1],e[a+1]=e[u+1],e[u+1]=l}a+=2,u-=2}}t<u&&nr.qsortIntPair(e,t,u),a<n&&nr.qsortIntPair(e,a,n)}constructor(e=te.emptyInts()){this.r=e,this.len=e.length}toArray(){return this.len===this.r.length?this.r:this.r.slice(0,this.len)}cleanClass(){if(this.len<4)return this;nr.qsortIntPair(this.r,0,this.len-2);let e=2;for(let t=2;t<this.len;t+=2){const n=this.r[t],s=this.r[t+1];if(n<=this.r[e-1]+1){s>this.r[e-1]&&(this.r[e-1]=s);continue}this.r[e]=n,this.r[e+1]=s,e+=2}return this.len=e,this}appendLiteral(e,t){return t&M.FOLD_CASE?this.appendFoldedRange(e,e):this.appendRange(e,e)}appendRange(e,t){if(this.len>0){for(let n=2;n<=4;n+=2)if(this.len>=n){const s=this.r[this.len-n],i=this.r[this.len-n+1];if(e<=i+1&&s<=t+1)return e<s&&(this.r[this.len-n]=e),t>i&&(this.r[this.len-n+1]=t),this}}return this.r[this.len++]=e,this.r[this.len++]=t,this}appendFoldedRange(e,t){if(e<=W.MIN_FOLD&&t>=W.MAX_FOLD)return this.appendRange(e,t);if(t<W.MIN_FOLD||e>W.MAX_FOLD)return this.appendRange(e,t);e<W.MIN_FOLD&&(this.appendRange(e,W.MIN_FOLD-1),e=W.MIN_FOLD),t>W.MAX_FOLD&&(this.appendRange(W.MAX_FOLD+1,t),t=W.MAX_FOLD);for(let n=e;n<=t;n++){this.appendRange(n,n);for(let s=W.simpleFold(n);s!==n;s=W.simpleFold(s))this.appendRange(s,s)}return this}appendClass(e){for(let t=0;t<e.length;t+=2)this.appendRange(e[t],e[t+1]);return this}appendFoldedClass(e){for(let t=0;t<e.length;t+=2)this.appendFoldedRange(e[t],e[t+1]);return this}appendNegatedClass(e){let t=0;for(let n=0;n<e.length;n+=2){const s=e[n],i=e[n+1];t<=s-1&&this.appendRange(t,s-1),t=i+1}return t<=W.MAX_RUNE&&this.appendRange(t,W.MAX_RUNE),this}appendTable(e){for(let t=0;t<e.length;++t){const n=e.getLo(t),s=e.getHi(t),i=e.getStride(t);if(i===1){this.appendRange(n,s);continue}for(let o=n;o<=s;o+=i)this.appendRange(o,o)}return this}appendNegatedTable(e){let t=0;for(let n=0;n<e.length;++n){const s=e.getLo(n),i=e.getHi(n),o=e.getStride(n);if(o===1){t<=s-1&&this.appendRange(t,s-1),t=i+1;continue}for(let a=s;a<=i;a+=o)t<=a-1&&this.appendRange(t,a-1),t=a+1}return t<=W.MAX_RUNE&&this.appendRange(t,W.MAX_RUNE),this}appendTableWithSign(e,t){return t<0?this.appendNegatedTable(e):this.appendTable(e)}negateClass(){let e=0,t=0;for(let n=0;n<this.len;n+=2){const s=this.r[n],i=this.r[n+1];e<=s-1&&(this.r[t]=e,this.r[t+1]=s-1,t+=2),e=i+1}return this.len=t,e<=W.MAX_RUNE&&(this.r[this.len++]=e,this.r[this.len++]=W.MAX_RUNE),this}appendClassWithSign(e,t){return t<0?this.appendNegatedClass(e):this.appendClass(e)}appendGroup(e,t){let n=e.cls;return t&&(n=new nr().appendFoldedClass(n).cleanClass().toArray()),this.appendClassWithSign(n,e.sign)}toString(){return nr.charClassToString(this.r,this.len)}},Oy=class{constructor(r){this.str=r,this.position=0}pos(){return this.position}rewindTo(r){this.position=r}more(){return this.position<this.str.length}peek(){return this.str.codePointAt(this.position)}skip(r){this.position+=r}skipString(r){this.position+=r.length}pop(){const r=this.str.codePointAt(this.position);return this.position+=te.charCount(r),r}lookingAt(r){return this.str.startsWith(r,this.position)}rest(){return this.str.substring(this.position)}from(r){return this.str.substring(r,this.position)}toString(){return this.rest()}},j,Fy=(j=class{static unicodeTable(e){return e==="Any"?{tab:j.ANY_TABLE,fold:j.ANY_TABLE,sign:1}:e==="Ascii"?{tab:j.ASCII_TABLE,fold:j.ASCII_FOLD_TABLE,sign:1}:e==="Assigned"?{tab:It.CATEGORIES.get("Cn"),fold:It.CATEGORIES.get("Cn"),sign:-1}:e==="Lc"?{tab:It.CATEGORIES.get("LC"),fold:It.FOLD_CATEGORIES.get("LC"),sign:1}:It.CATEGORIES.has(e)?{tab:It.CATEGORIES.get(e),fold:It.FOLD_CATEGORIES.get(e),sign:1}:It.SCRIPTS.has(e)?{tab:It.SCRIPTS.get(e),fold:It.FOLD_SCRIPT.get(e),sign:1}:null}static minFoldRune(e){if(e<W.MIN_FOLD||e>W.MAX_FOLD)return e;let t=e;const n=e;for(e=W.simpleFold(e);e!==n;e=W.simpleFold(e))t>e&&(t=e);return t}static leadingRegexp(e){if(e.op===A.Op.EMPTY_MATCH)return null;if(e.op===A.Op.CONCAT&&e.subs.length>0){const t=e.subs[0];return t.op===A.Op.EMPTY_MATCH?null:t}return e}static literalRegexp(e,t){const n=new A(A.Op.LITERAL);return n.flags=t,n.runes=te.stringToRunes(e),n}static parse(e,t){return new j(e,t).parseInternal()}static parseRepeat(e){const t=e.pos();if(!e.more()||!e.lookingAt("{"))return-1;e.skip(1);const n=j.parseInt(e);if(n===-1||!e.more())return-1;let s;if(!e.lookingAt(","))s=n;else{if(e.skip(1),!e.more())return-1;if(e.lookingAt("}"))s=-1;else if((s=j.parseInt(e))===-1)return-1}if(!e.more()||!e.lookingAt("}"))return-1;if(e.skip(1),n<0||n>1e3||s===-2||s>1e3||s>=0&&n>s)throw new Re(j.ERR_INVALID_REPEAT_SIZE,e.from(t));return n<<16|s&W.MAX_BMP}static isValidCaptureName(e){if(e.length===0)return!1;for(let t=0;t<e.length;t++){const n=e.codePointAt(t);if(n!==k.CODES.get("_")&&!te.isalnum(n))return!1}return!0}static parseInt(e){const t=e.pos();for(;e.more()&&e.peek()>=k.CODES.get("0")&&e.peek()<=k.CODES.get("9");)e.skip(1);const n=e.from(t);return n.length===0||n.length>1&&n.codePointAt(0)===k.CODES.get("0")?-1:n.length>8?-2:parseInt(n,10)}static isCharClass(e){return e.op===A.Op.LITERAL&&e.runes.length===1||e.op===A.Op.CHAR_CLASS||e.op===A.Op.ANY_CHAR_NOT_NL||e.op===A.Op.ANY_CHAR}static matchRune(e,t){switch(e.op){case A.Op.LITERAL:return e.runes.length===1&&e.runes[0]===t;case A.Op.CHAR_CLASS:for(let n=0;n<e.runes.length;n+=2)if(e.runes[n]<=t&&t<=e.runes[n+1])return!0;return!1;case A.Op.ANY_CHAR_NOT_NL:return t!==k.CODES.get(`
`);case A.Op.ANY_CHAR:return!0}return!1}static mergeCharClass(e,t){switch(e.op){case A.Op.ANY_CHAR:break;case A.Op.ANY_CHAR_NOT_NL:j.matchRune(t,k.CODES.get(`
`))&&(e.op=A.Op.ANY_CHAR);break;case A.Op.CHAR_CLASS:t.op===A.Op.LITERAL?e.runes=new Qn(e.runes).appendLiteral(t.runes[0],t.flags).toArray():e.runes=new Qn(e.runes).appendClass(t.runes).toArray();break;case A.Op.LITERAL:if(t.runes[0]===e.runes[0]&&t.flags===e.flags)break;e.op=A.Op.CHAR_CLASS,e.runes=new Qn().appendLiteral(e.runes[0],e.flags).appendLiteral(t.runes[0],t.flags).toArray();break}}static parseEscape(e){const t=e.pos();if(e.skip(1),!e.more())throw new Re(j.ERR_TRAILING_BACKSLASH);let n=e.pop();e:switch(n){case k.CODES.get("1"):case k.CODES.get("2"):case k.CODES.get("3"):case k.CODES.get("4"):case k.CODES.get("5"):case k.CODES.get("6"):case k.CODES.get("7"):if(!e.more()||e.peek()<k.CODES.get("0")||e.peek()>k.CODES.get("7"))break;case k.CODES.get("0"):{let s=n-k.CODES.get("0");for(let i=1;i<3&&!(!e.more()||e.peek()<k.CODES.get("0")||e.peek()>k.CODES.get("7"));i++)s=s*8+e.peek()-k.CODES.get("0"),e.skip(1);return s}case k.CODES.get("x"):{if(!e.more())break;if(n=e.pop(),n===k.CODES.get("{")){let o=0,a=0;for(;;){if(!e.more())break e;if(n=e.pop(),n===k.CODES.get("}"))break;const u=te.unhex(n);if(u<0||(a=a*16+u,a>W.MAX_RUNE))break e;o++}if(o===0)break e;return a}const s=te.unhex(n);if(!e.more())break;n=e.pop();const i=te.unhex(n);if(s<0||i<0)break;return s*16+i}case k.CODES.get("a"):return k.CODES.get("\x07");case k.CODES.get("f"):return k.CODES.get("\f");case k.CODES.get("n"):return k.CODES.get(`
`);case k.CODES.get("r"):return k.CODES.get("\r");case k.CODES.get("t"):return k.CODES.get("	");case k.CODES.get("v"):return k.CODES.get("\v");default:if(n<=W.MAX_ASCII&&!te.isalnum(n))return n;break}throw new Re(j.ERR_INVALID_ESCAPE,e.from(t))}static parseClassChar(e,t){if(!e.more())throw new Re(j.ERR_MISSING_BRACKET,e.from(t));return e.lookingAt("\\")?j.parseEscape(e):e.pop()}static concatRunes(e,t){for(let n=0;n<t.length;n++)e.push(t[n]);return e}static hasCapture(e){if(e===null)return!1;if(e.op===A.Op.CAPTURE)return!0;if(e.subs){for(let t of e.subs)if(j.hasCapture(t))return!0}return!1}constructor(e,t=0){this.wholeRegexp=e,this.flags=t,this.numCap=0,this.namedGroups=Object.create(null),this.stack=[],this.free=null,this.numRegexp=0,this.numRunes=0,this.repeats=0,this.height=null,this.size=null,this.nlb=0}newRegexp(e){let t=this.free;return t!==null&&t.subs!==null&&t.subs.length>0?(this.free=t.subs[0],t.reinit(),t.op=e):(t=new A(e),this.numRegexp+=1),t}reuse(e){this.height!==null&&this.height.has(e)&&this.height.delete(e),e.subs!==null&&e.subs.length>0&&(e.subs[0]=this.free),this.free=e}checkLimits(e){if(this.numRunes>j.MAX_RUNES)throw new Re(j.ERR_LARGE);this.checkSize(e),this.checkHeight(e)}checkSize(e){if(this.size===null){if(this.repeats===0&&(this.repeats=1),e.op===A.Op.REPEAT){let t=e.max;t===-1&&(t=e.min),t<=0&&(t=1),t>Math.floor(j.MAX_SIZE/this.repeats)?this.repeats=j.MAX_SIZE:this.repeats*=t}if(this.numRegexp<Math.floor(j.MAX_SIZE/this.repeats))return;this.size=new Map;for(let t of this.stack)this.checkSize(t)}if(this.calcSize(e,!0)>j.MAX_SIZE)throw new Re(j.ERR_LARGE)}calcSize(e,t=!1){if(!t&&this.size!==null&&this.size.has(e))return this.size.get(e);let n=0;switch(e.op){case A.Op.LITERAL:n=e.runes.length;break;case A.Op.PLB:case A.Op.NLB:case A.Op.CAPTURE:case A.Op.STAR:n=2+this.calcSize(e.subs[0]);break;case A.Op.PLUS:case A.Op.QUEST:n=1+this.calcSize(e.subs[0]);break;case A.Op.CONCAT:for(let s of e.subs)n=n+this.calcSize(s);break;case A.Op.ALTERNATE:for(let s of e.subs)n=n+this.calcSize(s);e.subs.length>1&&(n=n+e.subs.length-1);break;case A.Op.REPEAT:{let s=this.calcSize(e.subs[0]);if(e.max===-1){e.min===0?n=2+s:n=1+e.min*s;break}n=e.max*s+(e.max-e.min);break}}return n=Math.max(1,n),this.size===null&&(this.size=new Map),this.size.set(e,n),n}checkHeight(e){if(!(this.numRegexp<j.MAX_HEIGHT)){if(this.height===null){this.height=new Map;for(let t of this.stack)this.checkHeight(t)}if(this.calcHeight(e,!0)>j.MAX_HEIGHT)throw new Re(j.ERR_NESTING_DEPTH)}}calcHeight(e,t=!1){if(!t&&this.height!==null&&this.height.has(e))return this.height.get(e);let n=1;for(let s of e.subs){const i=this.calcHeight(s);n<1+i&&(n=1+i)}return this.height===null&&(this.height=new Map),this.height.set(e,n),n}pop(){return this.stack.pop()}popToPseudo(){const e=this.stack.length;let t=e;for(;t>0&&!A.isPseudoOp(this.stack[t-1].op);)t--;const n=this.stack.slice(t,e);return this.stack=this.stack.slice(0,t),n}push(e){if(this.numRunes+=e.runes.length,e.op===A.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]===e.runes[1]){if(this.maybeConcat(e.runes[0],this.flags&-2))return null;e.op=A.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags&-2}else if(e.op===A.Op.CHAR_CLASS&&e.runes.length===4&&e.runes[0]===e.runes[1]&&e.runes[2]===e.runes[3]&&W.simpleFold(e.runes[0])===e.runes[2]&&W.simpleFold(e.runes[2])===e.runes[0]||e.op===A.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]+1===e.runes[1]&&W.simpleFold(e.runes[0])===e.runes[1]&&W.simpleFold(e.runes[1])===e.runes[0]){if(this.maybeConcat(e.runes[0],this.flags|M.FOLD_CASE))return null;e.op=A.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags|M.FOLD_CASE}else this.maybeConcat(-1,0);return this.stack.push(e),this.checkLimits(e),e}maybeConcat(e,t){const n=this.stack.length;if(n<2)return!1;const s=this.stack[n-1],i=this.stack[n-2];return s.op!==A.Op.LITERAL||i.op!==A.Op.LITERAL||(s.flags&M.FOLD_CASE)!==(i.flags&M.FOLD_CASE)?!1:(i.runes=j.concatRunes(i.runes,s.runes),e>=0?(s.runes=[e],s.flags=t,!0):(this.pop(),this.reuse(s),!1))}newLiteral(e,t){const n=this.newRegexp(A.Op.LITERAL);return n.flags=t,t&M.FOLD_CASE&&(e=j.minFoldRune(e)),n.runes=[e],n}literal(e){this.push(this.newLiteral(e,this.flags))}op(e){const t=this.newRegexp(e);return t.flags=this.flags,this.push(t)}repeat(e,t,n,s,i,o){let a=this.flags;if(a&M.PERL_X&&(i.more()&&i.lookingAt("?")&&(i.skip(1),a^=M.NON_GREEDY),o!==-1))throw new Re(j.ERR_INVALID_REPEAT_OP,i.from(o));const u=this.stack.length;if(u===0)throw new Re(j.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const l=this.stack[u-1];if(A.isPseudoOp(l.op))throw new Re(j.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const B=this.newRegexp(e);if(B.min=t,B.max=n,B.flags=a,B.subs=[l],this.stack[u-1]=B,this.checkLimits(B),e===A.Op.REPEAT&&(t>=2||n>=2)&&!this.repeatIsValid(B,1e3))throw new Re(j.ERR_INVALID_REPEAT_SIZE,i.from(s))}repeatIsValid(e,t){if(e.op===A.Op.REPEAT){let n=e.max;if(n===0)return!0;if(n<0&&(n=e.min),n>t)return!1;n>0&&(t=Math.trunc(t/n))}for(let n of e.subs)if(!this.repeatIsValid(n,t))return!1;return!0}concat(){this.maybeConcat(-1,0);const e=this.popToPseudo();return e.length===0?this.push(this.newRegexp(A.Op.EMPTY_MATCH)):this.push(this.collapse(e,A.Op.CONCAT))}alternate(){const e=this.popToPseudo();return e.length>0&&this.cleanAlt(e[e.length-1]),e.length===0?this.push(this.newRegexp(A.Op.NO_MATCH)):this.push(this.collapse(e,A.Op.ALTERNATE))}cleanAlt(e){e.op===A.Op.CHAR_CLASS&&(e.runes=new Qn(e.runes).cleanClass().toArray(),e.runes.length===2&&e.runes[0]===0&&e.runes[1]===W.MAX_RUNE?(e.runes=[],e.op=A.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===k.CODES.get(`
`)-1&&e.runes[2]===k.CODES.get(`
`)+1&&e.runes[3]===W.MAX_RUNE&&(e.runes=[],e.op=A.Op.ANY_CHAR_NOT_NL))}collapse(e,t){if(e.length===1)return e[0];let n=0;for(let a of e)n+=a.op===t?a.subs.length:1;let s=new Array(n).fill(null),i=0;for(let a of e)if(a.op===t){for(let u=0;u<a.subs.length;u++)s[i++]=a.subs[u];this.reuse(a)}else s[i++]=a;let o=this.newRegexp(t);if(o.subs=s,t===A.Op.ALTERNATE&&(o.subs=this.factor(o.subs),o.subs.length===1)){const a=o;o=o.subs[0],this.reuse(a)}return o}factor(e){if(e.length<2)return e;let t=0,n=e.length,s=0,i=null,o=0,a=0,u=0;for(let B=0;B<=n;B++){let d=null,C=0,g=0;if(B<n){let D=e[t+B];if(D.op===A.Op.CONCAT&&D.subs.length>0&&(D=D.subs[0]),D.op===A.Op.LITERAL&&(d=D.runes,C=D.runes.length,g=D.flags&M.FOLD_CASE),g===a){let P=0;for(;P<o&&P<C&&i[P]===d[P];)P++;if(P>0){o=P;continue}}}if(B!==u)if(B===u+1)e[s++]=e[t+u];else{const D=this.newRegexp(A.Op.LITERAL);D.flags=a,D.runes=i.slice(0,o);for(let J=u;J<B;J++)e[t+J]=this.removeLeadingString(e[t+J],o),this.checkLimits(e[t+J]);const P=this.collapse(e.slice(t+u,t+B),A.Op.ALTERNATE),x=this.newRegexp(A.Op.CONCAT);x.subs=[D,P],e[s++]=x}u=B,i=d,o=C,a=g}n=s,t=0,u=0,s=0;let l=null;for(let B=0;B<=n;B++){let d=null;if(!(B<n&&(d=j.leadingRegexp(e[t+B]),l!==null&&l.equals(d)&&(j.isCharClass(l)||l.op===A.Op.REPEAT&&l.min===l.max&&j.isCharClass(l.subs[0]))))){if(B!==u)if(B===u+1)e[s++]=e[t+u];else{const C=l;for(let P=u;P<B;P++){const x=P!==u;e[t+P]=this.removeLeadingRegexp(e[t+P],x),this.checkLimits(e[t+P])}const g=this.collapse(e.slice(t+u,t+B),A.Op.ALTERNATE),D=this.newRegexp(A.Op.CONCAT);D.subs=[C,g],e[s++]=D}u=B,l=d}}n=s,t=0,u=0,s=0;for(let B=0;B<=n;B++)if(!(B<n&&j.isCharClass(e[t+B]))){if(B!==u)if(B===u+1)e[s++]=e[t+u];else{let d=u;for(let g=u+1;g<B;g++){const D=e[t+d],P=e[t+g];(D.op<P.op||D.op===P.op&&(D.runes!==null?D.runes.length:0)<(P.runes!==null?P.runes.length:0))&&(d=g)}const C=e[t+u];e[t+u]=e[t+d],e[t+d]=C;for(let g=u+1;g<B;g++)j.mergeCharClass(e[t+u],e[t+g]),this.reuse(e[t+g]);this.cleanAlt(e[t+u]),e[s++]=e[t+u]}B<n&&(e[s++]=e[t+B]),u=B+1}n=s,t=0,u=0,s=0;for(let B=0;B<n;++B)B+1<n&&e[t+B].op===A.Op.EMPTY_MATCH&&e[t+B+1].op===A.Op.EMPTY_MATCH||(e[s++]=e[t+B]);return n=s,t=0,e.slice(t,n)}removeLeadingString(e,t){if(e.op===A.Op.CONCAT&&e.subs.length>0){const n=this.removeLeadingString(e.subs[0],t);if(e.subs[0]=n,n.op===A.Op.EMPTY_MATCH)switch(this.reuse(n),e.subs.length){case 0:case 1:e.op=A.Op.EMPTY_MATCH,e.subs=A.emptySubs();break;case 2:{const s=e;e=e.subs[1],this.reuse(s);break}default:e.subs=e.subs.slice(1,e.subs.length);break}return e}return e.op===A.Op.LITERAL&&(e.runes=e.runes.slice(t,e.runes.length),e.runes.length===0&&(e.op=A.Op.EMPTY_MATCH)),e}removeLeadingRegexp(e,t){if(e.op===A.Op.CONCAT&&e.subs.length>0){switch(t&&this.reuse(e.subs[0]),e.subs=e.subs.slice(1,e.subs.length),e.subs.length){case 0:e.op=A.Op.EMPTY_MATCH,e.subs=A.emptySubs();break;case 1:{const n=e;e=e.subs[0],this.reuse(n);break}}return e}return t&&this.reuse(e),this.newRegexp(A.Op.EMPTY_MATCH)}parseInternal(){if(this.flags&M.LITERAL)return j.literalRegexp(this.wholeRegexp,this.flags);let e=-1,t=-1,n=-1;const s=new Oy(this.wholeRegexp);for(;s.more();){let i=-1;e:switch(s.peek()){case k.CODES.get("("):if(this.flags&M.LOOKBEHIND){if(s.lookingAt("(?<=")){this.parsePosLookBehind(),s.skip(4);break}if(s.lookingAt("(?<!")){this.parseNegLookBehind(),s.skip(4);break}}if(this.flags&M.PERL_X&&s.lookingAt("(?")){this.parsePerlFlags(s);break}this.op(A.Op.LEFT_PAREN).cap=++this.numCap,s.skip(1);break;case k.CODES.get("|"):this.parseVerticalBar(),s.skip(1);break;case k.CODES.get(")"):this.parseRightParen(),s.skip(1);break;case k.CODES.get("^"):this.flags&M.ONE_LINE?this.op(A.Op.BEGIN_TEXT):this.op(A.Op.BEGIN_LINE),s.skip(1);break;case k.CODES.get("$"):this.flags&M.ONE_LINE?this.op(A.Op.END_TEXT).flags|=M.WAS_DOLLAR:this.op(A.Op.END_LINE),s.skip(1);break;case k.CODES.get("."):this.flags&M.DOT_NL?this.op(A.Op.ANY_CHAR):this.op(A.Op.ANY_CHAR_NOT_NL),s.skip(1);break;case k.CODES.get("["):this.parseClass(s);break;case k.CODES.get("*"):case k.CODES.get("+"):case k.CODES.get("?"):{i=s.pos();let o=null;switch(s.pop()){case k.CODES.get("*"):o=A.Op.STAR;break;case k.CODES.get("+"):o=A.Op.PLUS;break;case k.CODES.get("?"):o=A.Op.QUEST;break}this.repeat(o,t,n,i,s,e);break}case k.CODES.get("{"):{i=s.pos();const o=j.parseRepeat(s);if(o<0){s.rewindTo(i),this.literal(s.pop());break}t=o>>16,n=(o&W.MAX_BMP)<<16>>16,this.repeat(A.Op.REPEAT,t,n,i,s,e);break}case k.CODES.get("\\"):{const o=s.pos();if(s.skip(1),this.flags&M.PERL_X&&s.more())switch(s.pop()){case k.CODES.get("A"):this.op(A.Op.BEGIN_TEXT);break e;case k.CODES.get("b"):this.op(A.Op.WORD_BOUNDARY);break e;case k.CODES.get("B"):this.op(A.Op.NO_WORD_BOUNDARY);break e;case k.CODES.get("C"):throw new Re(j.ERR_INVALID_ESCAPE,"\\C");case k.CODES.get("Q"):{let l=s.rest();const B=l.indexOf("\\E");B>=0?(l=l.substring(0,B),s.skipString(l),s.skipString("\\E")):s.skipString(l);let d=0;for(;d<l.length;){const C=l.codePointAt(d);this.literal(C),d+=te.charCount(C)}break e}case k.CODES.get("z"):this.op(A.Op.END_TEXT);break e;default:s.rewindTo(o);break}else s.rewindTo(o);const a=this.newRegexp(A.Op.CHAR_CLASS);if(a.flags=this.flags,s.lookingAt("\\p")||s.lookingAt("\\P")){const l=new Qn;if(this.parseUnicodeClass(s,l)){a.runes=l.toArray(),this.push(a);break e}}const u=new Qn;if(this.parsePerlClassEscape(s,u)){a.runes=u.toArray(),this.push(a);break e}s.rewindTo(o),this.reuse(a),this.literal(j.parseEscape(s));break}default:this.literal(s.pop());break}e=i}if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length!==1)throw new Re(j.ERR_MISSING_PAREN,this.wholeRegexp);return this.stack[0].namedGroups=this.namedGroups,this.stack[0]}parsePerlFlags(e){const t=e.pos(),n=e.rest();if(n.startsWith("(?P<")||n.startsWith("(?<")){const a=n.charAt(2)==="P"?4:3,u=n.indexOf(">");if(u<0)throw new Re(j.ERR_INVALID_NAMED_CAPTURE,n);const l=n.substring(a,u);if(e.skipString(l),e.skip(a+1),!j.isValidCaptureName(l))throw new Re(j.ERR_INVALID_NAMED_CAPTURE,n.substring(0,u+1));const B=this.op(A.Op.LEFT_PAREN);if(B.cap=++this.numCap,this.namedGroups[l])throw new Re(j.ERR_DUPLICATE_NAMED_CAPTURE,l);this.namedGroups[l]=this.numCap,B.name=l;return}e.skip(2);let s=this.flags,i=1,o=!1;e:for(;e.more();){const a=e.pop();switch(a){case k.CODES.get("i"):s|=M.FOLD_CASE,o=!0;break;case k.CODES.get("m"):s&=-17,o=!0;break;case k.CODES.get("s"):s|=M.DOT_NL,o=!0;break;case k.CODES.get("U"):s|=M.NON_GREEDY,o=!0;break;case k.CODES.get("-"):if(i<0)break e;i=-1,s=~s,o=!1;break;case k.CODES.get(":"):case k.CODES.get(")"):if(i<0){if(!o)break e;s=~s}a===k.CODES.get(":")&&this.op(A.Op.LEFT_PAREN),this.flags=s;return;default:break e}}throw new Re(j.ERR_INVALID_PERL_OP,e.from(t))}parsePosLookBehind(){const e=this.newRegexp(A.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=++this.nlb,this.push(e)}parseNegLookBehind(){const e=this.newRegexp(A.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=-++this.nlb,this.push(e)}parseVerticalBar(){this.concat(),this.swapVerticalBar()||this.op(A.Op.VERTICAL_BAR)}swapVerticalBar(){const e=this.stack.length;if(e>=3&&this.stack[e-2].op===A.Op.VERTICAL_BAR&&j.isCharClass(this.stack[e-1])&&j.isCharClass(this.stack[e-3])){let t=this.stack[e-1],n=this.stack[e-3];if(t.op>n.op){const s=n;n=t,t=s,this.stack[e-3]=n}return j.mergeCharClass(n,t),this.reuse(t),this.pop(),!0}if(e>=2){const t=this.stack[e-1],n=this.stack[e-2];if(n.op===A.Op.VERTICAL_BAR)return e>=3&&this.cleanAlt(this.stack[e-3]),this.stack[e-2]=t,this.stack[e-1]=n,!0}return!1}parseRightParen(){if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length<2)throw new Re(j.ERR_UNEXPECTED_PAREN,this.wholeRegexp);const e=this.pop(),t=this.pop();if(t.op!==A.Op.LEFT_PAREN)throw new Re(j.ERR_UNEXPECTED_PAREN,this.wholeRegexp);if(this.flags=t.flags,t.lb!==0){if(j.hasCapture(e))throw new Re(j.ERR_INVALID_CAPTURE_IN_LOOKBEHIND,this.wholeRegexp);t.lb>0?t.op=A.Op.PLB:t.op=A.Op.NLB,t.subs=[e],this.push(t);return}t.cap===0?this.push(e):(t.op=A.Op.CAPTURE,t.subs=[e],this.push(t))}parsePerlClassEscape(e,t){const n=e.pos();if(!(this.flags&M.PERL_X)||!e.more()||e.pop()!==k.CODES.get("\\")||!e.more())return!1;e.pop();const s=e.from(n),i=jf.has(s)?jf.get(s):null;return i===null?!1:(t.appendGroup(i,(this.flags&M.FOLD_CASE)!==0),!0)}parseNamedClass(e,t){const n=e.rest(),s=n.indexOf(":]");if(s<0)return!1;const i=n.substring(0,s+2);e.skipString(i);const o=iC.has(i)?iC.get(i):null;if(o===null)throw new Re(j.ERR_INVALID_CHAR_RANGE,i);return t.appendGroup(o,(this.flags&M.FOLD_CASE)!==0),!0}parseUnicodeClass(e,t){const n=e.pos();if(!(this.flags&M.UNICODE_GROUPS)||!e.lookingAt("\\p")&&!e.lookingAt("\\P"))return!1;e.skip(1);let s=1,i=e.pop();if(i===k.CODES.get("P")&&(s=-1),!e.more())throw e.rewindTo(n),new Re(j.ERR_INVALID_CHAR_RANGE,e.rest());i=e.pop();let o;if(i!==k.CODES.get("{"))o=te.runeToString(i);else{const B=e.rest(),d=B.indexOf("}");if(d<0)throw e.rewindTo(n),new Re(j.ERR_INVALID_CHAR_RANGE,e.rest());o=B.substring(0,d),e.skipString(o),e.skip(1)}o.length!==0&&o.codePointAt(0)===k.CODES.get("^")&&(s=0-s,o=o.substring(1));const a=j.unicodeTable(o);if(a===null)throw new Re(j.ERR_INVALID_CHAR_RANGE,e.from(n));a.sign<0&&(s=0-s);const u=a.tab,l=a.fold;if(!(this.flags&M.FOLD_CASE)||l===null)t.appendTableWithSign(u,s);else{const B=new Qn().appendTable(u).appendTable(l).cleanClass().toArray();t.appendClassWithSign(B,s)}return!0}parseClass(e){const t=e.pos();e.skip(1);const n=this.newRegexp(A.Op.CHAR_CLASS);n.flags=this.flags;const s=new Qn;let i=1;e.more()&&e.lookingAt("^")&&(i=-1,e.skip(1),this.flags&M.CLASS_NL||s.appendRange(k.CODES.get(`
`),k.CODES.get(`
`)));let o=!0;for(;!e.more()||e.peek()!==k.CODES.get("]")||o;){if(e.more()&&e.lookingAt("-")&&!(this.flags&M.PERL_X)&&!o){const B=e.rest();if(B==="-"||!B.startsWith("-]"))throw e.rewindTo(t),new Re(j.ERR_INVALID_CHAR_RANGE,e.rest())}o=!1;const a=e.pos();if(e.lookingAt("[:")){if(this.parseNamedClass(e,s))continue;e.rewindTo(a)}if(this.parseUnicodeClass(e,s)||this.parsePerlClassEscape(e,s))continue;e.rewindTo(a);const u=j.parseClassChar(e,t);let l=u;if(e.more()&&e.lookingAt("-")){if(e.skip(1),e.more()&&e.lookingAt("]"))e.skip(-1);else if(l=j.parseClassChar(e,t),l<u)throw new Re(j.ERR_INVALID_CHAR_RANGE,e.from(a))}this.flags&M.FOLD_CASE?s.appendFoldedRange(u,l):s.appendRange(u,l)}e.skip(1),s.cleanClass(),i<0&&s.negateClass(),n.runes=s.toArray(),this.push(n)}},q(j,"ERR_INTERNAL_ERROR","regexp/syntax: internal error"),q(j,"ERR_INVALID_CHAR_RANGE","invalid character class range"),q(j,"ERR_INVALID_ESCAPE","invalid escape sequence"),q(j,"ERR_INVALID_NAMED_CAPTURE","invalid named capture"),q(j,"ERR_INVALID_PERL_OP","invalid or unsupported Perl syntax"),q(j,"ERR_INVALID_REPEAT_OP","invalid nested repetition operator"),q(j,"ERR_INVALID_REPEAT_SIZE","invalid repeat count"),q(j,"ERR_MISSING_BRACKET","missing closing ]"),q(j,"ERR_MISSING_PAREN","missing closing )"),q(j,"ERR_MISSING_REPEAT_ARGUMENT","missing argument to repetition operator"),q(j,"ERR_TRAILING_BACKSLASH","trailing backslash at end of expression"),q(j,"ERR_DUPLICATE_NAMED_CAPTURE","duplicate capture group name"),q(j,"ERR_UNEXPECTED_PAREN","unexpected )"),q(j,"ERR_NESTING_DEPTH","expression nests too deeply"),q(j,"ERR_LARGE","expression too large"),q(j,"ERR_INVALID_CAPTURE_IN_LOOKBEHIND","invalid capture in lookbehind"),q(j,"MAX_HEIGHT",1e3),q(j,"MAX_SIZE",3355443),q(j,"MAX_RUNES",33554432),q(j,"ANY_TABLE",new m(new Uint32Array([0,W.MAX_RUNE,1]))),q(j,"ASCII_TABLE",new m(new Uint32Array([0,127,1]))),q(j,"ASCII_FOLD_TABLE",new m(new Uint32Array([0,127,1,383,383,1,8490,8490,1]))),j),ky=class Ur{static initTest(e){const t=Ur.compile(e),n=new Ur(t.expr,t.prog,t.numSubexp,t.longest);return n.cond=t.cond,n.prefix=t.prefix,n.prefixUTF8=t.prefixUTF8,n.prefixComplete=t.prefixComplete,n.prefixRune=t.prefixRune,n.prefilter=t.prefilter,n}static compile(e){return Ur.compileImpl(e,M.PERL,!1)}static compilePOSIX(e){return Ur.compileImpl(e,M.POSIX,!0)}static compileImpl(e,t,n){let s=Fy.parse(e,t);const i=s.maxCap();s=Ny.simplify(s);const o=vy.build(s),a=Py.compileRegexp(s),u=new Ur(e,a,i,n);u.prefilter=o.type===me.Type.NONE?null:o;const[l,B]=a.prefix();return u.prefixComplete=l,u.prefix=B,u.prefixUTF8=te.stringToUtf8ByteArray(u.prefix),u.prefix.length>0&&(u.prefixRune=u.prefix.codePointAt(0)),u.namedGroups=s.namedGroups,u}static match(e,t){return Ur.compile(e).match(t)}constructor(e,t,n=0,s=0){this.expr=e,this.prog=t,this.numSubexp=n,this.longest=s,this.cond=t.startCond(),this.prefix=null,this.prefixUTF8=null,this.prefixComplete=!1,this.prefixRune=0,this.machinePool=[],this.dfa=new _y(this.prog),this.onepass=Mf.compile(this.prog),this.prefilter=null}matchPrefixComplete(e,t,n,s){if((n===M.ANCHOR_START||n===M.ANCHOR_BOTH)&&t!==0)return null;let i=-1,o=-1;const a=e.prefixLength(this);if(n===M.UNANCHORED){const u=e.index(this,t);if(u<0)return null;i=t+u,o=i+a}else if(n===M.ANCHOR_BOTH){if(e.endPos()!==a||e.index(this,0)!==0)return null;i=0,o=a}else if(n===M.ANCHOR_START){if(e.index(this,0)!==0)return null;i=0,o=a}if(i<0)return null;if(s>0){const u=new Int32Array(s).fill(-1);return u[0]=i,u[1]=o,Array.from(u)}return[]}executeEngine(e,t,n,s){if(this.prefixComplete&&(s===0||this.numSubexp===0))return this.matchPrefixComplete(e,t,n,s);if(this.prefilter!==null&&n===M.UNANCHORED&&!this.prefilter.eval(e,t))return null;if(this.onepass!==null)return Mf.execute(this,e,t,n,s);if(s>0)return this.prog.numLb===0&&e.endPos()<=Ga.maxBitStateLen(this.prog)?Ga.execute(this,e,t,n,s):this.doExecuteNFA(e,t,n,s);if(this.prog.numLb===0){const i=this.dfa.match(e,t,n);if(i!==null)return i?[]:null;if(e.endPos()<=Ga.maxBitStateLen(this.prog))return Ga.execute(this,e,t,n,s)}return this.doExecuteNFA(e,t,n,s)}numberOfCapturingGroups(){return this.numSubexp}numberOfInstructions(){return this.prog.numInst()}get(){return this.machinePool.length>0?this.machinePool.pop():null}reset(){this.machinePool.length=0}put(e){this.machinePool.push(e)}toString(){return this.expr}doExecuteNFA(e,t,n,s){let i=this.get();i||(i=py.fromRE2(this)),i.init(s);const o=i.match(e,t,n)?i.submatches():null;return this.put(i),o}match(e){return this.executeEngine(Se.fromUTF16(e),0,M.UNANCHORED,0)!==null}matchWithGroup(e,t,n,s,i){return e instanceof cs||(te.isByteArray(e)?e=Qr.utf8(e):e=Qr.utf16(e)),this.matchMachineInput(e,t,n,s,i)}matchMachineInput(e,t,n,s,i){if(t>n)return[!1,null];const o=e.isUTF16Encoding()?Se.fromUTF16(e.asCharSequence(),0,n):Se.fromUTF8(e.asBytes(),0,n),a=this.executeEngine(o,t,s,2*i);return a===null?[!1,null]:[!0,a]}matchUTF8(e){return this.executeEngine(Se.fromUTF8(e),0,M.UNANCHORED,0)!==null}replaceAll(e,t){return this.replaceAllFunc(e,()=>t,2*e.length+1)}replaceFirst(e,t){return this.replaceAllFunc(e,()=>t,1)}replaceAllFunc(e,t,n){let s=0,i=0,o="";const a=Se.fromUTF16(e);let u=0;for(;i<=e.length;){const l=this.executeEngine(a,i,M.UNANCHORED,2);if(l===null||l.length===0)break;o+=e.substring(s,l[0]),(l[1]>s||l[0]===0)&&(o+=t(e.substring(l[0],l[1])),u++),s=l[1];const B=a.step(i)&7;if(i+B>l[1]?i+=B:i+1>l[1]?i++:i=l[1],u>=n)break}return o+=e.substring(s),o}pad(e){if(e===null)return null;let t=(1+this.numSubexp)*2;if(e.length<t){let n=new Array(t).fill(-1);for(let s=0;s<e.length;s++)n[s]=e[s];e=n}return e}allMatches(e,t,n=s=>s){let s=[];const i=e.endPos();t<0&&(t=i+1);let o=0,a=0,u=-1;for(;a<t&&o<=i;){const l=this.executeEngine(e,o,M.UNANCHORED,this.prog.numCap);if(l===null||l.length===0)break;let B=!0;if(l[1]===o){l[0]===u&&(B=!1);const d=e.step(o);d<0?o=i+1:o+=d&7}else o=l[1];u=l[1],B&&(s.push(n(this.pad(l))),a++)}return s}findUTF8(e){const t=this.executeEngine(Se.fromUTF8(e),0,M.UNANCHORED,2);return t===null?null:e.slice(t[0],t[1])}findUTF8Index(e){const t=this.executeEngine(Se.fromUTF8(e),0,M.UNANCHORED,2);return t===null?null:t.slice(0,2)}find(e){const t=this.executeEngine(Se.fromUTF16(e),0,M.UNANCHORED,2);return t===null?"":e.substring(t[0],t[1])}findIndex(e){return this.executeEngine(Se.fromUTF16(e),0,M.UNANCHORED,2)}findUTF8Submatch(e){const t=this.executeEngine(Se.fromUTF8(e),0,M.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.slice(t[2*s],t[2*s+1]));return n}findUTF8SubmatchIndex(e){return this.pad(this.executeEngine(Se.fromUTF8(e),0,M.UNANCHORED,this.prog.numCap))}findSubmatch(e){const t=this.executeEngine(Se.fromUTF16(e),0,M.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.substring(t[2*s],t[2*s+1]));return n}findSubmatchIndex(e){return this.pad(this.executeEngine(Se.fromUTF16(e),0,M.UNANCHORED,this.prog.numCap))}findAllUTF8(e,t){const n=this.allMatches(Se.fromUTF8(e),t,s=>e.slice(s[0],s[1]));return n.length===0?null:n}findAllUTF8Index(e,t){const n=this.allMatches(Se.fromUTF8(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAll(e,t){const n=this.allMatches(Se.fromUTF16(e),t,s=>e.substring(s[0],s[1]));return n.length===0?null:n}findAllIndex(e,t){const n=this.allMatches(Se.fromUTF16(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAllUTF8Submatch(e,t){const n=this.allMatches(Se.fromUTF8(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.slice(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllUTF8SubmatchIndex(e,t){const n=this.allMatches(Se.fromUTF8(e),t);return n.length===0?null:n}findAllSubmatch(e,t){const n=this.allMatches(Se.fromUTF16(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.substring(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllSubmatchIndex(e,t){const n=this.allMatches(Se.fromUTF16(e),t);return n.length===0?null:n}},Ly=class zs{static isHexadecimal(e){return"0"<=e&&e<="9"||"A"<=e&&e<="F"||"a"<=e&&e<="f"}static translate(e){let t="";if(e instanceof RegExp&&(e.ignoreCase&&(t+="i"),e.multiline&&(t+="m"),e.dotAll&&(t+="s"),e=e.source),typeof e!="string")return e;let n="",s=!1,i=e.length;i===0&&(n="(?:)",s=!0);let o=!1,a=0;for(;a<i;){let l=e[a];if(l==="\\"){if(a+1<i)switch(l=e[a+1],l){case"\\":n+="\\\\",a+=2;continue;case"c":if(a+2<i){let C=e[a+2].charCodeAt(0);if(C>=65&&C<=90||C>=97&&C<=122){let g=C%32;n+="\\x",n+=(g>>4).toString(16).toUpperCase(),n+=(g&15).toString(16).toUpperCase(),a+=3,s=!0;continue}}n+="c",a+=2,s=!0;continue;case"u":if(a+2<i){if(e[a+2]==="{"){let C=a+3,g=!1,D=!1;for(;C<i;){const P=e[C];if(P==="}"){D=!0;break}if(!zs.isHexadecimal(P))break;g=!0,C++}if(D&&g){n+="\\x",a+=2,s=!0;continue}}else if(a+5<i){let C=!0;for(let g=0;g<4;g++)if(!zs.isHexadecimal(e[a+2+g])){C=!1;break}if(C){n+="\\x{"+e.substring(a+2,a+6)+"}",a+=6,s=!0;continue}}}n+="u",a+=2,s=!0;continue;case"x":{let C=!1;if(a+2<i&&e[a+2]==="{"){let g=a+3,D=!1,P=!1;for(;g<i;){const x=e[g];if(x==="}"){P=!0;break}if(!zs.isHexadecimal(x))break;D=!0,g++}P&&D&&(C=!0)}else a+3<i&&zs.isHexadecimal(e[a+2])&&zs.isHexadecimal(e[a+3])&&(C=!0);C?(n+="\\x",a+=2):(n+="x",a+=2,s=!0);continue}case"n":case"r":case"t":case"a":case"f":case"v":case"d":case"D":case"s":case"S":case"w":case"W":case"b":case"B":case"p":case"P":case"A":case"z":case"Q":case"E":case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":n+="\\"+l,a+=2;continue;default:{let C=e.codePointAt(a+1);if(C>=48&&C<=57||C>=65&&C<=90||C>=97&&C<=122){let g=te.charCount(C);n+=e.substring(a+1,a+1+g),a+=g+1,s=!0}else{n+="\\";let g=te.charCount(C);n+=e.substring(a+1,a+1+g),a+=g+1}continue}}}else if(l==="/"){n+="\\/",a+=1,s=!0;continue}else if(l==="[")o=!0;else if(l==="]")o=!1;else if(!o&&l==="("&&a+2<i&&e[a+1]==="?"&&e[a+2]==="<"&&a+3<i&&!"=!>)".includes(e[a+3])){n+="(?P<",a+=3,s=!0;continue}let B=e.codePointAt(a),d=te.charCount(B);n+=e.substring(a,a+d),a+=d}const u=s?n:e;return t.length>0?`(?${t})${u}`:u}},He,OB=(He=class{static quote(e){return te.quoteMeta(e)}static quoteReplacement(e,t=!1){return kf.quoteReplacement(e,t)}static translateRegExp(e){return Ly.translate(e)}static compile(e,t=0){let n=e;if(t&He.CASE_INSENSITIVE&&(n=`(?i)${n}`),t&He.DOTALL&&(n=`(?s)${n}`),t&He.MULTILINE&&(n=`(?m)${n}`),t&-544)throw new Cy("Flags should only be a combination of MULTILINE, DOTALL, CASE_INSENSITIVE, DISABLE_UNICODE_GROUPS, LONGEST_MATCH, LOOKBEHINDS");let s=M.PERL;t&He.DISABLE_UNICODE_GROUPS&&(s&=-129),t&He.LOOKBEHINDS&&(s|=M.LOOKBEHIND);const i=new He(e,t);return i.re2Input=ky.compileImpl(n,s,(t&He.LONGEST_MATCH)!==0),i}static matches(e,t){return He.compile(e).testExact(t)}static initTest(e,t,n){if(e==null)throw new Error("pattern is null");if(n==null)throw new Error("re2 is null");const s=new He(e,t);return s.re2Input=n,s}constructor(e,t){this.patternInput=e,this.flagsInput=t,this.re2Input=null}reset(){this.re2Input.reset()}flags(){return this.flagsInput}pattern(){return this.patternInput}re2(){return this.re2Input}matches(e){return this.testExact(e)}matcher(e){return te.isByteArray(e)&&(e=Qr.utf8(e)),new kf(this,e)}test(e){return te.isByteArray(e)?this.re2Input.matchUTF8(e):this.re2Input.match(e)}testExact(e){const t=te.isByteArray(e)?Se.fromUTF8(e):Se.fromUTF16(e);return this.re2Input.executeEngine(t,0,M.ANCHOR_BOTH,0)!==null}exec(e){const t=this.matcher(e);if(!t.find())return null;const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;return n}split(e,t=0){const n=this.matcher(e),s=[];let i=0,o=0;for(;n.find();){if(o===0&&n.end()===0){o=n.end();continue}if(t>0&&s.length===t-1)break;if(o===n.start()){if(t===0){i+=1,o=n.end();continue}}else for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.start())),o=n.end()}if(t===0&&o!==n.inputLength()){for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.inputLength()))}return(t!==0||s.length===0&&!(o===n.inputLength()&&o>0))&&s.push(n.substring(o,n.inputLength())),s}*matchAll(e){const t=this.matcher(e);for(;t.find();){const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;yield n}}toString(){return this.patternInput}programSize(){return this.re2Input.numberOfInstructions()}groupCount(){return this.re2Input.numberOfCapturingGroups()}namedGroups(){return this.re2Input.namedGroups}equals(e){return this===e?!0:e===null||this.constructor!==e.constructor?!1:this.flagsInput===e.flagsInput&&this.patternInput===e.patternInput}},q(He,"CASE_INSENSITIVE",xs.CASE_INSENSITIVE),q(He,"DOTALL",xs.DOTALL),q(He,"MULTILINE",xs.MULTILINE),q(He,"DISABLE_UNICODE_GROUPS",xs.DISABLE_UNICODE_GROUPS),q(He,"LONGEST_MATCH",xs.LONGEST_MATCH),q(He,"LOOKBEHINDS",xs.LOOKBEHINDS),He);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let yi="12.19.0";function xy(r){yi=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ls=new SB("@firebase/firestore");function $s(){return ls.logLevel}function U(r,...e){if(ls.logLevel<=he.DEBUG){const t=e.map(FB);ls.debug(`Firestore (${yi}): ${r}`,...t)}}function Ge(r,...e){if(ls.logLevel<=he.ERROR){const t=e.map(FB);ls.error(`Firestore (${yi}): ${r}`,...t)}}function Wt(r,...e){if(ls.logLevel<=he.WARN){const t=e.map(FB);ls.warn(`Firestore (${yi}): ${r}`,...t)}}function FB(r){if(typeof r=="string")return r;try{return function(t){return JSON.stringify(t)}(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,qg(r,n,t)}function qg(r,e,t){let n=`FIRESTORE (${yi}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw Ge(n),new Error(n)}function H(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||qg(e,s,n)}function Y(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vy(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kB{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=Vy(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function oe(r,e){return r<e?-1:r>e?1:0}function zl(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return ml(s)===ml(i)?oe(s,i):ml(s)?1:-1}return oe(r.length,e.length)}const My=55296,Gy=57343;function ml(r){const e=r.charCodeAt(0);return e>=My&&e<=Gy}function si(r,e,t){return r.length===e.length&&r.every((n,s)=>t(n,e[s]))}function jg(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ae{constructor(e,t){this.comparator=e,this.root=t||tt.EMPTY}insert(e,t){return new Ae(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,tt.BLACK,null,null))}remove(e){return new Ae(this.comparator,this.root.remove(e,this.comparator).copy(null,null,tt.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Ha(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Ha(this.root,e,this.comparator,!1)}getReverseIterator(){return new Ha(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Ha(this.root,e,this.comparator,!0)}}class Ha{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class tt{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??tt.RED,this.left=s??tt.EMPTY,this.right=i??tt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new tt(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return tt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return tt.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,tt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,tt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw Q(43730,{key:this.key,value:this.value});if(this.right.isRed())throw Q(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw Q(27949);return e+(this.isRed()?0:1)}}tt.EMPTY=null,tt.RED=!0,tt.BLACK=!1;tt.EMPTY=new class{constructor(){this.size=0}get key(){throw Q(57766)}get value(){throw Q(16141)}get color(){throw Q(16727)}get left(){throw Q(29726)}get right(){throw Q(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new tt(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(e){this.comparator=e,this.data=new Ae(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new oC(this.data.getIterator())}getIteratorFrom(e){return new oC(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(n=>{t=t.add(n)}),t}isEqual(e){if(!(e instanceof Ee)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new Ee(this.comparator);return t.data=e,t}}class oC{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function Vs(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class G extends Kt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nn="__name__";class en{constructor(e,t,n){t===void 0?t=0:t>e.length&&Q(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&Q(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return en.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof en?e.forEach(n=>{t.push(n)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=en.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return oe(e.length,t.length)}static compareSegments(e,t){const n=en.isNumericId(e),s=en.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?en.extractNumericId(e).compare(en.extractNumericId(t)):zl(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return dr.fromString(e.substring(4,e.length-2))}}class Be extends en{construct(e,t,n){return new Be(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new G(O.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(s=>s.length>0))}return new Be(t)}static emptyPath(){return new Be([])}}const Uy=/^[_a-zA-Z][_a-zA-Z0-9]*$/;let ze=class Qs extends en{construct(e,t,n){return new Qs(e,t,n)}static isValidIdentifier(e){return Uy.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Qs.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===nn}static keyField(){return new Qs([nn])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new G(O.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const a=e[s];if(a==="\\"){if(s+1===e.length)throw new G(O.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new G(O.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(n+=a,s++):(i(),s++)}if(i(),o)throw new G(O.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Qs(t)}static emptyPath(){return new Qs([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(e){this.fields=e,e.sort(ze.comparator)}static empty(){return new wt([])}unionWith(e){let t=new Ee(ze.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new wt(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return si(this.fields,e.fields,(t,n)=>t.isEqual(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mu(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function Rr(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function Hy(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function Kg(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{constructor(e){this.path=e}static fromPath(e){return new z(Be.fromString(e))}static fromName(e){return new z(Be.fromString(e).popFirst(5))}static empty(){return new z(Be.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&Be.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return Be.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new z(new Be(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jg(r,e,t){if(!t)throw new G(O.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function qy(r,e,t,n){if(e===!0&&n===!0)throw new G(O.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function aC(r){if(!z.isDocumentKey(r))throw new G(O.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function uC(r){if(z.isDocumentKey(r))throw new G(O.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function ea(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function ec(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=function(n){return n.constructor?n.constructor.name:null}(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":Q(12329,{type:typeof r})}function nt(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new G(O.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=ec(r);throw new G(O.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function jy(r,e){if(e<=0)throw new G(O.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qe(r,e){const t={typeString:r};return e&&(t.value=e),t}function ta(r,e){if(!ea(r))throw new G(O.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new G(O.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cC=-62135596800,lC=1e6;class _e{static now(){return _e.fromMillis(Date.now())}static fromDate(e){return _e.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*lC);return new _e(t,n)}static fromInstant(e){if(!e||typeof e.t!="bigint")throw new G(O.INVALID_ARGUMENT,"Invalid Temporal.Instant object provided.");return _e._fromEpochNanoseconds(e.t)}static _fromEpochNanoseconds(e){let t,n;if(e>=0n)t=Number(e/1000000000n),n=Number(e%1000000000n);else{const s=e%1000000000n;s===0n?(t=Number(e/1000000000n),n=0):(t=Number(e/1000000000n-1n),n=Number(s+1000000000n))}return new _e(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new G(O.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new G(O.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<cC)throw new G(O.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new G(O.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/lC}toInstant(){if(typeof Temporal>"u"||!Temporal.Instant)throw new G(O.FAILED_PRECONDITION,"The Temporal object is not available in the current environment.");const e=1000000000n*BigInt(this.seconds)+BigInt(this.nanoseconds);return Temporal.Instant.__PRIVATE_fromEpochNanoseconds(e)}_compareTo(e){return this.seconds===e.seconds?oe(this.nanoseconds,e.nanoseconds):oe(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:_e._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(ta(e,_e._jsonSchema))return new _e(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-cC;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}_e._jsonSchemaVersion="firestore/timestamp/1.0",_e._jsonSchema={type:qe("string",_e._jsonSchemaVersion),seconds:qe("number"),nanoseconds:qe("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zg extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new zg("Invalid base64 string: "+i):i}}(e);return new Le(t)}static fromUint8Array(e){const t=function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i}(e);return new Le(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return oe(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Le.EMPTY_BYTE_STRING=new Le("");const Ky=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Nn(r){if(H(!!r,39018),typeof r=="string"){let e=0;const t=Ky.exec(r);if(H(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:be(r.seconds),nanos:be(r.nanos)}}function be(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function On(r){return typeof r=="string"?Le.fromBase64String(r):Le.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $g="server_timestamp",Qg="__type__",Wg="__previous_value__",Yg="__local_write_time__";function na(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[Qg])==null?void 0:n.stringValue)===$g}function ra(r){const e=r.mapValue.fields[Wg];return na(e)?ra(e):e}function ii(r){const e=Nn(r.mapValue.fields[Yg].timestampValue);return new _e(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jy{constructor(e,t,n,s,i,o,a,u,l,B,d,C,g){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=u,this.useFetchStreams=l,this.isUsingEmulator=B,this.apiKey=d,this._customHeaders=C,this.grpcFlowControlWindow=g}}const _u="(default)";class Bs{constructor(e,t){this.projectId=e,this.database=t||_u}static empty(){return new Bs("","")}get isDefaultDatabase(){return this.database===_u}isEqual(e){return e instanceof Bs&&e.projectId===this.projectId&&e.database===this.database}}function zy(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new G(O.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Bs(r.options.projectId,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ts=-1;function sa(r){return r==null}function oi(r){return r===0&&1/r==-1/0}function Xg(r){return typeof r=="number"&&Number.isInteger(r)&&!oi(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function $y(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LB="__type__",Zg="__max__",lr={mapValue:{fields:{__type__:{stringValue:Zg}}}},xB="__vector__",hs="value",cn={nullValue:"NULL_VALUE"},At={booleanValue:!0},Ze={booleanValue:!1};function je(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?na(r)?4:em(r)?9007199254740991:fs(r)?10:11:Q(28295,{value:r})}function qt(r,e,t){if(r===e)return!0;const n=je(r);if(n!==je(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return ii(r).isEqual(ii(e));case 3:return function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const a=Nn(i.timestampValue),u=Nn(o.timestampValue);return a.seconds===u.seconds&&a.nanos===u.nanos}(r,e);case 5:return r.stringValue===e.stringValue;case 6:return function(i,o){return On(i.bytesValue).isEqual(On(o.bytesValue))}(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return function(i,o){return be(i.geoPointValue.latitude)===be(o.geoPointValue.latitude)&&be(i.geoPointValue.longitude)===be(o.geoPointValue.longitude)}(r,e);case 2:return function(i,o,a){if("integerValue"in i&&"integerValue"in o)return be(i.integerValue)===be(o.integerValue);let u,l;if("doubleValue"in i&&"doubleValue"in o)u=be(i.doubleValue),l=be(o.doubleValue);else{if(!(a!=null&&a.i))return!1;u=be(i.integerValue??i.doubleValue),l=be(o.integerValue??o.doubleValue)}return u===l?!!(a!=null&&a.o)||oi(u)===oi(l):!!(a===void 0||a.u)&&isNaN(u)&&isNaN(l)}(r,e,t);case 9:return si(r.arrayValue.values||[],e.arrayValue.values||[],(s,i)=>qt(s,i,t));case 10:case 11:return function(i,o,a){const u=i.mapValue.fields||{},l=o.mapValue.fields||{};if(mu(u)!==mu(l))return!1;for(const B in u)if(u.hasOwnProperty(B)&&(l[B]===void 0||!qt(u[B],l[B],a)))return!1;return!0}(r,e,t);default:return Q(52216,{left:r})}}function No(r,e){return(r.values||[]).find(t=>qt(t,e))!==void 0}function Bt(r,e){if(r===e)return 0;const t=je(r),n=je(e);if(t!==n)return oe(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return oe(r.booleanValue,e.booleanValue);case 2:return function(i,o){const a=be(i.integerValue||i.doubleValue),u=be(o.integerValue||o.doubleValue);return a<u?-1:a>u?1:a===u?0:isNaN(a)?isNaN(u)?0:-1:1}(r,e);case 3:return BC(r.timestampValue,e.timestampValue);case 4:return BC(ii(r),ii(e));case 5:return zl(r.stringValue,e.stringValue);case 6:return function(i,o){const a=On(i),u=On(o);return a.compareTo(u)}(r.bytesValue,e.bytesValue);case 7:return function(i,o){const a=i.split("/"),u=o.split("/");for(let l=0;l<a.length&&l<u.length;l++){const B=oe(a[l],u[l]);if(B!==0)return B}return oe(a.length,u.length)}(r.referenceValue,e.referenceValue);case 8:return function(i,o){const a=oe(be(i.latitude),be(o.latitude));return a!==0?a:oe(be(i.longitude),be(o.longitude))}(r.geoPointValue,e.geoPointValue);case 9:return hC(r.arrayValue,e.arrayValue);case 10:return function(i,o){var C,g,D,P;const a=i.fields||{},u=o.fields||{},l=(C=a[hs])==null?void 0:C.arrayValue,B=(g=u[hs])==null?void 0:g.arrayValue,d=oe(((D=l==null?void 0:l.values)==null?void 0:D.length)||0,((P=B==null?void 0:B.values)==null?void 0:P.length)||0);return d!==0?d:hC(l,B)}(r.mapValue,e.mapValue);case 11:return function(i,o){if(i===lr.mapValue&&o===lr.mapValue)return 0;if(i===lr.mapValue)return 1;if(o===lr.mapValue)return-1;const a=i.fields||{},u=Object.keys(a),l=o.fields||{},B=Object.keys(l);u.sort(),B.sort();for(let d=0;d<u.length&&d<B.length;++d){const C=zl(u[d],B[d]);if(C!==0)return C;const g=Bt(a[u[d]],l[B[d]]);if(g!==0)return g}return oe(u.length,B.length)}(r.mapValue,e.mapValue);default:throw Q(23264,{l:t})}}function BC(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return oe(r,e);const t=Nn(r),n=Nn(e),s=oe(t.seconds,n.seconds);return s!==0?s:oe(t.nanos,n.nanos)}function hC(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=Bt(t[s],n[s]);if(i!==void 0&&i!==0)return i}return oe(t.length,n.length)}function ai(r){return $l(r)}function $l(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?function(t){const n=Nn(t);return`time(${n.seconds},${n.nanos})`}(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?function(t){return On(t).toBase64()}(r.bytesValue):"referenceValue"in r?function(t){return z.fromName(t).toString()}(r.referenceValue):"geoPointValue"in r?function(t){return`geo(${t.latitude},${t.longitude})`}(r.geoPointValue):"arrayValue"in r?function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=$l(i);return n+"]"}(r.arrayValue):"mapValue"in r?function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${$l(t.fields[o])}`;return s+"}"}(r.mapValue):Q(61005,{value:r})}function tu(r){switch(je(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=ra(r);return e?16+tu(e):16;case 5:return 2*r.stringValue.length;case 6:return On(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return function(n){return(n.values||[]).reduce((s,i)=>s+tu(i),0)}(r.arrayValue);case 10:case 11:return function(n){let s=0;return Rr(n.fields,(i,o)=>{s+=i.length+tu(o)}),s}(r.mapValue);default:throw Q(13486,{value:r})}}function ds(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function rn(r){return!!r&&"integerValue"in r}function Wr(r){return!!r&&"doubleValue"in r}function mr(r){return rn(r)||Wr(r)}function _r(r){return!!r&&"arrayValue"in r}function Ot(r){return!!r&&"nullValue"in r}function Rt(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function ns(r){return!!r&&"mapValue"in r}function fs(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[LB])==null?void 0:n.stringValue)===xB}function Ql(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[hs])==null?void 0:t.arrayValue}function Co(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return Rr(r.mapValue.fields,(t,n)=>e.mapValue.fields[t]=Co(n)),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Co(r.arrayValue.values[t]);return e}return{...r}}function em(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===Zg}const tm={mapValue:{fields:{[LB]:{stringValue:xB},[hs]:{arrayValue:{}}}}};function Qy(r){return"nullValue"in r?cn:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?ds(Bs.empty(),z.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?fs(r)?tm:{mapValue:{}}:Q(35942,{value:r})}function Wy(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?ds(Bs.empty(),z.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?tm:"mapValue"in r?fs(r)?{mapValue:{}}:lr:Q(61959,{value:r})}function dC(r,e){const t=Bt(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function fC(r,e){const t=Bt(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe{constructor(e){this.value=e}static empty(){return new Xe({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!ns(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Co(t)}setAll(e){let t=ze.emptyPath(),n={},s=[];e.forEach((o,a)=>{if(!t.isImmediateParentOf(a)){const u=this.getFieldsMap(t);this.applyChanges(u,n,s),n={},s=[],t=a.popLast()}o?n[a.lastSegment()]=Co(o):s.push(a.lastSegment())});const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());ns(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return qt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];ns(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){Rr(t,(s,i)=>e[s]=i);for(const s of n)delete e[s]}clone(){return new Xe(Co(this.value))}}function nm(r){const e=[];return Rr(r.fields,(t,n)=>{const s=new ze([t]);if(ns(n)){const i=nm(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)}),new wt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tc(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:oi(e)?"-0":e}}function VB(r){return{integerValue:""+r}}function nc(r,e,t){return Xg(e)?VB(e):tc(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rc{constructor(){this._=void 0}}function Yy(r,e,t){return r instanceof ui?function(s,i){const o={fields:{[Qg]:{stringValue:$g},[Yg]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&na(i)&&(i=ra(i)),i&&(o.fields[Wg]=i),{mapValue:o}}(t,e):r instanceof Cs?sm(r,e):r instanceof ci?im(r,e):r instanceof ps?function(s,i){const o=rm(s,i),a=Eu(o)+Eu(s.h);return rn(o)&&rn(s.h)?VB(a):tc(s.serializer,a)}(r,e):r instanceof Oo?function(s,i){return CC(s,i,Math.min)}(r,e):r instanceof Fo?function(s,i){return CC(s,i,Math.max)}(r,e):void 0}function Xy(r,e,t){return r instanceof Cs?sm(r,e):r instanceof ci?im(r,e):t}function rm(r,e){return r instanceof ps?mr(e)?e:{integerValue:0}:null}class ui extends rc{}class Cs extends rc{constructor(e){super(),this.elements=e}}function sm(r,e){const t=om(e);for(const n of r.elements)t.some(s=>qt(s,n))||t.push(n);return{arrayValue:{values:t}}}class ci extends rc{constructor(e){super(),this.elements=e}}function im(r,e){let t=om(e);for(const n of r.elements)t=t.filter(s=>!qt(s,n));return{arrayValue:{values:t}}}class MB extends rc{constructor(e,t){super(),this.serializer=e,this.h=t}}class ps extends MB{}class Oo extends MB{}class Fo extends MB{}function CC(r,e,t){if(!mr(e))return r.h;const n=t(Eu(e),Eu(r.h));return rn(e)&&rn(r.h)?VB(n):tc(r.serializer,n)}function Eu(r){return be(r.integerValue||r.doubleValue)}function om(r){return _r(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sc{constructor(e,t){this.field=e,this.transform=t}}function Zy(r,e){return r.field.isEqual(e.field)&&function(n,s){return n instanceof Cs&&s instanceof Cs||n instanceof ci&&s instanceof ci?si(n.elements,s.elements,qt):n instanceof ps&&s instanceof ps||n instanceof Oo&&s instanceof Oo||n instanceof Fo&&s instanceof Fo?qt(n.h,s.h):n instanceof ui&&s instanceof ui}(r.transform,e.transform)}class eT{constructor(e,t){this.version=e,this.transformResults=t}}class ke{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new ke}static exists(e){return new ke(void 0,e)}static updateTime(e){return new ke(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function nu(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class ic{}function am(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new Ai(r.key,ke.none()):new Ti(r.key,r.data,ke.none());{const t=r.data,n=Xe.empty();let s=new Ee(ze.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new Un(r.key,n,new wt(s.toArray()),ke.none())}}function tT(r,e,t){r instanceof Ti?function(s,i,o){const a=s.value.clone(),u=gC(s.fieldTransforms,i,o.transformResults);a.setAll(u),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()}(r,e,t):r instanceof Un?function(s,i,o){if(!nu(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=gC(s.fieldTransforms,i,o.transformResults),u=i.data;u.setAll(um(s)),u.setAll(a),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()}(r,e,t):function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,t)}function po(r,e,t,n){return r instanceof Ti?function(i,o,a,u){if(!nu(i.precondition,o))return a;const l=i.value.clone(),B=mC(i.fieldTransforms,u,o);return l.setAll(B),o.convertToFoundDocument(o.version,l).setHasLocalMutations(),null}(r,e,t,n):r instanceof Un?function(i,o,a,u){if(!nu(i.precondition,o))return a;const l=mC(i.fieldTransforms,u,o),B=o.data;return B.setAll(um(i)),B.setAll(l),o.convertToFoundDocument(o.version,B).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map(d=>d.field))}(r,e,t,n):function(i,o,a){return nu(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a}(r,e,t)}function nT(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=rm(n.transform,s||null);i!=null&&(t===null&&(t=Xe.empty()),t.set(n.field,i))}return t||null}function pC(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&si(n,s,(i,o)=>Zy(i,o))}(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class Ti extends ic{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Un extends ic{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function um(r){const e=new Map;return r.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}}),e}function gC(r,e,t){const n=new Map;H(r.length===t.length,32656,{T:t.length,P:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,a=e.data.field(i.field);n.set(i.field,Xy(o,a,t[s]))}return n}function mC(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,Yy(i,o,e))}return n}class Ai extends ic{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class GB extends ic{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Er{constructor(e,t){this.position=e,this.inclusive=t}}function _C(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=z.comparator(z.fromName(o.referenceValue),t.key):n=Bt(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function EC(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!qt(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cm{}class de extends cm{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new rT(e,t,n):t==="array-contains"?new oT(e,n):t==="in"?new Cm(e,n):t==="not-in"?new aT(e,n):t==="array-contains-any"?new uT(e,n):new de(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new sT(e,n):new iT(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Bt(t,this.value)):t!==null&&je(this.value)===je(t)&&this.matchesComparison(Bt(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return Q(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Ie extends cm{constructor(e,t){super(),this.filters=e,this.op=t,this.I=null}static create(e,t){return new Ie(e,t)}matches(e){return li(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.I!==null||(this.I=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.I}getFilters(){return Object.assign([],this.filters)}}function li(r){return r.op==="and"}function Wl(r){return r.op==="or"}function UB(r){return lm(r)&&li(r)}function lm(r){for(const e of r.filters)if(e instanceof Ie)return!1;return!0}function Yl(r){if(r instanceof de)return r.field.canonicalString()+r.op.toString()+ai(r.value);if(UB(r))return r.filters.map(e=>Yl(e)).join(",");{const e=r.filters.map(t=>Yl(t)).join(",");return`${r.op}(${e})`}}function Bm(r,e){return r instanceof de?function(n,s){return s instanceof de&&n.op===s.op&&n.field.isEqual(s.field)&&qt(n.value,s.value)}(r,e):r instanceof Ie?function(n,s){return s instanceof Ie&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce((i,o,a)=>i&&Bm(o,s.filters[a]),!0):!1}(r,e):void Q(19439)}function hm(r,e){const t=r.filters.concat(e);return Ie.create(t,r.op)}function dm(r){return r instanceof de?function(t){return`${t.field.canonicalString()} ${t.op} ${ai(t.value)}`}(r):r instanceof Ie?function(t){return t.op.toString()+" {"+t.getFilters().map(dm).join(" ,")+"}"}(r):"Filter"}class rT extends de{constructor(e,t,n){super(e,t,n),this.key=z.fromName(n.referenceValue)}matches(e){const t=z.comparator(e.key,this.key);return this.matchesComparison(t)}}class sT extends de{constructor(e,t){super(e,"in",t),this.keys=fm("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class iT extends de{constructor(e,t){super(e,"not-in",t),this.keys=fm("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function fm(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map(n=>z.fromName(n.referenceValue))}class oT extends de{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return _r(t)&&No(t.arrayValue,this.value)}}class Cm extends de{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&No(this.value.arrayValue,t)}}class aT extends de{constructor(e,t){super(e,"not-in",t)}matches(e){if(No(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!No(this.value.arrayValue,t)}}class uT extends de{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!_r(t)||!t.arrayValue.values)&&t.arrayValue.values.some(n=>No(this.value.arrayValue,n))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ko{constructor(e,t="asc"){this.field=e,this.dir=t}}function cT(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ee{static fromTimestamp(e){return new ee(e)}static min(){return new ee(new _e(0,0))}static max(){return new ee(new _e(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(e,t,n,s,i,o,a){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(e){return new Fe(e,0,ee.min(),ee.min(),ee.min(),Xe.empty(),0)}static newFoundDocument(e,t,n,s){return new Fe(e,1,t,ee.min(),n,s,0)}static newNoDocument(e,t){return new Fe(e,2,t,ee.min(),ee.min(),Xe.empty(),0)}static newUnknownDocument(e,t){return new Fe(e,3,t,ee.min(),ee.min(),Xe.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(ee.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Xe.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Xe.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=ee.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof Fe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Fe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bi=-1;class Iu{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function Xl(r){return r.fields.find(e=>e.kind===2)}function Hr(r){return r.fields.filter(e=>e.kind!==2)}Iu.UNKNOWN_ID=-1;class ru{constructor(e,t){this.fieldPath=e,this.kind=t}}class Lo{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new Lo(0,xt.min())}}function pm(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=ee.fromTimestamp(n===1e9?new _e(t+1,0):new _e(t,n));return new xt(s,z.empty(),e)}function gm(r){return new xt(r.readTime,r.key,Bi)}class xt{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new xt(ee.min(),z.empty(),Bi)}static max(){return new xt(ee.max(),z.empty(),Bi)}}function HB(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=z.comparator(r.documentKey,e.documentKey),t!==0?t:oe(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lT{constructor(e,t=null,n=[],s=[],i=null,o=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.R=null}}function Zl(r,e=null,t=[],n=[],s=null,i=null,o=null){return new lT(r,e,t,n,s,i,o)}function Du(r){const e=Y(r);if(e.R===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(n=>Yl(n)).join(","),t+="|ob:",t+=e.orderBy.map(n=>function(i){return i.field.canonicalString()+i.dir}(n)).join(","),sa(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(n=>ai(n)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(n=>ai(n)).join(",")),e.R=t}return e.R}function qB(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!cT(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!Bm(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!EC(r.startAt,e.startAt)&&EC(r.endAt,e.endAt)}function mn(r){return!!r.isCorePipeline}function jB(r){return!!r.path&&z.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function wu(r,e){return r.filters.filter(t=>t instanceof de&&t.field.isEqual(e))}function IC(r,e,t){let n=cn,s=!0;for(const i of wu(r,e)){let o=cn,a=!0;switch(i.op){case"<":case"<=":o=Qy(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,a=!1;break;case"!=":case"not-in":o=cn}dC({value:n,inclusive:s},{value:o,inclusive:a})<0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];dC({value:n,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}function DC(r,e,t){let n=lr,s=!0;for(const i of wu(r,e)){let o=lr,a=!0;switch(i.op){case">=":case">":o=Wy(i.value),a=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,a=!1;break;case"!=":case"not-in":o=lr}fC({value:n,inclusive:s},{value:o,inclusive:a})>0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];fC({value:n,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class As{constructor(e,t=null,n=[],s=[],i=null,o="F",a=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=u,this.A=null,this.V=null,this.m=null,this.startAt,this.endAt}}function mm(r,e,t,n,s,i,o,a){return new As(r,e,t,n,s,i,o,a)}function ia(r){return new As(r)}function wC(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function BT(r){return z.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function KB(r){return r.collectionGroup!==null}function ei(r){const e=Y(r);if(e.A===null){e.A=[];const t=new Set;for(const i of e.explicitOrderBy)e.A.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new Ee(ze.comparator);return o.filters.forEach(u=>{u.getFlattenedFilters().forEach(l=>{l.isInequality()&&(a=a.add(l.field))})}),a})(e).forEach(i=>{t.has(i.canonicalString())||i.isKeyField()||e.A.push(new ko(i,n))}),t.has(ze.keyField().canonicalString())||e.A.push(new ko(ze.keyField(),n))}return e.A}function kt(r){const e=Y(r);return e.V||(e.V=hT(e,ei(r))),e.V}function hT(r,e){if(r.limitType==="F")return Zl(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map(s=>{const i=s.dir==="desc"?"asc":"desc";return new ko(s.field,i)});const t=r.endAt?new Er(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Er(r.startAt.position,r.startAt.inclusive):null;return Zl(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function eB(r,e){const t=r.filters.concat([e]);return new As(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function dT(r,e){const t=r.explicitOrderBy.concat([e]);return new As(r.path,r.collectionGroup,t,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function yu(r,e,t){return new As(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function fT(r,e){return new As(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),r.limit,r.limitType,e,r.endAt)}function CT(r,e){return qB(kt(r),kt(e))&&r.limitType===e.limitType}function go(r){return`Query(target=${function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map(s=>dm(s)).join(", ")}]`),sa(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map(s=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(s)).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map(s=>ai(s)).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map(s=>ai(s)).join(",")),`Target(${n})`}(kt(r))}; limitType=${r.limitType})`}function oc(r,e){return e.isFoundDocument()&&function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):z.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)}(r,e)&&function(n,s){for(const i of ei(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0}(r,e)&&function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0}(r,e)&&function(n,s){return!(n.startAt&&!function(o,a,u){const l=_C(o,a,u);return o.inclusive?l<=0:l<0}(n.startAt,ei(n),s)||n.endAt&&!function(o,a,u){const l=_C(o,a,u);return o.inclusive?l>=0:l>0}(n.endAt,ei(n),s))}(r,e)}function JB(r){return(e,t)=>{let n=!1;for(const s of ei(r)){const i=pT(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function pT(r,e,t){const n=r.field.isKeyField()?z.comparator(e.key,t.key):function(i,o,a){const u=o.data.field(i),l=a.data.field(i);return u!==null&&l!==null?Bt(u,l):Q(42886)}(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return Q(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gT{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ue,pe;function _m(r){switch(r){case O.OK:return Q(64938);case O.CANCELLED:case O.UNKNOWN:case O.DEADLINE_EXCEEDED:case O.RESOURCE_EXHAUSTED:case O.INTERNAL:case O.UNAVAILABLE:case O.UNAUTHENTICATED:return!1;case O.INVALID_ARGUMENT:case O.NOT_FOUND:case O.ALREADY_EXISTS:case O.PERMISSION_DENIED:case O.FAILED_PRECONDITION:case O.ABORTED:case O.OUT_OF_RANGE:case O.UNIMPLEMENTED:case O.DATA_LOSS:return!0;default:return Q(15467,{code:r})}}function Em(r){if(r===void 0)return Ge("GRPC error has no .code"),O.UNKNOWN;switch(r){case Ue.OK:return O.OK;case Ue.CANCELLED:return O.CANCELLED;case Ue.UNKNOWN:return O.UNKNOWN;case Ue.DEADLINE_EXCEEDED:return O.DEADLINE_EXCEEDED;case Ue.RESOURCE_EXHAUSTED:return O.RESOURCE_EXHAUSTED;case Ue.INTERNAL:return O.INTERNAL;case Ue.UNAVAILABLE:return O.UNAVAILABLE;case Ue.UNAUTHENTICATED:return O.UNAUTHENTICATED;case Ue.INVALID_ARGUMENT:return O.INVALID_ARGUMENT;case Ue.NOT_FOUND:return O.NOT_FOUND;case Ue.ALREADY_EXISTS:return O.ALREADY_EXISTS;case Ue.PERMISSION_DENIED:return O.PERMISSION_DENIED;case Ue.FAILED_PRECONDITION:return O.FAILED_PRECONDITION;case Ue.ABORTED:return O.ABORTED;case Ue.OUT_OF_RANGE:return O.OUT_OF_RANGE;case Ue.UNIMPLEMENTED:return O.UNIMPLEMENTED;case Ue.DATA_LOSS:return O.DATA_LOSS;default:return Q(39323,{code:r})}}(pe=Ue||(Ue={}))[pe.OK=0]="OK",pe[pe.CANCELLED=1]="CANCELLED",pe[pe.UNKNOWN=2]="UNKNOWN",pe[pe.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",pe[pe.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",pe[pe.NOT_FOUND=5]="NOT_FOUND",pe[pe.ALREADY_EXISTS=6]="ALREADY_EXISTS",pe[pe.PERMISSION_DENIED=7]="PERMISSION_DENIED",pe[pe.UNAUTHENTICATED=16]="UNAUTHENTICATED",pe[pe.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",pe[pe.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",pe[pe.ABORTED=10]="ABORTED",pe[pe.OUT_OF_RANGE=11]="OUT_OF_RANGE",pe[pe.UNIMPLEMENTED=12]="UNIMPLEMENTED",pe[pe.INTERNAL=13]="INTERNAL",pe[pe.UNAVAILABLE=14]="UNAVAILABLE",pe[pe.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){Rr(this.inner,(t,n)=>{for(const[s,i]of n)e(s,i)})}isEmpty(){return Kg(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mT=new Ae(z.comparator);function Je(){return mT}const Im=new Ae(z.comparator);function jr(...r){let e=Im;for(const t of r)e=e.insert(t.key,t);return e}function Dm(r){let e=Im;return r.forEach((t,n)=>e=e.insert(t,n.overlayedDocument)),e}function Gt(){return mo()}function wm(){return mo()}function mo(){return new Hn(r=>r.toString(),(r,e)=>r.isEqual(e))}const _T=new Ae(z.comparator),ET=new Ee(z.comparator);function ce(...r){let e=ET;for(const t of r)e=e.add(t);return e}const IT=new Ee(oe);function zB(){return IT}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function DT(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wT=new dr([4294967295,4294967295],0);function yC(r){const e=DT().encode(r),t=new Pg;return t.update(e),new Uint8Array(t.digest())}function TC(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new dr([t,n],0),new dr([s,i],0)]}class $B{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new lo(`Invalid padding: ${t}`);if(n<0)throw new lo(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new lo(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new lo(`Invalid padding when bitmap length is 0: ${t}`);this.p=8*e.length-t,this.S=dr.fromNumber(this.p)}v(e,t,n){let s=e.add(t.multiply(dr.fromNumber(n)));return s.compare(wT)===1&&(s=new dr([s.getBits(0),s.getBits(1)],0)),s.modulo(this.S).toNumber()}D(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.p===0)return!1;const t=yC(e),[n,s]=TC(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);if(!this.D(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new $B(i,s,t);return n.forEach(a=>o.insert(a)),o}insert(e){if(this.p===0)return;const t=yC(e),[n,s]=TC(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);this.C(o)}}C(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class lo extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ri{constructor(e,t,n,s,i,o){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,oa.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new Ri(ee.min(),s,new Ae(oe),Je(),Je(),ce())}}class oa{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new oa(n,t,ce(),ce(),ce())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class su{constructor(e,t,n,s){this.F=e,this.removedTargetIds=t,this.key=n,this.O=s}}class ym{constructor(e,t){this.targetId=e,this.M=t}}class Tm{constructor(e,t,n=Le.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class AC{constructor(e){this.targetId=e,this.N=0,this.L=RC(),this.B=Le.EMPTY_BYTE_STRING,this.U=!1,this.k=!0}get current(){return this.U}get resumeToken(){return this.B}get q(){return this.N!==0}get $(){return this.k}K(e){e.approximateByteSize()>0&&(this.k=!0,this.B=e)}W(){let e=ce(),t=ce(),n=ce();return this.L.forEach((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:Q(38017,{changeType:i})}}),new oa(this.B,this.U,e,t,n)}G(){this.k=!1,this.L=RC()}j(e,t){this.k=!0,this.L=this.L.insert(e,t)}H(e){this.k=!0,this.L=this.L.remove(e)}J(){this.N+=1}Y(){this.N-=1,H(this.N>=0,3241,{N:this.N,targetId:this.targetId})}Z(){this.k=!0,this.U=!0}}const eo="WatchChangeAggregator";class yT{constructor(e){this.X=e,this.ee=new Map,this.te=Je(),this.ne=qa(),this.re=Je(),this.ie=qa(),this.se=new Ae(oe)}_e(e){for(const t of e.F)e.O&&e.O.isFoundDocument()?this.oe(t,e.O):this.ae(t,e.key,e.O);for(const t of e.removedTargetIds)this.ae(t,e.key,e.O)}ue(e){this.forEachTarget(e,t=>{const n=this.ee.get(t);if(n)switch(e.state){case 0:this.ce(t)&&n.K(e.resumeToken);break;case 1:n.Y(),n.q||n.G(),n.K(e.resumeToken);break;case 2:n.Y(),n.q||this.removeTarget(t);break;case 3:this.ce(t)&&(n.Z(),n.K(e.resumeToken));break;case 4:this.ce(t)&&(this.le(t),n.K(e.resumeToken));break;default:Q(56790,{state:e.state})}else U(eo,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ee.forEach((n,s)=>{this.ce(s)&&t(s)})}Ee(e){var t;return mn(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:jB(e)}he(e){const t=e.targetId,n=e.M.count,s=this.Te(t);if(s){const i=s.target;if(this.Ee(i))if(n===0){const o=new z(mn(i)?Be.fromString(i.getPipelineDocuments()[0]):i.path);this.ae(t,o,Fe.newNoDocument(o,ee.min()))}else H(n===1,20013,"Single document existence filter with count: "+n);else{const o=this.Pe(t);if(o!==n){const a=this.Ie(e),u=a?this.Re(a,e,o):1;if(u!==0){this.le(t);const l=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.se=this.se.insert(t,l)}}}}}Ie(e){const t=e.M.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,a;try{o=On(n).toUint8Array()}catch(u){if(u instanceof zg)return Wt("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{a=new $B(o,s,i)}catch(u){return Wt(u instanceof lo?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return a.p===0?null:a}Re(e,t,n){return t.M.count===n-this.de(e,t.targetId)?0:2}de(e,t){const n=this.X.getRemoteKeysForTarget(t);let s=0;return n.forEach(i=>{const o=this.X.Ve(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(a)||(this.ae(t,i,null),s++)}),s}fe(e){const t=new Map;this.ee.forEach((i,o)=>{const a=this.Te(o);if(a){if(i.current&&this.Ee(a.target)){const u=mn(a.target)?Be.fromString(a.target.getPipelineDocuments()[0]):a.target.path,l=new z(u);this.me(l).has(o)||this.pe(o,l)||this.ae(o,l,Fe.newNoDocument(l,e))}i.$&&(t.set(o,i.W()),i.G())}});let n=ce();this.ie.forEach((i,o)=>{let a=!0;o.forEachWhile(u=>{const l=this.Te(u);return!l||l.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)}),a&&(n=n.add(i))}),this.te.forEach((i,o)=>o.setReadTime(e)),this.re.forEach((i,o)=>o.setReadTime(e));const s=new Ri(e,t,this.se,this.te,this.re,n);return this.te=Je(),this.ne=qa(),this.re=Je(),this.ie=qa(),this.se=new Ae(oe),s}oe(e,t){const n=this.ee.get(e);if(!n||!this.ce(e))return void U(eo,`addDocumentToTarget received document for unknown inactive target (${e})`);const s=this.pe(e,t.key)?2:0;n.j(t.key,s),mn(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t.key,t):this.te=this.te.insert(t.key,t),this.ne=this.ne.insert(t.key,this.me(t.key).add(e)),this.ie=this.ie.insert(t.key,this.ge(t.key).add(e))}ae(e,t,n){const s=this.ee.get(e);s&&this.ce(e)?(this.pe(e,t)?s.j(t,1):s.H(t),this.ie=this.ie.insert(t,this.ge(t).delete(e)),this.ie=this.ie.insert(t,this.ge(t).add(e)),n&&(mn(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t,n):this.te=this.te.insert(t,n))):U(eo,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.ee.delete(e)}Pe(e){const t=this.ee.get(e);if(!t)return 0;const n=t.W();return this.X.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}J(e){let t=this.ee.get(e);t||(U(eo,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new AC(e),this.ee.set(e,t)),t.J()}ge(e){let t=this.ie.get(e);return t||(t=new Ee(oe),this.ie=this.ie.insert(e,t)),t}me(e){let t=this.ne.get(e);return t||(t=new Ee(oe),this.ne=this.ne.insert(e,t)),t}ce(e){const t=this.Te(e)!==null;return t||U(eo,"Detected inactive target",e),t}Te(e){const t=this.ee.get(e);return t===void 0||t.q?null:this.X.ye(e)}le(e){this.ee.set(e,new AC(e)),this.X.getRemoteKeysForTarget(e).forEach(t=>{this.ae(e,t,null)})}pe(e,t){return this.X.getRemoteKeysForTarget(e).has(t)}}function qa(){return new Ae(z.comparator)}function RC(){return new Ae(z.comparator)}const TT={asc:"ASCENDING",desc:"DESCENDING"},AT={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},RT={and:"AND",or:"OR"};class bT{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function tB(r,e){return r.useProto3Json||sa(e)?e:{value:e}}function rs(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function QB(r){const e=Nn(r);return new _e(e.seconds,e.nanos)}function Am(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function iu(r,e){return rs(r,e.toTimestamp())}function et(r){return H(!!r,49232),ee.fromTimestamp(QB(r))}function WB(r,e){return nB(r,e).canonicalString()}function nB(r,e){const t=function(s){return new Be(["projects",s.projectId,"databases",s.database])}(r).child("documents");return e===void 0?t:t.child(e)}function Rm(r){const e=Be.fromString(r);return H(xm(e),10190,{key:e.toString()}),e}function hi(r,e){return WB(r.databaseId,e.path)}function Tn(r,e){const t=Rm(e);if(t.get(1)!==r.databaseId.projectId)throw new G(O.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new G(O.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new z(Sm(t))}function bm(r,e){return WB(r.databaseId,e)}function vm(r){const e=Rm(r);return e.length===4?Be.emptyPath():Sm(e)}function rB(r){return new Be(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function Sm(r){return H(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function bC(r,e,t){return{name:hi(r,e),fields:t.value.mapValue.fields}}function vT(r,e,t){const n=Tn(r,e.name),s=et(e.updateTime),i=e.createTime?et(e.createTime):ee.min(),o=new Xe({mapValue:{fields:e.fields}}),a=Fe.newFoundDocument(n,s,i,o);return t&&a.setHasCommittedMutations(),t?a.setHasCommittedMutations():a}function ST(r,e){return"found"in e?function(n,s){H(!!s.found,43571),s.found.name,s.found.updateTime;const i=Tn(n,s.found.name),o=et(s.found.updateTime),a=s.found.createTime?et(s.found.createTime):ee.min(),u=new Xe({mapValue:{fields:s.found.fields}});return Fe.newFoundDocument(i,o,a,u)}(r,e):"missing"in e?function(n,s){H(!!s.missing,3894),H(!!s.readTime,22933);const i=Tn(n,s.missing),o=et(s.readTime);return Fe.newNoDocument(i,o)}(r,e):Q(7234,{result:e})}function PT(r,e){let t;if("targetChange"in e){e.targetChange;const n=function(l){return l==="NO_CHANGE"?0:l==="ADD"?1:l==="REMOVE"?2:l==="CURRENT"?3:l==="RESET"?4:Q(39313,{state:l})}(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=function(l,B){return l.useProto3Json?(H(B===void 0||typeof B=="string",58123),Le.fromBase64String(B||"")):(H(B===void 0||B instanceof Buffer||B instanceof Uint8Array,16193),Le.fromUint8Array(B||new Uint8Array))}(r,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&function(l){const B=l.code===void 0?O.UNKNOWN:Em(l.code);return new G(B,l.message||"")}(o);t=new Tm(n,s,i,a||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=Tn(r,n.document.name),i=et(n.document.updateTime),o=n.document.createTime?et(n.document.createTime):ee.min(),a=new Xe({mapValue:{fields:n.document.fields}}),u=Fe.newFoundDocument(s,i,o,a),l=n.targetIds||[],B=n.removedTargetIds||[];t=new su(l,B,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=Tn(r,n.document),i=n.readTime?et(n.readTime):ee.min(),o=Fe.newNoDocument(s,i),a=n.removedTargetIds||[];t=new su([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=Tn(r,n.document),i=n.removedTargetIds||[];t=new su([],i,s,null)}else{if(!("filter"in e))return Q(11601,{we:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new gT(s,i),a=n.targetId;t=new ym(a,o)}}return t}function xo(r,e){let t;if(e instanceof Ti)t={update:bC(r,e.key,e.value)};else if(e instanceof Ai)t={delete:hi(r,e.key)};else if(e instanceof Un)t={update:bC(r,e.key,e.data),updateMask:xT(e.fieldMask)};else{if(!(e instanceof GB))return Q(16599,{be:e.type});t={verify:hi(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(n=>function(i,o){const a=o.transform;if(a instanceof ui)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof Cs)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof ci)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof ps)return{fieldPath:o.field.canonicalString(),increment:a.h};if(a instanceof Oo)return{fieldPath:o.field.canonicalString(),minimum:a.h};if(a instanceof Fo)return{fieldPath:o.field.canonicalString(),maximum:a.h};throw Q(20930,{transform:o.transform})}(0,n))),e.precondition.isNone||(t.currentDocument=function(s,i){return i.updateTime!==void 0?{updateTime:iu(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:Q(27497)}(r,e.precondition)),t}function sB(r,e){const t=e.currentDocument?function(i){return i.updateTime!==void 0?ke.updateTime(et(i.updateTime)):i.exists!==void 0?ke.exists(i.exists):ke.none()}(e.currentDocument):ke.none(),n=e.updateTransforms?e.updateTransforms.map(s=>function(o,a){let u=null;if("setToServerValue"in a)H(a.setToServerValue==="REQUEST_TIME",16630,{proto:a}),u=new ui;else if("appendMissingElements"in a){const B=a.appendMissingElements.values||[];u=new Cs(B)}else if("removeAllFromArray"in a){const B=a.removeAllFromArray.values||[];u=new ci(B)}else"increment"in a?u=new ps(o,a.increment):"minimum"in a?u=new Oo(o,a.minimum):"maximum"in a?u=new Fo(o,a.maximum):Q(16584,{proto:a});const l=ze.fromServerFormat(a.fieldPath);return new sc(l,u)}(r,s)):[];if(e.update){e.update.name;const s=Tn(r,e.update.name),i=new Xe({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=function(u){const l=u.fieldPaths||[];return new wt(l.map(B=>ze.fromServerFormat(B)))}(e.updateMask);return new Un(s,i,o,t,n)}return new Ti(s,i,t,n)}if(e.delete){const s=Tn(r,e.delete);return new Ai(s,t)}if(e.verify){const s=Tn(r,e.verify);return new GB(s,t)}return Q(1463,{proto:e})}function NT(r,e){return r&&r.length>0?(H(e!==void 0,14353),r.map(t=>function(s,i){let o=s.updateTime?et(s.updateTime):et(i);return o.isEqual(ee.min())&&(o=et(i)),new eT(o,s.transformResults||[])}(t,e))):[]}function Pm(r,e){return{documents:[bm(r,e.path)]}}function Nm(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=bm(r,s);const i=function(l){if(l.length!==0)return Lm(Ie.create(l,"and"))}(e.filters);i&&(t.structuredQuery.where=i);const o=function(l){if(l.length!==0)return l.map(B=>function(C){return{field:Ws(C.field),direction:FT(C.dir)}}(B))}(e.orderBy);o&&(t.structuredQuery.orderBy=o);const a=tB(r,e.limit);return a!==null&&(t.structuredQuery.limit=a),e.startAt&&(t.structuredQuery.startAt=function(l){return{before:l.inclusive,values:l.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(l){return{before:!l.inclusive,values:l.position}}(e.endAt)),{Se:t,parent:s}}function Om(r){let e=vm(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){H(n===1,65062);const B=t.from[0];B.allDescendants?s=B.collectionId:e=e.child(B.collectionId)}let i=[];t.where&&(i=function(d){const C=km(d);return C instanceof Ie&&UB(C)?C.getFilters():[C]}(t.where));let o=[];t.orderBy&&(o=function(d){return d.map(C=>function(D){return new ko(Ys(D.field),function(x){switch(x){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(D.direction))}(C))}(t.orderBy));let a=null;t.limit&&(a=function(d){let C;return C=typeof d=="object"?d.value:d,sa(C)?null:C}(t.limit));let u=null;t.startAt&&(u=function(d){const C=!!d.before,g=d.values||[];return new Er(g,C)}(t.startAt));let l=null;return t.endAt&&(l=function(d){const C=!d.before,g=d.values||[];return new Er(g,C)}(t.endAt)),mm(e,s,o,i,a,"F",u,l)}function OT(r,e){const t=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return Q(28987,{purpose:s})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function Fm(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map(t=>t._toProto(r))}}}}function km(r){return r.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Ys(t.unaryFilter.field);return de.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Ys(t.unaryFilter.field);return de.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Ys(t.unaryFilter.field);return de.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Ys(t.unaryFilter.field);return de.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return Q(61313);default:return Q(60726)}}(r):r.fieldFilter!==void 0?function(t){return de.create(Ys(t.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return Q(58110);default:return Q(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(r):r.compositeFilter!==void 0?function(t){return Ie.create(t.compositeFilter.filters.map(n=>km(n)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return Q(1026)}}(t.compositeFilter.op))}(r):Q(30097,{filter:r})}function FT(r){return TT[r]}function kT(r){return AT[r]}function LT(r){return RT[r]}function Ws(r){return{fieldPath:r.canonicalString()}}function Ys(r){return ze.fromServerFormat(r.fieldPath)}function Lm(r){return r instanceof de?function(t){if(t.op==="=="){if(Rt(t.value))return{unaryFilter:{field:Ws(t.field),op:"IS_NAN"}};if(Ot(t.value))return{unaryFilter:{field:Ws(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Rt(t.value))return{unaryFilter:{field:Ws(t.field),op:"IS_NOT_NAN"}};if(Ot(t.value))return{unaryFilter:{field:Ws(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Ws(t.field),op:kT(t.op),value:t.value}}}(r):r instanceof Ie?function(t){const n=t.getFilters().map(s=>Lm(s));return n.length===1?n[0]:{compositeFilter:{op:LT(t.op),filters:n}}}(r):Q(54877,{filter:r})}function xT(r){const e=[];return r.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function xm(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function Vm(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function Vo(r,e){const t={fields:{}};return e.forEach((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)}),{mapValue:t}}function Mm(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ac(r){return new bT(r,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nt{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Nt(Le.fromBase64String(e))}catch(t){throw new G(O.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Nt(Le.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Nt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(ta(e,Nt._jsonSchema))return Nt.fromBase64String(e.bytes)}}Nt._jsonSchemaVersion="firestore/bytes/1.0",Nt._jsonSchema={type:qe("string",Nt._jsonSchemaVersion),bytes:qe("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bi{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new G(O.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ze(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function VT(){return new bi(nn)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vi{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ln{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new G(O.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new G(O.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return oe(this._lat,e._lat)||oe(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ln._jsonSchemaVersion}}static fromJSON(e){if(ta(e,ln._jsonSchema))return new ln(e.latitude,e.longitude)}}ln._jsonSchemaVersion="firestore/geoPoint/1.0",ln._jsonSchema={type:qe("string",ln._jsonSchemaVersion),latitude:qe("number"),longitude:qe("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}ot.UNAUTHENTICATED=new ot(null),ot.GOOGLE_CREDENTIALS=new ot("google-credentials-uid"),ot.FIRST_PARTY=new ot("first-party-uid"),ot.MOCK_USER=new ot("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class MT{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class GT{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(ot.UNAUTHENTICATED))}shutdown(){}}class UT{constructor(e){this.De=e,this.currentUser=ot.UNAUTHENTICATED,this.xe=0,this.forceRefresh=!1,this.auth=null}start(e,t){H(this.Ce===void 0,42304);let n=this.xe;const s=u=>this.xe!==n?(n=this.xe,t(u)):Promise.resolve();let i=new Ut;this.Ce=()=>{this.xe++,this.currentUser=this.Fe(),i.resolve(),i=new Ut,e.enqueueRetryable(()=>s(this.currentUser))};const o=()=>{const u=i;e.enqueueRetryable(async()=>{await u.promise,await s(this.currentUser)})},a=u=>{U("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.Ce&&(this.auth.addAuthTokenListener(this.Ce),o())};this.De.onInit(u=>a(u)),setTimeout(()=>{if(!this.auth){const u=this.De.getImmediate({optional:!0});u?a(u):(U("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Ut)}},0),o()}getToken(){const e=this.xe,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(n=>this.xe!==e?(U("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(H(typeof n.accessToken=="string",31837,{Oe:n}),new MT(n.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.Ce&&this.auth.removeAuthTokenListener(this.Ce),this.Ce=void 0}Fe(){const e=this.auth&&this.auth.getUid();return H(e===null||typeof e=="string",2055,{Me:e}),new ot(e)}}class HT{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n,this.type="FirstParty",this.user=ot.FIRST_PARTY,this.Ue=new Map}ke(){return this.Be?this.Be():null}get headers(){this.Ue.set("X-Goog-AuthUser",this.Ne);const e=this.ke();return e&&this.Ue.set("Authorization",e),this.Le&&this.Ue.set("X-Goog-Iam-Authorization-Token",this.Le),this.Ue}}class qT{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n}getToken(){return Promise.resolve(new HT(this.Ne,this.Le,this.Be))}start(e,t){e.enqueueRetryable(()=>t(ot.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class vC{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class jT{constructor(e,t){this.qe=t,this.forceRefresh=!1,this.appCheck=null,this.$e=null,this.Ke=null,pt(e)&&e.settings.appCheckToken&&(this.Ke=e.settings.appCheckToken)}start(e,t){H(this.Ce===void 0,3512);const n=i=>{i.error!=null&&U("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.$e;return this.$e=i.token,U("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.Ce=i=>{e.enqueueRetryable(()=>n(i))};const s=i=>{U("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.Ce&&this.appCheck.addTokenListener(this.Ce)};this.qe.onInit(i=>s(i)),setTimeout(()=>{if(!this.appCheck){const i=this.qe.getImmediate({optional:!0});i?s(i):U("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.Ke)return Promise.resolve(new vC(this.Ke));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(H(typeof t.token=="string",44558,{tokenResult:t}),this.$e=t.token,new vC(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.Ce&&this.appCheck.removeTokenListener(this.Ce),this.Ce=void 0}}function Gm(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class KT{Qe(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const SC="ConnectivityMonitor";class PC{constructor(){this.We=()=>this.Ge(),this.ze=()=>this.je(),this.He=[],this.Je()}Qe(e){this.He.push(e)}shutdown(){window.removeEventListener("online",this.We),window.removeEventListener("offline",this.ze)}Je(){window.addEventListener("online",this.We),window.addEventListener("offline",this.ze)}Ge(){U(SC,"Network connectivity changed: AVAILABLE");for(const e of this.He)e(0)}je(){U(SC,"Network connectivity changed: UNAVAILABLE");for(const e of this.He)e(1)}static Ye(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ja=null;function iB(){return ja===null?ja=function(){return 268435456+Math.round(2147483648*Math.random())}():ja++,"0x"+ja.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _l="RestConnection",JT={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class zT{get Ze(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Xe=t+"://"+e.host,this.et=`projects/${n}/databases/${s}`,this.tt=this.databaseId.database===_u?`project_id=${n}`:`project_id=${n}&database_id=${s}`}nt(e,t,n,s,i){const o=iB(),a=this.rt(e,t.toUriEncodedString());U(_l,`Sending RPC '${e}' ${o}:`,a,n);const u={"google-cloud-resource-prefix":this.et,"x-goog-request-params":this.tt};this.it(u,s,i);const{host:l}=new URL(a),B=Gn(l);return this.st(e,a,u,n,B).then(d=>(U(_l,`Received RPC '${e}' ${o}: `,d),d),d=>{throw Wt(_l,`RPC '${e}' ${o} failed with error: `,d,"url: ",a,"request:",n),d})}_t(e,t,n,s,i,o){return this.nt(e,t,n,s,i)}it(e,t,n){if(e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+yi}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((s,i)=>e[i]=s),n&&n.headers.forEach((s,i)=>e[i]=s),this.databaseInfo._customHeaders)for(const s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}rt(e,t){const n=JT[e];let s=`${this.Xe}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $T{constructor(e){this.ot=e.ot,this.ut=e.ut}ct(e){this.lt=e}Et(e){this.ht=e}Tt(e){this.Pt=e}onMessage(e){this.It=e}close(){this.ut()}send(e){this.ot(e)}Rt(){this.lt()}At(){this.ht()}Vt(e){this.Pt(e)}dt(e){this.It(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const it="WebChannelConnection",to=(r,e,t)=>{r.listen(e,n=>{try{t(n)}catch(s){setTimeout(()=>{throw s},0)}})};class ti extends zT{constructor(e){super(e),this.ft=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static gt(){if(!ti.yt){const e=kg();to(e,Fg.STAT_EVENT,t=>{t.stat===ql.PROXY?U(it,"STAT_EVENT: detected buffering proxy"):t.stat===ql.NOPROXY&&U(it,"STAT_EVENT: detected no buffering proxy")}),ti.yt=!0}}st(e,t,n,s,i){const o=iB();return new Promise((a,u)=>{const l=new Ng;l.setWithCredentials(!0),l.listenOnce(Og.COMPLETE,()=>{try{switch(l.getLastErrorCode()){case eu.NO_ERROR:const d=l.getResponseJson();U(it,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(d)),a(d);break;case eu.TIMEOUT:U(it,`RPC '${e}' ${o} timed out`),u(new G(O.DEADLINE_EXCEEDED,"Request time out"));break;case eu.HTTP_ERROR:const C=l.getStatus();if(U(it,`RPC '${e}' ${o} failed with status:`,C,"response text:",l.getResponseText()),C>0){let g=l.getResponseJson();Array.isArray(g)&&(g=g[0]);const D=g==null?void 0:g.error;if(D&&D.status&&D.message){const P=function(J){const X=J.toLowerCase().replace(/_/g,"-");return Object.values(O).indexOf(X)>=0?X:O.UNKNOWN}(D.status);u(new G(P,D.message))}else u(new G(O.UNKNOWN,"Server responded with status "+l.getStatus()))}else u(new G(O.UNAVAILABLE,"Connection failed."));break;default:Q(9055,{wt:e,streamId:o,bt:l.getLastErrorCode(),St:l.getLastError()})}}finally{U(it,`RPC '${e}' ${o} completed.`)}});const B=JSON.stringify(s);U(it,`RPC '${e}' ${o} sending request:`,s),l.send(t,"POST",B,n,15)})}vt(e,t,n){const s=iB(),i=[this.Xe,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),a={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(a.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(a.useFetchStreams=!0),this.it(a.initMessageHeaders,t,n),a.encodeInitMessageHeaders=!0;const l=i.join("");U(it,`Creating RPC '${e}' stream ${s}: ${l}`,a);const B=o.createWebChannel(l,a);this.Dt(B);let d=!1,C=!1;const g=new $T({ot:D=>{C?U(it,`Not sending because RPC '${e}' stream ${s} is closed:`,D):(d||(U(it,`Opening RPC '${e}' stream ${s} transport.`),B.open(),d=!0),U(it,`RPC '${e}' stream ${s} sending:`,D),B.send(D))},ut:()=>B.close()});return to(B,co.EventType.OPEN,()=>{C||(U(it,`RPC '${e}' stream ${s} transport opened.`),g.Rt())}),to(B,co.EventType.CLOSE,()=>{C||(C=!0,U(it,`RPC '${e}' stream ${s} transport closed`),g.Vt(),this.xt(B))}),to(B,co.EventType.ERROR,D=>{C||(C=!0,Wt(it,`RPC '${e}' stream ${s} transport errored. Name:`,D.name,"Message:",D.message),g.Vt(new G(O.UNAVAILABLE,"The operation could not be completed")))}),to(B,co.EventType.MESSAGE,D=>{var P;if(!C){const x=D.data[0];H(!!x,16349);const J=x,X=(J==null?void 0:J.error)||((P=J[0])==null?void 0:P.error);if(X){U(it,`RPC '${e}' stream ${s} received error:`,X);const Z=X.status;let se=function(y){const E=Ue[y];if(E!==void 0)return Em(E)}(Z),ue=X.message;Z==="NOT_FOUND"&&ue.includes("database")&&ue.includes("does not exist")&&ue.includes(this.databaseId.database)&&Wt(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),se===void 0&&(se=O.INTERNAL,ue="Unknown error status: "+Z+" with message "+X.message),C=!0,g.Vt(new G(se,ue)),B.close()}else U(it,`RPC '${e}' stream ${s} received:`,x),g.dt(x)}}),ti.gt(),setTimeout(()=>{g.At()},0),g}terminate(){this.ft.forEach(e=>e.close()),this.ft=[]}Dt(e){this.ft.push(e)}xt(e){this.ft=this.ft.filter(t=>t===e)}it(e,t,n){super.it(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return Lg()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QT(r){return new ti(r)}ti.yt=!1;class YB{constructor(e,t,n=1e3,s=1.5,i=6e4){this.Ct=e,this.timerId=t,this.Ft=n,this.Ot=s,this.Mt=i,this.Nt=0,this.Lt=null,this.Bt=Date.now(),this.reset()}reset(){this.Nt=0}Ut(){this.Nt=this.Mt}kt(e){this.cancel();const t=Math.floor(this.Nt+this.qt()),n=Math.max(0,Date.now()-this.Bt),s=Math.max(0,t-n);s>0&&U("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Nt} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Lt=this.Ct.enqueueAfterDelay(this.timerId,s,()=>(this.Bt=Date.now(),e())),this.Nt*=this.Ot,this.Nt<this.Ft&&(this.Nt=this.Ft),this.Nt>this.Mt&&(this.Nt=this.Mt)}$t(){this.Lt!==null&&(this.Lt.skipDelay(),this.Lt=null)}cancel(){this.Lt!==null&&(this.Lt.cancel(),this.Lt=null)}qt(){return(Math.random()-.5)*this.Nt}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const NC="PersistentStream";class Um{constructor(e,t,n,s,i,o,a,u){this.Ct=e,this.Kt=n,this.Qt=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=u,this.state=0,this.Wt=0,this.Gt=null,this.zt=null,this.stream=null,this.jt=0,this.Ht=new YB(e,t)}Jt(){return this.state===1||this.state===5||this.Yt()}Yt(){return this.state===2||this.state===3}start(){this.jt=0,this.state!==4?this.auth():this.Zt()}async stop(){this.Jt()&&await this.close(0)}Xt(){this.state=0,this.Ht.reset()}en(){this.Yt()&&this.Gt===null&&(this.Gt=this.Ct.enqueueAfterDelay(this.Kt,6e4,()=>this.tn()))}nn(e){this.rn(),this.stream.send(e)}async tn(){if(this.Yt())return this.close(0)}rn(){this.Gt&&(this.Gt.cancel(),this.Gt=null)}sn(){this.zt&&(this.zt.cancel(),this.zt=null)}async close(e,t){this.rn(),this.sn(),this.Ht.cancel(),this.Wt++,e!==4?this.Ht.reset():t&&t.code===O.RESOURCE_EXHAUSTED?(Ge(t.toString()),Ge("Using maximum backoff delay to prevent overloading the backend."),this.Ht.Ut()):t&&t.code===O.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this._n(),this.stream.close(),this.stream=null),this.state=e,await this.listener.Tt(t)}_n(){}auth(){this.state=1;const e=this.an(this.Wt),t=this.Wt;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([n,s])=>{this.Wt===t&&this.un(n,s)},n=>{e(()=>{const s=new G(O.UNKNOWN,"Fetching auth token failed: "+n.message);return this.cn(s)})})}un(e,t){const n=this.an(this.Wt);this.stream=this.En(e,t),this.stream.ct(()=>{n(()=>this.listener.ct())}),this.stream.Et(()=>{n(()=>(this.state=2,this.zt=this.Ct.enqueueAfterDelay(this.Qt,1e4,()=>(this.Yt()&&(this.state=3),Promise.resolve())),this.listener.Et()))}),this.stream.Tt(s=>{n(()=>this.cn(s))}),this.stream.onMessage(s=>{n(()=>++this.jt==1?this.hn(s):this.onNext(s))})}Zt(){this.state=5,this.Ht.kt(async()=>{this.state=0,this.start()})}cn(e){return U(NC,`close with error: ${e}`),this.stream=null,this.close(4,e)}an(e){return t=>{this.Ct.enqueueAndForget(()=>this.Wt===e?t():(U(NC,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class WT extends Um{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}En(e,t){return this.connection.vt("Listen",e,t)}hn(e){return this.onNext(e)}onNext(e){this.Ht.reset();const t=PT(this.serializer,e),n=function(i){if(!("targetChange"in i))return ee.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?ee.min():o.readTime?et(o.readTime):ee.min()}(e);return this.listener.Tn(t,n)}Pn(e){const t={};t.database=rB(this.serializer),t.addTarget=function(i,o){let a;const u=o.target;if(a=mn(u)?{pipelineQuery:Fm(i,u)}:jB(u)?{documents:Pm(i,u)}:{query:Nm(i,u).Se},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=Am(i,o.resumeToken);const l=tB(i,o.expectedCount);l!==null&&(a.expectedCount=l)}else if(o.snapshotVersion.compareTo(ee.min())>0){a.readTime=rs(i,o.snapshotVersion.toTimestamp());const l=tB(i,o.expectedCount);l!==null&&(a.expectedCount=l)}return a}(this.serializer,e);const n=OT(this.serializer,e);n&&(t.labels=n),this.nn(t)}In(e){const t={};t.database=rB(this.serializer),t.removeTarget=e,this.nn(t)}}class YT extends Um{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get Rn(){return this.jt>0}start(){this.lastStreamToken=void 0,super.start()}_n(){this.Rn&&this.An([])}En(e,t){return this.connection.vt("Write",e,t)}hn(e){return H(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,H(!e.writeResults||e.writeResults.length===0,55816),this.listener.Vn()}onNext(e){H(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.Ht.reset();const t=NT(e.writeResults,e.commitTime),n=et(e.commitTime);return this.listener.dn(n,t)}fn(){const e={};e.database=rB(this.serializer),this.nn(e)}An(e){const t={streamToken:this.lastStreamToken,writes:e.map(n=>xo(this.serializer,n))};this.nn(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XT{}class ZT extends XT{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.mn=!1}pn(){if(this.mn)throw new G(O.FAILED_PRECONDITION,"The client has already been terminated.")}nt(e,t,n,s){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,o])=>this.connection.nt(e,nB(t,n),s,i,o)).catch(i=>{throw i.name==="FirebaseError"?(i.code===O.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new G(O.UNKNOWN,i.toString())})}_t(e,t,n,s,i){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,a])=>this.connection._t(e,nB(t,n),s,o,a,i)).catch(o=>{throw o.name==="FirebaseError"?(o.code===O.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new G(O.UNKNOWN,o.toString())})}terminate(){this.mn=!0,this.connection.terminate()}}function eA(r,e,t,n){return new ZT(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tA="ComponentProvider",OC=new Map;function nA(r,e,t,n,s){return new Jy(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,Gm(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FC={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Hm=41943040;class at{static withCacheSize(e){return new at(e,at.DEFAULT_COLLECTION_PERCENTILE,at.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}at.DEFAULT_COLLECTION_PERCENTILE=10,at.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,at.DEFAULT=new at(Hm,at.DEFAULT_COLLECTION_PERCENTILE,at.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),at.DISABLED=new at(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.gn(n),this.yn=n=>t.writeSequenceNumber(n))}gn(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.yn&&this.yn(e),e}}yt.wn=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qm="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class jm{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function br(r){if(r.code!==O.FAILED_PRECONDITION||r.message!==qm)throw r;U("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&Q(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new v((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof v?t:v.resolve(t)}catch(t){return v.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):v.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):v.reject(t)}static resolve(e){return new v((t,n)=>{t(e)})}static reject(e){return new v((t,n)=>{n(e)})}static waitFor(e){return new v((t,n)=>{let s=0,i=0,o=!1;e.forEach(a=>{++s,a.next(()=>{++i,o&&i===s&&t()},u=>n(u))}),o=!0,i===s&&t()})}static or(e){let t=v.resolve(!1);for(const n of e)t=t.next(s=>s?v.resolve(s):n());return t}static forEach(e,t){const n=[];return e.forEach((s,i)=>{n.push(t.call(this,s,i))}),this.waitFor(n)}static mapArray(e,t){return new v((n,s)=>{const i=e.length,o=new Array(i);let a=0;for(let u=0;u<i;u++){const l=u;t(e[l]).next(B=>{o[l]=B,++a,a===i&&n(o)},B=>s(B))}})}static doWhile(e,t){return new v((n,s)=>{const i=()=>{e()===!0?t().next(()=>{i()},s):n()};i()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pt="SimpleDb";class uc{static open(e,t,n,s){try{return new uc(t,e.transaction(s,n))}catch(i){throw new _o(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.bn=new Ut,this.transaction.oncomplete=()=>{this.bn.resolve()},this.transaction.onabort=()=>{t.error?this.bn.reject(new _o(e,t.error)):this.bn.resolve()},this.transaction.onerror=n=>{const s=XB(n.target.error);this.bn.reject(new _o(e,s))}}get Sn(){return this.bn.promise}abort(e){e&&this.bn.reject(e),this.aborted||(U(Pt,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}vn(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new sA(t)}}class fr{static delete(e){return U(Pt,"Removing database:",e),Kr(gg().indexedDB.deleteDatabase(e)).toPromise()}static Ye(){if(!vB())return!1;if(fr.Dn())return!0;const e=$e(),t=fr.xn(e),n=0<t&&t<10,s=Km(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static Dn(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static Cn(e,t){return e.store(t)}static xn(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.Fn=n,this.On=null,fr.xn($e())===12.2&&Ge("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async Mn(e){return this.db||(U(Pt,"Opening database:",this.name),this.db=await new Promise((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{n(new _o(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?n(new G(O.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new G(O.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new _o(e,o))},s.onupgradeneeded=i=>{U(Pt,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.Fn.Nn(o,s.transaction,i.oldVersion,this.version).next(()=>{U(Pt,"Database upgrade to version "+this.version+" complete")})}})),this.Ln&&(this.db.onversionchange=t=>this.Ln(t)),this.db}Bn(e){this.Ln=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.Mn(e);const a=uc.open(this.db,e,i?"readonly":"readwrite",n),u=s(a).next(l=>(a.vn(),l)).catch(l=>(a.abort(l),v.reject(l))).toPromise();return u.catch(()=>{}),await a.Sn,u}catch(a){const u=a,l=u.name!=="FirebaseError"&&o<3;if(U(Pt,"Transaction failed with error:",u.message,"Retrying:",l),this.close(),!l)return Promise.reject(u)}}}close(){this.db&&this.db.close(),this.db=void 0}}function Km(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class rA{constructor(e){this.Un=e,this.kn=!1,this.qn=null}get isDone(){return this.kn}get $n(){return this.qn}set cursor(e){this.Un=e}done(){this.kn=!0}Kn(e){this.qn=e}delete(){return Kr(this.Un.delete())}}class _o extends G{constructor(e,t){super(O.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function vr(r){return r.name==="IndexedDbTransactionError"}class sA{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(U(Pt,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(U(Pt,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),Kr(n)}add(e){return U(Pt,"ADD",this.store.name,e,e),Kr(this.store.add(e))}get(e){return Kr(this.store.get(e)).next(t=>(t===void 0&&(t=null),U(Pt,"GET",this.store.name,e,t),t))}delete(e){return U(Pt,"DELETE",this.store.name,e),Kr(this.store.delete(e))}count(){return U(Pt,"COUNT",this.store.name),Kr(this.store.count())}Qn(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new v((o,a)=>{i.onerror=u=>{a(u.target.error)},i.onsuccess=u=>{o(u.target.result)}})}{const i=this.cursor(n),o=[];return this.Wn(i,(a,u)=>{o.push(u)}).next(()=>o)}}Gn(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new v((s,i)=>{n.onerror=o=>{i(o.target.error)},n.onsuccess=o=>{s(o.target.result)}})}zn(e,t){U(Pt,"DELETE ALL",this.store.name);const n=this.options(e,t);n.jn=!1;const s=this.cursor(n);return this.Wn(s,(i,o,a)=>a.delete())}Hn(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.Wn(s,t)}Jn(e){const t=this.cursor({});return new v((n,s)=>{t.onerror=i=>{const o=XB(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next(a=>{a?o.continue():n()}):n()}})}Wn(e,t){const n=[];return new v((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const a=o.target.result;if(!a)return void s();const u=new rA(a),l=t(a.primaryKey,a.value,u);if(l instanceof v){const B=l.catch(d=>(u.done(),v.reject(d)));n.push(B)}u.isDone?s():u.$n===null?a.continue():a.continue(u.$n)}}).next(()=>v.waitFor(n))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.jn?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function Kr(r){return new v((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=XB(n.target.error);t(s)}})}let kC=!1;function XB(r){const e=fr.xn($e());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new G("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return kC||(kC=!0,setTimeout(()=>{throw n},0)),n}}return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LC="LruGarbageCollector",Jm=1048576;function xC([r,e],[t,n]){const s=oe(r,t);return s===0?oe(e,n):s}class iA{constructor(e){this.Yn=e,this.buffer=new Ee(xC),this.Zn=0}Xn(){return++this.Zn}er(e){const t=[e,this.Xn()];if(this.buffer.size<this.Yn)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();xC(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class zm{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.tr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.nr(6e4)}stop(){this.tr&&(this.tr.cancel(),this.tr=null)}get started(){return this.tr!==null}nr(e){U(LC,`Garbage collection scheduled in ${e}ms`),this.tr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.tr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){vr(t)?U(LC,"Ignoring IndexedDB error during garbage collection: ",t):await br(t)}await this.nr(3e5)})}}class oA{constructor(e,t){this.rr=e,this.params=t}calculateTargetCount(e,t){return this.rr.ir(e).next(n=>Math.floor(t/100*n))}nthSequenceNumber(e,t){if(t===0)return v.resolve(yt.wn);const n=new iA(t);return this.rr.forEachTarget(e,s=>n.er(s.sequenceNumber)).next(()=>this.rr.sr(e,s=>n.er(s))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.rr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.rr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(U("LruGarbageCollector","Garbage collection skipped; disabled"),v.resolve(FC)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(U("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),FC):this._r(e,t))}getCacheSize(e){return this.rr.getCacheSize(e)}_r(e,t){let n,s,i,o,a,u,l;const B=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(d=>(d>this.params.maximumSequenceNumbersToCollect?(U("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${d}`),s=this.params.maximumSequenceNumbersToCollect):s=d,o=Date.now(),this.nthSequenceNumber(e,s))).next(d=>(n=d,a=Date.now(),this.removeTargets(e,n,t))).next(d=>(i=d,u=Date.now(),this.removeOrphanedDocuments(e,n))).next(d=>(l=Date.now(),$s()<=he.DEBUG&&U("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-B}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(u-a)+`ms
	Removed ${d} documents in `+(l-u)+`ms
Total Duration: ${l-B}ms`),v.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:d})))}}function $m(r,e){return new oA(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aA="firestore.googleapis.com",VC=!0;class MC{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new G(O.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=aA,this.ssl=VC}else this.host=e.host,this.ssl=e.ssl??VC;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=Hm;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Jm)throw new G(O.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(qy("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Gm(e.experimentalLongPollingOptions??{}),function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new G(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new G(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new G(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new G(O.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(n,s){return n.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&function(n,s){if(n===s)return!0;if(!n||!s)return!1;const i=Object.keys(n),o=Object.keys(s);if(i.length!==o.length)return!1;for(const a of i)if(n[a]!==s[a])return!1;return!0}(this._customHeaders,e._customHeaders)}}let ZB=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new MC({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new G(O.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new G(O.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new MC(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(n){if(!n)return new GT;switch(n.type){case"firstParty":return new qT(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new G(O.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const n=OC.get(t);n&&(U(tA,"Removing Datastore"),OC.delete(t),n.terminate())}(this),Promise.resolve()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pn{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new pn(this.firestore,e,this._query)}}class Ne{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Cr(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new Ne(this.firestore,e,this._key)}toJSON(){return{type:Ne._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(ta(t,Ne._jsonSchema))return new Ne(e,n||null,new z(Be.fromString(t.referencePath)))}}Ne._jsonSchemaVersion="firestore/documentReference/1.0",Ne._jsonSchema={type:qe("string",Ne._jsonSchemaVersion),referencePath:qe("string")};class Cr extends pn{constructor(e,t,n){super(e,t,ia(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new Ne(this.firestore,null,new z(e))}withConverter(e){return new Cr(this.firestore,e,this._path)}}function kF(r,e,...t){if(r=Ce(r),Jg("collection","path",e),r instanceof ZB){const n=Be.fromString(e,...t);return uC(n),new Cr(r,null,n)}{if(!(r instanceof Ne||r instanceof Cr))throw new G(O.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(Be.fromString(e,...t));return uC(n),new Cr(r.firestore,null,n)}}function uA(r,e,...t){if(r=Ce(r),arguments.length===1&&(e=kB.newId()),Jg("doc","path",e),r instanceof ZB){const n=Be.fromString(e,...t);return aC(n),new Ne(r,null,new z(n))}{if(!(r instanceof Ne||r instanceof Cr))throw new G(O.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(Be.fromString(e,...t));return aC(n),new Ne(r.firestore,r instanceof Cr?r.converter:null,new z(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tt{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Tt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(ta(e,Tt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new Tt(e.vectorValues);throw new G(O.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Tt._jsonSchemaVersion="firestore/vectorValue/1.0",Tt._jsonSchema={type:qe("string",Tt._jsonSchemaVersion),vectorValues:qe("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cA=/^__.*__$/;class lA{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new Un(e,this.data,this.fieldMask,t,this.fieldTransforms):new Ti(e,this.data,t,this.fieldTransforms)}}class Qm{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Un(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Wm(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw Q(40011,{dataSource:r})}}class cc{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new cc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return Tu(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(Wm(this.dataSource)&&cA.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class BA{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||ac(e)}createContext(e,t,n,s=!1){return new cc({dataSource:e,methodName:t,targetDoc:n,path:ze.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Rs(r){const e=r._freezeSettings(),t=ac(r._databaseId);return new BA(r._databaseId,!!e.ignoreUndefinedProperties,t)}function lc(r,e,t,n,s,i={}){const o=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);ih("Data must be an object, but it was:",o,n);const a=Xm(n,o);let u,l;if(i.merge)u=new wt(o.fieldMask),l=o.fieldTransforms;else if(i.mergeFields){const B=[];for(const d of i.mergeFields){const C=kn(e,d,t);if(!o.contains(C))throw new G(O.INVALID_ARGUMENT,`Field '${C}' is specified in your field mask but missing from your input data.`);n_(B,C)||B.push(C)}u=new wt(B),l=o.fieldTransforms.filter(d=>u.covers(d.field))}else u=null,l=o.fieldTransforms;return new lA(new Xe(a),u,l)}class Bc extends vi{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Bc}}function hA(r,e,t){return new cc({dataSource:3,targetDoc:e.settings.targetDoc,methodName:r._methodName,arrayElement:t},e.databaseId,e.serializer,e.ignoreUndefinedProperties)}class eh extends vi{_toFieldTransform(e){return new sc(e.path,new ui)}isEqual(e){return e instanceof eh}}class th extends vi{constructor(e,t){super(e),this.ar=t}_toFieldTransform(e){const t=hA(this,e,!0),n=this.ar.map(i=>Fn(i,t)),s=new Cs(n);return new sc(e.path,s)}isEqual(e){return e instanceof th&&gr(this.ar,e.ar)}}class nh extends vi{constructor(e,t){super(e),this.ur=t}_toFieldTransform(e){const t=new ps(e.serializer,nc(e.serializer,this.ur));return new sc(e.path,t)}isEqual(e){return e instanceof nh&&(this.ur===e.ur||Number.isNaN(this.ur)&&Number.isNaN(e.ur))}}function rh(r,e,t,n){const s=r.createContext(1,e,t);ih("Data must be an object, but it was:",s,n);const i=[],o=Xe.empty();Rr(n,(u,l)=>{const B=t_(e,u,t);l=Ce(l);const d=s.childContextForFieldPath(B);if(l instanceof Bc)i.push(B);else{const C=Fn(l,d);C!=null&&(i.push(B),o.set(B,C))}});const a=new wt(i);return new Qm(o,a,s.fieldTransforms)}function sh(r,e,t,n,s,i){const o=r.createContext(1,e,t),a=[kn(e,n,t)],u=[s];if(i.length%2!=0)throw new G(O.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let C=0;C<i.length;C+=2)a.push(kn(e,i[C])),u.push(i[C+1]);const l=[],B=Xe.empty();for(let C=a.length-1;C>=0;--C)if(!n_(l,a[C])){const g=a[C];let D=u[C];D=Ce(D);const P=o.childContextForFieldPath(g);if(D instanceof Bc)l.push(g);else{const x=Fn(D,P);x!=null&&(l.push(g),B.set(g,x))}}const d=new wt(l);return new Qm(B,d,o.fieldTransforms)}function Ym(r,e,t,n=!1){return Fn(t,r.createContext(n?4:3,e))}function Fn(r,e,t){if(e_(r=Ce(r)))return ih("Unsupported field value:",e,r),Xm(r,e);if(r instanceof vi)return function(s,i){if(!Wm(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);const o=s._toFieldTransform(i);o&&i.fieldTransforms.push(o)}(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return function(s,i){const o=[];let a=0;for(const u of s){let l=Fn(u,i.childContextForArray(a));l==null&&(l={nullValue:"NULL_VALUE"}),o.push(l),a++}return{arrayValue:{values:o}}}(r,e)}return function(s,i,o){if((s=Ce(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return nc(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const a=_e.fromDate(s);return{timestampValue:rs(i.serializer,a)}}if(s instanceof _e){const a=new _e(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:rs(i.serializer,a)}}if(Zm(s)){const a=_e.fromInstant(s),u=new _e(a.seconds,1e3*Math.floor(a.nanoseconds/1e3));return{timestampValue:rs(i.serializer,u)}}if(s instanceof ln)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof Nt)return{bytesValue:Am(i.serializer,s._byteString)};if(s instanceof Ne){const a=i.databaseId,u=s.firestore._databaseId;if(!u.isEqual(a))throw i.createError(`Document reference is for database ${u.projectId}/${u.database} but should be for database ${a.projectId}/${a.database}`);return{referenceValue:WB(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof Tt)return function(u,l){const B=u instanceof Tt?u.toArray():u;return{mapValue:{fields:{[LB]:{stringValue:xB},[hs]:{arrayValue:{values:B.map(C=>{if(typeof C!="number")throw l.createError("VectorValues must only contain numeric values.");return tc(l.serializer,C)})}}}}}}(s,i);if(Vm(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${ec(s)}`)}(r,e)}function Xm(r,e){const t={};return Kg(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Rr(r,(n,s)=>{const i=Fn(s,e.childContextForField(n));i!=null&&(t[n]=i)}),{mapValue:{fields:t}}}function Zm(r){if(typeof r!="object"||r===null)return!1;if(typeof Temporal<"u"&&typeof Temporal.Instant=="function"&&r instanceof Temporal.Instant)return!0;const e=r;return e[Symbol.toStringTag]==="Temporal.Instant"&&typeof e.t=="bigint"}function e_(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof _e||r instanceof ln||r instanceof Nt||r instanceof Ne||r instanceof vi||r instanceof Tt||Zm(r)||Vm(r))}function ih(r,e,t){if(!e_(t)||!ea(t)){const n=ec(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function kn(r,e,t){if((e=Ce(e))instanceof bi)return e._internalPath;if(typeof e=="string")return t_(r,e);throw Tu("Field path arguments must be of type string or ",r,!1,void 0,t)}const dA=new RegExp("[~\\*/\\[\\]]");function t_(r,e,t){if(e.search(dA)>=0)throw Tu(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new bi(...e.split("."))._internalPath}catch{throw Tu(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function Tu(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let a=`Function ${e}() called with invalid data`;t&&(a+=" (via `toFirestore()`)"),a+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${n}`),o&&(u+=` in document ${s}`),u+=")"),new G(O.INVALID_ARGUMENT,a+r+u)}function n_(r,e){return r.some(t=>t.isEqual(e))}function r_(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const n=Xe.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const i=this.optionDefinitions[s];if(s in e){const o=e[s];let a;i.nestedOptions&&ea(o)?a={mapValue:{fields:new ht(i.nestedOptions).getOptionsProto(t,o)}}:o&&(a=Fn(o,t)??void 0),a&&n.set(ze.fromServerFormat(i.serverName),a)}}return n}getOptionsProto(e,t,n){const s=this._getKnownOptions(t,e);if(n){const i=new Map(Hy(n,(o,a)=>[ze.fromServerFormat(a),o!==void 0?Fn(o,e):null]));s.setAll(i)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fA(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")}(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")}(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))}(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!ea(t.fields))}(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))}(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))}(r.pipelineValue)))}function LF(){return new eh("serverTimestamp")}function xF(...r){return new th("arrayUnion",r)}function VF(r){return new nh("increment",r)}function CA(r){return new Tt(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function K(r){let e;return r instanceof bs?r:(e=ea(r)?EA(r):r instanceof Array?IA(r):s_(r,void 0),e)}function El(r){if(r instanceof bs)return r;if(r instanceof Tt)return Mo(r);if(Array.isArray(r))return Mo(CA(r));throw new Error("Unsupported value: "+typeof r)}function oh(r){return $y(r)?ou(r):K(r)}class bs{constructor(){this._protoValueType="ProtoValue"}add(e){return new V("add",[this,K(e)],"add")}asBoolean(){if(this instanceof Ir)return this;if(this instanceof Ss)return new o_(this);if(this instanceof vs)return new _A(this);if(this instanceof V)return new i_(this);throw new G("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new V("subtract",[this,K(e)],"subtract")}multiply(e){return new V("multiply",[this,K(e)],"multiply")}divide(e){return new V("divide",[this,K(e)],"divide")}mod(e){return new V("mod",[this,K(e)],"mod")}equal(e){return new V("equal",[this,K(e)],"equal").asBoolean()}notEqual(e){return new V("not_equal",[this,K(e)],"notEqual").asBoolean()}lessThan(e){return new V("less_than",[this,K(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new V("less_than_or_equal",[this,K(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new V("greater_than",[this,K(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new V("greater_than_or_equal",[this,K(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const n=[e,...t].map(s=>K(s));return new V("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new V("array_contains",[this,K(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new Bo(e.map(K),"arrayContainsAll"):e;return new V("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new Bo(e.map(K),"arrayContainsAny"):e;return new V("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new V("array_reverse",[this])}arrayLength(){return new V("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new Bo(e.map(K),"equalAny"):e;return new V("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new Bo(e.map(K),"notEqualAny"):e;return new V("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new V("exists",[this],"exists").asBoolean()}charLength(){return new V("char_length",[this],"charLength")}like(e){return new V("like",[this,K(e)],"like").asBoolean()}regexContains(e){return new V("regex_contains",[this,K(e)],"regexContains").asBoolean()}regexFind(e){return new V("regex_find",[this,K(e)],"regexFind")}regexFindAll(e){return new V("regex_find_all",[this,K(e)],"regexFindAll")}regexMatch(e){return new V("regex_match",[this,K(e)],"regexMatch").asBoolean()}stringContains(e){return new V("string_contains",[this,K(e)],"stringContains").asBoolean()}startsWith(e){return new V("starts_with",[this,K(e)],"startsWith").asBoolean()}endsWith(e){return new V("ends_with",[this,K(e)],"endsWith").asBoolean()}toLower(){return new V("to_lower",[this],"toLower")}toUpper(){return new V("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(K(e)),new V("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(K(e)),new V("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(K(e)),new V("rtrim",t,"rtrim")}type(){return new V("type",[this])}isType(e){return new V("is_type",[this,Mo(e)],"isType").asBoolean()}stringConcat(e,...t){const n=[e,...t].map(K);return new V("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new V("string_index_of",[this,K(e)],"stringIndexOf")}stringRepeat(e){return new V("string_repeat",[this,K(e)],"stringRepeat")}stringReplaceAll(e,t){return new V("string_replace_all",[this,K(e),K(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new V("string_replace_one",[this,K(e),K(t)],"stringReplaceOne")}concat(e,...t){const n=[e,...t].map(K);return new V("concat",[this,...n],"concat")}reverse(){return new V("reverse",[this],"reverse")}arrayFilter(e,t){return new V("array_filter",[this,K(e),t],"arrayFilter")}arrayTransform(e,t){return new V("array_transform",[this,K(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new V("array_transform",[this,K(e),K(t),n],"arrayTransformWithIndex")}arraySlice(e,t){const n=[this,K(e)];return t!==void 0&&n.push(K(t)),new V("array_slice",n,"arraySlice")}arrayFirst(){return new V("array_first",[this],"arrayFirst")}arrayFirstN(e){return new V("array_first_n",[this,K(e)],"arrayFirstN")}arrayLast(){return new V("array_last",[this],"arrayLast")}arrayLastN(e){return new V("array_last_n",[this,K(e)],"arrayLastN")}arrayMaximum(){return new V("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new V("maximum_n",[this,K(e)],"arrayMaximumN")}arrayMinimum(){return new V("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new V("minimum_n",[this,K(e)],"arrayMinimumN")}arrayIndexOf(e){return new V("array_index_of",[this,K(e),K("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new V("array_index_of",[this,K(e),K("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new V("array_index_of_all",[this,K(e)],"arrayIndexOfAll")}byteLength(){return new V("byte_length",[this],"byteLength")}ceil(){return new V("ceil",[this])}floor(){return new V("floor",[this])}abs(){return new V("abs",[this])}exp(){return new V("exp",[this])}mapGet(e){return new V("map_get",[this,Mo(e)],"mapGet")}mapSet(e,t,...n){const s=[this,K(e),K(t),...n.map(K)];return new V("map_set",s,"mapSet")}mapKeys(){return new V("map_keys",[this],"mapKeys")}mapValues(){return new V("map_values",[this],"mapValues")}mapEntries(){return new V("map_entries",[this],"mapEntries")}getField(e){return new V("get_field",[this,K(e)],"get_field")}count(){return St._create("count",[this],"count")}sum(){return St._create("sum",[this],"sum")}average(){return St._create("average",[this],"average")}minimum(){return St._create("minimum",[this],"minimum")}maximum(){return St._create("maximum",[this],"maximum")}first(){return St._create("first",[this],"first")}last(){return St._create("last",[this],"last")}arrayAgg(){return St._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return St._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return St._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const n=[e,...t];return new V("maximum",[this,...n.map(K)],"logicalMaximum")}logicalMinimum(e,...t){const n=[e,...t];return new V("minimum",[this,...n.map(K)],"minimum")}vectorLength(){return new V("vector_length",[this],"vectorLength")}cosineDistance(e){return new V("cosine_distance",[this,El(e)],"cosineDistance")}dotProduct(e){return new V("dot_product",[this,El(e)],"dotProduct")}euclideanDistance(e){return new V("euclidean_distance",[this,El(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new V("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new V("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new V("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new V("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new V("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new V("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new V("timestamp_add",[this,K(e),K(t)],"timestampAdd")}timestampSubtract(e,t){return new V("timestamp_subtract",[this,K(e),K(t)],"timestampSubtract")}timestampDiff(e,t){return new V("timestamp_diff",[this,oh(e),K(t)],"timestampDiff")}timestampExtract(e,t){const n=[this,K(e)];return t&&n.push(K(t)),new V("timestamp_extract",n,"timestampExtract")}documentId(){return new V("document_id",[this],"documentId")}parent(){return new V("parent",[this],"parent")}substring(e,t){const n=K(e);return new V("substring",t===void 0?[this,n]:[this,n,K(t)],"substring")}arrayGet(e){return new V("array_get",[this,K(e)],"arrayGet")}isError(){return new V("is_error",[this],"isError").asBoolean()}ifError(e){const t=new V("if_error",[this,K(e)],"ifError");return e instanceof Ir?t.asBoolean():t}isAbsent(){return new V("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new V("map_remove",[this,K(e)],"mapRemove")}mapMerge(e,...t){const n=K(e),s=t.map(K);return new V("map_merge",[this,n,...s],"mapMerge")}pow(e){return new V("pow",[this,K(e)])}trunc(e){return e===void 0?new V("trunc",[this]):new V("trunc",[this,K(e)],"trunc")}round(e){return e===void 0?new V("round",[this]):new V("round",[this,K(e)],"round")}collectionId(){return new V("collection_id",[this])}length(){return new V("length",[this])}ln(){return new V("ln",[this])}sqrt(){return new V("sqrt",[this])}stringReverse(){return new V("string_reverse",[this])}ifAbsent(e){return new V("if_absent",[this,K(e)],"ifAbsent")}ifNull(e){return new V("if_null",[this,K(e)],"ifNull")}coalesce(e,...t){return new V("coalesce",[this,K(e),...t.map(K)],"coalesce")}join(e){return new V("join",[this,K(e)],"join")}log10(){return new V("log10",[this])}arraySum(){return new V("sum",[this])}split(e){return new V("split",[this,K(e)])}timestampTruncate(e,t){const n=[this,K(e)];return t&&n.push(K(t)),new V("timestamp_trunc",n)}ascending(){return DA(this)}descending(){return wA(this)}as(e){return new gA(this,e,"as")}}class St{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){const s=new St(e,t);return s._methodName=n,s}as(e){return new pA(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map(t=>t._toProto(e))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e))}}class pA{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}}class gA{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class Bo extends bs{constructor(e,t){super(),this.cr=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.cr.map(t=>t._toProto(e))}}}_readUserData(e){this.cr.forEach(t=>t._readUserData(e))}}class vs extends bs{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new V("geo_distance",[this,K(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function ou(r){return mA(r,"field")}function mA(r,e){return new vs(typeof r=="string"?nn===r?VT()._internalPath:kn("field",r):r._internalPath,e)}class Ss extends bs{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new Ss(e,void 0);return t._protoValue=e,t}_toProto(e){return H(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,fA(this._protoValue)||(this._protoValue=Fn(this.value,e))}}function Mo(r,e){return s_(r,"constant")}function s_(r,e){const t=new Ss(r,e);return typeof r=="boolean"?new o_(t):t}class V extends bs{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new ht({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map(n=>n._toProto(e))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e)),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class Ir extends bs{get _methodName(){return this._expr._methodName}countIf(){return St._create("count_if",[this],"countIf")}not(){return new V("not",[this],"not").asBoolean()}conditional(e,t){return new V("conditional",[this,e,t],"conditional")}ifError(e){const t=K(e),n=new V("if_error",[this,t],"ifError");return t instanceof Ir?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class i_ extends Ir{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class o_ extends Ir{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class _A extends Ir{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function EA(r,e){const t=[];for(const n in r)if(Object.prototype.hasOwnProperty.call(r,n)){const s=r[n];t.push(Mo(n)),t.push(K(s))}return new V("map",t,"map")}function IA(r){return function(t,n){return new V("array",t.map(s=>K(s)),n)}(r,"array")}function DA(r){return new ah(oh(r),"ascending","ascending")}function wA(r){return new ah(oh(r),"descending","descending")}class ah{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:Mm(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class a_ extends Vt{get _name(){return"add_fields"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[Vo(e,this.fields)]}}_readUserData(e){super._readUserData(e),wr(this.fields,e)}}class u_ extends Vt{get _name(){return"aggregate"}get _optionsUtil(){return new ht({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[Vo(e,this.accumulators),Vo(e,this.groups)]}}_readUserData(e){super._readUserData(e),wr(this.groups,e),wr(this.accumulators,e)}}class c_ extends Vt{get _name(){return"distinct"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[Vo(e,this.groups)]}}_readUserData(e){super._readUserData(e),wr(this.groups,e)}}class aa extends Vt{get _name(){return"collection"}get _optionsUtil(){return new ht({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.hr=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.hr}]}}_readUserData(e){super._readUserData(e)}}class ua extends Vt{get _name(){return"collection_group"}get _optionsUtil(){return new ht({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class hc extends Vt{get _name(){return"database"}get _optionsUtil(){return new ht({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class dc extends Vt{get _name(){return"documents"}get _optionsUtil(){return new ht({})}constructor(e,t){if(super(t),!e||e.length===0)throw new G(O.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const n=e.map(i=>i.startsWith("/")?i:"/"+i),s=new Set(n);if(s.size!==n.length)throw new G(O.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.Tr=n,this.Pr=s}_toProto(e){return{...super._toProto(e),args:this.Tr.map(t=>({referenceValue:t}))}}_readUserData(e){super._readUserData(e)}}class ca extends Vt{get _name(){return"where"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),wr(this.condition,e)}}class Dr extends Vt{get _name(){return"limit"}get _optionsUtil(){return new ht({})}constructor(e,t){H(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[nc(e,this.limit)]}}}class GC extends Vt{get _name(){return"offset"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[nc(e,this.offset)]}}}class yA extends Vt{get _name(){return"select"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[Vo(e,this.selections)]}}_readUserData(e){super._readUserData(e),wr(this.selections,e)}}class sn extends Vt{get _name(){return"sort"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map(t=>t._toProto(e))}}_readUserData(e){super._readUserData(e),wr(this.orderings,e)}}class uh extends Vt{get _name(){return"replace_with"}get _optionsUtil(){return new ht({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),Mm(uh.Ir)]}}_readUserData(e){super._readUserData(e),wr(this.map,e)}}uh.Ir="full_replace";function wr(r,e){return r_(r)?r._readUserData(e):Array.isArray(r)?r.forEach(t=>t._readUserData(e)):r instanceof Map?r.forEach(t=>t._readUserData(e)):Object.values(r).forEach(t=>t._readUserData(e)),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eo{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Vr(e,t){const n=this.userDataReader.createContext(3,e);return r_(t)?t._readUserData(n):Array.isArray(t)?t.forEach(s=>s._readUserData(n)):t.forEach(s=>s._readUserData(n)),t}where(e){const t=this.stages.map(n=>n);return this.Vr("where",e),t.push(new ca(e,{})),new Eo(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){const t=this.stages.map(n=>n);return t.push(new Dr(e,{})),new Eo(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){const n=this.stages.map(s=>s);return"orderings"in e?n.push(new sn(this.Vr("sort",e.orderings),{})):n.push(new sn(this.Vr("sort",[e,...t]),{})),new Eo(this._db,this.userDataReader,this._userDataWriter,n)}dr(e){return{pipeline:{stages:this.stages.map(t=>t._toProto(e))}}}}// Copyright 2024 Google LLC* @license
class ut{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return la(this)}getPipelineCollectionGroup(){return ch(this)}getPipelineCollectionId(){return l_(this)}getPipelineDocuments(){return Au(this)}getPipelineFlavor(){return function(t){let n="exact";return t.stages.forEach((s,i)=>{s._name!==c_.name&&s._name!==u_.name||(n="keyless"),s._name===yA.name&&n==="exact"&&(n="augmented"),s._name===a_.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")}),n}(this)}getPipelineSourceType(){return An(this)}}function An(r){const e=r.stages[0];return e instanceof aa||e instanceof ua||e instanceof hc||e instanceof dc?e._name:"unknown"}function la(r){if(An(r)==="collection")return r.stages[0].hr}function ch(r){if(An(r)==="collection_group")return r.stages[0].collectionId}function l_(r){switch(An(r)){case"collection":return Be.fromString(la(r)).lastSegment();case"collection_group":return ch(r);default:return}}function Au(r){if(An(r)==="documents")return r.stages[0].Tr}class T{constructor(e,t){this.type=e,this.value=t}static mr(){return new T("ERROR",void 0)}static pr(){return new T("UNSET",void 0)}static gr(){return new T("NULL",cn)}static newValue(e){return Ot(e)?new T("NULL",cn):function(n){return!!n&&"booleanValue"in n}(e)?new T("BOOLEAN",e):rn(e)?new T("INT",e):Wr(e)?new T("DOUBLE",e):function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue}(e)?new T("TIMESTAMP",e):function(n){return!!n&&"stringValue"in n}(e)?new T("STRING",e):function(n){return!!n&&"bytesValue"in n}(e)?new T("BYTES",e):e.referenceValue?new T("REFERENCE",e):e.geoPointValue?new T("GEO_POINT",e):_r(e)?new T("ARRAY",e):fs(e)?new T("VECTOR",e):ns(e)?new T("MAP",e):new T("ERROR",void 0)}yr(){return this.type==="ERROR"||this.type==="UNSET"}wr(){return this.type==="NULL"}}function Io(r){if(!r.yr())return r.value}function B_(r){return r instanceof Ir?r._expr:r}function re(r){if((r=B_(r))instanceof vs)return new TA(r);if(r instanceof Ss)return new AA(r);if(r instanceof Bo)return new RA(r);if(r instanceof V){if(r.name==="add")return new SA(r);if(r.name==="subtract")return new PA(r);if(r.name==="multiply")return new NA(r);if(r.name==="divide")return new OA(r);if(r.name==="mod")return new FA(r);if(r.name==="and")return new kA(r);if(r.name==="equal")return new zA(r);if(r.name==="not_equal")return new $A(r);if(r.name==="less_than")return new QA(r);if(r.name==="less_than_or_equal")return new WA(r);if(r.name==="greater_than")return new YA(r);if(r.name==="greater_than_or_equal")return new XA(r);if(r.name==="array_concat")return new ZA(r);if(r.name==="array_reverse")return new eR(r);if(r.name==="array_contains")return new tR(r);if(r.name==="array_contains_all")return new nR(r);if(r.name==="array_contains_any")return new rR(r);if(r.name==="array_length")return new sR(r);if(r.name==="array_element")return new iR(r);if(r.name==="equal_any")return new h_(r);if(r.name==="not_equal_any")return new xA(r);if(r.name==="is_nan")return new VA(r);if(r.name==="is_not_nan")return new MA(r);if(r.name==="is_null")return new GA(r);if(r.name==="is_not_null")return new UA(r);if(r.name==="is_error")return new HA(r);if(r.name==="exists")return new qA(r);if(r.name==="not")return new fc(r);if(r.name==="or")return new LA(r);if(r.name==="xor")return new lh(r);if(r.name==="conditional")return new jA(r);if(r.name==="maximum")return new KA(r);if(r.name==="minimum")return new JA(r);if(r.name==="reverse")return new oR(r);if(r.name==="replace_first")return new aR(r);if(r.name==="replace_all")return new uR(r);if(r.name==="char_length")return new cR(r);if(r.name==="byte_length")return new lR(r);if(r.name==="like")return new BR(r);if(r.name==="regex_contains")return new hR(r);if(r.name==="regex_match")return new dR(r);if(r.name==="string_contains")return new fR(r);if(r.name==="starts_with")return new CR(r);if(r.name==="ends_with")return new pR(r);if(r.name==="to_lower")return new gR(r);if(r.name==="to_upper")return new mR(r);if(r.name==="trim")return new _R(r);if(r.name==="string_concat")return new ER(r);if(r.name==="map_get")return new IR(r);if(r.name==="cosine_distance")return new DR(r);if(r.name==="dot_product")return new wR(r);if(r.name==="euclidean_distance")return new yR(r);if(r.name==="vector_length")return new TR(r);if(r.name==="unix_micros_to_timestamp")return new SR(r);if(r.name==="timestamp_to_unix_micros")return new OR(r);if(r.name==="unix_millis_to_timestamp")return new PR(r);if(r.name==="timestamp_to_unix_millis")return new FR(r);if(r.name==="unix_seconds_to_timestamp")return new NR(r);if(r.name==="timestamp_to_unix_seconds")return new kR(r);if(r.name==="timestamp_add")return new LR(r);if(r.name==="timestamp_subtract")return new xR(r)}throw new Error(`Unknown Expr : ${r}`)}class TA{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===nn)return T.newValue({referenceValue:hi(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return T.newValue({timestampValue:iu(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return T.newValue({timestampValue:iu(e.serializer,t.createTime)});const n=t.data.field(this.expr._fieldPath);return n?na(n)?T.newValue(function(i,o){if(i.serverTimestampBehavior==="estimate")return{timestampValue:iu(i.serializer,ee.fromTimestamp(ii(o)))};if(i.serverTimestampBehavior==="previous"){const a=ra(o);if(a)return a}return{nullValue:"NULL_VALUE"}}(e,n)):T.newValue(n):T.pr()}}class AA{constructor(e){this.expr=e}evaluate(e,t){return T.newValue(this.expr._getValue())}}class RA{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.cr.map(s=>re(s).evaluate(e,t));return n.some(s=>s.yr())?T.mr():T.newValue({arrayValue:{values:n.map(s=>s.value)}})}}function rt(r){return Wr(r)?Number(r.doubleValue):Number(r.integerValue)}function fn(r){return BigInt(r.integerValue)}const bA=BigInt("0x7fffffffffffffff"),vA=-BigInt("0x8000000000000000");class Ba{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length>=2,24778);const n=re(this.expr.params[0]).evaluate(e,t),s=re(this.expr.params[1]).evaluate(e,t);let i=this.br(n,s);for(const o of this.expr.params.slice(2)){const a=re(o).evaluate(e,t);i=this.br(i,a)}return i}br(e,t){if(e.yr()||t.yr())return T.mr();if(e.wr()||t.wr())return T.gr();const n=e.value,s=t.value;if(!Wr(n)&&!rn(n)||!Wr(s)&&!rn(s))return T.mr();if(Wr(n)||Wr(s)){const i=this.Sr(n,s);return i?T.newValue(i):T.mr()}if(rn(n)&&rn(s)){const i=this.vr(n,s);return i===void 0?T.mr():typeof i=="number"?T.newValue({doubleValue:i}):i<vA||i>bA?T.mr():T.newValue({integerValue:`${i}`})}return T.mr()}}function Ln(r,e){return je(r)!==je(e)?"TYPE_MISMATCH":Rt(r)||Rt(e)?"NOT_EQ":Ot(r)&&Ot(e)?"EQ":Ot(r)||Ot(e)?"NULL":_r(r)&&_r(e)?function(n,s){var o,a,u;if(((o=n.values)==null?void 0:o.length)!==((a=s.values)==null?void 0:a.length))return"NOT_EQ";let i=!1;for(let l=0;l<(((u=n.values)==null?void 0:u.length)??0);l++){const B=n.values[l],d=s.values[l];switch(Ln(B,d)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:Q(44609,{Dr:B,Cr:d})}}return i?"NULL":"EQ"}(r.arrayValue,e.arrayValue):fs(r)&&fs(e)||ns(r)&&ns(e)?function(n,s){const i=n.fields||{},o=s.fields||{};if(mu(i)!==mu(o))return"NOT_EQ";let a=!1;for(const u in i)if(i.hasOwnProperty(u)){if(o[u]===void 0)return"NOT_EQ";switch(Ln(i[u],o[u])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":a=!0}}return a?"NULL":"EQ"}(r.mapValue,e.mapValue):function(n,s){return qt(n,s,{u:!1,i:!0,o:!0})}(r,e)?"EQ":"NOT_EQ"}class SA extends Ba{vr(e,t){return fn(e)+fn(t)}Sr(e,t){return{doubleValue:rt(e)+rt(t)}}}class PA extends Ba{constructor(e){super(e),this.expr=e}vr(e,t){return fn(e)-fn(t)}Sr(e,t){return{doubleValue:rt(e)-rt(t)}}}class NA extends Ba{constructor(e){super(e),this.expr=e}vr(e,t){return fn(e)*fn(t)}Sr(e,t){return{doubleValue:rt(e)*rt(t)}}}class OA extends Ba{constructor(e){super(e),this.expr=e}vr(e,t){const n=fn(t);if(n!==BigInt(0))return fn(e)/n}Sr(e,t){const n=rt(t);return n===0?{doubleValue:oi(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:rt(e)/n}}}class FA extends Ba{constructor(e){super(e),this.expr=e}vr(e,t){const n=fn(t);if(n!==BigInt(0))return fn(e)%n}Sr(e,t){const n=rt(t);if(n!==0)return{doubleValue:rt(e)%n}}}class kA{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=re(o).evaluate(e,t);switch(a.type){case"BOOLEAN":if(!((i=a.value)!=null&&i.booleanValue))return T.newValue(Ze);break;case"NULL":s=!0;break;default:n=!0}}return n?T.mr():s?T.gr():T.newValue(At)}}class fc{constructor(e){this.expr=e}evaluate(e,t){var s;H(this.expr.params.length===1,9634);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return T.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return T.gr();default:return T.mr()}}}class LA{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=re(o).evaluate(e,t);switch(a.type){case"BOOLEAN":if((i=a.value)!=null&&i.booleanValue)return T.newValue(At);break;case"NULL":s=!0;break;default:n=!0}}return n?T.mr():s?T.gr():T.newValue(Ze)}}class lh{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=re(o).evaluate(e,t);switch(a.type){case"BOOLEAN":n=lh.xor(n,!!((i=a.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return T.mr()}}return s?T.gr():T.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}}class h_{constructor(e){this.expr=e}evaluate(e,t){var o,a;H(this.expr.params.length===2,55094);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.mr()}if(n)return T.gr();for(const u of((a=(o=i.value)==null?void 0:o.arrayValue)==null?void 0:a.values)??[])switch(Ot(s.value)&&Ot(u)?"EQ":Ln(s.value,u)){case"EQ":return T.newValue(At);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Q(44608,{value:s.value,candidate:u})}return n?T.gr():T.newValue(Ze)}}class xA{constructor(e){this.expr=e}evaluate(e,t){return new fc(new V("not",[new V("equal_any",this.expr.params)])).evaluate(e,t)}}class VA{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===1,23322);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return T.newValue(Ze);case"DOUBLE":return T.newValue({booleanValue:isNaN(rt(n.value))});case"NULL":return T.gr();default:return T.mr()}}}class MA{constructor(e){this.expr=e}evaluate(e,t){return H(this.expr.params.length===1,50406),new fc(new V("not",[new V("is_nan",this.expr.params)])).evaluate(e,t)}}class GA{constructor(e){this.expr=e}evaluate(e,t){switch(H(this.expr.params.length===1,23123),re(this.expr.params[0]).evaluate(e,t).type){case"NULL":return T.newValue(At);case"UNSET":case"ERROR":return T.mr();default:return T.newValue(Ze)}}}class UA{constructor(e){this.expr=e}evaluate(e,t){return H(this.expr.params.length===1,23167),new fc(new V("not",[new V("is_null",this.expr.params)])).evaluate(e,t)}}class HA{constructor(e){this.expr=e}evaluate(e,t){return H(this.expr.params.length===1,5228),re(this.expr.params[0]).evaluate(e,t).type==="ERROR"?T.newValue(At):T.newValue(Ze)}}class qA{constructor(e){this.expr=e}evaluate(e,t){switch(H(this.expr.params.length===1,6877),re(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return T.mr();case"UNSET":return T.newValue(Ze);default:return T.newValue(At)}}}class jA{constructor(e){this.expr=e}evaluate(e,t){var s;H(this.expr.params.length===3,11706);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?re(this.expr.params[1]).evaluate(e,t):re(this.expr.params[2]).evaluate(e,t);case"NULL":return re(this.expr.params[2]).evaluate(e,t);default:return T.mr()}}}class KA{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>re(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Bt(i.value,s.value)>0?i:s}return s===void 0?T.gr():s}}class JA{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>re(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Bt(i.value,s.value)<0?i:s}return s===void 0?T.gr():s}}class Si{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return T.mr()}const s=re(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return T.mr()}return this.Fr(n,s)}}class zA extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){if(e.wr()&&t.wr())return T.newValue(At);if(e.wr()||t.wr()||Rt(e.value)||Rt(t.value)||je(e.value)!==je(t.value))return T.newValue(Ze);switch(Ln(e.value,t.value)){case"EQ":return T.newValue(At);case"NOT_EQ":return T.newValue(Ze);case"NULL":return T.gr();default:Q(44615,{left:e,right:t})}}}class $A extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){switch(Ln(e.value,t.value)){case"EQ":return T.newValue(Ze);case"NOT_EQ":case"TYPE_MISMATCH":return T.newValue(At);case"NULL":return T.gr();default:Q(44614,{left:e,right:t})}}}class QA extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){return je(e.value)!==je(t.value)||Rt(e.value)||Rt(t.value)?T.newValue(Ze):T.newValue({booleanValue:Bt(e.value,t.value)<0})}}class WA extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){return je(e.value)!==je(t.value)||Rt(e.value)||Rt(t.value)?T.newValue(Ze):Ln(e.value,t.value)==="EQ"?T.newValue(At):T.newValue({booleanValue:Bt(e.value,t.value)<0})}}class YA extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){return je(e.value)!==je(t.value)||Rt(e.value)||Rt(t.value)?T.newValue(Ze):T.newValue({booleanValue:Bt(e.value,t.value)>0})}}class XA extends Si{constructor(e){super(e),this.expr=e}Fr(e,t){return je(e.value)!==je(t.value)||Rt(e.value)||Rt(t.value)?T.newValue(Ze):Ln(e.value,t.value)==="EQ"?T.newValue(At):T.newValue({booleanValue:Bt(e.value,t.value)>0})}}class ZA{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class eR{constructor(e){this.expr=e}evaluate(e,t){var s;H(this.expr.params.length===1,216);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.gr();case"ARRAY":{const i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return T.newValue({arrayValue:{values:[...i].reverse()}})}default:return T.mr()}}}class tR{constructor(e){this.expr=e}evaluate(e,t){return H(this.expr.params.length===2,52884),new h_(new V("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class nR{constructor(e){this.expr=e}evaluate(e,t){var u,l,B,d;H(this.expr.params.length===2,1392);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.mr()}if(n)return T.gr();const o=((l=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:l.values)??[],a=((d=(B=s.value)==null?void 0:B.arrayValue)==null?void 0:d.values)??[];for(const C of o){let g=!1;n=!1;for(const D of a){switch(Ot(C)&&Ot(D)?"EQ":Ln(C,D)){case"EQ":g=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Q(44613,{value:D,search:C})}if(g)break}if(!g)return T.newValue(Ze)}return T.newValue(At)}}class rR{constructor(e){this.expr=e}evaluate(e,t){var u,l,B,d;H(this.expr.params.length===2,2680);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return T.mr()}if(n)return T.gr();const o=((l=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:l.values)??[],a=((d=(B=s.value)==null?void 0:B.arrayValue)==null?void 0:d.values)??[];for(const C of a)for(const g of o)switch(Ot(C)&&Ot(g)?"EQ":Ln(C,g)){case"EQ":return T.newValue(At);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Q(60403,{value:C,search:g})}return n?T.gr():T.newValue(Ze)}}class sR{constructor(e){this.expr=e}evaluate(e,t){var s,i,o;H(this.expr.params.length===1,38605);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.gr();case"ARRAY":return T.newValue({integerValue:`${((o=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:o.length)??0}`});default:return T.mr()}}}class iR{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class oR{constructor(e){this.expr=e}evaluate(e,t){var s,i;H(this.expr.params.length===1,1508);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.gr();case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;if(typeof o=="string"){const a=Le.fromBase64String(o).toUint8Array();return a.reverse(),T.newValue({bytesValue:Le.fromUint8Array(a).toBase64()})}return T.newValue({bytesValue:new Uint8Array(o).reverse()})}case"STRING":{const o=(i=n.value)==null?void 0:i.stringValue,a=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(o),u=Array.from(a,l=>l.segment).reverse();return T.newValue({stringValue:u.join("")})}default:return T.mr()}}}class aR{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class uR{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class cR{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===1,19400);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return T.gr();case"STRING":{const s=function(o){let a=0;for(let u=0;u<o.length;u++){const l=o.codePointAt(u);if(l===void 0)return;if(l<=65535)if(l>=55296&&l<=57343)if(l<=56319){const B=o.codePointAt(u+1);B!==void 0&&B>=56320&&B<=57343?(a+=1,u++):a+=1}else a+=1;else a+=1;else{if(!(l<=1114111))return;a+=1,u++}}return a}(n.value.stringValue);return s===void 0?T.mr():T.newValue({integerValue:s})}default:return T.mr()}}}class lR{constructor(e){this.expr=e}evaluate(e,t){var s,i;H(this.expr.params.length===1,8486);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;return typeof o=="string"?T.newValue({integerValue:Le.fromBase64String(o).toUint8Array().length}):T.newValue({integerValue:new Uint8Array(o).length})}case"STRING":{const o=function(u){let l=0;for(let B=0;B<u.length;B++){const d=u.codePointAt(B);if(d===void 0)return;if(d>=55296&&d<=57343){if(!(d<=56319))return;{const C=u.codePointAt(B+1);if(C===void 0||!(C>=56320&&C<=57343))return;l+=4,B++}}else if(d<=127)l+=1;else if(d<=2047)l+=2;else if(d<=65535)l+=3;else{if(!(d<=1114111))return;l+=4,B++}}return l}((i=n.value)==null?void 0:i.stringValue);return o===void 0?T.mr():T.newValue({integerValue:o})}case"NULL":return T.gr();default:return T.mr()}}}class Pi{constructor(e){this.expr=e}evaluate(e,t){var o,a;H(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return T.mr()}return n?T.gr():this.Or((o=s.value)==null?void 0:o.stringValue,(a=i.value)==null?void 0:a.stringValue)}}class BR extends Pi{Or(e,t){try{const n=function(o){let a="";for(let u=0;u<o.length;u++){const l=o.charAt(u);switch(l){case"_":a+=".";break;case"%":a+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":a+="\\"+l;break;default:a+=l}}return"^"+a+"$"}(t),s=OB.compile(n);return T.newValue({booleanValue:s.matches(e)})}catch(n){return Wt(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),T.mr()}}}class hR extends Pi{Or(e,t){try{const n=OB.compile(t);return T.newValue({booleanValue:n.test(e)})}catch{return Wt(`Invalid regex pattern found in regex_contains: ${t}, returning error`),T.mr()}}}class dR extends Pi{Or(e,t){try{return T.newValue({booleanValue:OB.compile(t).matches(e)})}catch{return Wt(`Invalid regex pattern found in regex_match: ${t}, returning error`),T.mr()}}}class fR extends Pi{Or(e,t){return T.newValue({booleanValue:e.includes(t)})}}class CR extends Pi{Or(e,t){return T.newValue({booleanValue:e.startsWith(t)})}}class pR extends Pi{Or(e,t){return T.newValue({booleanValue:e.endsWith(t)})}}class gR{constructor(e){this.expr=e}evaluate(e,t){var s,i;H(this.expr.params.length===1,29079);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return T.gr();default:return T.mr()}}}class mR{constructor(e){this.expr=e}evaluate(e,t){var s,i;H(this.expr.params.length===1,60487);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return T.gr();default:return T.mr()}}}class _R{constructor(e){this.expr=e}evaluate(e,t){var s,i;H(this.expr.params.length===1,28544);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return T.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return T.gr();default:return T.mr()}}}class ER{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(o=>re(o).evaluate(e,t));let s="",i=!1;for(const o of n)switch(o.type){case"STRING":s+=o.value.stringValue;break;case"NULL":i=!0;break;default:return T.mr()}return i?T.gr():T.newValue({stringValue:s})}}class IR{constructor(e){this.expr=e}evaluate(e,t){var o,a,u,l;H(this.expr.params.length===2,4483);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return T.pr();case"MAP":break;default:return T.mr()}const s=re(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return T.mr();const i=(l=(a=(o=n.value)==null?void 0:o.mapValue)==null?void 0:a.fields)==null?void 0:l[(u=s.value)==null?void 0:u.stringValue];return i===void 0?T.pr():T.newValue(i)}}class Bh{constructor(e){this.expr=e}evaluate(e,t){var l,B;H(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return T.mr()}if(n)return T.gr();const o=Ql(s.value),a=Ql(i.value);if(o===void 0||a===void 0||((l=o.values)==null?void 0:l.length)!==((B=a.values)==null?void 0:B.length))return T.mr();const u=this.Mr(o,a);return u===void 0||isNaN(u)?T.mr():T.newValue({doubleValue:u})}}class DR extends Bh{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,o=0,a=0;for(let l=0;l<n.length;l++){if(!mr(n[l])||!mr(s[l]))return;const B=rt(n[l]),d=rt(s[l]);i+=B*d,o+=B*B,a+=d*d}const u=Math.sqrt(o)*Math.sqrt(a);if(u!==0)return 1-Math.max(-1,Math.min(1,i/u))}}class wR extends Bh{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!mr(n[o])||!mr(s[o]))return;i+=rt(n[o])*rt(s[o])}return i}}class yR extends Bh{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!mr(n[o])||!mr(s[o]))return;const a=rt(n[o]),u=rt(s[o]);i+=Math.pow(a-u,2)}return Math.sqrt(i)}}class TR{constructor(e){this.expr=e}evaluate(e,t){var s;H(this.expr.params.length===1,39044);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{const i=Ql(n.value);return T.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return T.gr();default:return T.mr()}}}const Go=BigInt(-62135596800),Uo=BigInt(253402300799),Ru=BigInt(1e3),pr=BigInt(1e6),AR=Go*Ru,RR=Uo*Ru+BigInt(999),bR=Go*pr,vR=Uo*pr+BigInt(999999);function hh(r){return r>=bR&&r<=vR}function d_(r){return r>=Go&&r<=Uo}function Ho(r,e){const t=BigInt(r);return!(t<Go||t>Uo)&&!(e<0||e>=1e9)&&(t!==Go||e===0)&&!(t===Uo&&e>999999999)}function f_(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function dh(r){return BigInt(r.seconds)*pr+BigInt(Math.trunc(r.nanoseconds/1e3))}class fh{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return T.gr();default:return T.mr()}}}class SR extends fh{toTimestamp(e){if(!hh(e))return T.mr();let t=Number(e/pr),n=Number(e%pr*BigInt(1e3));const s=f_(t,n);return t=s.seconds,n=s.nanos,Ho(t,n)?T.newValue({timestampValue:{seconds:t,nanos:n}}):T.mr()}}class PR extends fh{toTimestamp(e){if(!function(o){return o>=AR&&o<=RR}(e))return T.mr();let t=Number(e/Ru),n=Number(e%Ru*BigInt(1e6));const s=f_(t,n);return t=s.seconds,n=s.nanos,Ho(t,n)?T.newValue({timestampValue:{seconds:t,nanos:n}}):T.mr()}}class NR extends fh{toTimestamp(e){if(!d_(e))return T.mr();const t=Number(e);return T.newValue({timestampValue:{seconds:t,nanos:0}})}}class Ch{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const n=re(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return T.gr();default:return T.mr()}const s=QB(n.value.timestampValue);return Ho(s.seconds,s.nanoseconds)?this.Nr(s):T.mr()}}class OR extends Ch{Nr(e){const t=dh(e);return hh(t)?T.newValue({integerValue:`${t.toString()}`}):T.mr()}}class FR extends Ch{Nr(e){const t=dh(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?T.newValue({integerValue:n.toString()}):T.newValue({integerValue:(n-BigInt(1)).toString()})}}class kR extends Ch{Nr(e){const t=BigInt(e.seconds);return d_(t)?T.newValue({integerValue:t.toString()}):T.mr()}}class C_{constructor(e){this.expr=e}evaluate(e,t){H(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1;const s=re(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return T.mr()}const i=re(this.expr.params[1]).evaluate(e,t);let o;switch(i.type){case"STRING":if(o=function(X){switch(X){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}}(i.value.stringValue),o===void 0)return T.mr();break;case"NULL":n=!0;break;default:return T.mr()}const a=re(this.expr.params[2]).evaluate(e,t);switch(a.type){case"INT":break;case"NULL":n=!0;break;default:return T.mr()}if(n)return T.gr();const u=BigInt(a.value.integerValue);let l;try{switch(o){case"microsecond":l=u;break;case"millisecond":l=u*BigInt(1e3);break;case"second":l=u*BigInt(1e6);break;case"minute":l=u*BigInt(6e7);break;case"hour":l=u*BigInt(36e8);break;case"day":l=u*BigInt(864e8);break;default:return T.mr()}if(o!=="microsecond"&&u!==BigInt(0)&&l/u!==BigInt(this.Lr(o)))return T.mr()}catch(J){return Wt(`Error during timestamp arithmetic: ${J}`),T.mr()}const B=QB(s.value.timestampValue);if(!Ho(B.seconds,B.nanoseconds))return T.mr();const d=dh(B),C=this.Br(d,l);if(!hh(C))return T.mr();const g=Number(C/pr),D=C%pr,P=Number((D<0?D+pr:D)*BigInt(1e3)),x=D<0?g-1:g;return Ho(x,P)?T.newValue({timestampValue:{seconds:x,nanos:P}}):T.mr()}Lr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class LR extends C_{Br(e,t){return e+t}}class xR extends C_{Br(e,t){return e-t}}function qo(r){if((r=B_(r))instanceof vs)return`fld(${r.fieldName})`;if(r instanceof Ss)return`cst(${function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof Ne?`ref(${t.path})`:t instanceof Tt?`vec(${JSON.stringify(t)})`:JSON.stringify(t)}(r.value)})`;if(r instanceof V)return`fn(${r.name},[${r.params.map(qo).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.cr.map(qo).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function VR(r){if(r instanceof a_)return`${r._name}(${Ka(r.fields)})`;if(r instanceof u_){let e=`${r._name}(${Ka(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${Ka(r.groups)})`),e}if(r instanceof c_)return`${r._name}(${Ka(r.groups)})`;if(r instanceof aa)return`${r._name}(${r.hr})`;if(r instanceof ua)return`${r._name}(${r.collectionId})`;if(r instanceof hc)return`${r._name}()`;if(r instanceof dc)return`${r._name}(${r.Tr.sort()})`;if(r instanceof ca)return`${r._name}(${qo(r.condition)})`;if(r instanceof Dr)return`${r._name}(${r.limit})`;if(r instanceof sn)return`${r._name}(${function(t){return t.map(n=>`${qo(n.expr)}${n.direction}`).join(",")}(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function Ka(r){return`${Array.from(r.entries()).sort().map(([e,t])=>`${e}=${qo(t)}`).join(",")}`}function Rn(r){return r.stages.map(e=>VR(e)).join("|")}function p_(r,e){return Rn(r)===Rn(e)}function Me(r){return r instanceof ut}function UC(r){return Me(r)?Rn(r):go(r)}function g_(r){return Me(r)?Rn(r):function(t){return`${Du(kt(t))}|lt:${t.limitType}`}(r)}function Cc(r,e){return r instanceof ut&&e instanceof ut?p_(r,e):!(r instanceof ut&&!(e instanceof ut)||!(r instanceof ut)&&e instanceof ut)&&CT(r,e)}function pc(r){return mn(r)?Rn(r):Du(r)}function ph(r,e){return r instanceof ut&&e instanceof ut?p_(r,e):!(r instanceof ut&&!(e instanceof ut)||!(r instanceof ut)&&e instanceof ut)&&qB(r,e)}function MR(r,e){const t=function(s){let i=!1;const o=[];for(const a of s)if(a instanceof sn)if(i=!0,a.orderings.some(u=>u.expr instanceof vs&&u.expr.fieldName===nn))o.push(a);else{const u=a.orderings.map(l=>l);u.push(ou(nn).ascending()),o.push(new sn(u,{}))}else a instanceof Dr&&(i||(o.push(new sn([ou(nn).ascending()],{})),i=!0)),o.push(a);return i||o.push(new sn([ou(nn).ascending()],{})),o}(r.stages);if(r.userDataReader){const n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach(s=>s._readUserData(n))}return new ut(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gh{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&tT(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=po(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=po(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=wm();return this.mutations.forEach(s=>{const i=e.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=t.has(s.key)?null:a;const u=am(o,a);u!==null&&n.set(s.key,u),o.isValidDocument()||o.convertToNoDocument(ee.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),ce())}isEqual(e){return this.batchId===e.batchId&&si(this.mutations,e.mutations,(t,n)=>pC(t,n))&&si(this.baseMutations,e.baseMutations,(t,n)=>pC(t,n))}}class mh{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){H(e.mutations.length===n.length,58842,{Ur:e.mutations.length,kr:n.length});let s=function(){return _T}();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new mh(e,t,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bu="";function lt(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=HC(e)),e=GR(r.get(t),e);return HC(e)}function GR(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case bu:t+="";break;default:t+=i}}return t}function HC(r){return r+bu+""}function on(r){const e=r.length;if(H(e>=2,64408,{path:r}),e===2)return H(r.charAt(0)===bu&&r.charAt(1)==="",56145,{path:r}),Be.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const o=r.indexOf(bu,i);switch((o<0||o>t)&&Q(50515,{path:r}),r.charAt(o+1)){case"":const a=r.substring(i,o);let u;s.length===0?u=a:(s+=a,u=s,s=""),n.push(u);break;case"":s+=r.substring(i,o),s+="\0";break;case"":s+=r.substring(i,o+1);break;default:Q(61167,{path:r})}i=o+2}return new Be(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qr="remoteDocuments",ha="owner",Ms="owner",jo="mutationQueues",UR="userId",Jt="mutations",qC="batchId",Yr="userMutationsIndex",jC=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function au(r,e){return[r,lt(e)]}function m_(r,e,t){return[r,lt(e),t]}const HR={},di="documentMutations",vu="remoteDocumentsV14",qR=["prefixPath","collectionGroup","readTime","documentId"],uu="documentKeyIndex",jR=["prefixPath","collectionGroup","documentId"],__="collectionGroupIndex",KR=["collectionGroup","readTime","prefixPath","documentId"],Ko="remoteDocumentGlobal",oB="remoteDocumentGlobalKey",fi="targets",E_="queryTargetsIndex",JR=["canonicalId","targetId"],Ci="targetDocuments",zR=["targetId","path"],_h="documentTargetsIndex",$R=["path","targetId"],Su="targetGlobalKey",ss="targetGlobal",Jo="collectionParents",QR=["collectionId","parent"],pi="clientMetadata",WR="clientId",gc="bundles",YR="bundleId",mc="namedQueries",XR="name",Eh="indexConfiguration",ZR="indexId",aB="collectionGroupIndex",eb="collectionGroup",Do="indexState",tb=["indexId","uid"],I_="sequenceNumberIndex",nb=["uid","sequenceNumber"],wo="indexEntries",rb=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],D_="documentKeyIndex",sb=["indexId","uid","orderedDocumentKey"],_c="documentOverlays",ib=["userId","collectionPath","documentId"],uB="collectionPathOverlayIndex",ob=["userId","collectionPath","largestBatchId"],w_="collectionGroupOverlayIndex",ab=["userId","collectionGroup","largestBatchId"],Ih="globals",ub="name",y_=[jo,Jt,di,qr,fi,ha,ss,Ci,pi,Ko,Jo,gc,mc],cb=[...y_,_c],T_=[jo,Jt,di,vu,fi,ha,ss,Ci,pi,Ko,Jo,gc,mc,_c],A_=T_,Dh=[...A_,Eh,Do,wo],lb=Dh,R_=[...Dh,Ih],Bb=R_;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function b_(r,e,t){const n=r.store(Jt),s=r.store(di),i=[],o=IDBKeyRange.only(t.batchId);let a=0;const u=n.Hn({range:o},(B,d,C)=>(a++,C.delete()));i.push(u.next(()=>{H(a===1,47070,{batchId:t.batchId})}));const l=[];for(const B of t.mutations){const d=m_(e,B.key.path,t.batchId);i.push(s.delete(d)),l.push(B.key)}return v.waitFor(i).next(()=>l)}function Pu(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw Q(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cB extends jm{constructor(e,t){super(),this.qr=e,this.currentSequenceNumber=t}}function Qe(r,e){const t=Y(r);return fr.Cn(t.qr,e)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wh{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class an{constructor(e,t,n,s,i=ee.min(),o=ee.min(),a=Le.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=u}withSequenceNumber(e){return new an(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new an(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new an(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new an(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v_{constructor(e){this.$r=e}}function hb(r,e){let t;if(e.document)t=vT(r.$r,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=z.fromSegments(e.noDocument.path),s=ms(e.noDocument.readTime);t=Fe.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return Q(56709);{const n=z.fromSegments(e.unknownDocument.path),s=ms(e.unknownDocument.version);t=Fe.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime(function(s){const i=new _e(s[0],s[1]);return ee.fromTimestamp(i)}(e.readTime)),t}function KC(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Nu(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=function(i,o){return{name:hi(i,o.key),fields:o.data.value.mapValue.fields,updateTime:rs(i,o.version.toTimestamp()),createTime:rs(i,o.createTime.toTimestamp())}}(r.$r,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:gs(e.version)};else{if(!e.isUnknownDocument())return Q(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:gs(e.version)}}return n}function Nu(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function gs(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function ms(r){const e=new _e(r.seconds,r.nanoseconds);return ee.fromTimestamp(e)}function Jr(r,e){const t=(e.baseMutations||[]).map(i=>sB(r.$r,i));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const a=e.mutations[i+1];o.updateTransforms=a.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map(i=>sB(r.$r,i)),s=_e.fromMillis(e.localWriteTimeMs);return new gh(e.batchId,s,t,n)}function ho(r,e){const t=ms(e.readTime),n=e.lastLimboFreeSnapshotVersion!==void 0?ms(e.lastLimboFreeSnapshotVersion):ee.min();let s;return s=function(o){return o.structuredPipeline!==void 0}(e.query)?function(o,a){var B,d;const u=o.structuredPipeline;H((((B=u==null?void 0:u.pipeline)==null?void 0:B.stages)??[]).length>0,1845);const l=(d=u==null?void 0:u.pipeline)==null?void 0:d.stages.map(db);return new ut(a,l)}(e.query,r.$r):function(o){return o.documents!==void 0}(e.query)?function(o){const a=o.documents.length;return H(a===1,1966,{count:a}),kt(ia(vm(o.documents[0])))}(e.query):function(o){return kt(Om(o))}(e.query),new an(s,e.targetId,"TargetPurposeListen",e.lastListenSequenceNumber,t,n,Le.fromBase64String(e.resumeToken))}function S_(r,e){const t=gs(e.snapshotVersion),n=gs(e.lastLimboFreeSnapshotVersion);let s;s=mn(e.target)?Fm(r.$r,e.target):jB(e.target)?Pm(r.$r,e.target):Nm(r.$r,e.target).Se;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:pc(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function P_(r){const e=Om({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?yu(e,e.limit,"L"):e}function Ja(r,e){return new wh(e.largestBatchId,sB(r.$r,e.overlayMutation))}function JC(r,e){const t=e.path.lastSegment();return[r,lt(e.path.popLast()),t]}function zC(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:gs(n.readTime),documentKey:lt(n.documentKey.path),largestBatchId:n.largestBatchId}}function db(r){switch(r.name){case"collection":return new aa(r.args[0].referenceValue,{});case"collection_group":return new ua(r.args[1].stringValue,{});case"database":return new hc({});case"documents":return new dc(r.args.map(e=>e.referenceValue),{});case"where":return new ca(lB(r.args[0]),{});case"limit":{const e=r.args[0].integerValue??r.args[0].doubleValue;return new Dr(typeof e=="number"?e:Number(e),{})}case"sort":return new sn(r.args.map(e=>function(n){var i,o;const s=(i=n.mapValue)==null?void 0:i.fields;return new ah(lB(s.expression),(o=s.direction)==null?void 0:o.stringValue,"orderingFromProto")}(e)),{});default:throw new Error(`Stage type: ${r.name} not supported.`)}}function lB(r){return r.fieldReferenceValue?new vs(kn("_exprFromProto",r.fieldReferenceValue),"_exprFromProto"):r.functionValue?function(t){var n;return new V(t.functionValue.name,((n=t.functionValue.args)==null?void 0:n.map(lB))||[])}(r):Ss._fromProto(r)}class Ec{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.Kr={}}static Qr(e,t,n,s){H(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Ec(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Wn(e).Hn({index:Yr,range:n},(s,i,o)=>{t=!1,o.done()}).next(()=>t)}addMutationBatch(e,t,n,s){const i=Xs(e),o=Wn(e);return o.add({}).next(a=>{H(typeof a=="number",49019);const u=new gh(a,t,n,s),l=function(g,D,P){const x=P.baseMutations.map(X=>xo(g.$r,X)),J=P.mutations.map(X=>xo(g.$r,X));return{userId:D,batchId:P.batchId,localWriteTimeMs:P.localWriteTime.toMillis(),baseMutations:x,mutations:J}}(this.serializer,this.userId,u),B=[];let d=new Ee((C,g)=>oe(C.canonicalString(),g.canonicalString()));for(const C of s){const g=m_(this.userId,C.key.path,a);d=d.add(C.key.path.popLast()),B.push(o.put(l)),B.push(i.put(g,HR))}return d.forEach(C=>{B.push(this.indexManager.addToCollectionParentIndex(e,C))}),e.addOnCommittedListener(()=>{this.Kr[a]=u.keys()}),v.waitFor(B).next(()=>u)})}lookupMutationBatch(e,t){return Wn(e).get(t).next(n=>n?(H(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),Jr(this.serializer,n)):null)}Wr(e,t){return this.Kr[t]?v.resolve(this.Kr[t]):this.lookupMutationBatch(e,t).next(n=>{if(n){const s=n.keys();return this.Kr[t]=s,s}return null})}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return Wn(e).Hn({index:Yr,range:s},(o,a,u)=>{a.userId===this.userId&&(H(a.batchId>=n,47524,{Gr:n}),i=Jr(this.serializer,a)),u.done()}).next(()=>i)}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=ts;return Wn(e).Hn({index:Yr,range:t,reverse:!0},(s,i,o)=>{n=i.batchId,o.done()}).next(()=>n)}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,ts],[this.userId,Number.POSITIVE_INFINITY]);return Wn(e).Qn(Yr,t).next(n=>n.map(s=>Jr(this.serializer,s)))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=au(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return Xs(e).Hn({range:s},(o,a,u)=>{const[l,B,d]=o,C=on(B);if(l===this.userId&&t.path.isEqual(C))return Wn(e).get(d).next(g=>{if(!g)throw Q(61480,{zr:o,batchId:d});H(g.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:g.userId,batchId:d}),i.push(Jr(this.serializer,g))});u.done()}).next(()=>i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new Ee(oe);const s=[];return t.forEach(i=>{const o=au(this.userId,i.path),a=IDBKeyRange.lowerBound(o),u=Xs(e).Hn({range:a},(l,B,d)=>{const[C,g,D]=l,P=on(g);C===this.userId&&i.path.isEqual(P)?n=n.add(D):d.done()});s.push(u)}),v.waitFor(s).next(()=>this.jr(e,n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=au(this.userId,n),o=IDBKeyRange.lowerBound(i);let a=new Ee(oe);return Xs(e).Hn({range:o},(u,l,B)=>{const[d,C,g]=u,D=on(C);d===this.userId&&n.isPrefixOf(D)?D.length===s&&(a=a.add(g)):B.done()}).next(()=>this.jr(e,a))}jr(e,t){const n=[],s=[];return t.forEach(i=>{s.push(Wn(e).get(i).next(o=>{if(o===null)throw Q(35274,{batchId:i});H(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),n.push(Jr(this.serializer,o))}))}),v.waitFor(s).next(()=>n)}removeMutationBatch(e,t){return b_(e.qr,this.userId,t).next(n=>(e.addOnCommittedListener(()=>{this.Hr(t.batchId)}),v.forEach(n,s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))}Hr(e){delete this.Kr[e]}performConsistencyCheck(e){return this.checkEmpty(e).next(t=>{if(!t)return v.resolve();const n=IDBKeyRange.lowerBound(function(o){return[o]}(this.userId)),s=[];return Xs(e).Hn({range:n},(i,o,a)=>{if(i[0]===this.userId){const u=on(i[1]);s.push(u)}else a.done()}).next(()=>{H(s.length===0,56720,{Jr:s.map(i=>i.canonicalString())})})})}containsKey(e,t){return N_(e,this.userId,t)}Yr(e){return O_(e).get(this.userId).next(t=>t||{userId:this.userId,lastAcknowledgedBatchId:ts,lastStreamToken:""})}}function N_(r,e,t){const n=au(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let o=!1;return Xs(r).Hn({range:i,jn:!0},(a,u,l)=>{const[B,d,C]=a;B===e&&d===s&&(o=!0),l.done()}).next(()=>o)}function Wn(r){return Qe(r,Jt)}function Xs(r){return Qe(r,di)}function O_(r){return Qe(r,jo)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fb{getBundleMetadata(e,t){return $C(e).get(t).next(n=>{if(n)return function(i){return{id:i.bundleId,createTime:ms(i.createTime),version:i.version}}(n)})}saveBundleMetadata(e,t){return $C(e).put(function(s){return{bundleId:s.id,createTime:gs(et(s.createTime)),version:s.version}}(t))}getNamedQuery(e,t){return QC(e).get(t).next(n=>{if(n)return function(i){return{name:i.name,query:P_(i.bundledQuery),readTime:ms(i.readTime)}}(n)})}saveNamedQuery(e,t){return QC(e).put(function(s){return{name:s.name,readTime:gs(et(s.readTime)),bundledQuery:s.bundledQuery}}(t))}}function $C(r){return Qe(r,gc)}function QC(r){return Qe(r,mc)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ic{constructor(e,t){this.serializer=e,this.userId=t}static Qr(e,t){const n=t.uid||"";return new Ic(e,n)}getOverlay(e,t){return Gs(e).get(JC(this.userId,t)).next(n=>n?Ja(this.serializer,n):null)}getOverlays(e,t){const n=Gt();return v.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&n.set(s,i)})).next(()=>n)}getAllOverlays(e,t){const n=Gt();return Gs(e).Hn((s,i)=>{const o=Ja(this.serializer,i);o.largestBatchId>t&&n.set(o.getKey(),o)}).next(()=>n)}saveOverlays(e,t,n){const s=[];return n.forEach((i,o)=>{const a=new wh(t,o);s.push(this.Zr(e,a))}),v.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach(o=>s.add(lt(o.getCollectionPath())));const i=[];return s.forEach(o=>{const a=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);i.push(Gs(e).zn(uB,a))}),v.waitFor(i)}getOverlaysForCollection(e,t,n){const s=Gt(),i=lt(t),o=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return Gs(e).Qn(uB,o).next(a=>{for(const u of a){const l=Ja(this.serializer,u);s.set(l.getKey(),l)}return s})}getOverlaysForCollectionGroup(e,t,n,s){const i=Gt();let o;const a=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return Gs(e).Hn({index:w_,range:a},(u,l,B)=>{const d=Ja(this.serializer,l);i.size()<s||d.largestBatchId===o?(i.set(d.getKey(),d),o=d.largestBatchId):B.done()}).next(()=>i)}Zr(e,t){return Gs(e).put(function(s,i,o){const[a,u,l]=JC(i,o.mutation.key);return{userId:i,collectionPath:u,documentId:l,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:xo(s.$r,o.mutation)}}(this.serializer,this.userId,t))}}function Gs(r){return Qe(r,_c)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cb{Xr(e){return Qe(e,Ih)}getSessionToken(e){return this.Xr(e).get("sessionToken").next(t=>{const n=t==null?void 0:t.value;return n?Le.fromUint8Array(n):Le.EMPTY_BYTE_STRING})}setSessionToken(e,t){return this.Xr(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zr{constructor(){}ei(e,t){this.ti(e,t),t.ni()}ti(e,t){if("nullValue"in e)this.ri(t,5);else if("booleanValue"in e)this.ri(t,10),t.ii(e.booleanValue?1:0);else if("integerValue"in e)this.ri(t,15),t.ii(be(e.integerValue));else if("doubleValue"in e){const n=be(e.doubleValue);isNaN(n)?this.ri(t,13):(this.ri(t,15),oi(n)?t.ii(0):t.ii(n))}else if("timestampValue"in e){let n=e.timestampValue;this.ri(t,20),typeof n=="string"&&(n=Nn(n)),t.si(`${n.seconds||""}`),t.ii(n.nanos||0)}else if("stringValue"in e)this._i(e.stringValue,t),this.oi(t);else if("bytesValue"in e)this.ri(t,30),t.ai(On(e.bytesValue)),this.oi(t);else if("referenceValue"in e)this.ui(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.ri(t,45),t.ii(n.latitude||0),t.ii(n.longitude||0)}else"mapValue"in e?em(e)?this.ri(t,Number.MAX_SAFE_INTEGER):fs(e)?this.ci(e.mapValue,t):(this.li(e.mapValue,t),this.oi(t)):"arrayValue"in e?(this.Ei(e.arrayValue,t),this.oi(t)):Q(19022,{hi:e})}_i(e,t){this.ri(t,25),this.Ti(e,t)}Ti(e,t){t.si(e)}li(e,t){const n=e.fields||{};this.ri(t,55);for(const s of Object.keys(n))this._i(s,t),this.ti(n[s],t)}ci(e,t){var o,a;const n=e.fields||{};this.ri(t,53);const s=hs,i=((a=(o=n[s].arrayValue)==null?void 0:o.values)==null?void 0:a.length)||0;this.ri(t,15),t.ii(be(i)),this._i(s,t),this.ti(n[s],t)}Ei(e,t){const n=e.values||[];this.ri(t,50);for(const s of n)this.ti(s,t)}ui(e,t){this.ri(t,37),z.fromName(e).path.forEach(n=>{this.ri(t,60),this.Ti(n,t)})}ri(e,t){e.ii(t)}oi(e){e.ii(2)}}zr.Pi=new zr;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Us=255;function pb(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function WC(r){const e=64-function(n){let s=0;for(let i=0;i<8;++i){const o=pb(255&n[i]);if(s+=o,o!==8)break}return s}(r);return Math.ceil(e/8)}class gb{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Ii(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ri(n.value),n=t.next();this.Ai()}Vi(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.di(n.value),n=t.next();this.fi()}mi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Ri(n);else if(n<2048)this.Ri(960|n>>>6),this.Ri(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Ri(480|n>>>12),this.Ri(128|63&n>>>6),this.Ri(128|63&n);else{const s=t.codePointAt(0);this.Ri(240|s>>>18),this.Ri(128|63&s>>>12),this.Ri(128|63&s>>>6),this.Ri(128|63&s)}}this.Ai()}pi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.di(n);else if(n<2048)this.di(960|n>>>6),this.di(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.di(480|n>>>12),this.di(128|63&n>>>6),this.di(128|63&n);else{const s=t.codePointAt(0);this.di(240|s>>>18),this.di(128|63&s>>>12),this.di(128|63&s>>>6),this.di(128|63&s)}}this.fi()}gi(e){const t=this.yi(e),n=WC(t);this.wi(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}bi(e){const t=this.yi(e),n=WC(t);this.wi(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}Si(){this.Di(Us),this.Di(255)}xi(){this.Ci(Us),this.Ci(255)}reset(){this.position=0}seed(e){this.wi(e.length),this.buffer.set(e,this.position),this.position+=e.length}Fi(){return this.buffer.slice(0,this.position)}yi(e){const t=function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)}(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Ri(e){const t=255&e;t===0?(this.Di(0),this.Di(255)):t===Us?(this.Di(Us),this.Di(0)):this.Di(t)}di(e){const t=255&e;t===0?(this.Ci(0),this.Ci(255)):t===Us?(this.Ci(Us),this.Ci(0)):this.Ci(e)}Ai(){this.Di(0),this.Di(1)}fi(){this.Ci(0),this.Ci(1)}Di(e){this.wi(1),this.buffer[this.position++]=e}Ci(e){this.wi(1),this.buffer[this.position++]=~e}wi(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class mb{constructor(e){this.Oi=e}ai(e){this.Oi.Ii(e)}si(e){this.Oi.mi(e)}ii(e){this.Oi.gi(e)}ni(){this.Oi.Si()}}class _b{constructor(e){this.Oi=e}ai(e){this.Oi.Vi(e)}si(e){this.Oi.pi(e)}ii(e){this.Oi.bi(e)}ni(){this.Oi.xi()}}class no{constructor(){this.Oi=new gb,this.ascending=new mb(this.Oi),this.descending=new _b(this.Oi)}seed(e){this.Oi.seed(e)}Mi(e){return e===0?this.ascending:this.descending}Fi(){return this.Oi.Fi()}reset(){this.Oi.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $r{constructor(e,t,n,s){this.Ni=e,this.Li=t,this.Bi=n,this.Ui=s}ki(){const e=this.Ui.length,t=e===0||this.Ui[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.Ui,0),t!==e?n.set([0],this.Ui.length):++n[n.length-1],new $r(this.Ni,this.Li,this.Bi,n)}qi(e,t,n){return{indexId:this.Ni,uid:e,arrayValue:cu(this.Bi),directionalValue:cu(this.Ui),orderedDocumentKey:cu(t),documentKey:n.path.toArray()}}$i(e,t,n){const s=this.qi(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function Yn(r,e){let t=r.Ni-e.Ni;return t!==0?t:(t=YC(r.Bi,e.Bi),t!==0?t:(t=YC(r.Ui,e.Ui),t!==0?t:z.comparator(r.Li,e.Li)))}function YC(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function cu(r){return Tg()?function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n}(r):r}function XC(r){return typeof r!="string"?r:function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}(r)}class ZC{constructor(e){this.Ki=new Ee((t,n)=>ze.comparator(t.field,n.field)),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.Qi=e.orderBy,this.Wi=[];for(const t of e.filters){const n=t;n.isInequality()?this.Ki=this.Ki.add(n):this.Wi.push(n)}}get Gi(){return this.Ki.size>1}zi(e){if(H(e.collectionGroup===this.collectionId,49279),this.Gi)return!1;const t=Xl(e);if(t!==void 0&&!this.ji(t))return!1;const n=Hr(e);let s=new Set,i=0,o=0;for(;i<n.length&&this.ji(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.Ki.size>0){const a=this.Ki.getIterator().getNext();if(!s.has(a.field.canonicalString())){const u=n[i];if(!this.Hi(a,u)||!this.Ji(this.Qi[o++],u))return!1}++i}for(;i<n.length;++i){const a=n[i];if(o>=this.Qi.length||!this.Ji(this.Qi[o++],a))return!1}return!0}Yi(){if(this.Gi)return null;let e=new Ee(ze.comparator);const t=[];for(const n of this.Wi)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new ru(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new ru(n.field,0))}for(const n of this.Qi)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new ru(n.field,n.dir==="asc"?0:1)));return new Iu(Iu.UNKNOWN_ID,this.collectionId,t,Lo.empty())}ji(e){for(const t of this.Wi)if(this.Hi(t,e))return!0;return!1}Hi(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}Ji(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F_(r){var t,n;if(H(r instanceof de||r instanceof Ie,20012),r instanceof de){if(r instanceof Cm){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map(i=>de.create(r.field,"==",i)))||[];return Ie.create(s,"or")}return r}const e=r.filters.map(s=>F_(s));return Ie.create(e,r.op)}function Eb(r){if(r.getFilters().length===0)return[];const e=dB(F_(r));return H(k_(e),7391),BB(e)||hB(e)?[e]:e.getFilters()}function BB(r){return r instanceof de}function hB(r){return r instanceof Ie&&UB(r)}function k_(r){return BB(r)||hB(r)||function(t){if(t instanceof Ie&&Wl(t)){for(const n of t.getFilters())if(!BB(n)&&!hB(n))return!1;return!0}return!1}(r)}function dB(r){if(H(r instanceof de||r instanceof Ie,34018),r instanceof de)return r;if(r.filters.length===1)return dB(r.filters[0]);const e=r.filters.map(n=>dB(n));let t=Ie.create(e,r.op);return t=Ou(t),k_(t)?t:(H(t instanceof Ie,64498),H(li(t),40251),H(t.filters.length>1,57927),t.filters.reduce((n,s)=>yh(n,s)))}function yh(r,e){let t;return H(r instanceof de||r instanceof Ie,38388),H(e instanceof de||e instanceof Ie,25473),t=r instanceof de?e instanceof de?function(s,i){return Ie.create([s,i],"and")}(r,e):ep(r,e):e instanceof de?ep(e,r):function(s,i){if(H(s.filters.length>0&&i.filters.length>0,48005),li(s)&&li(i))return hm(s,i.getFilters());const o=Wl(s)?s:i,a=Wl(s)?i:s,u=o.filters.map(l=>yh(l,a));return Ie.create(u,"or")}(r,e),Ou(t)}function ep(r,e){if(li(e))return hm(e,r.getFilters());{const t=e.filters.map(n=>yh(r,n));return Ie.create(t,"or")}}function Ou(r){if(H(r instanceof de||r instanceof Ie,11850),r instanceof de)return r;const e=r.getFilters();if(e.length===1)return Ou(e[0]);if(lm(r))return r;const t=e.map(s=>Ou(s)),n=[];return t.forEach(s=>{s instanceof de?n.push(s):s instanceof Ie&&(s.op===r.op?n.push(...s.filters):n.push(s))}),n.length===1?n[0]:Ie.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ib{constructor(){this.Zi=new Th}addToCollectionParentIndex(e,t){return this.Zi.add(t),v.resolve()}getCollectionParents(e,t){return v.resolve(this.Zi.getEntries(t))}addFieldIndex(e,t){return v.resolve()}deleteFieldIndex(e,t){return v.resolve()}deleteAllFieldIndexes(e){return v.resolve()}createTargetIndexes(e,t){return v.resolve()}getDocumentsMatchingTarget(e,t){return v.resolve(null)}getIndexType(e,t){return v.resolve(0)}getFieldIndexes(e,t){return v.resolve([])}getNextCollectionGroupToUpdate(e){return v.resolve(null)}getMinOffset(e,t){return v.resolve(xt.min())}getMinOffsetFromCollectionGroup(e,t){return v.resolve(xt.min())}updateCollectionGroup(e,t,n){return v.resolve()}updateIndexEntries(e,t){return v.resolve()}}class Th{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new Ee(Be.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new Ee(Be.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tp="IndexedDbIndexManager",za=new Uint8Array(0);class Db{constructor(e,t){this.databaseId=t,this.Xi=new Th,this.es=new Hn(n=>Du(n),(n,s)=>qB(n,s)),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.Xi.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener(()=>{this.Xi.add(t)});const i={collectionId:n,parent:lt(s)};return np(e).put(i)}return v.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[jg(t),""],!1,!0);return np(e).Qn(s).next(i=>{for(const o of i){if(o.collectionId!==t)break;n.push(on(o.parent))}return n})}addFieldIndex(e,t){const n=ro(e),s=function(a){return{indexId:a.indexId,collectionGroup:a.collectionGroup,fields:a.fields.map(u=>[u.fieldPath.canonicalString(),u.kind])}}(t);delete s.indexId;const i=n.add(s);if(t.indexState){const o=qs(e);return i.next(a=>{o.put(zC(a,this.uid,t.indexState.sequenceNumber,t.indexState.offset))})}return i.next()}deleteFieldIndex(e,t){const n=ro(e),s=qs(e),i=Hs(e);return n.delete(t.indexId).next(()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))).next(()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))}deleteAllFieldIndexes(e){const t=ro(e),n=Hs(e),s=qs(e);return t.zn().next(()=>n.zn()).next(()=>s.zn())}createTargetIndexes(e,t){return v.forEach(this.ts(t),n=>this.getIndexType(e,n).next(s=>{if(s===0||s===1){const i=new ZC(n).Yi();if(i!=null)return this.addFieldIndex(e,i)}}))}getDocumentsMatchingTarget(e,t){const n=Hs(e);let s=!0;const i=new Map;return v.forEach(this.ts(t),o=>this.ns(e,o).next(a=>{s&&(s=!!a),i.set(o,a)})).next(()=>{if(s){let o=ce();const a=[];return v.forEach(i,(u,l)=>{U(tp,`Using index ${function(Z){return`id=${Z.indexId}|cg=${Z.collectionGroup}|f=${Z.fields.map(se=>`${se.fieldPath}:${se.kind}`).join(",")}`}(u)} to execute ${Du(t)}`);const B=function(Z,se){const ue=Xl(se);if(ue===void 0)return null;for(const ae of wu(Z,ue.fieldPath))switch(ae.op){case"array-contains-any":return ae.value.arrayValue.values||[];case"array-contains":return[ae.value]}return null}(l,u),d=function(Z,se){const ue=new Map;for(const ae of Hr(se))for(const y of wu(Z,ae.fieldPath))switch(y.op){case"==":case"in":ue.set(ae.fieldPath.canonicalString(),y.value);break;case"not-in":case"!=":return ue.set(ae.fieldPath.canonicalString(),y.value),Array.from(ue.values())}return null}(l,u),C=function(Z,se){const ue=[];let ae=!0;for(const y of Hr(se)){const E=y.kind===0?IC(Z,y.fieldPath,Z.startAt):DC(Z,y.fieldPath,Z.startAt);ue.push(E.value),ae&&(ae=E.inclusive)}return new Er(ue,ae)}(l,u),g=function(Z,se){const ue=[];let ae=!0;for(const y of Hr(se)){const E=y.kind===0?DC(Z,y.fieldPath,Z.endAt):IC(Z,y.fieldPath,Z.endAt);ue.push(E.value),ae&&(ae=E.inclusive)}return new Er(ue,ae)}(l,u),D=this.rs(u,l,C),P=this.rs(u,l,g),x=this.ss(u,l,d),J=this._s(u.indexId,B,D,C.inclusive,P,g.inclusive,x);return v.forEach(J,X=>n.Gn(X,t.limit).next(Z=>{Z.forEach(se=>{const ue=z.fromSegments(se.documentKey);o.has(ue)||(o=o.add(ue),a.push(ue))})}))}).next(()=>a)}return v.resolve(null)})}ts(e){let t=this.es.get(e);return t||(e.filters.length===0?t=[e]:t=Eb(Ie.create(e.filters,"and")).map(n=>Zl(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt)),this.es.set(e,t),t)}_s(e,t,n,s,i,o,a){const u=(t!=null?t.length:1)*Math.max(n.length,i.length),l=u/(t!=null?t.length:1),B=[];for(let d=0;d<u;++d){const C=t?this.us(t[d/l]):za,g=this.cs(e,C,n[d%l],s),D=this.ls(e,C,i[d%l],o),P=a.map(x=>this.cs(e,C,x,!0));B.push(...this.createRange(g,D,P))}return B}cs(e,t,n,s){const i=new $r(e,z.empty(),t,n);return s?i:i.ki()}ls(e,t,n,s){const i=new $r(e,z.empty(),t,n);return s?i.ki():i}ns(e,t){const n=new ZC(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next(i=>{let o=null;for(const a of i)n.zi(a)&&(!o||a.fields.length>o.fields.length)&&(o=a);return o})}getIndexType(e,t){let n=2;const s=this.ts(t);return v.forEach(s,i=>this.ns(e,i).next(o=>{o?n!==0&&o.fields.length<function(u){let l=new Ee(ze.comparator),B=!1;for(const d of u.filters)for(const C of d.getFlattenedFilters())C.field.isKeyField()||(C.op==="array-contains"||C.op==="array-contains-any"?B=!0:l=l.add(C.field));for(const d of u.orderBy)d.field.isKeyField()||(l=l.add(d.field));return l.size+(B?1:0)}(i)&&(n=1):n=0})).next(()=>function(o){return o.limit!==null}(t)&&s.length>1&&n===2?1:n)}Es(e,t){const n=new no;for(const s of Hr(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=n.Mi(s.kind);zr.Pi.ei(i,o)}return n.Fi()}us(e){const t=new no;return zr.Pi.ei(e,t.Mi(0)),t.Fi()}hs(e,t){const n=new no;return zr.Pi.ei(ds(this.databaseId,t),n.Mi(function(i){const o=Hr(i);return o.length===0?0:o[o.length-1].kind}(e))),n.Fi()}ss(e,t,n){if(n===null)return[];let s=[];s.push(new no);let i=0;for(const o of Hr(e)){const a=n[i++];for(const u of s)if(this.Ts(t,o.fieldPath)&&_r(a))s=this.Ps(s,o,a);else{const l=u.Mi(o.kind);zr.Pi.ei(a,l)}}return this.Is(s)}rs(e,t,n){return this.ss(e,t,n.position)}Is(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].Fi();return t}Ps(e,t,n){const s=[...e],i=[];for(const o of n.arrayValue.values||[])for(const a of s){const u=new no;u.seed(a.Fi()),zr.Pi.ei(o,u.Mi(t.kind)),i.push(u)}return i}Ts(e,t){return!!e.filters.find(n=>n instanceof de&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in"))}getFieldIndexes(e,t){const n=ro(e),s=qs(e);return(t?n.Qn(aB,IDBKeyRange.bound(t,t)):n.Qn()).next(i=>{const o=[];return v.forEach(i,a=>s.get([a.indexId,this.uid]).next(u=>{o.push(function(B,d){const C=d?new Lo(d.sequenceNumber,new xt(ms(d.readTime),new z(on(d.documentKey)),d.largestBatchId)):Lo.empty(),g=B.fields.map(([D,P])=>new ru(ze.fromServerFormat(D),P));return new Iu(B.indexId,B.collectionGroup,g,C)}(a,u))})).next(()=>o)})}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next(t=>t.length===0?null:(t.sort((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:oe(n.collectionGroup,s.collectionGroup)}),t[0].collectionGroup))}updateCollectionGroup(e,t,n){const s=ro(e),i=qs(e);return this.Rs(e).next(o=>s.Qn(aB,IDBKeyRange.bound(t,t)).next(a=>v.forEach(a,u=>i.put(zC(u.indexId,this.uid,o,n)))))}updateIndexEntries(e,t){const n=new Map;return v.forEach(t,(s,i)=>{const o=n.get(s.collectionGroup);return(o?v.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next(a=>(n.set(s.collectionGroup,a),v.forEach(a,u=>this.As(e,s,u).next(l=>{const B=this.Vs(i,u);return l.isEqual(B)?v.resolve():this.ds(e,i,u,l,B)}))))})}fs(e,t,n,s){return Hs(e).put(s.qi(this.uid,this.hs(n,t.key),t.key))}ps(e,t,n,s){return Hs(e).delete(s.$i(this.uid,this.hs(n,t.key),t.key))}As(e,t,n){const s=Hs(e);let i=new Ee(Yn);return s.Hn({index:D_,range:IDBKeyRange.only([n.indexId,this.uid,cu(this.hs(n,t))])},(o,a)=>{i=i.add(new $r(n.indexId,t,XC(a.arrayValue),XC(a.directionalValue)))}).next(()=>i)}Vs(e,t){let n=new Ee(Yn);const s=this.Es(t,e);if(s==null)return n;const i=Xl(t);if(i!=null){const o=e.data.field(i.fieldPath);if(_r(o))for(const a of o.arrayValue.values||[])n=n.add(new $r(t.indexId,e.key,this.us(a),s))}else n=n.add(new $r(t.indexId,e.key,za,s));return n}ds(e,t,n,s,i){U(tp,"Updating index entries for document '%s'",t.key);const o=[];return function(u,l,B,d,C){const g=u.getIterator(),D=l.getIterator();let P=Vs(g),x=Vs(D);for(;P||x;){let J=!1,X=!1;if(P&&x){const Z=B(P,x);Z<0?X=!0:Z>0&&(J=!0)}else P!=null?X=!0:J=!0;J?(d(x),x=Vs(D)):X?(C(P),P=Vs(g)):(P=Vs(g),x=Vs(D))}}(s,i,Yn,a=>{o.push(this.fs(e,t,n,a))},a=>{o.push(this.ps(e,t,n,a))}),v.waitFor(o)}Rs(e){let t=1;return qs(e).Hn({index:I_,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},(n,s,i)=>{i.done(),t=s.sequenceNumber+1}).next(()=>t)}createRange(e,t,n){n=n.sort((o,a)=>Yn(o,a)).filter((o,a,u)=>!a||Yn(o,u[a-1])!==0);const s=[];s.push(e);for(const o of n){const a=Yn(o,e),u=Yn(o,t);if(a===0)s[0]=e.ki();else if(a>0&&u<0)s.push(o),s.push(o.ki());else if(u>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.gs(s[o],s[o+1]))return[];const a=s[o].$i(this.uid,za,z.empty()),u=s[o+1].$i(this.uid,za,z.empty());i.push(IDBKeyRange.bound(a,u))}return i}gs(e,t){return Yn(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(rp)}getMinOffset(e,t){return v.mapArray(this.ts(t),n=>this.ns(e,n).next(s=>s||Q(44426))).next(rp)}}function np(r){return Qe(r,Jo)}function Hs(r){return Qe(r,wo)}function ro(r){return Qe(r,Eh)}function qs(r){return Qe(r,Do)}function rp(r){H(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;HB(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new xt(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xn{constructor(e){this.ys=e}next(){return this.ys+=2,this.ys}static ws(){return new xn(0)}static bs(){return new xn(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wb{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.Ss(e).next(t=>{const n=new xn(t.highestTargetId);return t.highestTargetId=n.next(),this.vs(e,t).next(()=>t.highestTargetId)})}getLastRemoteSnapshotVersion(e){return this.Ss(e).next(t=>ee.fromTimestamp(new _e(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds)))}getHighestSequenceNumber(e){return this.Ss(e).next(t=>t.highestListenSequenceNumber)}setTargetsMetadata(e,t,n){return this.Ss(e).next(s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.vs(e,s)))}addTargetData(e,t){return this.Ds(e,t).next(()=>this.Ss(e).next(n=>(n.targetCount+=1,this.xs(t,n),this.vs(e,n))))}updateTargetData(e,t){return this.Ds(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next(()=>js(e).delete(t.targetId)).next(()=>this.Ss(e)).next(n=>(H(n.targetCount>0,8065),n.targetCount-=1,this.vs(e,n)))}removeTargets(e,t,n){let s=0;const i=[];return js(e).Hn((o,a)=>{const u=ho(this.serializer,a);u.sequenceNumber<=t&&n.get(u.targetId)===null&&(s++,i.push(this.removeTargetData(e,u)))}).next(()=>v.waitFor(i)).next(()=>s)}forEachTarget(e,t){return js(e).Hn((n,s)=>{const i=ho(this.serializer,s);t(i)})}Ss(e){return sp(e).get(Su).next(t=>(H(t!==null,2888),t))}vs(e,t){return sp(e).put(Su,t)}Ds(e,t){return js(e).put(S_(this.serializer,t))}xs(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.Ss(e).next(t=>t.targetCount)}getTargetData(e,t){const n=pc(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return js(e).Hn({range:s,index:E_},(o,a,u)=>{const l=ho(this.serializer,a);ph(t,l.target)&&(i=l,u.done())}).next(()=>i)}addMatchingKeys(e,t,n){const s=[],i=rr(e);return t.forEach(o=>{const a=lt(o.path);s.push(i.put({targetId:n,path:a})),s.push(this.referenceDelegate.addReference(e,n,o))}),v.waitFor(s)}removeMatchingKeys(e,t,n){const s=rr(e);return v.forEach(t,i=>{const o=lt(i.path);return v.waitFor([s.delete([n,o]),this.referenceDelegate.removeReference(e,n,i)])})}removeMatchingKeysForTargetId(e,t){const n=rr(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=rr(e);let i=ce();return s.Hn({range:n,jn:!0},(o,a,u)=>{const l=on(o[1]),B=new z(l);i=i.add(B)}).next(()=>i)}containsKey(e,t){const n=lt(t.path),s=IDBKeyRange.bound([n],[jg(n)],!1,!0);let i=0;return rr(e).Hn({index:_h,jn:!0,range:s},([o,a],u,l)=>{o!==0&&(i++,l.done())}).next(()=>i>0)}ye(e,t){return js(e).get(t).next(n=>n?ho(this.serializer,n):null)}}function js(r){return Qe(r,fi)}function sp(r){return Qe(r,ss)}function rr(r){return Qe(r,Ci)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yb{constructor(e,t){this.db=e,this.garbageCollector=$m(this,t)}ir(e){const t=this.Cs(e);return this.db.getTargetCache().getTargetCount(e).next(n=>t.next(s=>n+s))}Cs(e){let t=0;return this.sr(e,n=>{t++}).next(()=>t)}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}sr(e,t){return this.Fs(e,(n,s)=>t(s))}addReference(e,t,n){return $a(e,n)}removeReference(e,t,n){return $a(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return $a(e,t)}Os(e,t){return function(s,i){let o=!1;return O_(s).Jn(a=>N_(s,a,i).next(u=>(u&&(o=!0),v.resolve(!u)))).next(()=>o)}(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Fs(e,(o,a)=>{if(a<=t){const u=this.Os(e,o).next(l=>{if(!l)return i++,n.getEntry(e,o).next(()=>(n.removeEntry(o,ee.min()),rr(e).delete(function(d){return[0,lt(d.path)]}(o))))});s.push(u)}}).next(()=>v.waitFor(s)).next(()=>n.apply(e)).next(()=>i)}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return $a(e,t)}Fs(e,t){const n=rr(e);let s,i=yt.wn;return n.Hn({index:_h},([o,a],{path:u,sequenceNumber:l})=>{o===0?(i!==yt.wn&&t(new z(on(s)),i),i=l,s=u):i=yt.wn}).next(()=>{i!==yt.wn&&t(new z(on(s)),i)})}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function $a(r,e){return rr(r).put(function(n,s){return{targetId:0,path:lt(n.path),sequenceNumber:s}}(e,r.currentSequenceNumber))}// Copyright 2024 Google LLC* @license
function L_(r,e){var n;let t=e;for(const s of r.stages)t=Tb({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function Dc(r,e){return L_(r,[e]).length>0}function x_(r,e){return Me(r)?Dc(r,e):oc(r,e)}function Tb(r,e,t){if(e instanceof aa)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&`/${a.key.getCollectionPath().canonicalString()}`===i.hr)}(0,e,t);if(e instanceof ca)return function(s,i,o){return o.filter(a=>{const u=Io(re(i.condition).evaluate(s,a));return u!==void 0&&qt(u,At)})}(r,e,t);if(e instanceof ua)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&a.key.getCollectionPath().lastSegment()===i.collectionId)}(0,e,t);if(e instanceof hc)return function(s,i,o){return o.filter(a=>a.isFoundDocument())}(0,0,t);if(e instanceof dc)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&i.Pr.has(a.key.path.toStringWithLeadingSlash()))}(0,e,t);if(e instanceof Dr)return function(s,i,o){return o.slice(0,i.limit)}(0,e,t);if(e instanceof sn)return function(s,i,o){const a=i.orderings.map(u=>({Ms:re(u.expr),direction:u.direction}));return[...o].sort((u,l)=>{for(const{Ms:B,direction:d}of a){const C=Io(B.evaluate(s,u)),g=Io(B.evaluate(s,l)),D=Bt(C??cn,g??cn);if(D!==0)return d==="ascending"?D:-D}return 0})}(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function fB(r){const e=function(n){for(let s=n.stages.length-1;s>=0;s--){const i=n.stages[s];if(i instanceof sn)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")}(r);return(t,n)=>{for(const s of e){const i=Io(re(s.expr).evaluate({serializer:r.serializer},t)),o=Io(re(s.expr).evaluate({serializer:r.serializer},n)),a=Bt(i||cn,o||cn);if(a!==0)return s.direction==="ascending"?a:-a}return 0}}function Il(r){for(let e=r.stages.length-1;e>=0;e--){const t=r.stages[e];if(t instanceof Dr)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V_{constructor(){this.changes=new Hn(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Fe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?v.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ab{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return Xn(e).put(n)}removeEntry(e,t,n){return Xn(e).delete(function(i,o){const a=i.path.toArray();return[a.slice(0,a.length-2),a[a.length-2],Nu(o),a[a.length-1]]}(t,n))}updateMetadata(e,t){return this.getMetadata(e).next(n=>(n.byteSize+=t,this.Ns(e,n)))}getEntry(e,t){let n=Fe.newInvalidDocument(t);return Xn(e).Hn({index:uu,range:IDBKeyRange.only(so(t))},(s,i)=>{n=this.Ls(t,i)}).next(()=>n)}Bs(e,t){let n={size:0,document:Fe.newInvalidDocument(t)};return Xn(e).Hn({index:uu,range:IDBKeyRange.only(so(t))},(s,i)=>{n={document:this.Ls(t,i),size:Pu(i)}}).next(()=>n)}getEntries(e,t){let n=Je();return this.Us(e,t,(s,i)=>{const o=this.Ls(s,i);n=n.insert(s,o)}).next(()=>n)}getAllEntries(e){let t=Je();return Xn(e).Hn((n,s)=>{const i=this.Ls(z.fromSegments(s.prefixPath.concat(s.collectionGroup,s.documentId)),s);t=t.insert(i.key,i)}).next(()=>t)}ks(e,t){let n=Je(),s=new Ae(z.comparator);return this.Us(e,t,(i,o)=>{const a=this.Ls(i,o);n=n.insert(i,a),s=s.insert(i,Pu(o))}).next(()=>({documents:n,qs:s}))}Us(e,t,n){if(t.isEmpty())return v.resolve();let s=new Ee(ap);t.forEach(u=>s=s.add(u));const i=IDBKeyRange.bound(so(s.first()),so(s.last())),o=s.getIterator();let a=o.getNext();return Xn(e).Hn({index:uu,range:i},(u,l,B)=>{const d=z.fromSegments([...l.prefixPath,l.collectionGroup,l.documentId]);for(;a&&ap(a,d)<0;)n(a,null),a=o.getNext();a&&a.isEqual(d)&&(n(a,l),a=o.hasNext()?o.getNext():null),a?B.Kn(so(a)):B.done()}).next(()=>{for(;a;)n(a,null),a=o.hasNext()?o.getNext():null})}getDocumentsMatchingQuery(e,t,n,s,i){const o=Me(t)?Be.fromString(la(t)):t.path,a=[o.popLast().toArray(),o.lastSegment(),Nu(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],u=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return Xn(e).Qn(IDBKeyRange.bound(a,u,!0)).next(l=>{i==null||i.incrementDocumentReadCount(l.length);let B=Je();for(const d of l){const C=this.Ls(z.fromSegments(d.prefixPath.concat(d.collectionGroup,d.documentId)),d);C.isFoundDocument()&&(x_(t,C)||s.has(C.key))&&(B=B.insert(C.key,C))}return B})}getAllFromCollectionGroup(e,t,n,s){let i=Je();const o=op(t,n),a=op(t,xt.max());return Xn(e).Hn({index:__,range:IDBKeyRange.bound(o,a,!0)},(u,l,B)=>{const d=this.Ls(z.fromSegments(l.prefixPath.concat(l.collectionGroup,l.documentId)),l);i=i.insert(d.key,d),i.size===s&&B.done()}).next(()=>i)}newChangeBuffer(e){return new Rb(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next(t=>t.byteSize)}getMetadata(e){return ip(e).get(oB).next(t=>(H(!!t,20021),t))}Ns(e,t){return ip(e).put(oB,t)}Ls(e,t){if(t){const n=hb(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(ee.min())))return n}return Fe.newInvalidDocument(e)}}function M_(r){return new Ab(r)}class Rb extends V_{constructor(e,t){super(),this.$s=e,this.trackRemovals=t,this.Ks=new Hn(n=>n.toString(),(n,s)=>n.isEqual(s))}applyChanges(e){const t=[];let n=0,s=new Ee((i,o)=>oe(i.canonicalString(),o.canonicalString()));return this.changes.forEach((i,o)=>{const a=this.Ks.get(i);if(t.push(this.$s.removeEntry(e,i,a.readTime)),o.isValidDocument()){const u=KC(this.$s.serializer,o);s=s.add(i.path.popLast());const l=Pu(u);n+=l-a.size,t.push(this.$s.addEntry(e,i,u))}else if(n-=a.size,this.trackRemovals){const u=KC(this.$s.serializer,o.convertToNoDocument(ee.min()));t.push(this.$s.addEntry(e,i,u))}}),s.forEach(i=>{t.push(this.$s.indexManager.addToCollectionParentIndex(e,i))}),t.push(this.$s.updateMetadata(e,n)),v.waitFor(t)}getFromCache(e,t){return this.$s.Bs(e,t).next(n=>(this.Ks.set(t,{size:n.size,readTime:n.document.readTime}),n.document))}getAllFromCache(e,t){return this.$s.ks(e,t).next(({documents:n,qs:s})=>(s.forEach((i,o)=>{this.Ks.set(i,{size:o,readTime:n.get(i).readTime})}),n))}}function ip(r){return Qe(r,Ko)}function Xn(r){return Qe(r,vu)}function so(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function op(r,e){const t=e.documentKey.path.toArray();return[r,Nu(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function ap(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=oe(t[i],n[i]),s)return s;return s=oe(t.length,n.length),s||(s=oe(t[t.length-2],n[n.length-2]),s||oe(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bb{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class G_{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(s=>(n=s,this.remoteDocumentCache.getEntry(e,t))).next(s=>(n!==null&&po(n.mutation,s,wt.empty(),_e.now()),s))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.getLocalViewOfDocuments(e,n,ce()).next(()=>n))}getLocalViewOfDocuments(e,t,n=ce()){const s=Gt();return this.populateOverlays(e,s,t).next(()=>this.computeViews(e,t,s,n).next(i=>{let o=jr();return i.forEach((a,u)=>{o=o.insert(a,u.overlayedDocument)}),o}))}getOverlayedDocuments(e,t){const n=Gt();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,ce()))}populateOverlays(e,t,n){const s=[];return n.forEach(i=>{t.has(i)||s.push(i)}),this.documentOverlayCache.getOverlays(e,s).next(i=>{i.forEach((o,a)=>{t.set(o,a)})})}computeViews(e,t,n,s){let i=Je();const o=mo(),a=function(){return mo()}();return t.forEach((u,l)=>{const B=n.get(l.key);s.has(l.key)&&(B===void 0||B.mutation instanceof Un)?i=i.insert(l.key,l):B!==void 0?(o.set(l.key,B.mutation.getFieldMask()),po(B.mutation,l,B.mutation.getFieldMask(),_e.now())):o.set(l.key,wt.empty())}),this.recalculateAndSaveOverlays(e,i).next(u=>(u.forEach((l,B)=>o.set(l,B)),t.forEach((l,B)=>a.set(l,new bb(B,o.get(l)??null))),a))}recalculateAndSaveOverlays(e,t){const n=mo();let s=new Ae((o,a)=>o-a),i=ce();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(o=>{for(const a of o)a.keys().forEach(u=>{const l=t.get(u);if(l===null)return;let B=n.get(u)||wt.empty();B=a.applyToLocalView(l,B),n.set(u,B);const d=(s.get(a.batchId)||ce()).add(u);s=s.insert(a.batchId,d)})}).next(()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const u=a.getNext(),l=u.key,B=u.value,d=wm();B.forEach(C=>{if(!i.has(C)){const g=am(t.get(C),n.get(C));g!==null&&d.set(C,g),i=i.add(C)}}),o.push(this.documentOverlayCache.saveOverlays(e,l,d))}return v.waitFor(o)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.recalculateAndSaveOverlays(e,n))}getDocumentsMatchingQuery(e,t,n,s){return Me(t)?this.getDocumentsMatchingPipeline(e,t,n,s):BT(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):KB(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next(i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):v.resolve(Gt());let a=Bi,u=i;return o.next(l=>v.forEach(l,(B,d)=>(a<d.largestBatchId&&(a=d.largestBatchId),i.get(B)?v.resolve():this.remoteDocumentCache.getEntry(e,B).next(C=>{u=u.insert(B,C)}))).next(()=>this.populateOverlays(e,l,i)).next(()=>this.computeViews(e,u,l,ce())).next(B=>({batchId:a,changes:Dm(B)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new z(t)).next(n=>{let s=jr();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s})}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=jr();return this.indexManager.getCollectionParents(e,i).next(a=>v.forEach(a,u=>{const l=function(d,C){return new As(C,null,d.explicitOrderBy.slice(),d.filters.slice(),d.limit,d.limitType,d.startAt,d.endAt)}(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,l,n,s).next(B=>{B.forEach((d,C)=>{o=o.insert(d,C)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s))).next(o=>this.retrieveMatchingLocalDocuments(i,o,a=>oc(t,a)))}getDocumentsMatchingPipeline(e,t,n,s){if(An(t)==="collection_group"){const i=ch(t);let o=jr();return this.indexManager.getCollectionParents(e,i).next(a=>v.forEach(a,u=>{const l=function(d,C){const g=d.stages.map(D=>D instanceof ua?new aa(C.canonicalString(),{}):D);return new ut(d.serializer,g)}(t,u.child(i));return this.getDocumentsMatchingPipeline(e,l,n,s).next(B=>{B.forEach((d,C)=>{o=o.insert(d,C)})})}).next(()=>o))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next(o=>{switch(i=o,An(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let a=ce();for(const u of Au(t))a=a.add(z.fromPath(u));return this.remoteDocumentCache.getEntries(e,a);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new G("invalid-argument",`Invalid pipeline source to execute offline: ${Rn(t)}`)}}).next(o=>this.retrieveMatchingLocalDocuments(i,o,a=>Dc(t,a)))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach((i,o)=>{const a=o.getKey();t.get(a)===null&&(t=t.insert(a,Fe.newInvalidDocument(a)))});let s=jr();return t.forEach((i,o)=>{const a=e.get(i);a!==void 0&&po(a.mutation,o,wt.empty(),_e.now()),n(o)&&(s=s.insert(i,o))}),s}getOverlaysForPipeline(e,t,n){switch(An(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,Be.fromString(la(t)),n);case"collection_group":throw new G("invalid-argument",`Unexpected collection group pipeline: ${Rn(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,Au(t).map(s=>z.fromPath(s)));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new G("invalid-argument",`Failed to get overlays for pipeline: ${Rn(t)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vb{constructor(e){this.serializer=e,this.Qs=new Map,this.Ws=new Map}getBundleMetadata(e,t){return v.resolve(this.Qs.get(t))}saveBundleMetadata(e,t){return this.Qs.set(t.id,function(s){return{id:s.id,version:s.version,createTime:et(s.createTime)}}(t)),v.resolve()}getNamedQuery(e,t){return v.resolve(this.Ws.get(t))}saveNamedQuery(e,t){return this.Ws.set(t.name,function(s){return{name:s.name,query:P_(s.bundledQuery),readTime:et(s.readTime)}}(t)),v.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sb{constructor(){this.overlays=new Ae(z.comparator),this.Gs=new Map}getOverlay(e,t){return v.resolve(this.overlays.get(t))}getOverlays(e,t){const n=Gt();return v.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&n.set(s,i)})).next(()=>n)}getAllOverlays(e,t){const n=Gt();return this.overlays.forEach((s,i)=>{i.largestBatchId>t&&n.set(s,i)}),v.resolve(n)}saveOverlays(e,t,n){return n.forEach((s,i)=>{this.Zr(e,t,i)}),v.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Gs.get(n);return s!==void 0&&(s.forEach(i=>this.overlays=this.overlays.remove(i)),this.Gs.delete(n)),v.resolve()}getOverlaysForCollection(e,t,n){const s=Gt(),i=t.length+1,o=new z(t.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const u=a.getNext().value,l=u.getKey();if(!t.isPrefixOf(l.path))break;l.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return v.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new Ae((l,B)=>l-B);const o=this.overlays.getIterator();for(;o.hasNext();){const l=o.getNext().value;if(l.getKey().getCollectionGroup()===t&&l.largestBatchId>n){let B=i.get(l.largestBatchId);B===null&&(B=Gt(),i=i.insert(l.largestBatchId,B)),B.set(l.getKey(),l)}}const a=Gt(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((l,B)=>a.set(l,B)),!(a.size()>=s)););return v.resolve(a)}Zr(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.Gs.get(s.largestBatchId).delete(n.key);this.Gs.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new wh(t,n));let i=this.Gs.get(t);i===void 0&&(i=ce(),this.Gs.set(t,i)),this.Gs.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pb{constructor(){this.sessionToken=Le.EMPTY_BYTE_STRING}getSessionToken(e){return v.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,v.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ah{constructor(){this.zs=new Ee(Ye.js),this.Hs=new Ee(Ye.Js)}isEmpty(){return this.zs.isEmpty()}addReference(e,t){const n=new Ye(e,t);this.zs=this.zs.add(n),this.Hs=this.Hs.add(n)}Ys(e,t){e.forEach(n=>this.addReference(n,t))}removeReference(e,t){this.Zs(new Ye(e,t))}Xs(e,t){e.forEach(n=>this.removeReference(n,t))}e_(e){const t=new z(new Be([])),n=new Ye(t,e),s=new Ye(t,e+1),i=[];return this.Hs.forEachInRange([n,s],o=>{this.Zs(o),i.push(o.key)}),i}t_(){this.zs.forEach(e=>this.Zs(e))}Zs(e){this.zs=this.zs.delete(e),this.Hs=this.Hs.delete(e)}n_(e){const t=new z(new Be([])),n=new Ye(t,e),s=new Ye(t,e+1);let i=ce();return this.Hs.forEachInRange([n,s],o=>{i=i.add(o.key)}),i}containsKey(e){const t=new Ye(e,0),n=this.zs.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class Ye{constructor(e,t){this.key=e,this.r_=t}static js(e,t){return z.comparator(e.key,t.key)||oe(e.r_,t.r_)}static Js(e,t){return oe(e.r_,t.r_)||z.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nb{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Gr=1,this.i_=new Ee(Ye.js)}checkEmpty(e){return v.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Gr;this.Gr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new gh(i,t,n,s);this.mutationQueue.push(o);for(const a of s)this.i_=this.i_.add(new Ye(a.key,i)),this.indexManager.addToCollectionParentIndex(e,a.key.path.popLast());return v.resolve(o)}lookupMutationBatch(e,t){return v.resolve(this.s_(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.__(n),i=s<0?0:s;return v.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return v.resolve(this.mutationQueue.length===0?ts:this.Gr-1)}getAllMutationBatches(e){return v.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new Ye(t,0),s=new Ye(t,Number.POSITIVE_INFINITY),i=[];return this.i_.forEachInRange([n,s],o=>{const a=this.s_(o.r_);i.push(a)}),v.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new Ee(oe);return t.forEach(s=>{const i=new Ye(s,0),o=new Ye(s,Number.POSITIVE_INFINITY);this.i_.forEachInRange([i,o],a=>{n=n.add(a.r_)})}),v.resolve(this.o_(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;z.isDocumentKey(i)||(i=i.child(""));const o=new Ye(new z(i),0);let a=new Ee(oe);return this.i_.forEachWhile(u=>{const l=u.key.path;return!!n.isPrefixOf(l)&&(l.length===s&&(a=a.add(u.r_)),!0)},o),v.resolve(this.o_(a))}o_(e){const t=[];return e.forEach(n=>{const s=this.s_(n);s!==null&&t.push(s)}),t}removeMutationBatch(e,t){H(this.a_(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.i_;return v.forEach(t.mutations,s=>{const i=new Ye(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)}).next(()=>{this.i_=n})}Hr(e){}containsKey(e,t){const n=new Ye(t,0),s=this.i_.firstAfterOrEqual(n);return v.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,v.resolve()}a_(e,t){return this.__(e)}__(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}s_(e){const t=this.__(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ob{constructor(e){this.u_=e,this.docs=function(){return new Ae(z.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.u_(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return v.resolve(n?n.document.mutableCopy():Fe.newInvalidDocument(t))}getEntries(e,t){let n=Je();return t.forEach(s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():Fe.newInvalidDocument(s))}),v.resolve(n)}getAllEntries(e){let t=Je();return this.docs.forEach((n,s)=>{t=t.insert(n,s.document)}),v.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,o;Me(t)?(i=Be.fromString(la(t)),o=B=>Dc(t,B)):(i=t.path,o=B=>oc(t,B));let a=Je();const u=new z(i.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(u);for(;l.hasNext();){const{key:B,value:{document:d}}=l.getNext();if(!i.isPrefixOf(B.path))break;B.path.length>i.length+1||HB(gm(d),n)<=0||(s.has(d.key)||o(d))&&(a=a.insert(d.key,d.mutableCopy()))}return v.resolve(a)}getAllFromCollectionGroup(e,t,n,s){Q(9500)}c_(e,t){return v.forEach(this.docs,n=>t(n))}newChangeBuffer(e){return new Fb(this)}getSize(e){return v.resolve(this.size)}}class Fb extends V_{constructor(e){super(),this.$s=e}applyChanges(e){const t=[];return this.changes.forEach((n,s)=>{s.isValidDocument()?t.push(this.$s.addEntry(e,s)):this.$s.removeEntry(n)}),v.waitFor(t)}getFromCache(e,t){return this.$s.getEntry(e,t)}getAllFromCache(e,t){return this.$s.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kb{constructor(e){this.persistence=e,this.l_=new Hn(t=>pc(t),ph),this.lastRemoteSnapshotVersion=ee.min(),this.highestTargetId=0,this.E_=0,this.h_=new Ah,this.targetCount=0,this.T_=xn.ws()}forEachTarget(e,t){return this.l_.forEach((n,s)=>t(s)),v.resolve()}getLastRemoteSnapshotVersion(e){return v.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return v.resolve(this.E_)}allocateTargetId(e){return this.highestTargetId=this.T_.next(),v.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.E_&&(this.E_=t),v.resolve()}Ds(e){this.l_.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.T_=new xn(t),this.highestTargetId=t),e.sequenceNumber>this.E_&&(this.E_=e.sequenceNumber)}addTargetData(e,t){return this.Ds(t),this.targetCount+=1,v.resolve()}updateTargetData(e,t){return this.Ds(t),v.resolve()}removeTargetData(e,t){return this.l_.delete(t.target),this.h_.e_(t.targetId),this.targetCount-=1,v.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.l_.forEach((o,a)=>{a.sequenceNumber<=t&&n.get(a.targetId)===null&&(this.l_.delete(o),i.push(this.removeMatchingKeysForTargetId(e,a.targetId)),s++)}),v.waitFor(i).next(()=>s)}getTargetCount(e){return v.resolve(this.targetCount)}getTargetData(e,t){const n=this.l_.get(t)||null;return v.resolve(n)}addMatchingKeys(e,t,n){return this.h_.Ys(t,n),v.resolve()}removeMatchingKeys(e,t,n){this.h_.Xs(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach(o=>{i.push(s.markPotentiallyOrphaned(e,o))}),v.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.h_.e_(t),v.resolve()}getMatchingKeysForTargetId(e,t){const n=this.h_.n_(t);return v.resolve(n)}containsKey(e,t){return v.resolve(this.h_.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rh{constructor(e,t){this.P_={},this.overlays={},this.I_=new yt(0),this.R_=!1,this.R_=!0,this.A_=new Pb,this.referenceDelegate=e(this),this.V_=new kb(this),this.indexManager=new Ib,this.remoteDocumentCache=function(s){return new Ob(s)}(n=>this.referenceDelegate.d_(n)),this.serializer=new v_(t),this.f_=new vb(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.R_=!1,Promise.resolve()}get started(){return this.R_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Sb,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.P_[e.toKey()];return n||(n=new Nb(t,this.referenceDelegate),this.P_[e.toKey()]=n),n}getGlobalsCache(){return this.A_}getTargetCache(){return this.V_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.f_}runTransaction(e,t,n){U("MemoryPersistence","Starting transaction:",e);const s=new Lb(this.I_.next());return this.referenceDelegate.m_(),n(s).next(i=>this.referenceDelegate.p_(s).next(()=>i)).toPromise().then(i=>(s.raiseOnCommittedEvent(),i))}g_(e,t){return v.or(Object.values(this.P_).map(n=>()=>n.containsKey(e,t)))}}class Lb extends jm{constructor(e){super(),this.currentSequenceNumber=e}}class wc{constructor(e){this.persistence=e,this.y_=new Ah,this.w_=null}static b_(e){return new wc(e)}get S_(){if(this.w_)return this.w_;throw Q(60996)}addReference(e,t,n){return this.y_.addReference(n,t),this.S_.delete(n.toString()),v.resolve()}removeReference(e,t,n){return this.y_.removeReference(n,t),this.S_.add(n.toString()),v.resolve()}markPotentiallyOrphaned(e,t){return this.S_.add(t.toString()),v.resolve()}removeTarget(e,t){this.y_.e_(t.targetId).forEach(s=>this.S_.add(s.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(s=>{s.forEach(i=>this.S_.add(i.toString()))}).next(()=>n.removeTargetData(e,t))}m_(){this.w_=new Set}p_(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return v.forEach(this.S_,n=>{const s=z.fromPath(n);return this.v_(e,s).next(i=>{i||t.removeEntry(s,ee.min())})}).next(()=>(this.w_=null,t.apply(e)))}updateLimboDocument(e,t){return this.v_(e,t).next(n=>{n?this.S_.delete(t.toString()):this.S_.add(t.toString())})}d_(e){return 0}v_(e,t){return v.or([()=>v.resolve(this.y_.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.g_(e,t)])}}class Fu{constructor(e,t){this.persistence=e,this.D_=new Hn(n=>lt(n.path),(n,s)=>n.isEqual(s)),this.garbageCollector=$m(this,t)}static b_(e,t){return new Fu(e,t)}m_(){}p_(e){return v.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}ir(e){const t=this.Cs(e);return this.persistence.getTargetCache().getTargetCount(e).next(n=>t.next(s=>n+s))}Cs(e){let t=0;return this.sr(e,n=>{t++}).next(()=>t)}sr(e,t){return v.forEach(this.D_,(n,s)=>this.Os(e,n,s).next(i=>i?v.resolve():t(s)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.c_(e,o=>this.Os(e,o,t).next(a=>{a||(n++,i.removeEntry(o,ee.min()))})).next(()=>i.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.D_.set(t,e.currentSequenceNumber),v.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),v.resolve()}removeReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),v.resolve()}updateLimboDocument(e,t){return this.D_.set(t,e.currentSequenceNumber),v.resolve()}d_(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=tu(e.data.value)),t}Os(e,t,n){return v.or([()=>this.persistence.g_(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.D_.get(t);return v.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xb{constructor(e){this.serializer=e}Nn(e,t,n,s){const i=new uc("createOrUpgrade",t);n<1&&s>=1&&(function(u){u.createObjectStore(ha)}(e),function(u){u.createObjectStore(jo,{keyPath:UR}),u.createObjectStore(Jt,{keyPath:qC,autoIncrement:!0}).createIndex(Yr,jC,{unique:!0}),u.createObjectStore(di)}(e),up(e),function(u){u.createObjectStore(qr)}(e));let o=v.resolve();return n<3&&s>=3&&(n!==0&&(function(u){u.deleteObjectStore(Ci),u.deleteObjectStore(fi),u.deleteObjectStore(ss)}(e),up(e)),o=o.next(()=>function(u){const l=u.store(ss),B={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:ee.min().toTimestamp(),targetCount:0};return l.put(Su,B)}(i))),n<4&&s>=4&&(n!==0&&(o=o.next(()=>function(u,l){return l.store(Jt).Qn().next(d=>{u.deleteObjectStore(Jt),u.createObjectStore(Jt,{keyPath:qC,autoIncrement:!0}).createIndex(Yr,jC,{unique:!0});const C=l.store(Jt),g=d.map(D=>C.put(D));return v.waitFor(g)})}(e,i))),o=o.next(()=>{(function(u){u.createObjectStore(pi,{keyPath:WR})})(e)})),n<5&&s>=5&&(o=o.next(()=>this.x_(i))),n<6&&s>=6&&(o=o.next(()=>(function(u){u.createObjectStore(Ko)}(e),this.C_(i)))),n<7&&s>=7&&(o=o.next(()=>this.F_(i))),n<8&&s>=8&&(o=o.next(()=>this.O_(e,i))),n<9&&s>=9&&(o=o.next(()=>{(function(u){u.objectStoreNames.contains("remoteDocumentChanges")&&u.deleteObjectStore("remoteDocumentChanges")})(e)})),n<10&&s>=10&&(o=o.next(()=>this.M_(i))),n<11&&s>=11&&(o=o.next(()=>{(function(u){u.createObjectStore(gc,{keyPath:YR})})(e),function(u){u.createObjectStore(mc,{keyPath:XR})}(e)})),n<12&&s>=12&&(o=o.next(()=>{(function(u){const l=u.createObjectStore(_c,{keyPath:ib});l.createIndex(uB,ob,{unique:!1}),l.createIndex(w_,ab,{unique:!1})})(e)})),n<13&&s>=13&&(o=o.next(()=>function(u){const l=u.createObjectStore(vu,{keyPath:qR});l.createIndex(uu,jR),l.createIndex(__,KR)}(e)).next(()=>this.N_(e,i)).next(()=>e.deleteObjectStore(qr))),n<14&&s>=14&&(o=o.next(()=>this.L_(e,i))),n<15&&s>=15&&(o=o.next(()=>function(u){u.createObjectStore(Eh,{keyPath:ZR,autoIncrement:!0}).createIndex(aB,eb,{unique:!1}),u.createObjectStore(Do,{keyPath:tb}).createIndex(I_,nb,{unique:!1}),u.createObjectStore(wo,{keyPath:rb}).createIndex(D_,sb,{unique:!1})}(e))),n<16&&s>=16&&(o=o.next(()=>{t.objectStore(Do).clear()}).next(()=>{t.objectStore(wo).clear()})),n<17&&s>=17&&(o=o.next(()=>{(function(u){u.createObjectStore(Ih,{keyPath:ub})})(e)})),n<18&&s>=18&&Tg()&&(o=o.next(()=>{t.objectStore(Do).clear()}).next(()=>{t.objectStore(wo).clear()})),o}C_(e){let t=0;return e.store(qr).Hn((n,s)=>{t+=Pu(s)}).next(()=>{const n={byteSize:t};return e.store(Ko).put(oB,n)})}x_(e){const t=e.store(jo),n=e.store(Jt);return t.Qn().next(s=>v.forEach(s,i=>{const o=IDBKeyRange.bound([i.userId,ts],[i.userId,i.lastAcknowledgedBatchId]);return n.Qn(Yr,o).next(a=>v.forEach(a,u=>{H(u.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:u.batchId});const l=Jr(this.serializer,u);return b_(e,i.userId,l).next(()=>{})}))}))}F_(e){const t=e.store(Ci),n=e.store(qr);return e.store(ss).get(Su).next(s=>{const i=[];return n.Hn((o,a)=>{const u=new Be(o),l=function(d){return[0,lt(d)]}(u);i.push(t.get(l).next(B=>B?v.resolve():(d=>t.put({targetId:0,path:lt(d),sequenceNumber:s.highestListenSequenceNumber}))(u)))}).next(()=>v.waitFor(i))})}O_(e,t){e.createObjectStore(Jo,{keyPath:QR});const n=t.store(Jo),s=new Th,i=o=>{if(s.add(o)){const a=o.lastSegment(),u=o.popLast();return n.put({collectionId:a,parent:lt(u)})}};return t.store(qr).Hn({jn:!0},(o,a)=>{const u=new Be(o);return i(u.popLast())}).next(()=>t.store(di).Hn({jn:!0},([o,a,u],l)=>{const B=on(a);return i(B.popLast())}))}M_(e){const t=e.store(fi);return t.Hn((n,s)=>{const i=ho(this.serializer,s),o=S_(this.serializer,i);return t.put(o)})}N_(e,t){const n=t.store(qr),s=[];return n.Hn((i,o)=>{const a=t.store(vu),u=function(d){return d.document?new z(Be.fromString(d.document.name).popFirst(5)):d.noDocument?z.fromSegments(d.noDocument.path):d.unknownDocument?z.fromSegments(d.unknownDocument.path):Q(36783)}(o).path.toArray(),l={prefixPath:u.slice(0,u.length-2),collectionGroup:u[u.length-2],documentId:u[u.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(a.put(l))}).next(()=>v.waitFor(s))}L_(e,t){const n=t.store(Jt),s=M_(this.serializer),i=new Rh(wc.b_,this.serializer.$r);return n.Qn().next(o=>{const a=new Map;return o.forEach(u=>{let l=a.get(u.userId)??ce();Jr(this.serializer,u).keys().forEach(B=>l=l.add(B)),a.set(u.userId,l)}),v.forEach(a,(u,l)=>{const B=new ot(l),d=Ic.Qr(this.serializer,B),C=i.getIndexManager(B),g=Ec.Qr(B,this.serializer,C,i.referenceDelegate);return new G_(s,g,d,C).recalculateAndSaveOverlaysForDocumentKeys(new cB(t,yt.wn),u).next()})})}}function up(r){r.createObjectStore(Ci,{keyPath:zR}).createIndex(_h,$R,{unique:!0}),r.createObjectStore(fi,{keyPath:"targetId"}).createIndex(E_,JR,{unique:!0}),r.createObjectStore(ss)}const Zn="IndexedDbPersistence",Dl=18e5,wl=5e3,yl="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",Vb="main";class bh{constructor(e,t,n,s,i,o,a,u,l,B,d=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.Ct=i,this.window=o,this.document=a,this.B_=l,this.U_=B,this.k_=d,this.I_=null,this.R_=!1,this.isPrimary=!1,this.networkEnabled=!0,this.q_=null,this.inForeground=!1,this.K_=null,this.Q_=null,this.W_=Number.NEGATIVE_INFINITY,this.G_=C=>Promise.resolve(),!bh.Ye())throw new G(O.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new yb(this,s),this.z_=t+Vb,this.serializer=new v_(u),this.j_=new fr(this.z_,this.k_,new xb(this.serializer)),this.A_=new Cb,this.V_=new wb(this.referenceDelegate,this.serializer),this.remoteDocumentCache=M_(this.serializer),this.f_=new fb,this.window&&this.window.localStorage?this.H_=this.window.localStorage:(this.H_=null,B===!1&&Ge(Zn,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.J_().then(()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new G(O.FAILED_PRECONDITION,yl);return this.Y_(),this.Z_(),this.X_(),this.runTransaction("getHighestListenSequenceNumber","readonly",e=>this.V_.getHighestSequenceNumber(e))}).then(e=>{this.I_=new yt(e,this.B_)}).then(()=>{this.R_=!0}).catch(e=>(this.j_&&this.j_.close(),Promise.reject(e)))}eo(e){return this.G_=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.j_.Bn(async t=>{t.newVersion===null&&await e()})}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Ct.enqueueAndForget(async()=>{this.started&&await this.J_()}))}J_(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",e=>Qa(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next(()=>{if(this.isPrimary)return this.no(e).next(t=>{t||(this.isPrimary=!1,this.Ct.enqueueRetryable(()=>this.G_(!1)))})}).next(()=>this.ro(e)).next(t=>this.isPrimary&&!t?this.io(e).next(()=>!1):!!t&&this.so(e).next(()=>!0))).catch(e=>{if(vr(e))return U(Zn,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return U(Zn,"Releasing owner lease after error during lease refresh",e),!1}).then(e=>{this.isPrimary!==e&&this.Ct.enqueueRetryable(()=>this.G_(e)),this.isPrimary=e})}no(e){return io(e).get(Ms).next(t=>v.resolve(this._o(t)))}oo(e){return Qa(e).delete(this.clientId)}async ao(){if(this.isPrimary&&!this.uo(this.W_,Dl)){this.W_=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",t=>{const n=Qe(t,pi);return n.Qn().next(s=>{const i=this.co(s,Dl),o=s.filter(a=>i.indexOf(a)===-1);return v.forEach(o,a=>n.delete(a.clientId)).next(()=>o)})}).catch(()=>[]);if(this.H_)for(const t of e)this.H_.removeItem(this.lo(t.clientId))}}X_(){this.Q_=this.Ct.enqueueAfterDelay("client_metadata_refresh",4e3,()=>this.J_().then(()=>this.ao()).then(()=>this.X_()))}_o(e){return!!e&&e.ownerId===this.clientId}ro(e){return this.U_?v.resolve(!0):io(e).get(Ms).next(t=>{if(t!==null&&this.uo(t.leaseTimestampMs,wl)&&!this.Eo(t.ownerId)){if(this._o(t)&&this.networkEnabled)return!0;if(!this._o(t)){if(!t.allowTabSynchronization)throw new G(O.FAILED_PRECONDITION,yl);return!1}}return!(!this.networkEnabled||!this.inForeground)||Qa(e).Qn().next(n=>this.co(n,wl).find(s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,a=this.networkEnabled===s.networkEnabled;if(i||o&&a)return!0}return!1})===void 0)}).next(t=>(this.isPrimary!==t&&U(Zn,`Client ${t?"is":"is not"} eligible for a primary lease.`),t))}async shutdown(){this.R_=!1,this.ho(),this.Q_&&(this.Q_.cancel(),this.Q_=null),this.To(),this.Po(),await this.j_.runTransaction("shutdown","readwrite",[ha,pi],e=>{const t=new cB(e,yt.wn);return this.io(t).next(()=>this.oo(t))}),this.j_.close(),this.Io()}co(e,t){return e.filter(n=>this.uo(n.updateTimeMs,t)&&!this.Eo(n.clientId))}Ro(){return this.runTransaction("getActiveClients","readonly",e=>Qa(e).Qn().next(t=>this.co(t,Dl).map(n=>n.clientId)))}get started(){return this.R_}getGlobalsCache(){return this.A_}getMutationQueue(e,t){return Ec.Qr(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.V_}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new Db(e,this.serializer.$r.databaseId)}getDocumentOverlayCache(e){return Ic.Qr(this.serializer,e)}getBundleCache(){return this.f_}runTransaction(e,t,n){U(Zn,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=function(u){return u===18?Bb:u===17?R_:u===16?lb:u===15?Dh:u===14?A_:u===13?T_:u===12?cb:u===11?y_:void Q(60245)}(this.k_);let o;return this.j_.runTransaction(e,s,i,a=>(o=new cB(a,this.I_?this.I_.next():yt.wn),t==="readwrite-primary"?this.no(o).next(u=>!!u||this.ro(o)).next(u=>{if(!u)throw Ge(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Ct.enqueueRetryable(()=>this.G_(!1)),new G(O.FAILED_PRECONDITION,qm);return n(o)}).next(u=>this.so(o).next(()=>u)):this.Ao(o).next(()=>n(o)))).then(a=>(o.raiseOnCommittedEvent(),a))}Ao(e){return io(e).get(Ms).next(t=>{if(t!==null&&this.uo(t.leaseTimestampMs,wl)&&!this.Eo(t.ownerId)&&!this._o(t)&&!(this.U_||this.allowTabSynchronization&&t.allowTabSynchronization))throw new G(O.FAILED_PRECONDITION,yl)})}so(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return io(e).put(Ms,t)}static Ye(){return fr.Ye()}io(e){const t=io(e);return t.get(Ms).next(n=>this._o(n)?(U(Zn,"Releasing primary lease."),t.delete(Ms)):v.resolve())}uo(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(Ge(`Detected an update time that is in the future: ${e} > ${n}`),!1))}Y_(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.K_=()=>{this.Ct.enqueueAndForget(()=>(this.inForeground=this.document.visibilityState==="visible",this.J_()))},this.document.addEventListener("visibilitychange",this.K_),this.inForeground=this.document.visibilityState==="visible")}To(){this.K_&&(this.document.removeEventListener("visibilitychange",this.K_),this.K_=null)}Z_(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.q_=()=>{this.ho();const t=/(?:Version|Mobile)\/1[456]/;yg()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Ct.enterRestrictedMode(!0),this.Ct.enqueueAndForget(()=>this.shutdown())},this.window.addEventListener("pagehide",this.q_))}Po(){this.q_&&(this.window.removeEventListener("pagehide",this.q_),this.q_=null)}Eo(e){var t;try{const n=((t=this.H_)==null?void 0:t.getItem(this.lo(e)))!==null;return U(Zn,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return Ge(Zn,"Failed to get zombied client id.",n),!1}}ho(){if(this.H_)try{this.H_.setItem(this.lo(this.clientId),String(Date.now()))}catch(e){Ge("Failed to set zombie client id.",e)}}Io(){if(this.H_)try{this.H_.removeItem(this.lo(this.clientId))}catch{}}lo(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function io(r){return Qe(r,ha)}function Qa(r){return Qe(r,pi)}function U_(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vh{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Vo=n,this.fo=s}static mo(e,t){let n=ce(),s=ce();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new vh(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mb(r,e){return z.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gb{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class H_{constructor(){this.po=!1,this.yo=!1,this.wo=100,this.bo=function(){return yg()?8:Km($e())>0?6:4}()}initialize(e,t){this.So=e,this.indexManager=t,this.po=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.vo(e,t).next(o=>{i.result=o}).next(()=>{if(!i.result)return this.Do(e,t,s,n).next(o=>{i.result=o})}).next(()=>{if(i.result)return;const o=new Gb;return this.xo(e,t,o).next(a=>{if(i.result=a,this.yo)return this.Co(e,t,o,a.size)})}).next(()=>i.result)}Co(e,t,n,s){return Me(t)?v.resolve():n.documentReadCount<this.wo?($s()<=he.DEBUG&&U("QueryEngine","SDK will not create cache indexes for query:",go(t),"since it only creates cache indexes for collection contains","more than or equal to",this.wo,"documents"),v.resolve()):($s()<=he.DEBUG&&U("QueryEngine","Query:",go(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.bo*s?($s()<=he.DEBUG&&U("QueryEngine","The SDK decides to create cache indexes for query:",go(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,kt(t))):v.resolve())}vo(e,t){if(Me(t))return v.resolve(null);let n=t;if(wC(n))return v.resolve(null);let s=kt(n);return this.indexManager.getIndexType(e,s).next(i=>i===0?null:(n.limit!==null&&i===1&&(n=yu(n,null,"F"),s=kt(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next(o=>{const a=ce(...o);return this.So.getDocuments(e,a).next(u=>this.indexManager.getMinOffset(e,s).next(l=>{const B=this.Fo(n,u);return this.Oo(n,B,a,l.readTime)?this.vo(e,yu(n,null,"F")):this.Mo(e,B,n,l)}))})))}Do(e,t,n,s){return(Me(t)?function(o){for(const a of o.stages){if(a instanceof Dr||a instanceof GC)return!1;if(a instanceof ca){if(a.condition instanceof i_&&a.condition._expr.name==="exists"&&a.condition._expr.params[0]instanceof vs&&a.condition._expr.params[0].fieldName===nn)continue;return!1}}return!0}(t):wC(t))||s.isEqual(ee.min())?v.resolve(null):this.So.getDocuments(e,n).next(i=>{const o=this.Fo(t,i);return this.Oo(t,o,n,s)?v.resolve(null):($s()<=he.DEBUG&&U("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),UC(t)),this.Mo(e,o,t,pm(s,Bi)).next(a=>a))})}Fo(e,t){let n,s;return Me(e)?(n=new Ee(Mb),s=i=>Dc(e,i)):(n=new Ee(JB(e)),s=i=>oc(e,i)),t.forEach((i,o)=>{s(o)&&(n=n.add(o))}),n}Oo(e,t,n,s){if(Me(e))return function(a){return a.stages.some(u=>u instanceof Dr||u instanceof GC)}(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}xo(e,t,n){return $s()<=he.DEBUG&&U("QueryEngine","Using full collection scan to execute query:",UC(t)),this.So.getDocumentsMatchingQuery(e,t,xt.min(),n)}Mo(e,t,n,s){return this.So.getDocumentsMatchingQuery(e,n,s).next(i=>(t.forEach(o=>{i=i.insert(o.key,o)}),i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sh="LocalStore",Ub=3e8;class Hb{constructor(e,t,n,s){this.persistence=e,this.No=t,this.serializer=s,this.Lo=new Ae(oe),this.Bo=new Hn(i=>pc(i),ph),this.Uo=new Map,this.ko=e.getRemoteDocumentCache(),this.V_=e.getTargetCache(),this.f_=e.getBundleCache(),this.qo(n)}qo(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new G_(this.ko,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.ko.setIndexManager(this.indexManager),this.No.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Lo))}}function q_(r,e,t,n){return new Hb(r,e,t,n)}async function j_(r,e){const t=Y(r);return await t.persistence.runTransaction("Handle user change","readonly",n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next(i=>(s=i,t.qo(e),t.mutationQueue.getAllMutationBatches(n))).next(i=>{const o=[],a=[];let u=ce();for(const l of s){o.push(l.batchId);for(const B of l.mutations)u=u.add(B.key)}for(const l of i){a.push(l.batchId);for(const B of l.mutations)u=u.add(B.key)}return t.localDocuments.getDocuments(n,u).next(l=>({$o:l,removedBatchIds:o,addedBatchIds:a}))})})}function qb(r,e){const t=Y(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",n=>{const s=e.batch.keys(),i=t.ko.newChangeBuffer({trackRemovals:!0});return function(a,u,l,B){const d=l.batch,C=d.keys();let g=v.resolve();return C.forEach(D=>{g=g.next(()=>B.getEntry(u,D)).next(P=>{const x=l.docVersions.get(D);H(x!==null,48541),P.version.compareTo(x)<0&&(d.applyToRemoteDocument(P,l),P.isValidDocument()&&(P.setReadTime(l.commitVersion),B.addEntry(P)))})}),g.next(()=>a.mutationQueue.removeMutationBatch(u,d))}(t,n,e,i).next(()=>i.apply(n)).next(()=>t.mutationQueue.performConsistencyCheck(n)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,function(a){let u=ce();for(let l=0;l<a.mutationResults.length;++l)a.mutationResults[l].transformResults.length>0&&(u=u.add(a.batch.mutations[l].key));return u}(e))).next(()=>t.localDocuments.getDocuments(n,s))})}function K_(r){const e=Y(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.V_.getLastRemoteSnapshotVersion(t))}function jb(r,e){const t=Y(r),n=e.snapshotVersion;let s=t.Lo;return t.persistence.runTransaction("Apply remote event","readwrite-primary",i=>{const o=t.ko.newChangeBuffer({trackRemovals:!0});s=t.Lo;const a=[];e.targetChanges.forEach((B,d)=>{const C=s.get(d);if(!C)return;a.push(t.V_.removeMatchingKeys(i,B.removedDocuments,d).next(()=>t.V_.addMatchingKeys(i,B.addedDocuments,d)));let g=C.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(d)!==null?g=g.withResumeToken(Le.EMPTY_BYTE_STRING,ee.min()).withLastLimboFreeSnapshotVersion(ee.min()):B.resumeToken.approximateByteSize()>0&&(g=g.withResumeToken(B.resumeToken,n)),s=s.insert(d,g),function(P,x,J){return P.resumeToken.approximateByteSize()===0||x.snapshotVersion.toMicroseconds()-P.snapshotVersion.toMicroseconds()>=Ub?!0:J.addedDocuments.size+J.modifiedDocuments.size+J.removedDocuments.size>0}(C,g,B)&&a.push(t.V_.updateTargetData(i,g))});let u=Je(),l=ce();if(e.documentUpdates.forEach(B=>{e.resolvedLimboDocuments.has(B)&&a.push(t.persistence.referenceDelegate.updateLimboDocument(i,B))}),a.push(Kb(i,o,e.documentUpdates).next(B=>{u=B.Ko,l=B.Qo})),!n.isEqual(ee.min())){const B=t.V_.getLastRemoteSnapshotVersion(i).next(d=>t.V_.setTargetsMetadata(i,i.currentSequenceNumber,n));a.push(B)}return v.waitFor(a).next(()=>o.apply(i)).next(()=>t.localDocuments.getLocalViewOfDocuments(i,u,l)).next(()=>u)}).then(i=>(t.Lo=s,i))}function Kb(r,e,t){let n=ce(),s=ce();return t.forEach(i=>n=n.add(i)),e.getEntries(r,n).next(i=>{let o=Je();return t.forEach((a,u)=>{const l=i.get(a);u.isFoundDocument()!==l.isFoundDocument()&&(s=s.add(a)),u.isNoDocument()&&u.version.isEqual(ee.min())?(e.removeEntry(a,u.readTime),o=o.insert(a,u)):!l.isValidDocument()||u.version.compareTo(l.version)>0||u.version.compareTo(l.version)===0&&l.hasPendingWrites?(e.addEntry(u),o=o.insert(a,u)):U(Sh,"Ignoring outdated watch update for ",a,". Current version:",l.version," Watch version:",u.version)}),{Ko:o,Qo:s}})}function Jb(r,e){const t=Y(r);return t.persistence.runTransaction("Get next mutation batch","readonly",n=>(e===void 0&&(e=ts),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e)))}function ku(r,e){const t=Y(r);return t.persistence.runTransaction("Allocate target","readwrite",n=>{let s;return t.V_.getTargetData(n,e).next(i=>i?(s=i,v.resolve(s)):t.V_.allocateTargetId(n).next(o=>(s=new an(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.V_.addTargetData(n,s).next(()=>s))))}).then(n=>{const s=t.Lo.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Lo=t.Lo.insert(n.targetId,n),t.Bo.set(e,n.targetId)),n})}async function gi(r,e,t){const n=Y(r),s=n.Lo.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,o=>n.persistence.referenceDelegate.removeTarget(o,s))}catch(o){if(!vr(o))throw o;U(Sh,`Failed to update sequence numbers for target ${e}: ${o}`)}n.Lo=n.Lo.remove(e),n.Bo.delete(s.target)}function CB(r,e,t){const n=Y(r);let s=ee.min(),i=ce();return n.persistence.runTransaction("Execute query","readwrite",o=>function(u,l,B){const d=Y(u),C=d.Bo.get(B);return C!==void 0?v.resolve(d.Lo.get(C)):d.V_.getTargetData(l,B)}(n,o,Me(e)?e:kt(e)).next(a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,n.V_.getMatchingKeysForTargetId(o,a.targetId).next(u=>{i=u})}).next(()=>n.No.getDocumentsMatchingQuery(o,e,t?s:ee.min(),t?i:ce())).next(a=>(z_(n,a),{documents:a,Wo:i})))}function J_(r,e){const t=Y(r),n=Y(t.V_),s=t.Lo.get(e);return s?Promise.resolve(s.target??null):t.persistence.runTransaction("Get target data","readonly",i=>n.ye(i,e).next(o=>(o==null?void 0:o.target)??null))}function pB(r,e){const t=Y(r),n=t.Uo.get(e)||ee.min();return t.persistence.runTransaction("Get new document changes","readonly",s=>t.ko.getAllFromCollectionGroup(s,e,pm(n,Bi),Number.MAX_SAFE_INTEGER)).then(s=>(z_(t,s),s))}function z_(r,e){e.forEach((t,n)=>{const s=n.key.getCollectionGroup(),i=r.Uo.get(s)||ee.min();n.readTime.compareTo(i)>0&&r.Uo.set(s,n.readTime)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zb{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Yo=0,this.Zo=null,this.Xo=!0}ea(){this.Yo===0&&(this.ta("Unknown"),this.Zo=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.Zo=null,this.na("Backend didn't respond within 10 seconds."),this.ta("Offline"),Promise.resolve())))}ra(e){this.state==="Online"?this.ta("Unknown"):(this.Yo++,this.Yo>=1&&(this.ia(),this.na(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ta("Offline")))}set(e){this.ia(),this.Yo=0,e==="Online"&&(this.Xo=!1),this.ta(e)}ta(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}na(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Xo?(Ge(t),this.Xo=!1):U("OnlineStateTracker",t)}ia(){this.Zo!==null&&(this.Zo.cancel(),this.Zo=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cn="RemoteStore";class $b{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.sa=[],this._a=new Map,this.oa=new Map,this.aa=new Map,this.ua=new xn(1e3),this.ca=new xn(1001),this.la=new Set,this.Ea=[],this.ha=i,this.ha.Qe(o=>{n.enqueueAndForget(async()=>{Ps(this)&&(U(Cn,"Restarting streams for network reachability change."),await async function(u){const l=Y(u);l.la.add(4),await da(l),l.Ta.set("Unknown"),l.la.delete(4),await yc(l)}(this))})}),this.Ta=new zb(n,s)}}async function yc(r){if(Ps(r))for(const e of r.Ea)await e(!0)}async function da(r){for(const e of r.Ea)await e(!1)}function gB(r,e){return r.oa.get(e)||void 0}function Tc(r,e){const t=Y(r),n=gB(t,e.targetId);if(n!==void 0&&t._a.has(n))return;const s=function(a,u){const l=gB(a,u);l!==void 0&&a.aa.delete(l);const B=function(C,g){return g%2!=0?C.ca.next():C.ua.next()}(a,u);return a.oa.set(u,B),a.aa.set(B,u),B}(t,e.targetId);U(Cn,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);const i=new an(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t._a.set(s,i),Oh(t)?Nh(t):Oi(t).Yt()&&Ph(t,i)}function mi(r,e){const t=Y(r),n=Oi(t),s=gB(t,e);U(Cn,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t._a.delete(s),t.oa.delete(e),t.aa.delete(s),n.Yt()&&$_(t,s),t._a.size===0&&(n.Yt()?n.en():Ps(t)&&t.Ta.set("Unknown"))}function Ph(r,e){if(r.Pa.J(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(ee.min())>0){const t=r.aa.get(e.targetId);if(t===void 0)return void U(Cn,"SDK target ID not found for remote ID: "+e.targetId);const n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}Oi(r).Pn(e)}function $_(r,e){r.Pa.J(e),Oi(r).In(e)}function Nh(r){r.Pa=new yT({getRemoteKeysForTarget:e=>{const t=r.aa.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):ce()},ye:e=>r._a.get(e)||null,Ve:()=>r.datastore.serializer.databaseId}),Oi(r).start(),r.Ta.ea()}function Oh(r){return Ps(r)&&!Oi(r).Jt()&&r._a.size>0}function Ps(r){return Y(r).la.size===0}function Q_(r){r.Pa=void 0}async function Qb(r){r.Ta.set("Online")}async function Wb(r){r._a.forEach((e,t)=>{Ph(r,e)})}async function Yb(r,e){Q_(r),Oh(r)?(r.Ta.ra(e),Nh(r)):r.Ta.set("Unknown")}async function Xb(r,e,t){if(r.Ta.set("Online"),e instanceof Tm&&e.state===2&&e.cause)try{await async function(s,i){const o=i.cause;for(const a of i.targetIds){if(s._a.has(a)){const u=s.aa.get(a);u!==void 0&&(await s.remoteSyncer.rejectListen(u,o),s.oa.delete(u),s.aa.delete(a)),s._a.delete(a)}s.Pa.removeTarget(a)}}(r,e)}catch(n){U(Cn,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Lu(r,n)}else if(e instanceof su?r.Pa._e(e):e instanceof ym?r.Pa.he(e):r.Pa.ue(e),!t.isEqual(ee.min()))try{const n=await K_(r.localStore);t.compareTo(n)>=0&&await function(i,o){const a=i.Pa.fe(o);a.targetChanges.forEach((l,B)=>{if(l.resumeToken.approximateByteSize()>0){const d=i._a.get(B);d&&i._a.set(B,d.withResumeToken(l.resumeToken,o))}}),a.targetMismatches.forEach((l,B)=>{const d=i._a.get(l);if(!d)return;i._a.set(l,d.withResumeToken(Le.EMPTY_BYTE_STRING,d.snapshotVersion)),$_(i,l);const C=new an(d.target,l,B,d.sequenceNumber);Ph(i,C)});const u=function(B,d){const C=new Map;d.targetChanges.forEach((D,P)=>{const x=B.aa.get(P);x!==void 0&&C.set(x,D)});let g=new Ae(oe);return d.targetMismatches.forEach((D,P)=>{const x=B.aa.get(D);x!==void 0&&(g=g.insert(x,P))}),new Ri(d.snapshotVersion,C,g,d.documentUpdates,d.augmentedDocumentUpdates,d.resolvedLimboDocuments)}(i,a);return i.remoteSyncer.applyRemoteEvent(u)}(r,t)}catch(n){U(Cn,"Failed to raise snapshot:",n),await Lu(r,n)}}async function Lu(r,e,t){if(!vr(e))throw e;r.la.add(1),await da(r),r.Ta.set("Offline"),t||(t=()=>K_(r.localStore)),r.asyncQueue.enqueueRetryable(async()=>{U(Cn,"Retrying IndexedDB access"),await t(),r.la.delete(1),await yc(r)})}function W_(r,e){return e().catch(t=>Lu(r,t,e))}async function Ni(r){const e=Y(r),t=yr(e);let n=e.sa.length>0?e.sa[e.sa.length-1].batchId:ts;for(;Zb(e);)try{const s=await Jb(e.localStore,n);if(s===null){e.sa.length===0&&t.en();break}n=s.batchId,ev(e,s)}catch(s){await Lu(e,s)}Y_(e)&&X_(e)}function Zb(r){return Ps(r)&&r.sa.length<10}function ev(r,e){r.sa.push(e);const t=yr(r);t.Yt()&&t.Rn&&t.An(e.mutations)}function Y_(r){return Ps(r)&&!yr(r).Jt()&&r.sa.length>0}function X_(r){yr(r).start()}async function tv(r){yr(r).fn()}async function nv(r){const e=yr(r);for(const t of r.sa)e.An(t.mutations)}async function rv(r,e,t){const n=r.sa.shift(),s=mh.from(n,e,t);await W_(r,()=>r.remoteSyncer.applySuccessfulWrite(s)),await Ni(r)}async function sv(r,e){e&&yr(r).Rn&&await async function(n,s){if(function(o){return _m(o)&&o!==O.ABORTED}(s.code)){const i=n.sa.shift();yr(n).Xt(),await W_(n,()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s)),await Ni(n)}}(r,e),Y_(r)&&X_(r)}async function cp(r,e){const t=Y(r);t.asyncQueue.verifyOperationInProgress(),U(Cn,"RemoteStore received new credentials");const n=Ps(t);t.la.add(3),await da(t),n&&t.Ta.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.la.delete(3),await yc(t)}async function mB(r,e){const t=Y(r);e?(t.la.delete(2),await yc(t)):e||(t.la.add(2),await da(t),t.Ta.set("Unknown"))}function Oi(r){return r.Ia||(r.Ia=function(t,n,s){const i=Y(t);return i.pn(),new WT(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ct:Qb.bind(null,r),Et:Wb.bind(null,r),Tt:Yb.bind(null,r),Tn:Xb.bind(null,r)}),r.Ea.push(async e=>{e?(r.Ia.Xt(),Oh(r)?Nh(r):r.Ta.set("Unknown")):(await r.Ia.stop(),Q_(r))})),r.Ia}function yr(r){return r.Ra||(r.Ra=function(t,n,s){const i=Y(t);return i.pn(),new YT(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ct:()=>Promise.resolve(),Et:tv.bind(null,r),Tt:sv.bind(null,r),Vn:nv.bind(null,r),dn:rv.bind(null,r)}),r.Ea.push(async e=>{e?(r.Ra.Xt(),await Ni(r)):(await r.Ra.stop(),r.sa.length>0&&(U(Cn,`Stopping write stream with ${r.sa.length} pending writes`),r.sa=[]))})),r.Ra}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fh{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Aa(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Aa(this.observer.error,e):Ge("Uncaught Error in snapshot listener:",e.toString()))}Va(){this.muted=!0}Aa(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kh{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Ut,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,a=new kh(e,t,o,s,i);return a.start(n),a}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new G(O.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function Ac(r,e){if(Ge("AsyncQueue",`${e}: ${r}`),vr(r))return new G(O.UNAVAILABLE,`${e}: ${r}`);throw r}const yo="IndexBackfiller";class iv{constructor(e,t){this.asyncQueue=e,this.Da=t,this.task=null}start(){this.xa(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}xa(e){U(yo,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,async()=>{this.task=null;try{const t=await this.Da.Ca();U(yo,`Documents written: ${t}`)}catch(t){vr(t)?U(yo,"Ignoring IndexedDB error during index backfill: ",t):await br(t)}await this.xa(6e4)})}}class ov{constructor(e,t){this.localStore=e,this.persistence=t}async Ca(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",t=>this.Fa(t,e))}Fa(e,t){const n=new Set;let s=t,i=!0;return v.doWhile(()=>i===!0&&s>0,()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next(o=>{if(o!==null&&!n.has(o))return U(yo,`Processing collection: ${o}`),this.Oa(e,o,s).next(a=>{s-=a,n.add(o)});i=!1})).next(()=>t-s)}Oa(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next(s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next(i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next(()=>this.Ma(s,i)).next(a=>(U(yo,`Updating offset: ${a}`),this.localStore.indexManager.updateCollectionGroup(e,t,a))).next(()=>o.size)}))}Ma(e,t){let n=e;return t.changes.forEach((s,i)=>{const o=gm(i);HB(o,n)>0&&(n=o)}),new xt(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Z_="firestore_clients";function lp(r,e){return`${Z_}_${r}_${e}`}const eE="firestore_mutations";function Bp(r,e,t){let n=`${eE}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const tE="firestore_targets";function Tl(r,e){return`${tE}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tn="SharedClientState";class xu{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static Na(e,t,n){const s=JSON.parse(n);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new G(s.error.code,s.error.message))),o?new xu(e,t,s.state,i):(Ge(tn,`Failed to parse mutation state for ID '${t}': ${n}`),null)}La(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class To{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Na(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new G(n.error.code,n.error.message))),i?new To(e,n.state,s):(Ge(tn,`Failed to parse target state for ID '${e}': ${t}`),null)}La(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Vu{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Na(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=zB();for(let o=0;s&&o<n.activeTargetIds.length;++o)s=Xg(n.activeTargetIds[o]),i=i.add(n.activeTargetIds[o]);return s?new Vu(e,i):(Ge(tn,`Failed to parse client data for instance '${e}': ${t}`),null)}}class Lh{constructor(e,t){this.clientId=e,this.onlineState=t}static Na(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new Lh(t.clientId,t.onlineState):(Ge(tn,`Failed to parse online state: ${e}`),null)}}class _B{constructor(){this.activeTargetIds=zB()}Ba(e){this.activeTargetIds=this.activeTargetIds.add(e)}Ua(e){this.activeTargetIds=this.activeTargetIds.delete(e)}La(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Al{constructor(e,t,n,s,i){this.window=e,this.Ct=t,this.persistenceKey=n,this.ka=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.qa=this.$a.bind(this),this.Ka=new Ae(oe),this.started=!1,this.Qa=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Wa=lp(this.persistenceKey,this.ka),this.Ga=function(u){return`firestore_sequence_number_${u}`}(this.persistenceKey),this.Ka=this.Ka.insert(this.ka,new _B),this.za=new RegExp(`^${Z_}_${o}_([^_]*)$`),this.ja=new RegExp(`^${eE}_${o}_(\\d+)(?:_(.*))?$`),this.Ha=new RegExp(`^${tE}_${o}_(\\d+)$`),this.Ja=function(u){return`firestore_online_state_${u}`}(this.persistenceKey),this.Ya=function(u){return`firestore_bundle_loaded_v2_${u}`}(this.persistenceKey),this.window.addEventListener("storage",this.qa)}static Ye(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ro();for(const n of e){if(n===this.ka)continue;const s=this.getItem(lp(this.persistenceKey,n));if(s){const i=Vu.Na(n,s);i&&(this.Ka=this.Ka.insert(i.clientId,i))}}this.Za();const t=this.storage.getItem(this.Ja);if(t){const n=this.Xa(t);n&&this.eu(n)}for(const n of this.Qa)this.$a(n);this.Qa=[],this.window.addEventListener("pagehide",()=>this.shutdown()),this.started=!0}writeSequenceNumber(e){this.setItem(this.Ga,JSON.stringify(e))}getAllActiveQueryTargets(){return this.tu(this.Ka)}isActiveQueryTarget(e){let t=!1;return this.Ka.forEach((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)}),t}addPendingMutation(e){this.nu(e,"pending")}updateMutationState(e,t,n){this.nu(e,t,n),this.ru(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(Tl(this.persistenceKey,e));if(s){const i=To.Na(e,s);i&&(n=i.state)}}return t&&this.iu.Ba(e),this.Za(),n}removeLocalQueryTarget(e){this.iu.Ua(e),this.Za()}isLocalQueryTarget(e){return this.iu.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(Tl(this.persistenceKey,e))}updateQueryState(e,t,n){this.su(e,t,n)}handleUserChange(e,t,n){t.forEach(s=>{this.ru(s)}),this.currentUser=e,n.forEach(s=>{this.addPendingMutation(s)})}setOnlineState(e){this._u(e)}notifyBundleLoaded(e){this.ou(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.qa),this.removeItem(this.Wa),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return U(tn,"READ",e,t),t}setItem(e,t){U(tn,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){U(tn,"REMOVE",e),this.storage.removeItem(e)}$a(e){const t=e;if(t.storageArea===this.storage){if(U(tn,"EVENT",t.key,t.newValue),t.key===this.Wa)return void Ge("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Ct.enqueueRetryable(async()=>{if(this.started){if(t.key!==null){if(this.za.test(t.key)){if(t.newValue==null){const n=this.au(t.key);return this.uu(n,null)}{const n=this.cu(t.key,t.newValue);if(n)return this.uu(n.clientId,n)}}else if(this.ja.test(t.key)){if(t.newValue!==null){const n=this.lu(t.key,t.newValue);if(n)return this.Eu(n)}}else if(this.Ha.test(t.key)){if(t.newValue!==null){const n=this.hu(t.key,t.newValue);if(n)return this.Tu(n)}}else if(t.key===this.Ja){if(t.newValue!==null){const n=this.Xa(t.newValue);if(n)return this.eu(n)}}else if(t.key===this.Ga){const n=function(i){let o=yt.wn;if(i!=null)try{const a=JSON.parse(i);H(typeof a=="number",30636,{Pu:i}),o=a}catch(a){Ge(tn,"Failed to read sequence number from WebStorage",a)}return o}(t.newValue);n!==yt.wn&&this.sequenceNumberHandler(n)}else if(t.key===this.Ya){const n=this.Iu(t.newValue);await Promise.all(n.map(s=>this.syncEngine.Ru(s)))}}}else this.Qa.push(t)})}}get iu(){return this.Ka.get(this.ka)}Za(){this.setItem(this.Wa,this.iu.La())}nu(e,t,n){const s=new xu(this.currentUser,e,t,n),i=Bp(this.persistenceKey,this.currentUser,e);this.setItem(i,s.La())}ru(e){const t=Bp(this.persistenceKey,this.currentUser,e);this.removeItem(t)}_u(e){const t={clientId:this.ka,onlineState:e};this.storage.setItem(this.Ja,JSON.stringify(t))}su(e,t,n){const s=Tl(this.persistenceKey,e),i=new To(e,t,n);this.setItem(s,i.La())}ou(e){const t=JSON.stringify(Array.from(e));this.setItem(this.Ya,t)}au(e){const t=this.za.exec(e);return t?t[1]:null}cu(e,t){const n=this.au(e);return Vu.Na(n,t)}lu(e,t){const n=this.ja.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return xu.Na(new ot(i),s,t)}hu(e,t){const n=this.Ha.exec(e),s=Number(n[1]);return To.Na(s,t)}Xa(e){return Lh.Na(e)}Iu(e){return JSON.parse(e)}async Eu(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Au(e.batchId,e.state,e.error);U(tn,`Ignoring mutation for non-active user ${e.user.uid}`)}Tu(e){return this.syncEngine.Vu(e.targetId,e.state,e.error)}uu(e,t){const n=t?this.Ka.insert(e,t):this.Ka.remove(e),s=this.tu(this.Ka),i=this.tu(n),o=[],a=[];return i.forEach(u=>{s.has(u)||o.push(u)}),s.forEach(u=>{i.has(u)||a.push(u)}),this.syncEngine.du(o,a).then(()=>{this.Ka=n})}eu(e){this.Ka.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}tu(e){let t=zB();return e.forEach((n,s)=>{t=t.unionWith(s.activeTargetIds)}),t}}class nE{constructor(){this.fu=new _B,this.mu={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.fu.Ba(e),this.mu[e]||"not-current"}updateQueryState(e,t,n){this.mu[e]=t}removeLocalQueryTarget(e){this.fu.Ua(e)}isLocalQueryTarget(e){return this.fu.activeTargetIds.has(e)}clearQueryState(e){delete this.mu[e]}getAllActiveQueryTargets(){return this.fu.activeTargetIds}isActiveQueryTarget(e){return this.fu.activeTargetIds.has(e)}start(){return this.fu=new _B,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rE(){return typeof window<"u"?window:null}function lu(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class is{static emptySet(e){return new is(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||z.comparator(t.key,n.key):(t,n)=>z.comparator(t.key,n.key),this.keyedMap=jr(),this.sortedSet=new Ae(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof is)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new is;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hp{constructor(){this.pu=new Ae(z.comparator)}track(e){const t=e.doc.key,n=this.pu.get(t);n?e.type!==0&&n.type===3?this.pu=this.pu.insert(t,e):e.type===3&&n.type!==1?this.pu=this.pu.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.pu=this.pu.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.pu=this.pu.remove(t):e.type===1&&n.type===2?this.pu=this.pu.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):Q(63341,{we:e,gu:n}):this.pu=this.pu.insert(t,e)}yu(){const e=[];return this.pu.inorderTraversal((t,n)=>{e.push(n)}),e}}class _i{constructor(e,t,n,s,i,o,a,u,l){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=u,this.hasCachedResults=l}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach(a=>{o.push({type:0,doc:a})}),new _i(e,t,is.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Cc(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class av{constructor(){this.wu=void 0,this.bu=[]}Su(){return this.bu.some(e=>e.vu())}}class uv{constructor(){this.queries=dp(),this.onlineState="Unknown",this.Du=new Set}terminate(){(function(t,n){const s=Y(t),i=s.queries;s.queries=dp(),i.forEach((o,a)=>{for(const u of a.bu)u.onError(n)})})(this,new G(O.ABORTED,"Firestore shutting down"))}}function dp(){return new Hn(r=>g_(r),Cc)}async function xh(r,e){const t=Y(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.Su()&&e.vu()&&(n=2):(i=new av,n=e.vu()?0:1);try{switch(n){case 0:i.wu=await t.onListen(s,!0);break;case 1:i.wu=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const a=Ac(o,`Initialization of query '${Me(e.query)?Rn(e.query):go(e.query)}' failed`);return void e.onError(a)}t.queries.set(s,i),i.bu.push(e),e.xu(t.onlineState),i.wu&&e.Cu(i.wu)&&Mh(t)}async function Vh(r,e){const t=Y(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.bu.indexOf(e);o>=0&&(i.bu.splice(o,1),i.bu.length===0?s=e.vu()?0:1:!i.Su()&&e.vu()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function cv(r,e){const t=Y(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const a of o.bu)a.Cu(s)&&(n=!0);o.wu=s}}n&&Mh(t)}function lv(r,e,t){const n=Y(r),s=n.queries.get(e);if(s)for(const i of s.bu)i.onError(t);n.queries.delete(e)}function Mh(r){r.Du.forEach(e=>{e.next()})}var EB;(function(r){r.Default="default",r.Cache="cache"})(EB||(EB={}));class Gh{constructor(e,t,n){this.query=e,this.Fu=t,this.Ou=!1,this.Mu=null,this.onlineState="Unknown",this.options=n||{}}Cu(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new _i(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Ou?this.Nu(e)&&(this.Fu.next(e),t=!0):this.Lu(e,this.onlineState)&&(this.Bu(e),t=!0),this.Mu=e,t}onError(e){this.Fu.error(e)}xu(e){this.onlineState=e;let t=!1;return this.Mu&&!this.Ou&&this.Lu(this.Mu,e)&&(this.Bu(this.Mu),t=!0),t}Lu(e,t){if(!e.fromCache||!this.vu())return!0;const n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Nu(e){if(e.docChanges.length>0)return!0;const t=this.Mu&&this.Mu.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}Bu(e){e=_i.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Ou=!0,this.Fu.next(e)}vu(){return this.options.source!==EB.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sE{constructor(e){this.key=e}}class iE{constructor(e){this.key=e}}class Bv{constructor(e,t){this.query=e,this.zu=t,this.ju=null,this.hasCachedResults=!1,this.current=!1,this.Hu=ce(),this.mutatedKeys=ce(),this.Ju=Me(e)?fB(e):JB(e),this.Yu=new is(this.Ju)}get Zu(){return this.zu}Xu(e,t){const n=t?t.ec:new hp,s=t?t.Yu:this.Yu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,a=!1;const[u,l]=this.tc(this.query,s);e.inorderTraversal((d,C)=>{const g=s.get(d),D=x_(this.query,C)?C:null,P=!!g&&this.mutatedKeys.has(g.key),x=!!D&&(D.hasLocalMutations||this.mutatedKeys.has(D.key)&&D.hasCommittedMutations);let J=!1;g&&D?g.data.isEqual(D.data)?P!==x&&(n.track({type:3,doc:D}),J=!0):this.nc(g,D)||(n.track({type:2,doc:D}),J=!0,(u&&this.Ju(D,u)>0||l&&this.Ju(D,l)<0)&&(a=!0)):!g&&D?(n.track({type:0,doc:D}),J=!0):g&&!D&&(n.track({type:1,doc:g}),J=!0,(u||l)&&(a=!0)),J&&(D?(o=o.add(D),i=x?i.add(d):i.delete(d)):(o=o.delete(d),i=i.delete(d)))});const B=this.rc(this.query);if(B)if(Me(this.query)){const d=[];o.forEach(D=>d.push(D));const C=L_(this.query,d);let g=new is(fB(this.query));for(const D of C)g=g.add(D);o.forEach(D=>{g.has(D.key)||(i=i.delete(D.key),n.track({type:1,doc:D}))}),o=g}else{const d=this.sc(this.query);for(;o.size>B;){const C=d==="F"?o.last():o.first();o=o.delete(C.key),i=i.delete(C.key),n.track({type:1,doc:C})}}return{Yu:o,ec:n,Oo:a,mutatedKeys:i}}rc(e){var t;return Me(e)?(t=Il(e))==null?void 0:t.limit:e.limit||void 0}sc(e){if(Me(e)){const t=Il(e);return t&&t.limit<0?"L":"F"}return e.limitType}tc(e,t){var n;if(Me(e)){const s=(n=Il(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.rc(this.query)?t.last():null,e.limitType==="L"&&t.size===this.rc(this.query)?t.first():null]}nc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.Yu;this.Yu=e.Yu,this.mutatedKeys=e.mutatedKeys;const o=e.ec.yu();o.sort((B,d)=>function(g,D){const P=x=>{switch(x){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return Q(20277,{we:x})}};return P(g)-P(D)}(B.type,d.type)||this.Ju(B.doc,d.doc)),this._c(n),s=s??!1;const a=t&&!s?this.oc():[],u=this.Hu.size===0&&this.current&&!s?1:0,l=u!==this.ju;return this.ju=u,o.length!==0||l?{snapshot:new _i(this.query,e.Yu,i,o,e.mutatedKeys,u===0,l,!1,!!n&&n.resumeToken.approximateByteSize()>0),ac:a}:{ac:a}}xu(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Yu:this.Yu,ec:new hp,mutatedKeys:this.mutatedKeys,Oo:!1},!1)):{ac:[]}}uc(e){return!this.zu.has(e)&&!!this.Yu.has(e)&&!this.Yu.get(e).hasLocalMutations}_c(e){e&&(e.addedDocuments.forEach(t=>this.zu=this.zu.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.zu=this.zu.delete(t)),this.current=e.current)}oc(){if(!this.current)return[];const e=this.Hu;this.Hu=ce(),this.Yu.forEach(n=>{this.uc(n.key)&&(this.Hu=this.Hu.add(n.key))});const t=[];return e.forEach(n=>{this.Hu.has(n)||t.push(new iE(n))}),this.Hu.forEach(n=>{e.has(n)||t.push(new sE(n))}),t}cc(e){this.zu=e.Wo,this.Hu=ce();const t=this.Xu(e.documents);return this.applyChanges(t,!0)}lc(){return _i.fromInitialDocuments(this.query,this.Yu,this.mutatedKeys,this.ju===0,this.hasCachedResults)}}const Fi="SyncEngine";class hv{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class dv{constructor(e){this.key=e,this.Ec=!1}}class fv{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.hc={},this.Tc=new Hn(a=>g_(a),Cc),this.Pc=new Map,this.Ic=new Set,this.Rc=new Ae(z.comparator),this.Ac=new Map,this.Vc=new Ah,this.dc={},this.fc=new Map,this.mc=xn.bs(),this.onlineState="Unknown",this.gc=void 0}get isPrimaryClient(){return this.gc===!0}}async function Cv(r,e,t=!0){const n=Rc(r);let s;const i=n.Tc.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lc()):s=await oE(n,e,t,!0),s}async function pv(r,e){const t=Rc(r);await oE(t,e,!0,!1)}async function oE(r,e,t,n){const s=await ku(r.localStore,Me(e)?e:kt(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let a;return n&&(a=await Uh(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&Tc(r.remoteStore,s),a}async function Uh(r,e,t,n,s){r.yc=(d,C,g)=>async function(P,x,J,X){let Z=x.view.Xu(J);Z.Oo&&(Z=await CB(P.localStore,x.query,!1).then(({documents:y})=>x.view.Xu(y,Z)));const se=X&&X.targetChanges.get(x.targetId),ue=X&&X.targetMismatches.get(x.targetId)!=null,ae=x.view.applyChanges(Z,P.isPrimaryClient,se,ue);return IB(P,x.targetId,ae.ac),ae.snapshot}(r,d,C,g);const i=await CB(r.localStore,e,!0),o=new Bv(e,i.Wo),a=o.Xu(i.documents),u=oa.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),l=o.applyChanges(a,r.isPrimaryClient,u);IB(r,t,l.ac);const B=new hv(e,t,o);return r.Tc.set(e,B),r.Pc.has(t)?r.Pc.get(t).push(e):r.Pc.set(t,[e]),l.snapshot}async function gv(r,e,t){const n=Y(r),s=n.Tc.get(e),i=n.Pc.get(s.targetId);if(i.length>1)return n.Pc.set(s.targetId,i.filter(o=>!Cc(o,e))),void n.Tc.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await gi(n.localStore,s.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(s.targetId),t&&mi(n.remoteStore,s.targetId),Ei(n,s.targetId)}).catch(br)):(Ei(n,s.targetId),await gi(n.localStore,s.targetId,!0))}async function mv(r,e){const t=Y(r),n=t.Tc.get(e),s=t.Pc.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),mi(t.remoteStore,n.targetId))}async function _v(r,e,t){const n=Kh(r);try{const s=await function(o,a){const u=Y(o),l=_e.now(),B=a.reduce((g,D)=>g.add(D.key),ce());let d,C;return u.persistence.runTransaction("Locally write mutations","readwrite",g=>{let D=Je(),P=ce();return u.ko.getEntries(g,B).next(x=>{D=x,D.forEach((J,X)=>{X.isValidDocument()||(P=P.add(J))})}).next(()=>u.localDocuments.getOverlayedDocuments(g,D)).next(x=>{d=x;const J=[];for(const X of a){const Z=nT(X,d.get(X.key).overlayedDocument);Z!=null&&J.push(new Un(X.key,Z,nm(Z.value.mapValue),ke.exists(!0)))}return u.mutationQueue.addMutationBatch(g,l,J,a)}).next(x=>{C=x;const J=x.applyToLocalDocumentSet(d,P);return u.documentOverlayCache.saveOverlays(g,x.batchId,J)})}).then(()=>({batchId:C.batchId,changes:Dm(d)}))}(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),function(o,a,u){let l=o.dc[o.currentUser.toKey()];l||(l=new Ae(oe)),l=l.insert(a,u),o.dc[o.currentUser.toKey()]=l}(n,s.batchId,t),await Sr(n,s.changes),await Ni(n.remoteStore)}catch(s){const i=Ac(s,"Failed to persist write");t.reject(i)}}async function aE(r,e){const t=Y(r);try{const n=await jb(t.localStore,e);e.targetChanges.forEach((s,i)=>{const o=t.Ac.get(i);o&&(H(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.Ec=!0:s.modifiedDocuments.size>0?H(o.Ec,14607):s.removedDocuments.size>0&&(H(o.Ec,42227),o.Ec=!1))}),await Sr(t,n,e)}catch(n){await br(n)}}function fp(r,e,t){const n=Y(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.Tc.forEach((i,o)=>{const a=o.view.xu(e);a.snapshot&&s.push(a.snapshot)}),function(o,a){const u=Y(o);u.onlineState=a;let l=!1;u.queries.forEach((B,d)=>{for(const C of d.bu)C.xu(a)&&(l=!0)}),l&&Mh(u)}(n.eventManager,e),s.length&&n.hc.Tn(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function Ev(r,e,t){const n=Y(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Ac.get(e),i=s&&s.key;if(i){let o=new Ae(z.comparator);o=o.insert(i,Fe.newNoDocument(i,ee.min()));const a=ce().add(i),u=new Ri(ee.min(),new Map,new Ae(oe),o,Je(),a);await aE(n,u),n.Rc=n.Rc.remove(i),n.Ac.delete(e),jh(n)}else await gi(n.localStore,e,!1).then(()=>Ei(n,e,t)).catch(br)}async function Iv(r,e){const t=Y(r),n=e.batch.batchId;try{const s=await qb(t.localStore,e);qh(t,n,null),Hh(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await Sr(t,s)}catch(s){await br(s)}}async function Dv(r,e,t){const n=Y(r);try{const s=await function(o,a){const u=Y(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",l=>{let B;return u.mutationQueue.lookupMutationBatch(l,a).next(d=>(H(d!==null,37113),B=d.keys(),u.mutationQueue.removeMutationBatch(l,d))).next(()=>u.mutationQueue.performConsistencyCheck(l)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(l,B,a)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(l,B)).next(()=>u.localDocuments.getDocuments(l,B))})}(n.localStore,e);qh(n,e,t),Hh(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await Sr(n,s)}catch(s){await br(s)}}function Hh(r,e){(r.fc.get(e)||[]).forEach(t=>{t.resolve()}),r.fc.delete(e)}function qh(r,e,t){const n=Y(r);let s=n.dc[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.dc[n.currentUser.toKey()]=s}}function Ei(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Pc.get(e))r.Tc.delete(n),t&&r.hc.wc(n,t);r.Pc.delete(e),r.isPrimaryClient&&r.Vc.e_(e).forEach(n=>{r.Vc.containsKey(n)||uE(r,n)})}function uE(r,e){r.Ic.delete(e.path.canonicalString());const t=r.Rc.get(e);t!==null&&(mi(r.remoteStore,t),r.Rc=r.Rc.remove(e),r.Ac.delete(t),jh(r))}function IB(r,e,t){for(const n of t)n instanceof sE?(r.Vc.addReference(n.key,e),wv(r,n)):n instanceof iE?(U(Fi,"Document no longer in limbo: "+n.key),r.Vc.removeReference(n.key,e),r.Vc.containsKey(n.key)||uE(r,n.key)):Q(19791,{bc:n})}function wv(r,e){const t=e.key,n=t.path.canonicalString();r.Rc.get(t)||r.Ic.has(n)||(U(Fi,"New document in limbo: "+t),r.Ic.add(n),jh(r))}function jh(r){for(;r.Ic.size>0&&r.Rc.size<r.maxConcurrentLimboResolutions;){const e=r.Ic.values().next().value;r.Ic.delete(e);const t=new z(Be.fromString(e)),n=r.mc.next();r.Ac.set(n,new dv(t)),r.Rc=r.Rc.insert(t,n),Tc(r.remoteStore,new an(kt(ia(t.path)),n,"TargetPurposeLimboResolution",yt.wn))}}async function Sr(r,e,t){const n=Y(r),s=[],i=[],o=[];n.Tc.isEmpty()||(n.Tc.forEach((a,u)=>{o.push(n.yc(u,e,t).then(l=>{var B;if((l||t)&&n.isPrimaryClient){const d=l?!l.fromCache:(B=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:B.current;n.sharedClientState.updateQueryState(u.targetId,d?"current":"not-current")}if(l){s.push(l);const d=vh.mo(u.targetId,l);i.push(d)}}))}),await Promise.all(o),n.hc.Tn(s),await async function(u,l){const B=Y(u);try{await B.persistence.runTransaction("notifyLocalViewChanges","readwrite",d=>v.forEach(l,C=>v.forEach(C.Vo,g=>B.persistence.referenceDelegate.addReference(d,C.targetId,g)).next(()=>v.forEach(C.fo,g=>B.persistence.referenceDelegate.removeReference(d,C.targetId,g)))))}catch(d){if(!vr(d))throw d;U(Sh,"Failed to update sequence numbers: "+d)}for(const d of l){const C=d.targetId;if(!d.fromCache){const g=B.Lo.get(C),D=g.snapshotVersion,P=g.withLastLimboFreeSnapshotVersion(D);B.Lo=B.Lo.insert(C,P)}}}(n.localStore,i))}async function yv(r,e){const t=Y(r);if(!t.currentUser.isEqual(e)){U(Fi,"User change. New user:",e.toKey());const n=await j_(t.localStore,e);t.currentUser=e,function(i,o){i.fc.forEach(a=>{a.forEach(u=>{u.reject(new G(O.CANCELLED,o))})}),i.fc.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await Sr(t,n.$o)}}function Tv(r,e){const t=Y(r),n=t.Ac.get(e);if(n&&n.Ec)return ce().add(n.key);{let s=ce();const i=t.Pc.get(e);if(!i)return s;for(const o of i??[]){const a=t.Tc.get(o);s=s.unionWith(a.view.Zu)}return s}}async function Av(r,e){const t=Y(r),n=await CB(t.localStore,e.query,!0),s=e.view.cc(n);return t.isPrimaryClient&&IB(t,e.targetId,s.ac),s}async function Rv(r,e){const t=Y(r);return pB(t.localStore,e).then(n=>Sr(t,n))}async function bv(r,e,t,n){const s=Y(r),i=await function(a,u){const l=Y(a),B=Y(l.mutationQueue);return l.persistence.runTransaction("Lookup mutation documents","readonly",d=>B.Wr(d,u).next(C=>C?l.localDocuments.getDocuments(d,C):v.resolve(null)))}(s.localStore,e);i!==null?(t==="pending"?await Ni(s.remoteStore):t==="acknowledged"||t==="rejected"?(qh(s,e,n||null),Hh(s,e),function(a,u){Y(Y(a).mutationQueue).Hr(u)}(s.localStore,e)):Q(6720,"Unknown batchState",{Sc:t}),await Sr(s,i)):U(Fi,"Cannot apply mutation batch with id: "+e)}async function vv(r,e){const t=Y(r);if(Rc(t),Kh(t),e===!0&&t.gc!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await Cp(t,n.toArray());t.gc=!0,await mB(t.remoteStore,!0);for(const i of s)Tc(t.remoteStore,i)}else if(e===!1&&t.gc!==!1){const n=[];let s=Promise.resolve();t.Pc.forEach((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):s=s.then(()=>(Ei(t,o),gi(t.localStore,o,!0))),mi(t.remoteStore,o)}),await s,await Cp(t,n),function(o){const a=Y(o);a.Ac.forEach((u,l)=>{mi(a.remoteStore,l)}),a.Vc.t_(),a.Ac=new Map,a.Rc=new Ae(z.comparator)}(t),t.gc=!1,await mB(t.remoteStore,!1)}}async function Cp(r,e,t){const n=Y(r),s=[],i=[];for(const o of e){let a;const u=n.Pc.get(o);if(u&&u.length!==0){a=await ku(n.localStore,Me(u[0])?u[0]:kt(u[0]));for(const l of u){const B=n.Tc.get(l),d=await Av(n,B);d.snapshot&&i.push(d.snapshot)}}else{const l=await J_(n.localStore,o);a=await ku(n.localStore,l),await Uh(n,cE(l),o,!1,a.resumeToken)}s.push(a)}return n.hc.Tn(i),s}function cE(r){return mn(r)?r:mm(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function Sv(r){return function(t){return Y(Y(t).persistence).Ro()}(Y(r).localStore)}async function Pv(r,e,t,n){const s=Y(r);if(s.gc)return void U(Fi,"Ignoring unexpected query state notification.");const i=s.Pc.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{let o;if(Me(i[0]))switch(An(i[0])){case"collection_group":case"collection":o=await pB(s.localStore,l_(i[0]));break;case"documents":o=await function(l,B){const d=Y(l),C=ce(...Au(B).map(g=>z.fromPath(g)));return d.persistence.runTransaction("Get documents for pipeline","readonly",g=>d.ko.getEntries(g,C)).then(g=>g)}(s.localStore,i[0]);break;default:Wt(""),o=jr()}else o=await pB(s.localStore,function(l){return l.collectionGroup||(l.path.length%2==1?l.path.lastSegment():l.path.get(l.path.length-2))}(i[0]));const a=Ri.createSynthesizedRemoteEventForCurrentChange(e,t==="current",Le.EMPTY_BYTE_STRING);await Sr(s,o,a);break}case"rejected":await gi(s.localStore,e,!0),Ei(s,e,n);break;default:Q(64155,t)}}async function Nv(r,e,t){const n=Rc(r);if(n.gc){for(const s of e){if(n.Pc.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){U(Fi,"Adding an already active target "+s);continue}const i=await J_(n.localStore,s),o=await ku(n.localStore,i);await Uh(n,cE(i),o.targetId,!1,o.resumeToken),Tc(n.remoteStore,o)}for(const s of t)n.Pc.has(s)&&await gi(n.localStore,s,!1).then(()=>{mi(n.remoteStore,s),Ei(n,s)}).catch(br)}}function Rc(r){const e=Y(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=aE.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=Tv.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=Ev.bind(null,e),e.hc.Tn=cv.bind(null,e.eventManager),e.hc.wc=lv.bind(null,e.eventManager),e}function Kh(r){const e=Y(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=Iv.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=Dv.bind(null,e),e}class zo{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=ac(e.databaseInfo.databaseId),this.sharedClientState=this.vc(e),this.persistence=this.Dc(e),await this.persistence.start(),this.localStore=this.xc(e),this.gcScheduler=this.Cc(e,this.localStore),this.indexBackfillerScheduler=this.Fc(e,this.localStore)}Cc(e,t){return null}Fc(e,t){return null}xc(e){return q_(this.persistence,new H_,e.initialUser,this.serializer)}Dc(e){return new Rh(wc.b_,this.serializer)}vc(e){return new nE}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}zo.provider={build:()=>new zo};class Ov extends zo{constructor(e){super(),this.cacheSizeBytes=e}Cc(e,t){H(this.persistence.referenceDelegate instanceof Fu,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new zm(n,e.asyncQueue,t)}Dc(e){const t=this.cacheSizeBytes!==void 0?at.withCacheSize(this.cacheSizeBytes):at.DEFAULT;return new Rh(n=>Fu.b_(n,t),this.serializer)}}class lE extends zo{constructor(e,t,n){super(),this.Oc=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.Oc.initialize(this,e),await Kh(this.Oc.syncEngine),await Ni(this.Oc.remoteStore),await this.persistence.eo(()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve()))}xc(e){return q_(this.persistence,new H_,e.initialUser,this.serializer)}Cc(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new zm(n,e.asyncQueue,t)}Fc(e,t){const n=new ov(t,this.persistence);return new iv(e.asyncQueue,n)}Dc(e){const t=U_(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?at.withCacheSize(this.cacheSizeBytes):at.DEFAULT;return new bh(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,rE(),lu(),this.serializer,this.sharedClientState,!!this.forceOwnership)}vc(e){return new nE}}class Fv extends lE{constructor(e,t){super(e,t,!1),this.Oc=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.Oc.syncEngine;this.sharedClientState instanceof Al&&(this.sharedClientState.syncEngine={Au:bv.bind(null,t),Vu:Pv.bind(null,t),du:Nv.bind(null,t),Ro:Sv.bind(null,t),Ru:Rv.bind(null,t)},await this.sharedClientState.start()),await this.persistence.eo(async n=>{await vv(this.Oc.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())})}vc(e){const t=rE();if(!Al.Ye(t))throw new G(O.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=U_(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Al(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class $o{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>fp(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=yv.bind(null,this.syncEngine),await mB(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new uv}()}createDatastore(e){const t=ac(e.databaseInfo.databaseId),n=QT(e.databaseInfo);return eA(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return function(n,s,i,o,a){return new $b(n,s,i,o,a)}(this.localStore,this.datastore,e.asyncQueue,t=>fp(this.syncEngine,t,0),function(){return PC.Ye()?new PC:new KT}())}createSyncEngine(e,t){return function(s,i,o,a,u,l,B){const d=new fv(s,i,o,a,u,l);return B&&(d.gc=!0),d}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(s){const i=Y(s);U(Cn,"RemoteStore shutting down."),i.la.add(5),await da(i),i.ha.shutdown(),i.Ta.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}$o.provider={build:()=>new $o};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let kv=class{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new G(O.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await async function(s,i){const o=Y(s),a={documents:i.map(d=>hi(o.serializer,d))},u=await o._t("BatchGetDocuments",o.serializer.databaseId,Be.emptyPath(),a,i.length),l=new Map;u.forEach(d=>{const C=ST(o.serializer,d);l.set(C.key.toString(),C)});const B=[];return i.forEach(d=>{const C=l.get(d.toString());H(!!C,55234,{key:d}),B.push(C)}),B}(this.datastore,e);return t.forEach(n=>this.recordVersion(n)),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(e.toString())}delete(e){this.write(new Ai(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach(t=>{e.delete(t.key.toString())}),e.forEach((t,n)=>{const s=z.fromPath(n);this.mutations.push(new GB(s,this.precondition(s)))}),await async function(n,s){const i=Y(n),o={writes:s.map(a=>xo(i.serializer,a))};await i.nt("Commit",i.serializer.databaseId,Be.emptyPath(),o)}(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw Q(50498,{Mc:e.constructor.name});t=ee.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new G(O.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(ee.min())?ke.exists(!1):ke.updateTime(t):ke.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(ee.min()))throw new G(O.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return ke.updateTime(t)}return ke.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lv{constructor(e,t,n,s,i){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=s,this.deferred=i,this.Nc=n.maxAttempts,this.Ht=new YB(this.asyncQueue,"transaction_retry")}Lc(){this.Nc-=1,this.Bc()}Bc(){this.Ht.kt(async()=>{const e=new kv(this.datastore),t=this.Uc(e);t&&t.then(n=>{this.asyncQueue.enqueueAndForget(()=>e.commit().then(()=>{this.deferred.resolve(n)}).catch(s=>{this.kc(s)}))}).catch(n=>{this.kc(n)})})}Uc(e){try{const t=this.updateFunction(e);return!sa(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}kc(e){this.Nc>0&&this.qc(e)?(this.Nc-=1,this.asyncQueue.enqueueAndForget(()=>(this.Bc(),Promise.resolve()))):this.deferred.reject(e)}qc(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!_m(t)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tr="FirestoreClient";class xv{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=ot.UNAUTHENTICATED,this.clientId=kB.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,async o=>{U(Tr,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(n,o=>(U(Tr,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Ut;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=Ac(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function Rl(r,e){r.asyncQueue.verifyOperationInProgress(),U(Tr,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener(async s=>{n.isEqual(s)||(await j_(e.localStore,s),n=s)}),e.persistence.setDatabaseDeletedListener(()=>r.terminate()),r._offlineComponents=e}async function pp(r,e){r.asyncQueue.verifyOperationInProgress();const t=await BE(r);U(Tr,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener(n=>cp(e.remoteStore,n)),r.setAppCheckTokenChangeListener((n,s)=>cp(e.remoteStore,s)),r._onlineComponents=e}async function BE(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){U(Tr,"Using user provided OfflineComponentProvider");try{await Rl(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(s){return s.name==="FirebaseError"?s.code===O.FAILED_PRECONDITION||s.code===O.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(t))throw t;Wt("Error using user provided cache. Falling back to memory cache: "+t),await Rl(r,new zo)}}else U(Tr,"Using default OfflineComponentProvider"),await Rl(r,new Ov(void 0));return r._offlineComponents}async function Jh(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(U(Tr,"Using user provided OnlineComponentProvider"),await pp(r,r._uninitializedComponentsProvider._online)):(U(Tr,"Using default OnlineComponentProvider"),await pp(r,new $o))),r._onlineComponents}function Vv(r){return BE(r).then(e=>e.localStore)}function Mv(r){return Jh(r).then(e=>e.syncEngine)}function Gv(r){return Jh(r).then(e=>e.datastore)}async function Mu(r){const e=await Jh(r),t=e.eventManager;return t.onListen=Cv.bind(null,e.syncEngine),t.onUnlisten=gv.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=pv.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=mv.bind(null,e.syncEngine),t}function Uv(r,e,t,n){const s=new Fh(n),i=new Gh(e,s,t);return r.asyncQueue.enqueueAndForget(async()=>xh(await Mu(r),i)),()=>{s.Va(),r.asyncQueue.enqueueAndForget(async()=>Vh(await Mu(r),i))}}function Hv(r,e){const t=new Ut;return r.asyncQueue.enqueueAndForget(async()=>async function(s,i,o){try{const a=await function(l,B){const d=Y(l);return d.persistence.runTransaction("read document","readonly",C=>d.localDocuments.getDocument(C,B))}(s,i);a.isFoundDocument()?o.resolve(a):a.isNoDocument()?o.resolve(null):o.reject(new G(O.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(a){const u=Ac(a,`Failed to get document '${i} from cache`);o.reject(u)}}(await Vv(r),e,t)),t.promise}function qv(r,e,t={}){const n=new Ut;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,a,u,l){const B=new Fh({next:C=>{B.Va(),o.enqueueAndForget(()=>Vh(i,d));const g=C.docs.has(a);!g&&C.fromCache?l.reject(new G(O.UNAVAILABLE,"Failed to get document because the client is offline.")):g&&C.fromCache&&u&&u.source==="server"?l.reject(new G(O.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):l.resolve(C)},error:C=>l.reject(C)}),d=new Gh(ia(a.path),B,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return xh(i,d)}(await Mu(r),r.asyncQueue,e,t,n)),n.promise}function jv(r,e,t={}){const n=new Ut;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,a,u,l){const B=new Fh({next:C=>{B.Va(),o.enqueueAndForget(()=>Vh(i,d)),C.fromCache&&u.source==="server"?l.reject(new G(O.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):l.resolve(C)},error:C=>l.reject(C)}),d=new Gh(a instanceof Eo?MR(a):a,B,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return xh(i,d)}(await Mu(r),r.asyncQueue,e,t,n)),n.promise}function Kv(r,e){const t=new Ut;return r.asyncQueue.enqueueAndForget(async()=>_v(await Mv(r),e,t)),t.promise}function Jv(r,e,t){const n=new Ut;return r.asyncQueue.enqueueAndForget(async()=>{const s=await Gv(r);new Lv(r.asyncQueue,s,t,e,n).Lc()}),n.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Qo=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new Ne(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new zv(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(kn("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},zv=class extends Qo{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hE{convertValue(e,t="none"){switch(je(e)){case 0:return null;case 1:return e.booleanValue;case 2:return be(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(On(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw Q(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return Rr(e,(s,i)=>{n[s]=this.convertValue(i,t)}),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[hs].arrayValue)==null?void 0:s.values)==null?void 0:i.map(o=>be(o.doubleValue));return new Tt(t)}convertGeoPoint(e){return new ln(be(e.latitude),be(e.longitude))}convertArray(e,t){return(e.values||[]).map(n=>this.convertValue(n,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=ra(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(ii(e));default:return null}}convertTimestamp(e){const t=Nn(e);return new _e(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=Be.fromString(e);H(xm(n),9688,{name:e});const s=new Bs(n.get(1),n.get(3)),i=new z(n.popFirst(5));return s.isEqual(t)||Ge(`A document reference to ${i} refers to a different database (${s.projectId}/${s.database}), which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bc(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class $v extends hE{constructor(e){super(),this.firestore=e}convertBytes(e){return new Nt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new Ne(this.firestore,null,t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gp="AsyncQueue";class mp{constructor(e=Promise.resolve()){this.$c=[],this.Kc=!1,this.Qc=[],this.Wc=null,this.Gc=!1,this.zc=!1,this.jc=[],this.Ht=new YB(this,"async_queue_retry"),this.Hc=()=>{const n=lu();n&&U(gp,"Visibility state changed to "+n.visibilityState),this.Ht.$t()},this.Jc=e;const t=lu();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.Hc)}get isShuttingDown(){return this.Kc}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Yc(),this.Zc(e)}enterRestrictedMode(e){if(!this.Kc){this.Kc=!0,this.zc=e||!1;const t=lu();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.Hc)}}enqueue(e){if(this.Yc(),this.Kc)return new Promise(()=>{});const t=new Ut;return this.Zc(()=>this.Kc&&this.zc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.$c.push(e),this.Xc()))}async Xc(){if(this.$c.length!==0){try{await this.$c[0](),this.$c.shift(),this.Ht.reset()}catch(e){if(!vr(e))throw e;U(gp,"Operation failed with retryable error: "+e)}this.$c.length>0&&this.Ht.kt(()=>this.Xc())}}Zc(e){const t=this.Jc.then(()=>(this.Gc=!0,e().catch(n=>{throw this.Wc=n,this.Gc=!1,Ge("INTERNAL UNHANDLED ERROR: ",_p(n)),n}).then(n=>(this.Gc=!1,n))));return this.Jc=t,t}enqueueAfterDelay(e,t,n){this.Yc(),this.jc.indexOf(e)>-1&&(t=0);const s=kh.createAndSchedule(this,e,t,n,i=>this.el(i));return this.Qc.push(s),s}Yc(){this.Wc&&Q(47125,{tl:_p(this.Wc)})}verifyOperationInProgress(){}async nl(){let e;do e=this.Jc,await e;while(e!==this.Jc)}rl(e){for(const t of this.Qc)if(t.timerId===e)return!0;return!1}il(e){return this.nl().then(()=>{this.Qc.sort((t,n)=>t.targetTimeMs-n.targetTimeMs);for(const t of this.Qc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.nl()})}sl(e){this.jc.push(e)}el(e){const t=this.Qc.indexOf(e);this.Qc.splice(t,1)}}function _p(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}class jt extends ZB{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new mp,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new mp(e),this._firestoreClient=void 0,await e}}}function HF(r,e,t){t||(t=_u);const n=Ar(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(gr(i,e))return s;throw new G(O.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new G(O.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Jm)throw new G(O.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&Gn(e.host)&&Yu(e.host),n.initialize({options:e,instanceIdentifier:t})}function Ns(r){if(r._terminated)throw new G(O.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||Qv(r),r._firestoreClient}function Qv(r){var n,s,i,o;const e=r._freezeSettings(),t=nA(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new xv(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&function(u){const l=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(l),_online:l}}(r._componentsProvider))}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fa extends hE{constructor(e){super(),this.firestore=e}convertBytes(e){return new Nt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new Ne(this.firestore,null,t)}}class Xr{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class bn extends Qo{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Bu(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(kn("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new G(O.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=bn._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}bn._jsonSchemaVersion="firestore/documentSnapshot/1.0",bn._jsonSchema={type:qe("string",bn._jsonSchemaVersion),bundleSource:qe("string","DocumentSnapshot"),bundleName:qe("string"),bundle:qe("string")};class Bu extends bn{data(e={}){return super.data(e)}}class os{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new Xr(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new Bu(this._firestore,this._userDataWriter,n.key,n,new Xr(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new G(O.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map(a=>{Me(s._snapshot.query)?fB(s._snapshot.query):JB(s.query._query);const u=new Bu(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Xr(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}})}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(a=>i||a.type!==3).map(a=>{const u=new Bu(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Xr(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let l=-1,B=-1;return a.type!==0&&(l=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),B=o.indexOf(a.doc.key)),{type:Wv(a.type),doc:u,oldIndex:l,newIndex:B}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new G(O.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=os._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=kB.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach(i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Wv(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return Q(61501,{type:r})}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */os._jsonSchemaVersion="firestore/querySnapshot/1.0",os._jsonSchema={type:qe("string",os._jsonSchemaVersion),bundleSource:qe("string","QuerySnapshot"),bundleName:qe("string"),bundle:qe("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dE(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new G(O.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class zh{}class vc extends zh{}function qF(r,e,...t){let n=[];e instanceof zh&&n.push(e),n=n.concat(t),function(i){const o=i.filter(u=>u instanceof $h).length,a=i.filter(u=>u instanceof Sc).length;if(o>1||o>0&&a>0)throw new G(O.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(n);for(const s of n)r=s._apply(r);return r}class Sc extends vc{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new Sc(e,t,n)}_apply(e){const t=this._parse(e);return fE(e._query,t),new pn(e.firestore,e.converter,eB(e._query,t))}_parse(e){const t=Rs(e.firestore);return function(i,o,a,u,l,B,d){let C;if(l.isKeyField()){if(B==="array-contains"||B==="array-contains-any")throw new G(O.INVALID_ARGUMENT,`Invalid Query. You can't perform '${B}' queries on documentId().`);if(B==="in"||B==="not-in"){Ip(d,B);const D=[];for(const P of d)D.push(Ep(u,i,P));C={arrayValue:{values:D}}}else C=Ep(u,i,d)}else B!=="in"&&B!=="not-in"&&B!=="array-contains-any"||Ip(d,B),C=Ym(a,o,d,B==="in"||B==="not-in");return de.create(l,B,C)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function jF(r,e,t){const n=e,s=kn("where",r);return Sc._create(s,n,t)}class $h extends zh{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new $h(e,t)}_parse(e){const t=this._queryConstraints.map(n=>n._parse(e)).filter(n=>n.getFilters().length>0);return t.length===1?t[0]:Ie.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(s,i){let o=s;const a=i.getFlattenedFilters();for(const u of a)fE(o,u),o=eB(o,u)}(e._query,t),new pn(e.firestore,e.converter,eB(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Qh extends vc{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Qh(e,t)}_apply(e){const t=function(s,i,o){if(s.startAt!==null)throw new G(O.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new G(O.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new ko(i,o)}(e._query,this._field,this._direction);return new pn(e.firestore,e.converter,dT(e._query,t))}}function KF(r,e="asc"){const t=e,n=kn("orderBy",r);return Qh._create(n,t)}class Wh extends vc{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Wh(e,t,n)}_apply(e){return new pn(e.firestore,e.converter,yu(e._query,this._limit,this._limitType))}}function JF(r){return jy("limit",r),Wh._create("limit",r,"F")}class Yh extends vc{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Yh(e,t,n)}_apply(e){const t=Yv(e,this.type,this._docOrFields,this._inclusive);return new pn(e.firestore,e.converter,fT(e._query,t))}}function zF(...r){return Yh._create("startAfter",r,!1)}function Yv(r,e,t,n){if(t[0]=Ce(t[0]),t[0]instanceof Qo)return function(i,o,a,u,l){if(!u)throw new G(O.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${a}().`);const B=[];for(const d of ei(i))if(d.field.isKeyField())B.push(ds(o,u.key));else{const C=u.data.field(d.field);if(na(C))throw new G(O.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+d.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(C===null){const g=d.field.canonicalString();throw new G(O.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${g}' (used as the orderBy) does not exist.`)}B.push(C)}return new Er(B,l)}(r._query,r.firestore._databaseId,e,t[0]._document,n);{const s=Rs(r.firestore);return function(o,a,u,l,B,d){const C=o.explicitOrderBy;if(B.length>C.length)throw new G(O.INVALID_ARGUMENT,`Too many arguments provided to ${l}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const g=[];for(let D=0;D<B.length;D++){const P=B[D];if(C[D].field.isKeyField()){if(typeof P!="string")throw new G(O.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${l}(), but got a ${typeof P}`);if(!KB(o)&&P.indexOf("/")!==-1)throw new G(O.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${l}() must be a plain document ID, but '${P}' contains a slash.`);const x=o.path.child(Be.fromString(P));if(!z.isDocumentKey(x))throw new G(O.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${l}() must result in a valid document path, but '${x}' is not because it contains an odd number of segments.`);const J=new z(x);g.push(ds(a,J))}else{const x=Ym(u,l,P);g.push(x)}}return new Er(g,d)}(r._query,r.firestore._databaseId,s,e,t,n)}}function Ep(r,e,t){if(typeof(t=Ce(t))=="string"){if(t==="")throw new G(O.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!KB(e)&&t.indexOf("/")!==-1)throw new G(O.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(Be.fromString(t));if(!z.isDocumentKey(n))throw new G(O.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return ds(r,new z(n))}if(t instanceof Ne)return ds(r,t._key);throw new G(O.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ec(t)}.`)}function Ip(r,e){if(!Array.isArray(r)||r.length===0)throw new G(O.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function fE(r,e){const t=function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null}(r.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new G(O.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new G(O.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Dp(r){return function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1}(r,["next","error","complete"])}class Xv{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=tS(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function $F(r){return new Xv(r)}class Zv{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=$o.provider,this._offlineComponentProvider={build:t=>new lE(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class eS{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=$o.provider,this._offlineComponentProvider={build:t=>new Fv(t,e==null?void 0:e.cacheSizeBytes)}}}function tS(r){return new Zv(r==null?void 0:r.forceOwnership)}function QF(){return new eS}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nS={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rS{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Rs(e)}set(e,t,n){this._verifyNotCommitted();const s=Br(e,this._firestore),i=bc(s.converter,t,n),o=lc(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,ke.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=Br(e,this._firestore);let o;return o=typeof(t=Ce(t))=="string"||t instanceof bi?sh(this._dataReader,"WriteBatch.update",i._key,t,n,s):rh(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,ke.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Br(e,this._firestore);return this._mutations=this._mutations.concat(new Ai(t._key,ke.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new G(O.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Br(r,e){if((r=Ce(r)).firestore!==e)throw new G(O.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let sS=class{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=Rs(e)}get(e){const t=Br(e,this._firestore),n=new $v(this._firestore);return this._transaction.lookup([t._key]).then(s=>{if(!s||s.length!==1)return Q(24041);const i=s[0];if(i.isFoundDocument())return new Qo(this._firestore,n,i.key,i,t.converter);if(i.isNoDocument())return new Qo(this._firestore,n,t._key,null,t.converter);throw Q(18433,{doc:i})})}set(e,t,n){const s=Br(e,this._firestore),i=bc(s.converter,t,n),o=lc(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,o),this}update(e,t,n,...s){const i=Br(e,this._firestore);let o;return o=typeof(t=Ce(t))=="string"||t instanceof bi?sh(this._dataReader,"Transaction.update",i._key,t,n,s):rh(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,o),this}delete(e){const t=Br(e,this._firestore);return this._transaction.delete(t._key),this}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iS extends sS{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=Br(e,this._firestore),n=new fa(this._firestore);return super.get(e).then(s=>new bn(this._firestore,n,t._key,s._document,new Xr(!1,!1),t.converter))}}function YF(r,e,t){r=nt(r,jt);const n={...nS,...t};(function(o){if(o.maxAttempts<1)throw new G(O.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n);const s=Ns(r);return Jv(s,i=>e(new iS(r,i)),n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XF(r){r=nt(r,Ne);const e=nt(r.firestore,jt),t=Ns(e);return qv(t,r._key).then(n=>CE(e,r,n))}function ZF(r){r=nt(r,Ne);const e=nt(r.firestore,jt),t=Ns(e),n=new fa(e);return Hv(t,r._key).then(s=>new bn(e,n,r._key,s,new Xr(s!==null&&s.hasLocalMutations,!0),r.converter))}function ek(r){r=nt(r,pn);const e=nt(r.firestore,jt),t=Ns(e),n=new fa(e);return dE(r._query),jv(t,r._query).then(s=>new os(e,n,r,s))}function tk(r,e,t){r=nt(r,Ne);const n=nt(r.firestore,jt),s=bc(r.converter,e,t),i=Rs(n);return Ca(n,[lc(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,ke.none())])}function nk(r,e,t,...n){r=nt(r,Ne);const s=nt(r.firestore,jt),i=Rs(s);let o;return o=typeof(e=Ce(e))=="string"||e instanceof bi?sh(i,"updateDoc",r._key,e,t,n):rh(i,"updateDoc",r._key,e),Ca(s,[o.toMutation(r._key,ke.exists(!0))])}function rk(r){return Ca(nt(r.firestore,jt),[new Ai(r._key,ke.none())])}function sk(r,e){const t=nt(r.firestore,jt),n=uA(r),s=bc(r.converter,e),i=Rs(r.firestore);return Ca(t,[lc(i,"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,ke.exists(!1))]).then(()=>n)}function ik(r,...e){var l,B,d;r=Ce(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||Dp(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(Dp(e[n])){const C=e[n];e[n]=(l=C.next)==null?void 0:l.bind(C),e[n+1]=(B=C.error)==null?void 0:B.bind(C),e[n+2]=(d=C.complete)==null?void 0:d.bind(C)}let i,o,a;if(r instanceof Ne)o=nt(r.firestore,jt),a=ia(r._key.path),i={next:C=>{e[n]&&e[n](CE(o,r,C))},error:e[n+1],complete:e[n+2]};else{const C=nt(r,pn);o=nt(C.firestore,jt),a=C._query;const g=new fa(o);i={next:D=>{e[n]&&e[n](new os(o,g,C,D))},error:e[n+1],complete:e[n+2]},dE(r._query)}const u=Ns(o);return Uv(u,a,s,i)}function Ca(r,e){const t=Ns(r);return Kv(t,e)}function CE(r,e,t){const n=t.docs.get(e._key),s=new fa(r);return new bn(r,s,e._key,n,new Xr(t.hasPendingWrites,t.fromCache),e.converter)}function ok(r){return r=nt(r,jt),Ns(r),new rS(r,e=>Ca(r,e))}const wp="@firebase/firestore",yp="4.17.2";(function(e,t=!0){xy(Ts),Ht(new Lt("firestore",(n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),a=new jt(new UT(n.getProvider("auth-internal")),new jT(o,n.getProvider("app-check-internal")),zy(o,s),o);return i={useFetchStreams:t,...i},a._setSettings(i),a},"PUBLIC").setMultipleInstances(!0)),ct(wp,yp,e),ct(wp,yp,"esm2020")})();var oS="firebase",aS="12.19.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ct(oS,aS,"app");function pE(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const uS=pE,gE=new ys("auth","Firebase",pE());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gu=new SB("@firebase/auth");function hu(r,...e){Gu.logLevel<=he.WARN&&Gu.warn(`Auth (${Ts}): ${r}`,...e)}function du(r,...e){Gu.logLevel<=he.ERROR&&Gu.error(`Auth (${Ts}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yt(r,...e){throw Zh(r,...e)}function Bn(r,...e){return Zh(r,...e)}function Xh(r,e,t){const n={...uS(),[e]:t};return new ys("auth","Firebase",n).create(e,{appName:r.name})}function hn(r){return Xh(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Zh(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return gE.create(r,...e)}function ie(r,e,...t){if(!r)throw Zh(e,...t)}function Dn(r){const e="INTERNAL ASSERTION FAILED: "+r;throw du(e),new Error(e)}function Vn(r,e){r||Dn(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function DB(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function cS(){return Tp()==="http:"||Tp()==="https:"}function Tp(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lS(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(cS()||HD()||"connection"in navigator)?navigator.onLine:!0}function BS(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pa{constructor(e,t){this.shortDelay=e,this.longDelay=t,Vn(t>e,"Short delay should be less than long delay!"),this.isMobile=GD()||qD()}get(){return lS()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ed(r,e){Vn(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mE{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Dn("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Dn("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Dn("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hS={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dS=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],fS=new pa(3e4,6e4);function Pr(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function Nr(r,e,t,n,s={}){return _E(r,s,async()=>{let i={},o={};n&&(e==="GET"?o=n:i={body:JSON.stringify(n)});const a=Xo({...o,key:r.config.apiKey}).slice(1),u=await r._getAdditionalHeaders();u["Content-Type"]="application/json",r.languageCode&&(u["X-Firebase-Locale"]=r.languageCode);const l={method:e,headers:u,...i};return UD()||(l.referrerPolicy="strict-origin-when-cross-origin"),r.emulatorConfig&&Gn(r.emulatorConfig.host)&&(l.credentials="include"),mE.fetch()(await EE(r,r.config.apiHost,t,a),l)})}async function _E(r,e,t){r._canInitEmulator=!1;const n={...hS,...e};try{const s=new pS(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw Wa(r,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const a=i.ok?o.errorMessage:o.error.message,[u,l]=a.split(" : ");if(u==="FEDERATED_USER_ID_ALREADY_LINKED")throw Wa(r,"credential-already-in-use",o);if(u==="EMAIL_EXISTS")throw Wa(r,"email-already-in-use",o);if(u==="USER_DISABLED")throw Wa(r,"user-disabled",o);const B=n[u]||u.toLowerCase().replace(/[_\s]+/g,"-");if(l)throw Xh(r,B,l);Yt(r,B)}}catch(s){if(s instanceof Kt)throw s;Yt(r,"network-request-failed",{message:String(s)})}}async function ga(r,e,t,n,s={}){const i=await Nr(r,e,t,n,s);return"mfaPendingCredential"in i&&Yt(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function EE(r,e,t,n){const s=`${e}${t}?${n}`,i=r,o=i.config.emulator?ed(r.config,s):`${r.config.apiScheme}://${s}`;return dS.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}function CS(r){switch(r){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class pS{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(Bn(this.auth,"network-request-failed")),fS.get())})}}function Wa(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const s=Bn(r,e,n);return s.customData._tokenResponse=t,s}function Ap(r){return r!==void 0&&r.enterprise!==void 0}class gS{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return CS(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function mS(r,e){return Nr(r,"GET","/v2/recaptchaConfig",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _S(r,e){return Nr(r,"POST","/v1/accounts:delete",e)}async function Uu(r,e){return Nr(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ao(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function ES(r,e=!1){const t=Ce(r),n=await t.getIdToken(e),s=td(n);ie(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:Ao(bl(s.auth_time)),issuedAtTime:Ao(bl(s.iat)),expirationTime:Ao(bl(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function bl(r){return Number(r)*1e3}function td(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return du("JWT malformed, contained fewer than 3 sections"),null;try{const s=pg(t);return s?JSON.parse(s):(du("Failed to decode base64 JWT payload"),null)}catch(s){return du("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Rp(r){const e=td(r);return ie(e,"internal-error"),ie(typeof e.exp<"u","internal-error"),ie(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Wo(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof Kt&&IS(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function IS({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DS{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wB{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ao(this.lastLoginAt),this.creationTime=Ao(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hu(r){var d;const e=r.auth,t=await r.getIdToken(),n=await Wo(r,Uu(e,{idToken:t}));ie(n==null?void 0:n.users.length,e,"internal-error");const s=n.users[0];r._notifyReloadListener(s);const i=(d=s.providerUserInfo)!=null&&d.length?IE(s.providerUserInfo):[],o=yS(r.providerData,i),a=r.isAnonymous,u=!(r.email&&s.passwordHash)&&!(o!=null&&o.length),l=a?u:!1,B={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new wB(s.createdAt,s.lastLoginAt),isAnonymous:l};Object.assign(r,B)}async function wS(r){const e=Ce(r);await Hu(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function yS(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function IE(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function TS(r,e){const t=await _E(r,{},async()=>{const n=Xo({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,o=await EE(r,s,"/v1/token",`key=${i}`),a=await r._getAdditionalHeaders();a["Content-Type"]="application/x-www-form-urlencoded";const u={method:"POST",headers:a,body:n};return r.emulatorConfig&&Gn(r.emulatorConfig.host)&&(u.credentials="include"),mE.fetch()(o,u)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function AS(r,e){return Nr(r,"POST","/v2/accounts:revokeToken",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){ie(e.idToken,"internal-error"),ie(typeof e.idToken<"u","internal-error"),ie(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Rp(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){ie(e.length!==0,"internal-error");const t=Rp(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(ie(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:s,expiresIn:i}=await TS(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:s,expirationTime:i}=t,o=new ni;return n&&(ie(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),s&&(ie(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(ie(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new ni,this.toJSON())}_performRefresh(){return Dn("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function er(r,e){ie(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class $t{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new DS(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new wB(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await Wo(this,this.stsTokenManager.getToken(this.auth,e));return ie(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return ES(this,e)}reload(){return wS(this)}_assign(e){this!==e&&(ie(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new $t({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){ie(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await Hu(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(pt(this.auth.app))return Promise.reject(hn(this.auth));const e=await this.getIdToken();return await Wo(this,_S(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,a=t.tenantId??void 0,u=t._redirectEventId??void 0,l=t.createdAt??void 0,B=t.lastLoginAt??void 0,{uid:d,emailVerified:C,isAnonymous:g,providerData:D,stsTokenManager:P}=t;ie(d&&P,e,"internal-error");const x=ni.fromJSON(this.name,P);ie(typeof d=="string",e,"internal-error"),er(n,e.name),er(s,e.name),ie(typeof C=="boolean",e,"internal-error"),ie(typeof g=="boolean",e,"internal-error"),er(i,e.name),er(o,e.name),er(a,e.name),er(u,e.name),er(l,e.name),er(B,e.name);const J=new $t({uid:d,auth:e,email:s,emailVerified:C,displayName:n,isAnonymous:g,photoURL:o,phoneNumber:i,tenantId:a,stsTokenManager:x,createdAt:l,lastLoginAt:B});return D&&Array.isArray(D)&&(J.providerData=D.map(X=>({...X}))),u&&(J._redirectEventId=u),J}static async _fromIdTokenResponse(e,t,n=!1){const s=new ni;s.updateFromServerResponse(t);const i=new $t({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await Hu(i),i}static async _fromGetAccountInfoResponse(e,t,n){const s=t.users[0];ie(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?IE(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),a=new ni;a.updateFromIdToken(n);const u=new $t({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),l={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new wB(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(u,l),u}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bp=new Map;function wn(r){Vn(r instanceof Function,"Expected a class definition");let e=bp.get(r);return e?(Vn(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,bp.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DE{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}DE.type="NONE";const vp=DE;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fu(r,e,t){return`firebase:${r}:${e}:${t}`}class as{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:s,name:i}=this.auth;this.fullUserKey=fu(this.userKey,s.apiKey,i),this.fullPersistenceKey=fu("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t);try{this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}catch{}}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Uu(this.auth,{idToken:e}).catch(()=>{});return t?$t._fromGetAccountInfoResponse(this.auth,t,e):null}return $t._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){try{this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}catch{}}static async create(e,t,n="authUser"){if(!t.length)return new as(wn(vp),e,n);const s=(await Promise.all(t.map(async l=>{try{if(await l._isAvailable())return l}catch{return}}))).filter(l=>l);let i=s[0]||wn(vp);const o=fu(n,e.config.apiKey,e.name);let a=null;for(const l of t)try{const B=await l._get(o);if(B){let d;if(typeof B=="string"){const C=await Uu(e,{idToken:B}).catch(()=>{});if(!C)break;d=await $t._fromGetAccountInfoResponse(e,C,B)}else d=$t._fromJSON(e,B);l!==i&&(a=d),i=l;break}}catch{}const u=s.filter(l=>l._shouldAllowMigration);return!i._shouldAllowMigration||!u.length?new as(i,e,n):(i=u[0],a&&await i._set(o,a.toJSON()),await Promise.all(t.map(async l=>{if(l!==i)try{await l._remove(o)}catch{}})),new as(i,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Sp(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(AE(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(wE(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(bE(e))return"Blackberry";if(vE(e))return"Webos";if(yE(e))return"Safari";if((e.includes("chrome/")||TE(e))&&!e.includes("edge/"))return"Chrome";if(RE(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function wE(r=$e()){return/firefox\//i.test(r)}function yE(r=$e()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function TE(r=$e()){return/crios\//i.test(r)}function AE(r=$e()){return/iemobile/i.test(r)}function RE(r=$e()){return/android/i.test(r)}function bE(r=$e()){return/blackberry/i.test(r)}function vE(r=$e()){return/webos/i.test(r)}function nd(r=$e()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function RS(r=$e()){var e;return nd(r)&&!!((e=window.navigator)!=null&&e.standalone)}function bS(){return jD()&&document.documentMode===10}function SE(r=$e()){return nd(r)||RE(r)||vE(r)||bE(r)||/windows phone/i.test(r)||AE(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function PE(r,e=[]){let t;switch(r){case"Browser":t=Sp($e());break;case"Worker":t=`${Sp($e())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Ts}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vS{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=i=>new Promise((o,a)=>{try{const u=e(i);o(u)}catch(u){a(u)}});n.onAbort=t,this.queue.push(n);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function SS(r,e={}){return Nr(r,"GET","/v2/passwordPolicy",Pr(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const PS=6;class NS{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??PS,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class OS{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Pp(this),this.idTokenSubscription=new Pp(this),this.beforeStateQueue=new vS(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=gE,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=wn(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted){try{this.persistenceManager=await as.create(this,e)}catch(o){hu(`Failed to initialize persistence: ${o}`),this.persistenceManager=await as.create(this,[])}finally{(n=this._resolvePersistenceManagerAvailable)==null||n.call(this)}if(!this._deleted){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}try{await this.initializeCurrentUser(t)}catch(o){hu(`Failed to initialize current user: ${o}`),await this.directlySetCurrentUser(null).catch(()=>{})}this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Uu(this,{idToken:e}),n=await $t._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch{await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(pt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,a=n==null?void 0:n._redirectEventId,u=await this.tryRedirectSignIn(e);(!o||o===a)&&(u!=null&&u.user)&&(n=u.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return ie(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Hu(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=BS()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(pt(this.app))return Promise.reject(hn(this));const t=e?Ce(e):null;return t&&ie(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&ie(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return pt(this.app)?Promise.reject(hn(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return pt(this.app)?Promise.reject(hn(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(wn(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await SS(this),t=new NS(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new ys("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await AS(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&wn(e)||this._popupRedirectResolver;ie(t,this,"argument-error"),this.redirectPersistenceManager=await as.create(this,[wn(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(ie(a,this,"internal-error"),a.then(()=>{o||i(this.currentUser)}).catch(u=>{if(!o)if(typeof t!="function"&&t.error)t.error(u);else if(n)n(u);else throw u}),typeof t=="function"){const u=e.addObserver(t,n,s);return()=>{o=!0,u()}}else{const u=e.addObserver(t);return()=>{o=!0,u()}}}async directlySetCurrentUser(e){if(this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,this.persistenceManager)try{e?await this.persistenceManager.setCurrentUser(e):await this.persistenceManager.removeCurrentUser()}catch(t){const n=(t==null?void 0:t.message)||String(t),s=Xh(this,"internal-error",`An internal AuthError has occurred: ${n}`);throw s.customData={originalError:t},s}}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return ie(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=PE(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(pt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&hu(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Or(r){return Ce(r)}class Pp{constructor(e){this.auth=e,this.observer=null,this.addObserver=QD(t=>this.observer=t)}get next(){return ie(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Pc={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function FS(r){Pc=r}function NE(r){return Pc.loadJS(r)}function kS(){return Pc.recaptchaEnterpriseScript}function LS(){return Pc.gapiScript}function xS(r){return`__${r}${Math.floor(Math.random()*1e6)}`}class VS{constructor(){this.enterprise=new MS}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class MS{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const GS="recaptcha-enterprise",OE="NO_RECAPTCHA",Np="onFirebaseAuthREInstanceReady";class sr{constructor(e){this.type=GS,this.auth=Or(e)}async verify(e="verify",t=!1){async function n(i){if(!t){if(i.tenantId==null&&i._agentRecaptchaConfig!=null)return i._agentRecaptchaConfig.siteKey;if(i.tenantId!=null&&i._tenantRecaptchaConfigs[i.tenantId]!==void 0)return i._tenantRecaptchaConfigs[i.tenantId].siteKey}return new Promise(async(o,a)=>{mS(i,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(u=>{if(u.recaptchaKey===void 0)a(new Error("recaptcha Enterprise site key undefined"));else{const l=new gS(u);return i.tenantId==null?i._agentRecaptchaConfig=l:i._tenantRecaptchaConfigs[i.tenantId]=l,o(l.siteKey)}}).catch(u=>{a(u)})})}function s(i,o,a){const u=window.grecaptcha;Ap(u)?u.enterprise.ready(()=>{u.enterprise.execute(i,{action:e}).then(l=>{o(l)}).catch(()=>{o(OE)})}):a(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new VS().execute("siteKey",{action:"verify"}):new Promise((i,o)=>{n(this.auth).then(async a=>{if(!t&&Ap(window.grecaptcha)&&sr.scriptInjectionDeferred)await sr.scriptInjectionDeferred.promise,s(a,i,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let u=kS();u.length!==0&&(u+=a+`&onload=${Np}`),sr.scriptInjectionDeferred=new Dg,window[Np]=()=>{var l;(l=sr.scriptInjectionDeferred)==null||l.resolve()},NE(u).then(()=>{var l;return(l=sr.scriptInjectionDeferred)==null?void 0:l.promise}).then(()=>{s(a,i,o)}).catch(l=>{o(l)})}}).catch(a=>{o(a)})})}}sr.scriptInjectionDeferred=null;async function Op(r,e,t,n=!1,s=!1){const i=new sr(r);let o;if(s)o=OE;else try{o=await i.verify(t)}catch{o=await i.verify(t,!0)}const a={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in a){const u=a.phoneEnrollmentInfo.phoneNumber,l=a.phoneEnrollmentInfo.recaptchaToken;Object.assign(a,{phoneEnrollmentInfo:{phoneNumber:u,recaptchaToken:l,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in a){const u=a.phoneSignInInfo.recaptchaToken;Object.assign(a,{phoneSignInInfo:{recaptchaToken:u,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return a}return n?Object.assign(a,{captchaResp:o}):Object.assign(a,{captchaResponse:o}),Object.assign(a,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(a,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),a}async function yB(r,e,t,n,s){var i;if((i=r._getRecaptchaConfig())!=null&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const o=await Op(r,e,t,t==="getOobCode");return n(r,o)}else return n(r,e).catch(async o=>{if(o.code==="auth/missing-recaptcha-token"){const a=await Op(r,e,t,t==="getOobCode");return n(r,a)}else return Promise.reject(o)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function US(r,e){const t=Ar(r,"auth");if(t.isInitialized()){const s=t.getImmediate(),i=t.getOptions();if(gr(i,e??{}))return s;Yt(s,"already-initialized")}return t.initialize({options:e})}function HS(r,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(wn);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function qS(r,e,t){const n=Or(r);ie(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const s=!1,i=FE(e),{host:o,port:a}=jS(e),u=a===null?"":`:${a}`,l={url:`${i}//${o}${u}/`},B=Object.freeze({host:o,port:a,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){ie(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),ie(gr(l,n.config.emulator)&&gr(B,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=l,n.emulatorConfig=B,n.settings.appVerificationDisabledForTesting=!0,Gn(o)?Yu(`${i}//${o}${u}`):KS()}function FE(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function jS(r){const e=FE(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){const i=s[1];return{host:i,port:Fp(n.substr(i.length+1))}}else{const[i,o]=n.split(":");return{host:i,port:Fp(o)}}}function Fp(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function KS(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rd{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return Dn("not implemented")}_getIdTokenResponse(e){return Dn("not implemented")}_linkToIdToken(e,t){return Dn("not implemented")}_getReauthenticationResolver(e){return Dn("not implemented")}}async function JS(r,e){return Nr(r,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zS(r,e){return ga(r,"POST","/v1/accounts:signInWithPassword",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $S(r,e){return ga(r,"POST","/v1/accounts:signInWithEmailLink",Pr(r,e))}async function QS(r,e){return ga(r,"POST","/v1/accounts:signInWithEmailLink",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yo extends rd{constructor(e,t,n,s=null){super("password",n),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new Yo(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new Yo(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return yB(e,t,"signInWithPassword",zS);case"emailLink":return $S(e,{email:this._email,oobCode:this._password});default:Yt(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const n={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return yB(e,n,"signUpPassword",JS);case"emailLink":return QS(e,{idToken:t,email:this._email,oobCode:this._password});default:Yt(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ri(r,e){return ga(r,"POST","/v1/accounts:signInWithIdp",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const WS="http://localhost";class _s extends rd{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new _s(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Yt("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;const o=new _s(n,s);return o.idToken=i.idToken||void 0,o.accessToken=i.accessToken||void 0,o.secret=i.secret,o.nonce=i.nonce,o.pendingToken=i.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return ri(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,ri(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ri(e,t)}buildRequest(){const e={requestUri:WS,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Xo(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function YS(r){switch(r){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function XS(r){const e=ao(uo(r)).link,t=e?ao(uo(e)).deep_link_id:null,n=ao(uo(r)).deep_link_id;return(n?ao(uo(n)).link:null)||n||t||e||r}class sd{constructor(e){const t=ao(uo(e)),n=t.apiKey??null,s=t.oobCode??null,i=YS(t.mode??null);ie(n&&s&&i,"argument-error"),this.apiKey=n,this.operation=i,this.code=s,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=XS(e);try{return new sd(t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ki{constructor(){this.providerId=ki.PROVIDER_ID}static credential(e,t){return Yo._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const n=sd.parseLink(t);return ie(n,"argument-error"),Yo._fromEmailAndCode(e,n.code,n.tenantId)}}ki.PROVIDER_ID="password";ki.EMAIL_PASSWORD_SIGN_IN_METHOD="password";ki.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kE{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ma extends kE{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ir extends ma{constructor(){super("facebook.com")}static credential(e){return _s._fromParams({providerId:ir.PROVIDER_ID,signInMethod:ir.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return ir.credentialFromTaggedObject(e)}static credentialFromError(e){return ir.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return ir.credential(e.oauthAccessToken)}catch{return null}}}ir.FACEBOOK_SIGN_IN_METHOD="facebook.com";ir.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class or extends ma{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return _s._fromParams({providerId:or.PROVIDER_ID,signInMethod:or.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return or.credentialFromTaggedObject(e)}static credentialFromError(e){return or.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return or.credential(t,n)}catch{return null}}}or.GOOGLE_SIGN_IN_METHOD="google.com";or.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ar extends ma{constructor(){super("github.com")}static credential(e){return _s._fromParams({providerId:ar.PROVIDER_ID,signInMethod:ar.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return ar.credentialFromTaggedObject(e)}static credentialFromError(e){return ar.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return ar.credential(e.oauthAccessToken)}catch{return null}}}ar.GITHUB_SIGN_IN_METHOD="github.com";ar.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ur extends ma{constructor(){super("twitter.com")}static credential(e,t){return _s._fromParams({providerId:ur.PROVIDER_ID,signInMethod:ur.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return ur.credentialFromTaggedObject(e)}static credentialFromError(e){return ur.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return ur.credential(t,n)}catch{return null}}}ur.TWITTER_SIGN_IN_METHOD="twitter.com";ur.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function LE(r,e){return ga(r,"POST","/v1/accounts:signUp",Pr(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mn{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){const i=await $t._fromIdTokenResponse(e,n,s),o=kp(n);return new Mn({user:i,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const s=kp(n);return new Mn({user:e,providerId:s,_tokenResponse:n,operationType:t})}}function kp(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ak(r){var s;if(pt(r.app))return Promise.reject(hn(r));const e=Or(r);if(await e._initializationPromise,(s=e.currentUser)!=null&&s.isAnonymous)return new Mn({user:e.currentUser,providerId:null,operationType:"signIn"});const t=await LE(e,{returnSecureToken:!0}),n=await Mn._fromIdTokenResponse(e,"signIn",t,!0);return await e._updateCurrentUser(n.user),n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qu extends Kt{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,qu.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new qu(e,t,n,s)}}function xE(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?qu._fromErrorAndOperation(r,i,e,n):i})}async function ZS(r,e,t=!1){const n=await Wo(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return Mn._forOperation(r,"link",n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eP(r,e,t=!1){const{auth:n}=r;if(pt(n.app))return Promise.reject(hn(n));const s="reauthenticate";try{const i=await Wo(r,xE(n,s,e,r),t);ie(i.idToken,n,"internal-error");const o=td(i.idToken);ie(o,n,"internal-error");const{sub:a}=o;return ie(r.uid===a,n,"user-mismatch"),Mn._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&Yt(n,"user-mismatch"),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function VE(r,e,t=!1){if(pt(r.app))return Promise.reject(hn(r));const n="signIn",s=await xE(r,n,e),i=await Mn._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}async function tP(r,e){return VE(Or(r),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ME(r){const e=Or(r);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function uk(r,e,t){if(pt(r.app))return Promise.reject(hn(r));const n=Or(r),o=await yB(n,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",LE).catch(u=>{throw u.code==="auth/password-does-not-meet-requirements"&&ME(r),u}),a=await Mn._fromIdTokenResponse(n,"signIn",o);return await n._updateCurrentUser(a.user),a}function ck(r,e,t){return pt(r.app)?Promise.reject(hn(r)):tP(Ce(r),ki.credential(e,t)).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&ME(r),n})}function nP(r,e,t,n){return Ce(r).onIdTokenChanged(e,t,n)}function rP(r,e,t){return Ce(r).beforeAuthStateChanged(e,t)}function lk(r,e,t,n){return Ce(r).onAuthStateChanged(e,t,n)}function Bk(r){return Ce(r).signOut()}const ju="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GE{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(ju,"1"),this.storage.removeItem(ju),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sP=1e3,iP=10;class UE extends GE{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=SE(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,a,u)=>{this.notifyListeners(o,u)});return}const n=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},i=this.storage.getItem(n);bS()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,iP):s()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},sP)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}UE.type="LOCAL";const oP=UE;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class HE extends GE{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}HE.type="SESSION";const qE=HE;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aP(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nc{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const n=new Nc(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:s,data:i}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});const a=Array.from(o).map(async l=>l(t.origin,i)),u=await aP(a);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:u})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Nc.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function id(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uP{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,o;return new Promise((a,u)=>{const l=id("",20);s.port1.start();const B=setTimeout(()=>{u(new Error("unsupported_event"))},n);o={messageChannel:s,onMessage(d){const C=d;if(C.data.eventId===l)switch(C.data.status){case"ack":clearTimeout(B),i=setTimeout(()=>{u(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),a(C.data.response);break;default:clearTimeout(B),clearTimeout(i),u(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:l,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dn(){return window}function cP(r){dn().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jE(){return typeof dn().WorkerGlobalScope<"u"&&typeof dn().importScripts=="function"}async function lP(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function BP(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function hP(){return jE()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const KE="firebaseLocalStorageDb",dP=1,Ku="firebaseLocalStorage",JE="fbase_key";class _a{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Oc(r,e){return r.transaction([Ku],e?"readwrite":"readonly").objectStore(Ku)}function fP(){const r=indexedDB.deleteDatabase(KE);return new _a(r).toPromise()}function zE(){const r=indexedDB.open(KE,dP);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(Ku,{keyPath:JE})}catch(s){t(s)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(Ku)?e(n):(n.close(),await fP(),e(await zE()))})})}async function Lp(r,e,t){const n=Oc(r,!0).put({[JE]:e,value:t});return new _a(n).toPromise()}async function CP(r,e){const t=Oc(r,!1).get(e),n=await new _a(t).toPromise();return n===void 0?null:n.value}function xp(r,e){const t=Oc(r,!0).delete(e);return new _a(t).toPromise()}const pP=800,gP=3;class $E{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.dbPromise?this.dbPromise:(this.dbPromise=zE(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(t++>gP)throw n;if(this.dbPromise){const s=this.dbPromise;this.dbPromise=null;try{(await s).close()}catch{}}}}async initializeServiceWorkerMessaging(){return jE()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Nc._getInstance(hP()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await lP(),!this.activeServiceWorker)return;this.sender=new uP(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||BP()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await Lp(e,ju,"1"),await xp(e,ju)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>Lp(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>CP(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>xp(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{const e=await this._withRetries(s=>{const i=Oc(s,!1).getAll();return new _a(i).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}catch(e){return this.isClosing||hu(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),pP)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}$E.type="LOCAL";const mP=$E;new pa(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _P(r,e){return e?wn(e):(ie(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class od extends rd{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ri(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ri(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ri(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function EP(r){return VE(r.auth,new od(r),r.bypassAuthState)}function IP(r){const{auth:e,user:t}=r;return ie(t,e,"internal-error"),eP(t,new od(r),r.bypassAuthState)}async function DP(r){const{auth:e,user:t}=r;return ie(t,e,"internal-error"),ZS(t,new od(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class QE{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:o,type:a}=e;if(o){this.reject(o);return}const u={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(u))}catch(l){this.reject(l)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return EP;case"linkViaPopup":case"linkViaRedirect":return DP;case"reauthViaPopup":case"reauthViaRedirect":return IP;default:Yt(this.auth,"internal-error")}}resolve(e){Vn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Vn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wP=new pa(2e3,1e4);class Zs extends QE{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,Zs.currentPopupAction&&Zs.currentPopupAction.cancel(),Zs.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return ie(e,this.auth,"internal-error"),e}async onExecution(){Vn(this.filter.length===1,"Popup operations only handle one event");const e=id();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(Bn(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(Bn(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Zs.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Bn(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,wP.get())};e()}}Zs.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yP="pendingRedirect",Cu=new Map;class TP extends QE{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=Cu.get(this.auth._key());if(!e){try{const n=await AP(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}Cu.set(this.auth._key(),e)}return this.bypassAuthState||Cu.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function AP(r,e){const t=vP(e),n=bP(r);if(!await n._isAvailable())return!1;const s=await n._get(t)==="true";return await n._remove(t),s}function RP(r,e){Cu.set(r._key(),e)}function bP(r){return wn(r._redirectPersistence)}function vP(r){return fu(yP,r.config.apiKey,r.name)}async function SP(r,e,t=!1){if(pt(r.app))return Promise.reject(hn(r));const n=Or(r),s=_P(n,e),o=await new TP(n,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const PP=10*60*1e3;class NP{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!OP(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!WE(e)){const s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(Bn(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=PP&&this.cachedEventUids.clear(),this.cachedEventUids.has(Vp(e))}saveEventToCache(e){this.cachedEventUids.add(Vp(e)),this.lastProcessedEventTime=Date.now()}}function Vp(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function WE({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function OP(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return WE(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function FP(r,e={}){return Nr(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kP=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,LP=/^https?/;async function xP(r){if(r.config.emulator)return;const{authorizedDomains:e}=await FP(r);for(const t of e)try{if(VP(t))return}catch{}Yt(r,"unauthorized-domain")}function VP(r){const e=DB(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!LP.test(t))return!1;if(kP.test(r))return n===r;const s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const MP=new pa(3e4,6e4);function Mp(){const r=dn().___jsl;if(r!=null&&r.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function GP(r){return new Promise((e,t)=>{var s,i,o;function n(){Mp(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Mp(),t(Bn(r,"network-request-failed"))},timeout:MP.get()})}if((i=(s=dn().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((o=dn().gapi)!=null&&o.load)n();else{const a=xS("iframefcb");return dn()[a]=()=>{gapi.load?n():t(Bn(r,"network-request-failed"))},NE(`${LS()}?onload=${a}`).catch(u=>t(u))}}).catch(e=>{throw pu=null,e})}let pu=null;function UP(r){return pu=pu||GP(r),pu}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const HP=new pa(5e3,15e3),qP="__/auth/iframe",jP="emulator/auth/iframe",KP={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},JP=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function zP(r){const e=r.config;ie(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?ed(e,jP):`https://${r.config.authDomain}/${qP}`,n={apiKey:e.apiKey,appName:r.name,v:Ts},s=JP.get(r.config.apiHost);s&&(n.eid=s);const i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${Xo(n).slice(1)}`}async function $P(r){const e=await UP(r),t=dn().gapi;return ie(t,r,"internal-error"),e.open({where:document.body,url:zP(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:KP,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});const o=Bn(r,"network-request-failed"),a=dn().setTimeout(()=>{i(o)},HP.get());function u(){dn().clearTimeout(a),s(n)}n.ping(u).then(u,()=>{i(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const QP={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},WP=500,YP=600,XP="_blank",ZP="http://localhost";class Gp{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function e0(r,e,t,n=WP,s=YP){const i=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let a="";const u={...QP,width:n.toString(),height:s.toString(),top:i,left:o},l=$e().toLowerCase();t&&(a=TE(l)?XP:t),wE(l)&&(e=e||ZP,u.scrollbars="yes");const B=Object.entries(u).reduce((C,[g,D])=>`${C}${g}=${D},`,"");if(RS(l)&&a!=="_self")return t0(e||"",a),new Gp(null);const d=window.open(e||"",a,B);ie(d,r,"popup-blocked");try{d.focus()}catch{}return new Gp(d)}function t0(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const n0="__/auth/handler",r0="emulator/auth/handler",s0=encodeURIComponent("fac");async function Up(r,e,t,n,s,i){ie(r.config.authDomain,r,"auth-domain-config-required"),ie(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:Ts,eventId:s};if(e instanceof kE){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",$D(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[B,d]of Object.entries({}))o[B]=d}if(e instanceof ma){const B=e.getScopes().filter(d=>d!=="");B.length>0&&(o.scopes=B.join(","))}r.tenantId&&(o.tid=r.tenantId);const a=o;for(const B of Object.keys(a))a[B]===void 0&&delete a[B];const u=await r._getAppCheckToken(),l=u?`#${s0}=${encodeURIComponent(u)}`:"";return`${i0(r)}?${Xo(a).slice(1)}${l}`}function i0({config:r}){return r.emulator?ed(r,r0):`https://${r.authDomain}/${n0}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vl="webStorageSupport";class o0{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=qE,this._completeRedirectFn=SP,this._overrideRedirectResult=RP}async _openPopup(e,t,n,s){var o;Vn((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const i=await Up(e,t,n,DB(),s);return e0(e,i,id())}async _openRedirect(e,t,n,s){await this._originValidation(e);const i=await Up(e,t,n,DB(),s);return cP(i),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(Vn(i,"If manager is not set, promise should be"),i)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await $P(e),n=new NP(e);return t.register("authEvent",s=>(ie(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(vl,{type:vl},s=>{var o;const i=(o=s==null?void 0:s[0])==null?void 0:o[vl];i!==void 0&&t(!!i),Yt(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=xP(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return SE()||yE()||nd()}}const a0=o0;var Hp="@firebase/auth",qp="1.13.6";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u0{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){ie(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function c0(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function l0(r){Ht(new Lt("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=n.options;ie(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const u={apiKey:o,authDomain:a,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:PE(r)},l=new OS(n,s,i,u);return HS(l,t),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Ht(new Lt("auth-internal",e=>{const t=Or(e.getProvider("auth").getImmediate());return(n=>new u0(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ct(Hp,qp,c0(r)),ct(Hp,qp,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const B0=5*60,h0=Ig("authIdTokenMaxAge")||B0;let jp=null;const d0=r=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>h0)return;const s=t==null?void 0:t.token;jp!==s&&(jp=s,await fetch(r,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function hk(r=Zu()){const e=Ar(r,"auth");if(e.isInitialized())return e.getImmediate();const t=US(r,{popupRedirectResolver:a0,persistence:[mP,oP,qE]}),n=Ig("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const i=new URL(n,location.origin);if(location.origin===i.origin){const o=d0(i.toString());rP(t,o,()=>o(t.currentUser)),nP(t,a=>o(a))}}const s=mg("auth");return s&&qS(t,`http://${s}`),t}function f0(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}FS({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=s=>{const i=Bn("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",f0().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});l0("Browser");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const YE="firebasestorage.googleapis.com",XE="storageBucket",C0=2*60*1e3,p0=10*60*1e3,g0=1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe extends Kt{constructor(e,t,n=0){super(Sl(e),`Firebase Storage: ${t} (${Sl(e)})`),this.status_=n,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,xe.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return Sl(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var Oe;(function(r){r.UNKNOWN="unknown",r.OBJECT_NOT_FOUND="object-not-found",r.BUCKET_NOT_FOUND="bucket-not-found",r.PROJECT_NOT_FOUND="project-not-found",r.QUOTA_EXCEEDED="quota-exceeded",r.UNAUTHENTICATED="unauthenticated",r.UNAUTHORIZED="unauthorized",r.UNAUTHORIZED_APP="unauthorized-app",r.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",r.INVALID_CHECKSUM="invalid-checksum",r.CANCELED="canceled",r.INVALID_EVENT_NAME="invalid-event-name",r.INVALID_URL="invalid-url",r.INVALID_DEFAULT_BUCKET="invalid-default-bucket",r.NO_DEFAULT_BUCKET="no-default-bucket",r.CANNOT_SLICE_BLOB="cannot-slice-blob",r.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",r.NO_DOWNLOAD_URL="no-download-url",r.INVALID_ARGUMENT="invalid-argument",r.INVALID_ARGUMENT_COUNT="invalid-argument-count",r.APP_DELETED="app-deleted",r.INVALID_ROOT_OPERATION="invalid-root-operation",r.INVALID_FORMAT="invalid-format",r.INTERNAL_ERROR="internal-error",r.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(Oe||(Oe={}));function Sl(r){return"storage/"+r}function ad(){const r="An unknown error occurred, please check the error payload for server response.";return new xe(Oe.UNKNOWN,r)}function m0(r){return new xe(Oe.OBJECT_NOT_FOUND,"Object '"+r+"' does not exist.")}function _0(r){return new xe(Oe.QUOTA_EXCEEDED,"Quota for bucket '"+r+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function E0(){const r="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new xe(Oe.UNAUTHENTICATED,r)}function I0(){return new xe(Oe.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function D0(r){return new xe(Oe.UNAUTHORIZED,"User does not have permission to access '"+r+"'.")}function ZE(){return new xe(Oe.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function eI(){return new xe(Oe.CANCELED,"User canceled the upload/download.")}function w0(r){return new xe(Oe.INVALID_URL,"Invalid URL '"+r+"'.")}function y0(r){return new xe(Oe.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+r+"'.")}function T0(){return new xe(Oe.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+XE+"' property when initializing the app?")}function tI(){return new xe(Oe.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function A0(){return new xe(Oe.SERVER_FILE_WRONG_SIZE,"Server recorded incorrect upload file size, please retry the upload.")}function R0(){return new xe(Oe.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function b0(r){return new xe(Oe.UNSUPPORTED_ENVIRONMENT,`${r} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function TB(r){return new xe(Oe.INVALID_ARGUMENT,r)}function nI(){return new xe(Oe.APP_DELETED,"The Firebase app was deleted.")}function v0(r){return new xe(Oe.INVALID_ROOT_OPERATION,"The operation '"+r+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Ro(r,e){return new xe(Oe.INVALID_FORMAT,"String does not match format '"+r+"': "+e)}function oo(r){throw new xe(Oe.INTERNAL_ERROR,"Internal error: "+r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let n;try{n=Ft.makeFromUrl(e,t)}catch{return new Ft(e,"")}if(n.path==="")return n;throw y0(e)}static makeFromUrl(e,t){let n=null;const s="([A-Za-z0-9.\\-_]+)";function i(se){se.path.charAt(se.path.length-1)==="/"&&(se.path_=se.path_.slice(0,-1))}const o="(/(.*))?$",a=new RegExp("^gs://"+s+o,"i"),u={bucket:1,path:3};function l(se){se.path_=decodeURIComponent(se.path)}const B="v[A-Za-z0-9_]+",d=t.replace(/[.]/g,"\\."),C="(/([^?#]*).*)?$",g=new RegExp(`^https?://${d}/${B}/b/${s}/o${C}`,"i"),D={bucket:1,path:3},P=t===YE?"(?:storage.googleapis.com|storage.cloud.google.com)":t,x="([^?#]*)",J=new RegExp(`^https?://${P}/${s}/${x}`,"i"),Z=[{regex:a,indices:u,postModify:i},{regex:g,indices:D,postModify:l},{regex:J,indices:{bucket:1,path:2},postModify:l}];for(let se=0;se<Z.length;se++){const ue=Z[se],ae=ue.regex.exec(e);if(ae){const y=ae[ue.indices.bucket];let E=ae[ue.indices.path];E||(E=""),n=new Ft(y,E),ue.postModify(n);break}}if(n==null)throw w0(e);return n}}class S0{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function P0(r,e,t){let n=1,s=null,i=null,o=!1,a=0;function u(){return a===2}let l=!1;function B(...x){l||(l=!0,e.apply(null,x))}function d(x){s=setTimeout(()=>{s=null,r(g,u())},x)}function C(){i&&clearTimeout(i)}function g(x,...J){if(l){C();return}if(x){C(),B.call(null,x,...J);return}if(u()||o){C(),B.call(null,x,...J);return}n<64&&(n*=2);let Z;a===1?(a=2,Z=0):Z=(n+Math.random())*1e3,d(Z)}let D=!1;function P(x){D||(D=!0,C(),!l&&(s!==null?(x||(a=2),clearTimeout(s),d(0)):x||(a=1)))}return d(0),i=setTimeout(()=>{o=!0,P(!0)},t),P}function N0(r){r(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function O0(r){return r!==void 0}function F0(r){return typeof r=="function"}function k0(r){return typeof r=="object"&&!Array.isArray(r)}function Fc(r){return typeof r=="string"||r instanceof String}function Kp(r){return ud()&&r instanceof Blob}function ud(){return typeof Blob<"u"}function Jp(r,e,t,n){if(n<e)throw TB(`Invalid value for '${r}'. Expected ${e} or greater.`);if(n>t)throw TB(`Invalid value for '${r}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Li(r,e,t){let n=e;return t==null&&(n=`https://${e}`),`${t}://${n}/v0${r}`}function rI(r){const e=encodeURIComponent;let t="?";for(const n in r)if(r.hasOwnProperty(n)){const s=e(n)+"="+e(r[n]);t=t+s+"&"}return t=t.slice(0,-1),t}var us;(function(r){r[r.NO_ERROR=0]="NO_ERROR",r[r.NETWORK_ERROR=1]="NETWORK_ERROR",r[r.ABORT=2]="ABORT"})(us||(us={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sI(r,e){const t=r>=500&&r<600,s=[408,429].indexOf(r)!==-1,i=e.indexOf(r)!==-1;return t||s||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L0{constructor(e,t,n,s,i,o,a,u,l,B,d,C=!0,g=!1){this.url_=e,this.method_=t,this.headers_=n,this.body_=s,this.successCodes_=i,this.additionalRetryCodes_=o,this.callback_=a,this.errorCallback_=u,this.timeout_=l,this.progressCallback_=B,this.connectionFactory_=d,this.retry=C,this.isUsingEmulator=g,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((D,P)=>{this.resolve_=D,this.reject_=P,this.start_()})}start_(){const e=(n,s)=>{if(s){n(!1,new Ya(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const o=a=>{const u=a.loaded,l=a.lengthComputable?a.total:-1;this.progressCallback_!==null&&this.progressCallback_(u,l)};this.progressCallback_!==null&&i.addUploadProgressListener(o),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(o),this.pendingConnection_=null;const a=i.getErrorCode()===us.NO_ERROR,u=i.getStatus();if(!a||sI(u,this.additionalRetryCodes_)&&this.retry){const B=i.getErrorCode()===us.ABORT;n(!1,new Ya(!1,null,B));return}const l=this.successCodes_.indexOf(u)!==-1;n(!0,new Ya(l,i))})},t=(n,s)=>{const i=this.resolve_,o=this.reject_,a=s.connection;if(s.wasSuccessCode)try{const u=this.callback_(a,a.getResponse());O0(u)?i(u):i()}catch(u){o(u)}else if(a!==null){const u=ad();u.serverResponse=a.getErrorText(),this.errorCallback_?o(this.errorCallback_(a,u)):o(u)}else if(s.canceled){const u=this.appDelete_?nI():eI();o(u)}else{const u=ZE();o(u)}};this.canceled_?t(!1,new Ya(!1,null,!0)):this.backoffId_=P0(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&N0(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Ya{constructor(e,t,n){this.wasSuccessCode=e,this.connection=t,this.canceled=!!n}}function x0(r,e){e!==null&&e.length>0&&(r.Authorization="Firebase "+e)}function V0(r,e){r["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function M0(r,e){e&&(r["X-Firebase-GMPID"]=e)}function G0(r,e){e!==null&&(r["X-Firebase-AppCheck"]=e)}function U0(r,e,t,n,s,i,o=!0,a=!1){const u=rI(r.urlParams),l=r.url+u,B=Object.assign({},r.headers);return M0(B,e),x0(B,t),V0(B,i),G0(B,n),new L0(l,r.method,B,r.body,r.successCodes,r.additionalRetryCodes,r.handler,r.errorHandler,r.timeout,r.progressCallback,s,o,a)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function H0(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function q0(...r){const e=H0();if(e!==void 0){const t=new e;for(let n=0;n<r.length;n++)t.append(r[n]);return t.getBlob()}else{if(ud())return new Blob(r);throw new xe(Oe.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function j0(r,e,t){return r.webkitSlice?r.webkitSlice(e,t):r.mozSlice?r.mozSlice(e,t):r.slice?r.slice(e,t):null}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function K0(r){if(typeof atob>"u")throw b0("base-64");return atob(r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qt={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class Pl{constructor(e,t){this.data=e,this.contentType=t||null}}function iI(r,e){switch(r){case Qt.RAW:return new Pl(oI(e));case Qt.BASE64:case Qt.BASE64URL:return new Pl(aI(r,e));case Qt.DATA_URL:return new Pl(z0(e),$0(e))}throw ad()}function oI(r){const e=[];for(let t=0;t<r.length;t++){let n=r.charCodeAt(t);if(n<=127)e.push(n);else if(n<=2047)e.push(192|n>>6,128|n&63);else if((n&64512)===55296)if(!(t<r.length-1&&(r.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=n,o=r.charCodeAt(++t);n=65536|(i&1023)<<10|o&1023,e.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|n&63)}else(n&64512)===56320?e.push(239,191,189):e.push(224|n>>12,128|n>>6&63,128|n&63)}return new Uint8Array(e)}function J0(r){let e;try{e=decodeURIComponent(r)}catch{throw Ro(Qt.DATA_URL,"Malformed data URL.")}return oI(e)}function aI(r,e){switch(r){case Qt.BASE64:{const s=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(s||i)throw Ro(r,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case Qt.BASE64URL:{const s=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(s||i)throw Ro(r,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=K0(e)}catch(s){throw s.message.includes("polyfill")?s:Ro(r,"Invalid character found")}const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}class uI{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Ro(Qt.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const n=t[1]||null;n!=null&&(this.base64=Q0(n,";base64"),this.contentType=this.base64?n.substring(0,n.length-7):n),this.rest=e.substring(e.indexOf(",")+1)}}function z0(r){const e=new uI(r);return e.base64?aI(Qt.BASE64,e.rest):J0(e.rest)}function $0(r){return new uI(r).contentType}function Q0(r,e){return r.length>=e.length?r.substring(r.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _n{constructor(e,t){let n=0,s="";Kp(e)?(this.data_=e,n=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),n=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),n=e.length),this.size_=n,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(Kp(this.data_)){const n=this.data_,s=j0(n,e,t);return s===null?null:new _n(s)}else{const n=new Uint8Array(this.data_.buffer,e,t-e);return new _n(n,!0)}}static getBlob(...e){if(ud()){const t=e.map(n=>n instanceof _n?n.data_:n);return new _n(q0.apply(null,t))}else{const t=e.map(o=>Fc(o)?iI(Qt.RAW,o).data:o.data_);let n=0;t.forEach(o=>{n+=o.byteLength});const s=new Uint8Array(n);let i=0;return t.forEach(o=>{for(let a=0;a<o.length;a++)s[i++]=o[a]}),new _n(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cI(r){let e;try{e=JSON.parse(r)}catch{return null}return k0(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function W0(r){if(r.length===0)return null;const e=r.lastIndexOf("/");return e===-1?"":r.slice(0,e)}function Y0(r,e){const t=e.split("/").filter(n=>n.length>0).join("/");return r.length===0?t:r+"/"+t}function lI(r){const e=r.lastIndexOf("/",r.length-2);return e===-1?r:r.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X0(r,e){return e}class Ct{constructor(e,t,n,s){this.server=e,this.local=t||e,this.writable=!!n,this.xform=s||X0}}let Xa=null;function Z0(r){return!Fc(r)||r.length<2?r:lI(r)}function cd(){if(Xa)return Xa;const r=[];r.push(new Ct("bucket")),r.push(new Ct("generation")),r.push(new Ct("metageneration")),r.push(new Ct("name","fullPath",!0));function e(i,o){return Z0(o)}const t=new Ct("name");t.xform=e,r.push(t);function n(i,o){return o!==void 0?Number(o):o}const s=new Ct("size");return s.xform=n,r.push(s),r.push(new Ct("timeCreated")),r.push(new Ct("updated")),r.push(new Ct("md5Hash",null,!0)),r.push(new Ct("cacheControl",null,!0)),r.push(new Ct("contentDisposition",null,!0)),r.push(new Ct("contentEncoding",null,!0)),r.push(new Ct("contentLanguage",null,!0)),r.push(new Ct("contentType",null,!0)),r.push(new Ct("metadata","customMetadata",!0)),Xa=r,Xa}function eN(r,e){function t(){const n=r.bucket,s=r.fullPath,i=new Ft(n,s);return e._makeStorageReference(i)}Object.defineProperty(r,"ref",{get:t})}function tN(r,e,t){const n={};n.type="file";const s=t.length;for(let i=0;i<s;i++){const o=t[i];n[o.local]=o.xform(n,e[o.server])}return eN(n,r),n}function BI(r,e,t){const n=cI(e);return n===null?null:tN(r,n,t)}function nN(r,e,t,n){const s=cI(e);if(s===null||!Fc(s.downloadTokens))return null;const i=s.downloadTokens;if(i.length===0)return null;const o=encodeURIComponent;return i.split(",").map(l=>{const B=r.bucket,d=r.fullPath,C="/b/"+o(B)+"/o/"+o(d),g=Li(C,t,n),D=rI({alt:"media",token:l});return g+D})[0]}function hI(r,e){const t={},n=e.length;for(let s=0;s<n;s++){const i=e[s];i.writable&&(t[i.server]=r[i.local])}return JSON.stringify(t)}class Os{constructor(e,t,n,s){this.url=e,this.method=t,this.handler=n,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vn(r){if(!r)throw ad()}function ld(r,e){function t(n,s){const i=BI(r,s,e);return vn(i!==null),i}return t}function rN(r,e){function t(n,s){const i=BI(r,s,e);return vn(i!==null),nN(i,s,r.host,r._protocol)}return t}function Ea(r){function e(t,n){let s;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?s=I0():s=E0():t.getStatus()===402?s=_0(r.bucket):t.getStatus()===403?s=D0(r.path):s=n,s.status=t.getStatus(),s.serverResponse=n.serverResponse,s}return e}function Bd(r){const e=Ea(r);function t(n,s){let i=e(n,s);return n.getStatus()===404&&(i=m0(r.path)),i.serverResponse=s.serverResponse,i}return t}function sN(r,e,t){const n=e.fullServerUrl(),s=Li(n,r.host,r._protocol),i="GET",o=r.maxOperationRetryTime,a=new Os(s,i,ld(r,t),o);return a.errorHandler=Bd(e),a}function iN(r,e,t){const n=e.fullServerUrl(),s=Li(n,r.host,r._protocol),i="GET",o=r.maxOperationRetryTime,a=new Os(s,i,rN(r,t),o);return a.errorHandler=Bd(e),a}function oN(r,e){const t=e.fullServerUrl(),n=Li(t,r.host,r._protocol),s="DELETE",i=r.maxOperationRetryTime;function o(u,l){}const a=new Os(n,s,o,i);return a.successCodes=[200,204],a.errorHandler=Bd(e),a}function aN(r,e){return r&&r.contentType||e&&e.type()||"application/octet-stream"}function dI(r,e,t){const n=Object.assign({},t);return n.fullPath=r.path,n.size=e.size(),n.contentType||(n.contentType=aN(null,e)),n}function fI(r,e,t,n,s){const i=e.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"};function a(){let Z="";for(let se=0;se<2;se++)Z=Z+Math.random().toString().slice(2);return Z}const u=a();o["Content-Type"]="multipart/related; boundary="+u;const l=dI(e,n,s),B=hI(l,t),d="--"+u+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+B+`\r
--`+u+`\r
Content-Type: `+l.contentType+`\r
\r
`,C=`\r
--`+u+"--",g=_n.getBlob(d,n,C);if(g===null)throw tI();const D={name:l.fullPath},P=Li(i,r.host,r._protocol),x="POST",J=r.maxUploadRetryTime,X=new Os(P,x,ld(r,t),J);return X.urlParams=D,X.headers=o,X.body=g.uploadData(),X.errorHandler=Ea(e),X}class Ju{constructor(e,t,n,s){this.current=e,this.total=t,this.finalized=!!n,this.metadata=s||null}}function hd(r,e){let t=null;try{t=r.getResponseHeader("X-Goog-Upload-Status")}catch{vn(!1)}return vn(!!t&&(e||["active"]).indexOf(t)!==-1),t}function uN(r,e,t,n,s){const i=e.bucketOnlyServerUrl(),o=dI(e,n,s),a={name:o.fullPath},u=Li(i,r.host,r._protocol),l="POST",B={"X-Goog-Upload-Protocol":"resumable","X-Goog-Upload-Command":"start","X-Goog-Upload-Header-Content-Length":`${n.size()}`,"X-Goog-Upload-Header-Content-Type":o.contentType,"Content-Type":"application/json; charset=utf-8"},d=hI(o,t),C=r.maxUploadRetryTime;function g(P){hd(P);let x;try{x=P.getResponseHeader("X-Goog-Upload-URL")}catch{vn(!1)}return vn(Fc(x)),x}const D=new Os(u,l,g,C);return D.urlParams=a,D.headers=B,D.body=d,D.errorHandler=Ea(e),D}function cN(r,e,t,n){const s={"X-Goog-Upload-Command":"query"};function i(l){const B=hd(l,["active","final"]);let d=null;try{d=l.getResponseHeader("X-Goog-Upload-Size-Received")}catch{vn(!1)}d||vn(!1);const C=Number(d);return vn(!isNaN(C)),new Ju(C,n.size(),B==="final")}const o="POST",a=r.maxUploadRetryTime,u=new Os(t,o,i,a);return u.headers=s,u.errorHandler=Ea(e),u}const zp=256*1024;function lN(r,e,t,n,s,i,o,a){const u=new Ju(0,0);if(o?(u.current=o.current,u.total=o.total):(u.current=0,u.total=n.size()),n.size()!==u.total)throw A0();const l=u.total-u.current;let B=l;s>0&&(B=Math.min(B,s));const d=u.current,C=d+B;let g="";B===0?g="finalize":l===B?g="upload, finalize":g="upload";const D={"X-Goog-Upload-Command":g,"X-Goog-Upload-Offset":`${u.current}`},P=n.slice(d,C);if(P===null)throw tI();function x(se,ue){const ae=hd(se,["active","final"]),y=u.current+B,E=n.size();let w;return ae==="final"?w=ld(e,i)(se,ue):w=null,new Ju(y,E,ae==="final",w)}const J="POST",X=e.maxUploadRetryTime,Z=new Os(t,J,x,X);return Z.headers=D,Z.body=P.uploadData(),Z.progressCallback=a||null,Z.errorHandler=Ea(r),Z}const Dt={RUNNING:"running",PAUSED:"paused",SUCCESS:"success",CANCELED:"canceled",ERROR:"error"};function Nl(r){switch(r){case"running":case"pausing":case"canceling":return Dt.RUNNING;case"paused":return Dt.PAUSED;case"success":return Dt.SUCCESS;case"canceled":return Dt.CANCELED;case"error":return Dt.ERROR;default:return Dt.ERROR}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class BN{constructor(e,t,n){if(F0(e)||t!=null||n!=null)this.next=e,this.error=t??void 0,this.complete=n??void 0;else{const i=e;this.next=i.next,this.error=i.error,this.complete=i.complete}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ks(r){return(...e)=>{Promise.resolve().then(()=>r(...e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hN{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=us.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=us.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=us.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,n,s,i){if(this.sent_)throw oo("cannot .send() more than once");if(Gn(e)&&n&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const o in i)i.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,i[o].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw oo("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw oo("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw oo("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw oo("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class dN extends hN{initXhr(){this.xhr_.responseType="text"}}function cr(){return new dN}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fN{isExponentialBackoffExpired(){return this.sleepTime>this.maxSleepTime}constructor(e,t,n=null){this._transferred=0,this._needToFetchStatus=!1,this._needToFetchMetadata=!1,this._observers=[],this._error=void 0,this._uploadUrl=void 0,this._request=void 0,this._chunkMultiplier=1,this._resolve=void 0,this._reject=void 0,this._ref=e,this._blob=t,this._metadata=n,this._mappings=cd(),this._resumable=this._shouldDoResumable(this._blob),this._state="running",this._errorHandler=s=>{if(this._request=void 0,this._chunkMultiplier=1,s._codeEquals(Oe.CANCELED))this._needToFetchStatus=!0,this.completeTransitions_();else{const i=this.isExponentialBackoffExpired();if(sI(s.status,[]))if(i)s=ZE();else{this.sleepTime=Math.max(this.sleepTime*2,g0),this._needToFetchStatus=!0,this.completeTransitions_();return}this._error=s,this._transition("error")}},this._metadataErrorHandler=s=>{this._request=void 0,s._codeEquals(Oe.CANCELED)?this.completeTransitions_():(this._error=s,this._transition("error"))},this.sleepTime=0,this.maxSleepTime=this._ref.storage.maxUploadRetryTime,this._promise=new Promise((s,i)=>{this._resolve=s,this._reject=i,this._start()}),this._promise.then(null,()=>{})}_makeProgressCallback(){const e=this._transferred;return t=>this._updateProgress(e+t)}_shouldDoResumable(e){return e.size()>256*1024}_start(){this._state==="running"&&this._request===void 0&&(this._resumable?this._uploadUrl===void 0?this._createResumable():this._needToFetchStatus?this._fetchStatus():this._needToFetchMetadata?this._fetchMetadata():this.pendingTimeout=setTimeout(()=>{this.pendingTimeout=void 0,this._continueUpload()},this.sleepTime):this._oneShotUpload())}_resolveToken(e){Promise.all([this._ref.storage._getAuthToken(),this._ref.storage._getAppCheckToken()]).then(([t,n])=>{switch(this._state){case"running":e(t,n);break;case"canceling":this._transition("canceled");break;case"pausing":this._transition("paused");break}})}_createResumable(){this._resolveToken((e,t)=>{const n=uN(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(n,cr,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._uploadUrl=i,this._needToFetchStatus=!1,this.completeTransitions_()},this._errorHandler)})}_fetchStatus(){const e=this._uploadUrl;this._resolveToken((t,n)=>{const s=cN(this._ref.storage,this._ref._location,e,this._blob),i=this._ref.storage._makeRequest(s,cr,t,n);this._request=i,i.getPromise().then(o=>{o=o,this._request=void 0,this._updateProgress(o.current),this._needToFetchStatus=!1,o.finalized&&(this._needToFetchMetadata=!0),this.completeTransitions_()},this._errorHandler)})}_continueUpload(){const e=zp*this._chunkMultiplier,t=new Ju(this._transferred,this._blob.size()),n=this._uploadUrl;this._resolveToken((s,i)=>{let o;try{o=lN(this._ref._location,this._ref.storage,n,this._blob,e,this._mappings,t,this._makeProgressCallback())}catch(u){this._error=u,this._transition("error");return}const a=this._ref.storage._makeRequest(o,cr,s,i,!1);this._request=a,a.getPromise().then(u=>{this._increaseMultiplier(),this._request=void 0,this._updateProgress(u.current),u.finalized?(this._metadata=u.metadata,this._transition("success")):this.completeTransitions_()},this._errorHandler)})}_increaseMultiplier(){zp*this._chunkMultiplier*2<32*1024*1024&&(this._chunkMultiplier*=2)}_fetchMetadata(){this._resolveToken((e,t)=>{const n=sN(this._ref.storage,this._ref._location,this._mappings),s=this._ref.storage._makeRequest(n,cr,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._metadata=i,this._transition("success")},this._metadataErrorHandler)})}_oneShotUpload(){this._resolveToken((e,t)=>{const n=fI(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(n,cr,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._metadata=i,this._updateProgress(this._blob.size()),this._transition("success")},this._errorHandler)})}_updateProgress(e){const t=this._transferred;this._transferred=e,this._transferred!==t&&this._notifyObservers()}_transition(e){if(this._state!==e)switch(e){case"canceling":case"pausing":this._state=e,this._request!==void 0?this._request.cancel():this.pendingTimeout&&(clearTimeout(this.pendingTimeout),this.pendingTimeout=void 0,this.completeTransitions_());break;case"running":const t=this._state==="paused";this._state=e,t&&(this._notifyObservers(),this._start());break;case"paused":this._state=e,this._notifyObservers();break;case"canceled":this._error=eI(),this._state=e,this._notifyObservers();break;case"error":this._state=e,this._notifyObservers();break;case"success":this._state=e,this._notifyObservers();break}}completeTransitions_(){switch(this._state){case"pausing":this._transition("paused");break;case"canceling":this._transition("canceled");break;case"running":this._start();break}}get snapshot(){const e=Nl(this._state);return{bytesTransferred:this._transferred,totalBytes:this._blob.size(),state:e,metadata:this._metadata,task:this,ref:this._ref}}on(e,t,n,s){const i=new BN(t||void 0,n||void 0,s||void 0);return this._addObserver(i),()=>{this._removeObserver(i)}}then(e,t){return this._promise.then(e,t)}catch(e){return this.then(null,e)}_addObserver(e){this._observers.push(e),this._notifyObserver(e)}_removeObserver(e){const t=this._observers.indexOf(e);t!==-1&&this._observers.splice(t,1)}_notifyObservers(){this._finishPromise(),this._observers.slice().forEach(t=>{this._notifyObserver(t)})}_finishPromise(){if(this._resolve!==void 0){let e=!0;switch(Nl(this._state)){case Dt.SUCCESS:Ks(this._resolve.bind(null,this.snapshot))();break;case Dt.CANCELED:case Dt.ERROR:const t=this._reject;Ks(t.bind(null,this._error))();break;default:e=!1;break}e&&(this._resolve=void 0,this._reject=void 0)}}_notifyObserver(e){switch(Nl(this._state)){case Dt.RUNNING:case Dt.PAUSED:e.next&&Ks(e.next.bind(e,this.snapshot))();break;case Dt.SUCCESS:e.complete&&Ks(e.complete.bind(e))();break;case Dt.CANCELED:case Dt.ERROR:e.error&&Ks(e.error.bind(e,this._error))();break;default:e.error&&Ks(e.error.bind(e,this._error))()}}resume(){const e=this._state==="paused"||this._state==="pausing";return e&&this._transition("running"),e}pause(){const e=this._state==="running";return e&&this._transition("pausing"),e}cancel(){const e=this._state==="running"||this._state==="pausing";return e&&this._transition("canceling"),e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Es{constructor(e,t){this._service=e,t instanceof Ft?this._location=t:this._location=Ft.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new Es(e,t)}get root(){const e=new Ft(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return lI(this._location.path)}get storage(){return this._service}get parent(){const e=W0(this._location.path);if(e===null)return null;const t=new Ft(this._location.bucket,e);return new Es(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw v0(e)}}function CI(r,e,t){r._throwIfRoot("uploadBytes");const n=fI(r.storage,r._location,cd(),new _n(e,!0),t);return r.storage.makeRequestWithTokens(n,cr).then(s=>({metadata:s,ref:r}))}function CN(r,e,t){return r._throwIfRoot("uploadBytesResumable"),new fN(r,new _n(e),t)}function pN(r,e,t=Qt.RAW,n){r._throwIfRoot("uploadString");const s=iI(t,e),i={...n};return i.contentType==null&&s.contentType!=null&&(i.contentType=s.contentType),CI(r,s.data,i)}function gN(r){r._throwIfRoot("getDownloadURL");const e=iN(r.storage,r._location,cd());return r.storage.makeRequestWithTokens(e,cr).then(t=>{if(t===null)throw R0();return t})}function mN(r){r._throwIfRoot("deleteObject");const e=oN(r.storage,r._location);return r.storage.makeRequestWithTokens(e,cr)}function _N(r,e){const t=Y0(r._location.path,e),n=new Ft(r._location.bucket,t);return new Es(r.storage,n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function EN(r){return/^[A-Za-z]+:\/\//.test(r)}function IN(r,e){return new Es(r,e)}function pI(r,e){if(r instanceof dd){const t=r;if(t._bucket==null)throw T0();const n=new Es(t,t._bucket);return e!=null?pI(n,e):n}else return e!==void 0?_N(r,e):r}function DN(r,e){if(e&&EN(e)){if(r instanceof dd)return IN(r,e);throw TB("To use ref(service, url), the first argument must be a Storage instance.")}else return pI(r,e)}function $p(r,e){const t=e==null?void 0:e[XE];return t==null?null:Ft.makeFromBucketSpec(t,r)}function wN(r,e,t,n={}){r.host=`${e}:${t}`;const s=Gn(e);s&&Yu(`https://${r.host}/b`),r._isUsingEmulator=!0,r._protocol=s?"https":"http";const{mockUserToken:i}=n;i&&(r._overrideAuthToken=typeof i=="string"?i:MD(i,r.app.options.projectId))}class dd{constructor(e,t,n,s,i,o=!1){this.app=e,this._authProvider=t,this._appCheckProvider=n,this._url=s,this._firebaseVersion=i,this._isUsingEmulator=o,this._bucket=null,this._host=YE,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=C0,this._maxUploadRetryTime=p0,this._requests=new Set,s!=null?this._bucket=Ft.makeFromBucketSpec(s,this._host):this._bucket=$p(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=Ft.makeFromBucketSpec(this._url,e):this._bucket=$p(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){Jp("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){Jp("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(pt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Es(this,e)}_makeRequest(e,t,n,s,i=!0){if(this._deleted)return new S0(nI());{const o=U0(e,this._appId,n,s,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(o),o.getPromise().then(()=>this._requests.delete(o),()=>this._requests.delete(o)),o}}async makeRequestWithTokens(e,t){const[n,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,n,s).getPromise()}}const Qp="@firebase/storage",Wp="0.14.5";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gI="storage";function dk(r,e,t){return r=Ce(r),CI(r,e,t)}function fk(r,e,t,n){return r=Ce(r),pN(r,e,t,n)}function Ck(r,e,t){return r=Ce(r),CN(r,e,t)}function pk(r){return r=Ce(r),gN(r)}function gk(r){return r=Ce(r),mN(r)}function mk(r,e){return r=Ce(r),DN(r,e)}function _k(r=Zu(),e){r=Ce(r);const n=Ar(r,gI).getImmediate({identifier:e}),s=_g("storage");return s&&yN(n,...s),n}function yN(r,e,t,n={}){wN(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TN(r,{instanceIdentifier:e}){const t=r.getProvider("app").getImmediate(),n=r.getProvider("auth-internal"),s=r.getProvider("app-check-internal");return new dd(t,n,s,e,Ts)}function AN(){Ht(new Lt(gI,TN,"PUBLIC").setMultipleInstances(!0)),ct(Qp,Wp,""),ct(Qp,Wp,"esm2020")}AN();const mI="@firebase/installations",fd="0.6.24";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _I=1e4,EI=`w:${fd}`,II="FIS_v2",RN="https://firebaseinstallations.googleapis.com/v1",bN=60*60*1e3,vN="installations",SN="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const PN={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},Is=new ys(vN,SN,PN);function DI(r){return r instanceof Kt&&r.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wI({projectId:r}){return`${RN}/projects/${r}/installations`}function yI(r){return{token:r.token,requestStatus:2,expiresIn:ON(r.expiresIn),creationTime:Date.now()}}async function TI(r,e){const n=(await e.json()).error;return Is.create("request-failed",{requestName:r,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function AI({apiKey:r}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":r})}function NN(r,{refreshToken:e}){const t=AI(r);return t.append("Authorization",FN(e)),t}async function RI(r){const e=await r();return e.status>=500&&e.status<600?r():e}function ON(r){return Number(r.replace("s","000"))}function FN(r){return`${II} ${r}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function kN({appConfig:r,heartbeatServiceProvider:e},{fid:t}){const n=wI(r),s=AI(r),i=e.getImmediate({optional:!0});if(i){const l=await i.getHeartbeatsHeader();l&&s.append("x-firebase-client",l)}const o={fid:t,authVersion:II,appId:r.appId,sdkVersion:EI},a={method:"POST",headers:s,body:JSON.stringify(o)},u=await RI(()=>fetch(n,a));if(u.ok){const l=await u.json();return{fid:l.fid||t,registrationStatus:2,refreshToken:l.refreshToken,authToken:yI(l.authToken)}}else throw await TI("Create Installation",u)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bI(r){return new Promise(e=>{setTimeout(e,r)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function LN(r){return btoa(String.fromCharCode(...r)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xN=/^[cdef][\w-]{21}$/,AB="";function VN(){try{const r=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(r),r[0]=112+r[0]%16;const t=MN(r);return xN.test(t)?t:AB}catch{return AB}}function MN(r){return LN(r).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xi(r){return`${r.appName}!${r.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ii=new Map;function vI(r,e){const t=xi(r);SI(t,e),HN(t,e)}function GN(r,e){PI();const t=xi(r);let n=Ii.get(t);n||(n=new Set,Ii.set(t,n)),n.add(e)}function UN(r,e){const t=xi(r),n=Ii.get(t);n&&(n.delete(e),n.size===0&&Ii.delete(t),NI())}function SI(r,e){const t=Ii.get(r);if(t)for(const n of t)n(e)}function HN(r,e){const t=PI();t&&t.postMessage({key:r,fid:e}),NI()}let Zr=null;function PI(){return!Zr&&"BroadcastChannel"in self&&(Zr=new BroadcastChannel("[Firebase] FID Change"),Zr.onmessage=r=>{SI(r.data.key,r.data.fid)}),Zr}function NI(){Ii.size===0&&Zr&&(Zr.close(),Zr=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qN="firebase-installations-database",jN=1,Ds="firebase-installations-store";let Ol=null;function Cd(){return Ol||(Ol=Xu(qN,jN,{upgrade:(r,e)=>{switch(e){case 0:r.createObjectStore(Ds)}}})),Ol}async function zu(r,e){const t=xi(r),s=(await Cd()).transaction(Ds,"readwrite"),i=s.objectStore(Ds),o=await i.get(t);return await i.put(e,t),await s.done,(!o||o.fid!==e.fid)&&vI(r,e.fid),e}async function OI(r){const e=xi(r),n=(await Cd()).transaction(Ds,"readwrite");await n.objectStore(Ds).delete(e),await n.done}async function kc(r,e){const t=xi(r),s=(await Cd()).transaction(Ds,"readwrite"),i=s.objectStore(Ds),o=await i.get(t),a=e(o);return a===void 0?await i.delete(t):await i.put(a,t),await s.done,a&&(!o||o.fid!==a.fid)&&vI(r,a.fid),a}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pd(r){let e;const t=await kc(r.appConfig,n=>{const s=KN(n),i=JN(r,s);return e=i.registrationPromise,i.installationEntry});return t.fid===AB?{installationEntry:await e}:{installationEntry:t,registrationPromise:e}}function KN(r){const e=r||{fid:VN(),registrationStatus:0};return FI(e)}function JN(r,e){if(e.registrationStatus===0){if(!navigator.onLine){const s=Promise.reject(Is.create("app-offline"));return{installationEntry:e,registrationPromise:s}}const t={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},n=zN(r,t);return{installationEntry:t,registrationPromise:n}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:$N(r)}:{installationEntry:e}}async function zN(r,e){try{const t=await kN(r,e);return zu(r.appConfig,t)}catch(t){throw DI(t)&&t.customData.serverCode===409?await OI(r.appConfig):await zu(r.appConfig,{fid:e.fid,registrationStatus:0}),t}}async function $N(r){let e=await Yp(r.appConfig);for(;e.registrationStatus===1;)await bI(100),e=await Yp(r.appConfig);if(e.registrationStatus===0){const{installationEntry:t,registrationPromise:n}=await pd(r);return n||t}return e}function Yp(r){return kc(r,e=>{if(!e)throw Is.create("installation-not-found");return FI(e)})}function FI(r){return QN(r)?{fid:r.fid,registrationStatus:0}:r}function QN(r){return r.registrationStatus===1&&r.registrationTime+_I<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function WN({appConfig:r,heartbeatServiceProvider:e},t){const n=YN(r,t),s=NN(r,t),i=e.getImmediate({optional:!0});if(i){const l=await i.getHeartbeatsHeader();l&&s.append("x-firebase-client",l)}const o={installation:{sdkVersion:EI,appId:r.appId}},a={method:"POST",headers:s,body:JSON.stringify(o)},u=await RI(()=>fetch(n,a));if(u.ok){const l=await u.json();return yI(l)}else throw await TI("Generate Auth Token",u)}function YN(r,{fid:e}){return`${wI(r)}/${e}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function gd(r,e=!1){let t;const n=await kc(r.appConfig,i=>{if(!kI(i))throw Is.create("not-registered");const o=i.authToken;if(!e&&eO(o))return i;if(o.requestStatus===1)return t=XN(r,e),i;{if(!navigator.onLine)throw Is.create("app-offline");const a=nO(i);return t=ZN(r,a),a}});return t?await t:n.authToken}async function XN(r,e){let t=await Xp(r.appConfig);for(;t.authToken.requestStatus===1;)await bI(100),t=await Xp(r.appConfig);const n=t.authToken;return n.requestStatus===0?gd(r,e):n}function Xp(r){return kc(r,e=>{if(!kI(e))throw Is.create("not-registered");const t=e.authToken;return rO(t)?{...e,authToken:{requestStatus:0}}:e})}async function ZN(r,e){try{const t=await WN(r,e),n={...e,authToken:t};return await zu(r.appConfig,n),t}catch(t){if(DI(t)&&(t.customData.serverCode===401||t.customData.serverCode===404))await OI(r.appConfig);else{const n={...e,authToken:{requestStatus:0}};await zu(r.appConfig,n)}throw t}}function kI(r){return r!==void 0&&r.registrationStatus===2}function eO(r){return r.requestStatus===2&&!tO(r)}function tO(r){const e=Date.now();return e<r.creationTime||r.creationTime+r.expiresIn<e+bN}function nO(r){const e={requestStatus:1,requestTime:Date.now()};return{...r,authToken:e}}function rO(r){return r.requestStatus===1&&r.requestTime+_I<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sO(r){const e=r,{installationEntry:t,registrationPromise:n}=await pd(e);return n?n.catch(console.error):gd(e).catch(console.error),t.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function iO(r,e=!1){const t=r;return await oO(t),(await gd(t,e)).token}async function oO(r){const{registrationPromise:e}=await pd(r);e&&await e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aO(r,e){const{appConfig:t}=r;return GN(t,e),()=>{UN(t,e)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uO(r){if(!r||!r.options)throw Fl("App Configuration");if(!r.name)throw Fl("App Name");const e=["projectId","apiKey","appId"];for(const t of e)if(!r.options[t])throw Fl(t);return{appName:r.name,projectId:r.options.projectId,apiKey:r.options.apiKey,appId:r.options.appId}}function Fl(r){return Is.create("missing-app-config-values",{valueName:r})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LI="installations",cO="installations-internal",lO=r=>{const e=r.getProvider("app").getImmediate(),t=uO(e),n=Ar(e,"heartbeat");return{app:e,appConfig:t,heartbeatServiceProvider:n,_delete:()=>Promise.resolve()}},BO=r=>{const e=r.getProvider("app").getImmediate(),t=Ar(e,LI).getImmediate();return{getId:()=>sO(t),getToken:s=>iO(t,s)}};function hO(){Ht(new Lt(LI,lO,"PUBLIC")),Ht(new Lt(cO,BO,"PRIVATE"))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */hO();ct(mI,fd);ct(mI,fd,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dO="/firebase-messaging-sw.js",fO="/firebase-cloud-messaging-push-scope",xI="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",CO="https://fcmregistrations.googleapis.com/v1",VI="google.c.a.c_id",pO="google.c.a.c_l",gO="google.c.a.ts",mO="google.c.a.e",Zp=1e4;var eg;(function(r){r[r.DATA_MESSAGE=1]="DATA_MESSAGE",r[r.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(eg||(eg={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var Di;(function(r){r.PUSH_RECEIVED="push-received",r.NOTIFICATION_CLICKED="notification-clicked",r.FID_REGISTERED="fid-registered"})(Di||(Di={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zt(r){const e=new Uint8Array(r);return btoa(String.fromCharCode(...e)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function MI(r){const e="=".repeat((4-r.length%4)%4),t=(r+e).replace(/\-/g,"+").replace(/_/g,"/"),n=atob(t),s=new Uint8Array(n.length);for(let i=0;i<n.length;++i)s[i]=n.charCodeAt(i);return s}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kl="fcm_token_details_db",_O=5,tg="fcm_token_object_Store";async function EO(r){if("databases"in indexedDB&&!(await indexedDB.databases()).map(i=>i.name).includes(kl))return null;let e=null;return(await Xu(kl,_O,{upgrade:async(n,s,i,o)=>{if(s<2||!n.objectStoreNames.contains(tg))return;const a=o.objectStore(tg),u=await a.index("fcmSenderId").get(r);if(await a.clear(),!!u){if(s===2){const l=u;if(!l.auth||!l.p256dh||!l.endpoint)return;e={token:l.fcmToken,createTime:l.createTime??Date.now(),subscriptionOptions:{auth:l.auth,p256dh:l.p256dh,endpoint:l.endpoint,swScope:l.swScope,vapidKey:typeof l.vapidKey=="string"?l.vapidKey:zt(l.vapidKey)}}}else if(s===3){const l=u;e={token:l.fcmToken,createTime:l.createTime,subscriptionOptions:{auth:zt(l.auth),p256dh:zt(l.p256dh),endpoint:l.endpoint,swScope:l.swScope,vapidKey:zt(l.vapidKey)}}}else if(s===4){const l=u;e={token:l.fcmToken,createTime:l.createTime,subscriptionOptions:{auth:zt(l.auth),p256dh:zt(l.p256dh),endpoint:l.endpoint,swScope:l.swScope,vapidKey:zt(l.vapidKey)}}}}}})).close(),await Za(kl),await Za("fcm_vapid_details_db"),await Za("undefined"),IO(e)?e:null}function IO(r){if(!r||!r.subscriptionOptions)return!1;const{subscriptionOptions:e}=r;return typeof r.createTime=="number"&&r.createTime>0&&typeof r.token=="string"&&r.token.length>0&&typeof e.auth=="string"&&e.auth.length>0&&typeof e.p256dh=="string"&&e.p256dh.length>0&&typeof e.endpoint=="string"&&e.endpoint.length>0&&typeof e.swScope=="string"&&e.swScope.length>0&&typeof e.vapidKey=="string"&&e.vapidKey.length>0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const DO={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},De=new ys("messaging","Messaging",DO);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ng="firebase-messaging-database",rg=2,ws="firebase-messaging-store",Sn="firebase-messaging-fid-registration-store",wO={openDB:Xu,deleteDB:Za};let sg=wO,bo=null;function yO(r,e,t){switch(e){case 0:if(r.createObjectStore(ws),t===1)break;case 1:t===2&&r.createObjectStore(Sn)}}function ig(r){return{upgrade:(e,t)=>{yO(e,t,r)},blocked:()=>{},blocking:(e,t,n)=>{var s;bo=null,(s=n.target)==null||s.close()},terminated:()=>{bo=null}}}function Lc(){return bo||(bo=sg.openDB(ng,rg,ig(2)).catch(()=>sg.openDB(ng,rg-1,ig(1)))),bo}function GI(r,e){return r.objectStoreNames.contains(e)}function UI(r){if(!GI(r,Sn))throw De.create("fid-registration-idb-schema-unavailable")}async function TO(r){const e=xc(r),n=await(await Lc()).transaction(ws).objectStore(ws).get(e);if(n)return n;{const s=await EO(r.appConfig.senderId);if(s)return await md(r,s),s}}async function md(r,e){const t=xc(r),n=await Lc(),s=[ws],i=GI(n,Sn);i&&s.push(Sn);const o=n.transaction(s,"readwrite");return await o.objectStore(ws).put(e,t),i&&await o.objectStore(Sn).delete(t),await o.done,e}async function HI(r){const e=xc(r),t=await Lc();return UI(t),await t.transaction(Sn).objectStore(Sn).get(e)}async function AO(r,e){const t=xc(r),n=await Lc();UI(n);const s=n.transaction([ws,Sn],"readwrite");return await s.objectStore(Sn).put(e,t),await s.objectStore(ws).delete(t),await s.done,e}function xc({appConfig:r}){return r.appId}const og="@firebase/messaging",RB="0.13.3";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RO=3,bO=1e3;async function vO(r,e){const t=await Mc(r),n=_d(e,r.appConfig.appName,!1),s={method:"POST",headers:t,body:JSON.stringify(n)};let i;try{i=await(await fetch(Vc(r.appConfig),s)).json()}catch(o){throw De.create("token-subscribe-failed",{errorInfo:o==null?void 0:o.toString()})}if(i.error){const o=i.error.message;throw De.create("token-subscribe-failed",{errorInfo:o})}if(!i.token)throw De.create("token-subscribe-no-token");return i.token}async function SO(r,e){var u;const t=await Mc(r),n=_d(e,r.appConfig.appName,!0),s={method:"POST",headers:t,body:JSON.stringify(n)};let i;try{i=await kO(()=>fetch(Vc(r.appConfig),s),RO,bO)}catch(l){throw De.create("fid-registration-failed",{errorInfo:l==null?void 0:l.toString()})}if(i.ok)return{responseFid:await PO(i)};let o;try{o=await i.json()}catch{throw De.create("fid-registration-failed",{errorInfo:i.statusText})}const a=((u=o.error)==null?void 0:u.message)??i.statusText;throw De.create("fid-registration-failed",{errorInfo:a})}async function PO(r){const e=await r.text();if(!e.trim())throw De.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let t;try{t=JSON.parse(e)}catch{throw De.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}const n=t.name;if(typeof n!="string"||n.length===0)throw De.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return NO(n)}const ag="/registrations/";function NO(r){const e=r.indexOf(ag);if(e!==-1){const t=r.slice(e+ag.length);if(t.length>0)return t}throw De.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function OO(r,e){const t=await Mc(r),n=_d(e.subscriptionOptions,r.appConfig.appName,!1),s={method:"PATCH",headers:t,body:JSON.stringify(n)};let i;try{i=await(await fetch(`${Vc(r.appConfig)}/${e.token}`,s)).json()}catch(o){throw De.create("token-update-failed",{errorInfo:o==null?void 0:o.toString()})}if(i.error){const o=i.error.message;throw De.create("token-update-failed",{errorInfo:o})}if(!i.token)throw De.create("token-update-no-token");return i.token}async function FO(r,e){const n={method:"DELETE",headers:await Mc(r)};try{const i=await(await fetch(`${Vc(r.appConfig)}/${e}`,n)).json();if(i.error){const o=i.error.message;throw De.create("token-unsubscribe-failed",{errorInfo:o})}}catch(s){throw De.create("token-unsubscribe-failed",{errorInfo:s==null?void 0:s.toString()})}}async function kO(r,e,t){let n;for(let s=0;s<e;s++)try{return await r()}catch(i){if(n=i,s<e-1){const o=t*Math.pow(2,s);await new Promise(a=>setTimeout(a,o))}}throw n}function Vc({projectId:r}){return`${CO}/projects/${r}/registrations`}async function Mc({appConfig:r,installations:e}){const t=await e.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":r.apiKey,"x-goog-firebase-installations-auth":`FIS ${t}`})}function LO(r,e){var t,n;try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(r))return new URL(r).host}catch{}try{if(typeof self<"u"&&((t=self.location)!=null&&t.href))return new URL(r,self.location.origin).host}catch{}return typeof self<"u"&&((n=self.location)!=null&&n.host)?self.location.host:e}function _d({p256dh:r,auth:e,endpoint:t,vapidKey:n,swScope:s},i,o){const a={web:{origin:LO(s,i),endpoint:t,auth:e,p256dh:r}};return o&&(a.fcm_sdk_version=RB),n!==xI&&(a.web.applicationPubKey=n),a}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xO=7*24*60*60*1e3;async function VO(r){const e=await GO(r.swRegistration,r.vapidKey),t={vapidKey:r.vapidKey,swScope:r.swRegistration.scope,endpoint:e.endpoint,auth:zt(e.getKey("auth")),p256dh:zt(e.getKey("p256dh"))},n=await TO(r.firebaseDependencies);if(n){if(UO(n.subscriptionOptions,t))return Date.now()>=n.createTime+xO?MO(r,{token:n.token,createTime:Date.now(),subscriptionOptions:t}):n.token;try{await FO(r.firebaseDependencies,n.token)}catch{}return ug(r.firebaseDependencies,t)}else return ug(r.firebaseDependencies,t)}async function MO(r,e){try{const t=await OO(r.firebaseDependencies,e),n={...e,token:t,createTime:Date.now()};return await md(r.firebaseDependencies,n),t}catch(t){throw t}}async function ug(r,e){const n={token:await vO(r,e),createTime:Date.now(),subscriptionOptions:e};return await md(r,n),n.token}async function GO(r,e){const t=await r.pushManager.getSubscription();return t||r.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:MI(e)})}function UO(r,e){const t=e.vapidKey===r.vapidKey,n=e.endpoint===r.endpoint,s=e.auth===r.auth,i=e.p256dh===r.p256dh;return t&&n&&s&&i}function HO(r,e){const t=r.onRegisteredHandler;t&&(typeof t=="function"?t(e):t.next(e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qO(r){try{r.swRegistration=await navigator.serviceWorker.register(dO,{scope:fO}),r.swRegistration.update().catch(()=>{}),await jO(r.swRegistration)}catch(e){throw De.create("failed-service-worker-registration",{browserErrorMessage:e==null?void 0:e.message})}}async function jO(r){return new Promise((e,t)=>{const n=setTimeout(()=>t(new Error(`Service worker not registered after ${Zp} ms`)),Zp),s=r.installing||r.waiting;r.active?(clearTimeout(n),e()):s?s.onstatechange=i=>{var o;((o=i.target)==null?void 0:o.state)==="activated"&&(s.onstatechange=null,clearTimeout(n),e())}:(clearTimeout(n),t(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qI(r,e){if(!e&&!r.swRegistration&&await qO(r),!(!e&&r.swRegistration)){if(!(e instanceof ServiceWorkerRegistration))throw De.create("invalid-sw-registration");r.swRegistration=e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jI(r,e){e?r.vapidKey=e:r.vapidKey||(r.vapidKey=xI)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cg=3;async function KO(r,e){const t=await JO(r.swRegistration,r.vapidKey),n={vapidKey:r.vapidKey,swScope:r.swRegistration.scope,endpoint:t.endpoint,auth:zt(t.getKey("auth")),p256dh:zt(t.getKey("p256dh"))},s=r.firebaseDependencies.installations;for(let i=0;i<cg;i++){const{responseFid:o}=await SO(r.firebaseDependencies,n);if(o===e)return;i<cg-1&&await s.getToken(!0)}throw De.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function JO(r,e){const t=await r.pushManager.getSubscription();return t||r.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:MI(e)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zO=7*24*60*60*1e3;async function KI(r,e){if(!navigator)throw De.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw De.create("permission-blocked");if(!r.onRegisteredHandler)throw De.create("invalid-on-registered-handler");await jI(r,e==null?void 0:e.vapidKey),await qI(r,e==null?void 0:e.serviceWorkerRegistration);const t=r._registerNotifyChain.catch(()=>{});return r._registerNotifyChain=t.then(async()=>{const n=await r.firebaseDependencies.installations.getId(),s=await HI(r.firebaseDependencies),i=Date.now();if((!s||s.fid!==n||i>=s.lastRegisterTime+zO)&&(await KO(r,n),await AO(r.firebaseDependencies,{fid:n,lastRegisterTime:i,vapidKey:r.vapidKey})),!r.onRegisteredHandler)throw De.create("invalid-on-registered-handler");HO(r,n)}),r._registerNotifyChain}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $O(r,e){return aO(e,()=>{(async()=>!r.onRegisteredHandler||!await HI(r.firebaseDependencies)||await KI(r).catch(()=>{}))()})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lg(r){const e={from:r.from,collapseKey:r.collapse_key,messageId:r.fcmMessageId};return QO(e,r),WO(e,r),YO(e,r),e}function QO(r,e){if(!e.notification)return;r.notification={};const t=e.notification.title;t&&(r.notification.title=t);const n=e.notification.body;n&&(r.notification.body=n);const s=e.notification.image;s&&(r.notification.image=s);const i=e.notification.icon;i&&(r.notification.icon=i)}function WO(r,e){e.data&&(r.data=e.data)}function YO(r,e){var s,i,o,a;if(!e.fcmOptions&&!((s=e.notification)!=null&&s.click_action))return;r.fcmOptions={};const t=((i=e.fcmOptions)==null?void 0:i.link)??((o=e.notification)==null?void 0:o.click_action);t&&(r.fcmOptions.link=t);const n=(a=e.fcmOptions)==null?void 0:a.analytics_label;n&&(r.fcmOptions.analyticsLabel=n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XO(r){return typeof r=="object"&&!!r&&VI in r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ZO(r){if(!r||!r.options)throw Ll("App Configuration Object");if(!r.name)throw Ll("App Name");const e=["projectId","apiKey","appId","messagingSenderId"],{options:t}=r;for(const n of e)if(!t[n])throw Ll(n);return{appName:r.name,projectId:t.projectId,apiKey:t.apiKey,appId:t.appId,senderId:t.messagingSenderId}}function Ll(r){return De.create("missing-app-config-values",{valueName:r})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eF{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};const s=ZO(e);this.firebaseDependencies={app:e,appConfig:s,installations:t,analyticsProvider:n}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function tF(r,e){if(!navigator)throw De.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw De.create("permission-blocked");return await jI(r,e==null?void 0:e.vapidKey),await qI(r,e==null?void 0:e.serviceWorkerRegistration),VO(r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function nF(r,e,t){const n=rF(e);(await r.firebaseDependencies.analyticsProvider.get()).logEvent(n,{message_id:t[VI],message_name:t[pO],message_time:t[gO],message_device_time:Math.floor(Date.now()/1e3)})}function rF(r){switch(r){case Di.NOTIFICATION_CLICKED:return"notification_open";case Di.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sF(r,e){const t=e.data;if(!t.isFirebaseMessaging)return;if(r.onMessageHandler&&t.messageType===Di.PUSH_RECEIVED&&(typeof r.onMessageHandler=="function"?r.onMessageHandler(lg(t)):r.onMessageHandler.next(lg(t))),r.onRegisteredHandler&&t.messageType===Di.FID_REGISTERED){const s=t.fid;typeof r.onRegisteredHandler=="function"?r.onRegisteredHandler(s):r.onRegisteredHandler.next(s)}const n=t.data;XO(n)&&n[mO]==="1"&&await nF(r,t.messageType,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const iF=r=>{const e=new eF(r.getProvider("app").getImmediate(),r.getProvider("installations-internal").getImmediate(),r.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",t=>sF(e,t)),e._fidChangeUnsubscribe=$O(e,r.getProvider("installations").getImmediate()),e},oF=r=>{const e=r.getProvider("messaging").getImmediate();return{getToken:n=>tF(e,n),register:n=>KI(e,n)}};function aF(){Ht(new Lt("messaging",iF,"PUBLIC")),Ht(new Lt("messaging-internal",oF,"PRIVATE")),ct(og,RB),ct(og,RB,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function uF(){try{await Ag()}catch{return!1}return typeof window<"u"&&vB()&&KD()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ek(r=Zu()){return uF().then(e=>{if(!e)throw De.create("unsupported-browser")},e=>{throw De.create("indexed-db-unsupported")}),Ar(Ce(r),"messaging").getImmediate()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */aF();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cF="type.googleapis.com/google.protobuf.Int64Value",lF="type.googleapis.com/google.protobuf.UInt64Value";function JI(r,e){const t={};for(const n in r)r.hasOwnProperty(n)&&(t[n]=e(r[n]));return t}function $u(r){if(r==null)return null;if(r instanceof Number&&(r=r.valueOf()),typeof r=="number"&&isFinite(r)||r===!0||r===!1||Object.prototype.toString.call(r)==="[object String]")return r;if(r instanceof Date)return r.toISOString();if(Array.isArray(r))return r.map(e=>$u(e));if(typeof r=="function"||typeof r=="object")return JI(r,e=>$u(e));throw new Error("Data cannot be encoded in JSON: "+r)}function wi(r){if(r==null)return r;if(r["@type"])switch(r["@type"]){case cF:case lF:{const e=Number(r.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+r);return e}default:throw new Error("Data cannot be decoded from JSON: "+r)}return Array.isArray(r)?r.map(e=>wi(e)):typeof r=="function"||typeof r=="object"?JI(r,e=>wi(e)):r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ed="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bg={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class mt extends Kt{constructor(e,t,n,s){super(`${Ed}/${e}`,t||"",s!=null?{url:s}:void 0),this.details=n,Object.setPrototypeOf(this,mt.prototype)}}function BF(r){if(r>=200&&r<300)return"ok";switch(r){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function Qu(r,e,t){let n=BF(r),s=n,i;try{const o=e&&e.error;if(o){const a=o.status;if(typeof a=="string"){if(!Bg[a])return new mt("internal",`Unknown backend error status: ${a} [${r}]`,void 0,t);n=Bg[a],s=`Backend error status: ${a}`}const u=o.message;typeof u=="string"&&(s=u),i=o.details,i!==void 0&&(i=wi(i))}}catch{}return n==="ok"?null:new mt(n,`${s} [${r}]`,i,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hF{constructor(e,t,n,s){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,pt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=n.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||n.get().then(i=>this.messaging=i,()=>{}),this.appCheck||s==null||s.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),n=await this.getMessagingToken(),s=await this.getAppCheckToken(e);return{authToken:t,messagingToken:n,appCheckToken:s}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bB="us-central1",dF=/^data: (.*?)(?:\n|$)/;function fF(r){let e=null;return{promise:new Promise((t,n)=>{e=setTimeout(()=>{n(new mt("deadline-exceeded","deadline-exceeded"))},r)}),cancel:()=>{e&&clearTimeout(e)}}}class CF{constructor(e,t,n,s,i=bB,o=(...a)=>fetch(...a)){this.app=e,this.fetchImpl=o,this.emulatorOrigin=null,this.contextProvider=new hF(e,t,n,s),this.cancelAllRequests=new Promise(a=>{this.deleteService=()=>Promise.resolve(a())});try{const a=new URL(i);this.customDomain=a.origin+(a.pathname==="/"?"":a.pathname),this.region=bB}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function pF(r,e,t){const n=Gn(e);r.emulatorOrigin=`http${n?"s":""}://${e}:${t}`,n&&Yu(r.emulatorOrigin+"/backends")}function gF(r,e,t){const n=s=>EF(r,e,s,t||{});return n.stream=(s,i)=>IF(r,e,s,i),n}function mF(r,e,t){const n=s=>QI(r,e,s,t||{});return n.stream=(s,i)=>WI(r,e,s,i||{}),n}function zI(r){return r.emulatorOrigin&&Gn(r.emulatorOrigin)?"include":void 0}async function _F(r,e,t,n,s){t["Content-Type"]="application/json";let i;try{i=await n(r,{method:"POST",body:JSON.stringify(e),headers:t,credentials:zI(s)})}catch{return{status:0,json:null}}let o=null;try{o=await i.json()}catch{}return{status:i.status,json:o}}async function $I(r,e){const t={},n=await r.contextProvider.getContext(e.limitedUseAppCheckTokens);return n.authToken&&(t.Authorization="Bearer "+n.authToken),n.messagingToken&&(t["Firebase-Instance-ID-Token"]=n.messagingToken),n.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=n.appCheckToken),t}function EF(r,e,t,n){const s=r._url(e);return QI(r,s,t,n)}async function QI(r,e,t,n){t=$u(t);const s={data:t},i=await $I(r,n),o=n.timeout||7e4,a=fF(o),u=await Promise.race([_F(e,s,i,r.fetchImpl,r),a.promise,r.cancelAllRequests]);if(a.cancel(),!u)throw new mt("cancelled","Firebase Functions instance was deleted.");const l=Qu(u.status,u.json,e);if(l)throw l;if(!u.json)throw new mt("internal","Response is not valid JSON object.",void 0,e);let B=u.json.data;if(typeof B>"u"&&(B=u.json.result),typeof B>"u")throw new mt("internal","Response is missing data field.",void 0,e);return{data:wi(B)}}function IF(r,e,t,n){const s=r._url(e);return WI(r,s,t,n||{})}async function WI(r,e,t,n){var C;t=$u(t);const s={data:t},i=await $I(r,n);i["Content-Type"]="application/json",i.Accept="text/event-stream";let o;try{o=await r.fetchImpl(e,{method:"POST",body:JSON.stringify(s),headers:i,signal:n==null?void 0:n.signal,credentials:zI(r)})}catch(g){if(g instanceof Error&&g.name==="AbortError"){const P=new mt("cancelled","Request was cancelled.");return{data:Promise.reject(P),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(P)}}}}}}const D=Qu(0,null,e);return{data:Promise.reject(D),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(D)}}}}}}let a,u;const l=new Promise((g,D)=>{a=g,u=D});(C=n==null?void 0:n.signal)==null||C.addEventListener("abort",()=>{const g=new mt("cancelled","Request was cancelled.");u(g)});const B=o.body.getReader(),d=DF(B,a,u,n==null?void 0:n.signal,e);return{stream:{[Symbol.asyncIterator](){const g=d.getReader();return{async next(){const{value:D,done:P}=await g.read();return{value:D,done:P}},async return(){return await g.cancel(),{done:!0,value:void 0}}}}},data:l}}function DF(r,e,t,n,s){const i=(a,u)=>{const l=a.match(dF);if(!l)return;const B=l[1];try{const d=JSON.parse(B);if("result"in d){e(wi(d.result));return}if("message"in d){u.enqueue(wi(d.message));return}if("error"in d){const C=Qu(0,d,s);u.error(C),t(C);return}}catch(d){if(d instanceof mt){u.error(d),t(d);return}}},o=new TextDecoder;return new ReadableStream({start(a){let u="";return l();async function l(){if(n!=null&&n.aborted){const B=new mt("cancelled","Request was cancelled");return a.error(B),t(B),Promise.resolve()}try{const{value:B,done:d}=await r.read();if(d){u.trim()&&i(u.trim(),a),a.close();return}if(n!=null&&n.aborted){const g=new mt("cancelled","Request was cancelled");a.error(g),t(g),await r.cancel();return}u+=o.decode(B,{stream:!0});const C=u.split(`
`);u=C.pop()||"";for(const g of C)g.trim()&&i(g.trim(),a);return l()}catch(B){const d=B instanceof mt?B:Qu(0,null,s);a.error(d),t(d)}}},cancel(){return r.cancel()}})}const hg="@firebase/functions",dg="0.14.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wF="auth-internal",yF="app-check-internal",TF="messaging-internal";function AF(r){const e=(t,{instanceIdentifier:n})=>{const s=t.getProvider("app").getImmediate(),i=t.getProvider(wF),o=t.getProvider(TF),a=t.getProvider(yF);return new CF(s,i,o,a,n)};Ht(new Lt(Ed,e,"PUBLIC").setMultipleInstances(!0)),ct(hg,dg,r),ct(hg,dg,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function RF(r=Zu(),e=bB){const n=Ar(Ce(r),Ed).getImmediate({identifier:e}),s=_g("functions");return s&&YI(n,...s),n}function YI(r,e,t){pF(Ce(r),e,t)}function bF(r,e,t){return gF(Ce(r),e,t)}function vF(r,e,t){return mF(Ce(r),e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */AF();const Ik=Object.freeze(Object.defineProperty({__proto__:null,FunctionsError:mt,connectFunctionsEmulator:YI,getFunctions:RF,httpsCallable:bF,httpsCallableFromURL:vF},Symbol.toStringTag,{value:"Module"}));export{rk as $,nk as A,jF as B,Lt as C,Dg as D,ys as E,YF as F,xF as G,ik as H,tk as I,VF as J,ak as K,SB as L,Bk as M,ck as N,ZF as O,mk as P,fk as Q,pk as R,lk as S,bF as T,ok as U,dk as V,Ck as W,uk as X,NF as Y,gk as Z,Ht as _,Ar as a,Ik as a0,Cg as b,Zu as c,gg as d,PF as e,Zw as f,Ce as g,hk as h,vB as i,HF as j,_k as k,Ek as l,RF as m,QF as n,XF as o,$F as p,uA as q,ct as r,sk as s,kF as t,LF as u,qF as v,JF as w,zF as x,KF as y,ek as z};
