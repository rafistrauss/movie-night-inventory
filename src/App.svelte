<script>
  import { onMount } from 'svelte';
  import { auth } from './firebase';
  import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
  import Dashboard from './components/Dashboard.svelte';
  import EventsList from './components/EventsList.svelte';
  import EventDetails from './components/EventDetails.svelte';
  import ExpensesPage from './components/ExpensesPage.svelte';
  import InventoryPage from './components/InventoryPage.svelte';
  
  let user = null;
  let currentView = 'dashboard';
  let selectedEventId = null;
  let email = '';
  let password = '';
  let loginError = '';
  
  onMount(() => {
    onAuthStateChanged(auth, (authUser) => {
      user = authUser;
    });
  });
  
  async function handleLogin() {
    try {
      loginError = '';
      await signInWithEmailAndPassword(auth, email, password);
      email = '';
      password = '';
    } catch (error) {
      loginError = error.message;
    }
  }
  
  async function handleLogout() {
    await signOut(auth);
  }
  
  function navigate(view, eventId = null) {
    currentView = view;
    selectedEventId = eventId;
  }
</script>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
  }
  
  .app {
    min-height: 100vh;
  }
  
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .login-box {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
  }
  
  .login-box h1 {
    margin-top: 0;
    color: #333;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  .error {
    color: #e74c3c;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
    font-weight: 500;
  }
  
  .btn:hover {
    background: #5568d3;
  }
  
  nav {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  nav h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .nav-links {
    display: flex;
    gap: 1rem;
  }
  
  .nav-link {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .nav-link:hover {
    background: #34495e;
  }
  
  .nav-link.active {
    background: #34495e;
  }
  
  .logout-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .logout-btn:hover {
    background: #c0392b;
  }
</style>

<div class="app">
  {#if !user}
    <div class="login-container">
      <div class="login-box">
        <h1>🎬 Movie Night Tracker</h1>
        <form on:submit|preventDefault={handleLogin}>
          {#if loginError}
            <div class="error">{loginError}</div>
          {/if}
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              bind:value={email} 
              required 
              placeholder="Enter your email"
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              bind:value={password} 
              required 
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" class="btn">Login</button>
        </form>
      </div>
    </div>
  {:else}
    <nav>
      <h1>🎬 Movie Night Tracker</h1>
      <div class="nav-links">
        <button 
          class="nav-link" 
          class:active={currentView === 'dashboard'} 
          on:click={() => navigate('dashboard')}
        >
          Dashboard
        </button>
        <button 
          class="nav-link" 
          class:active={currentView === 'events'} 
          on:click={() => navigate('events')}
        >
          Events
        </button>
        <button 
          class="nav-link" 
          class:active={currentView === 'expenses'} 
          on:click={() => navigate('expenses')}
        >
          Expenses
        </button>
        <button 
          class="nav-link" 
          class:active={currentView === 'inventory'} 
          on:click={() => navigate('inventory')}
        >
          Inventory
        </button>
        <button class="logout-btn" on:click={handleLogout}>Logout</button>
      </div>
    </nav>
    
    <main>
      {#if currentView === 'dashboard'}
        <Dashboard on:navigate={(e) => navigate(e.detail.view, e.detail.eventId)} />
      {:else if currentView === 'events'}
        <EventsList on:navigate={(e) => navigate(e.detail.view, e.detail.eventId)} />
      {:else if currentView === 'eventDetails'}
        <EventDetails eventId={selectedEventId} on:navigate={(e) => navigate(e.detail.view)} />
      {:else if currentView === 'expenses'}
        <ExpensesPage />
      {:else if currentView === 'inventory'}
        <InventoryPage />
      {/if}
    </main>
  {/if}
</div>
