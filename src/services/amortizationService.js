import { getAllExpenses } from './expenseService';
import { getAllUsage } from './usageService';

/**
 * Calculate amortized cost per unit for an item across all events it's been used in
 * For reusable items: cost is divided by number of events used
 * For consumable items: standard cost per unit calculation
 */
export async function calculateAmortizedCosts() {
  const [expenses, allUsage] = await Promise.all([
    getAllExpenses(),
    getAllUsage()
  ]);

  // Map to track which events each reusable item has been used in
  const reusableItemEventUsage = new Map(); // itemName -> Set of eventIds
  
  // Map to accumulate all expenses by item name
  const expensesByItem = new Map(); // itemName -> { totalCost, quantityPurchased, reusableType, expenses }
  
  // First, build the expense map
  for (const expense of expenses) {
    const itemName = expense.name;
    
    if (!expensesByItem.has(itemName)) {
      expensesByItem.set(itemName, {
        itemName,
        totalCost: 0,
        quantityPurchased: 0,
        reusableType: expense.reusableType,
        category: expense.category,
        expenses: []
      });
    }
    
    const item = expensesByItem.get(itemName);
    item.totalCost += Number(expense.cost) || 0;
    item.quantityPurchased += Number(expense.quantityPurchased) || 0;
    item.expenses.push(expense);
  }
  
  // Track which events use each reusable item
  for (const usage of allUsage) {
    if (!(Number(usage.quantityUsed) > 0)) continue;
    const itemName = usage.itemName;
    const eventId = usage.eventId;
    
    if (!reusableItemEventUsage.has(itemName)) {
      reusableItemEventUsage.set(itemName, new Set());
    }
    reusableItemEventUsage.get(itemName).add(eventId);
  }
  
  // Calculate amortized costs
  const amortizedCosts = new Map(); // itemName -> { costPerUnit, costPerEvent, eventsUsedIn }
  
  for (const [itemName, itemData] of expensesByItem) {
    const eventsUsedIn = reusableItemEventUsage.get(itemName) || new Set();
    const numEventsUsed = eventsUsedIn.size;
    
    let costPerUnit;
    let costPerEvent;
    
    if (itemData.reusableType === 'reusable') {
      // For reusable items, amortize across events
      if (numEventsUsed > 0) {
        // Cost per event = total cost / number of events used
        costPerEvent = itemData.totalCost / numEventsUsed;
        // Cost per unit per event (if tracking individual items like cups)
        costPerUnit = costPerEvent / (itemData.quantityPurchased || 1);
      } else {
        // Not used yet, full cost would apply to first event
        costPerEvent = itemData.totalCost;
        costPerUnit = itemData.totalCost / (itemData.quantityPurchased || 1);
      }
    } else {
      // For consumable items, standard cost per unit
      costPerUnit = itemData.quantityPurchased > 0 
        ? itemData.totalCost / itemData.quantityPurchased 
        : 0;
      costPerEvent = null; // Not applicable
    }
    
    amortizedCosts.set(itemName, {
      itemName,
      costPerUnit,
      costPerEvent,
      totalCost: itemData.totalCost,
      quantityPurchased: itemData.quantityPurchased,
      reusableType: itemData.reusableType,
      eventsUsedIn: Array.from(eventsUsedIn),
      numEventsUsed
    });
  }
  
  return amortizedCosts;
}

/**
 * Get amortized cost for a specific item
 */
export async function getAmortizedCostForItem(itemName) {
  const costs = await calculateAmortizedCosts();
  return costs.get(itemName);
}

/**
 * Calculate the amortized cost attribution for a specific event
 * Returns how much each item costs for that event based on amortization
 */
export async function calculateEventAmortizedCosts(eventId, usage, existingCosts) {
  const amortizedCosts = existingCosts || await calculateAmortizedCosts();
  
  const eventCosts = [];
  let totalCost = 0;
  const quantitiesByItem = new Map();
  
  for (const usageItem of usage) {
    const quantity = Number(usageItem.quantityUsed) || 0;
    if (quantity <= 0) continue;
    quantitiesByItem.set(
      usageItem.itemName,
      (quantitiesByItem.get(usageItem.itemName) || 0) + quantity
    );
  }

  for (const [itemName, quantityUsed] of quantitiesByItem) {
    const itemCost = amortizedCosts.get(itemName);
    
    if (!itemCost) continue;
    
    let cost;
    if (itemCost.reusableType === 'reusable') {
      // Charge one equal share per event, regardless of quantity or usage records.
      cost = itemCost.costPerEvent;
    } else {
      // For consumable items, use standard cost per unit
      cost = itemCost.costPerUnit * quantityUsed;
    }
    
    eventCosts.push({
      itemName,
      quantityUsed,
      costPerUnit: cost / quantityUsed,
      totalCost: cost,
      reusableType: itemCost.reusableType,
      isAmortized: itemCost.reusableType === 'reusable',
      amortizedAcrossEvents: itemCost.numEventsUsed || 1
    });
    
    totalCost += cost;
  }
  
  return {
    eventId,
    items: eventCosts,
    totalCost
  };
}
