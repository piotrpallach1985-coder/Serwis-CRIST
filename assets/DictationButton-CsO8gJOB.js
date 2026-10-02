import{ao as Ot,ap as At,aq as Nt,ar as nt,r as P,d as L,j as T,m as z,B as V,g as K,f as q,am as O,al as bt}from"./index-BZsslfSl.js";import{u as kt}from"./useTranslation-B50bzaqE.js";/**
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
 */const Mt="FirebaseError";class F extends Error{constructor(e,n,o){super(n),this.code=e,this.customData=o,this.name=Mt,Object.setPrototypeOf(this,F.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Pt.prototype.create)}}class Pt{constructor(e,n,o){this.service=e,this.serviceName=n,this.errors=o}create(e,...n){const o=n[0]||{},s=`${this.service}/${e}`,i=this.errors[e],r=i?Lt(i,o):"Error",a=`${this.serviceName}: ${r} (${s}).`;return new F(s,a,o)}}function Lt(t,e){return t.replace(xt,(n,o)=>{const s=e[o];return s!=null?String(s):`<${o}?>`})}const xt=/\{\$([^}]+)}/g;/**
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
 */function $t(t){return t&&t._delegate?t._delegate:t}class Dt{constructor(e,n,o){this.name=e,this.instanceFactory=n,this.type=o,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}function x(t){return this instanceof x?(this.v=t,this):new x(t)}function jt(t,e,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o=n.apply(t,e||[]),s,i=[];return s=Object.create((typeof AsyncIterator=="function"?AsyncIterator:Object).prototype),a("next"),a("throw"),a("return",r),s[Symbol.asyncIterator]=function(){return this},s;function r(u){return function(g){return Promise.resolve(g).then(u,p)}}function a(u,g){o[u]&&(s[u]=function(w){return new Promise(function(D,U){i.push([u,w,D,U])>1||c(u,w)})},g&&(s[u]=g(s[u])))}function c(u,g){try{d(o[u](g))}catch(w){_(i[0][3],w)}}function d(u){u.value instanceof x?Promise.resolve(u.value.v).then(l,p):_(i[0][2],u)}function l(u){c("next",u)}function p(u){c("throw",u)}function _(u,g){u(g),i.shift(),i.length&&c(i[0][0],i[0][1])}}var st="@firebase/vertexai-preview",W="0.0.4";/**
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
 */const Q="vertexAI",yt="us-central1",Ht="https://firebaseml.googleapis.com",Gt="v2beta",ot=W,Ft="gl-js";/**
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
 */class Ut{constructor(e,n,o,s){var i;this.app=e,this.options=s;const r=o==null?void 0:o.getImmediate({optional:!0}),a=n==null?void 0:n.getImmediate({optional:!0});this.auth=a||null,this.appCheck=r||null,this.location=((i=this.options)===null||i===void 0?void 0:i.location)||yt}_delete(){return Promise.resolve()}}/**
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
 */class f extends F{constructor(e,n,o){const s=Q,i="VertexAI",r=`${s}/${e}`,a=`${i}: ${n} (${r}).`;super(r,a),this.code=e,this.message=n,this.customErrorData=o,Error.captureStackTrace&&Error.captureStackTrace(this,f),Object.setPrototypeOf(this,f.prototype),this.toString=()=>a}}/**
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
 */var $;(function(t){t.GENERATE_CONTENT="generateContent",t.STREAM_GENERATE_CONTENT="streamGenerateContent",t.COUNT_TOKENS="countTokens"})($||($={}));class Rt{constructor(e,n,o,s,i){this.model=e,this.task=n,this.apiSettings=o,this.stream=s,this.requestOptions=i}toString(){var e;const n=Gt;let s=`${((e=this.requestOptions)===null||e===void 0?void 0:e.baseUrl)||Ht}/${n}`;return s+=`/projects/${this.apiSettings.project}`,s+=`/locations/${this.apiSettings.location}`,s+=`/${this.model}`,s+=`:${this.task}`,this.stream&&(s+="?alt=sse"),s}get fullModelString(){let e=`projects/${this.apiSettings.project}`;return e+=`/locations/${this.apiSettings.location}`,e+=`/${this.model}`,e}}function Bt(){const t=[];return t.push(`${Ft}/${ot}`),t.push(`fire/${ot}`),t.join(" ")}async function Yt(t){const e=new Headers;if(e.append("Content-Type","application/json"),e.append("x-goog-api-client",Bt()),e.append("x-goog-api-key",t.apiSettings.apiKey),t.apiSettings.getAppCheckToken){const n=await t.apiSettings.getAppCheckToken();n&&!n.error&&e.append("X-Firebase-AppCheck",n.token)}if(t.apiSettings.getAuthToken){const n=await t.apiSettings.getAuthToken();n&&e.append("Authorization",`Firebase ${n.accessToken}`)}return e}async function zt(t,e,n,o,s,i){const r=new Rt(t,e,n,o,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},Vt(i)),{method:"POST",headers:await Yt(r),body:s})}}async function tt(t,e,n,o,s,i){const r=new Rt(t,e,n,o,i);let a;try{const c=await zt(t,e,n,o,s,i);if(a=await fetch(c.url,c.fetchOptions),!a.ok){let d="",l;try{const p=await a.json();d=p.error.message,p.error.details&&(d+=` ${JSON.stringify(p.error.details)}`,l=p.error.details)}catch{}throw new f("fetch-error",`Error fetching from ${r}: [${a.status} ${a.statusText}] ${d}`,{status:a.status,statusText:a.statusText,errorDetails:l})}}catch(c){let d=c;throw c.code!=="fetch-error"&&c instanceof Error&&(d=new f("error",`Error fetching from ${r.toString()}: ${c.message}`),d.stack=c.stack),d}return a}function Vt(t){const e={};if(t!=null&&t.timeout&&(t==null?void 0:t.timeout)>=0){const n=new AbortController,o=n.signal;setTimeout(()=>n.abort(),t.timeout),e.signal=o}return e}/**
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
 */const it=["user","model","function","system"];var rt;(function(t){t.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",t.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",t.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",t.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",t.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})(rt||(rt={}));var at;(function(t){t.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",t.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",t.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",t.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",t.BLOCK_NONE="BLOCK_NONE"})(at||(at={}));var ct;(function(t){t.HARM_BLOCK_METHOD_UNSPECIFIED="HARM_BLOCK_METHOD_UNSPECIFIED",t.SEVERITY="SEVERITY",t.PROBABILITY="PROBABILITY"})(ct||(ct={}));var lt;(function(t){t.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",t.NEGLIGIBLE="NEGLIGIBLE",t.LOW="LOW",t.MEDIUM="MEDIUM",t.HIGH="HIGH"})(lt||(lt={}));var ut;(function(t){t.HARM_SEVERITY_UNSPECIFIED="HARM_SEVERITY_UNSPECIFIED",t.HARM_SEVERITY_NEGLIGIBLE="HARM_SEVERITY_NEGLIGIBLE",t.HARM_SEVERITY_LOW="HARM_SEVERITY_LOW",t.HARM_SEVERITY_MEDIUM="HARM_SEVERITY_MEDIUM",t.HARM_SEVERITY_HIGH="HARM_SEVERITY_HIGH"})(ut||(ut={}));var dt;(function(t){t.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",t.SAFETY="SAFETY",t.OTHER="OTHER"})(dt||(dt={}));var G;(function(t){t.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",t.STOP="STOP",t.MAX_TOKENS="MAX_TOKENS",t.SAFETY="SAFETY",t.RECITATION="RECITATION",t.OTHER="OTHER"})(G||(G={}));var ft;(function(t){t.MODE_UNSPECIFIED="MODE_UNSPECIFIED",t.AUTO="AUTO",t.ANY="ANY",t.NONE="NONE"})(ft||(ft={}));/**
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
 */var pt;(function(t){t.STRING="STRING",t.NUMBER="NUMBER",t.INTEGER="INTEGER",t.BOOLEAN="BOOLEAN",t.ARRAY="ARRAY",t.OBJECT="OBJECT"})(pt||(pt={}));/**
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
 */function et(t){return t.text=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,X(t.candidates[0]))throw new f("response-error",`Response error: ${A(t)}. Response body stored in error.response`,{response:t});return Kt(t)}else if(t.promptFeedback)throw new f("response-error",`Text not available. ${A(t)}`,{response:t});return""},t.functionCalls=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,X(t.candidates[0]))throw new f("response-error",`Response error: ${A(t)}. Response body stored in error.response`,{response:t});return qt(t)}else if(t.promptFeedback)throw new f("response-error",`Function call not available. ${A(t)}`,{response:t})},t}function Kt(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.text&&i.push(r.text);return i.length>0?i.join(""):""}function qt(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.functionCall&&i.push(r.functionCall);if(i.length>0)return i}const Jt=[G.RECITATION,G.SAFETY];function X(t){return!!t.finishReason&&Jt.includes(t.finishReason)}function A(t){var e,n,o;let s="";if((!t.candidates||t.candidates.length===0)&&t.promptFeedback)s+="Response was blocked",!((e=t.promptFeedback)===null||e===void 0)&&e.blockReason&&(s+=` due to ${t.promptFeedback.blockReason}`),!((n=t.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(s+=`: ${t.promptFeedback.blockReasonMessage}`);else if(!((o=t.candidates)===null||o===void 0)&&o[0]){const i=t.candidates[0];X(i)&&(s+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(s+=`: ${i.finishMessage}`))}return s}/**
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
 */const ht=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function Wt(t){const e=t.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=Qt(e),[o,s]=n.tee();return{stream:Zt(o),response:Xt(s)}}async function Xt(t){const e=[],n=t.getReader();for(;;){const{done:o,value:s}=await n.read();if(o)return et(te(e));e.push(s)}}function Zt(t){return jt(this,arguments,function*(){const n=t.getReader();for(;;){const{value:o,done:s}=yield x(n.read());if(s)break;yield yield x(et(o))}})}function Qt(t){const e=t.getReader();return new ReadableStream({start(o){let s="";return i();function i(){return e.read().then(({value:r,done:a})=>{if(a){if(s.trim()){o.error(new f("parse-failed","Failed to parse stream"));return}o.close();return}s+=r;let c=s.match(ht),d;for(;c;){try{d=JSON.parse(c[1])}catch{o.error(new f("parse-failed",`Error parsing JSON response: "${c[1]}`));return}o.enqueue(d),s=s.substring(c[0].length),c=s.match(ht)}return i()})}}})}function te(t){const e=t[t.length-1],n={promptFeedback:e==null?void 0:e.promptFeedback};for(const o of t)if(o.candidates)for(const s of o.candidates){const i=s.index;if(n.candidates||(n.candidates=[]),n.candidates[i]||(n.candidates[i]={index:s.index}),n.candidates[i].citationMetadata=s.citationMetadata,n.candidates[i].finishReason=s.finishReason,n.candidates[i].finishMessage=s.finishMessage,n.candidates[i].safetyRatings=s.safetyRatings,s.content&&s.content.parts){n.candidates[i].content||(n.candidates[i].content={role:s.content.role||"user",parts:[]});const r={};for(const a of s.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),Object.keys(r).length===0&&(r.text=""),n.candidates[i].content.parts.push(r)}}return n}/**
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
 */async function It(t,e,n,o){const s=await tt(e,$.STREAM_GENERATE_CONTENT,t,!0,JSON.stringify(n),o);return Wt(s)}async function vt(t,e,n,o){const i=await(await tt(e,$.GENERATE_CONTENT,t,!1,JSON.stringify(n),o)).json();return{response:et(i)}}/**
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
 */function Ct(t){if(t!=null){if(typeof t=="string")return{role:"system",parts:[{text:t}]};if(t.text)return{role:"system",parts:[t]};if(t.parts)return t.role?t:{role:"system",parts:t.parts}}}function Z(t){let e=[];if(typeof t=="string")e=[{text:t}];else for(const n of t)typeof n=="string"?e.push({text:n}):e.push(n);return ee(e)}function ee(t){const e={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of t)"functionResponse"in i?(n.parts.push(i),s=!0):(e.parts.push(i),o=!0);if(o&&s)throw new f("invalid-content","Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!o&&!s)throw new f("invalid-content","No Content is provided for sending chat message.");return o?e:n}function J(t){let e;return t.contents?e=t:e={contents:[Z(t)]},t.systemInstruction&&(e.systemInstruction=Ct(t.systemInstruction)),e}/**
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
 */const gt=["text","inlineData","functionCall","functionResponse"],ne={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall"],system:["text"]},mt={user:["model"],function:["model"],model:["user","function"],system:[]};function se(t){let e=null;for(const n of t){const{role:o,parts:s}=n;if(!e&&o!=="user")throw new f("invalid-content",`First Content should be with role 'user', got ${o}`);if(!it.includes(o))throw new f("invalid-content",`Each item should include role field. Got ${o} but valid roles are: ${JSON.stringify(it)}`);if(!Array.isArray(s))throw new f("invalid-content","Content should have 'parts' but property with an array of Parts");if(s.length===0)throw new f("invalid-content","Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0};for(const a of s)for(const c of gt)c in a&&(i[c]+=1);const r=ne[o];for(const a of gt)if(!r.includes(a)&&i[a]>0)throw new f("invalid-content",`Content with role '${o}' can't contain '${a}' part`);if(e&&!mt[o].includes(e.role))throw new f("invalid-content",`Content with role '${o} can't follow '${e.role}'. Valid previous roles: ${JSON.stringify(mt)}`);e=n}}/**
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
 */const Et="SILENT_ERROR";class oe{constructor(e,n,o,s){this.model=n,this.params=o,this.requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=e,o!=null&&o.history&&(se(o.history),this._history=o.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e){var n,o,s,i,r;await this._sendPromise;const a=Z(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]};let d={};return this._sendPromise=this._sendPromise.then(()=>vt(this._apiSettings,this.model,c,this.requestOptions)).then(l=>{var p,_;if(l.response.candidates&&l.response.candidates.length>0){this._history.push(a);const u={parts:((p=l.response.candidates)===null||p===void 0?void 0:p[0].content.parts)||[],role:((_=l.response.candidates)===null||_===void 0?void 0:_[0].content.role)||"model"};this._history.push(u)}else{const u=A(l.response)}d=l}),await this._sendPromise,d}async sendMessageStream(e){var n,o,s,i,r;await this._sendPromise;const a=Z(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]},d=It(this._apiSettings,this.model,c,this.requestOptions);return this._sendPromise=this._sendPromise.then(()=>d).catch(l=>{throw new Error(Et)}).then(l=>l.response).then(l=>{if(l.candidates&&l.candidates.length>0){this._history.push(a);const p=Object.assign({},l.candidates[0].content);p.role||(p.role="model"),this._history.push(p)}else{const p=A(l)}}).catch(l=>{l.message}),d}}/**
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
 */async function ie(t,e,n,o){return(await tt(e,$.COUNT_TOKENS,t,!1,JSON.stringify(n),o)).json()}/**
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
 */class re{constructor(e,n,o){var s,i,r,a;if(!((i=(s=e.app)===null||s===void 0?void 0:s.options)===null||i===void 0)&&i.apiKey)if(!((a=(r=e.app)===null||r===void 0?void 0:r.options)===null||a===void 0)&&a.projectId)this._apiSettings={apiKey:e.app.options.apiKey,project:e.app.options.projectId,location:e.location},e.appCheck&&(this._apiSettings.getAppCheckToken=()=>e.appCheck.getToken()),e.auth&&(this._apiSettings.getAuthToken=()=>e.auth.getToken());else throw new f("no-project-id",'The "projectId" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid project ID.');else throw new f("no-api-key",'The "apiKey" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid API key.');n.model.includes("/")?n.model.startsWith("models/")?this.model=`publishers/google/${n.model}`:this.model=n.model:this.model=`publishers/google/models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=Ct(n.systemInstruction),this.requestOptions=o||{}}async generateContent(e){const n=J(e);return vt(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}async generateContentStream(e){const n=J(e);return It(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}startChat(e){return new oe(this._apiSettings,this.model,Object.assign({tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},e),this.requestOptions)}async countTokens(e){const n=J(e);return ie(this._apiSettings,this.model,n)}}/**
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
 */function ae(t=At(),e){return t=$t(t),Ot(t,Q).getImmediate({identifier:yt})}function _t(t,e,n){if(!e.model)throw new f("no-model","Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");return new re(t,e,n)}function ce(){Nt(new Dt(Q,(t,{instanceIdentifier:e})=>{const n=t.getProvider("app").getImmediate(),o=t.getProvider("auth-internal"),s=t.getProvider("app-check-internal");return new Ut(n,o,s,{location:e})},"PUBLIC").setMultipleInstances(!0)),nt(st,W),nt(st,W,"esm2017")}ce();function fe({onResult:t,onStart:e,className:n="",mode:o="text"}){const[s,i]=P.useState(!1),[r,a]=P.useState(!1),c=P.useRef(null),d=P.useRef([]),l=P.useRef(null),{i18n:p}=kt(),_=L(h=>h.groqApiKey),u=L(h=>h.groqModel),g=L(h=>h.geminiPrice)||.6,w=L(h=>h.groqPrice)||.4,D=L(h=>h.geminiModel)||"gemini-2.5-flash",U=u||"llama-3.1-8b-instant",wt=async h=>{if(h.preventDefault(),!_){alert("Brak klucza API Groq. Poproś Administratora o dodanie klucza w Panelu SaaS.");return}try{const N=await navigator.mediaDevices.getUserMedia({audio:!0});l.current=N;const I=new MediaRecorder(N);c.current=I,d.current=[],I.ondataavailable=y=>{y.data.size>0&&d.current.push(y.data)},I.onstop=async()=>{const y=I.mimeType||"audio/webm",j=y.includes("mp4")?"mp4":y.includes("ogg")?"ogg":"webm",C=new Blob(d.current,{type:y});l.current&&l.current.getTracks().forEach(b=>b.stop()),await Tt(C,j)},I.start(),i(!0),e&&e()}catch{alert("Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.")}},St=h=>{h.preventDefault(),c.current&&s&&(c.current.stop(),i(!1))},Tt=async(h,N)=>{var I,y,j;a(!0);try{const C=new FormData;C.append("file",h,`audio.${N}`),C.append("model",U||"whisper-large-v3");const b=await fetch("https://api.groq.com/openai/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${_}`},body:C});if(!b.ok){const R=await b.json();throw new Error(((I=R.error)==null?void 0:I.message)||"Błąd podczas transkrypcji dźwięku.")}const v=(await b.json()).text,B=Math.ceil(v.length/3);if(B>0){const R=z();R&&V(K(q,"tenants",R,"stats","ai_usage"),{groqTokens:O(B),groqCost:O(B/1e6*w)},{merge:!0}).catch(S=>{})}if(!v||v.trim().length===0){a(!1);return}let H=v;try{const R=ae(bt);if(o==="smart"){const Y=await _t(R,{model:D,systemInstruction:"Jesteś ekspertem utrzymania ruchu. Otrzymasz surowy tekst (z dyktowania).",generationConfig:{responseMimeType:"application/json",responseSchema:{type:"object",properties:{note:{type:"string",description:"profesjonalna notatka o zrobionej pracy, bez wspominania o czasie i zadaniach"},timeSpentHours:{type:"number",nullable:!0},actionItem:{type:"string",nullable:!0},actionItemDays:{type:"number",nullable:!0}},required:["note"]}}}).generateContent(v),k=Y.response.text();try{H=JSON.parse(k)}catch{throw new Error("Niepoprawny format danych JSON od Gemini")}let m=((y=Y.response.usageMetadata)==null?void 0:y.totalTokenCount)||0;if(m===0){const E=v.length+300,M=k.length;m=Math.ceil((E+M)/4)}if(m>0){const E=z();E&&V(K(q,"tenants",E,"stats","ai_usage"),{geminiTokens:O(m),geminiCost:O(m/1e6*g)},{merge:!0}).catch(M=>{})}}else{const S=p.language==="en"?"angielski":"polski",k=await _t(R,{model:D,systemInstruction:`Jesteś asystentem technicznym. Interfejs systemu jest w języku: ${S.toUpperCase()}. Otrzymasz surowy tekst podyktowany przez pracownika stoczni. 
1. Jeśli oryginalny podyktowany tekst jest w języku ${S} (albo bardzo do niego zbliżonym), po prostu sformatuj go poprawnie (dodaj interpunkcję) i zwróć TYLKO sam sformatowany tekst (bez dopisków o tłumaczeniu).
2. Jeśli oryginalny tekst jest w INNYM języku, przetłumacz go na język ${S}. Wtedy (i tylko wtedy) zwróć wynik DOKŁADNIE w tym formacie:
[Oryginalny podyktowany tekst]

---
Tłumaczenie (${S}):
[Przetłumaczony tekst]`}).generateContent(v);H=k.response.text().trim();let m=((j=k.response.usageMetadata)==null?void 0:j.totalTokenCount)||0;if(m===0){const E=v.length+500,M=H.length;m=Math.ceil((E+M)/4)}if(m>0){const E=z();E&&V(K(q,"tenants",E,"stats","ai_usage"),{geminiTokens:O(m),geminiCost:O(m/1e6*g)},{merge:!0}).catch(M=>{})}}}catch(R){throw new Error("Błąd AI Gemini: "+R.message)}t&&t(H)}catch(C){alert("Błąd AI: "+C.message)}finally{a(!1)}};return T.jsxs("button",{type:"button",onClick:s?St:wt,disabled:r,className:`relative flex items-center justify-center p-2 rounded-full transition-all shrink-0 z-10
        ${s?"bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/50":r?"bg-amber-400 text-white cursor-wait":o==="smart"?"bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 shadow-sm":"bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600"} ${n}`,title:s?"Zatrzymaj nagrywanie":o==="smart"?"Inteligentne Dyktowanie (Wypełnij automatycznie formularz)":"Podyktuj tekst (AI Whisper)",children:[r?T.jsx("i",{className:"ph ph-spinner animate-spin text-lg"}):T.jsx("i",{className:`ph ${s?"ph-stop":o==="smart"?"ph-magic-wand":"ph-microphone"} text-lg`}),s&&T.jsxs("span",{className:"absolute -top-1 -right-1 flex h-2 w-2",children:[T.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"}),T.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-red-500"})]})]})}export{fe as D,_t as a,ae as g};
//# sourceMappingURL=DictationButton-CsO8gJOB.js.map
