# Changelog

All notable changes to the Movie Night Budget + Inventory Tracker project will be documented in this file.

## [1.0.0] - 2025-12-02

### Initial Release

#### 🎉 Core Features Added
- **Event Management System**
  - Create, view, edit, and delete movie night events
  - Set custom ticket prices per event
  - Track event dates and notes
  
- **Attendee Tracking**
  - Add attendees to events with payment details
  - Support multiple payment methods
  - Check-in/attendance marking functionality
  - Automatic revenue calculation
  
- **Expense Management**
  - Log purchases with detailed information
  - Categorize expenses by type
  - Support for consumable and reusable items
  - Link expenses to specific events
  
- **Smart Inventory System**
  - Automatic inventory building from expenses
  - Real-time stock level tracking
  - Cost per unit calculations
  - Usage validation to prevent negative inventory
  - Low stock warnings (< 10 units)
  - Separate handling for reusable vs. consumable items
  
- **Financial Reporting**
  - Per-event profit/loss calculations
  - Detailed cost breakdowns by item
  - Global leftover funds tracking
  - Revenue vs. cost analysis
  - Cost allocation based on actual usage

#### 🔐 Security Features
- Firebase Authentication (Email/Password)
- Firestore security rules
- Environment-based configuration
- Protected routes and data access

#### 🛠️ Technical Implementation
- **Frontend**: Svelte 4 with Vite
- **Backend**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Package Manager**: Bun
- **Linter**: Oxlint
- **Deployment**: GitHub Actions to GitHub Pages

#### 📦 Components
- `Dashboard.svelte` - Main overview with statistics
- `EventsList.svelte` - Event listing and creation
- `EventDetails.svelte` - Individual event management
- `ExpensesPage.svelte` - Expense tracking
- `InventoryPage.svelte` - Inventory management

#### 🔧 Services
- `eventService.js` - Event CRUD operations
- `attendeeService.js` - Attendee management
- `expenseService.js` - Expense tracking
- `usageService.js` - Usage logging
- `inventoryService.js` - Inventory calculations
- `reportingService.js` - Financial reporting

#### 📚 Documentation
- `README.md` - Project overview and quick start
- `QUICK_START.md` - Detailed setup guide
- `SETUP.md` - Configuration instructions
- `WORKFLOW_GUIDE.md` - Usage examples and best practices
- `DEVELOPER_DOCS.md` - Technical architecture
- `PROJECT_SUMMARY.md` - Comprehensive overview
- `FILE_MANIFEST.md` - Complete file structure reference

#### 🚀 Deployment
- GitHub Actions workflow for automated deployment
- GitHub Pages configuration
- Environment variable support via secrets

#### 🎨 UI/UX
- Clean, modern interface
- Responsive design
- Modal dialogs for forms
- Color-coded status indicators
- Intuitive navigation
- Real-time updates

### Technical Details

#### Dependencies
**Production:**
- `firebase@^10.7.2` - Backend services

**Development:**
- `svelte@^4.2.8` - UI framework
- `vite@^5.0.11` - Build tool
- `@sveltejs/vite-plugin-svelte@^3.0.1` - Svelte integration
- `oxlint@^0.12.0` - Linting

#### File Structure
```
30+ files created
~4,500+ lines of code
5 UI components
6 business logic modules
6 documentation files
```

#### Key Algorithms
- **Inventory Calculation**: Aggregates expenses, tracks usage, computes remaining
- **Cost Allocation**: Per-unit pricing based on actual usage
- **Profit Calculation**: Revenue minus allocated costs per event
- **Stock Validation**: Prevents usage exceeding available inventory

### Known Limitations
- No multi-user support (single account)
- No depreciation tracking for reusable items
- Manual user creation required in Firebase Console
- No automated testing suite
- Basic authentication (no password reset, email verification)

### Future Roadmap
See `DEVELOPER_DOCS.md` for planned enhancements including:
- Multi-user support with roles
- Depreciation tracking
- Automated pricing suggestions
- Report exports (PDF/CSV)
- Mobile app version
- QR code check-in
- Payment processor integration

---

## Version History

### [1.0.0] - December 2, 2025
- Initial release with full feature set
- Complete documentation
- Automated deployment configured

---

## How to Update This Changelog

When making changes to the project:

1. Add new entry under "Unreleased" section
2. Categorize changes:
   - **Added** for new features
   - **Changed** for changes in existing functionality
   - **Deprecated** for soon-to-be removed features
   - **Removed** for now removed features
   - **Fixed** for any bug fixes
   - **Security** for vulnerability fixes
3. Move to new version when releasing
4. Use date format: YYYY-MM-DD

## Format Guide

```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Change description

### Fixed
- Bug fix description
```

---

**Project Status**: ✅ Production Ready
**Last Updated**: December 2, 2025
**Maintainer**: GitHub Copilot
**License**: Educational/Personal Use
