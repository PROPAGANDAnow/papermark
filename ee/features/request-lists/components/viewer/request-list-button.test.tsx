import React from "react";

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RequestListButton } from "./request-list-button";

test("fails closed and renders no request-list trigger", () => {
  const markup = renderToStaticMarkup(
    <RequestListButton className="viewer-control" />,
  );

  assert.equal(markup, "");
});
