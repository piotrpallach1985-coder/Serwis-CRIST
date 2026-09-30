import{al as je,am as Ie,an as Te,ao as ee,r as x,k as r,ap as te,p as Ae,D as Oe,i as ke,h as Me,aq as De,m as Le,M as Pe,a4 as $,z as se,A as ne,a0 as $e,C as Fe,ar as Ue,P as G}from"./index-vgnGLs9S.js";import{D as Ee}from"./DictationButton-DU_7vmxa.js";import{a as He}from"./ManagerView-Dr22Oz3E.js";function I(e,t=""){if(e==null)return t;if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return String(e);if(typeof e=="object"&&typeof e.toDate=="function")try{return e.toDate().toLocaleString("pl-PL")}catch{return t}if(typeof e=="object"&&e.seconds!==void 0)try{return new Date(e.seconds*1e3).toLocaleString("pl-PL")}catch{return t}if(typeof e=="object")try{return JSON.stringify(e)}catch{return"[obiekt]"}return String(e)}/**
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
 */const Ge="FirebaseError";class U extends Error{constructor(t,s,n){super(s),this.code=t,this.customData=n,this.name=Ge,Object.setPrototypeOf(this,U.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Be.prototype.create)}}class Be{constructor(t,s,n){this.service=t,this.serviceName=s,this.errors=n}create(t,...s){const n=s[0]||{},o=`${this.service}/${t}`,i=this.errors[t],a=i?ze(i,n):"Error",c=`${this.serviceName}: ${a} (${o}).`;return new U(o,c,n)}}function ze(e,t){return e.replace(Ye,(s,n)=>{const o=t[n];return o!=null?String(o):`<${n}?>`})}const Ye=/\{\$([^}]+)}/g;/**
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
 */function Ve(e){return e&&e._delegate?e._delegate:e}class Ke{constructor(t,s,n){this.name=t,this.instanceFactory=s,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}function L(e){return this instanceof L?(this.v=e,this):new L(e)}function qe(e,t,s){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var n=s.apply(e,t||[]),o,i=[];return o=Object.create((typeof AsyncIterator=="function"?AsyncIterator:Object).prototype),c("next"),c("throw"),c("return",a),o[Symbol.asyncIterator]=function(){return this},o;function a(u){return function(E){return Promise.resolve(E).then(u,m)}}function c(u,E){n[u]&&(o[u]=function(f){return new Promise(function(N,y){i.push([u,f,N,y])>1||d(u,f)})},E&&(o[u]=E(o[u])))}function d(u,E){try{p(n[u](E))}catch(f){v(i[0][3],f)}}function p(u){u.value instanceof L?Promise.resolve(u.value.v).then(h,m):v(i[0][2],u)}function h(u){d("next",u)}function m(u){d("throw",u)}function v(u,E){u(E),i.shift(),i.length&&d(i[0][0],i[0][1])}}var oe="@firebase/vertexai-preview",z="0.0.4";/**
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
 */const K="vertexAI",ye="us-central1",We="https://firebaseml.googleapis.com",Je="v2beta",re=z,Xe="gl-js";/**
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
 */class Ze{constructor(t,s,n,o){var i;this.app=t,this.options=o;const a=n==null?void 0:n.getImmediate({optional:!0}),c=s==null?void 0:s.getImmediate({optional:!0});this.auth=c||null,this.appCheck=a||null,this.location=((i=this.options)===null||i===void 0?void 0:i.location)||ye}_delete(){return Promise.resolve()}}/**
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
 */class b extends U{constructor(t,s,n){const o=K,i="VertexAI",a=`${o}/${t}`,c=`${i}: ${s} (${a}).`;super(a,c),this.code=t,this.message=s,this.customErrorData=n,Error.captureStackTrace&&Error.captureStackTrace(this,b),Object.setPrototypeOf(this,b.prototype),this.toString=()=>c}}/**
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
 */var P;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens"})(P||(P={}));class ve{constructor(t,s,n,o,i){this.model=t,this.task=s,this.apiSettings=n,this.stream=o,this.requestOptions=i}toString(){var t;const s=Je;let o=`${((t=this.requestOptions)===null||t===void 0?void 0:t.baseUrl)||We}/${s}`;return o+=`/projects/${this.apiSettings.project}`,o+=`/locations/${this.apiSettings.location}`,o+=`/${this.model}`,o+=`:${this.task}`,this.stream&&(o+="?alt=sse"),o}get fullModelString(){let t=`projects/${this.apiSettings.project}`;return t+=`/locations/${this.apiSettings.location}`,t+=`/${this.model}`,t}}function Qe(){const e=[];return e.push(`${Xe}/${re}`),e.push(`fire/${re}`),e.join(" ")}async function et(e){const t=new Headers;if(t.append("Content-Type","application/json"),t.append("x-goog-api-client",Qe()),t.append("x-goog-api-key",e.apiSettings.apiKey),e.apiSettings.getAppCheckToken){const s=await e.apiSettings.getAppCheckToken();s&&!s.error&&t.append("X-Firebase-AppCheck",s.token)}if(e.apiSettings.getAuthToken){const s=await e.apiSettings.getAuthToken();s&&t.append("Authorization",`Firebase ${s.accessToken}`)}return t}async function tt(e,t,s,n,o,i){const a=new ve(e,t,s,n,i);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},st(i)),{method:"POST",headers:await et(a),body:o})}}async function q(e,t,s,n,o,i){const a=new ve(e,t,s,n,i);let c;try{const d=await tt(e,t,s,n,o,i);if(c=await fetch(d.url,d.fetchOptions),!c.ok){let p="",h;try{const m=await c.json();p=m.error.message,m.error.details&&(p+=` ${JSON.stringify(m.error.details)}`,h=m.error.details)}catch{}throw new b("fetch-error",`Error fetching from ${a}: [${c.status} ${c.statusText}] ${p}`,{status:c.status,statusText:c.statusText,errorDetails:h})}}catch(d){let p=d;throw d.code!=="fetch-error"&&d instanceof Error&&(p=new b("error",`Error fetching from ${a.toString()}: ${d.message}`),p.stack=d.stack),p}return c}function st(e){const t={};if(e!=null&&e.timeout&&(e==null?void 0:e.timeout)>=0){const s=new AbortController,n=s.signal;setTimeout(()=>s.abort(),e.timeout),t.signal=n}return t}/**
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
 */const ie=["user","model","function","system"];var ae;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})(ae||(ae={}));var le;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(le||(le={}));var ce;(function(e){e.HARM_BLOCK_METHOD_UNSPECIFIED="HARM_BLOCK_METHOD_UNSPECIFIED",e.SEVERITY="SEVERITY",e.PROBABILITY="PROBABILITY"})(ce||(ce={}));var de;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(de||(de={}));var ue;(function(e){e.HARM_SEVERITY_UNSPECIFIED="HARM_SEVERITY_UNSPECIFIED",e.HARM_SEVERITY_NEGLIGIBLE="HARM_SEVERITY_NEGLIGIBLE",e.HARM_SEVERITY_LOW="HARM_SEVERITY_LOW",e.HARM_SEVERITY_MEDIUM="HARM_SEVERITY_MEDIUM",e.HARM_SEVERITY_HIGH="HARM_SEVERITY_HIGH"})(ue||(ue={}));var he;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(he||(he={}));var F;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.OTHER="OTHER"})(F||(F={}));var fe;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(fe||(fe={}));/**
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
 */var pe;(function(e){e.STRING="STRING",e.NUMBER="NUMBER",e.INTEGER="INTEGER",e.BOOLEAN="BOOLEAN",e.ARRAY="ARRAY",e.OBJECT="OBJECT"})(pe||(pe={}));/**
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
 */function W(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1,Y(e.candidates[0]))throw new b("response-error",`Response error: ${A(e)}. Response body stored in error.response`,{response:e});return nt(e)}else if(e.promptFeedback)throw new b("response-error",`Text not available. ${A(e)}`,{response:e});return""},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1,Y(e.candidates[0]))throw new b("response-error",`Response error: ${A(e)}. Response body stored in error.response`,{response:e});return ot(e)}else if(e.promptFeedback)throw new b("response-error",`Function call not available. ${A(e)}`,{response:e})},e}function nt(e){var t,s,n,o;const i=[];if(!((s=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||s===void 0)&&s.parts)for(const a of(o=(n=e.candidates)===null||n===void 0?void 0:n[0].content)===null||o===void 0?void 0:o.parts)a.text&&i.push(a.text);return i.length>0?i.join(""):""}function ot(e){var t,s,n,o;const i=[];if(!((s=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||s===void 0)&&s.parts)for(const a of(o=(n=e.candidates)===null||n===void 0?void 0:n[0].content)===null||o===void 0?void 0:o.parts)a.functionCall&&i.push(a.functionCall);if(i.length>0)return i}const rt=[F.RECITATION,F.SAFETY];function Y(e){return!!e.finishReason&&rt.includes(e.finishReason)}function A(e){var t,s,n;let o="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)o+="Response was blocked",!((t=e.promptFeedback)===null||t===void 0)&&t.blockReason&&(o+=` due to ${e.promptFeedback.blockReason}`),!((s=e.promptFeedback)===null||s===void 0)&&s.blockReasonMessage&&(o+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((n=e.candidates)===null||n===void 0)&&n[0]){const i=e.candidates[0];Y(i)&&(o+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(o+=`: ${i.finishMessage}`))}return o}/**
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
 */const me=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function it(e){const t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),s=ct(t),[n,o]=s.tee();return{stream:lt(n),response:at(o)}}async function at(e){const t=[],s=e.getReader();for(;;){const{done:n,value:o}=await s.read();if(n)return W(dt(t));t.push(o)}}function lt(e){return qe(this,arguments,function*(){const s=e.getReader();for(;;){const{value:n,done:o}=yield L(s.read());if(o)break;yield yield L(W(n))}})}function ct(e){const t=e.getReader();return new ReadableStream({start(n){let o="";return i();function i(){return t.read().then(({value:a,done:c})=>{if(c){if(o.trim()){n.error(new b("parse-failed","Failed to parse stream"));return}n.close();return}o+=a;let d=o.match(me),p;for(;d;){try{p=JSON.parse(d[1])}catch{n.error(new b("parse-failed",`Error parsing JSON response: "${d[1]}`));return}n.enqueue(p),o=o.substring(d[0].length),d=o.match(me)}return i()})}}})}function dt(e){const t=e[e.length-1],s={promptFeedback:t==null?void 0:t.promptFeedback};for(const n of e)if(n.candidates)for(const o of n.candidates){const i=o.index;if(s.candidates||(s.candidates=[]),s.candidates[i]||(s.candidates[i]={index:o.index}),s.candidates[i].citationMetadata=o.citationMetadata,s.candidates[i].finishReason=o.finishReason,s.candidates[i].finishMessage=o.finishMessage,s.candidates[i].safetyRatings=o.safetyRatings,o.content&&o.content.parts){s.candidates[i].content||(s.candidates[i].content={role:o.content.role||"user",parts:[]});const a={};for(const c of o.content.parts)c.text&&(a.text=c.text),c.functionCall&&(a.functionCall=c.functionCall),Object.keys(a).length===0&&(a.text=""),s.candidates[i].content.parts.push(a)}}return s}/**
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
 */async function Ne(e,t,s,n){const o=await q(t,P.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(s),n);return it(o)}async function we(e,t,s,n){const i=await(await q(t,P.GENERATE_CONTENT,e,!1,JSON.stringify(s),n)).json();return{response:W(i)}}/**
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
 */function _e(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function V(e){let t=[];if(typeof e=="string")t=[{text:e}];else for(const s of e)typeof s=="string"?t.push({text:s}):t.push(s);return ut(t)}function ut(e){const t={role:"user",parts:[]},s={role:"function",parts:[]};let n=!1,o=!1;for(const i of e)"functionResponse"in i?(s.parts.push(i),o=!0):(t.parts.push(i),n=!0);if(n&&o)throw new b("invalid-content","Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!n&&!o)throw new b("invalid-content","No Content is provided for sending chat message.");return n?t:s}function B(e){let t;return e.contents?t=e:t={contents:[V(e)]},e.systemInstruction&&(t.systemInstruction=_e(e.systemInstruction)),t}/**
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
 */const ge=["text","inlineData","functionCall","functionResponse"],ht={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall"],system:["text"]},xe={user:["model"],function:["model"],model:["user","function"],system:[]};function ft(e){let t=null;for(const s of e){const{role:n,parts:o}=s;if(!t&&n!=="user")throw new b("invalid-content",`First Content should be with role 'user', got ${n}`);if(!ie.includes(n))throw new b("invalid-content",`Each item should include role field. Got ${n} but valid roles are: ${JSON.stringify(ie)}`);if(!Array.isArray(o))throw new b("invalid-content","Content should have 'parts' but property with an array of Parts");if(o.length===0)throw new b("invalid-content","Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0};for(const c of o)for(const d of ge)d in c&&(i[d]+=1);const a=ht[n];for(const c of ge)if(!a.includes(c)&&i[c]>0)throw new b("invalid-content",`Content with role '${n}' can't contain '${c}' part`);if(t&&!xe[n].includes(t.role))throw new b("invalid-content",`Content with role '${n} can't follow '${t.role}'. Valid previous roles: ${JSON.stringify(xe)}`);t=s}}/**
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
 */const be="SILENT_ERROR";class pt{constructor(t,s,n,o){this.model=s,this.params=n,this.requestOptions=o,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=t,n!=null&&n.history&&(ft(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(t){var s,n,o,i,a;await this._sendPromise;const c=V(t),d={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(n=this.params)===null||n===void 0?void 0:n.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,contents:[...this._history,c]};let p={};return this._sendPromise=this._sendPromise.then(()=>we(this._apiSettings,this.model,d,this.requestOptions)).then(h=>{var m,v;if(h.response.candidates&&h.response.candidates.length>0){this._history.push(c);const u={parts:((m=h.response.candidates)===null||m===void 0?void 0:m[0].content.parts)||[],role:((v=h.response.candidates)===null||v===void 0?void 0:v[0].content.role)||"model"};this._history.push(u)}else{const u=A(h.response)}p=h}),await this._sendPromise,p}async sendMessageStream(t){var s,n,o,i,a;await this._sendPromise;const c=V(t),d={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(n=this.params)===null||n===void 0?void 0:n.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,contents:[...this._history,c]},p=Ne(this._apiSettings,this.model,d,this.requestOptions);return this._sendPromise=this._sendPromise.then(()=>p).catch(h=>{throw new Error(be)}).then(h=>h.response).then(h=>{if(h.candidates&&h.candidates.length>0){this._history.push(c);const m=Object.assign({},h.candidates[0].content);m.role||(m.role="model"),this._history.push(m)}else{const m=A(h)}}).catch(h=>{h.message}),p}}/**
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
 */async function mt(e,t,s,n){return(await q(t,P.COUNT_TOKENS,e,!1,JSON.stringify(s),n)).json()}/**
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
 */class gt{constructor(t,s,n){var o,i,a,c;if(!((i=(o=t.app)===null||o===void 0?void 0:o.options)===null||i===void 0)&&i.apiKey)if(!((c=(a=t.app)===null||a===void 0?void 0:a.options)===null||c===void 0)&&c.projectId)this._apiSettings={apiKey:t.app.options.apiKey,project:t.app.options.projectId,location:t.location},t.appCheck&&(this._apiSettings.getAppCheckToken=()=>t.appCheck.getToken()),t.auth&&(this._apiSettings.getAuthToken=()=>t.auth.getToken());else throw new b("no-project-id",'The "projectId" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid project ID.');else throw new b("no-api-key",'The "apiKey" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid API key.');s.model.includes("/")?s.model.startsWith("models/")?this.model=`publishers/google/${s.model}`:this.model=s.model:this.model=`publishers/google/models/${s.model}`,this.generationConfig=s.generationConfig||{},this.safetySettings=s.safetySettings||[],this.tools=s.tools,this.toolConfig=s.toolConfig,this.systemInstruction=_e(s.systemInstruction),this.requestOptions=n||{}}async generateContent(t){const s=B(t);return we(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},s),this.requestOptions)}async generateContentStream(t){const s=B(t);return Ne(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},s),this.requestOptions)}startChat(t){return new pt(this._apiSettings,this.model,Object.assign({tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},t),this.requestOptions)}async countTokens(t){const s=B(t);return mt(this._apiSettings,this.model,s)}}/**
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
 */function xt(e=Ie(),t){return e=Ve(e),je(e,K).getImmediate({identifier:ye})}function bt(e,t,s){if(!t.model)throw new b("no-model","Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");return new gt(e,t,s)}function Et(){Te(new Ke(K,(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),n=e.getProvider("auth-internal"),o=e.getProvider("app-check-internal");return new Ze(s,n,o,{location:t})},"PUBLIC").setMultipleInstances(!0)),ee(oe,z),ee(oe,z,"esm2017")}Et();function yt({isOpen:e,onClose:t,document:s,allDocuments:n,machineName:o}){const[i,a]=x.useState([]),[c,d]=x.useState(""),[p,h]=x.useState(!1),m=x.useRef(null),v=!s&&n&&n.length>0,u=v?n:s?[s]:[];x.useEffect(()=>{e&&(a([{role:"model",text:v?`Cześć! Przeanalizowałem całą dokumentację maszyny **${o}** (${u.length} plików). W czym mogę pomóc?`:`Cześć! Przeanalizowałem dokument **${s==null?void 0:s.name}**. W czym mogę pomóc?`}]),d(""))},[e,s,n,o]),x.useEffect(()=>{var f;(f=m.current)==null||f.scrollIntoView({behavior:"smooth"})},[i]);const E=async f=>{var y;if(f&&f.preventDefault(),!c.trim()||p)return;const N=c.trim();d(""),a(_=>[..._,{role:"user",text:N}]),h(!0);try{const _=xt(te),R=bt(_,{model:"gemini-2.5-flash",systemInstruction:"Jesteś eksperckim asystentem technicznym dla mechaników. Opieraj swoje odpowiedzi wyłącznie na załączonych dokumentach PDF. Zawsze podawaj nazwę dokumentu i numer strony, z której wziąłeś informację, jeśli to możliwe. Bądź zwięzły i konkretny, mechanik stoi przy maszynie i nie ma czasu czytać elaboratów."}),S=u.map(w=>({fileData:{fileUri:`gs://${te.options.storageBucket}/${w.path}`,mimeType:"application/pdf"}})),O=i.filter(w=>w.role!=="system").map(w=>`${w.role==="user"?"Mechanik":"Asystent"}: ${w.text}`).join(`
`);S.push({text:`Historia czatu:
${O}

Aktualne zapytanie mechanika: ${N}`});const j=await R.generateContent({contents:[{role:"user",parts:S}]}),k=j.response.text();a(w=>[...w,{role:"model",text:k}]);const M=((y=j.response.usageMetadata)==null?void 0:y.totalTokenCount)||0;if(M>0){const w=Ae();w&&Oe(ke(Me,"tenants",w,"stats","ai_usage"),{geminiTokens:De(M)},{merge:!0}).catch(J=>{})}}catch(_){let R="Wystąpił błąd podczas analizy. Upewnij się, że usługa Vertex AI jest włączona w konsoli Firebase.";_.message&&_.message.includes("API key not valid")&&(R="Klucz API lub konfiguracja Vertex AI jest nieprawidłowa."),a(S=>[...S,{role:"model",text:`❌ ${R} (${_.message})`,isError:!0}])}finally{h(!1)}};return e?r.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm",children:r.jsxs("div",{className:"bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden",children:[r.jsxs("div",{className:"bg-slate-800 px-4 py-3 flex items-center justify-between shrink-0",children:[r.jsxs("div",{className:"flex items-center gap-3 text-white",children:[r.jsx("div",{className:"bg-blue-500/20 p-2 rounded-lg text-blue-400",children:r.jsx("i",{className:"ph ph-sparkle text-xl"})}),r.jsxs("div",{children:[r.jsx("h2",{className:"font-bold text-lg leading-tight",children:"Asystent DTR (AI)"}),r.jsx("p",{className:"text-xs text-slate-300 font-medium",children:v?`Cała dokumentacja maszyny (${u.length} plików)`:s==null?void 0:s.name})]})]}),r.jsx("button",{onClick:t,className:"w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors",children:r.jsx("i",{className:"ph ph-x text-lg"})})]}),r.jsxs("div",{className:"flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4",children:[i.map((f,N)=>r.jsx("div",{className:`flex ${f.role==="user"?"justify-end":"justify-start"}`,children:r.jsxs("div",{className:`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${f.role==="user"?"bg-blue-600 text-white rounded-tr-sm":f.isError?"bg-red-50 text-red-700 border border-red-200 rounded-tl-sm":"bg-white text-slate-800 border border-slate-200 rounded-tl-sm"}`,children:[r.jsx("div",{className:"whitespace-pre-wrap",children:f.text}),f.role!=="user"&&!f.isError&&r.jsx("button",{onClick:y=>{navigator.clipboard.writeText(f.text);const R=y.currentTarget.querySelector("i");R.className="ph ph-check text-sm text-green-500",setTimeout(()=>{R.className="ph ph-copy text-sm"},2e3)},className:"absolute -bottom-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10",title:"Kopiuj odpowiedź",children:r.jsx("i",{className:"ph ph-copy text-sm"})})]})},N)),p&&r.jsx("div",{className:"flex justify-start",children:r.jsxs("div",{className:"bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm flex items-center gap-2",children:[r.jsx("i",{className:"ph ph-spinner animate-spin text-blue-500 text-lg"}),r.jsx("span",{className:"text-slate-500 font-medium",children:"Analizuję dokumentację..."})]})}),r.jsx("div",{ref:m})]}),r.jsxs("div",{className:"p-3 bg-white border-t border-slate-200 shrink-0",children:[r.jsxs("form",{onSubmit:E,className:"relative flex items-center gap-2",children:[r.jsx(Ee,{onResult:f=>d(N=>N?N+" "+f:f),className:"!w-10 !h-10 shrink-0"}),r.jsx("input",{type:"text",value:c,onChange:f=>d(f.target.value),placeholder:"Zapytaj o parametry, schematy, błędy...",className:"flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none",disabled:p}),r.jsx("button",{type:"submit",disabled:p||!c.trim(),className:"w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors shrink-0",children:r.jsx("i",{className:"ph ph-paper-plane-tilt text-lg"})})]}),r.jsx("div",{className:"text-center mt-2",children:r.jsxs("span",{className:"text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1",children:[r.jsx("i",{className:"ph ph-shield-check"})," Vertex AI przetwarza pliki wewnątrz Google Cloud (0 pobierania)"]})})]})]})}):null}function vt({machine:e,canManage:t,canDeleteNotes:s}){const{t:n}=He(),{user:o}=Le(),[i,a]=x.useState(!1),[c,d]=x.useState(!1),[p,h]=x.useState(null),[m,v]=x.useState(0),[u,E]=x.useState(""),[f,N]=x.useState(!1),[y,_]=x.useState(e.dtrFiles||[]),R=x.useRef(null),[S,O]=x.useState(""),[j,k]=x.useState(e.techNotes||[]),M=x.useRef(!0),w=x.useRef([]);x.useEffect(()=>(M.current=!0,()=>{M.current=!1,w.current.forEach(l=>l.cancel())}),[]),x.useEffect(()=>{_(e.dtrFiles||[]),k(e.techNotes||[])},[e.dtrFiles,e.techNotes]);const J=async l=>{if(window.confirm(n("machines.dtr.confirmDeleteNote")))try{const g=j.filter(C=>C.id!==l);k(g),await $(e.id,{techNotes:g})}catch{alert(n("machines.dtr.deleteNoteError"))}},X=async()=>{if(S.trim())try{const l={id:Date.now().toString(),text:S.trim(),createdAt:new Date().toISOString(),createdBy:(o==null?void 0:o.name)||n("machines.dtr.unknownUser")},g=[...j,l];k(g),O(""),await $(e.id,{techNotes:g})}catch{E(n("machines.dtr.addNoteError"))}},Re=async l=>{var C;const g=(C=l.target.files)==null?void 0:C[0];g&&Z(g)},Ce=async l=>{var C;if(l.preventDefault(),N(!1),!t)return;const g=(C=l.dataTransfer.files)==null?void 0:C[0];g&&Z(g)},Z=l=>{if(l.type!=="application/pdf"){E(n("machines.dtr.onlyPdfError"));return}if(l.size>50*1024*1024){E(n("machines.dtr.fileTooLargeError"));return}if(y.length>=10){E(n("machines.dtr.maxFilesError"));return}a(!0),v(0),E("");const g=`${Date.now()}_${l.name}`,C=se(ne,`machines/${e.id}/dtr/${g}`),D=$e(C,l);D.on("state_changed",T=>{const H=T.bytesTransferred/T.totalBytes*100;v(Math.round(H))},T=>{E(n("machines.dtr.uploadError")),a(!1)},async()=>{try{const T=await Fe(D.snapshot.ref),H={id:g,name:l.name,url:T,path:D.snapshot.ref.fullPath,uploadedAt:new Date().toISOString(),size:l.size},Q=[...y,H];_(Q),await $(e.id,{dtrFiles:Q})}catch{E(n("machines.dtr.dbSaveError"))}finally{a(!1),R.current&&(R.current.value="")}})},Se=async l=>{if(window.confirm(n("machines.dtr.confirmDeleteFile",{name:l.name})))try{const g=se(ne,l.path);await Ue(g);const C=y.filter(D=>D.id!==l.id);_(C),await $(e.id,{dtrFiles:C})}catch{alert(n("machines.dtr.deleteFileError"))}};return r.jsxs(Pe,{children:[r.jsxs("div",{className:"bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 shrink-0",onDragOver:l=>{l.preventDefault(),t&&N(!0)},onDragLeave:()=>N(!1),onDrop:Ce,children:[r.jsxs("div",{className:`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${f?"bg-blue-50 border-blue-200":"border-slate-200"}`,children:[r.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between w-full",children:[r.jsxs("div",{className:"flex flex-col",children:[r.jsxs("h3",{className:"font-bold text-slate-800 flex items-center gap-2",children:[r.jsx("i",{className:"ph ph-files text-xl text-blue-500"})," ",n("machines.dtr.title")]}),r.jsx("span",{className:"text-[10px] md:text-xs text-slate-500 mt-0.5",children:n("machines.dtr.subtitle")})]}),y.length>0&&r.jsxs("button",{onClick:()=>{h(null),d(!0)},className:"mt-3 sm:mt-0 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm border border-blue-100 shrink-0",children:[r.jsx("i",{className:"ph ph-sparkle text-lg"}),r.jsx("span",{children:n("machines.dtr.chatWithDtr")})]})]}),t?r.jsxs("div",{children:[r.jsx("input",{type:"file",accept:".pdf",ref:R,onChange:Re,className:"hidden"}),r.jsxs("button",{onClick:()=>{var l;return(l=R.current)==null?void 0:l.click()},disabled:i,className:"bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap",children:[r.jsx("i",{className:"ph ph-upload-simple"}),n("machines.buttons.uploadDtr")]})]}):r.jsx("span",{className:"text-xs italic text-gray-400",children:n("machines.dtr.noPermissions")})]}),r.jsxs("div",{className:`p-4 ${f?"bg-blue-50/30":""}`,children:[u&&r.jsxs("div",{className:"mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium",children:[r.jsx("i",{className:"ph ph-warning-circle mr-2"})," ",u]}),i&&r.jsxs("div",{className:"mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100",children:[r.jsxs("div",{className:"flex justify-between text-xs text-blue-800 font-bold mb-1",children:[r.jsx("span",{children:n("machines.dtr.uploadingFile")}),r.jsxs("span",{children:[m,"%"]})]}),r.jsx("div",{className:"w-full bg-blue-200 rounded-full h-2",children:r.jsx("div",{className:"bg-blue-600 h-2 rounded-full transition-all duration-300",style:{width:`${m}%`}})})]}),y.length===0?r.jsxs("div",{className:"text-center py-6 text-slate-400 text-sm",children:[n("machines.dtr.noDtrFiles"),t&&r.jsx("div",{className:"text-xs mt-1",children:n("machines.dtr.dragToUpload")})]}):r.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:y.map(l=>r.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all group",children:[r.jsxs("a",{href:I(l.url),target:"_blank",rel:"noreferrer",className:"flex items-center gap-3 overflow-hidden flex-1",children:[r.jsx("div",{className:"w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0",children:r.jsx("i",{className:"ph ph-file-pdf text-2xl"})}),r.jsxs("div",{className:"flex flex-col min-w-0",children:[r.jsx("span",{className:"text-sm font-bold text-slate-700 truncate",children:I(l.name)}),r.jsxs("div",{className:"text-[10px] text-gray-500 flex gap-2",children:[r.jsxs("span",{children:[(l.size/(1024*1024)).toFixed(2)," MB"]}),r.jsx("span",{children:"•"}),r.jsx("span",{children:I(new Date(l.uploadedAt).toLocaleDateString())})]})]})]}),r.jsxs("div",{className:"flex items-center shrink-0",children:[l.name&&l.name.toLowerCase().endsWith(".pdf")&&r.jsx("button",{onClick:g=>{g.preventDefault(),g.stopPropagation(),h(l),d(!0)},title:n("machines.dtr.askAi"),className:"ml-2 w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors",children:r.jsx("i",{className:"ph ph-sparkle text-lg"})}),t&&r.jsx("button",{onClick:()=>Se(l),className:"ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors",title:n("machines.buttons.deleteFile"),children:r.jsx("i",{className:"ph ph-trash"})})]})]},I(l.id)))}),r.jsxs("div",{className:"border-t border-slate-200 mt-2",children:[r.jsx("div",{className:"px-4 py-3 bg-slate-50 flex items-center justify-between",children:r.jsxs("h3",{className:"font-bold text-slate-800 flex items-center gap-2",children:[r.jsx("i",{className:"ph ph-notebook text-xl text-blue-600"}),n("machines.dtr.techNotesTitle")]})}),r.jsxs("div",{className:"p-4",children:[t&&r.jsxs("div",{className:"flex gap-2 mb-4",children:[r.jsxs("div",{className:"relative flex-1 flex items-center",children:[r.jsx("input",{type:"text",value:S,onChange:l=>O(l.target.value),onKeyDown:l=>l.key==="Enter"&&X(),placeholder:n("machines.dtr.addNotePlaceholder"),className:"flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"}),r.jsx("div",{className:"absolute right-2",children:r.jsx(Ee,{onResult:l=>O(g=>g?g+" "+l:l),className:"scale-75"})})]}),r.jsx("button",{onClick:X,disabled:!S.trim(),className:"bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm",children:n("machines.buttons.add")})]}),j.length===0?r.jsx("div",{className:"text-center py-4 text-slate-400 text-sm italic",children:n("machines.dtr.noTechNotes")}):r.jsx("div",{className:"space-y-3",children:j.map(l=>r.jsxs("div",{className:"bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex justify-between items-start",children:[r.jsxs("div",{className:"flex-1 mr-2",children:[r.jsx("div",{className:"text-sm text-gray-800 whitespace-pre-wrap font-medium",children:I(l.text)}),r.jsxs("div",{className:"text-[10px] text-gray-500 mt-1 uppercase tracking-wider",children:[I(l.createdBy)," • ",new Date(l.createdAt).toLocaleString("pl-PL")]})]}),s&&r.jsx("button",{onClick:()=>J(l.id),className:"w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0",title:n("machines.buttons.deleteNote"),children:r.jsx("i",{className:"ph ph-trash"})})]},I(l.id)))})]})]})]})]}),r.jsx(yt,{isOpen:c,onClose:()=>{d(!1),h(null)},document:p,allDocuments:y.filter(l=>l.name.toLowerCase().endsWith(".pdf")),machineName:e.name})]})}vt.propTypes={machine:G.object.isRequired,canManage:G.bool,canDeleteNotes:G.bool};function Rt(e=[],t=30,s=[]){const[n,o]=x.useState(1);x.useEffect(()=>{o(1)},s);const i=x.useMemo(()=>e.slice(0,n*t),[e,n,t]),a=i.length<e.length;return{currentItems:i,hasMore:a,loadMore:()=>{o(d=>d+1)},currentPage:n,setCurrentPage:o}}export{vt as M,I as s,Rt as u};
//# sourceMappingURL=usePagination-CxvoVSay.js.map
