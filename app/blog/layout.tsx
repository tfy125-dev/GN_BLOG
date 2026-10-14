import { Suspense } from "react";
import { SiteHeader } from "@/app/site-header";
import { siteName } from "@/lib/site";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Suspense
        fallback={
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6 text-sm text-zinc-500">
              {siteName}
            </div>
          </header>
        }
      >
        <SiteHeader />
      </Suspense>
      {children}
    </div>
  );
}
