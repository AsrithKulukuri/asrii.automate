import Link from "next/link";
import type { ReactNode } from "react";

export const CONTACT_EMAIL = "asrithkulkuri@gmail.com";
export function LegalPage({ title, introduction, children }: { title: string; introduction: string; children: ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
    <header className="border-b border-white/10 px-6 py-5"><div className="mx-auto max-w-3xl flex flex-wrap items-center justify-between gap-4"><Link href="/" className="font-semibold">Asrii Automate</Link><Link href="/" className="text-sm text-neutral-300 underline">Back to home</Link></div></header>
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16"><p className="text-sm text-neutral-400">Last updated: September 18, 2026</p><h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1><p className="mt-5 text-base leading-7 text-neutral-300">{introduction}</p><div className="mt-10 space-y-8 text-neutral-300 leading-7 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_a]:underline [&_a]:underline-offset-4">{children}</div></main>
    <footer className="border-t border-white/10 px-6 py-8"><nav aria-label="Legal information" className="mx-auto max-w-3xl flex flex-wrap gap-5 text-sm text-neutral-300"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/data-deletion">Data Deletion</Link><a href={"mailto:" + CONTACT_EMAIL}>Contact</a></nav></footer>
  </div>;
}
