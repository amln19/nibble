import type { Metadata, Viewport } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GooseMascot } from "@/components/GooseMascot";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nibble — Discover recipes",
    template: "%s · Nibble",
  },
  description:
    "Swipe through recipes, save your favorites, and cook with what you have.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const ANTI_FLASH_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('nibble-theme');
    if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground transition-colors selection:bg-primary/20 selection:text-foreground">
        <ThemeProvider>
          <Nav />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <GooseMascot />
        </ThemeProvider>
      </body>
    </html>
  );
}
