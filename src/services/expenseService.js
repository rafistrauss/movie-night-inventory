import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { captureTenant, tenantCollection, tenantDoc } from './tenantService';
import { invalidateCache } from './aggregationService';
import { dataCache } from './cacheService';

export async function createExpense(expenseData) {
  const tenant = captureTenant();
  const docRef = await tenant.wait(() => addDoc(tenantCollection('expenses'), {
    ...expenseData,
    createdAt: new Date()
  }));
  
  // Invalidate expense caches
  dataCache.invalidate('all_expenses');
  if (expenseData.eventId) {
    dataCache.invalidate(`expenses_${expenseData.eventId}`);
  }
  invalidateCache();
  return docRef.id;
}

export async function updateExpense(expenseId, expenseData) {
  const tenant = captureTenant();
  const expenseRef = tenantDoc('expenses', expenseId);
  await tenant.wait(() => updateDoc(expenseRef, expenseData));
  
  // Invalidate expense caches
  dataCache.invalidate('all_expenses');
  if (expenseData.eventId) {
    dataCache.invalidate(`expenses_${expenseData.eventId}`);
  }
  invalidateCache();
}

export async function deleteExpense(expenseId) {
  const tenant = captureTenant();
  const expenseRef = tenantDoc('expenses', expenseId);
  await tenant.wait(() => deleteDoc(expenseRef));
  
  // Invalidate all expense caches
  dataCache.invalidate('all_expenses');
  invalidateCache();
}

export async function getAllExpenses() {
  const tenant = captureTenant();
  const cacheKey = 'all_expenses';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const snapshot = await tenant.wait(() => getDocs(tenantCollection('expenses')));
  const expenses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, expenses);
  return expenses;
}

export async function getExpensesByEvent(eventId) {
  const tenant = captureTenant();
  const cacheKey = `expenses_${eventId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const q = query(tenantCollection('expenses'), where('eventId', '==', eventId));
  const snapshot = await tenant.wait(() => getDocs(q));
  const expenses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, expenses);
  return expenses;
}
