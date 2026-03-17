"use client";

import { motion } from "framer-motion";
import { X, Search, ChevronDown, FileIcon, Upload, Share2, Edit3, MessageSquare, Square } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatedBackground } from "../../components/motion-primitives/animated-background";
import { TextShimmer } from "../../components/motion-primitives/text-shimmer";
import { cn } from "@/lib/utils";

// Agent state type
interface AgentState {
  id: string;
  isRunning: boolean;
  taskName: string;
  currentAction?: string;
  currentFile?: string;
  thinkingSteps?: string[];
  isAwaitingInput?: boolean;
  isActive?: boolean; // Whether this is the currently active chat
}

// Uploaded file type
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
}

// Custom source item for the drawer
export interface DrawerSource {
  title: string;
  icon: 'docx' | 'xlsx' | 'pdf' | 'folder' | 'sec' | 'reuters' | 'bloomberg' | 'ft' | 'vault' | 'knowledge';
  category?: string;
}

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showOverlay?: boolean;
  variant?: "embedded" | "sheet" | "panel";
  agents?: AgentState[]; // Multiple agents
  onStopAgent?: (agentId: string) => void;
  onReviewAgent?: (agentId: string) => void;
  onSwitchAgent?: (agentId: string) => void;
  // Legacy single agent support
  agentState?: AgentState;
  // Resizable width
  width?: number;
  // Disable animation during resize
  isResizing?: boolean;
  // Uploaded files
  uploadedFiles?: UploadedFile[];
  // Custom sources (overrides default SEC sources)
  customSources?: DrawerSource[];
  // Custom activities (overrides default activities)
  customActivities?: Activity[];
  // Custom artifacts for the artifacts shelf/tab
  customArtifacts?: DrawerSource[];
  // Override the active tab programmatically
  activeTabOverride?: string;
  // Currently active/open artifact title for highlighting
  activeArtifactTitle?: string;
  // Callback when an artifact card is clicked
  onArtifactClick?: (title: string, icon: string) => void;
}

// Activity type
interface Activity {
  id: string;
  type: 'create' | 'upload' | 'share' | 'rename' | 'search';
  user: string;
  action: string;
  target?: string;
  time: string;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper to get file icon path
const getFileIconPath = (fileName: string): string => {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) return '/pdf-icon.svg';
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return '/msword.svg';
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) return '/xls.svg';
  return '/file.svg';
};

export default function ConfigurationDrawer({ 
  isOpen, 
  onClose, 
  showOverlay = false,
  variant = "embedded",
  agents = [],
  onStopAgent,
  onReviewAgent,
  onSwitchAgent,
  agentState, // Legacy support
  width, // When undefined, drawer uses flex-1 to fill available space
  isResizing = false, // Disable animation during resize
  uploadedFiles = [],
  customSources,
  customActivities,
  customArtifacts,
  activeTabOverride,
  activeArtifactTitle,
  onArtifactClick
}: ConfigurationDrawerProps) {
  // Expanded = no fixed width (flex-1), minimized = fixed width (e.g. 400px)
  const isExpanded = !width;

  // Combine legacy agentState with agents array
  const allAgents = agentState?.isRunning 
    ? [{ ...agentState, id: agentState.id || 'default' }]
    : agents.filter(a => a.isRunning);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [activeTab, setActiveTab] = useState("sources");
  useEffect(() => {
    if (activeTabOverride) setActiveTab(activeTabOverride);
  }, [activeTabOverride]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [drawerScrolled, setDrawerScrolled] = useState(false);
  const [drawerContentWidth, setDrawerContentWidth] = useState(0);
  const isNarrow = drawerContentWidth > 0 && drawerContentWidth < 500;
  const drawerContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = drawerContentRef.current;
    if (!el) return;
    const handleScroll = () => setDrawerScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", handleScroll);
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setDrawerContentWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => { el.removeEventListener("scroll", handleScroll); ro.disconnect(); };
  }, [activeTab]);
  
  // Default vault-style sources for expanded grid view
  const defaultVaultSources = [
    { title: "Cross-Border Tax Strategies", icon: "knowledge" as const, color: "#CCCAC6" },
    { title: "M&A Due Diligence", icon: "vault" as const, color: "#CCCAC6" },
    { title: "Fund V — Draft LPA", icon: "docx" as const, color: "#CCCAC6" },
    { title: "Fund IV — Executed LPA", icon: "docx" as const, color: "#CCCAC6" },
    { title: "Fund IV Side Letters (74)", icon: "folder" as const, color: "#CCCAC6" },
    { title: "Fund III — Executed LPA", icon: "docx" as const, color: "#CCCAC6" },
    { title: "Fund III Side Letters (61)", icon: "folder" as const, color: "#CCCAC6" },
    { title: "Negotiation Playbook", icon: "docx" as const, color: "#CCCAC6" },
  ];

  // Sample activities (can be overridden)
  const defaultActivities: Activity[] = [
    { id: '1', type: 'search', user: 'Assistant', action: 'searched SEC.gov for', target: 'climate disclosure rules', time: 'Just now' },
    { id: '2', type: 'search', user: 'Assistant', action: 'searched', target: 'enforcement actions', time: '2m ago' },
    { id: '3', type: 'search', user: 'Assistant', action: 'analyzed', target: 'law firm analyses', time: '5m ago' },
  ];
  const activities = customActivities || defaultActivities;

  const categorizedSources = {
    "SEC.gov": [
      {
        title: "Release No. 33-11275 - Climate Disclosure Final Rule",
        url: "",
        icon: "sec",
        description: "The final rule requiring registrants to provide certain climate-related information in registration statements...",
        references: [1, 2]
      },
      {
        title: "Release No. 33-11042 - Proposed Climate Disclosure",
        url: "",
        icon: "sec",
        description: "The proposed rule on climate-related disclosures, including greenhouse gas emissions and climate risk...",
        references: [3, 4, 5]
      },
      {
        title: "Staff Bulletin No. 14L - Shareholder Proposals",
        url: "",
        icon: "sec",
        description: "SEC staff guidance on climate-related shareholder proposals and disclosure obligations...",
        references: [6]
      }
    ],
    "Web Sources": [
      {
        title: "Thomson Reuters",
        url: "thomsonreuters.com",
        icon: "reuters",
        description: "Analysis of SEC climate disclosure rules and implementation guidance for public companies...",
        references: [7, 8]
      },
      {
        title: "Bloomberg Law",
        url: "bloomberg.com",
        icon: "bloomberg",
        description: "Coverage of climate disclosure requirements and enforcement trends...",
        references: [9, 10]
      },
      {
        title: "Financial Times",
        url: "ft.com",
        icon: "ft",
        description: "Reporting on SEC climate rules and corporate compliance challenges...",
        references: [11]
      }
    ],
    "Law Firm Analyses": [
      {
        title: "Prescott & Wainwright Climate Alert",
        url: "",
        icon: "pdf",
        description: "Comprehensive analysis of final SEC climate disclosure requirements and compliance timeline...",
        references: [12, 13]
      },
      {
        title: "Stratton Fairchild Memo",
        url: "",
        icon: "pdf",
        description: "Key takeaways and practical guidance for implementing climate disclosures...",
        references: [14, 15]
      },
      {
        title: "Redstone Hamill Climate Disclosure Guide",
        url: "",
        icon: "pdf",
        description: "Step-by-step implementation guide for SEC climate disclosure compliance...",
        references: [16]
      }
    ]
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'share': return Share2;
      case 'upload': return Upload;
      case 'rename': return Edit3;
      case 'create': return FileIcon;
      case 'search': return Search;
      default: return MessageSquare;
    }
  };

  // Helper to render custom source icon
  const renderCustomSourceIcon = (iconType: string) => {
    switch (iconType) {
      case "docx":
        return <img src="/msword.svg" alt="DOCX" className="w-4 h-4 flex-shrink-0" />;
      case "xlsx":
        return <img src="/xls.svg" alt="XLSX" className="w-4 h-4 flex-shrink-0" />;
      case "pdf":
        return <img src="/pdf-icon.svg" alt="PDF" className="w-5 h-5 flex-shrink-0" />;
      case "folder":
        return <img src="/folderIcon.svg" alt="Folder" className="w-4 h-4 flex-shrink-0" />;
      case "vault":
        return <img src="/privateFolderIcon.svg" alt="Vault" className="w-4 h-4 flex-shrink-0" />;
      case "knowledge":
        return <img src="/knowledgeBaseIcon.svg" alt="Knowledge" className="w-4 h-4 flex-shrink-0" />;
      default:
        return <FileIcon className="w-4 h-4 text-fg-subtle flex-shrink-0" />;
    }
  };

  // Helper function to render source icons
  const renderSourceIcon = (iconType: string) => {
    switch (iconType) {
      case "sec":
        return (
          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[7px] font-bold">SEC</span>
          </div>
        );
      case "reuters":
        return (
          <img src="/reuters-logo.jpg" alt="Thomson Reuters" className="w-4 h-4 rounded object-cover flex-shrink-0" />
        );
      case "bloomberg":
        return (
          <img src="/bloomberg.jpg" alt="Bloomberg" className="w-4 h-4 rounded object-cover flex-shrink-0" />
        );
      case "ft":
        return (
          <img src="/fin-time-logo.png" alt="Financial Times" className="w-4 h-4 rounded object-cover flex-shrink-0" />
        );
      case "pdf":
        return (
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <img src="/pdf-icon.svg" alt="PDF" className="w-5 h-5" />
          </div>
        );
      default:
        return null;
    }
  };

  // Overview Tab Content
  // Helper: render a vault-style grid card for sources
  const renderSourceGridCard = (title: string, icon: string, color: string, key: string) => {
    const isFolder = icon === "folder" || icon === "vault" || icon === "knowledge";
    const iconSrc = icon === "vault" ? "/privateFolderIcon.svg" : icon === "knowledge" ? "/knowledgeBaseIcon.svg" : icon === "folder" ? "/folderIcon.svg" : icon === "pdf" ? "/pdf-icon.svg" : icon === "xlsx" ? "/xls.svg" : "/msword.svg";
    return (
      <div key={key} className="cursor-pointer group">
        <div 
          className="w-full rounded-lg flex items-center justify-center mb-2.5 relative overflow-hidden" 
          style={{ height: "162px", backgroundColor: "var(--bg-subtle)", transition: "background-color 0.3s ease" }}
        >
          <div className="absolute inset-0 bg-transparent group-hover:bg-bg-subtle-hover transition-colors pointer-events-none" />
          {isFolder ? (
            <div 
              className="w-[72px] h-[72px] relative z-10"
              style={{
                backgroundColor: color,
                WebkitMaskImage: `url(${iconSrc})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(${iconSrc})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          ) : (
            <div className="relative z-10 w-[90px] h-[120px] bg-white rounded shadow-xs border border-black/[0.04] p-3 overflow-hidden">
              <div className="space-y-[5px]">
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[70%]" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[85%]" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[60%]" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[75%]" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[50%]" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[80%]" />
              </div>
              <img src={iconSrc} alt="" className="absolute bottom-1.5 right-1.5 w-6 h-6 object-contain" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-fg-base leading-tight m-0 truncate">{title}</p>
          <p className="text-xs text-fg-muted leading-tight m-0">
            {icon === "vault" ? `Vault · 142 files` : icon === "knowledge" ? `Knowledge base · 2,593 files` : isFolder ? "Folder" : icon === "xlsx" ? "Excel" : "Docx"}
          </p>
        </div>
      </div>
    );
  };

  // Helper: render an artifact grid card (doc preview style)
  const renderArtifactGridCard = (title: string, icon: string, key: string) => {
    const isActive = activeArtifactTitle === title;
    return (
      <div key={key} className={cn("cursor-pointer group rounded-lg overflow-hidden transition-colors", isActive ? "border-border-strong" : "border border-border-base hover:border-border-strong")} style={isActive ? { borderWidth: '1.5px', borderStyle: 'solid' } : undefined} onClick={() => onArtifactClick?.(title, icon)}>
        <div className={cn("px-3 py-2.5 flex items-center gap-2", isActive ? "border-b border-border-strong" : "border-b border-border-base")} style={isActive ? { borderBottomWidth: '1px' } : undefined}>
          <img src={icon === "xlsx" ? "/xls.svg" : "/msword.svg"} alt="" className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-medium text-fg-base truncate">{title}</span>
        </div>
        <div className="pt-0 pb-0 relative overflow-hidden" style={{ height: 80 }}>
          {icon === "xlsx" ? (
            <table className="w-full border-collapse" style={{ fontSize: '6.5px' }}>
              <thead>
                <tr className="border-b border-border-base">
                  <th className="text-left text-fg-muted font-medium px-2 py-1 border-r border-border-base">Provision</th>
                  <th className="text-left text-fg-muted font-medium px-2 py-1 border-r border-border-base">Risk</th>
                  <th className="text-left text-fg-muted font-medium px-2 py-1 border-r border-border-base">LPs</th>
                  <th className="text-left text-fg-muted font-medium px-2 py-1">Impact</th>
                </tr>
              </thead>
              <tbody className="text-fg-subtle">
                <tr className="border-b border-border-base"><td className="px-2 py-1 border-r border-border-base">Mgmt Fee</td><td className="px-2 py-1 border-r border-border-base">High</td><td className="px-2 py-1 border-r border-border-base">22</td><td className="px-2 py-1">-$4.2M</td></tr>
                <tr className="border-b border-border-base"><td className="px-2 py-1 border-r border-border-base">Co-Invest</td><td className="px-2 py-1 border-r border-border-base">High</td><td className="px-2 py-1 border-r border-border-base">53</td><td className="px-2 py-1">Alloc. risk</td></tr>
                <tr className="border-b border-border-base"><td className="px-2 py-1 border-r border-border-base">ESG Excl.</td><td className="px-2 py-1 border-r border-border-base">Med</td><td className="px-2 py-1 border-r border-border-base">53</td><td className="px-2 py-1">Pipeline</td></tr>
                <tr className="border-b border-border-base"><td className="px-2 py-1 border-r border-border-base">Fee Offset</td><td className="px-2 py-1 border-r border-border-base">Med</td><td className="px-2 py-1 border-r border-border-base">22</td><td className="px-2 py-1">-$1.8M</td></tr>
                <tr className="border-b border-border-base"><td className="px-2 py-1 border-r border-border-base">Carry Escrow</td><td className="px-2 py-1 border-r border-border-base">Excl.</td><td className="px-2 py-1 border-r border-border-base">2</td><td className="px-2 py-1">N/A</td></tr>
              </tbody>
            </table>
          ) : (
            <div className="px-3 pt-2">
              <p className="text-[6.5px] text-fg-subtle leading-[1.45] m-0">{(() => {
                const previews = [
                  "This memorandum responds to the comment letter submitted on behalf of the Limited Partner with respect to the draft Limited Partnership Agreement. The comment letter contains discrete comments spanning multiple sections of the draft LPA. Our recommended dispositions are summarized below and detailed in the section-by-section response that follows. We have cross-referenced each comment against Fund IV and Fund III precedent to ensure consistency in our approach.",
                  "This side letter (the \"Side Letter\") sets forth certain terms and conditions agreed between the General Partner and the Limited Partner in connection with the Limited Partner's commitment to the Fund. The provisions herein supplement the Limited Partnership Agreement and shall prevail in the event of any conflict with the terms thereof. Capitalized terms used but not defined herein shall have the meanings ascribed to them in the Partnership Agreement.",
                  "The following response addresses each comment raised by counsel to the Limited Partner, organized by LPA section. Where applicable, we reference Fund IV precedent and provide our recommended disposition with supporting rationale for each item. Comments that represent departures from prior fund practice are flagged separately for partner review and strategic decision-making ahead of the next negotiation session.",
                  "This memorandum summarizes the key commercial terms negotiated between the parties in connection with the Limited Partner's subscription to the Fund. Each provision reflects the outcome of bilateral discussions and applicable MFN elections. We note that three provisions represent departures from Fund IV practice and have been flagged for the General Partner's attention in the accompanying cover memorandum.",
                  "We have reviewed the markup submitted by outside counsel and provide our analysis below. The comments principally address management fee calculations, carried interest mechanics, and governance provisions of the draft LPA. Several requests exceed what was granted in Fund IV and we recommend modified acceptance where market shifts support a narrower version of the ask rather than outright rejection.",
                  "This response memo addresses the Limited Partner's requested modifications to the Fund's investment restrictions, reporting obligations, and transfer provisions. Our recommendations reflect both Fund IV precedent and current market practice. We have identified two areas where the LP's counsel has proposed language that materially diverges from the form LPA and recommend discussion with the deal team before responding.",
                  "Re: Limited Partnership Agreement — Comment Response. We write in response to the comments submitted by counsel to the Limited Partner dated February 2026. The comments span Sections 3 through 10 of the draft LPA and include both substantive requests and conforming changes. We address each comment below in LPA section order, with cross-references to applicable Fund IV and Fund III precedent where available.",
                  "This letter agreement confirms the understanding between the General Partner and the undersigned Limited Partner regarding certain supplemental terms applicable to the Limited Partner's investment in the Fund. The terms set forth herein have been negotiated in connection with the Limited Partner's capital commitment and are subject to the Most Favored Nation provisions of the Partnership Agreement.",
                  "Memorandum — LP Comment Review and Disposition Analysis. The Limited Partner has submitted a detailed markup of the draft LPA through its outside counsel. The markup contains comments across 14 sections of the agreement. We have categorized each comment by type, mapped it to the relevant LPA provision, and assigned a recommended disposition based on Fund IV precedent, market practice, and the General Partner's stated negotiation parameters.",
                  "This memorandum provides our recommended responses to the comment letter received from the Limited Partner's counsel. The letter raises several points regarding the Fund's fee structure, distribution waterfall, key person provisions, and ESG-related investment restrictions. We have organized our response by LPA section and include, for each item, the relevant Fund IV precedent, our recommended disposition, and draft language where a modification is warranted.",
                ];
                let hash = 0;
                for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
                return previews[Math.abs(hash) % previews.length];
              })()}</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg-base to-transparent" />
        </div>
      </div>
    );
  };

  // Tree view item component
  const TreeItem = ({ title, icon, depth, isLast, hasChildren, isOpen, onToggle, children: treeChildren }: {
    title: string; icon: string; depth: number; isLast: boolean;
    hasChildren?: boolean; isOpen?: boolean; onToggle?: () => void;
    children?: React.ReactNode;
  }) => (
    <>
      <div className="flex items-center h-8 px-2 -mx-2 rounded-md hover:bg-bg-subtle cursor-pointer" onClick={onToggle}>
        <div className="flex items-center h-full flex-shrink-0">
          {/* Tree trail for nested items — 20px wide zone */}
          {depth > 0 && (
            <div className="relative w-5 h-8 flex-shrink-0">
              <img
                src={isLast ? "/tree-line-curve.svg" : "/tree-line-curve-continue.svg"}
                alt=""
                className="absolute"
                style={isLast
                  ? { width: 9, height: 17, left: 10, top: -4 }
                  : { width: 9, height: 32, left: 10, top: -4 }
                }
              />
            </div>
          )}
          {/* Icon — 16px with 2px horizontal padding */}
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 20, height: 16 }}>
            <img src={icon === "folder" ? "/folderIcon.svg" : icon === "pdf" ? "/pdf-icon.svg" : icon === "xlsx" ? "/xls.svg" : "/msword.svg"} alt="" className="w-4 h-4" />
          </div>
        </div>
        {/* Label */}
        <span className="text-[13px] text-fg-base truncate flex-1 pl-1">{title}</span>
        {/* Chevron for expandable folders */}
        {hasChildren && (
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 20, height: 24 }}>
            <ChevronDown size={14} className={cn("text-fg-muted transition-transform", !isOpen && "-rotate-90")} />
          </div>
        )}
      </div>
      {isOpen && treeChildren}
    </>
  );

  // Sources list as tree view
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const toggleFolder = (key: string) => setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));

  const renderSourcesList = () => {
    const sources = customSources || [];

    // Build tree structure from flat sources
    const treeItems: { title: string; icon: string; children?: { title: string; icon: string }[] }[] = [];
    if (sources.length > 0) {
      sources.forEach(s => {
        if (s.icon === "folder") {
          // Folder with placeholder children
          const folderChildren = s.title.includes("LP Comment") 
            ? [{ title: "UmberPension — Fund V LPA Markup.docx", icon: "docx" }, { title: "BurgundyPension — Comment Letter.pdf", icon: "docx" }, { title: "CrimsonSWF — Redline.docx", icon: "docx" }, { title: "FernSWF — Markup.docx", icon: "docx" }, { title: "BronzePension — Redline.docx", icon: "docx" }]
            : s.title.includes("Fund IV Side") 
              ? [{ title: "UmberPension Side Letter.docx", icon: "docx" }, { title: "BurgundyPension Side Letter.docx", icon: "docx" }, { title: "CrimsonSWF Side Letter.docx", icon: "docx" }]
              : s.title.includes("Fund III Side")
                ? [{ title: "UmberPension Side Letter.docx", icon: "docx" }, { title: "BurgundyPension Side Letter.docx", icon: "docx" }]
                : [];
          treeItems.push({ title: s.title, icon: s.icon, children: folderChildren });
        } else {
          treeItems.push({ title: s.title, icon: s.icon });
        }
      });
    }

    return (
      <div className="-mx-2 px-2">
        {treeItems.map((item, index) => {
          const isLast = index === treeItems.length - 1;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = expandedFolders[item.title] ?? false;
          return (
            <TreeItem
              key={`tree-${index}`}
              title={item.title}
              icon={item.icon}
              depth={0}
              isLast={isLast}
              hasChildren={hasChildren}
              isOpen={isOpen}
              onToggle={hasChildren ? () => toggleFolder(item.title) : undefined}
            >
              {hasChildren && item.children?.map((child, ci) => (
                <TreeItem
                  key={`tree-${index}-${ci}`}
                  title={child.title}
                  icon={child.icon}
                  depth={1}
                  isLast={ci === item.children!.length - 1}
                />
              ))}
            </TreeItem>
          );
        })}
      </div>
    );
  };

  // Sources grid for the expanded view
  const renderSourcesGrid = () => {
    const gridSources = (customSources || []).map((s) => ({ title: s.title, icon: s.icon, color: "#CCCAC6" }));
    return (
      <div className={cn("grid gap-3", isNarrow ? "grid-cols-2" : "grid-cols-3")}>
        {gridSources.map((source, index) => renderSourceGridCard(source.title, source.icon, source.color, `src-grid-${index}`))}
      </div>
    );
  };

  const overviewContent = (
    <div className="space-y-0">
      {/* Search bar + view switcher */}
      <div className="px-0.5 pt-2 pb-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-fg-muted" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-8 text-sm text-fg-base h-8 shadow-none"
          />
        </div>
        <div className="flex items-center flex-shrink-0">
          <AnimatedBackground
            defaultValue={viewMode}
            onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
            className="bg-bg-subtle rounded-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button data-id="grid" className="w-8 h-8 flex items-center justify-center">
              <img src="/central_icons/Dot Grid.svg" alt="Grid" className="w-[14px] h-[14px] dark:invert" />
            </button>
            <button data-id="list" className="w-8 h-8 flex items-center justify-center">
              <img src="/central_icons/List.svg" alt="List" className="w-[14px] h-[14px] dark:invert" />
            </button>
          </AnimatedBackground>
        </div>
      </div>
      {/* Data */}
      <div className="-mx-4 px-4 pt-2 relative">
        {(customSources && customSources.length > 0) ? (
          viewMode === "grid" ? (
            <div className="pb-4">{renderSourcesGrid()}</div>
          ) : (
            <div className="-mx-2 px-2 pb-4">{renderSourcesList()}</div>
          )
        ) : (
          <div className="relative overflow-hidden">
            {/* Skeleton list matching source list design */}
            <div className="-mx-2 px-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`src-skel-${i}`} className="flex items-center h-8 px-2 gap-2">
                  <div className="w-4 h-4 bg-fg-disabled/10 rounded flex-shrink-0" />
                  <div className="h-3 bg-fg-disabled/10 rounded flex-1" style={{ width: `${[75, 55, 85, 60, 70, 50, 80, 65][i]}%` }} />
                </div>
              ))}
            </div>
            {/* Gradient fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent" />
            {/* Centered empty state text */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
              <p className="text-sm font-medium text-fg-base mb-1">No sources</p>
              <p className="text-xs text-fg-muted text-center px-8">Sources will appear here when files are uploaded or referenced</p>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );

  // Sources Tab Content (full sources view)
  const sourcesContent = (
    <>
      {/* Search and Filter Section */}
      <div className="px-0.5 pt-4 pb-4">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <Input
              type="text"
              placeholder="Search sources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm text-fg-base h-8 shadow-none"
            />
          </div>
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-3 h-7 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle transition-colors">
                <span className="text-sm text-fg-base">{filterType}</span>
                <ChevronDown className="h-4 w-4 text-fg-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setFilterType("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("SEC")}>
                SEC
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Web")}>
                Web
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Documents")}>
                Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Separator after search section */}
      <div className="border-t border-border-base -mx-4 mb-4" />
      
      {/* Categorized Sources List */}
      <div className="mt-2">
        {Object.entries(categorizedSources).map(([category, sources], categoryIndex) => (
          <div key={category}>
            {categoryIndex > 0 && (
              <div className="border-t border-border-base my-4 -mx-4" />
            )}
            <div className="px-0.5">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-medium text-fg-muted">{category}</h3>
              </div>
              
              {/* Sources in Category */}
              <div className="space-y-0.5">
                {sources.map((source, index) => {
                  const isWebSource = category === "Web Sources" && source.url;
                  const content = (
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {renderSourceIcon(source.icon)}
                          <h4 className="font-medium text-fg-base" style={{ fontSize: '12px' }}>
                            {source.title}
                          </h4>
                          {source.url && (
                            <>
                              <span className="text-fg-muted" style={{ fontSize: '12px' }}>•</span>
                              <span className="text-fg-subtle" style={{ fontSize: '12px' }}>
                                {source.url}
                              </span>
                            </>
                          )}
                        </div>
                        {source.description && (
                          <p className="text-fg-subtle leading-relaxed mb-2" style={{ fontSize: '12px' }}>
                            {source.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1">
                          {source.references.map((ref, refIndex) => (
                            <button
                              key={refIndex}
                              className="inline-flex items-center justify-center border border-border-base bg-bg-subtle hover:bg-bg-subtle-pressed text-fg-subtle font-medium transition-colors"
                              style={{ 
                                width: '14px', 
                                height: '14px',
                                fontSize: '10px',
                                lineHeight: '1',
                                borderRadius: '4px'
                              }}
                            >
                              {ref}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );

                  if (isWebSource) {
                    return (
                      <a
                        key={index}
                        href={`https://${source.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-mx-2 px-2 py-2.5 hover:bg-bg-subtle rounded-md transition-colors cursor-pointer block"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <div key={index} className="-mx-2 px-2 py-2.5 hover:bg-bg-subtle rounded-md transition-colors cursor-pointer">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View all link */}
      <div className="mt-6 pt-4 border-t border-border-base -mx-4 px-4">
        <div className="px-0.5">
          <button className="h-[24px] px-2 text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle rounded-[6px] transition-colors flex items-center gap-1">
            View all
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  // Configurations Tab Content
  const configurationsContent = (
    <div className="space-y-0">
      {/* Memory - Empty State */}
      <div className="pt-2 pb-5">
        <div className="flex items-center justify-between h-[44px]">
          <span className="text-xs font-medium text-fg-base leading-[20px]">Memory</span>
        </div>
        <div className="flex flex-col gap-3 items-center justify-center">
          <div className="h-[92px] w-[100px] flex items-center justify-center">
            <img src="/memory_cube.svg" alt="Memory" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-fg-muted leading-4 text-center">
            Memory will automatically build up over time as you start working and generating more queries
          </p>
        </div>
      </div>
      
      {/* Instructions - Empty State */}
      <div className="border-t border-border-base -mx-4 px-4 pt-2 pb-5">
        <div className="flex items-center justify-between h-[44px]">
          <span className="text-xs font-medium text-fg-base leading-[20px]">Instructions</span>
          <button 
            className="h-[24px] px-[6px] py-[2px] text-xs font-medium text-fg-subtle hover:text-fg-base transition-colors leading-4"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-3 items-center justify-center">
          <div className="h-[92px] w-[92px] flex items-center justify-center">
            <img src="/instruction_lines.svg" alt="Instructions" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-fg-muted leading-4 text-center">
            Provide Harvey with relevant instructions and information for queries within this vault.
          </p>
        </div>
      </div>
    </div>
  );

  // Activity Tab Content
  const activityContent = (
    <div className="pt-2">
      {activities.length > 0 ? (
        <div className="relative">
          {activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            const isLast = index === activities.length - 1;
            return (
              <div key={activity.id} className="flex gap-2 relative">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-4 h-4 flex items-center justify-center bg-bg-base z-10">
                    <IconComponent className="w-4 h-4 text-fg-subtle" />
                  </div>
                  {!isLast && (
                    <div className="w-px bg-border-base flex-1 min-h-[20px]" />
                  )}
                </div>
                <div className={`flex-1 ${!isLast ? 'pb-3' : ''}`}>
                  <p className="text-xs text-fg-subtle leading-4">
                    <span>{activity.user}</span>
                    {' '}{activity.action}{' '}
                    {activity.target && <span className="font-medium">{activity.target}</span>}
                    {' '}<span className="text-fg-muted">· {activity.time}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center justify-center py-8">
          <p className="text-xs text-fg-muted leading-4 text-center px-4">
            Activity will appear here as work happens in this space
          </p>
        </div>
      )}
    </div>
  );

  // Artifacts Tab Content
  const artifactsContent = (
    <div className="pb-5">
      {/* Search bar + view switcher */}
      <div className="px-0.5 pt-2 pb-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-fg-muted" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-8 text-sm text-fg-base h-8 shadow-none"
          />
        </div>
        <div className="flex items-center flex-shrink-0">
          <AnimatedBackground
            defaultValue={viewMode}
            onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
            className="bg-bg-subtle rounded-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button data-id="grid" className="w-8 h-8 flex items-center justify-center">
              <img src="/central_icons/Dot Grid.svg" alt="Grid" className="w-[14px] h-[14px] dark:invert" />
            </button>
            <button data-id="list" className="w-8 h-8 flex items-center justify-center">
              <img src="/central_icons/List.svg" alt="List" className="w-[14px] h-[14px] dark:invert" />
            </button>
          </AnimatedBackground>
        </div>
      </div>
      {customArtifacts && customArtifacts.length > 0 ? (
        viewMode === "grid" ? (
          <div className={cn("grid gap-3", isNarrow ? "grid-cols-2" : "grid-cols-3")}>
            {customArtifacts.map((artifact, index) => renderArtifactGridCard(artifact.title, artifact.icon, `art-tab-grid-${index}`))}
          </div>
        ) : (
          <div className="-mx-2 px-2">
            {customArtifacts.map((artifact, index) => {
              const isActive = activeArtifactTitle === artifact.title;
              return (
                <div key={`art-tab-${index}`} className={cn("flex items-center h-8 px-2 -mx-2 rounded-md transition-colors cursor-pointer", isActive ? "bg-bg-subtle" : "hover:bg-bg-subtle")} style={isActive ? { outline: '1.5px solid var(--border-strong)', outlineOffset: '-1.5px' } : undefined} onClick={() => onArtifactClick?.(artifact.title, artifact.icon)}>
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 20, height: 16 }}>
                    {renderCustomSourceIcon(artifact.icon)}
                  </div>
                  <span className={cn("text-[13px] truncate flex-1 pl-1", isActive ? "text-fg-base font-medium" : "text-fg-base")}>{artifact.title}</span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="relative overflow-hidden">
          {/* Skeleton grid matching artifact card design */}
          <div className={cn("grid gap-3", isNarrow ? "grid-cols-2" : "grid-cols-3")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skel-${i}`} className="border border-border-base rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border-base flex items-center gap-2">
                  <div className="w-4 h-4 bg-fg-disabled/10 rounded flex-shrink-0" />
                  <div className="h-3 bg-fg-disabled/10 rounded flex-1" style={{ width: `${[75, 60, 85, 70, 55, 65][i]}%` }} />
                </div>
                <div className="px-3 py-2.5">
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-fg-disabled/10 rounded-full w-full" />
                    <div className="h-1.5 bg-fg-disabled/10 rounded-full w-4/5" />
                    <div className="h-1.5 bg-fg-disabled/10 rounded-full w-3/5" />
                    <div className="h-1.5 bg-fg-disabled/10 rounded-full w-full" />
                    <div className="h-1.5 bg-fg-disabled/10 rounded-full w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Gradient fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent" />
          {/* Centered empty state text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
            <p className="text-sm font-medium text-fg-base mb-1">No outputs</p>
            <p className="text-xs text-fg-muted text-center px-8">Outputs will be generated here as they are created</p>
          </div>
        </div>
      )}
    </div>
  );

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "sources":
        return overviewContent;
      case "work-product":
        return artifactsContent;
      case "settings":
        return configurationsContent;
      default:
        return overviewContent; // sources tab
    }
  };

  // Panel variant - just returns the content without wrapper
  if (variant === "panel") {
    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-fg-disabled scrollbar-track-transparent" style={{ width: '400px' }}>
          {renderTabContent()}
        </div>
      </div>
    );
  }

  // Embedded variant - inline in flex layout (no transitions to avoid conflicts with other panel animations)
  if (!isOpen) return null;
  
  return (
    <div
      className={cn("h-full bg-bg-base flex flex-col overflow-hidden", width ? "flex-shrink-0" : "flex-1")}
      style={width ? { width } : undefined}
    >
      {/* Header with segmented controls and close button */}
      <div className="px-3 py-3 flex items-center flex-shrink-0 relative z-10 gap-2" style={{ height: '52px' }}>
        <div className="flex-1 min-w-0 relative">
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            <div className="flex flex-nowrap shrink-0">
              <AnimatedBackground 
                defaultValue={activeTab}
                onValueChange={(value) => value && setActiveTab(value)}
                className="bg-bg-subtle rounded-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <button
                  data-id="sources"
                  className="relative px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                >
                  Sources
                </button>
                <button
                  data-id="work-product"
                  className="relative px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                >
                  Outputs
                </button>
                <button
                  data-id="settings"
                  className="relative px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                >
                  Settings
                </button>
              </AnimatedBackground>
            </div>
          </div>
          {/* Right fade gradient for overflow */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg-base to-transparent pointer-events-none" />
        </div>
      </div>
      
      {/* Scroll gradient below header */}
      <div className={`h-8 bg-gradient-to-b from-bg-base to-transparent pointer-events-none -mb-8 relative z-[5] transition-opacity duration-300 ${drawerScrolled ? "opacity-100" : "opacity-0"}`} />

      {/* Content with custom scrollbar */}
      <div ref={drawerContentRef} className="flex-1 overflow-y-auto px-4">
        {renderTabContent()}
      </div>
    </div>
  );
}
