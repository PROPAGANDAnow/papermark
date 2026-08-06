import AppLayout from "@/components/layouts/app";

/**
 * Premium analytics UI is intentionally unavailable in this distribution.
 * Keep this route data-free rather than falling back to analytics endpoints,
 * which could disclose viewer or document activity without its original
 * authorization and entitlement checks.
 */
export default function DataroomAnalyticsPage() {
  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-4 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Data Room Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Analytics are currently unavailable.
          </p>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          This page does not load viewer, document, or activity analytics while
          the analytics feature is unavailable.
        </p>
      </main>
    </AppLayout>
  );
}
