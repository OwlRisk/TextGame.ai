"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-900 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-2xl group-[.toaster]:py-4 group-[.toaster]:px-5",
          description: "group-[.toast]:text-zinc-600 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-violet-600 group-[.toast]:text-white group-[.toast]:hover:bg-violet-700 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-700 group-[.toast]:hover:bg-zinc-200 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium",
          error: "group-[.toaster]:bg-white group-[.toaster]:text-red-600 group-[.toaster]:border-red-100",
          success: "group-[.toaster]:bg-white group-[.toaster]:text-emerald-600 group-[.toaster]:border-emerald-100",
          warning: "group-[.toaster]:bg-white group-[.toaster]:text-amber-600 group-[.toaster]:border-amber-100",
          info: "group-[.toaster]:bg-white group-[.toaster]:text-indigo-600 group-[.toaster]:border-indigo-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
