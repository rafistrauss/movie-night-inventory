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

export const expensesCollection = collection(db, 'expenses');

export async function createExpense(expenseData) {
  const docRef = await addDoc(expensesCollection, {
    ...expenseData,
    createdAt: new Date()
  });
  invalidateCache();
  return docRef.id;
}

export async function updateExpense(expenseId, expenseData) {
  const expenseRef = doc(db, 'expenses', expenseId);
  await updateDoc(expenseRef, expenseData);
  invalidateCache();
}

export async function deleteExpense(expenseId) {
  const expenseRef = doc(db, 'expenses', expenseId);
  await deleteDoc(expenseRef);
  invalidateCache();
}

export async function getAllExpenses() {
  const snapshot = await getDocs(expensesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getExpensesByEvent(eventId) {
  const q = query(expensesCollection, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
