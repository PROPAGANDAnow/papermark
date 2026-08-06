const hostnameFromHostHeader = (host: string) =>
  host.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "").split(":")[0];

export const isApplicationHost = (
  requestHost: string | null | undefined,
  applicationHost: string | null | undefined,
) => {
  if (!requestHost || !applicationHost) return false;

  return (
    hostnameFromHostHeader(requestHost) ===
    hostnameFromHostHeader(applicationHost)
  );
};
