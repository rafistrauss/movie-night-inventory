import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { captureTenant, tenantCollection, tenantDoc } from './tenantService';
import { invalidateCache } from './aggregationService';
import { dataCache } from './cacheService';

export async function createEvent(eventData) {
  const tenant = captureTenant();
  // Parse date at noon UTC to avoid timezone issues
  const dateStr = eventData.date;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  const docRef = await tenant.wait(() => addDoc(tenantCollection('events'), {
    ...eventData,
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.now()
  }));
  
  // Invalidate event-related caches
  dataCache.invalidate('all_events');
  invalidateCache();
  return docRef.id;
}

export async function updateEvent(eventId, eventData) {
  const tenant = captureTenant();
  const eventRef = tenantDoc('events', eventId);
  const updateData = { ...eventData };
  
  // Fix timezone issue by parsing date at noon UTC
  if (eventData.date) {
    const dateStr = eventData.date;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    updateData.date = Timestamp.fromDate(date);
  }
  
  await tenant.wait(() => updateDoc(eventRef, updateData));
  
  // Invalidate specific event and all events cache
  dataCache.invalidate(`event_${eventId}`);
  dataCache.invalidate('all_events');
  invalidateCache();
}

export async function deleteEvent(eventId) {
  const tenant = captureTenant();
  const eventRef = tenantDoc('events', eventId);
  await tenant.wait(() => deleteDoc(eventRef));
  
  // Invalidate specific event and all events cache
  dataCache.invalidate(`event_${eventId}`);
  dataCache.invalidate('all_events');
  dataCache.invalidate(`attendees_${eventId}`);
  dataCache.invalidate(`usage_${eventId}`);
  invalidateCache();
}

export async function getEvent(eventId) {
  const tenant = captureTenant();
  const cacheKey = `event_${eventId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const eventRef = tenantDoc('events', eventId);
  const eventSnap = await tenant.wait(() => getDoc(eventRef));
  if (eventSnap.exists()) {
    const event = { id: eventSnap.id, ...eventSnap.data() };
    dataCache.set(cacheKey, event);
    return event;
  }
  return null;
}

export async function getAllEvents() {
  const tenant = captureTenant();
  const cacheKey = 'all_events';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  
  const q = query(tenantCollection('events'), orderBy('date', 'desc'));
  const snapshot = await tenant.wait(() => getDocs(q));
  const events = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  dataCache.set(cacheKey, events);
  return events;
}
