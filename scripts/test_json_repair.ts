import { repairPartialJson, parsePartialJson } from "../src/utils/jsonRepair";

const tests = [
  {
    name: "Mid-Key",
    input: `{"ui_type":"results","primary_q`,
    expectedType: "null",
  },
  {
    name: "Mid-Value",
    input: `{"ui_type":"results","primary_query":"Minimalist Whi`,
    expectedType: "object",
  },
  {
    name: "Mid-Array",
    input: `{"ui_type":"results","recommended_products":[{"name":"Jacket", "price":`,
    expectedType: "null",
  },
  {
    name: "Mid-Nested Object",
    input: `{"ui_type":"clarifying_question","clarifyingQuestion":{"question":"What is`,
    expectedType: "object",
  },
  {
    name: "Escaped Quotes in String",
    input: `{"summary":"He said \\"hello\\" an`,
    expectedType: "object",
  },
];

let failed = 0;

for (const t of tests) {
  console.log(`Testing: ${t.name}`);
  const repaired = repairPartialJson(t.input);
  console.log(`  Input:    ${t.input}`);
  console.log(`  Repaired: ${repaired}`);
  
  const parsed = parsePartialJson(t.input);
  const type = parsed === null ? "null" : typeof parsed;
  if (type === t.expectedType) {
    console.log(`  Result:   SUCCESS\n`);
  } else {
    console.log(`  Result:   FAILED (Expected: ${t.expectedType}, Got: ${type}, Parsed output: ${JSON.stringify(parsed)})\n`);
    failed++;
  }
}

if (failed === 0) {
  console.log("All JSON repair tests passed successfully.");
  process.exit(0);
} else {
  console.error(`${failed} tests failed.`);
  process.exit(1);
}
