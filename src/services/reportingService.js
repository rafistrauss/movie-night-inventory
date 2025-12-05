import { getTotalCollected } from './attendeeService';
import { getUsageByEvent } from './usageService';
import { buildInventory } from './inventoryService';
import { getExpensesByEvent } from './expenseService';
import { dataCache } from './cacheService';

export async function calculateEventCost(eventId) {
  const [usage, inventory] = await Promise.all([
    getUsageByEvent(eventId),
    buildInventory()
  ]);
  
  // Calculate usage-based costs (this is the real cost for profit calculations)
  let usageCost = 0;
  for (const usageItem of usage) {
    const inventoryItem = inventory.find(item => item.itemName === usageItem.itemName);
    if (inventoryItem && inventoryItem.costPerUnit) {
      const cost = parseFloat(inventoryItem.costPerUnit) * (usageItem.quantityUsed || 0);
      usageCost += cost;
    }
  }
  
  return usageCost;
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
  const [totalCollected, usage, inventory, expenses] = await Promise.all([
    getTotalCollected(eventId),
    getUsageByEvent(eventId),
    buildInventory(),
    getExpensesByEvent(eventId)
  ]);
  
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
      usageCostPerUnit: 0
    });
  }
  
  // Add/update with usage data
  for (const usageItem of usage) {
    const inventoryItem = inventory.find(item => item.itemName === usageItem.itemName);
    const costPerUnit = inventoryItem?.costPerUnit || 0;
    const usageCost = parseFloat(costPerUnit) * (usageItem.quantityUsed || 0);
    
    if (itemsMap.has(usageItem.itemName)) {
      // Item was purchased for this event, add usage
      const item = itemsMap.get(usageItem.itemName);
      item.quantityUsed = usageItem.quantityUsed;
      item.usageCost = usageCost;
      item.usageCostPerUnit = parseFloat(costPerUnit);
    } else {
      // Item from inventory, not purchased for this event
      itemsMap.set(usageItem.itemName, {
        itemName: usageItem.itemName,
        quantityPurchased: 0,
        purchaseCost: 0,
        purchaseCostPerUnit: 0,
        quantityUsed: usageItem.quantityUsed,
        usageCost: usageCost,
        usageCostPerUnit: parseFloat(costPerUnit)
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
