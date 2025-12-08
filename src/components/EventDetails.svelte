<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { getEvent, updateEvent } from '../services/eventService';
  import { getAttendees, addAttendee, updateAttendee, deleteAttendee, bulkAddAttendees } from '../services/attendeeService';
  import { getUsageByEvent, addUsage, updateUsage, deleteUsage, bulkAddUsage } from '../services/usageService';
  import { getEventFinancialSummary } from '../services/reportingService';
  import { buildInventory, validateUsage } from '../services/inventoryService';
  import { getExpensesByEvent } from '../services/expenseService';
  
  export let eventId;
  
  const dispatch = createEventDispatcher();
  
  let event = null;
  let attendees = [];
  let usage = [];
  let inventory = [];
  let financialSummary = null;
  let purchases = [];
  let loading = true;
  
  let showAddAttendee = false;
  let showAddUsage = false;
  let showBulkAddAttendees = false;
  let showBulkAddUsage = false;
  let showEditEvent = false;
  let showEditAttendee = false;
  let showEditUsage = false;
  
  let newAttendee = {
    name: '',
    paidAmount: 0,
    paymentMethod: '',
    checkedIn: false,
    notes: ''
  };
  
  let editAttendeeData = {
    id: '',
    name: '',
    paidAmount: 0,
    paymentMethod: '',
    checkedIn: false,
    notes: ''
  };
  
  let newUsage = {
    itemName: '',
    quantityUsed: 0
  };
  
  let editUsageData = {
    id: '',
    itemName: '',
    quantityUsed: 0,
    eventId: ''
  };
  
  let bulkAttendeesText = '';
  let bulkUsageText = '';
  
  let editEventData = {
    name: '',
    date: '',
    ticketPrice: 0,
    notes: ''
  };
  
  let syncing = false;
  
  onMount(async () => {
    await loadEventData();
  });
  
  async function loadEventData() {
    try {
      loading = true;
      event = await getEvent(eventId);
      attendees = await getAttendees(eventId);
      usage = await getUsageByEvent(eventId);
      inventory = await buildInventory();
      financialSummary = await getEventFinancialSummary(eventId);
      purchases = await getExpensesByEvent(eventId);
      
      // Populate edit form data
      if (event) {
        let eventDate;
        
        try {
          // Handle Firestore Timestamp
          if (event.date.toDate && typeof event.date.toDate === 'function') {
            eventDate = event.date.toDate();
          } 
          // Handle ISO string or date string
          else if (typeof event.date === 'string') {
            eventDate = new Date(event.date);
          }
          // Handle seconds (Firestore timestamp format)
          else if (event.date.seconds) {
            eventDate = new Date(event.date.seconds * 1000);
          }
          // Handle Date object or number
          else {
            eventDate = new Date(event.date);
          }
          
          // Validate the date
          if (isNaN(eventDate.getTime())) {
            console.error('Invalid date:', event.date);
            eventDate = new Date(); // Fallback to today
          }
        } catch (error) {
          console.error('Error parsing event date:', error, event.date);
          eventDate = new Date(); // Fallback to today
        }
        
        editEventData = {
          name: event.name || '',
          date: eventDate.toISOString().split('T')[0],
          ticketPrice: event.ticketPrice || 0,
          notes: event.notes || ''
        };
      }
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      loading = false;
      syncing = false;
    }
  }
  
  async function handleResync() {
    try {
      console.log('Re-syncing event data...');
      syncing = true;
      
      // Import and clear the cache before fetching fresh data
      const { dataCache } = await import('../services/cacheService');
      console.log('Clearing cache for event:', eventId);
      dataCache.invalidate(`attendees_${eventId}`);
      dataCache.invalidate(`usage_${eventId}`);
      dataCache.invalidate(`financialSummary_${eventId}`);
      dataCache.invalidate(`expenses_${eventId}`);
      
      console.log('Fetching attendees for event:', eventId);
      const newAttendees = await getAttendees(eventId);
      console.log('Received attendees:', newAttendees);
      attendees = [...newAttendees];
      
      console.log('Fetching usage...');
      const newUsage = await getUsageByEvent(eventId);
      console.log('Received usage:', newUsage);
      usage = [...newUsage];
      
      console.log('Fetching financial summary...');
      const newFinancialSummary = await getEventFinancialSummary(eventId);
      console.log('Received financial summary:', newFinancialSummary);
      financialSummary = { ...newFinancialSummary };
      
      console.log('Fetching purchases...');
      const newPurchases = await getExpensesByEvent(eventId);
      console.log('Received purchases:', newPurchases);
      purchases = [...newPurchases];
      
      console.log('Re-sync complete! Attendees count:', attendees.length);
    } catch (error) {
      console.error('Error re-syncing data:', error);
      alert('Error re-syncing data: ' + error.message);
    } finally {
      syncing = false;
    }
  }
  
  async function handleAddAttendee() {
    try {
      await addAttendee(eventId, newAttendee);
      newAttendee = { name: '', paidAmount: 0, paymentMethod: '', checkedIn: false, notes: '' };
      showAddAttendee = false;
      await loadEventData();
    } catch (error) {
      console.error('Error adding attendee:', error);
      alert('Error adding attendee: ' + error.message);
    }
  }
  
  function openEditAttendee(attendee) {
    editAttendeeData = {
      id: attendee.id,
      name: attendee.name,
      paidAmount: attendee.paidAmount,
      paymentMethod: attendee.paymentMethod || '',
      checkedIn: attendee.checkedIn || false,
      notes: attendee.notes || ''
    };
    showEditAttendee = true;
  }
  
  async function handleEditAttendee() {
    try {
      const { id, ...attendeeData } = editAttendeeData;
      await updateAttendee(eventId, id, attendeeData);
      showEditAttendee = false;
      await loadEventData();
    } catch (error) {
      console.error('Error updating attendee:', error);
      alert('Error updating attendee: ' + error.message);
    }
  }
  
  async function handleToggleCheckIn(attendee) {
    try {
      await updateAttendee(eventId, attendee.id, { checkedIn: !attendee.checkedIn });
      await loadEventData();
    } catch (error) {
      console.error('Error updating attendee:', error);
      alert('Error updating attendee: ' + error.message);
    }
  }
  
  async function handleDeleteAttendee(attendeeId) {
    if (confirm('Delete this attendee?')) {
      try {
        await deleteAttendee(eventId, attendeeId);
        await loadEventData();
      } catch (error) {
        console.error('Error deleting attendee:', error);
        alert('Error deleting attendee: ' + error.message);
      }
    }
  }
  
  async function handleAddUsage() {
    try {
      const validation = await validateUsage(newUsage.itemName, newUsage.quantityUsed);
      
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      await addUsage(eventId, newUsage);
      newUsage = { itemName: '', quantityUsed: 0 };
      showAddUsage = false;
      await loadEventData();
    } catch (error) {
      console.error('Error adding usage:', error);
      alert('Error adding usage: ' + error.message);
    }
  }
  
  function openEditUsage(usageItem) {
    editUsageData = {
      id: usageItem.id,
      itemName: usageItem.itemName,
      quantityUsed: usageItem.quantityUsed
    };
    showEditUsage = true;
  }
  
  async function handleEditUsage() {
    try {
      const validation = await validateUsage(editUsageData.itemName, editUsageData.quantityUsed);
      
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      await updateUsage(eventId, editUsageData.id, {
        itemName: editUsageData.itemName,
        quantityUsed: editUsageData.quantityUsed
      });
      showEditUsage = false;
      await loadEventData();
    } catch (error) {
      console.error('Error updating usage:', error);
      alert('Error updating usage: ' + error.message);
    }
  }
  
  async function handleDeleteUsage(usageId) {
    if (confirm('Delete this usage record? This will affect inventory and financial calculations.')) {
      try {
        await deleteUsage(eventId, usageId);
        await loadEventData();
      } catch (error) {
        console.error('Error deleting usage:', error);
        alert('Error deleting usage: ' + error.message);
      }
    }
  }
  
  async function handleBulkAddAttendees() {
    try {
      const lines = bulkAttendeesText.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('Please enter at least one attendee');
        return;
      }
      
      const attendeesData = [];
      const errors = [];
      
      lines.forEach((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 2) {
          errors.push(`Line ${index + 1}: Need at least name and amount (e.g., "John Doe, 15.00")`);
          return;
        }
        
        const name = parts[0];
        const paidAmount = parseFloat(parts[1]);
        
        if (!name) {
          errors.push(`Line ${index + 1}: Name is required`);
          return;
        }
        
        if (isNaN(paidAmount)) {
          errors.push(`Line ${index + 1}: Invalid amount "${parts[1]}"`);
          return;
        }
        
        attendeesData.push({
          name,
          paidAmount,
          paymentMethod: parts[2] || '',
          checkedIn: parts[3]?.toLowerCase() === 'true' || parts[3]?.toLowerCase() === 'yes',
          notes: parts[4] || ''
        });
      });
      
      if (errors.length > 0) {
        alert('Errors found:\n' + errors.join('\n'));
        return;
      }
      
      await bulkAddAttendees(eventId, attendeesData);
      bulkAttendeesText = '';
      showBulkAddAttendees = false;
      await loadEventData();
      alert(`Successfully added ${attendeesData.length} attendees!`);
    } catch (error) {
      console.error('Error bulk adding attendees:', error);
      alert('Error bulk adding attendees: ' + error.message);
    }
  }
  
  async function handleBulkAddUsage() {
    try {
      const lines = bulkUsageText.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('Please enter at least one usage record');
        return;
      }
      
      const usageData = [];
      const errors = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 2) {
          errors.push(`Line ${i + 1}: Need at least item name and quantity (e.g., "Popcorn Bags, 5")`);
          continue;
        }
        
        const itemName = parts[0];
        const quantityUsed = parseInt(parts[1]);
        
        if (!itemName) {
          errors.push(`Line ${i + 1}: Item name is required`);
          continue;
        }
        
        if (isNaN(quantityUsed) || quantityUsed < 0) {
          errors.push(`Line ${i + 1}: Invalid quantity "${parts[1]}"`);
          continue;
        }
        
        // Validate against inventory
        const validation = await validateUsage(itemName, quantityUsed);
        if (!validation.valid) {
          errors.push(`Line ${i + 1}: ${validation.message}`);
          continue;
        }
        
        usageData.push({
          itemName,
          quantityUsed,
          notes: parts[2] || ''
        });
      }
      
      if (errors.length > 0) {
        alert('Errors found:\n' + errors.join('\n'));
        return;
      }
      
      if (usageData.length === 0) {
        alert('No valid usage records to add');
        return;
      }
      
      await bulkAddUsage(eventId, usageData);
      bulkUsageText = '';
      showBulkAddUsage = false;
      await loadEventData();
      alert(`Successfully added ${usageData.length} usage records!`);
    } catch (error) {
      console.error('Error bulk adding usage:', error);
      alert('Error bulk adding usage: ' + error.message);
    }
  }
  
  async function handleEditEvent() {
    try {
      await updateEvent(eventId, editEventData);
      showEditEvent = false;
      await loadEventData();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event: ' + error.message);
    }
  }
  
  function goBack() {
    dispatch('navigate', { view: 'events' });
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
  .event-details {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  
  .back-btn {
    background: #95a5a6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 1rem;
  }
  
  .back-btn:hover {
    background: #7f8c8d;
  }
  
  .event-header {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
  }
  
  .event-header h1 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
  }
  
  .event-meta {
    color: #7f8c8d;
    margin-bottom: 0.5rem;
  }
  
  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h2 {
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
  
  .btn-small {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
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
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  
  th, td {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 1px solid #ecf0f1;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
  }
  
  @media (max-width: 768px) {
    table {
      min-width: 500px;
    }
    
    th, td {
      padding: 0.5rem;
      font-size: 0.9rem;
    }
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
    max-height: 90vh;
    overflow-y: auto;
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
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .checkbox-group input {
    width: auto;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
  }
  
  .empty {
    text-align: center;
    padding: 2rem;
    color: #95a5a6;
  }
  
  .financial-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .financial-card {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
  }
  
  .financial-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #7f8c8d;
    text-transform: uppercase;
  }
  
  .financial-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
  }
  
  .financial-value.cost {
    color: #e67e22;
  }
  
  .profit {
    color: #27ae60;
  }
  
  .loss {
    color: #e74c3c;
  }
  
  .checked-in {
    color: #27ae60;
  }
  
  .btn-group {
    display: flex;
    gap: 0.5rem;
  }
  
  .help-text {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .help-text code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
  }
  
  .sync-note {
    background: #e8f5e9;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    color: #2e7d32;
    font-size: 0.9rem;
    border-left: 3px solid #4caf50;
  }
  
  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .badge-reusable {
    background: #3498db;
    color: white;
  }
  
  .badge-consumable {
    background: #f39c12;
    color: white;
  }
  
  .badge-info {
    background: #3498db;
    color: white;
  }
  
  .badge-warning {
    background: #f39c12;
    color: white;
  }
  
  .badge-secondary {
    background: #95a5a6;
    color: white;
  }
  
  .low-stock {
    color: #e74c3c;
    font-weight: bold;
  }
  
  .profit-explanation {
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-left: 3px solid #3498db;
    color: #2c3e50;
    font-size: 0.9rem;
    border-radius: 4px;
    line-height: 1.6;
  }
  
  @media (max-width: 768px) {
    .financial-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="event-details">
  <button class="back-btn" on:click={goBack}>← Back to Events</button>
  
  {#if loading}
    <div class="loading">Loading event details...</div>
  {:else if event}
    <div class="event-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <h1>{event.name}</h1>
          <div class="event-meta">📅 {formatDate(event.date)}</div>
          <div class="event-meta">🎟️ Ticket Price: {formatCurrency(event.ticketPrice)}</div>
          {#if event.notes}
            <div class="event-meta">📝 {event.notes}</div>
          {/if}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-small" on:click={handleResync} disabled={syncing} title="Refresh all data from database">
            {syncing ? '⏳ Syncing...' : '🔄 Re-sync'}
          </button>
          <button class="btn btn-small" on:click={() => showEditEvent = true}>✏️ Edit</button>
        </div>
      </div>
      <div class="sync-note">
        💡 Tip: Use the Re-sync button if data doesn't appear as expected
      </div>
    </div>
    
    {#if financialSummary}
      <div class="section">
        <h2>Financial Summary</h2>
        <div class="financial-grid">
          <div class="financial-card">
            <h3>Revenue Collected</h3>
            <div class="financial-value">{formatCurrency(financialSummary.revenue)}</div>
          </div>
          <div class="financial-card">
            <h3>Direct Purchase Cost</h3>
            <div class="financial-value cost">{formatCurrency(financialSummary.totalPurchaseCost)}</div>
          </div>
          <div class="financial-card">
            <h3>Profit by Purchase</h3>
            <div class="financial-value" class:profit={parseFloat(financialSummary.profitByPurchase) >= 0} class:loss={parseFloat(financialSummary.profitByPurchase) < 0}>
              {formatCurrency(financialSummary.profitByPurchase)}
            </div>
          </div>
          <div class="financial-card">
            <h3>Usage-Based Cost</h3>
            <div class="financial-value cost">{formatCurrency(financialSummary.totalUsageCost)}</div>
          </div>
          <div class="financial-card">
            <h3>Profit by Usage</h3>
            <div class="financial-value" class:profit={parseFloat(financialSummary.profitByUsage) >= 0} class:loss={parseFloat(financialSummary.profitByUsage) < 0}>
              {formatCurrency(financialSummary.profitByUsage)}
            </div>
          </div>
        </div>
        
        <div class="profit-explanation">
          <strong>Profit by Purchase</strong> = Revenue - Direct Purchase Cost (what you actually spent)<br>
          <strong>Profit by Usage</strong> = Revenue - Usage-Based Cost (accounting for inventory value consumed)
        </div>
        
        {#if financialSummary.costBreakdown && financialSummary.costBreakdown.length > 0}
          <h3>Cost Breakdown</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty Purchased</th>
                  <th>Purchase Cost</th>
                  <th>Qty Used</th>
                  <th>Usage Cost</th>
                  <th>Amortization</th>
                </tr>
              </thead>
              <tbody>
                {#each financialSummary.costBreakdown as item}
                  <tr>
                    <td>{item.itemName}</td>
                    <td>{item.quantityPurchased || '-'}</td>
                    <td>{item.purchaseCost > 0 ? formatCurrency(item.purchaseCost) : '-'}</td>
                    <td>{item.quantityUsed || '-'}</td>
                    <td>{item.usageCost > 0 ? formatCurrency(item.usageCost) : '-'}</td>
                    <td>
                      {#if item.isAmortized && item.amortizedAcrossEvents > 1}
                        <span class="badge badge-info" title="Cost divided across {item.amortizedAcrossEvents} events">
                          Shared across {item.amortizedAcrossEvents} events
                        </span>
                      {:else if item.isAmortized && item.amortizedAcrossEvents === 1}
                        <span class="badge badge-warning" title="Reusable item, first use">First use (reusable)</span>
                      {:else}
                        <span class="badge badge-secondary">Consumable</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
    
    <div class="section">
      <div class="section-header">
        <h2>Attendees ({attendees.length})</h2>
        <div class="btn-group">
          <button class="btn" on:click={() => showAddAttendee = true}>+ Add Attendee</button>
          <button class="btn" on:click={() => showBulkAddAttendees = true}>📋 Bulk Import</button>
        </div>
      </div>
      
      {#if attendees.length === 0}
        <div class="empty">No attendees yet.</div>
      {:else}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Paid Amount</th>
                <th>Payment Method</th>
                <th>Checked In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each attendees as attendee}
                <tr>
                  <td>{attendee.name}</td>
                  <td>{formatCurrency(attendee.paidAmount)}</td>
                  <td>{attendee.paymentMethod || 'N/A'}</td>
                  <td class:checked-in={attendee.checkedIn}>
                    {attendee.checkedIn ? '✓ Yes' : '✗ No'}
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-small" on:click={() => openEditAttendee(attendee)}>
                        Edit
                      </button>
                      <button class="btn btn-small" on:click={() => handleToggleCheckIn(attendee)}>
                        {attendee.checkedIn ? 'Uncheck' : 'Check In'}
                      </button>
                      <button class="btn btn-small btn-danger" on:click={() => handleDeleteAttendee(attendee.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    
    <div class="section">
      <div class="section-header">
        <h2>Purchases for this Event</h2>
      </div>
      
      {#if purchases.length === 0}
        <div class="empty">No purchases recorded for this event.</div>
      {:else}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Quantity Purchased</th>
                <th>Cost</th>
                <th>Cost/Unit</th>
              </tr>
            </thead>
            <tbody>
              {#each purchases as purchase}
                <tr>
                  <td>{purchase.name}</td>
                  <td>{purchase.category || 'N/A'}</td>
                  <td>
                    <span class="badge" class:badge-reusable={purchase.reusableType === 'reusable'} class:badge-consumable={purchase.reusableType === 'consumable'}>
                      {purchase.reusableType}
                    </span>
                  </td>
                  <td>{purchase.quantityPurchased}</td>
                  <td>{formatCurrency(purchase.cost)}</td>
                  <td>{formatCurrency(purchase.cost / purchase.quantityPurchased)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    
    <div class="section">
      <div class="section-header">
        <h2>Inventory Usage & Remaining</h2>
        <div class="btn-group">
          <button class="btn" on:click={() => showAddUsage = true}>+ Add Usage</button>
          <button class="btn" on:click={() => showBulkAddUsage = true}>📋 Bulk Import</button>
        </div>
      </div>
      
      {#if usage.length === 0}
        <div class="empty">No inventory usage recorded.</div>
      {:else}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Used</th>
                <th>Remaining in Inventory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each usage as usageItem}
                {@const inventoryItem = inventory.find(i => i.itemName === usageItem.itemName)}
                <tr>
                  <td>{usageItem.itemName}</td>
                  <td>{usageItem.quantityUsed}</td>
                  <td class:low-stock={inventoryItem && typeof inventoryItem.remainingQuantity === 'number' && inventoryItem.remainingQuantity < 10}>
                    {inventoryItem ? inventoryItem.remainingQuantity : 'N/A'}
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-small" on:click={() => openEditUsage(usageItem)}>
                        Edit
                      </button>
                      <button class="btn btn-small btn-danger" on:click={() => handleDeleteUsage(usageItem.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty">Event not found.</div>
  {/if}
  
  {#if showAddAttendee}
    <div class="modal-overlay" on:click={() => showAddAttendee = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add Attendee</h2>
        <form on:submit|preventDefault={handleAddAttendee}>
          <div class="form-group">
            <label for="attendeeName">Name *</label>
            <input 
              id="attendeeName" 
              type="text" 
              bind:value={newAttendee.name} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="paidAmount">Paid Amount *</label>
            <input 
              id="paidAmount" 
              type="number" 
              step="0.01" 
              bind:value={newAttendee.paidAmount} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="paymentMethod">Payment Method</label>
            <input 
              id="paymentMethod" 
              type="text" 
              bind:value={newAttendee.paymentMethod} 
              placeholder="e.g., Cash, Venmo"
            />
          </div>
          
          <div class="form-group">
            <div class="checkbox-group">
              <input 
                id="checkedIn" 
                type="checkbox" 
                bind:checked={newAttendee.checkedIn} 
              />
              <label for="checkedIn">Checked In</label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="attendeeNotes">Notes</label>
            <textarea 
              id="attendeeNotes" 
              bind:value={newAttendee.notes} 
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showAddAttendee = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Add Attendee</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showAddUsage}
    <div class="modal-overlay" on:click={() => showAddUsage = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add Inventory Usage</h2>
        <form on:submit|preventDefault={handleAddUsage}>
          <div class="form-group">
            <label for="itemName">Item *</label>
            <select 
              id="itemName" 
              bind:value={newUsage.itemName} 
              required
            >
              <option value="">Select an item...</option>
              {#each inventory as item}
                <option value={item.itemName}>
                  {item.itemName} (Available: {item.remainingQuantity})
                </option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="quantityUsed">Quantity Used *</label>
            <input 
              id="quantityUsed" 
              type="number" 
              bind:value={newUsage.quantityUsed} 
              required 
              min="0"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showAddUsage = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Add Usage</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showEditUsage}
    <div class="modal-overlay" on:click={() => showEditUsage = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit Inventory Usage</h2>
        <form on:submit|preventDefault={handleEditUsage}>
          <div class="form-group">
            <label for="editItemName">Item *</label>
            <select 
              id="editItemName" 
              bind:value={editUsageData.itemName} 
              required
            >
              <option value="">Select an item...</option>
              {#each inventory as item}
                <option value={item.itemName}>
                  {item.itemName} (Available: {item.remainingQuantity})
                </option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="editQuantityUsed">Quantity Used *</label>
            <input 
              id="editQuantityUsed" 
              type="number" 
              bind:value={editUsageData.quantityUsed} 
              required 
              min="0"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showEditUsage = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Update Usage</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showBulkAddAttendees}
    <div class="modal-overlay" on:click={() => showBulkAddAttendees = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Bulk Import Attendees</h2>
        
        <div class="help-text">
          Enter one attendee per line in CSV format:<br>
          <code>Name, Amount, Payment Method, Checked In, Notes</code><br><br>
          
          <strong>Examples:</strong><br>
          <code>John Doe, 15.00</code><br>
          <code>Jane Smith, 20.00, Venmo</code><br>
          <code>Bob Johnson, 15.00, Cash, true</code><br>
          <code>Alice Brown, 18.50, Card, yes, VIP guest</code>
        </div>
        
        <form on:submit|preventDefault={handleBulkAddAttendees}>
          <div class="form-group">
            <label for="bulkAttendees">Attendees Data *</label>
            <textarea 
              id="bulkAttendees" 
              bind:value={bulkAttendeesText}
              rows="10"
              placeholder="John Doe, 15.00&#10;Jane Smith, 20.00, Venmo&#10;Bob Johnson, 15.00, Cash, true"
              required
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showBulkAddAttendees = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Import Attendees</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showBulkAddUsage}
    <div class="modal-overlay" on:click={() => showBulkAddUsage = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Bulk Import Inventory Usage</h2>
        
        <div class="help-text">
          Enter one usage record per line in CSV format:<br>
          <code>Item Name, Quantity, Notes</code><br><br>
          
          <strong>Examples:</strong><br>
          <code>Popcorn Bags, 5</code><br>
          <code>Soda Cans, 12, Large size</code><br>
          <code>Candy Bars, 8, Assorted flavors</code><br><br>
          
          <strong>Available items:</strong><br>
          {#each inventory as item}
            <code>{item.itemName}</code> (Available: {item.remainingQuantity})<br>
          {/each}
        </div>
        
        <form on:submit|preventDefault={handleBulkAddUsage}>
          <div class="form-group">
            <label for="bulkUsage">Usage Data *</label>
            <textarea 
              id="bulkUsage" 
              bind:value={bulkUsageText}
              rows="10"
              placeholder="Popcorn Bags, 5&#10;Soda Cans, 12&#10;Candy Bars, 8, Assorted"
              required
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showBulkAddUsage = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Import Usage</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showEditEvent}
    <div class="modal-overlay" on:click={() => showEditEvent = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit Event</h2>
        <form on:submit|preventDefault={handleEditEvent}>
          <div class="form-group">
            <label for="editName">Event Name *</label>
            <input 
              id="editName" 
              type="text" 
              bind:value={editEventData.name} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="editDate">Date *</label>
            <input 
              id="editDate" 
              type="date" 
              bind:value={editEventData.date} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="editTicketPrice">Ticket Price *</label>
            <input 
              id="editTicketPrice" 
              type="number" 
              step="0.01" 
              bind:value={editEventData.ticketPrice} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="editNotes">Notes</label>
            <textarea 
              id="editNotes" 
              bind:value={editEventData.notes} 
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showEditEvent = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  {#if showEditAttendee}
    <div class="modal-overlay" on:click={() => showEditAttendee = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit Attendee</h2>
        <form on:submit|preventDefault={handleEditAttendee}>
          <div class="form-group">
            <label for="editAttendeeName">Name *</label>
            <input 
              id="editAttendeeName" 
              type="text" 
              bind:value={editAttendeeData.name} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="editPaidAmount">Paid Amount *</label>
            <input 
              id="editPaidAmount" 
              type="number" 
              step="0.01" 
              bind:value={editAttendeeData.paidAmount} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="editPaymentMethod">Payment Method</label>
            <input 
              id="editPaymentMethod" 
              type="text" 
              bind:value={editAttendeeData.paymentMethod} 
              placeholder="e.g., Cash, Venmo"
            />
          </div>
          
          <div class="form-group">
            <div class="checkbox-group">
              <input 
                id="editCheckedIn" 
                type="checkbox" 
                bind:checked={editAttendeeData.checkedIn} 
              />
              <label for="editCheckedIn">Checked In</label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="editAttendeeNotes">Notes</label>
            <textarea 
              id="editAttendeeNotes" 
              bind:value={editAttendeeData.notes} 
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showEditAttendee = false}>
              Cancel
            </button>
            <button type="submit" class="btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
