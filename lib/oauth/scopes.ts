// Scopes exposed by the public API token settings UI. Keep this allowlist small:
// token creation validates against these values, so adding a scope grants it to
// dashboard-created tokens.
export const PRESET_SCOPES = ["apis.all", "apis.read"] as const;

// Granular resource scopes available in the token settings UI. Analytics and
// visitors are intentionally read-only because the UI exposes no write action
// for either resource.
export const GRANULAR_SCOPES = [
  "documents.read",
  "documents.write",
  "links.read",
  "links.write",
  "datarooms.read",
  "datarooms.write",
  "analytics.read",
  "visitors.read",
] as const;
