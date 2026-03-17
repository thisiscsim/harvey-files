"use client";

import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/theme-provider";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'Backspace') {
        e.preventDefault();
        localStorage.removeItem('harvey-saved-files');
        localStorage.removeItem('files-view-mode');
        toast.success('Local storage cleared');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="harvey-theme">
      <HeroUIProvider>
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
