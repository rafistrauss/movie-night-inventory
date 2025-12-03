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

export async function addAttendee(eventId, attendeeData) {
  const attendeesRef = collection(db, 'events', eventId, 'attendees');
  const docRef = await addDoc(attendeesRef, {
    ...attendeeData,
    checkedIn: attendeeData.checkedIn || false
  });
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
  invalidateCache();
  
  return newDocRefs.map(ref => ref.id);
}

export async function updateAttendee(eventId, attendeeId, attendeeData) {
  const attendeeRef = doc(db, 'events', eventId, 'attendees', attendeeId);
  await updateDoc(attendeeRef, attendeeData);
  invalidateCache();
}

export async function deleteAttendee(eventId, attendeeId) {
  const attendeeRef = doc(db, 'events', eventId, 'attendees', attendeeId);
  await deleteDoc(attendeeRef);
  invalidateCache();
}

export async function getAttendees(eventId) {
  const attendeesRef = collection(db, 'events', eventId, 'attendees');
  const snapshot = await getDocs(attendeesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getTotalCollected(eventId) {
  const attendees = await getAttendees(eventId);
  return attendees.reduce((sum, attendee) => sum + (attendee.paidAmount || 0), 0);
}
