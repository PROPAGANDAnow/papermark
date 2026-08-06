import React from "react";

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RequestListView } from "./request-list-view";

test("renders a protected unavailable state without task controls", () => {
  const markup = renderToStaticMarkup(
    <RequestListView dataroomId="dataroom-id" />,
  );

  assert.match(markup, /Request List is not available/);
  assert.doesNotMatch(markup, /<form\b/i);
  assert.doesNotMatch(markup, /Create task/i);
});
