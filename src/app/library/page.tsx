"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export default function LibraryPage() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <SidebarInset>
        <div className="h-screen flex flex-col bg-bg-base">
          <div className="w-full xl:max-w-[1500px] xl:mx-auto flex flex-col h-full px-10">
            {/* Header */}
            <div className="pb-0" style={{ paddingTop: '40px' }}>
              <h1 className="text-2xl font-semibold text-fg-base">Library</h1>
              <p className="text-sm text-fg-muted mt-1">Access your saved documents and resources</p>
            </div>
            
            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-fg-muted">No items in library yet</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}

