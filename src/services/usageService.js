import { 
  collection, 
  addDoc, 
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { invalidateCache } from './aggregationService';
import { dataCache } from './cacheService';

export async function addUsage(eventId, usageData) {
  const usageRef = collection(db, 'events', eventId, 'usage');
  const docRef = await addDoc(usageRef, usageData);
  
  // Invalidate usage caches
  dataCache.invalidate(`usage_${eventId}`);
  dataCache.invalidate('all_usage');
  invalidateCache();
  return docRef.id;
}

export async function updateUsage(eventId, usageId, usageData) {
  const usageDocRef = doc(db, 'events', eventId, 'usage', usageId);
  await updateDoc(usageDocRef, usageData);
  
  // Invalidate usage caches
  dataCache.invalidate(`usage_${eventId}`);
  dataCache.invalidate('all_usage');
  dataCache.invalidate(`financialSummary_${eventId}`);
  invalidateCache();
}

export async function deleteUsage(eventId, usageId) {
  const usageDocRef = doc(db, 'events', eventId, 'usage', usageId);
  await deleteDoc(usageDocRef);
  
  // Invalidate usage caches
  dataCache.invalidate(`usage_${eventId}`);
  dataCache.invalidate('all_usage');
  dataCache.invalidate(`financialSummary_${eventId}`);
  invalidateCache();
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
  
  // Invalidate usage caches
  dataCache.invalidate(`usage_${eventId}`);
  dataCache.invalidate('all_usage');
  invalidateCache();
  
  return newDocRefs.map(ref => ref.id);
}

export async function getUsageByEvent(eventId) {
  const cacheKey = `usage_${eventId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const usageRef = collection(db, 'events', eventId, 'usage');
  const snapshot = await getDocs(usageRef);
  const usage = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, usage);
  return usage;
}

export async function getUsageByItem(itemName) {
  // Optimized: fetch all usage once and filter
  const allUsage = await getAllUsage();
  return allUsage
    .filter(usage => usage.itemName === itemName)
    .reduce((sum, usage) => sum + (usage.quantityUsed || 0), 0);
}

export async function getAllUsage() {
  const cacheKey = 'all_usage';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
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
  
  dataCache.set(cacheKey, allUsage);
  return allUsage;
}
