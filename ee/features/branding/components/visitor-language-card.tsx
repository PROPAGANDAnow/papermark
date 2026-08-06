import { CrownIcon } from "lucide-react";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocaleCode,
  asSupportedLocale,
} from "@/lib/i18n/locales";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VisitorLanguageCardProps = {
  defaultLanguage: SupportedLocaleCode;
  onDefaultLanguageChange: (language: SupportedLocaleCode) => void;
  hasAccess: boolean;
};

/**
 * Lets an admin select one curated viewer locale. Values are narrowed back to
 * the supported locale allowlist before state changes, even though the select
 * only renders values from that same list.
 */
export function VisitorLanguageCard({
  defaultLanguage,
  onDefaultLanguageChange,
  hasAccess,
}: VisitorLanguageCardProps) {
  const onValueChange = (value: string) => {
    const locale = asSupportedLocale(value);
    if (!locale || (!hasAccess && locale !== DEFAULT_LOCALE)) return;

    onDefaultLanguageChange(locale);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="visitor-default-language">Visitor language</Label>
            {!hasAccess ? (
              <CrownIcon
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-label="Data Rooms Plus feature"
              />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Choose the language shown to every visitor. Visitors cannot change
            this setting themselves.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitor-default-language">Default language</Label>
          <Select value={defaultLanguage} onValueChange={onValueChange}>
            <SelectTrigger id="visitor-default-language">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LOCALES.map((locale) => (
                <SelectItem
                  key={locale.code}
                  value={locale.code}
                  disabled={!hasAccess && locale.code !== DEFAULT_LOCALE}
                >
                  {locale.nativeName} ({locale.englishName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasAccess ? (
            <p className="text-xs text-muted-foreground">
              English is included. Upgrade to Data Rooms Plus to select another
              supported language.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
