<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { getDashboardData } from '../services/aggregationService';
  
  const dispatch = createEventDispatcher();
  
  let events = [];
  let leftoverFunds = 0;
  let inventory = [];
  let lowStockItems = 0;
  let loading = true;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    try {
      loading = true;
      // Single optimized fetch instead of 3 separate calls
      const data = await getDashboardData();
      events = data.events;
      leftoverFunds = data.leftoverFunds;
      inventory = data.inventory;
      lowStockItems = data.lowStockItems;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading = false;
    }
  }
  
  function viewEvent(eventId) {
    dispatch('navigate', { view: 'eventDetails', eventId });
  }
  
  function goToEvents() {
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
    return `$${parseFloat(amount).toFixed(2)}`;
  }
</script>

<style>
  .dashboard {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  
  .dashboard h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .stat-card h3 {
    margin: 0 0 0.5rem 0;
    color: #7f8c8d;
    font-size: 0.9rem;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2c3e50;
  }
  
  .stat-value.positive {
    color: #27ae60;
  }
  
  .stat-value.negative {
    color: #e74c3c;
  }
  
  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
    width: 100%;
    overflow-x: hidden;
  }
  
  .section h2 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .btn-link {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn-link:hover {
    background: #2980b9;
  }
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 500px;
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
  
  tr:hover {
    background: #f8f9fa;
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
  
  .view-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .view-btn:hover {
    background: #2980b9;
  }
  
  .low-stock {
    color: #e74c3c;
    font-weight: bold;
  }
  
  .amortization-note {
    color: #3498db;
    font-weight: bold;
    margin-left: 4px;
    cursor: help;
  }
  
  /* Mobile Optimizations */
  @media (max-width: 768px) {
    .hide-mobile {
      display: none;
    }
    .dashboard {
      padding: 1rem;
    }
    
    .dashboard h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    
    .stat-card {
      padding: 1rem;
    }
    
    .stat-card h3 {
      font-size: 0.75rem;
    }
    
    .stat-value {
      font-size: 1.5rem;
    }
    
    .section {
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .section h2 {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 1.2rem;
    }
    
    .btn-link, .view-btn {
      width: 100%;
      text-align: center;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    table {
      font-size: 0.85rem;
      min-width: 100%;
    }
    
    th, td {
      padding: 0.5rem 0.4rem;
    }
    
    /* Adjust remaining columns to fill space */
    th:first-child, td:first-child {
      width: 45%;
    }
  }
  
  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .stat-value {
      font-size: 1.75rem;
    }
  }
</style>

<div class="dashboard">
  <h1>Dashboard</h1>
  
  {#if loading}
    <div class="loading">Loading dashboard...</div>
  {:else}
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Events</h3>
        <div class="stat-value">{events.length}</div>
      </div>
      
      <div class="stat-card">
        <h3>Leftover Funds</h3>
        <div class="stat-value" class:positive={leftoverFunds >= 0} class:negative={leftoverFunds < 0}>
          {formatCurrency(leftoverFunds)}
        </div>
      </div>
      
      <div class="stat-card">
        <h3>Inventory Items</h3>
        <div class="stat-value">{inventory.length}</div>
      </div>
      
      <div class="stat-card">
        <h3>Low Stock Items</h3>
        <div class="stat-value">
          {lowStockItems}
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>
        Recent Events
        <button class="btn-link" on:click={goToEvents}>View All</button>
      </h2>
      
      {#if events.length === 0}
        <div class="empty">No events yet. Create your first event!</div>
      {:else}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Ticket Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each events.slice(0, 5) as event}
                <tr>
                  <td>{event.name}</td>
                  <td>{formatDate(event.date)}</td>
                  <td>{formatCurrency(event.ticketPrice || 0)}</td>
                  <td>
                    <button class="view-btn" on:click={() => viewEvent(event.id)}>View</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    
    <div class="section">
      <h2>Inventory Summary</h2>
      
      {#if inventory.length === 0}
        <div class="empty">No inventory items yet.</div>
      {:else}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th class="hide-mobile">Type</th>
                <th class="hide-mobile">Initial Quantity</th>
                <th>Remaining</th>
                <th>Cost/Unit</th>
                <th class="hide-mobile">Events Used</th>
              </tr>
            </thead>
            <tbody>
              {#each inventory.slice(0, 10) as item}
                <tr>
                  <td>{item.itemName}</td>
                  <td class="hide-mobile">{item.reusableType}</td>
                  <td class="hide-mobile">{item.initialQuantity}</td>
                  <td class:low-stock={typeof item.remainingQuantity === 'number' && item.remainingQuantity < 10}>
                    {item.remainingQuantity}
                  </td>
                  <td>
                    {formatCurrency(item.costPerUnit)}
                    {#if item.amortizedAcrossEvents && item.amortizedAcrossEvents > 1}
                      <span class="amortization-note" title="Cost amortized across {item.amortizedAcrossEvents} events">*</span>
                    {/if}
                  </td>
                  <td class="hide-mobile">
                    {#if item.amortizedAcrossEvents}
                      {item.amortizedAcrossEvents}
                    {:else}
                      -
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
</div>
