<script>
  import { onMount } from 'svelte';
  import { getInventoryData } from '../services/aggregationService';
  
  let inventory = [];
  let usageHistory = [];
  let loading = true;
  let selectedItem = null;
  let showUsageHistory = false;
  
  // Filtering and sorting
  let searchTerm = '';
  let filterType = 'all';
  let filterCategory = 'all';
  let sortBy = 'name';
  let sortDirection = 'asc';
  
  $: categories = [...new Set(inventory.map(item => item.category).filter(Boolean))].sort();
  $: filteredAndSortedInventory = filterAndSortInventory(inventory, searchTerm, filterType, filterCategory, sortBy, sortDirection);
  
  onMount(async () => {
    await loadInventory();
  });
  
  async function loadInventory() {
    try {
      loading = true;
      // Single optimized fetch instead of 2 separate calls
      const data = await getInventoryData();
      inventory = data.inventory;
      usageHistory = data.usageHistory;
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      loading = false;
    }
  }
  
  function viewUsageHistory(item) {
    selectedItem = item;
    showUsageHistory = true;
  }
  
  function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }
  
  function getItemUsageHistory(itemName) {
    return usageHistory.filter(usage => usage.itemName === itemName);
  }
  
  function getStockStatus(item) {
    if (item.reusableType === 'reusable') return 'N/A';
    const remaining = item.remainingQuantity;
    if (remaining < 0) return 'negative';
    if (remaining < 10) return 'low';
    if (remaining < 20) return 'medium';
    return 'good';
  }
  
  function filterAndSortInventory(items, search, type, category, sort, direction) {
    let filtered = items;
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(item => item.reusableType === type);
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch(sort) {
        case 'name':
          aVal = a.itemName.toLowerCase();
          bVal = b.itemName.toLowerCase();
          break;
        case 'quantity':
          aVal = a.remainingQuantity;
          bVal = b.remainingQuantity;
          break;
        case 'used':
          aVal = a.quantityUsed || 0;
          bVal = b.quantityUsed || 0;
          break;
        case 'cost':
          aVal = a.totalCost;
          bVal = b.totalCost;
          break;
        default:
          aVal = a.itemName.toLowerCase();
          bVal = b.itemName.toLowerCase();
      }
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }
</script>

<style>
  .inventory-page {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
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
  
  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
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
  
  .stock-status {
    font-weight: bold;
  }
  
  .stock-good {
    color: #27ae60;
  }
  
  .stock-medium {
    color: #f39c12;
  }
  
  .stock-low {
    color: #e67e22;
  }
  
  .stock-negative {
    color: #e74c3c;
  }
  
  .btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn:hover {
    background: #2980b9;
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
    max-width: 700px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal h2 {
    margin-top: 0;
    color: #2c3e50;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
  }
  
  .info-label {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin-bottom: 0.25rem;
  }
  
  .info-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .filters {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .filter-group input,
  .filter-group select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .results-count {
    margin-bottom: 1rem;
    color: #7f8c8d;
    font-size: 0.9rem;
  }
</style>

<div class="inventory-page">
  <div class="header">
    <h1>Inventory</h1>
  </div>
  
  {#if loading}
    <div class="loading">Loading inventory...</div>
  {:else}
    <div class="filters">
      <div class="filter-group">
        <label for="search">Search</label>
        <input 
          id="search"
          type="text" 
          bind:value={searchTerm}
          placeholder="Search by name or category..."
        />
      </div>
      
      <div class="filter-group">
        <label for="filterType">Type</label>
        <select id="filterType" bind:value={filterType}>
          <option value="all">All Types</option>
          <option value="reusable">Reusable</option>
          <option value="consumable">Consumable</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filterCategory">Category</label>
        <select id="filterCategory" bind:value={filterCategory}>
          <option value="all">All Categories</option>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="sortBy">Sort By</label>
        <select id="sortBy" bind:value={sortBy}>
          <option value="name">Name</option>
          <option value="quantity">Remaining Quantity</option>
          <option value="used">Quantity Used</option>
          <option value="cost">Total Cost</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="sortDirection">Order</label>
        <select id="sortDirection" bind:value={sortDirection}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
    
    <div class="section">
      {#if inventory.length === 0}
        <div class="empty">No inventory items. Add expenses to build inventory.</div>
      {:else}
        <div class="results-count">
          Showing {filteredAndSortedInventory.length} of {inventory.length} items
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Initial Quantity</th>
              <th>Used</th>
              <th>Remaining</th>
              <th>Cost/Unit</th>
              <th>Total Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredAndSortedInventory as item}
              <tr>
                <td>{item.itemName}</td>
                <td>{item.category || 'N/A'}</td>
                <td>
                  <span class="badge" class:badge-reusable={item.reusableType === 'reusable'} class:badge-consumable={item.reusableType === 'consumable'}>
                    {item.reusableType}
                  </span>
                </td>
                <td>{item.initialQuantity}</td>
                <td>{item.quantityUsed || 0}</td>
                <td>
                  <span class="stock-status" 
                    class:stock-good={getStockStatus(item) === 'good'}
                    class:stock-medium={getStockStatus(item) === 'medium'}
                    class:stock-low={getStockStatus(item) === 'low'}
                    class:stock-negative={getStockStatus(item) === 'negative'}
                  >
                    {item.remainingQuantity}
                  </span>
                </td>
                <td>{formatCurrency(item.costPerUnit)}</td>
                <td>{formatCurrency(item.totalCost)}</td>
                <td>
                  <button class="btn" on:click={() => viewUsageHistory(item)}>
                    Usage History
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
  
  {#if showUsageHistory && selectedItem}
    <div class="modal-overlay" on:click={() => showUsageHistory = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>Usage History: {selectedItem.itemName}</h2>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Type</span>
            <span class="info-value">{selectedItem.reusableType}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Initial Quantity</span>
            <span class="info-value">{selectedItem.initialQuantity}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Used</span>
            <span class="info-value">{selectedItem.quantityUsed || 0}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Remaining</span>
            <span class="info-value">{selectedItem.remainingQuantity}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cost per Unit</span>
            <span class="info-value">{formatCurrency(selectedItem.costPerUnit)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Cost</span>
            <span class="info-value">{formatCurrency(selectedItem.totalCost)}</span>
          </div>
        </div>
        
        {#if getItemUsageHistory(selectedItem.itemName).length > 0}
          <h3>Usage by Event</h3>
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Quantity Used</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {#each getItemUsageHistory(selectedItem.itemName) as usage}
                <tr>
                  <td>{usage.eventId}</td>
                  <td>{usage.quantityUsed}</td>
                  <td>{formatCurrency(parseFloat(selectedItem.costPerUnit) * usage.quantityUsed)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div class="empty">No usage recorded for this item yet.</div>
        {/if}
        
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showUsageHistory = false}>
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
