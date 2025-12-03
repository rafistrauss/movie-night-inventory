# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Svelte Application (SPA)                   │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │Dashboard │  │ Events   │  │Inventory │  ...       │  │
│  │  │Component │  │Component │  │Component │            │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │  │
│  │       │             │              │                   │  │
│  │       └─────────────┴──────────────┘                   │  │
│  │                     │                                   │  │
│  │         ┌───────────▼───────────┐                      │  │
│  │         │   Service Layer       │                      │  │
│  │         │  (Business Logic)     │                      │  │
│  │         └───────────┬───────────┘                      │  │
│  │                     │                                   │  │
│  │         ┌───────────▼───────────┐                      │  │
│  │         │   Firebase SDK        │                      │  │
│  │         └───────────┬───────────┘                      │  │
│  └─────────────────────┼─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
        ┌───────────────▼────────────────┐
        │      Firebase Cloud            │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │  Firebase Authentication │  │
        │  │  (Email/Password)        │  │
        │  └──────────────────────────┘  │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │  Firestore Database      │  │
        │  │  (NoSQL)                 │  │
        │  │                          │  │
        │  │  ├─ events/              │  │
        │  │  │  ├─ attendees/        │  │
        │  │  │  └─ usage/            │  │
        │  │  └─ expenses/            │  │
        │  └──────────────────────────┘  │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │  Security Rules          │  │
        │  │  (Auth Required)         │  │
        │  └──────────────────────────┘  │
        └─────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.svelte                          │
│                    (Root Component)                         │
│                                                             │
│  ┌──────────────┐  ┌─────────────────────────────────┐   │
│  │ Auth Check   │  │      Navigation Bar              │   │
│  │ & Login UI   │  │  Dashboard | Events | Expenses   │   │
│  └──────────────┘  │  | Inventory | Logout            │   │
│                    └─────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Current View (Conditional)             │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │          Dashboard.svelte                    │  │  │
│  │  │  • Stats Cards                               │  │  │
│  │  │  • Recent Events                             │  │  │
│  │  │  • Inventory Summary                         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │          EventsList.svelte                   │  │  │
│  │  │  • All Events Grid                           │  │  │
│  │  │  • Create Event Modal                        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │          EventDetails.svelte                 │  │  │
│  │  │  • Event Info                                │  │  │
│  │  │  • Financial Summary                         │  │  │
│  │  │  • Attendees Table                           │  │  │
│  │  │  • Usage Table                               │  │  │
│  │  │  • Add Attendee/Usage Modals                 │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │          ExpensesPage.svelte                 │  │  │
│  │  │  • Expenses Table                            │  │  │
│  │  │  • Add/Edit Expense Modal                    │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │          InventoryPage.svelte                │  │  │
│  │  │  • Inventory Table                           │  │  │
│  │  │  • Usage History Modal                       │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       Service Layer                           │
│                   (Business Logic + Data)                     │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ eventService.js │  │attendeeService  │                   │
│  │                 │  │      .js        │                   │
│  │ • createEvent   │  │ • addAttendee   │                   │
│  │ • updateEvent   │  │ • updateAttendee│                   │
│  │ • deleteEvent   │  │ • deleteAttendee│                   │
│  │ • getEvent      │  │ • getAttendees  │                   │
│  │ • getAllEvents  │  │ • getTotalCol.  │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────▼────────┐  ┌───────▼─────────┐                   │
│  │expenseService.js│  │usageService.js  │                   │
│  │                 │  │                 │                   │
│  │ • createExpense │  │ • addUsage      │                   │
│  │ • updateExpense │  │ • getUsageByEvt │                   │
│  │ • deleteExpense │  │ • getUsageByItem│                   │
│  │ • getAllExpenses│  │ • getAllUsage   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────▼──────────┐  ┌──────▼─────────────┐              │
│  │inventoryService   │  │reportingService.js │              │
│  │      .js          │  │                    │              │
│  │ • buildInventory  │  │ • calcEventCost    │              │
│  │ • getInventoryItem│  │ • calcEventProfit  │              │
│  │ • validateUsage   │  │ • calcGlobalFunds  │              │
│  └───────────────────┘  │ • getEventSummary  │              │
│                         └────────────────────┘              │
│                                                               │
│  All Services Use ↓                                          │
│  ┌──────────────────────────────────────────┐               │
│  │           firebase.js                     │               │
│  │  • Firebase App Instance                  │               │
│  │  • Firestore DB Instance                  │               │
│  │  • Auth Instance                          │               │
│  └──────────────────────────────────────────┘               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating an Event and Tracking Usage

```
┌────────────────────────────────────────────────────────────────┐
│                    USER ACTION FLOW                            │
└────────────────────────────────────────────────────────────────┘

1. CREATE EVENT
   ┌──────────────┐
   │ User clicks  │
   │"Create Event"│
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ EventsList.svelte│ ──► User fills form
   │ (Modal opens)    │     (name, date, price)
   └──────┬───────────┘
          │ Submit
          ▼
   ┌──────────────────┐
   │ eventService.js  │ ──► createEvent(data)
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │  Firebase        │ ──► addDoc(eventsCollection)
   │  Firestore       │
   └──────┬───────────┘
          │ Success
          ▼
   ┌──────────────────┐
   │ UI Updates       │ ──► New event appears
   └──────────────────┘

2. ADD EXPENSE
   ┌──────────────┐
   │ User goes to │
   │Expenses Page │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ExpensesPage.svelte│──► Clicks "Add Expense"
   │ (Modal opens)     │    Fills: name, cost, qty,
   └──────┬────────────┘    type (consumable), event
          │ Submit
          ▼
   ┌──────────────────┐
   │expenseService.js │ ──► createExpense(data)
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │  Firestore       │ ──► expenses/{id} created
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │inventoryService  │ ──► Automatically includes
   │ .buildInventory()│     in inventory calculations
   └──────────────────┘

3. ADD ATTENDEES
   ┌──────────────┐
   │ User opens   │
   │Event Details │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │EventDetails.svelte│──► Clicks "Add Attendee"
   │                   │    Fills: name, paid amount
   └──────┬────────────┘
          │ Submit
          ▼
   ┌──────────────────┐
   │attendeeService.js│ ──► addAttendee(eventId, data)
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │  Firestore       │ ──► events/{id}/attendees/{id}
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │reportingService  │ ──► getTotalCollected()
   │                  │     calculates revenue
   └──────────────────┘

4. RECORD USAGE
   ┌──────────────┐
   │ User in      │
   │Event Details │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │EventDetails.svelte│──► Clicks "Add Usage"
   │                   │    Selects item, enters qty
   └──────┬────────────┘
          │ Validate
          ▼
   ┌──────────────────┐
   │inventoryService  │ ──► validateUsage(item, qty)
   │                  │     ✓ Check remaining > qty
   └──────┬───────────┘
          │ Valid
          ▼
   ┌──────────────────┐
   │usageService.js   │ ──► addUsage(eventId, data)
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │  Firestore       │ ──► events/{id}/usage/{id}
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │reportingService  │ ──► calcEventCost()
   │                  │     calcEventProfit()
   │                  │     Updates profit display
   └──────────────────┘

5. VIEW REPORTS
   ┌──────────────┐
   │ User views   │
   │ Dashboard    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │Dashboard.svelte  │ ──► onMount: load data
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │    Multiple Service Calls             │
   │  • getAllEvents()                     │
   │  • buildInventory()                   │
   │  • calcGlobalLeftoverFunds()          │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────┐
   │  Parallel reads  │ ──► All from Firestore
   │  from Firestore  │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Calculations     │ ──► All done in browser
   │ (Client-side)    │     No server needed
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Display Results  │ ──► Stats update
   │                  │     Tables populate
   └──────────────────┘
```

## Calculation Flow: How Profit is Determined

```
┌──────────────────────────────────────────────────────────┐
│            PROFIT CALCULATION FLOW                       │
└──────────────────────────────────────────────────────────┘

Step 1: Build Inventory
┌─────────────────────────────────────────────┐
│ All Expenses → Group by Item Name           │
│                                             │
│ Popcorn Expense 1: $15, 50 qty             │
│ Popcorn Expense 2: $10, 30 qty             │
│ ────────────────────────────────            │
│ Total: $25 for 80 servings                 │
│ Cost per unit: $0.3125                     │
└───────────────┬─────────────────────────────┘
                │
Step 2: Get Event Revenue
                ▼
┌─────────────────────────────────────────────┐
│ All Attendees for Event                     │
│                                             │
│ Alice paid: $12                             │
│ Bob paid: $12                               │
│ Carol paid: $10                             │
│ ──────────────                              │
│ Total Revenue: $34                          │
└───────────────┬─────────────────────────────┘
                │
Step 3: Calculate Usage Cost
                ▼
┌─────────────────────────────────────────────┐
│ All Usage Records for Event                 │
│                                             │
│ Popcorn: 25 servings used                   │
│ Cost: 25 × $0.3125 = $7.81                 │
│                                             │
│ Cups: 30 used                               │
│ Cost: 30 × $0.08 = $2.40                   │
│ ──────────────                              │
│ Total Cost: $10.21                          │
└───────────────┬─────────────────────────────┘
                │
Step 4: Calculate Profit
                ▼
┌─────────────────────────────────────────────┐
│ Event Financials                            │
│                                             │
│ Revenue: $34.00                             │
│ Cost:    $10.21                             │
│ ──────────────                              │
│ Profit:  $23.79 ✅                          │
└─────────────────────────────────────────────┘

Step 5: Update Global Funds
┌─────────────────────────────────────────────┐
│ All Events                                  │
│                                             │
│ Event 1 Profit: $23.79                      │
│ Event 2 Profit: $31.50                      │
│ Event 3 Profit: -$5.00 (loss)              │
│ ──────────────                              │
│ Global Leftover: $50.29                     │
└─────────────────────────────────────────────┘
```

## Deployment Flow

```
┌────────────────────────────────────────────────────────┐
│               DEPLOYMENT PROCESS                       │
└────────────────────────────────────────────────────────┘

Local Development
┌──────────────┐
│ bun run dev  │ ──► Vite Dev Server
└──────┬───────┘     (Hot reload, fast refresh)
       │
       ▼
┌──────────────────┐
│ localhost:5173   │
└──────────────────┘

Production Build
┌──────────────┐
│ bun run build│
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Vite Build Process                     │
│ • Compile Svelte → JavaScript          │
│ • Bundle all modules                   │
│ • Minify code                          │
│ • Optimize assets                      │
│ • Generate dist/ folder                │
└──────┬─────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ dist/ folder     │ ──► Ready for hosting
│ • index.html     │
│ • assets/        │
│ • *.js (bundled) │
└──────────────────┘

GitHub Pages Deployment
┌──────────────────┐
│ git push origin  │
│      main        │
└──────┬───────────┘
       │ Triggers
       ▼
┌────────────────────────────────────────┐
│ GitHub Actions Workflow                │
│ (.github/workflows/deploy.yml)         │
│                                        │
│ 1. Checkout code                       │
│ 2. Setup Bun                           │
│ 3. Install dependencies                │
│ 4. Build (with env variables)          │
│ 5. Upload dist/ as artifact            │
│ 6. Deploy to GitHub Pages              │
└──────┬─────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ GitHub Pages                           │
│ https://username.github.io/repo-name/  │
│ • Static hosting                       │
│ • HTTPS enabled                        │
│ • CDN distributed                      │
└────────────────────────────────────────┘
```

---

**Architecture Notes:**
- **SPA (Single Page Application)**: All routing handled client-side
- **Serverless**: No backend server needed, Firebase handles everything
- **Static Hosting**: Deployed as static files, very fast
- **Real-time**: Changes sync through Firebase in real-time
- **Scalable**: Firebase handles scaling automatically
- **Secure**: Authentication + Firestore rules protect data
