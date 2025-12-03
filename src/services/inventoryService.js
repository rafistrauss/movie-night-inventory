import { getAllExpenses } from './expenseService';
import { getAllUsage } from './usageService';
import { dataCache } from './cacheService';

export async function buildInventory() {
  const cacheKey = 'inventory';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  // Fetch all data in parallel for efficiency
  const [expenses, allUsage] = await Promise.all([
    getAllExpenses(),
    getAllUsage()
  ]);
  
  // Build usage map for O(1) lookups instead of O(n) queries
  const usageByItem = new Map();
  for (const usage of allUsage) {
    const itemName = usage.itemName;
    if (!usageByItem.has(itemName)) {
      usageByItem.set(itemName, 0);
    }
    usageByItem.set(itemName, usageByItem.get(itemName) + (usage.quantityUsed || 0));
  }
  
  const inventoryMap = new Map();
  
  // Group consumable expenses by item name
  for (const expense of expenses) {
    if (expense.reusableType === 'consumable') {
      const key = expense.name;
      
      if (inventoryMap.has(key)) {
        const existing = inventoryMap.get(key);
        existing.initialQuantity += expense.quantityPurchased || 0;
        existing.totalCost += expense.cost || 0;
        existing.expenses.push(expense);
      } else {
        inventoryMap.set(key, {
          itemName: expense.name,
          category: expense.category,
          reusableType: expense.reusableType,
          initialQuantity: expense.quantityPurchased || 0,
          totalCost: expense.cost || 0,
          expenses: [expense]
        });
      }
    } else if (expense.reusableType === 'reusable') {
      // Reusable items don't deplete
      const key = expense.name;
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          itemName: expense.name,
          category: expense.category,
          reusableType: expense.reusableType,
          initialQuantity: expense.quantityPurchased || 1,
          totalCost: expense.cost || 0,
          expenses: [expense]
        });
      }
    }
  }
  
  // Calculate remaining quantities using pre-built map (no queries)
  const inventory = [];
  for (const [itemName, item] of inventoryMap) {
    const totalUsed = usageByItem.get(itemName) || 0;
    const costPerUnit = item.initialQuantity > 0 ? item.totalCost / item.initialQuantity : 0;
    
    inventory.push({
      ...item,
      quantityUsed: totalUsed,
      remainingQuantity: item.reusableType === 'reusable' ? 'N/A' : item.initialQuantity - totalUsed,
      costPerUnit: costPerUnit.toFixed(2)
    });
  }
  
  dataCache.set(cacheKey, inventory);
  return inventory;
}

export async function getInventoryItem(itemName) {
  const inventory = await buildInventory();
  return inventory.find(item => item.itemName === itemName);
}

export async function validateUsage(itemName, quantityToUse) {
  const item = await getInventoryItem(itemName);
  
  if (!item) {
    return { valid: false, message: 'Item not found in inventory' };
  }
  
  if (item.reusableType === 'reusable') {
    return { valid: true };
  }
  
  if (typeof item.remainingQuantity === 'number' && item.remainingQuantity < quantityToUse) {
    return { 
      valid: false, 
      message: `Not enough inventory. Available: ${item.remainingQuantity}, Requested: ${quantityToUse}` 
    };
  }
  
  return { valid: true };
}
