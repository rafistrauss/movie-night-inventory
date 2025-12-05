<script>
  import { onMount } from 'svelte';
  import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
  import { getAllEvents } from '../services/eventService';
  
  let expenses = [];
  let events = [];
  let loading = true;
  let showCreateForm = false;
  let editingExpense = null;
  let filterEventId = '';
  
  let formData = {
    name: '',
    category: '',
    cost: 0,
    quantityPurchased: 1,
    reusableType: 'consumable',
    eventId: '',
    notes: ''
  };
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    try {
      loading = true;
      [expenses, events] = await Promise.all([
        getAllExpenses(),
        getAllEvents()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }
  
  function resetForm() {
    formData = {
      name: '',
      category: '',
      cost: 0,
      quantityPurchased: 1,
      reusableType: 'consumable',
      eventId: '',
      notes: ''
    };
    editingExpense = null;
  }
  
  function openCreateForm() {
    resetForm();
    showCreateForm = true;
  }
  
  function openEditForm(expense) {
    formData = { ...expense };
    editingExpense = expense;
    showCreateForm = true;
  }
  
  async function handleSubmit() {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
      } else {
        await createExpense(formData);
      }
      showCreateForm = false;
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense: ' + error.message);
    }
  }
  
  async function handleDelete(expenseId) {
    if (confirm('Delete this expense? This will affect inventory calculations.')) {
      try {
        await deleteExpense(expenseId);
        await loadData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense: ' + error.message);
      }
    }
  }
  
  function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }
  
  function getEventName(eventId) {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown';
  }
  
  $: filteredExpenses = filterEventId 
    ? expenses.filter(e => e.eventId === filterEventId)
    : expenses;
</script>

<style>
  .expenses-page {
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
  
  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    width: 100%;
    overflow-x: hidden;
  }
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
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
    overflow-y: auto;
    padding: 1rem 0;
  }
  
  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-sizing: border-box;
    margin: auto;
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
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
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
  
  .filter-section {
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .filter-section label {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .filter-section select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
  }
  
  .filter-count {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .form-group-highlight {
    background: #f0f8ff;
    padding: 1rem;
    border-radius: 4px;
    border: 2px solid #3498db;
  }
  
  .field-help {
    display: block;
    margin-top: 0.25rem;
    color: #7f8c8d;
    font-size: 0.85rem;
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
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  /* Mobile Card View for Better Readability */
  .mobile-card {
    display: none;
  }
  
  @media (max-width: 768px) {
    .expenses-page {
      padding: 1rem;
    }
    
    .header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .header h1 {
      font-size: 1.5rem;
    }
    
    .header .btn {
      width: 100%;
      min-height: 48px;
    }
    
    .section {
      padding: 0.5rem;
    }
    
    /* Hide table, show cards instead */
    .table-wrapper {
      display: none;
    }
    
    .mobile-card {
      display: block;
    }
    
    .expense-card {
      background: white;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .expense-card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
      gap: 0.5rem;
    }
    
    .expense-card-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1rem;
      flex: 1;
    }
    
    .expense-card-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }
    
    .expense-card-field {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    
    .expense-card-label {
      color: #7f8c8d;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 500;
    }
    
    .expense-card-value {
      color: #2c3e50;
      font-weight: 500;
    }
    
    .expense-card-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .expense-card-actions .btn {
      flex: 1;
      min-height: 44px;
    }
    
    .modal {
      width: 95%;
      max-width: 95%;
      padding: 1.5rem;
      max-height: 85vh;
    }
    
    .modal h2 {
      font-size: 1.3rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .form-actions {
      flex-direction: column-reverse;
      gap: 0.75rem;
    }
    
    .form-actions button {
      width: 100%;
      min-height: 48px;
    }
    
    .badge {
      font-size: 0.75rem;
    }
  }
</style>

<div class="expenses-page">
  <div class="header">
    <h1>Expenses</h1>
    <button class="btn" on:click={openCreateForm}>+ Add Expense</button>
  </div>
  
  {#if loading}
    <div class="loading">Loading expenses...</div>
  {:else}
    <div class="filter-section">
      <label for="filterEvent">Filter by Event:</label>
      <select id="filterEvent" bind:value={filterEventId}>
        <option value="">All Events</option>
        {#each events as event}
          <option value={event.id}>{event.name}</option>
        {/each}
      </select>
      {#if filterEventId}
        <span class="filter-count">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </span>
      {/if}
    </div>
    
    <div class="section">
      {#if expenses.length === 0}
        <div class="empty">No expenses recorded yet.</div>
      {:else}
        <!-- Desktop Table View -->
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Cost</th>
                <th>Quantity</th>
                <th>Purchased For</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredExpenses as expense}
                <tr>
                  <td>{expense.name}</td>
                  <td>{expense.category || 'N/A'}</td>
                  <td>
                    <span class="badge" class:badge-reusable={expense.reusableType === 'reusable'} class:badge-consumable={expense.reusableType === 'consumable'}>
                      {expense.reusableType}
                    </span>
                  </td>
                  <td>{formatCurrency(expense.cost)}</td>
                  <td>{expense.quantityPurchased}</td>
                  <td>{getEventName(expense.eventId)}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-small" on:click={() => openEditForm(expense)}>
                        Edit
                      </button>
                      <button class="btn btn-small btn-danger" on:click={() => handleDelete(expense.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <!-- Mobile Card View -->
        <div class="mobile-card">
          {#each filteredExpenses as expense}
            <div class="expense-card">
              <div class="expense-card-header">
                <div class="expense-card-title">{expense.name}</div>
                <span class="badge" class:badge-reusable={expense.reusableType === 'reusable'} class:badge-consumable={expense.reusableType === 'consumable'}>
                  {expense.reusableType}
                </span>
              </div>
              
              <div class="expense-card-body">
                <div class="expense-card-field">
                  <span class="expense-card-label">Category</span>
                  <span class="expense-card-value">{expense.category || 'N/A'}</span>
                </div>
                <div class="expense-card-field">
                  <span class="expense-card-label">Cost</span>
                  <span class="expense-card-value">{formatCurrency(expense.cost)}</span>
                </div>
                <div class="expense-card-field">
                  <span class="expense-card-label">Quantity</span>
                  <span class="expense-card-value">{expense.quantityPurchased}</span>
                </div>
                <div class="expense-card-field">
                  <span class="expense-card-label">Event</span>
                  <span class="expense-card-value">{getEventName(expense.eventId)}</span>
                </div>
              </div>
              
              <div class="expense-card-actions">
                <button class="btn btn-small" on:click={() => openEditForm(expense)}>
                  Edit
                </button>
                <button class="btn btn-small btn-danger" on:click={() => handleDelete(expense.id)}>
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  
  {#if showCreateForm}
    <div class="modal-overlay" on:click={() => showCreateForm = false}>
      <div class="modal" on:click|stopPropagation>
        <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="name">Item Name *</label>
            <input 
              id="name" 
              type="text" 
              bind:value={formData.name} 
              required 
              placeholder="e.g., Popcorn Box (44 ct)"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="category">Category</label>
              <input 
                id="category" 
                type="text" 
                bind:value={formData.category} 
                placeholder="e.g., Snacks"
              />
            </div>
            
            <div class="form-group">
              <label for="reusableType">Type *</label>
              <select id="reusableType" bind:value={formData.reusableType} required>
                <option value="consumable">Consumable</option>
                <option value="reusable">Reusable</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="cost">Cost *</label>
              <input 
                id="cost" 
                type="number" 
                step="0.01" 
                bind:value={formData.cost} 
                required 
                placeholder="0.00"
              />
            </div>
            
            <div class="form-group">
              <label for="quantity">Quantity Purchased *</label>
              <input 
                id="quantity" 
                type="number" 
                bind:value={formData.quantityPurchased} 
                required 
                min="1"
              />
            </div>
          </div>
          
          <div class="form-group form-group-highlight">
            <label for="eventId">Purchased For Event *</label>
            <select id="eventId" bind:value={formData.eventId} required>
              <option value="">Select which event this was purchased for...</option>
              {#each events as event}
                <option value={event.id}>{event.name}</option>
              {/each}
            </select>
            <small class="field-help">This tracks which event the expense belongs to</small>
          </div>
          
          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea 
              id="notes" 
              bind:value={formData.notes} 
              placeholder="Additional notes"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showCreateForm = false}>
              Cancel
            </button>
            <button type="submit" class="btn">
              {editingExpense ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
