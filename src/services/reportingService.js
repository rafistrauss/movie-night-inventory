import { getTotalCollected } from './attendeeService';
import { getUsageByEvent } from './usageService';
import { buildInventory } from './inventoryService';
import { dataCache } from './cacheService';

export async function calculateEventCost(eventId) {
  const [usage, inventory] = await Promise.all([
    getUsageByEvent(eventId),
    buildInventory()
  ]);
  
  let totalCost = 0;
  
  for (const usageItem of usage) {
    const inventoryItem = inventory.find(item => item.itemName === usageItem.itemName);
    if (inventoryItem && inventoryItem.costPerUnit) {
      const cost = parseFloat(inventoryItem.costPerUnit) * (usageItem.quantityUsed || 0);
      totalCost += cost;
    }
  }
  
  return totalCost;
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
  const [totalCollected, usage, inventory] = await Promise.all([
    getTotalCollected(eventId),
    getUsageByEvent(eventId),
    buildInventory()
  ]);
  
  const costBreakdown = [];
  let totalCost = 0;
  
  for (const usageItem of usage) {
    const inventoryItem = inventory.find(item => item.itemName === usageItem.itemName);
    if (inventoryItem && inventoryItem.costPerUnit) {
      const cost = parseFloat(inventoryItem.costPerUnit) * (usageItem.quantityUsed || 0);
      totalCost += cost;
      
      costBreakdown.push({
        itemName: usageItem.itemName,
        quantityUsed: usageItem.quantityUsed,
        costPerUnit: inventoryItem.costPerUnit,
        totalCost: cost.toFixed(2)
      });
    }
  }
  
  return {
    revenue: totalCollected,
    costBreakdown,
    totalCost: totalCost.toFixed(2),
    profit: (totalCollected - totalCost).toFixed(2)
  };
}
