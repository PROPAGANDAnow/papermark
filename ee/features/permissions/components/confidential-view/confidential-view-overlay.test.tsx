import React from "react";

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfidentialViewOverlay } from "./confidential-view-overlay";

test("covers confidential content with an opaque, input-blocking overlay", () => {
  const markup = renderToStaticMarkup(
    <ConfidentialViewOverlay navbarAbove={true} rotation={90} />,
  );

  assert.match(markup, /data-testid="confidential-view-overlay"/);
  assert.match(markup, /position:fixed/);
  assert.match(markup, /inset:0/);
  assert.match(markup, /background-color:rgb\(3, 7, 18\)/);
  assert.match(markup, /pointer-events:auto/);
  assert.match(markup, /z-index:2147483647/);
  assert.match(markup, /Confidential content is unavailable/);
});
