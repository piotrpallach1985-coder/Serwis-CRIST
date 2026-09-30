import { db } from '../firebase';
import { logAudit } from './audit.service';
import { collection, doc, addDoc, updateDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { calculateFifoIssue } from '../utils/inventoryHelpers';

export const addPart = async (tenantId, payload) => {
  logAudit('CREATE', 'PART', '', `Utworzono część: ${payload.name}`);
  payload.createdAt = serverTimestamp();
  payload.qrCreatedAt = serverTimestamp();
  payload.updatedAt = serverTimestamp();
  return await addDoc(collection(db, 'tenants', tenantId, 'parts'), payload);
};

export const updatePart = async (tenantId, partId, payload) => {
  logAudit('UPDATE', 'PART', partId, 'Zaktualizowano część');
  payload.updatedAt = serverTimestamp();
  const ref = doc(db, 'tenants', tenantId, 'parts', partId);
  return await updateDoc(ref, payload);
};

export const fixLegacyTransactions = async (tenantId, partTransactions) => {
  const toFix = partTransactions.filter(tx => tx.referenceId && !tx.machineId && (tx.type === 'issue_adhoc' || tx.type === 'issue' || tx.type === 'issue_planned'));
  if (toFix.length === 0) return;

  console.log('Znaleziono transakcje do naprawy (brak machineId):', toFix.length);

  for (const tx of toFix) {
    try {
      let mId = null;
      let mName = null;

      const tDoc = await getDoc(doc(db, 'tenants', tenantId, 'tickets', tx.referenceId));
      if (tDoc.exists()) {
        mId = tDoc.data().machineId;
        mName = tDoc.data().machineName;
      } else {
        const sDoc = await getDoc(doc(db, 'tenants', tenantId, 'planned_services', tx.referenceId));
        if (sDoc.exists()) {
          mId = sDoc.data().machineId;
          mName = sDoc.data().machineName;
        }
      }

      if (mId) {
        await updateDoc(doc(db, 'tenants', tenantId, 'part_transactions', tx.id), {
          machineId: mId,
          machineName: mName || null
        });
        console.log('Naprawiono:', tx.id, '->', mId);
      }
    } catch (err) {
      console.error('Błąd podczas naprawy transakcji:', tx.id, err);
    }
  }
};

export const issueOrReceivePart = async ({
  tenantId,
  partId,
  mode, // 'receive' or 'issue'
  quantity, // number
  unitPrice, // number
  expirationDate, // string | null
  user, // object
  selectedMachine // object | null
}) => {
  logAudit(mode === 'receive' ? 'RECEIVE_PART' : 'ISSUE_PART', 'PART', partId, `${mode === 'receive' ? 'Przyjęto' : 'Wydano'} ${quantity} szt.`);
    const partRef = doc(db, 'tenants', tenantId, 'parts', partId);
  const txRef = doc(collection(db, 'tenants', tenantId, 'part_transactions'));

  return await runTransaction(db, async (transaction) => {
    const partDoc = await transaction.get(partRef);
    if (!partDoc.exists()) {
      throw new Error("Część nie istnieje.");
    }
    const currentStock = Number(partDoc.data().stock || 0);
    
    let newStock = currentStock;
    let finalPrice = Number(unitPrice || 0);
    let txQuantity = quantity;
    let updatePayload = {};
    
    let currentBatches = partDoc.data().batches || [];
    
    if (currentBatches.length === 0 && currentStock > 0) {
       currentBatches = [{ qty: currentStock, price: Number(partDoc.data().unitPrice || 0), date: new Date().toISOString(), expirationDate: partDoc.data().expirationDate || null }];
    }

    if (mode === 'receive') {
      newStock = currentStock + quantity;
      currentBatches.push({ qty: quantity, price: finalPrice, date: new Date().toISOString(), expirationDate: expirationDate || null });
      
      updatePayload = { stock: newStock, unitPrice: finalPrice, batches: currentBatches };
      transaction.update(partRef, updatePayload);
      
      transaction.set(txRef, {
        partId: partId,
        type: 'receive',
        quantity: quantity,
        price: finalPrice,
        expirationDate: expirationDate || null,
        date: new Date().toISOString(),
        user: user?.name || 'Nieznany (App)',
        createdAt: serverTimestamp()
      });

    } else if (mode === 'issue') {
      if (quantity > currentStock) {
        throw new Error(`Brak wystarczającej ilości w magazynie (Dostępne: ${currentStock})`);
      }
      newStock = currentStock - quantity;
      txQuantity = -quantity; 
      
      const { newBatches, totalCost, issueDetails } = calculateFifoIssue(quantity, currentBatches);
      const avgPrice = quantity > 0 ? (totalCost / quantity) : 0;
      
      updatePayload = { stock: newStock, batches: newBatches };
      transaction.update(partRef, updatePayload);
      
      let txData = {
        partId: partId,
        type: 'issue_adhoc',
        quantity: txQuantity,
        price: avgPrice,
        totalCost: totalCost,
        issueDetails: issueDetails,
        date: new Date().toISOString(),
        user: user?.name || 'Nieznany (App)',
        createdAt: serverTimestamp()
      };

      if (selectedMachine) {
        txData.machineId = selectedMachine.id || null;
        txData.machineName = selectedMachine.name || null;
      }

      transaction.set(txRef, txData);
    }
  });
};
