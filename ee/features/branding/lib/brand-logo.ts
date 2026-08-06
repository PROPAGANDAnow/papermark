export type BrandLogoFields = {
  logo?: string | null;
  hideLogo?: boolean | null;
};

export type ResolvedBrandLogo =
  | { kind: "custom"; src: string }
  | { kind: "papermark" }
  | { kind: "none" };

function isSafeStaticAssetPath(value: string): boolean {
  if (!value.startsWith("/_static/")) return false;

  try {
    const parsed = new URL(value, "https://papermark.invalid");
    return (
      parsed.origin === "https://papermark.invalid" &&
      parsed.pathname.startsWith("/_static/")
    );
  } catch {
    return false;
  }
}

/**
 * Branding assets are rendered on unauthenticated public pages. Only retain
 * HTTPS URLs (or first-party static assets) so stored branding cannot turn
 * into a javascript:, data:, protocol-relative, or mixed-content source.
 */
export function isSafeBrandAssetUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value || value !== value.trim()) {
    return false;
  }

  if (isSafeStaticAssetPath(value)) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/** Resolve the sole logo state public viewers should render. */
export function resolveBrandLogo(
  brand: BrandLogoFields | null | undefined,
): ResolvedBrandLogo {
  if (brand?.hideLogo) return { kind: "none" };

  if (isSafeBrandAssetUrl(brand?.logo)) {
    return { kind: "custom", src: brand.logo };
  }

  return { kind: "papermark" };
}

/**
 * Apply a dataroom's nullable overrides to the team defaults. A null
 * dataroom value deliberately inherits; false is an explicit override of a
 * hidden team logo.
 */
export function mergeBrandLogoFields({
  dataroom,
  team,
}: {
  dataroom?: BrandLogoFields | null;
  team?: BrandLogoFields | null;
}): Required<BrandLogoFields> {
  return {
    logo: dataroom?.logo ?? team?.logo ?? null,
    hideLogo: dataroom?.hideLogo ?? team?.hideLogo ?? false,
  };
}
