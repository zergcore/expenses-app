"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FileQuestion, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-neutral-950 via-zinc-900 to-neutral-950 text-white p-4 relative overflow-hidden">
      {/* Background radial glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
        {/* Animated Icon container */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
            <FileQuestion className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        {/* Text Details */}
        <span className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-2">
          Error 404
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-zinc-100 to-zinc-400 mb-4">
          {t("title")}
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
          {t("description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t("goToDashboard")}
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:text-white font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <Home className="w-4 h-4" />
            {t("goBack")}
          </Link>
        </div>

        {/* Subtle Decorative Footer */}
        <div className="mt-12 text-zinc-600 text-xs">
          <span>&copy; {new Date().getFullYear()} Fin. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
