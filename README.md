# 🎬 Movie Night Budget + Inventory Tracker

> A complete web application for managing movie night events with sophisticated budget tracking, inventory management, and financial reporting.

[![Built with Svelte](https://img.shields.io/badge/Built%20with-Svelte-FF3E00?style=flat&logo=svelte)](https://svelte.dev/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-000000?style=flat&logo=bun)](https://bun.sh/)

## ✨ Key Features

- 📅 **Event Management** - Create and track multiple movie nights
- 👥 **Attendee Tracking** - Log payments and attendance
- 💰 **Smart Expenses** - Track purchases with automatic inventory building
- 📦 **Inventory System** - Real-time stock tracking with usage validation
- 📊 **Financial Reports** - Profit/loss per event and global leftover funds
- 🔐 **Secure** - Firebase authentication and Firestore database

## 🚀 Quick Start

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Configure Firebase (copy .env.example to .env and add your credentials)
cp .env.example .env

# Start development server
bun run dev
```

**First time?** See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Complete setup guide (start here!)
- **[SETUP.md](SETUP.md)** - Firebase configuration and deployment
- **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** - Usage examples and best practices
- **[DEVELOPER_DOCS.md](DEVELOPER_DOCS.md)** - Technical architecture
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Comprehensive overview

## 💡 How It Works

### Smart Inventory Tracking
```
Purchase: Popcorn $15 for 50 servings
→ Event 1 uses 30 servings → Cost: $9.00 → Remaining: 20
→ Event 2 uses 20 servings → Cost: $6.00 → Remaining: 0
```

### Accurate Financial Reporting
```
Revenue (from attendees): $70.00
Cost (from actual usage): $19.90
Profit: $50.10 ✅
```

### Multi-Event Tracking
Inventory and funds automatically roll over between events!

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Svelte 4 + Vite |
| Backend | Firebase Firestore |
| Auth | Firebase Authentication |
| Runtime | Bun |
| Linter | Oxlint |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |

## 📦 Project Structure

```
src/
├── components/       # Svelte UI components
├── services/         # Business logic & Firebase
├── styles/          # Global styles
└── firebase.js      # Firebase config

.github/workflows/   # CI/CD automation
firestore.rules      # Database security
```

## 🎯 Core Capabilities

✅ Create unlimited events with custom ticket prices  
✅ Track attendees with flexible payment options  
✅ Log expenses as consumable or reusable items  
✅ Automatic inventory calculation from purchases  
✅ Real-time stock levels with low stock warnings  
✅ Usage validation to prevent negative inventory  
✅ Per-event profit/loss with detailed breakdowns  
✅ Global leftover funds tracking  
✅ Secure authentication and data protection  

## 🔧 Development

```bash
# Development server (with hot reload)
bun run dev

# Production build
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

## 🌐 Deployment

### GitHub Pages (Automatic)
1. Configure Firebase and add secrets to GitHub
2. Push to `main` branch
3. GitHub Actions builds and deploys automatically
4. Access at `https://username.github.io/repo-name/`

See [SETUP.md](SETUP.md) for detailed deployment instructions.

## 🎓 Example Use Cases

- Community outdoor movie nights
- School film clubs
- Private screening events
- Film festival management
- Any event with budget tracking needs

## 📊 What You Can Track

- **Events**: Multiple movie nights with dates and pricing
- **Revenue**: All ticket sales and payments
- **Expenses**: Purchases categorized by type
- **Inventory**: Current stock levels for all items
- **Usage**: What was consumed at each event
- **Profit/Loss**: Per event and cumulative
- **Attendees**: Who came and what they paid

## 🔒 Security

- Firebase Authentication (email/password)
- Firestore security rules (auth required)
- Environment-based configuration
- No secrets in code

## 🤝 Contributing

Contributions welcome! Please:
1. Check existing documentation
2. Follow code style conventions
3. Test thoroughly
4. Submit detailed pull requests

## 📄 License

Provided as-is for educational and personal use.

## 🙏 Built With

[Svelte](https://svelte.dev/) • [Firebase](https://firebase.google.com/) • [Bun](https://bun.sh/) • [Vite](https://vitejs.dev/)

---

**Ready to get started?** Head to [QUICK_START.md](QUICK_START.md) for step-by-step instructions! 🍿🎬
