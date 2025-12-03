import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { invalidateCache } from './aggregationService';

export const eventsCollection = collection(db, 'events');

export async function createEvent(eventData) {
  // Parse date at noon UTC to avoid timezone issues
  const dateStr = eventData.date;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  const docRef = await addDoc(eventsCollection, {
    ...eventData,
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.now()
  });
  invalidateCache();
  return docRef.id;
}

export async function updateEvent(eventId, eventData) {
  const eventRef = doc(db, 'events', eventId);
  const updateData = { ...eventData };
  
  // Fix timezone issue by parsing date at noon UTC
  if (eventData.date) {
    const dateStr = eventData.date;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    updateData.date = Timestamp.fromDate(date);
  }
  
  await updateDoc(eventRef, updateData);
  invalidateCache();
}

export async function deleteEvent(eventId) {
  const eventRef = doc(db, 'events', eventId);
  await deleteDoc(eventRef);
  invalidateCache();
}

export async function getEvent(eventId) {
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  if (eventSnap.exists()) {
    return { id: eventSnap.id, ...eventSnap.data() };
  }
  return null;
}

export async function getAllEvents() {
  const q = query(eventsCollection, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
