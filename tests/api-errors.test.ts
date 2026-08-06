import assert from "node:assert/strict";
import test from "node:test";

import { PapermarkApiError, getApiErrorResponse } from "../lib/api/errors";

test("returns only the explicit public error message for typed API errors", () => {
  const error = new PapermarkApiError(
    "unprocessable_entity",
    "The document URL is invalid.",
  );

  assert.equal(error.name, "PapermarkApiError");
  assert.equal(error.code, "unprocessable_entity");
  assert.equal(error.statusCode, 422);
  assert.deepEqual(getApiErrorResponse(error), {
    status: 422,
    body: {
      error: "The document URL is invalid.",
      code: "unprocessable_entity",
    },
  });
});

test("does not expose untyped internal error details", () => {
  const internalError = new Error("S3 credentials: secret-value");

  assert.deepEqual(getApiErrorResponse(internalError), {
    status: 500,
    body: {
      error: "Internal Server Error",
      code: "internal_server_error",
    },
  });
});
