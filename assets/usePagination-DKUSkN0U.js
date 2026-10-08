import{r as o}from"./react-vendor-BjNPbj-g.js";function g(e=[],n=30,u=[]){const[t,r]=o.useState(1);o.useEffect(()=>{r(1)},u);const s=o.useMemo(()=>e.slice(0,t*n),[e,t,n]),a=s.length<e.length;return{currentItems:s,hasMore:a,loadMore:()=>{r(c=>c+1)},currentPage:t,setCurrentPage:r}}export{g as u};
//# sourceMappingURL=usePagination-DKUSkN0U.js.map
