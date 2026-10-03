import{ao as At,ap as Nt,aq as bt,ar as nt,r as T,d as x,j as O,m as z,C as V,g as K,f as q,am as A,al as kt}from"./index-QrWkEGZD.js";import{u as Mt}from"./useTranslation-BmARU_iH.js";/**
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
 */const Pt="FirebaseError";class B extends Error{constructor(e,n,o){super(n),this.code=e,this.customData=o,this.name=Pt,Object.setPrototypeOf(this,B.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,xt.prototype.create)}}class xt{constructor(e,n,o){this.service=e,this.serviceName=n,this.errors=o}create(e,...n){const o=n[0]||{},s=`${this.service}/${e}`,i=this.errors[e],r=i?Lt(i,o):"Error",a=`${this.serviceName}: ${r} (${s}).`;return new B(s,a,o)}}function Lt(t,e){return t.replace(Dt,(n,o)=>{const s=e[o];return s!=null?String(s):`<${o}?>`})}const Dt=/\{\$([^}]+)}/g;/**
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
 */function $t(t){return t&&t._delegate?t._delegate:t}class jt{constructor(e,n,o){this.name=e,this.instanceFactory=n,this.type=o,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}function L(t){return this instanceof L?(this.v=t,this):new L(t)}function Ht(t,e,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o=n.apply(t,e||[]),s,i=[];return s=Object.create((typeof AsyncIterator=="function"?AsyncIterator:Object).prototype),a("next"),a("throw"),a("return",r),s[Symbol.asyncIterator]=function(){return this},s;function r(l){return function(m){return Promise.resolve(m).then(l,p)}}function a(l,m){o[l]&&(s[l]=function(w){return new Promise(function(Y,$){i.push([l,w,Y,$])>1||c(l,w)})},m&&(s[l]=m(s[l])))}function c(l,m){try{d(o[l](m))}catch(w){I(i[0][3],w)}}function d(l){l.value instanceof L?Promise.resolve(l.value.v).then(u,p):I(i[0][2],l)}function u(l){c("next",l)}function p(l){c("throw",l)}function I(l,m){l(m),i.shift(),i.length&&c(i[0][0],i[0][1])}}var st="@firebase/vertexai-preview",W="0.0.4";/**
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
 */const Q="vertexAI",yt="us-central1",Gt="https://firebaseml.googleapis.com",Ft="v2beta",ot=W,Ut="gl-js";/**
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
 */class Bt{constructor(e,n,o,s){var i;this.app=e,this.options=s;const r=o==null?void 0:o.getImmediate({optional:!0}),a=n==null?void 0:n.getImmediate({optional:!0});this.auth=a||null,this.appCheck=r||null,this.location=((i=this.options)===null||i===void 0?void 0:i.location)||yt}_delete(){return Promise.resolve()}}/**
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
 */class f extends B{constructor(e,n,o){const s=Q,i="VertexAI",r=`${s}/${e}`,a=`${i}: ${n} (${r}).`;super(r,a),this.code=e,this.message=n,this.customErrorData=o,Error.captureStackTrace&&Error.captureStackTrace(this,f),Object.setPrototypeOf(this,f.prototype),this.toString=()=>a}}/**
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
 */var D;(function(t){t.GENERATE_CONTENT="generateContent",t.STREAM_GENERATE_CONTENT="streamGenerateContent",t.COUNT_TOKENS="countTokens"})(D||(D={}));class Rt{constructor(e,n,o,s,i){this.model=e,this.task=n,this.apiSettings=o,this.stream=s,this.requestOptions=i}toString(){var e;const n=Ft;let s=`${((e=this.requestOptions)===null||e===void 0?void 0:e.baseUrl)||Gt}/${n}`;return s+=`/projects/${this.apiSettings.project}`,s+=`/locations/${this.apiSettings.location}`,s+=`/${this.model}`,s+=`:${this.task}`,this.stream&&(s+="?alt=sse"),s}get fullModelString(){let e=`projects/${this.apiSettings.project}`;return e+=`/locations/${this.apiSettings.location}`,e+=`/${this.model}`,e}}function Yt(){const t=[];return t.push(`${Ut}/${ot}`),t.push(`fire/${ot}`),t.join(" ")}async function zt(t){const e=new Headers;if(e.append("Content-Type","application/json"),e.append("x-goog-api-client",Yt()),e.append("x-goog-api-key",t.apiSettings.apiKey),t.apiSettings.getAppCheckToken){const n=await t.apiSettings.getAppCheckToken();n&&!n.error&&e.append("X-Firebase-AppCheck",n.token)}if(t.apiSettings.getAuthToken){const n=await t.apiSettings.getAuthToken();n&&e.append("Authorization",`Firebase ${n.accessToken}`)}return e}async function Vt(t,e,n,o,s,i){const r=new Rt(t,e,n,o,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},Kt(i)),{method:"POST",headers:await zt(r),body:s})}}async function tt(t,e,n,o,s,i){const r=new Rt(t,e,n,o,i);let a;try{const c=await Vt(t,e,n,o,s,i);if(a=await fetch(c.url,c.fetchOptions),!a.ok){let d="",u;try{const p=await a.json();d=p.error.message,p.error.details&&(d+=` ${JSON.stringify(p.error.details)}`,u=p.error.details)}catch{}throw new f("fetch-error",`Error fetching from ${r}: [${a.status} ${a.statusText}] ${d}`,{status:a.status,statusText:a.statusText,errorDetails:u})}}catch(c){let d=c;throw c.code!=="fetch-error"&&c instanceof Error&&(d=new f("error",`Error fetching from ${r.toString()}: ${c.message}`),d.stack=c.stack),d}return a}function Kt(t){const e={};if(t!=null&&t.timeout&&(t==null?void 0:t.timeout)>=0){const n=new AbortController,o=n.signal;setTimeout(()=>n.abort(),t.timeout),e.signal=o}return e}/**
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
 */const it=["user","model","function","system"];var rt;(function(t){t.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",t.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",t.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",t.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",t.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})(rt||(rt={}));var at;(function(t){t.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",t.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",t.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",t.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",t.BLOCK_NONE="BLOCK_NONE"})(at||(at={}));var ct;(function(t){t.HARM_BLOCK_METHOD_UNSPECIFIED="HARM_BLOCK_METHOD_UNSPECIFIED",t.SEVERITY="SEVERITY",t.PROBABILITY="PROBABILITY"})(ct||(ct={}));var lt;(function(t){t.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",t.NEGLIGIBLE="NEGLIGIBLE",t.LOW="LOW",t.MEDIUM="MEDIUM",t.HIGH="HIGH"})(lt||(lt={}));var ut;(function(t){t.HARM_SEVERITY_UNSPECIFIED="HARM_SEVERITY_UNSPECIFIED",t.HARM_SEVERITY_NEGLIGIBLE="HARM_SEVERITY_NEGLIGIBLE",t.HARM_SEVERITY_LOW="HARM_SEVERITY_LOW",t.HARM_SEVERITY_MEDIUM="HARM_SEVERITY_MEDIUM",t.HARM_SEVERITY_HIGH="HARM_SEVERITY_HIGH"})(ut||(ut={}));var dt;(function(t){t.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",t.SAFETY="SAFETY",t.OTHER="OTHER"})(dt||(dt={}));var U;(function(t){t.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",t.STOP="STOP",t.MAX_TOKENS="MAX_TOKENS",t.SAFETY="SAFETY",t.RECITATION="RECITATION",t.OTHER="OTHER"})(U||(U={}));var ft;(function(t){t.MODE_UNSPECIFIED="MODE_UNSPECIFIED",t.AUTO="AUTO",t.ANY="ANY",t.NONE="NONE"})(ft||(ft={}));/**
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
 */function et(t){return t.text=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,X(t.candidates[0]))throw new f("response-error",`Response error: ${N(t)}. Response body stored in error.response`,{response:t});return qt(t)}else if(t.promptFeedback)throw new f("response-error",`Text not available. ${N(t)}`,{response:t});return""},t.functionCalls=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1,X(t.candidates[0]))throw new f("response-error",`Response error: ${N(t)}. Response body stored in error.response`,{response:t});return Jt(t)}else if(t.promptFeedback)throw new f("response-error",`Function call not available. ${N(t)}`,{response:t})},t}function qt(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.text&&i.push(r.text);return i.length>0?i.join(""):""}function Jt(t){var e,n,o,s;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(s=(o=t.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)r.functionCall&&i.push(r.functionCall);if(i.length>0)return i}const Wt=[U.RECITATION,U.SAFETY];function X(t){return!!t.finishReason&&Wt.includes(t.finishReason)}function N(t){var e,n,o;let s="";if((!t.candidates||t.candidates.length===0)&&t.promptFeedback)s+="Response was blocked",!((e=t.promptFeedback)===null||e===void 0)&&e.blockReason&&(s+=` due to ${t.promptFeedback.blockReason}`),!((n=t.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(s+=`: ${t.promptFeedback.blockReasonMessage}`);else if(!((o=t.candidates)===null||o===void 0)&&o[0]){const i=t.candidates[0];X(i)&&(s+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(s+=`: ${i.finishMessage}`))}return s}/**
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
 */const ht=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function Xt(t){const e=t.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=te(e),[o,s]=n.tee();return{stream:Qt(o),response:Zt(s)}}async function Zt(t){const e=[],n=t.getReader();for(;;){const{done:o,value:s}=await n.read();if(o)return et(ee(e));e.push(s)}}function Qt(t){return Ht(this,arguments,function*(){const n=t.getReader();for(;;){const{value:o,done:s}=yield L(n.read());if(s)break;yield yield L(et(o))}})}function te(t){const e=t.getReader();return new ReadableStream({start(o){let s="";return i();function i(){return e.read().then(({value:r,done:a})=>{if(a){if(s.trim()){o.error(new f("parse-failed","Failed to parse stream"));return}o.close();return}s+=r;let c=s.match(ht),d;for(;c;){try{d=JSON.parse(c[1])}catch{o.error(new f("parse-failed",`Error parsing JSON response: "${c[1]}`));return}o.enqueue(d),s=s.substring(c[0].length),c=s.match(ht)}return i()})}}})}function ee(t){const e=t[t.length-1],n={promptFeedback:e==null?void 0:e.promptFeedback};for(const o of t)if(o.candidates)for(const s of o.candidates){const i=s.index;if(n.candidates||(n.candidates=[]),n.candidates[i]||(n.candidates[i]={index:s.index}),n.candidates[i].citationMetadata=s.citationMetadata,n.candidates[i].finishReason=s.finishReason,n.candidates[i].finishMessage=s.finishMessage,n.candidates[i].safetyRatings=s.safetyRatings,s.content&&s.content.parts){n.candidates[i].content||(n.candidates[i].content={role:s.content.role||"user",parts:[]});const r={};for(const a of s.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),Object.keys(r).length===0&&(r.text=""),n.candidates[i].content.parts.push(r)}}return n}/**
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
 */async function It(t,e,n,o){const s=await tt(e,D.STREAM_GENERATE_CONTENT,t,!0,JSON.stringify(n),o);return Xt(s)}async function wt(t,e,n,o){const i=await(await tt(e,D.GENERATE_CONTENT,t,!1,JSON.stringify(n),o)).json();return{response:et(i)}}/**
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
 */function vt(t){if(t!=null){if(typeof t=="string")return{role:"system",parts:[{text:t}]};if(t.text)return{role:"system",parts:[t]};if(t.parts)return t.role?t:{role:"system",parts:t.parts}}}function Z(t){let e=[];if(typeof t=="string")e=[{text:t}];else for(const n of t)typeof n=="string"?e.push({text:n}):e.push(n);return ne(e)}function ne(t){const e={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of t)"functionResponse"in i?(n.parts.push(i),s=!0):(e.parts.push(i),o=!0);if(o&&s)throw new f("invalid-content","Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!o&&!s)throw new f("invalid-content","No Content is provided for sending chat message.");return o?e:n}function J(t){let e;return t.contents?e=t:e={contents:[Z(t)]},t.systemInstruction&&(e.systemInstruction=vt(t.systemInstruction)),e}/**
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
 */const gt=["text","inlineData","functionCall","functionResponse"],se={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall"],system:["text"]},mt={user:["model"],function:["model"],model:["user","function"],system:[]};function oe(t){let e=null;for(const n of t){const{role:o,parts:s}=n;if(!e&&o!=="user")throw new f("invalid-content",`First Content should be with role 'user', got ${o}`);if(!it.includes(o))throw new f("invalid-content",`Each item should include role field. Got ${o} but valid roles are: ${JSON.stringify(it)}`);if(!Array.isArray(s))throw new f("invalid-content","Content should have 'parts' but property with an array of Parts");if(s.length===0)throw new f("invalid-content","Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0};for(const a of s)for(const c of gt)c in a&&(i[c]+=1);const r=se[o];for(const a of gt)if(!r.includes(a)&&i[a]>0)throw new f("invalid-content",`Content with role '${o}' can't contain '${a}' part`);if(e&&!mt[o].includes(e.role))throw new f("invalid-content",`Content with role '${o} can't follow '${e.role}'. Valid previous roles: ${JSON.stringify(mt)}`);e=n}}/**
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
 */const Et="SILENT_ERROR";class ie{constructor(e,n,o,s){this.model=n,this.params=o,this.requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=e,o!=null&&o.history&&(oe(o.history),this._history=o.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e){var n,o,s,i,r;await this._sendPromise;const a=Z(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]};let d={};return this._sendPromise=this._sendPromise.then(()=>wt(this._apiSettings,this.model,c,this.requestOptions)).then(u=>{var p,I;if(u.response.candidates&&u.response.candidates.length>0){this._history.push(a);const l={parts:((p=u.response.candidates)===null||p===void 0?void 0:p[0].content.parts)||[],role:((I=u.response.candidates)===null||I===void 0?void 0:I[0].content.role)||"model"};this._history.push(l)}else{const l=N(u.response)}d=u}),await this._sendPromise,d}async sendMessageStream(e){var n,o,s,i,r;await this._sendPromise;const a=Z(e),c={safetySettings:(n=this.params)===null||n===void 0?void 0:n.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(i=this.params)===null||i===void 0?void 0:i.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,contents:[...this._history,a]},d=It(this._apiSettings,this.model,c,this.requestOptions);return this._sendPromise=this._sendPromise.then(()=>d).catch(u=>{throw new Error(Et)}).then(u=>u.response).then(u=>{if(u.candidates&&u.candidates.length>0){this._history.push(a);const p=Object.assign({},u.candidates[0].content);p.role||(p.role="model"),this._history.push(p)}else{const p=N(u)}}).catch(u=>{u.message}),d}}/**
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
 */async function re(t,e,n,o){return(await tt(e,D.COUNT_TOKENS,t,!1,JSON.stringify(n),o)).json()}/**
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
 */class ae{constructor(e,n,o){var s,i,r,a;if(!((i=(s=e.app)===null||s===void 0?void 0:s.options)===null||i===void 0)&&i.apiKey)if(!((a=(r=e.app)===null||r===void 0?void 0:r.options)===null||a===void 0)&&a.projectId)this._apiSettings={apiKey:e.app.options.apiKey,project:e.app.options.projectId,location:e.location},e.appCheck&&(this._apiSettings.getAppCheckToken=()=>e.appCheck.getToken()),e.auth&&(this._apiSettings.getAuthToken=()=>e.auth.getToken());else throw new f("no-project-id",'The "projectId" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid project ID.');else throw new f("no-api-key",'The "apiKey" field is empty in the local Firebase config. Firebase VertexAI requires this field to contain a valid API key.');n.model.includes("/")?n.model.startsWith("models/")?this.model=`publishers/google/${n.model}`:this.model=n.model:this.model=`publishers/google/models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=vt(n.systemInstruction),this.requestOptions=o||{}}async generateContent(e){const n=J(e);return wt(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}async generateContentStream(e){const n=J(e);return It(this._apiSettings,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},n),this.requestOptions)}startChat(e){return new ie(this._apiSettings,this.model,Object.assign({tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction},e),this.requestOptions)}async countTokens(e){const n=J(e);return re(this._apiSettings,this.model,n)}}/**
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
 */function ce(t=Nt(),e){return t=$t(t),At(t,Q).getImmediate({identifier:yt})}function _t(t,e,n){if(!e.model)throw new f("no-model","Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");return new ae(t,e,n)}function le(){bt(new jt(Q,(t,{instanceIdentifier:e})=>{const n=t.getProvider("app").getImmediate(),o=t.getProvider("auth-internal"),s=t.getProvider("app-check-internal");return new Bt(n,o,s,{location:e})},"PUBLIC").setMultipleInstances(!0)),nt(st,W),nt(st,W,"esm2017")}le();function pe({onResult:t,onStart:e,className:n="",mode:o="text"}){const[s,i]=T.useState(!1),[r,a]=T.useState(!1),c=T.useRef(null),d=T.useRef([]),u=T.useRef(null),p=T.useRef(null),{i18n:I}=Mt(),l=x(h=>h.groqApiKey),m=x(h=>h.groqModel),w=x(h=>h.geminiPrice)||.6,Y=x(h=>h.groqPrice)||.4,$=x(h=>h.geminiModel)||"gemini-2.5-flash",Ct=m||"llama-3.1-8b-instant",St=async h=>{if(h.preventDefault(),!l){alert("Brak klucza API Groq. Poproś Administratora o dodanie klucza w Panelu SaaS.");return}try{const b=await navigator.mediaDevices.getUserMedia({audio:!0});u.current=b;const _=new MediaRecorder(b);c.current=_,d.current=[],_.ondataavailable=y=>{y.data.size>0&&d.current.push(y.data)},_.onstop=async()=>{const y=_.mimeType||"audio/webm",j=y.includes("mp4")?"mp4":y.includes("ogg")?"ogg":"webm",H=new Blob(d.current,{type:y});u.current&&u.current.getTracks().forEach(k=>k.stop());const v=Math.max(1,Math.ceil((Date.now()-p.current)/1e3));await Ot(H,j,v)},_.start(),p.current=Date.now(),i(!0),e&&e()}catch{alert("Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.")}},Tt=h=>{h.preventDefault(),c.current&&s&&(c.current.stop(),i(!1))},Ot=async(h,b,_=1)=>{var y,j,H;a(!0);try{const v=new FormData;v.append("file",h,`audio.${b}`),v.append("model",Ct||"whisper-large-v3");const k=await fetch("https://api.groq.com/openai/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${l}`},body:v});if(!k.ok){const R=await k.json();throw new Error(((y=R.error)==null?void 0:y.message)||"Błąd podczas transkrypcji dźwięku.")}const C=(await k.json()).text;if(_>0){const R=z(),S=_/60;R&&V(K(q,"tenants",R,"stats","ai_usage"),{whisperSeconds:A(_),groqCost:A(S*Y)},{merge:!0}).catch(F=>{})}if(!C||C.trim().length===0){a(!1);return}let G=C;try{const R=ce(kt);if(o==="smart"){const F=await _t(R,{model:$,systemInstruction:"Jesteś ekspertem utrzymania ruchu. Otrzymasz surowy tekst (z dyktowania).",generationConfig:{responseMimeType:"application/json",responseSchema:{type:"object",properties:{note:{type:"string",description:"profesjonalna notatka o zrobionej pracy, bez wspominania o czasie i zadaniach"},timeSpentHours:{type:"number",nullable:!0},actionItem:{type:"string",nullable:!0},actionItemDays:{type:"number",nullable:!0}},required:["note"]}}}).generateContent(C),M=F.response.text();try{G=JSON.parse(M)}catch{throw new Error("Niepoprawny format danych JSON od Gemini")}let g=((j=F.response.usageMetadata)==null?void 0:j.totalTokenCount)||0;if(g===0){const E=C.length+300,P=M.length;g=Math.ceil((E+P)/4)}if(g>0){const E=z();E&&V(K(q,"tenants",E,"stats","ai_usage"),{geminiTokens:A(g),geminiCost:A(g/1e6*w)},{merge:!0}).catch(P=>{})}}else{const S=I.language==="en"?"angielski":"polski",M=await _t(R,{model:$,systemInstruction:`Jesteś asystentem technicznym. Interfejs systemu jest w języku: ${S.toUpperCase()}. Otrzymasz surowy tekst podyktowany przez pracownika stoczni. 
1. Jeśli oryginalny podyktowany tekst jest w języku ${S} (albo bardzo do niego zbliżonym), po prostu sformatuj go poprawnie (dodaj interpunkcję) i zwróć TYLKO sam sformatowany tekst (bez dopisków o tłumaczeniu).
2. Jeśli oryginalny tekst jest w INNYM języku, przetłumacz go na język ${S}. Wtedy (i tylko wtedy) zwróć wynik DOKŁADNIE w tym formacie:
[Oryginalny podyktowany tekst]

---
Tłumaczenie (${S}):
[Przetłumaczony tekst]`}).generateContent(C);G=M.response.text().trim();let g=((H=M.response.usageMetadata)==null?void 0:H.totalTokenCount)||0;if(g===0){const E=C.length+500,P=G.length;g=Math.ceil((E+P)/4)}if(g>0){const E=z();E&&V(K(q,"tenants",E,"stats","ai_usage"),{geminiTokens:A(g),geminiCost:A(g/1e6*w)},{merge:!0}).catch(P=>{})}}}catch(R){throw new Error("Błąd AI Gemini: "+R.message)}t&&t(G)}catch(v){alert("Błąd AI: "+v.message)}finally{a(!1)}};return O.jsxs("button",{type:"button",onClick:s?Tt:St,disabled:r,className:`relative flex items-center justify-center p-2 rounded-full transition-all shrink-0 z-10
        ${s?"bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/50":r?"bg-amber-400 text-white cursor-wait":o==="smart"?"bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 shadow-sm":"bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600"} ${n}`,title:s?"Zatrzymaj nagrywanie":o==="smart"?"Inteligentne Dyktowanie (Wypełnij automatycznie formularz)":"Podyktuj tekst (AI Whisper)",children:[r?O.jsx("i",{className:"ph ph-spinner animate-spin text-lg"}):O.jsx("i",{className:`ph ${s?"ph-stop":o==="smart"?"ph-magic-wand":"ph-microphone"} text-lg`}),s&&O.jsxs("span",{className:"absolute -top-1 -right-1 flex h-2 w-2",children:[O.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"}),O.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-red-500"})]})]})}export{pe as D,_t as a,ce as g};
//# sourceMappingURL=DictationButton-EjW-zXSD.js.map
