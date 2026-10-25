export type ScenarioId = "cart-total" | "double-discount" | "empty-checkout";
export type TestStatus = "passed" | "failed";

export interface Scenario {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  functionName: string;
  title: string;
  severity: "High" | "Critical" | "Medium";
  description: string;
  expected: string;
  faultyActual: string;
  healthyCode: string[];
  faultyCode: string[];
  fixedCode: string[];
  explanation: string;
  failingTest: string;
  evidence: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  expected: string;
  actual: string;
}

export interface TestRun {
  results: TestResult[];
  passed: number;
  failed: number;
  durationMs: number;
  success: boolean;
}

export const scenarios: Scenario[] = [
  {
    id: "cart-total",
    label: "Incorrect cart total",
    shortLabel: "Cart total",
    functionName: "calculateCartTotal",
    title: "Discount subtracted as a flat amount",
    severity: "High",
    description:
      "The cart total helper subtracts the discount rate from the subtotal instead of multiplying the subtotal by that rate.",
    expected: "$86.40",
    faultyActual: "$95.90",
    healthyCode: [
      "function calculateCartTotal(subtotal, discountRate) {",
      "  const discount = subtotal * discountRate;",
      "  return subtotal - discount;",
      "}",
    ],
    faultyCode: [
      "function calculateCartTotal(subtotal, discountRate) {",
      "  const discount = discountRate; // should scale with subtotal",
      "  return subtotal - discount;",
      "}",
    ],
    fixedCode: [
      "function calculateCartTotal(subtotal, discountRate) {",
      "  const discount = subtotal * discountRate;",
      "  return subtotal - discount;",
      "}",
    ],
    explanation:
      "Convert the percentage into a monetary amount by multiplying it by the subtotal before subtraction.",
    failingTest: "cart total applies percentage discount",
    evidence: "Subtotal $96.00 × 10% = $9.60 discount. Faulty result subtracts only $0.10.",
  },
  {
    id: "double-discount",
    label: "Discount applied twice",
    shortLabel: "Double discount",
    functionName: "applyDiscount",
    title: "Discount is applied twice",
    severity: "Critical",
    description:
      "The checkout pipeline discounts an already-discounted subtotal a second time, compounding the reduction.",
    expected: "$76.80",
    faultyActual: "$61.44",
    healthyCode: [
      "function applyDiscount(subtotal, rate) {",
      "  const discounted = subtotal * (1 - rate);",
      "  return discounted;",
      "}",
    ],
    faultyCode: [
      "function applyDiscount(subtotal, rate) {",
      "  const discounted = subtotal * (1 - rate);",
      "  return discounted * (1 - rate); // applied again",
      "}",
    ],
    fixedCode: [
      "function applyDiscount(subtotal, rate) {",
      "  const discounted = subtotal * (1 - rate);",
      "  return discounted;",
      "}",
    ],
    explanation:
      "Return the single discounted amount. The checkout total is the source of truth and must not apply the same promotion again.",
    failingTest: "promotion is applied exactly once",
    evidence: "A 20% promotion on $96.00 should produce $76.80. The second application lowers it to $61.44.",
  },
  {
    id: "empty-checkout",
    label: "Empty-cart checkout",
    shortLabel: "Empty checkout",
    functionName: "canCheckout",
    title: "Empty carts pass checkout validation",
    severity: "Medium",
    description:
      "The checkout guard checks the wrong condition, so a cart with zero items is incorrectly treated as ready to submit.",
    expected: "false",
    faultyActual: "true",
    healthyCode: [
      "function canCheckout(items) {",
      "  return items.length > 0;",
      "}",
    ],
    faultyCode: [
      "function canCheckout(items) {",
      "  return items.length >= 0; // always true for arrays",
      "}",
    ],
    fixedCode: [
      "function canCheckout(items) {",
      "  return items.length > 0;",
      "}",
    ],
    explanation:
      "Require at least one item before enabling checkout. An empty array must fail the guard.",
    failingTest: "empty cart cannot proceed to checkout",
    evidence: "The fixture calls canCheckout([]). The faulty >= 0 check returns true for every array length.",
  },
];

export const products = [
  { id: "field-notes", name: "Field Notes Set", detail: "Grid · 3-pack", price: 24, quantity: 2 },
  { id: "desk-lamp", name: "Arc Desk Lamp", detail: "Warm white · 1 unit", price: 48, quantity: 1 },
];

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function evaluateCart(scenarioId: ScenarioId | null, fixed: boolean) {
  const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rate = scenarioId === "double-discount" ? 0.2 : 0.1;
  let total = subtotal * (1 - rate);

  if (!fixed && scenarioId === "cart-total") {
    total = subtotal - rate;
  }
  if (!fixed && scenarioId === "double-discount") {
    total *= 1 - rate;
  }

  return {
    subtotal,
    rate,
    total,
    checkoutAllowed: scenarioId === "empty-checkout" ? !fixed : true,
  };
}

export function runLocalTests(scenarioId: ScenarioId | null, fixed: boolean): TestRun {
  const startedAt = performance.now();
  const cart = evaluateCart(scenarioId, fixed);
  const expectedCartTotal = "$86.40";
  const expectedSingleDiscount = "$76.80";
  const actualCartTotal = scenarioId === "cart-total" ? money(cart.total) : expectedCartTotal;
  const actualSingleDiscount = scenarioId === "double-discount" ? money(cart.total) : expectedSingleDiscount;
  const actualEmptyCheckout = scenarioId === "empty-checkout" && !fixed ? "true" : "false";
  const assertions = [
    {
      id: "cart-total",
      name: "cart total applies percentage discount",
      expected: expectedCartTotal,
      actual: actualCartTotal,
    },
    {
      id: "discount-once",
      name: "promotion is applied exactly once",
      expected: expectedSingleDiscount,
      actual: actualSingleDiscount,
    },
    {
      id: "empty-checkout",
      name: "empty cart cannot proceed to checkout",
      expected: "false",
      actual: actualEmptyCheckout,
    },
  ] as const;
  const cases: TestResult[] = assertions.map((test) => ({
    ...test,
    status: test.actual === test.expected ? "passed" : "failed",
  }));
  const failed = cases.filter((test) => test.status === "failed").length;
  return {
    results: cases,
    passed: cases.length - failed,
    failed,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    success: failed === 0,
  };
}

export function diagnose(scenarioId: ScenarioId): Scenario {
  const scenario = scenarios.find((entry) => entry.id === scenarioId);
  if (!scenario) throw new Error(`Unknown bug scenario: ${scenarioId}`);
  return scenario;
}
