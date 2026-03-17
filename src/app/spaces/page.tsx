"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Clock, Users, BookOpen, Building } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedBackground } from "../../../components/motion-primitives/animated-background";

const spaces = [
  {
    id: 1,
    slug: "crestonridge-equity-fund-v-formation",
    name: "Crestonridge Equity Fund V Formation",
    createdBy: "Whitestone Lane",
    memberCount: 500,
    resourceCount: 5,
    type: "team" as const,
    updatedAt: "10 min ago",
    initials: "WL",
  },
  {
    id: 2,
    slug: "ma-due-diligence",
    name: "M&A Due Diligence",
    createdBy: "Cross-Border Group",
    memberCount: 8,
    resourceCount: 12,
    type: "shared" as const,
    updatedAt: "4 hours ago",
    initials: "CB",
  },
  {
    id: 3,
    slug: "client-deliverables",
    name: "Client Deliverables",
    createdBy: "Litigation Practice",
    memberCount: 5,
    resourceCount: 3,
    type: "shared" as const,
    updatedAt: "1 day ago",
    initials: "LP",
  },
  {
    id: 4,
    slug: "research-and-memos",
    name: "Research & Memos",
    createdBy: "Sarah Chen",
    memberCount: 1,
    resourceCount: 8,
    type: "personal" as const,
    updatedAt: "3 days ago",
    initials: "SC",
  },
  {
    id: 5,
    slug: "regulatory-filings",
    name: "Regulatory Filings",
    createdBy: "Compliance Team",
    memberCount: 6,
    resourceCount: 14,
    type: "team" as const,
    updatedAt: "5 hours ago",
    initials: "CT",
  },
  {
    id: 6,
    slug: "ip-portfolio-review",
    name: "IP Portfolio Review",
    createdBy: "Patent Division",
    memberCount: 4,
    resourceCount: 7,
    type: "shared" as const,
    updatedAt: "1 week ago",
    initials: "PD",
  },
  {
    id: 7,
    slug: "contract-templates",
    name: "Contract Templates",
    createdBy: "Standards Board",
    memberCount: 15,
    resourceCount: 22,
    type: "team" as const,
    updatedAt: "2 days ago",
    initials: "SB",
  },
  {
    id: 8,
    slug: "case-notes",
    name: "Case Notes",
    createdBy: "Alex Rivera",
    memberCount: 1,
    resourceCount: 2,
    type: "personal" as const,
    updatedAt: "6 hours ago",
    initials: "AR",
  },
];

export default function SpacesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const teamCount = spaces.filter(s => s.type === "team").length;
  const sharedCount = spaces.filter(s => s.type === "shared").length;

  const filteredSpaces = spaces.filter(space => {
    let tabMatch = true;
    if (activeTab === "your") {
      tabMatch = space.type === "personal" || space.type === "team";
    } else if (activeTab === "shared") {
      tabMatch = space.type === "shared";
    }

    let searchMatch = true;
    if (searchQuery.trim()) {
      try {
        const regex = new RegExp(searchQuery, 'i');
        searchMatch = regex.test(space.name) || regex.test(space.createdBy);
      } catch {
        const q = searchQuery.toLowerCase();
        searchMatch = space.name.toLowerCase().includes(q) || space.createdBy.toLowerCase().includes(q);
      }
    }

    return tabMatch && searchMatch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "team":
        return { bg: "var(--ui-gold-bg, #f1e7ca)", icon: <Building className="w-3 h-3" style={{ color: "#8B6914" }} /> };
      case "shared":
        return { bg: "var(--ui-blue-bg, #d4e4f7)", icon: <Users className="w-3 h-3" style={{ color: "#2E6AB3" }} /> };
      case "personal":
        return { bg: "var(--ui-purple-bg, #e4ddf7)", icon: <BookOpen className="w-3 h-3" style={{ color: "#6B4FC7" }} /> };
      default:
        return { bg: "var(--bg-subtle)", icon: null };
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <SidebarInset>
        <div className="h-screen flex flex-col bg-bg-base">
          {/* Page Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border-base">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 text-fg-muted" />
              </Button>
              <div className="flex items-center gap-0.5 text-sm">
                <span 
                  className="font-medium text-fg-base rounded-md"
                  style={{ padding: '4px 6px' }}
                >
                  Spaces
                </span>
                
              </div>
            </div>
            <div className="relative w-[250px] min-w-[128px] h-7">
              <div className="flex items-center justify-between w-full h-full px-2 py-1.5 bg-bg-base border border-border-base rounded-md">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-fg-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-fg-base placeholder:text-fg-muted"
                  />
                </div>
                <div className="flex items-center justify-center w-5 px-1 py-0.5 bg-bg-subtle border border-border-base rounded">
                  <span className="text-sm font-semibold text-fg-muted leading-4 tracking-tight">/</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:max-w-[1500px] xl:mx-auto flex flex-col h-full px-10">
            {/* Tabs + Create button */}
            <div style={{ paddingTop: '40px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <AnimatedBackground 
                    defaultValue={activeTab}
                    onValueChange={(value) => value && setActiveTab(value)}
                    className="bg-bg-subtle rounded-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <button
                      data-id="all"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      All spaces
                    </button>
                    <button
                      data-id="your"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Your spaces
                    </button>
                    <button
                      data-id="shared"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Shared with you
                    </button>
                  </AnimatedBackground>
                </div>
                <Button className="h-8 px-3 text-sm">
                  Create space
                </Button>
              </div>
            </div>
            
            {/* Spaces Grid */}
            <div className="flex-1 pt-4 pb-6 overflow-y-auto">
              <div className="grid grid-cols-4 gap-4">
                {filteredSpaces.map((space) => {
                  const badge = getTypeBadge(space.type);
                  return (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.slug}`}
                      className="cursor-pointer group bg-bg-base rounded-lg overflow-hidden flex flex-col border border-border-base hover:border-border-strong transition-colors no-underline"
                    >
                      {/* Top section */}
                      <div className="flex items-start justify-between p-4">
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                          {/* Logo */}
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: badge.bg }}
                          >
                            <span className="text-xs font-medium" style={{ color: 'inherit' }}>
                              {badge.icon}
                            </span>
                          </div>
                          {/* Title + subtitle */}
                          <div className="flex flex-col min-w-0">
                            <p className="text-base font-medium text-fg-base leading-6 m-0 truncate">{space.name}</p>
                            <p className="text-xs text-fg-subtle leading-4 m-0">Created by {space.createdBy}</p>
                          </div>
                        </div>
                        {/* Type tag */}
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: badge.bg }}
                        >
                          {badge.icon}
                        </div>
                      </div>

                      {/* Bottom metadata row */}
                      <div className="flex items-center gap-2 px-4 pt-4 pb-4 border-t border-border-base">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-fg-subtle" />
                          <span className="text-xs text-fg-subtle">{space.updatedAt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-fg-subtle" />
                          <span className="text-xs text-fg-subtle">{space.memberCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-fg-subtle" />
                          <span className="text-xs text-fg-subtle">{space.resourceCount} resources</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
