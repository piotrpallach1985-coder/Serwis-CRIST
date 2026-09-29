const fs = require('fs');
const path = require('path');

const componentsDir = 'c:/Users/piotr/Desktop/Programy Finalne/Serwis CRIST/src/components/manager';

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const { from, to } of replacements) {
        content = content.replace(from, to);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(Updated );
    } else {
        console.log(No changes in );
    }
}

// 1. Tickets.jsx
replaceInFile(path.join(componentsDir, 'Tickets.jsx'), [
    {
        from: /import \{.*updateDoc.*\} from 'firebase\/firestore';/,
        to: "import { updateTicket, deleteTicket } from '../../services/tickets.service';"
    },
    {
        from: /await updateDoc\(doc\(db, 'tenants', getCurrentTenant\(\), 'tickets', ticketId\), \{\s*isDeleted: true,\s*deletedAt: serverTimestamp\(\),\s*deletedBy: \(user\?\.name \|\| 'System'\)\s*\}\);/g,
        to: "await deleteTicket(ticketId, user?.name);"
    },
    {
        from: /await updateDoc\(doc\(db, 'tenants', getCurrentTenant\(\), 'tickets', ticketId\), \{/g,
        to: "await updateTicket(ticketId, {"
    },
    {
        from: /const ticketRef = doc\(db, 'tenants', getCurrentTenant\(\), 'tickets', ticketId\);\s*await updateDoc\(ticketRef, \{\s*status: newStatus\s*\}\);/g,
        to: "await updateTicket(ticketId, { status: newStatus });"
    },
    {
        from: /import \{.*db.*\} from '\.\.\/\.\.\/firebase';\n/g,
        to: ""
    }
]);

// 2. ActionItems.jsx
replaceInFile(path.join(componentsDir, 'ActionItems.jsx'), [
    {
        from: /import \{ collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc \} from 'firebase\/firestore';/,
        to: "import { fetchActionItems, updateActionItem } from '../../services/tickets.service';" // Since it uses onSnapshot, maybe I should leave onSnapshot or change to fetch?
    }
]);
