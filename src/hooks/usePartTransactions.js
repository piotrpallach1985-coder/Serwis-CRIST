import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';

export function usePartTransactions(filterType, filterDateFrom, filterDateTo) {
  const [transactions, setTransactions] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const tenantId = getCurrentTenant();

  const fetchTransactions = useCallback(async (loadMore = false) => {
    if (!tenantId) return;
    if (loading || (!hasMore && loadMore)) return;

    setLoading(true);
    try {
      let q = query(
        collection(db, 'tenants', tenantId, 'part_transactions'),
        orderBy('date', 'desc'),
        limit(50)
      );

      if (loadMore && lastDoc) {
        q = query(
          collection(db, 'tenants', tenantId, 'part_transactions'),
          orderBy('date', 'desc'),
          startAfter(lastDoc),
          limit(50)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (loadMore) {
        setTransactions(prev => [...prev, ...docs]);
      } else {
        setTransactions(docs);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 50);

    } catch (err) {
      console.error('BĹ‚Ä…d pobierania transakcji magazynowych:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, lastDoc, loading, hasMore]);

  useEffect(() => {
    fetchTransactions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]); // Initial fetch

  return { transactions, loading, hasMore, fetchTransactions };
}

export const fetchTransactionsForReference = async (tenantId, referenceId) => {
  if (!tenantId || !referenceId) return [];
  const q = query(collection(db, 'tenants', tenantId, 'part_transactions'), where('referenceId', '==', referenceId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fetchTransactionsForMachine = async (tenantId, machineId) => {
  if (!tenantId || !machineId) return [];
  const q = query(collection(db, 'tenants', tenantId, 'part_transactions'), where('machineId', '==', machineId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fetchTransactionsForPart = async (tenantId, partId) => {
  if (!tenantId || !partId) return [];
  // Usunieto orderBy, aby uniknac bledu 'Missing composite index'
  const q = query(collection(db, 'tenants', tenantId, 'part_transactions'), where('partId', '==', partId));
  try {
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => new Date(b.date) - new Date(a.date));
    return docs;
  } catch (err) {
    console.error("Błąd historii czesci:", err);
    return [];
  }
};

