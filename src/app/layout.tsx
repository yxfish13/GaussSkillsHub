import type { ReactNode } from "react";

export const metadata = {
  title: "Skills Hub",
  description: "Submit, review, and publish vetted skills."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">
        <div className="min-h-screen border-t-4 border-signal">
          <header className="px-6 py-8 flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-signal">skills hub</p>
              <h1 className="font-display text-3xl">Editorial Archive</h1>
            </div>
            <a
              href="/submit"
              className="rounded-full border border-signal px-4 py-2 font-semibold text-sm transition hover:bg-signal hover:text-white"
            >
              Submit a Skill
            </a>
          </header>
          <main className="px-6 pb-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
