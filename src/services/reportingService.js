import { getTotalCollected } from './attendeeService';
import { getUsageByEvent } from './usageService';
import { getExpensesByEvent } from './expenseService';
import { dataCache } from './cacheService';
import { calculateEventAmortizedCosts } from './amortizationService';

export async function calculateEventCost(eventId) {
  const usage = await getUsageByEvent(eventId);
  
  // Calculate amortized costs (includes reusable item amortization)
  const amortizedCosts = await calculateEventAmortizedCosts(eventId, usage);
  
  return amortizedCosts.totalCost;
}

export async function calculateEventProfit(eventId) {
  const [totalCollected, totalCost] = await Promise.all([
    getTotalCollected(eventId),
    calculateEventCost(eventId)
  ]);
  
  return {
    revenue: totalCollected,
    cost: totalCost,
    profit: totalCollected - totalCost
  };
}

export async function calculateGlobalLeftoverFunds() {
  const cacheKey = 'global_leftover_funds';
  const cached = dataCache.get(cacheKey);
  if (cached !== null) return cached;
  
  // Use aggregation service for optimized calculation
  const { aggregateAllData } = await import('./aggregationService');
  const data = await aggregateAllData();
  
  dataCache.set(cacheKey, data.globalLeftoverFunds);
  return data.globalLeftoverFunds;
}

export async function getEventFinancialSummary(eventId) {
  const [totalCollected, usage, expenses] = await Promise.all([
    getTotalCollected(eventId),
    getUsageByEvent(eventId),
    getExpensesByEvent(eventId)
  ]);
  
  // Get amortized cost calculations
  const amortizedCosts = await calculateEventAmortizedCosts(eventId, usage);
  
  // Build unified breakdown combining purchases and usage
  const itemsMap = new Map();
  
  // Add purchased items
  for (const expense of expenses) {
    const cost = parseFloat(expense.cost || 0);
    const costPerUnit = cost / expense.quantityPurchased;
    
    itemsMap.set(expense.name, {
      itemName: expense.name,
      quantityPurchased: expense.quantityPurchased,
      purchaseCost: cost,
      purchaseCostPerUnit: costPerUnit,
      quantityUsed: 0,
      usageCost: 0,
      usageCostPerUnit: 0,
      isAmortized: false,
      amortizedAcrossEvents: null
    });
  }
  
  // Add/update with amortized usage data
  for (const amortizedItem of amortizedCosts.items) {
    const costPerUnit = amortizedItem.costPerUnit;
    const usageCost = amortizedItem.totalCost;
    
    if (itemsMap.has(amortizedItem.itemName)) {
      // Item was purchased for this event, add usage
      const item = itemsMap.get(amortizedItem.itemName);
      item.quantityUsed = amortizedItem.quantityUsed;
      item.usageCost = usageCost;
      item.usageCostPerUnit = costPerUnit;
      item.isAmortized = amortizedItem.isAmortized;
      item.amortizedAcrossEvents = amortizedItem.amortizedAcrossEvents;
    } else {
      // Item from inventory, not purchased for this event
      itemsMap.set(amortizedItem.itemName, {
        itemName: amortizedItem.itemName,
        quantityPurchased: 0,
        purchaseCost: 0,
        purchaseCostPerUnit: 0,
        quantityUsed: amortizedItem.quantityUsed,
        usageCost: usageCost,
        usageCostPerUnit: costPerUnit,
        isAmortized: amortizedItem.isAmortized,
        amortizedAcrossEvents: amortizedItem.amortizedAcrossEvents
      });
    }
  }
  
  const costBreakdown = Array.from(itemsMap.values());
  
  // Calculate totals
  let totalPurchaseCost = 0;
  let totalUsageCost = 0;
  
  for (const item of costBreakdown) {
    totalPurchaseCost += item.purchaseCost;
    totalUsageCost += item.usageCost;
  }
  
  return {
    revenue: totalCollected,
    costBreakdown,
    totalPurchaseCost: totalPurchaseCost.toFixed(2),
    totalUsageCost: totalUsageCost.toFixed(2),
    profitByPurchase: (totalCollected - totalPurchaseCost).toFixed(2),
    profitByUsage: (totalCollected - totalUsageCost).toFixed(2)
  };
}
