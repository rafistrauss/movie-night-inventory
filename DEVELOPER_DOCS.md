# Movie Night Budget + Inventory Tracker - Developer Documentation

## Project Overview

A comprehensive web application for managing movie night events with complete budget tracking, inventory management, and financial reporting.

## Architecture

### Frontend
- **Framework**: Svelte 4
- **Build Tool**: Vite
- **Package Manager**: Bun
- **Linter**: Oxlint
- **Styling**: Component-scoped CSS

### Backend
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication (Email/Password)
- **Hosting**: GitHub Pages (Static Site)

## Data Model

### Collections Structure

```
events/
  ├── {eventId}/
  │   ├── name: string
  │   ├── date: timestamp
  │   ├── ticketPrice: number
  │   ├── notes: string
  │   ├── attendees/
  │   │   └── {attendeeId}/
  │   │       ├── name: string
  │   │       ├── paidAmount: number
  │   │       ├── paymentMethod: string
  │   │       ├── checkedIn: boolean
  │   │       └── notes: string
  │   └── usage/
  │       └── {usageId}/
  │           ├── itemName: string
  │           └── quantityUsed: number

expenses/
  └── {expenseId}/
      ├── name: string
      ├── category: string
      ├── cost: number
      ├── quantityPurchased: number
      ├── reusableType: 'reusable' | 'consumable'
      ├── eventId: string
      └── notes: string
```

## Key Features

### 1. Event Management
- Create, view, edit, and delete events
- Set ticket prices per event
- Track event dates and notes
- View profit/loss per event

### 2. Attendee Tracking
- Add attendees to each event
- Track payment amounts and methods
- Mark attendance (check-in)
- Calculate total revenue per event

### 3. Expense Management
- Log all purchases with quantities
- Categorize as reusable or consumable
- Link expenses to specific events
- Track total costs

### 4. Inventory System
- Automatic inventory building from expenses
- Track initial quantities and remaining stock
- Calculate cost per unit
- Usage tracking across events
- Low stock warnings
- Reusable vs consumable item handling

### 5. Financial Reporting
- Event-level profit/loss calculations
- Global leftover funds tracking
- Cost breakdown by item
- Cost allocation based on actual usage

## Core Business Logic

### Inventory Calculations

```javascript
// For consumable items
initialQuantity = SUM(quantityPurchased) across all expenses for that item
quantityUsed = SUM(quantityUsed) across all usage records
remainingQuantity = initialQuantity - quantityUsed
costPerUnit = totalCost / initialQuantity

// For reusable items
remainingQuantity = "N/A" (does not deplete)
```

### Event Profit Calculation

```javascript
revenue = SUM(attendee.paidAmount) for event
cost = SUM(usage.quantityUsed × item.costPerUnit) for event
profit = revenue - cost
```

### Global Leftover Funds

```javascript
leftoverFunds = SUM(eventProfit) across all events
```

## Component Structure

### App.svelte
- Main application container
- Authentication handling
- Route management
- Navigation bar

### Dashboard.svelte
- Overview of all data
- Recent events list
- Key statistics
- Inventory summary

### EventsList.svelte
- List all events
- Create new events
- Delete events
- Navigate to event details

### EventDetails.svelte
- Complete event information
- Attendee management
- Inventory usage tracking
- Financial summary and breakdown

### ExpensesPage.svelte
- List all expenses
- Add/edit/delete expenses
- Link to events
- Categorization

### InventoryPage.svelte
- Current inventory state
- Stock levels
- Usage history
- Cost information

## Service Layer

### eventService.js
- CRUD operations for events
- Firestore queries and mutations

### attendeeService.js
- Attendee management
- Revenue calculations

### expenseService.js
- Expense tracking
- Event-based queries

### usageService.js
- Usage logging
- Cross-event usage aggregation

### inventoryService.js
- Inventory building from expenses
- Stock validation
- Remaining quantity calculations

### reportingService.js
- Financial calculations
- Profit/loss analysis
- Cost breakdowns

## Security

### Firestore Rules
- All operations require authentication
- Read/write access restricted to authenticated users
- Atomic operations to prevent race conditions

### Authentication
- Email/password authentication
- Session management via Firebase Auth
- Protected routes in frontend

## Deployment

### GitHub Actions Workflow
1. Checkout code
2. Setup Bun runtime
3. Install dependencies
4. Build application with environment variables
5. Upload to GitHub Pages
6. Deploy

### Environment Variables
Required for both local development and production:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Development Workflow

### Local Development
```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

### Testing the Application
1. Set up Firebase project
2. Configure `.env` file
3. Create test user in Firebase Console
4. Run development server
5. Log in with test credentials
6. Create sample events and expenses

## Future Enhancements

### Potential Features
- Multi-user support with roles (admin, organizer, viewer)
- Depreciation tracking for reusable items
- Suggested ticket pricing based on expected costs
- Export reports to PDF/CSV
- Email notifications for low stock
- Recurring event templates
- Mobile-responsive improvements
- Dark mode
- Offline support with service workers
- Barcode scanning for inventory
- Integration with payment processors

### Performance Optimizations
- Implement caching layer
- Add pagination for large datasets
- Optimize Firestore queries with indexes
- Lazy load components
- Implement virtual scrolling for large lists

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure all environment variables are set
- Check Firebase configuration
- Verify Bun is installed correctly

**Authentication Issues**
- Verify Firebase Auth is enabled
- Check user exists in Firebase Console
- Ensure correct credentials

**Inventory Calculation Issues**
- Verify expense data is correct
- Check usage records are properly linked
- Ensure reusableType is set correctly

**Deployment Failures**
- Verify GitHub secrets are configured
- Check GitHub Pages is enabled
- Review workflow logs for errors

## Contributing

### Code Style
- Use Svelte conventions
- Follow component-scoped styling
- Write descriptive commit messages
- Add comments for complex logic

### Testing
- Test all CRUD operations
- Verify calculations are accurate
- Check edge cases (negative inventory, etc.)
- Test authentication flows

## License

This project is provided as-is for educational and personal use.
