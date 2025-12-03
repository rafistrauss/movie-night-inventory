# Movie Night Tracker - User Workflow Guide

## 📊 Typical Usage Workflow

### Before Your First Event

```
1. Set up Firebase
   └─> Create project
   └─> Enable Firestore
   └─> Enable Auth
   └─> Create first user

2. Configure Application
   └─> Add Firebase config to .env
   └─> Install dependencies
   └─> Start dev server
   └─> Log in

3. Create Event
   └─> Navigate to Events page
   └─> Click "+ Create Event"
   └─> Set name, date, ticket price
   └─> Save event
```

### Planning Phase (Before Event Day)

```
1. Purchase Supplies
   └─> Buy popcorn, drinks, snacks, etc.
   └─> Keep receipts

2. Add Expenses
   └─> Navigate to Expenses page
   └─> For each purchase:
       ├─> Item name
       ├─> Total cost
       ├─> Quantity purchased
       ├─> Type (consumable/reusable)
       └─> Link to event

3. Check Inventory
   └─> Navigate to Inventory page
   └─> Verify sufficient stock
   └─> Plan additional purchases if needed
```

### Event Day

```
1. Track Attendees
   └─> Go to Event Details
   └─> Add each attendee as they arrive:
       ├─> Name
       ├─> Amount paid
       ├─> Payment method
       └─> Check "Checked In"

2. During/After Event
   └─> Record Inventory Usage:
       ├─> Select items used
       ├─> Enter quantities
       └─> Save usage
```

### Post-Event Review

```
1. View Financial Summary
   └─> Event Details page shows:
       ├─> Total revenue (from attendees)
       ├─> Total cost (from inventory usage)
       ├─> Profit/Loss
       └─> Cost breakdown by item

2. Check Global Status
   └─> Dashboard shows:
       ├─> Total leftover funds
       ├─> Remaining inventory
       ├─> Low stock alerts
       └─> All event history
```

## 🎯 Example Scenario

### Summer Movie Night - Complete Walkthrough

#### Step 1: Create Event
```
Event Name: Summer Movie Night
Date: July 15, 2024
Ticket Price: $12.00
Notes: Showing "The Matrix" outdoors
```

#### Step 2: Purchase & Log Expenses

| Item | Category | Type | Cost | Quantity | Event |
|------|----------|------|------|----------|-------|
| Popcorn Kernels (5lb) | Snacks | Consumable | $15.00 | 50 servings | Summer Movie Night |
| Paper Cups (100ct) | Supplies | Consumable | $8.00 | 100 cups | Summer Movie Night |
| Soda (case of 24) | Drinks | Consumable | $12.00 | 24 cans | Summer Movie Night |
| Outdoor Screen | Equipment | Reusable | $300.00 | 1 unit | Summer Movie Night |

**Total Expenses: $335.00**

#### Step 3: Event Day - Add Attendees

| Name | Paid | Method | Checked In |
|------|------|--------|------------|
| Alice Johnson | $12.00 | Venmo | ✓ |
| Bob Smith | $12.00 | Cash | ✓ |
| Carol White | $12.00 | Cash | ✓ |
| Dave Brown | $10.00 | Venmo | ✓ |
| Eve Davis | $12.00 | PayPal | ✓ |
| Frank Miller | $12.00 | Cash | ✓ |

**Total Revenue: $70.00**

#### Step 4: Record Inventory Usage

| Item | Quantity Used |
|------|---------------|
| Popcorn Kernels | 25 servings |
| Paper Cups | 30 cups |
| Soda | 20 cans |
| Outdoor Screen | N/A (reusable) |

**Cost Calculation:**
- Popcorn: 25 × ($15.00 / 50) = $7.50
- Cups: 30 × ($8.00 / 100) = $2.40
- Soda: 20 × ($12.00 / 24) = $10.00
- Screen: $0 (reusable, not allocated per event)

**Total Event Cost: $19.90**

#### Step 5: Review Financials

**Event Summary:**
- Revenue: $70.00
- Cost: $19.90
- **Profit: $50.10** ✅

**Remaining Inventory:**
- Popcorn: 25 servings
- Cups: 70 cups
- Soda: 4 cans
- Screen: 1 unit (reusable)

#### Step 6: Plan Next Event

Based on remaining inventory:
- ✅ Popcorn: 25 servings (enough for ~25 people)
- ✅ Cups: 70 cups (plenty)
- ⚠️ Soda: 4 cans (need to restock!)
- ✅ Screen: Reusable (no repurchase needed)

**Action Items:**
- Purchase more soda for next event
- Current leftover funds: $50.10 (can cover new purchases)

## 🔄 Multi-Event Scenario

### Tracking Across 3 Events

#### Event 1: Summer Movie Night
- Revenue: $70.00
- Cost: $19.90
- Profit: $50.10
- **Leftover Funds: $50.10**

#### Event 2: Fall Film Festival (2 weeks later)
- Initial funds: $50.10
- New purchases: Soda refill $12.00
- Revenue: $84.00 (7 attendees × $12)
- Cost: $28.50 (used remaining inventory)
- Profit: $55.50
- **Leftover Funds: $105.60**

#### Event 3: Holiday Movie Marathon
- Initial funds: $105.60
- New purchases: Popcorn refill $15.00
- Revenue: $96.00 (8 attendees × $12)
- Cost: $25.00
- Profit: $71.00
- **Leftover Funds: $176.60**

### Dashboard View After 3 Events

```
Total Events: 3
Total Leftover Funds: $176.60
Total Revenue: $250.00
Total Costs: $73.40
Overall Profit: $176.60

Inventory Status:
✅ Popcorn: 15 servings remaining
✅ Cups: 40 cups remaining
⚠️ Soda: 8 cans remaining (low stock)
✅ Screen: 1 unit (reusable)
```

## 💰 Understanding Leftover Funds

### How It Works

Leftover funds accumulate across ALL events and represent your total profit.

**Formula:**
```
Leftover Funds = Σ(Event Revenue - Event Cost) for all events
```

### Use Cases for Leftover Funds

1. **Buffer for Future Events**
   - Cover expenses before collecting ticket payments
   
2. **Equipment Upgrades**
   - Save up for better projector, sound system, etc.
   
3. **Bulk Purchasing**
   - Buy supplies in bulk for better prices
   
4. **Emergency Fund**
   - Handle unexpected costs
   
5. **Profit Distribution**
   - If running as a group, split profits periodically

## 📈 Advanced Tracking

### Reusable Item Depreciation (Future Feature)

Currently, reusable items don't allocate costs per event. Future versions could implement:

```
Projector: $300 purchase
Expected lifespan: 30 events
Depreciation per event: $10
```

This would more accurately reflect true event costs.

### Partial Payment Tracking

If someone pays less than the ticket price:

```
Ticket Price: $12.00
Dave paid: $10.00
Difference: -$2.00

Track in notes: "Dave owes $2.00"
```

Revenue calculations use actual payments, so your profit reflects reality.

## 🎓 Best Practices

### 1. Log Everything Immediately
- Add expenses as soon as you purchase
- Log attendees as they arrive
- Record usage right after event

### 2. Regular Inventory Checks
- Review inventory page weekly
- Plan purchases before stock runs out
- Consider bulk buying for frequently used items

### 3. Accurate Quantity Tracking
- Be precise with consumable quantities
- Count remaining items after events
- Adjust if estimates were wrong

### 4. Consistent Pricing
- Keep ticket prices consistent or clearly track changes
- Document reasons for price adjustments
- Consider different tiers (adult/child, member/non-member)

### 5. Financial Reviews
- Check dashboard after each event
- Compare profit/loss across events
- Identify cost-saving opportunities

## ✅ Checklist: Event Day

**Before Event:**
- [ ] Verify sufficient inventory
- [ ] Purchase any needed supplies
- [ ] Log all expenses in system
- [ ] Prepare payment collection method

**During Event:**
- [ ] Welcome each attendee
- [ ] Collect payment
- [ ] Log attendee in system
- [ ] Mark as "Checked In"
- [ ] Note any partial payments

**After Event:**
- [ ] Count remaining inventory
- [ ] Log inventory usage
- [ ] Verify all attendees logged
- [ ] Review financial summary
- [ ] Plan for next event

## 🎉 Success Tips

1. **Start Simple**: Track one event completely before optimizing
2. **Be Consistent**: Use same categories and naming
3. **Review Regularly**: Check reports after each event
4. **Plan Ahead**: Use leftover funds wisely
5. **Keep Learning**: Adjust processes based on what works

---

Happy tracking! 🎬🍿
