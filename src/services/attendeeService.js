import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { invalidateCache } from './aggregationService';
import { dataCache } from './cacheService';

export async function addAttendee(eventId, attendeeData) {
  const attendeesRef = collection(db, 'events', eventId, 'attendees');
  const docRef = await addDoc(attendeesRef, {
    ...attendeeData,
    checkedIn: attendeeData.checkedIn || false
  });
  
  // Invalidate attendees cache for this event
  dataCache.invalidate(`attendees_${eventId}`);
  invalidateCache();
  return docRef.id;
}

/**
 * Bulk add multiple attendees to an event
 * @param {string} eventId - The event ID
 * @param {Array} attendeesData - Array of attendee objects
 * @returns {Promise<Array>} Array of created attendee IDs
 */
export async function bulkAddAttendees(eventId, attendeesData) {
  if (!Array.isArray(attendeesData) || attendeesData.length === 0) {
    return [];
  }

  const batch = writeBatch(db);
  const attendeesRef = collection(db, 'events', eventId, 'attendees');
  const newDocRefs = [];

  for (const attendeeData of attendeesData) {
    const newDocRef = doc(attendeesRef);
    batch.set(newDocRef, {
      ...attendeeData,
      checkedIn: attendeeData.checkedIn || false
    });
    newDocRefs.push(newDocRef);
  }

  await batch.commit();
  
  // Invalidate attendees cache for this event
  dataCache.invalidate(`attendees_${eventId}`);
  invalidateCache();
  
  return newDocRefs.map(ref => ref.id);
}

export async function updateAttendee(eventId, attendeeId, attendeeData) {
  const attendeeRef = doc(db, 'events', eventId, 'attendees', attendeeId);
  await updateDoc(attendeeRef, attendeeData);
  
  // Invalidate attendees cache for this event
  dataCache.invalidate(`attendees_${eventId}`);
  invalidateCache();
}

export async function deleteAttendee(eventId, attendeeId) {
  const attendeeRef = doc(db, 'events', eventId, 'attendees', attendeeId);
  await deleteDoc(attendeeRef);
  
  // Invalidate attendees cache for this event
  dataCache.invalidate(`attendees_${eventId}`);
  invalidateCache();
}

export async function getAttendees(eventId) {
  const cacheKey = `attendees_${eventId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const attendeesRef = collection(db, 'events', eventId, 'attendees');
  const snapshot = await getDocs(attendeesRef);
  const attendees = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, attendees);
  return attendees;
}

export async function getTotalCollected(eventId) {
  const attendees = await getAttendees(eventId);
  return attendees.reduce((sum, attendee) => sum + (attendee.paidAmount || 0), 0);
}
