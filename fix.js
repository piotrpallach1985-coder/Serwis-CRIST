
const fs = require("fs");
let c = fs.readFileSync("src/components/OperatorView.jsx", "utf8");
c = c.replace("step=scan&machine=${mId}", "step=form&machine=${mId}");
c = c.replace("urlMachineResolvedRef.current = true;", "urlMachineResolvedRef.current = true;\n                setStep(\"form\");");
fs.writeFileSync("src/components/OperatorView.jsx", c);

