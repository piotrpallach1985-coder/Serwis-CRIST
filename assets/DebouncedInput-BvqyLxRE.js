import{r as u,j as c}from"./index-B89jEeJA.js";function m({value:t,onChange:n,debounce:r=300,...a}){const[e,o]=u.useState(t||"");return u.useEffect(()=>{o(t||"")},[t]),u.useEffect(()=>{const s=setTimeout(()=>{n(e)},r);return()=>clearTimeout(s)},[e,r]),c.jsx("input",{...a,value:e,onChange:s=>o(s.target.value)})}export{m as D};
//# sourceMappingURL=DebouncedInput-BvqyLxRE.js.map
