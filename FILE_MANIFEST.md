# Project File Manifest

## Complete File Structure

```
movie-night-inventory-claude/
│
├── Configuration Files
│   ├── package.json                 # Dependencies, scripts, project metadata
│   ├── vite.config.js              # Vite build configuration
│   ├── svelte.config.js            # Svelte preprocessor config
│   ├── .gitignore                  # Git ignore patterns
│   ├── .env.example                # Environment variable template
│   └── firestore.rules             # Firestore security rules
│
├── Documentation
│   ├── README.md                   # Main project readme
│   ├── QUICK_START.md              # Getting started guide
│   ├── SETUP.md                    # Configuration instructions
│   ├── WORKFLOW_GUIDE.md           # Usage examples and workflows
│   ├── DEVELOPER_DOCS.md           # Technical documentation
│   ├── PROJECT_SUMMARY.md          # Comprehensive overview
│   └── FILE_MANIFEST.md            # This file
│
├── GitHub Configuration
│   └── .github/
│       └── workflows/
│           └── deploy.yml          # GitHub Actions deployment workflow
│
├── Application Entry Points
│   ├── index.html                  # HTML entry point
│   └── src/
│       ├── main.js                 # JavaScript entry point
│       └── App.svelte              # Root Svelte component
│
├── UI Components (src/components/)
│   ├── Dashboard.svelte            # Main dashboard with stats
│   ├── EventsList.svelte           # Events listing and creation
│   ├── EventDetails.svelte         # Individual event details
│   ├── ExpensesPage.svelte         # Expense management
│   └── InventoryPage.svelte        # Inventory tracking
│
├── Business Logic (src/services/)
│   ├── eventService.js             # Event CRUD operations
│   ├── attendeeService.js          # Attendee management
│   ├── expenseService.js           # Expense tracking
│   ├── usageService.js             # Usage logging
│   ├── inventoryService.js         # Inventory calculations
│   └── reportingService.js         # Financial reporting
│
├── Configuration (src/)
│   ├── firebase.js                 # Firebase initialization
│   └── styles/
│       └── global.css              # Global styles
│
└── Build Output (generated)
    └── dist/                       # Production build (not in repo)
        ├── index.html
        ├── assets/
        └── ...
```

## File Descriptions

### Root Configuration Files

#### `package.json`
- Project metadata and dependencies
- Defines scripts: dev, build, preview, lint
- Lists dependencies: Svelte, Firebase, Vite
- Dev dependencies: Oxlint, Vite plugin

#### `vite.config.js`
- Vite build tool configuration
- Svelte plugin setup
- Base path for GitHub Pages deployment
- Build output directory configuration

#### `svelte.config.js`
- Svelte preprocessor configuration
- Enables Vite preprocessing for Svelte components

#### `.gitignore`
- Excludes node_modules, dist, .env files
- Standard patterns for Node.js projects

#### `.env.example`
- Template for environment variables
- Shows required Firebase configuration keys
- Copy to `.env` for local development

#### `firestore.rules`
- Firebase security rules
- Requires authentication for all operations
- Protects events, attendees, usage, expenses, inventory

### Documentation Files

#### `README.md`
- Main project overview
- Quick start instructions
- Links to detailed documentation
- Tech stack summary

#### `QUICK_START.md`
- Step-by-step setup guide
- Firebase configuration walkthrough
- First user creation
- Basic usage instructions
- Deployment guide

#### `SETUP.md`
- Detailed Firebase setup
- Environment variable configuration
- GitHub secrets for deployment
- Security rules deployment

#### `WORKFLOW_GUIDE.md`
- Complete usage examples
- Multi-event scenarios
- Best practices
- Workflow checklists
- Example calculations

#### `DEVELOPER_DOCS.md`
- Technical architecture
- Data model details
- Business logic explanation
- Component structure
- API reference
- Security implementation

#### `PROJECT_SUMMARY.md`
- Comprehensive overview
- Feature list
- Use cases
- Future enhancements
- Testing recommendations

### GitHub Actions

#### `.github/workflows/deploy.yml`
- Automated deployment workflow
- Triggers on push to main branch
- Installs Bun, builds app, deploys to GitHub Pages
- Uses GitHub secrets for environment variables

### Application Files

#### `index.html`
- HTML entry point
- Loads main.js module
- Contains app mount point div

#### `src/main.js`
- JavaScript entry point
- Imports App.svelte and global CSS
- Initializes Svelte app
- Mounts to #app div

#### `src/App.svelte`
- Root Svelte component
- Authentication handling
- Navigation system
- Route management
- Main layout structure

#### `src/firebase.js`
- Firebase SDK initialization
- Firestore database instance
- Authentication instance
- Reads configuration from environment variables

### Components

#### `src/components/Dashboard.svelte`
**Purpose**: Main dashboard overview
**Features**:
- Total events count
- Global leftover funds display
- Inventory summary
- Recent events list
- Low stock alerts
- Navigation to other views

#### `src/components/EventsList.svelte`
**Purpose**: List and manage events
**Features**:
- Display all events
- Create new event modal
- Delete events
- Navigate to event details
- Date and price display

#### `src/components/EventDetails.svelte`
**Purpose**: Individual event management
**Features**:
- Event information display
- Financial summary (revenue, cost, profit)
- Cost breakdown by item
- Attendee management (add, edit, delete, check-in)
- Inventory usage tracking
- Back navigation

#### `src/components/ExpensesPage.svelte`
**Purpose**: Expense tracking and management
**Features**:
- List all expenses
- Add new expenses
- Edit existing expenses
- Delete expenses
- Categorization
- Type selection (reusable/consumable)
- Event linking

#### `src/components/InventoryPage.svelte`
**Purpose**: Inventory overview and tracking
**Features**:
- Display all inventory items
- Show quantities (initial, used, remaining)
- Cost per unit display
- Stock status indicators
- Usage history modal
- Event-based usage breakdown

### Services

#### `src/services/eventService.js`
**Purpose**: Event data management
**Functions**:
- `createEvent()` - Create new event
- `updateEvent()` - Update event details
- `deleteEvent()` - Remove event
- `getEvent()` - Fetch single event
- `getAllEvents()` - Fetch all events (ordered by date)

#### `src/services/attendeeService.js`
**Purpose**: Attendee management
**Functions**:
- `addAttendee()` - Add attendee to event
- `updateAttendee()` - Update attendee info
- `deleteAttendee()` - Remove attendee
- `getAttendees()` - Get all attendees for event
- `getTotalCollected()` - Calculate total revenue

#### `src/services/expenseService.js`
**Purpose**: Expense tracking
**Functions**:
- `createExpense()` - Log new expense
- `updateExpense()` - Update expense details
- `deleteExpense()` - Remove expense
- `getAllExpenses()` - Fetch all expenses
- `getExpensesByEvent()` - Filter by event

#### `src/services/usageService.js`
**Purpose**: Inventory usage logging
**Functions**:
- `addUsage()` - Log item usage for event
- `getUsageByEvent()` - Get usage records for event
- `getUsageByItem()` - Calculate total usage for item
- `getAllUsage()` - Fetch all usage records

#### `src/services/inventoryService.js`
**Purpose**: Inventory calculations
**Functions**:
- `buildInventory()` - Calculate current inventory state
- `getInventoryItem()` - Get specific item details
- `validateUsage()` - Check if usage is allowed
**Logic**:
- Aggregates expenses by item name
- Calculates remaining quantities
- Computes cost per unit
- Handles reusable vs consumable

#### `src/services/reportingService.js`
**Purpose**: Financial reporting and calculations
**Functions**:
- `calculateEventCost()` - Compute cost for event
- `calculateEventProfit()` - Revenue minus cost
- `calculateGlobalLeftoverFunds()` - Total profit across all events
- `getEventFinancialSummary()` - Detailed breakdown
**Logic**:
- Cost allocation based on actual usage
- Per-unit cost from inventory
- Profit/loss calculations

### Styles

#### `src/styles/global.css`
- Global CSS reset
- Box-sizing border-box
- Font inheritance for form elements

## Data Flow

```
1. User Action (UI Component)
   ↓
2. Service Function (Business Logic)
   ↓
3. Firebase Operation (Database)
   ↓
4. Data Return
   ↓
5. UI Update (Svelte Reactivity)
```

## Build Process

```
1. Source Files (src/*)
   ↓
2. Vite Build (vite build)
   ↓
3. Svelte Compilation
   ↓
4. Asset Optimization
   ↓
5. Output to dist/
   ↓
6. Deploy to GitHub Pages
```

## Environment Variables

Required in `.env` file:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## Dependencies

### Production
- `firebase` - Backend services
- No other runtime dependencies (Svelte compiles away)

### Development
- `svelte` - Component framework
- `vite` - Build tool
- `@sveltejs/vite-plugin-svelte` - Vite integration
- `oxlint` - Code linting

## Generated Files (Not in Repo)

- `node_modules/` - Installed dependencies
- `dist/` - Production build output
- `.env` - Local environment configuration
- `bun.lock` - Dependency lock file (in repo)

## Key Design Patterns

### Component Organization
- Each component is self-contained
- Services handle all business logic
- Firebase operations isolated in services
- No prop drilling (event dispatchers used)

### State Management
- Svelte reactive declarations
- Component-level state
- No global state library needed
- Data fetched on component mount

### Error Handling
- Try-catch in async operations
- User-friendly error messages
- Console logging for debugging
- Firebase errors caught and displayed

### Security
- All routes require authentication
- Firestore rules enforce auth
- Environment variables for sensitive data
- No API keys in code

## Testing Strategy

### Manual Testing
- Create, read, update, delete for all entities
- Financial calculations verification
- Inventory calculations accuracy
- Authentication flows
- Cross-event data integrity

### Recommended Test Cases
- Single event workflow
- Multi-event inventory tracking
- Edge cases (negative inventory, partial payments)
- Reusable vs consumable items
- Large datasets performance

## Deployment Checklist

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Authentication enabled
- [ ] First user created
- [ ] Local .env configured
- [ ] GitHub secrets added
- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] Base path in vite.config.js updated
- [ ] Deployment workflow run successfully

## Maintenance

### Regular Tasks
- Monitor Firebase usage (free tier limits)
- Review Firestore security rules
- Update dependencies
- Check GitHub Actions logs
- Rotate API keys if needed

### Backup Strategy
- Firestore automatic backups (Firebase feature)
- Export data periodically
- Keep Git history clean

## Future Development

### Planned File Additions
- `src/services/authService.js` - Enhanced auth
- `src/utils/` - Utility functions
- `src/components/shared/` - Reusable components
- `tests/` - Automated tests
- `docs/api/` - API documentation

### Potential New Components
- UserProfile.svelte
- Settings.svelte
- Reports.svelte
- Analytics.svelte
- ExportData.svelte

---

**Total Files**: 30+ (excluding node_modules)
**Lines of Code**: ~4,500+ (including documentation)
**Components**: 5 UI components
**Services**: 6 business logic modules
**Documentation**: 6 comprehensive guides

Last Updated: December 2, 2025
