import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Job Assist",
  description: "Personal job search assistant and application tracker",
  robots: { index: false, follow: false },
};

const themeScript = `(function(){try{var t=localStorage.getItem("job-assist-theme");if(t==="dark"||(t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans">{children}<Toaster /></body>
    </html>
  );
}
