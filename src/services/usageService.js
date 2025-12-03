import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { invalidateCache } from './aggregationService';

export async function addUsage(eventId, usageData) {
  const usageRef = collection(db, 'events', eventId, 'usage');
  const docRef = await addDoc(usageRef, usageData);
  invalidateCache();
  return docRef.id;
}

/**
 * Bulk add multiple usage records to an event
 * @param {string} eventId - The event ID
 * @param {Array} usageDataArray - Array of usage objects with itemName, quantityUsed, notes
 * @returns {Promise<Array>} Array of created usage record IDs
 */
export async function bulkAddUsage(eventId, usageDataArray) {
  if (!Array.isArray(usageDataArray) || usageDataArray.length === 0) {
    return [];
  }

  const batch = writeBatch(db);
  const usageRef = collection(db, 'events', eventId, 'usage');
  const newDocRefs = [];

  for (const usageData of usageDataArray) {
    const newDocRef = doc(usageRef);
    batch.set(newDocRef, usageData);
    newDocRefs.push(newDocRef);
  }

  await batch.commit();
  invalidateCache();
  
  return newDocRefs.map(ref => ref.id);
}

export async function getUsageByEvent(eventId) {
  const usageRef = collection(db, 'events', eventId, 'usage');
  const snapshot = await getDocs(usageRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getUsageByItem(itemName) {
  // Optimized: fetch all usage once and filter
  const allUsage = await getAllUsage();
  return allUsage
    .filter(usage => usage.itemName === itemName)
    .reduce((sum, usage) => sum + (usage.quantityUsed || 0), 0);
}

export async function getAllUsage() {
  const events = await getDocs(collection(db, 'events'));
  const allUsage = [];
  
  for (const eventDoc of events.docs) {
    const usageRef = collection(db, 'events', eventDoc.id, 'usage');
    const snapshot = await getDocs(usageRef);
    
    snapshot.docs.forEach(doc => {
      allUsage.push({
        id: doc.id,
        eventId: eventDoc.id,
        ...doc.data()
      });
    });
  }
  
  return allUsage;
}
