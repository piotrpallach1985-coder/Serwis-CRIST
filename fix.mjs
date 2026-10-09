import fs from 'fs';
let c = fs.readFileSync('src/components/OperatorView.jsx', 'utf8');

c = c.replace(
  /const targetMachine = machines\.find[^\n]+;/,
  "let targetMachine = machines.find(m => m.id === mId || (m.qrCode && (m.qrCode === mId || m.qrCode === decodedText)) || (m.internalId && m.internalId.toLowerCase() === mId.toLowerCase()));\n" +
  "    \n" +
  "    if (!targetMachine && mId && tenantId) {\n" +
  "      try {\n" +
  "        const d = await getDoc(doc(db, 'tenants', tenantId, 'machines', mId));\n" +
  "        if (d.exists() && !d.data().isDeleted) {\n" +
  "          targetMachine = { id: d.id, ...d.data() };\n" +
  "        } else {\n" +
  "          const q = query(collection(db, 'tenants', tenantId, 'machines'), where('qrCode', '==', decodedText), limit(1));\n" +
  "          const snap = await getDocs(q);\n" +
  "          if (!snap.empty && !snap.docs[0].data().isDeleted) {\n" +
  "            targetMachine = { id: snap.docs[0].id, ...snap.docs[0].data() };\n" +
  "          }\n" +
  "        }\n" +
  "      } catch (e) {}\n" +
  "    }"
);
c = c.replace('const handleScanSuccess = (decodedText) => {', 'const handleScanSuccess = async (decodedText) => {');

fs.writeFileSync('src/components/OperatorView.jsx', c);
