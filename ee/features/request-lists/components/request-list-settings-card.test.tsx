import React from "react";

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RequestListSettingsCard } from "./request-list-settings-card";

test("renders the authorized Request List setting without changing it during render", () => {
  const markup = renderToStaticMarkup(
    <RequestListSettingsCard
      dataroomId="dataroom-id"
      teamId="team-id"
      requestListEnabled={false}
    />,
  );

  assert.match(markup, /Request List/);
  assert.match(markup, /Enable Request List/);
  assert.match(markup, /role="switch"/);
  assert.match(markup, /aria-checked="false"/);
});
