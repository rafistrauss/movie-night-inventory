import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { invalidateCache } from './aggregationService';
import { dataCache } from './cacheService';

export const expensesCollection = collection(db, 'expenses');

export async function createExpense(expenseData) {
  const docRef = await addDoc(expensesCollection, {
    ...expenseData,
    createdAt: new Date()
  });
  
  // Invalidate expense caches
  dataCache.invalidate('all_expenses');
  if (expenseData.eventId) {
    dataCache.invalidate(`expenses_${expenseData.eventId}`);
  }
  invalidateCache();
  return docRef.id;
}

export async function updateExpense(expenseId, expenseData) {
  const expenseRef = doc(db, 'expenses', expenseId);
  await updateDoc(expenseRef, expenseData);
  
  // Invalidate expense caches
  dataCache.invalidate('all_expenses');
  if (expenseData.eventId) {
    dataCache.invalidate(`expenses_${expenseData.eventId}`);
  }
  invalidateCache();
}

export async function deleteExpense(expenseId) {
  const expenseRef = doc(db, 'expenses', expenseId);
  await deleteDoc(expenseRef);
  
  // Invalidate all expense caches
  dataCache.invalidate('all_expenses');
  invalidateCache();
}

export async function getAllExpenses() {
  const cacheKey = 'all_expenses';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const snapshot = await getDocs(expensesCollection);
  const expenses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, expenses);
  return expenses;
}

export async function getExpensesByEvent(eventId) {
  const cacheKey = `expenses_${eventId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const q = query(expensesCollection, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  const expenses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, expenses);
  return expenses;
}
