# Expense Amortization Feature

## Overview
The application now supports **automatic amortization** of reusable expenses across multiple events. When a reusable item (like cups, plates, decorations, etc.) is used in multiple events, its cost is automatically divided among all events that use it.

## How It Works

### Consumable Items (Existing Behavior)
- **Consumable** items (food, drinks, napkins, etc.) are tracked per-unit
- Cost per unit = Total cost / Quantity purchased
- Each event pays for the quantity it consumes
- Inventory depletes as items are used

**Example:**
- Purchase 100 napkins for $10
- Cost per unit = $0.10
- Event 1 uses 30 napkins → Charged $3.00
- Event 2 uses 40 napkins → Charged $4.00

### Reusable Items (NEW - Amortized)
- **Reusable** items (cups, plates, utensils, decorations, etc.) don't deplete
- Cost is **amortized** across all events that use the item
- Each event pays an equal share of the total cost
- The more events that use it, the less each event pays

**Example 1: Progressive Amortization**
- Purchase reusable cups for $30
- Event 1 uses the cups → Charged **$30.00** (first use, full cost)
- Event 2 uses the cups → Both events now charged **$15.00 each**
- Event 3 uses the cups → All events now charged **$10.00 each**

**Example 2: Multi-Event Amortization**
- Purchase decorations for $60
- Used in Events 1, 2, 3, and 4
- Each event is charged **$15.00** ($60 ÷ 4 events)

## Implementation Details

### New Service: `amortizationService.js`
Provides core amortization calculations:
- `calculateAmortizedCosts()` - Calculates amortized costs for all items
- `getAmortizedCostForItem(itemName)` - Gets cost info for specific item
- `calculateEventAmortizedCosts(eventId, usage)` - Calculates costs for a specific event

### Updated Services

#### `inventoryService.js`
- Now includes amortized cost per unit for reusable items
- Tracks number of events each item has been used in
- Inventory items include `amortizedAcrossEvents` field

#### `aggregationService.js`
- Global aggregation now uses amortized costs
- Optimized to calculate amortization in single pass

#### `reportingService.js`
- Event financial summaries now use amortized costs
- `calculateEventCost()` uses amortization for reusable items
- Cost breakdowns show amortization information

### UI Updates

#### Dashboard (`Dashboard.svelte`)
- Inventory table now shows:
  - **Cost/Unit** with asterisk (*) if amortized
  - **Events Used** column showing number of events
- Tooltip on hover explains amortization

#### Event Details (`EventDetails.svelte`)
- Financial Summary now includes **Amortization** column
- Shows badges indicating:
  - "Shared across X events" (blue) - for multi-event items
  - "First use (reusable)" (orange) - for first-time use
  - "Consumable" (gray) - for consumable items

## Benefits

### Fair Cost Distribution
- Reusable items' costs are distributed fairly across all events that benefit from them
- Early events aren't unfairly burdened with full reusable item costs

### Accurate Profit Calculations
- Event profitability is more accurately calculated
- Each event pays only its fair share of reusable item costs

### Better Financial Insights
- Easily see which items are being reused across events
- Understand true per-event costs vs. purchase costs

## Usage Example

### Scenario: Movie Night Series

**Initial Purchase:**
```
Purchase: 50 reusable cups for $3.00
Purchase: 100 popcorn bags for $20.00
```

**Event 1 - "Opening Night"**
- Uses: 30 cups, 50 popcorn bags
- Cost: $3.00 (cups) + $10.00 (popcorn) = **$13.00**
- Cups charged at full cost (first use)

**Event 2 - "Family Night"**
- Uses: 25 cups, 30 popcorn bags
- Cost: $1.50 (cups, now shared with Event 1) + $6.00 (popcorn) = **$7.50**
- Cups now amortized: $3.00 ÷ 2 events = $1.50 per event
- Event 1's cost retroactively updates to $11.50

**Event 3 - "Finals Night"**
- Uses: 40 cups, 20 popcorn bags
- Cost: $1.00 (cups, shared across 3 events) + $4.00 (popcorn) = **$5.00**
- Cups now amortized: $3.00 ÷ 3 events = $1.00 per event
- All previous events update to reflect $1.00 for cups

### Final State:
- Event 1: $1.00 (cups) + $10.00 (popcorn) = $11.00
- Event 2: $1.00 (cups) + $6.00 (popcorn) = $7.00
- Event 3: $1.00 (cups) + $4.00 (popcorn) = $5.00
- Total: $23.00 (matches actual spending of $3 + $20)

## Technical Notes

### Caching
- Amortization calculations are cached for performance
- Cache invalidates automatically when:
  - New expenses are added
  - Inventory usage is updated
  - Items are used in new events

### Real-time Updates
- When an item is used in a new event, all affected events' costs update automatically
- Financial summaries reflect current amortization state

### Data Consistency
- Amortization is calculated on-the-fly from usage data
- No manual recalculation needed
- Always reflects current state of the system
