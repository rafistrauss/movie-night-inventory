<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { getAllEvents, createEvent, deleteEvent } from '../services/eventService';
  
  const dispatch = createEventDispatcher();
  
  let events = [];
  let showCreateForm = false;
  let loading = true;
  
  let newEvent = {
    name: '',
    date: '',
    ticketPrice: 0,
    notes: ''
  };
  
  onMount(async () => {
    await loadEvents();
  });
  
  async function loadEvents() {
    try {
      loading = true;
      events = await getAllEvents();
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      loading = false;
    }
  }
  
  async function handleCreateEvent() {
    try {
      await createEvent(newEvent);
      newEvent = { name: '', date: '', ticketPrice: 0, notes: '' };
      showCreateForm = false;
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event: ' + error.message);
    }
  }
  
  async function handleDeleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        await loadEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event: ' + error.message);
      }
    }
  }
  
  function viewEventDetails(eventId) {
    dispatch('navigate', { view: 'eventDetails', eventId });
  }
  
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
      let date;
      
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle ISO string or date string
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Handle seconds (Firestore timestamp format)
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle Date object or number
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid Date';
    }
  }
  
  function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }
</script>

<style>
  .events-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .header h1 {
    margin: 0;
    color: #2c3e50;
  }
  
  .btn {
    background: #27ae60;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .btn:hover {
    background: #229954;
  }
  
  .btn-danger {
    background: #e74c3c;
  }
  
  .btn-danger:hover {
    background: #c0392b;
  }
  
  .btn-secondary {
    background: #95a5a6;
  }
  
  .btn-secondary:hover {
    background: #7f8c8d;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
  }
  
  .modal h2 {
    margin-top: 0;
    color: #2c3e50;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .events-grid {
    display: grid;
    gap: 1.5rem;
  }
  
  .event-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  @media (max-width: 768px) {
    .event-card {
      flex-direction: column;
      gap: 1rem;
    }
    
    .event-actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .event-actions .btn {
      width: 100%;
    }
  }
  
  .event-info h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
  }
  
  .event-meta {
    color: #7f8c8d;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .event-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
  }
  
  .empty {
    text-align: center;
    padding: 3rem;
    color: #95a5a6;
    background: white;
    border-radius: 8px;
  }
</style>

<div class="events-page">
  <div class="header">
    <h1>Events</h1>
    <button class="btn" on:click={() => showCreateForm = true}>+ Create Event</button>
  </div>
  
  {#if loading}
    <div class="loading">Loading events...</div>
  {:else if events.length === 0}
    <div class="empty">
      <p>No events yet. Create your first movie night event!</p>
    </div>
  {:else}
    <div class="events-grid">
      {#each events as event}
        <div class="event-card">
          <div class="event-info">
            <h3>{event.name}</h3>
            <div class="event-meta">📅 {formatDate(event.date)}</div>
            <div class="event-meta">🎟️ Ticket Price: {formatCurrency(event.ticketPrice)}</div>
            {#if event.notes}
              <div class="event-meta">📝 {event.notes}</div>
            {/if}
          </div>
          <div class="event-actions">
            <button class="btn btn-small" on:click={() => viewEventDetails(event.id)}>
              View Details
            </button>
            <button class="btn btn-small btn-danger" on:click={() => handleDeleteEvent(event.id)}>
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  {#if showCreateForm}
    <div class="modal-overlay" on:click={() => showCreateForm = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Create New Event</h2>
        <form on:submit|preventDefault={handleCreateEvent}>
          <div class="form-group">
            <label for="name">Event Name *</label>
            <input 
              id="name" 
              type="text" 
              bind:value={newEvent.name} 
              required 
              placeholder="e.g., Summer Movie Night"
            />
          </div>
          
          <div class="form-group">
            <label for="date">Date *</label>
            <input 
              id="date" 
              type="date" 
              bind:value={newEvent.date} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="ticketPrice">Ticket Price *</label>
            <input 
              id="ticketPrice" 
              type="number" 
              step="0.01" 
              bind:value={newEvent.ticketPrice} 
              required 
              placeholder="0.00"
            />
          </div>
          
          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea 
              id="notes" 
              bind:value={newEvent.notes} 
              placeholder="Optional notes about this event"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showCreateForm = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Create Event</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
