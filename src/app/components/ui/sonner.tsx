"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/** Dark zinc theme to match game room (bg-zinc-900) - app is always dark */
const DARK_CLASSES = {
  toast: "group toast group-[.toaster]:bg-zinc-800 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-600/50 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:rounded-xl group-[.toaster]:py-3 group-[.toaster]:px-4",
  description: "group-[.toast]:text-zinc-400 group-[.toast]:text-sm",
  actionButton: "group-[.toast]:bg-violet-600 group-[.toast]:text-white group-[.toast]:hover:bg-violet-500 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
  cancelButton: "group-[.toast]:bg-zinc-700 group-[.toast]:text-zinc-300 group-[.toast]:hover:bg-zinc-600 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
  error: "group-[.toaster]:bg-zinc-800 group-[.toaster]:text-red-400 group-[.toaster]:border-red-500/40",
  success: "group-[.toaster]:bg-zinc-800 group-[.toaster]:text-emerald-400 group-[.toaster]:border-emerald-500/40",
  warning: "group-[.toaster]:bg-zinc-800 group-[.toaster]:text-amber-400 group-[.toaster]:border-amber-500/40",
  info: "group-[.toaster]:bg-zinc-800 group-[.toaster]:text-violet-300 group-[.toaster]:border-violet-500/40",
};

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const effectiveTheme = (theme === "light" ? "light" : "dark") as ToasterProps["theme"];

  return (
    <Sonner
      theme={effectiveTheme}
      className="toaster group"
      toastOptions={{
        ...toastOptions,
        classNames: { ...DARK_CLASSES, ...toastOptions?.classNames },
      }}
      {...props}
    />
  );
};

export { Toaster };
