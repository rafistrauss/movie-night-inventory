import { getAllEvents } from './eventService';
import { getAllExpenses } from './expenseService';
import { getAllUsage } from './usageService';
import { getTotalCollected } from './attendeeService';
import { dataCache } from './cacheService';
import { calculateAmortizedCosts, calculateEventAmortizedCosts, getUniqueExpenses } from './amortizationService';

/**
 * Aggregates all data in a single optimized fetch
 * Reduces Firebase queries from O(n²) to O(n)
 */
export async function aggregateAllData() {
  const cacheKey = 'aggregated_data';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  // Fetch all base data in parallel
  const [events, expenses, allUsage, amortizedCosts] = await Promise.all([
    getAllEvents(),
    getAllExpenses(),
    getAllUsage(),
    calculateAmortizedCosts()
  ]);

  // Build usage map for quick lookups (by item name and by event)
  const usageByItem = new Map();
  const usageByEvent = new Map();
  
  for (const usage of allUsage) {
    // By item name
    const itemName = usage.itemName;
    if (!usageByItem.has(itemName)) {
      usageByItem.set(itemName, []);
    }
    usageByItem.get(itemName).push(usage);
    
    // By event
    const eventId = usage.eventId;
    if (!usageByEvent.has(eventId)) {
      usageByEvent.set(eventId, []);
    }
    usageByEvent.get(eventId).push(usage);
  }

  // Build inventory from expenses with pre-calculated usage
  const inventoryMap = new Map();
  const uniqueExpenses = getUniqueExpenses(expenses);
  
  for (const expense of uniqueExpenses) {
    const key = expense.name;
    
    if (expense.reusableType === 'consumable') {
      if (inventoryMap.has(key)) {
        const existing = inventoryMap.get(key);
        existing.initialQuantity += Number(expense.quantityPurchased) || 0;
        existing.totalCost += Number(expense.cost) || 0;
        existing.expenses.push(expense);
      } else {
        inventoryMap.set(key, {
          itemName: expense.name,
          category: expense.category,
          reusableType: expense.reusableType,
          initialQuantity: Number(expense.quantityPurchased) || 0,
          totalCost: Number(expense.cost) || 0,
          expenses: [expense]
        });
      }
    } else if (expense.reusableType === 'reusable') {
      if (inventoryMap.has(key)) {
        const existing = inventoryMap.get(key);
        existing.initialQuantity += Number(expense.quantityPurchased) || 1;
        existing.totalCost += Number(expense.cost) || 0;
        existing.expenses.push(expense);
      } else {
        inventoryMap.set(key, {
          itemName: expense.name,
          category: expense.category,
          reusableType: expense.reusableType,
          initialQuantity: Number(expense.quantityPurchased) || 1,
          totalCost: Number(expense.cost) || 0,
          expenses: [expense]
        });
      }
    }
  }

  // Calculate inventory with usage (no additional queries needed)
  const inventory = [];
  for (const [itemName, item] of inventoryMap) {
    const itemUsage = usageByItem.get(itemName) || [];
    const totalUsed = itemUsage.reduce((sum, u) => sum + (u.quantityUsed || 0), 0);
    const amortizedCost = amortizedCosts.get(itemName);
    
    // Inventory shows the purchase price per unit; per-event amortization is in costPerEvent
    const costPerUnit = item.initialQuantity > 0 ? item.totalCost / item.initialQuantity : 0;
    
    const eventsUsed = amortizedCost?.numEventsUsed || 0;
    
    inventory.push({
      ...item,
      quantityUsed: totalUsed,
      remainingQuantity: item.reusableType === 'reusable' ? 'N/A' : item.initialQuantity - totalUsed,
      costPerUnit: costPerUnit.toFixed(2),
      costPerEvent: amortizedCost?.costPerEvent ?? null,
      amortizedAcrossEvents: item.reusableType === 'reusable' ? eventsUsed : null
    });
  }

  // Pre-calculate event financials in parallel
  const eventFinancials = await Promise.all(
    events.map(async (event) => {
      const eventUsage = usageByEvent.get(event.id) || [];
      const revenue = await getTotalCollected(event.id);
      
      const eventCosts = await calculateEventAmortizedCosts(event.id, eventUsage, amortizedCosts);
      const cost = eventCosts.totalCost;
      const costBreakdown = eventCosts.items.map(item => ({
        ...item,
        totalCost: item.totalCost.toFixed(2)
      }));
      
      return {
        eventId: event.id,
        revenue,
        cost,
        profit: revenue - cost,
        costBreakdown
      };
    })
  );

  // Build financial map for quick lookups
  const financialsMap = new Map();
  let totalRevenue = 0;
  
  for (const financial of eventFinancials) {
    financialsMap.set(financial.eventId, financial);
    totalRevenue += financial.revenue;
  }

  // Available cash reflects actual purchases, not amortized inventory usage.
  const totalSpending = uniqueExpenses.reduce((sum, expense) => sum + (Number(expense.cost) || 0), 0);
  const globalLeftoverFunds = totalRevenue - totalSpending;

  const aggregatedData = {
    events,
    expenses,
    inventory,
    allUsage,
    usageByItem,
    usageByEvent,
    financials: financialsMap,
    globalLeftoverFunds,
    timestamp: Date.now()
  };

  dataCache.set(cacheKey, aggregatedData);
  return aggregatedData;
}

/**
 * Get dashboard data (optimized single fetch)
 */
export async function getDashboardData() {
  const data = await aggregateAllData();
  
  return {
    events: data.events,
    inventory: data.inventory,
    leftoverFunds: data.globalLeftoverFunds,
    lowStockItems: data.inventory.filter(
      item => typeof item.remainingQuantity === 'number' && item.remainingQuantity < 10
    ).length
  };
}

/**
 * Get inventory data (optimized single fetch)
 */
export async function getInventoryData() {
  const data = await aggregateAllData();
  
  return {
    inventory: data.inventory,
    usageHistory: data.allUsage
  };
}

/**
 * Get event financial summary (optimized lookup)
 */
export async function getEventFinancialData(eventId) {
  const data = await aggregateAllData();
  
  return {
    financial: data.financials.get(eventId) || {
      eventId,
      revenue: 0,
      cost: 0,
      profit: 0,
      costBreakdown: []
    },
    usage: data.usageByEvent.get(eventId) || []
  };
}

/**
 * Invalidate cache when data changes
 */
export function invalidateCache() {
  dataCache.invalidateAll();
}
