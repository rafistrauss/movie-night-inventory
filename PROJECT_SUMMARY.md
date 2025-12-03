# 🎬 Movie Night Budget + Inventory Tracker

## Project Summary

A complete web application for managing movie night events with sophisticated budget tracking, inventory management, and financial reporting capabilities. Built with Svelte, Firebase, and designed for GitHub Pages deployment.

## ✨ Key Features

### 📅 Event Management
- Create and manage multiple movie night events
- Set individual ticket prices per event
- Track dates and event-specific notes
- Quick navigation to event details

### 👥 Attendee Tracking
- Add attendees with payment information
- Support multiple payment methods (Cash, Venmo, PayPal, etc.)
- Check-in functionality for attendance tracking
- Automatic revenue calculation per event
- Partial payment support with notes

### 💰 Expense Management
- Log all purchases with detailed information
- Categorize expenses (Snacks, Drinks, Equipment, etc.)
- Support for both consumable and reusable items
- Link expenses to specific events
- Edit and delete expense records

### 📦 Smart Inventory System
- **Automatic inventory building** from logged expenses
- **Real-time stock tracking** across all events
- **Cost per unit calculations** for accurate event costing
- **Usage validation** to prevent negative inventory
- **Low stock warnings** for timely restocking
- **Separate handling** for reusable vs. consumable items
- **Usage history** per item with event details

### 📊 Financial Reporting
- **Per-event profit/loss** calculations
- **Detailed cost breakdowns** by item
- **Global leftover funds** tracking across all events
- **Revenue vs. cost** comparisons
- **Cost allocation** based on actual usage (not purchase)

### 🔐 Security
- Firebase Authentication (Email/Password)
- Secure Firestore database rules
- Protected routes and data access
- Environment-based configuration

## 🏗️ Technical Architecture

### Frontend Stack
- **Svelte 4** - Reactive UI framework
- **Vite** - Fast build tool and dev server
- **Component-scoped CSS** - Modular styling
- **No external CSS frameworks** - Lightweight and custom

### Backend Stack
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User management
- **Cloud-hosted** - No server maintenance needed

### Development Tools
- **Bun** - Fast JavaScript runtime and package manager
- **Oxlint** - Blazing fast linter
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Free static hosting

## 📁 Project Structure

```
movie-night-inventory-claude/
├── src/
│   ├── components/          # Svelte components
│   │   ├── Dashboard.svelte
│   │   ├── EventsList.svelte
│   │   ├── EventDetails.svelte
│   │   ├── ExpensesPage.svelte
│   │   └── InventoryPage.svelte
│   ├── services/            # Business logic layer
│   │   ├── eventService.js
│   │   ├── attendeeService.js
│   │   ├── expenseService.js
│   │   ├── usageService.js
│   │   ├── inventoryService.js
│   │   └── reportingService.js
│   ├── styles/
│   │   └── global.css
│   ├── firebase.js          # Firebase configuration
│   ├── App.svelte          # Main app component
│   └── main.js             # Application entry point
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment
├── firestore.rules          # Database security rules
├── package.json            # Dependencies and scripts
├── vite.config.js          # Build configuration
├── svelte.config.js        # Svelte configuration
├── .env.example            # Environment template
├── .gitignore
├── README.md
├── QUICK_START.md          # Getting started guide
├── SETUP.md                # Configuration instructions
├── DEVELOPER_DOCS.md       # Technical documentation
└── WORKFLOW_GUIDE.md       # Usage examples
```

## 🚀 Getting Started

### Quick Setup
1. Clone repository
2. Install Bun: `curl -fsSL https://bun.sh/install | bash`
3. Install dependencies: `bun install`
4. Configure Firebase (see SETUP.md)
5. Create `.env` file with Firebase credentials
6. Run: `bun run dev`
7. Open: `http://localhost:5173`

### Detailed Instructions
See `QUICK_START.md` for comprehensive setup guide

## 📖 Documentation

- **QUICK_START.md** - Step-by-step setup and first use
- **SETUP.md** - Firebase and deployment configuration
- **DEVELOPER_DOCS.md** - Technical architecture and API reference
- **WORKFLOW_GUIDE.md** - Example scenarios and best practices

## 🎯 Core Functionality

### How Inventory Works

```javascript
// Consumable Items (e.g., Popcorn)
Purchase: $15 for 50 servings
→ Add expense: cost=$15, quantity=50, type=consumable
→ Cost per unit: $0.30

Event 1 uses 30 servings
→ Add usage: quantity=30
→ Event cost: 30 × $0.30 = $9.00
→ Remaining: 20 servings

Event 2 uses 20 servings
→ Add usage: quantity=20
→ Event cost: 20 × $0.30 = $6.00
→ Remaining: 0 servings (need to restock!)
```

### How Profit Is Calculated

```javascript
Event Revenue = SUM(all attendee payments)
Event Cost = SUM(usage × cost-per-unit for each item)
Event Profit = Revenue - Cost

Global Leftover Funds = SUM(all event profits)
```

## 💡 Key Features Explained

### 1. Cost Allocation Based on Usage
Unlike simple expense tracking, this system allocates costs **only for what was actually used**, not the full purchase price. This gives accurate per-event costs.

### 2. Inventory Persistence
Unused inventory automatically rolls over to future events. Buy once, track across multiple events.

### 3. Validation System
Prevents recording usage that exceeds available inventory, alerting users to restock needs.

### 4. Flexible Pricing
Each event can have its own ticket price, supporting different event types or pricing strategies.

### 5. Real-time Calculations
All financial metrics update automatically as you log attendees, expenses, and usage.

## 🔮 Future Enhancements

### Planned Features
- **Depreciation tracking** for reusable items
- **Suggested pricing** based on expected costs
- **Report exports** (PDF, CSV)
- **Multi-user support** with roles
- **Email notifications** for low stock
- **Recurring event templates**
- **Mobile app** version
- **QR code check-in**
- **Payment processor integration**

### Performance Improvements
- Query optimization with Firestore indexes
- Pagination for large datasets
- Caching layer for frequently accessed data
- Progressive Web App (PWA) capabilities

## 🧪 Testing Recommendations

### Manual Testing Checklist
- [ ] Create multiple events
- [ ] Add various expense types
- [ ] Log attendees with different payment amounts
- [ ] Record inventory usage
- [ ] Verify profit/loss calculations
- [ ] Check inventory remaining quantities
- [ ] Test low stock warnings
- [ ] Validate negative inventory prevention
- [ ] Test authentication flow
- [ ] Verify data persistence

### Test Scenarios
1. **Basic Flow**: Create event → Add expense → Add attendee → Record usage → Verify profit
2. **Multi-Event**: Track inventory across 3+ events
3. **Edge Cases**: Partial payments, zero usage, all inventory depleted
4. **Reusable Items**: Verify they don't deplete
5. **Financial Accuracy**: Manual calculation vs. app calculation

## 🛠️ Development Commands

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run linter
bun run lint
```

## 📦 Deployment

### GitHub Pages (Included)
- Automatic deployment via GitHub Actions
- Triggers on push to main branch
- Environment variables via GitHub Secrets
- Static site hosting (free)

### Alternative Hosting
Compatible with:
- Vercel
- Netlify
- Firebase Hosting
- Any static host

## 🔒 Security Considerations

### Firebase Rules
- All operations require authentication
- Write access restricted to authenticated users
- Subcollections inherit parent permissions

### Environment Variables
- Never commit `.env` to repository
- Use GitHub Secrets for deployment
- Rotate Firebase API keys if exposed

### Data Privacy
- User data stored in Firebase (GDPR compliant)
- No third-party analytics (optional to add)
- Authentication via Firebase (secure)

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Style
- Follow Svelte conventions
- Use descriptive variable names
- Add comments for complex logic
- Keep components focused and reusable

## 📄 License

This project is provided as-is for educational and personal use. Feel free to modify and adapt for your needs.

## 🙏 Acknowledgments

Built with:
- Svelte - Reactive UI framework
- Firebase - Backend infrastructure
- Bun - Fast JavaScript runtime
- Vite - Lightning-fast build tool
- GitHub - Version control and hosting

## 📞 Support

For issues, questions, or feature requests:
1. Check documentation files (QUICK_START.md, SETUP.md, etc.)
2. Review DEVELOPER_DOCS.md for technical details
3. Check Firebase Console for database/auth status
4. Review GitHub Actions logs for deployment issues

## 🎉 Success Stories

This system is perfect for:
- Community movie night organizers
- School film clubs
- Outdoor cinema operators
- Private movie events
- Film festival organizers
- Any group event with budget tracking needs

---

**Built with ❤️ for movie night enthusiasts**

Start tracking your events today and never wonder where your budget went! 🍿🎬
