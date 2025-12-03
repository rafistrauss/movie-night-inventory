# Movie Night Budget + Inventory Tracker - Quick Start Guide

## 🎬 Welcome!

This application helps you manage movie night events, track budgets, and maintain inventory efficiently.

## 📋 Prerequisites

Before you begin, you'll need:

1. **Bun** - JavaScript runtime and package manager
   - Install: `curl -fsSL https://bun.sh/install | bash`
   
2. **Firebase Account** - For database and authentication
   - Sign up at: https://firebase.google.com/
   
3. **GitHub Account** - For hosting (if deploying)
   - Sign up at: https://github.com/

## 🚀 Quick Setup (5 minutes)

### Step 1: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose a location
4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Enable "Email/Password" sign-in method
5. Get your configuration:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click "Web" icon (</>) to add web app
   - Copy the configuration values

### Step 2: Local Setup

1. **Clone or download this repository**

2. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

3. **Add your Firebase configuration** to `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Install dependencies**:
   ```bash
   bun install
   ```

5. **Create your first user** in Firebase Console:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Click "Add user"

6. **Start the development server**:
   ```bash
   bun run dev
   ```

7. **Open your browser** to `http://localhost:5173`

8. **Log in** with the credentials you created in step 5

## 📖 Using the Application

### Creating Your First Event

1. Click **"Events"** in the navigation
2. Click **"+ Create Event"**
3. Fill in:
   - Event Name (e.g., "Summer Movie Night")
   - Date
   - Ticket Price (e.g., 10.00)
   - Optional notes
4. Click **"Create Event"**

### Adding Expenses

1. Click **"Expenses"** in the navigation
2. Click **"+ Add Expense"**
3. Fill in:
   - Item Name (e.g., "Popcorn Kernels - 5lb bag")
   - Category (e.g., "Snacks")
   - Type: Choose "Consumable" or "Reusable"
     - **Consumable**: Items that get used up (popcorn, cups, napkins)
     - **Reusable**: Items that last (projector, speakers, chairs)
   - Cost (total purchase price)
   - Quantity Purchased (how many units/items)
   - Event (which event this was purchased for)
4. Click **"Add Expense"**

### Tracking Attendees

1. Go to an event's detail page
2. Click **"+ Add Attendee"**
3. Fill in:
   - Name
   - Amount Paid
   - Payment Method (Cash, Venmo, etc.)
   - Check "Checked In" if they attended
4. Click **"Add Attendee"**

### Recording Inventory Usage

1. Go to an event's detail page
2. Scroll to **"Inventory Usage"** section
3. Click **"+ Add Usage"**
4. Select item from dropdown
5. Enter quantity used for this event
6. Click **"Add Usage"**

The system will:
- Update remaining inventory
- Calculate cost for this event
- Show profit/loss

### Viewing Reports

**Dashboard**: Shows overall statistics
- Total events
- Leftover funds (profit across all events)
- Inventory items count
- Low stock warnings

**Event Details**: Shows per-event financials
- Revenue (total collected from attendees)
- Cost (calculated from inventory usage)
- Profit/Loss
- Detailed cost breakdown

**Inventory Page**: Shows current stock
- All items with quantities
- Remaining stock levels
- Cost per unit
- Usage history per item

## 💡 Tips & Best Practices

### Managing Consumables

**Example: Popcorn**
- Purchase: 5lb bag for $15 (makes approximately 50 servings)
- Add expense: Name="Popcorn", Cost=$15, Quantity=50, Type=Consumable
- At event: Add usage of 30 servings
- Remaining: 20 servings for next event
- Cost per event: 30 × $0.30 = $9.00

### Managing Reusables

**Example: Projector**
- Purchase: Projector for $300
- Add expense: Name="Projector", Cost=$300, Quantity=1, Type=Reusable
- The projector won't deplete across events
- (Future feature: depreciation tracking)

### Tracking Partial Payments

If someone pays less than ticket price:
- Add attendee with actual amount paid
- The system calculates revenue based on actual payments
- You can add notes to track who still owes

### Low Stock Alerts

- Items with less than 10 units show as **low stock** (orange/red)
- Check the Inventory page regularly
- Plan purchases before your next event

## 🌐 Deploying to GitHub Pages

### Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Make sure `.env` is in `.gitignore` (it already is)

### Step 2: Add Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **"New repository secret"**
4. Add each Firebase config value:
   - Name: `VITE_FIREBASE_API_KEY`, Value: your API key
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`, Value: your auth domain
   - (Repeat for all 6 Firebase variables)

### Step 3: Enable GitHub Pages

1. Go to **Settings** > **Pages**
2. Under "Build and deployment"
3. Source: **GitHub Actions**

### Step 4: Update Base Path

In `vite.config.js`, update the base path to match your repo name:
```javascript
base: '/your-repo-name/',
```

### Step 5: Deploy

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
bun install
```

### Login doesn't work
- Verify Firebase Auth is enabled
- Check user exists in Firebase Console
- Verify `.env` has correct configuration

### Inventory calculations seem wrong
- Check that expenses have correct quantities
- Verify usage records are properly saved
- Ensure reusableType is set correctly

### Build fails
- Check all environment variables are set
- Run `bun run lint` to check for code errors
- Verify Firebase configuration

## 📞 Getting Help

- Check `DEVELOPER_DOCS.md` for technical details
- Review `SETUP.md` for configuration details
- Check Firebase Console for database/auth status

## 🎉 You're Ready!

Start by creating your first event and adding some expenses. The inventory system will automatically track everything for you!

Happy movie nights! 🍿🎬
