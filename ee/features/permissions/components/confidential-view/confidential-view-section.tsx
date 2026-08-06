import type { Dispatch, SetStateAction } from "react";

import type { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import type { LinkUpgradeOptions } from "@/components/links/link-sheet/link-options";

/**
 * The confidential-view viewer enforcement implementation is not available in
 * this distribution. Do not render a toggle that would imply protection which
 * cannot be enforced. Existing persisted link settings are left untouched.
 */
export function shouldRenderConfidentialViewControl(): false {
  return false;
}

type ConfidentialViewSectionProps = {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: (options: LinkUpgradeOptions) => void;
};

export default function ConfidentialViewSection(
  _props: ConfidentialViewSectionProps,
) {
  if (!shouldRenderConfidentialViewControl()) {
    return null;
  }

  return null;
}
