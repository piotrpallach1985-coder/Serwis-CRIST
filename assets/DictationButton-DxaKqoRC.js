import{u as M,j as T,g as Y,C as wt}from"./index-C1A8ewhN.js";import{r as O}from"./react-vendor-BjNPbj-g.js";import{a as vt,c as Ct,_ as St,r as Z}from"./firebase-vendor-C5EvdceW.js";import{u as Tt}from"./useTranslation-BjhAFdZk.js";/**
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
 */const Ot="FirebaseError";class H extends Error{constructor(e,n,o){super(n),this.code=e,this.customData=o,this.name=Ot,Object.setPrototypeOf(this,H.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,At.prototype.create)}}class At{constructor(e,n,o){this.service=e,this.serviceName=n,this.errors=o}create(e,...n){const o=n[0]||{},s=`${this.service}/${e}`,i=this.errors[e],r=i?Nt(i,o):"Error",a=`${this.serviceName}: ${r} (${s}).`;return new H(s,a,o)}}function Nt(t,e){return t.replace(bt,(n,o)=>{const s=e[o];return s!=null?String(s):`<${o}?>`})}const bt=/\{\$([^}]+)}/g;/**
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
 */function kt(t){return t&&t._delegate?t._delegate:t}class Mt{constructor(e,n,o){this.name=e,this.instanceFactory=n,this.type=o,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}function P(t){return this instanceof P?(this.v=t,this):new P(t)}function Pt(t,e,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o=n.apply(t,e||[]),s,i=[];return s=Object.create((typeof AsyncIterator=="function"?AsyncIterator:Object).prototype),a("next"),a("throw"),a("return",r),s[Symbol.asyncIterator]=function(){return this},s;function r(l){return function(g){return Promise.resolve(g).then(l,p)}}function a(l,g){o[l]&&(s[l]=function(y){return new Promise(function(G,F){i.push([l,y,G,F])>1||c(l,y)})},g&&(s[l]=g(s[l])))}function c(l,g){try{d(o[l](g))}catch(y){E(i[0][3],y)}}function d(l){l.value instanceof P?Promise.resolve(l.value.v).then(u,p):E(i[0][2],l)}function u(l){c("next",l)}function p(l){c("throw",l)}function E(l,g){l(g),i.shift(),i.length&&c(i[0][0],i[0][1])}}var Q="@firebase/vertexai-preview",V="0.0.4";/**
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
 */const J="vertexAI",gt="us-central1",xt="https://firebaseml.googleapis.com",Lt="v2beta",tt=V,Dt="gl-js";/**
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
 */class $t{constructor(e,n,o,s){var i;this.app=e,this.options=s;const r=o==null?void 0:o.getImmediate({optional:!0}),a=n==null?void 0:n.getImmediate({optional:!0});this.auth=a||null,this.appCheck=r||null,this.location=((i=this.options)===null||i===void 0?void 0:i.location)||gt}_delete(){return Promise.resolve()}}/**
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
 */class f extends H{constructor(e,n,o){const s=J,i="VertexAI",r=`${s}/${e}`,a=`${i}: ${n} (${r}).`;super(r,a),this.code=e,this.message=n,this.customErrorData=o,Error.captureStackTrace&&Error.captureStackTrace(this,f),Object.setPrototypeOf(this,f.prototype),this.toString=()=>a}}/**
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
 */var x;(function(t){t.GENERATE_CONTENT="generateContent",t.STREAM_GENERATE_CONTENT="streamGenerateContent",t.COUNT_TOKENS="countTokens"})(x||(x={}));class mt{constructor(e,n,o,s,i){this.model=e,this.task=n,this.apiSettings=o,this.stream=s,this.requestOptions=i}toString(){var e;const n=Lt;let s=`${((e=this.requestOptions)===null||e===void 0?void 0:e.baseUrl)||xt}/${n}`;return s+=`/projects/${this.apiSettings.project}`,s+=`/locations/${this.apiSettings.location}`,s+=`/${this.model}`,s+=`:${this.task}`,this.stream&&(s+="?alt=sse"),s}get fullModelString(){let e=`projects/${this.apiSettings.project}`;return e+=`/locations/${this.apiSettings.location}`,e+=`/${this.model}`,e}}function jt(){const t=[];return t.push(`${Dt}/${tt}`),t.push(`fire/${tt}`),t.join(" ")}async function Ht(t){const e=new Headers;if(e.append("Content-Type","application/json"),e.append("x-goog-api-client",jt()),e.append("x-goog-api-key",t.apiSettings.apiKey),t.apiSettings.getAppCheckToken){const n=await t.apiSettings.getAppCheckToken();n&&!n.error&&e.append("X-Firebase-AppCheck",n.token)}if(t.apiSettings.getAuthToken){const n=await t.apiSettings.getAuthToken();n&&e.append("Authorization",`Firebase ${n.accessToken}`)}return e}async function Gt(t,e,n,o,s,i){const r=new mt(t,e,n,o,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},Ft(i)),{method:"POST",headers:await Ht(r),body:s})}}async function W(t,e,n,o,s,i){const r=new mt(t,e,n,o,i);let a;try{const c=await Gt(t,e,n,o,s,i);if(a=await fetch(c.url,c.fetchOptions),!a.ok){let d="",u;try{const p=await a.json();d=p.error.message,p.error.details&&(d+=` ${JSON.stringify(p.error.details)}`,u=p.error.details)}catch{}throw new f("fetch-error",`Error fetching from ${r}: [${a.status} ${a.statusText}] ${d}`,{status:a.status,statusText:a.statusText,errorDetails:u})}}catch(c){let d=c;throw c.code!=="fetch-error"&&c instanceof Error&&(d=new f("error",`Error fetching from ${r.toString()}: ${c.message}`),d.stack=c.stack),d}return a}function Ft(t){const e={};if(t!=null&&t.timeout&&(t==null?void 0:t.timeout)>=0){const n=new AbortController,o=n.signal;setTimeout(()=>n.abort(),t.timeout),e.signal=o}return e}/**
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
 */const et=["user","model","function","system"];var nt;(function(t){t.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",t.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",t.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",t.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",t.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})(nt||(nt={}));var st;(function(t){t.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",t.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",t.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",t.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",t.BLOCK_NONE="BLOCK_NONE"})(st||(st={}));var ot;(function(t){t.HARM_BLOCK_METHOD_UNSPECIFIED="HARM_BLOCK_METHOD_UNSPECIFIED",t.SEVERITY="SEVERITY",t.PROBABILITY="PROBABILITY"})(ot||(ot={}));var it;(function(t){t.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",t.NEGLIGIBLE="NEGLIGIBLE",t.LOW="LOW",t.MEDIUM="MEDIUM",t.HIGH="HIGH"})(it||(it={}));var rt;(function(t){t.HARM_SEVERITY_UNSPECIFIED="HARM_SEVERITY_UNSPECIFIED",t.HARM_SEVERITY_NEGLIGIBLE="HARM_SEVERITY_NEGLIGIBLE",t.HARM_SEVERITY_LOW="HARM_SEVERITY_LOW",t.HARM_SEVERITY_MEDIUM="HARM_SEVERITY_MEDIUM",t.HARM_SEVERITY_HIGH="HARM_SEVERITY_HIGH"})(rt||(rt={}));var at;(function(t){t.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",t.SAFETY="SAFETY",t.OTHER="OTHER"})(at||(at={}));var j;(function(t){t.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",t.STOP="STOP",t.MAX_TOKENS="MAX_TOKENS",t.SAFETY="SAFETY",t.RECITATION="RECITATION",t.OTHER="OTHER"})(j||(j={}));var ct;(function(t){t.MODE_UNSPECIFIED="MODE_UNSPECIFIED",t.AUTO="AUTO",t.ANY="ANY",t.NONE="NONE"})(ct||(ct={}));/**
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
 */var lt;(function(t){t.STRING="STRING",t.NUMBER="NUMBER",t.INTEGER="INTEGER",t.BOOLEAN="BOOLEAN",t.ARRAY="ARRAY",t.OBJECT="OBJECT"})(lt||(lt={}));/**
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
 */function X(t){return t.text=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,K(t.candidates[0]))throw new f("response-error",`Response error: ${A(t)}. Response body stored in error.response`,{response:t});return Ut(t)}else if(t.promptFeedback)throw new f("response-error",`Text not available. ${A(t)}`,{response:t});return""},t.functionCalls=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,K(t.candidates[0]))throw new f("response-error",`Response error: ${A(t)}. Response body stored in error.response`,{response:t});return Bt(t)}else if(t.promptFeedback)throw new f("response-error",`Function call not available. ${A(t)}`,{response:t})},t}function Ut(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.text&&i.push(r.text);return i.length>0?i.join(""):""}function Bt(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.functionCall&&i.push(r.functionCall);if(i.length>0)return i}const Yt=[j.RECITATION,j.SAFETY];function K(t){return!!t.finishReason&&Yt.includes(t.finishReason)}function A(t){var e,n,o;let s="";if((!t.candidates||t.candidates.length===0)&&t.promptFeedback)s+="Response was blocked",!((e=t.promptFeedback)===null||e===void 0)&&e.blockReason&&(s+=` due to ${t.promptFeedback.blockReason}`),!((n=t.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(s+=`: ${t.promptFeedback.blockReasonMessage}`);else if(!((o=t.candidates)===null||o===void 0)&&o[0]){const i=t.candidates[0];K(i)&&(s+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(s+=`: ${i.finishMessage}`))}return s}/**
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
 */const ut=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function zt(t){const e=t.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=qt(e),[o,s]=n.tee();return{stream:Kt(o),response:Vt(s)}}async function Vt(t){const e=[],n=t.getReader();for(;;){const{done:o,value:s}=await n.read();if(o)return X(Jt(e));e.push(s)}}function Kt(t){return Pt(this,arguments,function*(){const n=t.getReader();for(;;){const{value:o,done:s}=yield P(n.read());if(s)break;yield yield P(X(o))}})}function qt(t){const e=t.getReader();return new ReadableStream({start(o){let s="";return i();function i(){return e.read().then(({value:r,done:a})=>{if(a){if(s.trim()){o.error(new f("parse-failed","Failed to parse stream"));return}o.close();return}s+=r;let c=s.match(ut),d;for(;c;){try{d=JSON.parse(c[1])}catch{o.error(new f("parse-failed",`Error parsing JSON response: "${c[1]}`));return}o.enqueue(d),s=s.substring(c[0].length),c=s.match(ut)}return i()})}}})}function Jt(t){const e=t[t.length-1],n={promptFeedback:e==null?void 0:e.promptFeedback};for(const o of t)if(o.candidates)for(const s of o.candidates){const i=s.index;if(n.candidates||(n.candidates=[]),n.candidates[i]||(n.candidates[i]={index:s.index}),n.candidates[i].citationMetadata=s.citationMetadata,n.candidates[i].finishReason=s.finishReason,n.candidates[i].finishMessage=s.finishMessage,n.candidates[i].safetyRatings=s.safetyRatings,s.content&&s.content.parts){n.candidates[i].content||(n.candidates[i].content={role:s.content.role||"user",parts:[]});const r={};for(const a of s.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),Object.keys(r).length===0&&(r.text=""),n.candidates[i].content.parts.push(r)}}return n}/**
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
 */async function Et(t,e,n,o){const s=await W(e,x.STREAM_GENERATE_CONTENT,t,!0,JSON.stringify(n),o);return zt(s)}async function _t(t,e,n,o){const i=await(await W(e,x.GENERATE_CONTENT,t,!1,JSON.stringify(n),o)).json();return{response:X(i)}}/**
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
 */function yt(t){if(t!=null){if(typeof t=="string")return{role:"system",parts:[{text:t}]};if(t.text)return{role:"system",parts:[t]};if(t.parts)return t.role?t:{role:"system",parts:t.parts}}}function q(t){let e=[];if(typeof t=="string")e=[{text:t}];else for(const n of t)typeof n=="string"?e.push({text:n}):e.push(n);return Wt(e)}function Wt(t){const e={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of t)"functionResponse"in i?(n.parts.push(i),s=!0):(e.parts.push(i),o=!0);if(o&&s)throw new f("invalid-content","Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!o&&!s)throw new f("invalid-content","No Content is provided for sending chat message.");return o?e:n}function z(t){let e;return t.contents?e=t:e={contents:[q(t)]},t.systemInstruction&&(e.systemInstruction=yt(t.systemInstruction)),e}/**
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
 */const dt=["text","inlineData","functionCall","functionResponse"],Xt={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall"],system:["text"]},ft={user:["model"],function:["model"],model:["user","function"],system:[]};function Zt(t){let e=null;for(const n of t){const{role:o,parts:s}=n;if(!e&&o!=="user")throw new f("invalid-content",`First Content should be with role 'user', got ${o}`);if(!et.includes(o))throw new f("invalid-content",`Each item should include role field. Got ${o} but valid roles are: ${JSON.stringify(et)}`);if(!Array.isArray(s))throw new f("invalid-content","Content should have 'parts' but property with an array of Parts");if(s.length===0)throw new f("invalid-content","Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0};for(const a of s)for(const c of dt)c in a&&(i[c]+=1);const r=Xt[o];for(const a of dt)if(!r.includes(a)&&i[a]>0)throw new f("invalid-content",`Content with role '${o}' can't contain '${a}' part`);if(e&&!ft[o].includes(e.role))throw new f("invalid-content",`Content with role '${o} can't follow '${e.role}'. Valid previous roles: ${JSON.stringify(ft)}`);e=n}}/**
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
 */const pt="SILENT_ERROR";class Qt{constructor(e,n,o,s){this.model=n,this.params=o,this.requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=e,o!=null&&o.history&&(Zt(o.history),this._history=o.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e){var n,o,s,i,r;await this._sendPromise;const a=q(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]};let d={};return this._sendPromise=this._sendPromise.then(()=>_t(this._apiSettings,this.model,c,this.requestOptions)).then(u=>{var p,E;if(u.response.candidates&&u.response.candidates.length>0){this._history.push(a);const l={parts:((p=u.response.candidates)===null||p===void 0?void 0:p[0].content.parts)||[],role:((E=u.response.candidates)===null||E===void 0?void 0:E[0].content.role)||"model"};this._history.push(l)}else{const l=A(u.response)}d=u}),await this._sendPromise,d}async sendMessageStream(e){var n,o,s,i,r;await this._sendPromise;const a=q(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]},d=Et(this._apiSettings,this.model,c,this.requestOptions);return this._sendPromise=this._sendPromise.then(()=>d).catch(u=>{throw new Error(pt)}).then(u=>u.response).then(u=>{if(u.candidates&&u.candidates.length>0){this._history.push(a);const p=Object.assign({},u.candidates[0].content);p.role||(p.role="model"),this._history.push(p)}else{const p=A(u)}}).catch(u=>{u.message}),d}}/**
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
 */async function te(t,e,n,o){return(await W(e,x.COUNT_TOKENS,t,!1,JSON.stringify(n),o)).json()}/**
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
 */class ee{constructor(e,n,o){var s,i,r,a;if(!((i=(s=e.app)===null||s===void 0?void 0:s.options)===null||i===void 0)&&i.apiKey)if(!((a=(r=e.app)===null||r===void 0?void 0:r.options)===null||a===void 0)&&a.projectId)this._apiSettings={apiKey:e.app.options.apiKey,project:e.app.options.projectId,location:e.location},e.appCheck&&(this._apiSettings.getAppCheckToken=()=>e.appCheck.getToken()),e.auth&&(this._apiSettings.getAuthToken=()=>e.auth.getToken());else throw new f("no-project-id",'The "projectId" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid project ID.');else throw new f("no-api-key",'The "apiKey" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid API key.');n.model.includes("/")?n.model.startsWith("models/")?this.model=`publishers/google/${n.model}`:this.model=n.model:this.model=`publishers/google/models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=yt(n.systemInstruction),this.requestOptions=o||{}}async generateContent(e){const n=z(e);return _t(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}async generateContentStream(e){const n=z(e);return Et(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}startChat(e){return new Qt(this._apiSettings,this.model,Object.assign({tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},e),this.requestOptions)}async countTokens(e){const n=z(e);return te(this._apiSettings,this.model,n)}}/**
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
 */function ne(t=Ct(),e){return t=kt(t),vt(t,J).getImmediate({identifier:gt})}function ht(t,e,n){if(!e.model)throw new f("no-model","Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");return new ee(t,e,n)}function se(){St(new Mt(J,(t,{instanceIdentifier:e})=>{const n=t.getProvider("app").getImmediate(),o=t.getProvider("auth-internal"),s=t.getProvider("app-check-internal");return new $t(n,o,s,{location:e})},"PUBLIC").setMultipleInstances(!0)),Z(Q,V),Z(Q,V,"esm2017")}se();function le({onResult:t,onStart:e,className:n="",mode:o="text"}){const[s,i]=O.useState(!1),[r,a]=O.useState(!1),c=O.useRef(null),d=O.useRef([]),u=O.useRef(null),p=O.useRef(null),{i18n:E}=Tt(),l=M(h=>h.groqApiKey),g=M(h=>h.groqModel);M(h=>h.geminiPrice),M(h=>h.groqPrice);const y=M(h=>h.geminiModel)||"gemini-2.5-flash",G=g||"llama-3.1-8b-instant",F=async h=>{if(h.preventDefault(),!l){alert("Brak klucza API Groq. Poproś Administratora o dodanie klucza w Panelu SaaS.");return}try{const N=await navigator.mediaDevices.getUserMedia({audio:!0});u.current=N;const _=new MediaRecorder(N);c.current=_,d.current=[],_.ondataavailable=m=>{m.data.size>0&&d.current.push(m.data)},_.onstop=async()=>{const m=_.mimeType||"audio/webm",L=m.includes("mp4")?"mp4":m.includes("ogg")?"ogg":"webm",D=new Blob(d.current,{type:m});u.current&&u.current.getTracks().forEach(b=>b.stop());const R=Math.max(1,Math.ceil((Date.now()-p.current)/1e3));await It(D,L,R)},_.start(),p.current=Date.now(),i(!0),e&&e()}catch{alert("Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.")}},Rt=h=>{h.preventDefault(),c.current&&s&&(c.current.stop(),i(!1))},It=async(h,N,_=1)=>{var m,L,D;a(!0);try{const R=new FormData;R.append("file",h,`audio.${N}`),R.append("model",G||"whisper-large-v3");const b=await fetch("https://api.groq.com/openai/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${l}`},body:R});if(!b.ok){const w=await b.json();throw new Error(((m=w.error)==null?void 0:m.message)||"Błąd podczas transkrypcji dźwięku.")}const I=(await b.json()).text;if(_>0){const w=Y(),C=_/60}if(!I||I.trim().length===0){a(!1);return}let $=I;try{const w=ne(wt);if(o==="smart"){const U=await ht(w,{model:y,systemInstruction:"Jesteś ekspertem utrzymania ruchu. Otrzymasz surowy tekst (z dyktowania).",generationConfig:{responseMimeType:"application/json",responseSchema:{type:"object",properties:{note:{type:"string",description:"profesjonalna notatka o zrobionej pracy, bez wspominania o czasie i zadaniach"},timeSpentHours:{type:"number",nullable:!0},actionItem:{type:"string",nullable:!0},actionItemDays:{type:"number",nullable:!0}},required:["note"]}}}).generateContent(I),k=U.response.text();try{$=JSON.parse(k)}catch{throw new Error("Niepoprawny format danych JSON od Gemini")}let v=((L=U.response.usageMetadata)==null?void 0:L.totalTokenCount)||0;if(v===0){const S=I.length+300,B=k.length;v=Math.ceil((S+B)/4)}if(v>0){const S=Y()}}else{const C=E.language==="en"?"angielski":"polski",k=await ht(w,{model:y,systemInstruction:`Jesteś asystentem technicznym. Interfejs systemu jest w języku: ${C.toUpperCase()}. Otrzymasz surowy tekst podyktowany przez pracownika stoczni. 
1. Jeśli oryginalny podyktowany tekst jest w języku ${C} (albo bardzo do niego zbliżonym), po prostu sformatuj go poprawnie (dodaj interpunkcję) i zwróć TYLKO sam sformatowany tekst (bez dopisków o tłumaczeniu).
2. Jeśli oryginalny tekst jest w INNYM języku, przetłumacz go na język ${C}. Wtedy (i tylko wtedy) zwróć wynik DOKŁADNIE w tym formacie:
[Oryginalny podyktowany tekst]

---
Tłumaczenie (${C}):
[Przetłumaczony tekst]`}).generateContent(I);$=k.response.text().trim();let v=((D=k.response.usageMetadata)==null?void 0:D.totalTokenCount)||0;if(v===0){const S=I.length+500,B=$.length;v=Math.ceil((S+B)/4)}if(v>0){const S=Y()}}}catch(w){throw new Error("Błąd AI Gemini: "+w.message)}t&&t($)}catch(R){alert("Błąd AI: "+R.message)}finally{a(!1)}};return T.jsxs("button",{type:"button",onClick:s?Rt:F,disabled:r,className:`relative flex items-center justify-center p-2 rounded-full transition-all shrink-0 z-10
        ${s?"bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/50":r?"bg-amber-400 text-white cursor-wait":o==="smart"?"bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 shadow-sm":"bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600"} ${n}`,title:s?"Zatrzymaj nagrywanie":o==="smart"?"Inteligentne Dyktowanie (Wypełnij automatycznie formularz)":"Podyktuj tekst (AI Whisper)",children:[r?T.jsx("i",{className:"ph ph-spinner animate-spin text-lg"}):T.jsx("i",{className:`ph ${s?"ph-stop":o==="smart"?"ph-magic-wand":"ph-microphone"} text-lg`}),s&&T.jsxs("span",{className:"absolute -top-1 -right-1 flex h-2 w-2",children:[T.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"}),T.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-red-500"})]})]})}export{le as D,ht as a,ne as g};
//# sourceMappingURL=DictationButton-DxaKqoRC.js.map
