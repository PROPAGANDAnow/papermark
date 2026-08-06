import assert from "node:assert/strict";
import test from "node:test";

import { CURRENCY_LABEL, CURRENCY_SYMBOL } from "../ee/stripe/currency";

test("provides display labels and symbols for the supported billing currencies", () => {
  assert.deepEqual(CURRENCY_LABEL, { eur: "EUR", usd: "USD" });
  assert.deepEqual(CURRENCY_SYMBOL, { eur: "€", usd: "$" });
});
