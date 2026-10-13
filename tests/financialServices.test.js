import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

async function loadServices({ expenses = [], usage = [], events = [], revenue = {} } = {}) {
  const context = createContext();
  const mocks = {
    expenseService: {
      getAllExpenses: async () => expenses,
      getExpensesByEvent: async id => expenses.filter(expense => expense.eventId === id)
    },
    usageService: {
      getAllUsage: async () => usage,
      getUsageByEvent: async id => usage.filter(item => item.eventId === id)
    },
    eventService: { getAllEvents: async () => events },
    attendeeService: { getTotalCollected: async id => revenue[id] || 0 },
    cacheService: { dataCache: { get: () => null, set: () => {}, invalidateAll: () => {} } }
  };
  const modules = new Map();
  async function getModule(name) {
    if (modules.has(name)) return modules.get(name);
    const mock = mocks[name];
    const module = mock
      ? new SyntheticModule(Object.keys(mock), function () {
        for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
      }, { context })
      : new SourceTextModule(
        await readFile(new URL(`../src/services/${name}.js`, import.meta.url), 'utf8'),
        { context }
      );
    modules.set(name, module);
    await module.link(specifier => getModule(specifier.slice(2)));
    return module;
  }
  const services = {};
  for (const name of ['amortizationService', 'aggregationService', 'reportingService', 'inventoryService']) {
    const module = await getModule(name);
    await module.evaluate();
    services[name] = module.namespace;
  }
  return services;
}

const cups = { name: 'Cups', reusableType: 'reusable', cost: 80, quantityPurchased: 50, eventId: 'first' };

test('reusable cost decreases from $80 to $40 to $26.67 per event without restoring spent cash', async () => {
  for (let count = 1; count <= 3; count++) {
    const events = ['first', 'second', 'third'].slice(0, count).map(id => ({ id }));
    const usage = events.map((event, index) => ({
      eventId: event.id, itemName: 'Cups', quantityUsed: [30, 25, 40][index]
    }));
    const { aggregationService, reportingService, inventoryService } = await loadServices({
      expenses: [cups], usage, events, revenue: { first: 80 }
    });
    const data = await aggregationService.aggregateAllData();
    assert.equal(data.globalLeftoverFunds, 0);
    for (const event of events) {
      const expected = 80 / count;
      const cost = await reportingService.calculateEventCost(event.id);
      assert.equal(cost, expected);
      assert.equal(data.financials.get(event.id).cost, expected);
      const summary = await reportingService.getEventFinancialSummary(event.id);
      assert.equal(summary.totalUsageCost, expected.toFixed(2));
      assert.equal(summary.totalPurchaseCost, event.id === 'first' ? '80.00' : '0.00');
      assert.equal(summary.profitByPurchase, '0.00');
    }
    assert.equal((await inventoryService.buildInventory())[0].costPerEvent, 80 / count);
  }
});

test('duplicate records charge a reusable item once and zero usage does not dilute costs', async () => {
  const usage = [
    { eventId: 'first', itemName: 'Cups', quantityUsed: 10 },
    { eventId: 'first', itemName: 'Cups', quantityUsed: 20 },
    { eventId: 'second', itemName: 'Cups', quantityUsed: 0 }
  ];
  const { amortizationService, reportingService } = await loadServices({ expenses: [cups], usage });
  const costs = await amortizationService.calculateAmortizedCosts();
  assert.equal(costs.get('Cups').numEventsUsed, 1);
  const first = await reportingService.getEventFinancialSummary('first');
  assert.equal(first.totalUsageCost, '80.00');
  assert.equal(first.costBreakdown.length, 1);
  assert.equal(first.costBreakdown[0].quantityUsed, 30);
  assert.equal(await reportingService.calculateEventCost('second'), 0);
});

test('available funds subtract all purchases even before any inventory is used', async () => {
  const { aggregationService } = await loadServices({
    expenses: [
      cups,
      { name: 'Napkins', reusableType: 'consumable', quantityPurchased: 100, cost: 10 },
      { ...cups, name: 'Decorations', cost: '20', eventId: 'second' }
    ],
    events: [{ id: 'first' }, { id: 'second' }],
    revenue: { first: 80, second: 20 }
  });
  const data = await aggregationService.aggregateAllData();
  assert.equal(data.globalLeftoverFunds, -10);
  assert.equal(data.financials.get('first').cost, 0);
});

test('consumables retain precise per-unit costs in both financial calculation paths', async () => {
  const { aggregationService, reportingService } = await loadServices({
    expenses: [{ name: 'Napkins', reusableType: 'consumable', quantityPurchased: 3, cost: 1 }],
    usage: [
      { eventId: 'first', itemName: 'Napkins', quantityUsed: 1 },
      { eventId: 'first', itemName: 'Napkins', quantityUsed: 2 }
    ],
    events: [{ id: 'first' }], revenue: { first: 2 }
  });
  const data = await aggregationService.aggregateAllData();
  assert.equal(data.financials.get('first').cost, 1);
  assert.equal(await reportingService.calculateEventCost('first'), 1);
  assert.equal((await reportingService.getEventFinancialSummary('first')).totalUsageCost, '1.00');
  assert.equal(data.globalLeftoverFunds, 1);
});

test('multiple purchases of a reusable item share their combined cost', async () => {
  const { reportingService } = await loadServices({
    expenses: [cups, { ...cups, cost: '40', quantityPurchased: '25', eventId: 'second' }],
    usage: [
      { eventId: 'first', itemName: 'Cups', quantityUsed: 10 },
      { eventId: 'second', itemName: 'Cups', quantityUsed: 20 }
    ]
  });
  assert.equal(await reportingService.calculateEventCost('first'), 60);
  assert.equal(await reportingService.calculateEventCost('second'), 60);
});

test('same-name purchases on one event are aggregated in reports and inventory', async () => {
  const { reportingService, inventoryService } = await loadServices({
    expenses: [cups, { ...cups, cost: '40', quantityPurchased: '25' }],
    usage: [{ eventId: cups.eventId, itemName: 'Cups', quantityUsed: 10 }],
    events: [{ id: cups.eventId }]
  });
  const summary = await reportingService.getEventFinancialSummary(cups.eventId);
  assert.equal(summary.totalPurchaseCost, '120.00');
  assert.equal(summary.costBreakdown[0].quantityPurchased, 75);
  const item = await inventoryService.getInventoryItem('Cups');
  assert.equal(item.totalCost, 120);
  assert.equal(item.initialQuantity, 75);
});

test('inventory totals stay numeric when the first purchase has string fields', async () => {
  const { inventoryService } = await loadServices({
    expenses: [{ ...cups, cost: '40', quantityPurchased: '25' }, cups]
  });
  const item = await inventoryService.getInventoryItem('Cups');
  assert.equal(item.totalCost, 120);
  assert.equal(item.initialQuantity, 75);
});

test('re-logging a reusable item at each event does not multiply its cost', async () => {
  const events = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
  const projector = { name: 'Projector', reusableType: 'reusable', cost: 300, quantityPurchased: 1 };
  const { aggregationService, reportingService, inventoryService } = await loadServices({
    expenses: [
      { ...projector, eventId: 'second', createdAt: new Date('2026-02-01') },
      { ...projector, eventId: 'first', createdAt: new Date('2026-01-01') },
      { ...projector, cost: '300', eventId: 'third', createdAt: new Date('2026-03-01') }
    ],
    usage: events.map(event => ({ eventId: event.id, itemName: 'Projector', quantityUsed: 1 })),
    events,
    revenue: { first: 300 }
  });
  const item = await inventoryService.getInventoryItem('Projector');
  assert.equal(item.totalCost, 300);
  assert.equal(item.costPerEvent, 100);
  const data = await aggregationService.aggregateAllData();
  assert.equal(data.inventory[0].totalCost, 300);
  assert.equal(data.globalLeftoverFunds, 0);
  for (const event of events) {
    assert.equal(data.financials.get(event.id).cost, 100);
    const summary = await reportingService.getEventFinancialSummary(event.id);
    assert.equal(summary.totalUsageCost, '100.00');
    assert.equal(summary.totalPurchaseCost, event.id === 'first' ? '300.00' : '0.00');
  }
});

test('repeated consumable purchases are still all counted', async () => {
  const napkins = { name: 'Napkins', reusableType: 'consumable', cost: 10, quantityPurchased: 100 };
  const { inventoryService } = await loadServices({ expenses: [napkins, { ...napkins }] });
  const item = await inventoryService.getInventoryItem('Napkins');
  assert.equal(item.totalCost, 20);
  assert.equal(item.initialQuantity, 200);
});

test('reusable inventory cost per unit is the purchase price, not amortized per event', async () => {
  const events = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const { aggregationService, inventoryService } = await loadServices({
    expenses: [{ name: 'Bowls', reusableType: 'reusable', cost: 4.5, quantityPurchased: 3, eventId: 'a' }],
    usage: events.map(event => ({ eventId: event.id, itemName: 'Bowls', quantityUsed: 3 })),
    events
  });
  const item = await inventoryService.getInventoryItem('Bowls');
  assert.equal(item.totalCost, 4.5);
  assert.equal(item.costPerUnit, '1.50');
  assert.equal(item.costPerEvent, 1.125);
  const data = await aggregationService.aggregateAllData();
  assert.equal(data.inventory[0].costPerUnit, '1.50');
});
