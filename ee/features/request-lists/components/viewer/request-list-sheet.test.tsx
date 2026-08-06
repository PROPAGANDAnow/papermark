import React from "react";

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RequestListSheet } from "./request-list-sheet";

test("fails closed and renders no viewer request-list UI", () => {
  const markup = renderToStaticMarkup(
    <RequestListSheet
      linkId="link-id"
      dataroomId="dataroom-id"
      viewId="view-id"
      viewerId="viewer-id"
      isOpen={true}
      onOpenChange={() => {
        throw new Error("fallback must not change viewer state");
      }}
    />,
  );

  assert.equal(markup, "");
});
