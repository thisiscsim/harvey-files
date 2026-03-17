"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, ArrowLeft, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "../../../components/motion-primitives/animated-background";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Default grayscale color (not selectable, used as initial state)
const defaultGrayColor = '#CCCAC6';

// Color palettes for project cards
const colorPalettes = {
  'dusty': {
    id: 'dusty',
    label: 'Dusty',
    colors: [
      { id: 'ochre', color: '#C9A05C', label: 'Muted Ochre' },
      { id: 'maroon', color: '#C17C76', label: 'Dusty Maroon' },
      { id: 'sea', color: '#6B8CA6', label: 'Muted Sea' },
      { id: 'teal', color: '#569197', label: 'Muted Teal' },
      { id: 'lavender', color: '#8A7A9E', label: 'Dusty Lavender' },
    ],
  },
  'tailwind': {
    id: 'tailwind',
    label: 'Tailwind',
    colors: [
      { id: 'amber', color: '#F59E0B', label: 'Amber 500' },
      { id: 'red', color: '#EF4444', label: 'Red 500' },
      { id: 'blue', color: '#3B82F6', label: 'Blue 500' },
      { id: 'teal', color: '#14B8A6', label: 'Teal 500' },
      { id: 'violet', color: '#8B5CF6', label: 'Violet 500' },
    ],
  },
  'brooding': {
    id: 'brooding',
    label: 'Brooding',
    colors: [
      { id: 'khaki', color: '#9E9B82', label: 'Muted Khaki' },
      { id: 'mauve', color: '#A8898A', label: 'Dusty Mauve' },
      { id: 'slate', color: '#7A8B96', label: 'Storm Slate' },
      { id: 'forest', color: '#6B7F73', label: 'Deep Forest' },
      { id: 'plum', color: '#7D6B7D', label: 'Moody Plum' },
    ],
  },
  'vibrance': {
    id: 'vibrance',
    label: 'Vibrance',
    colors: [
      { id: 'gold', color: '#C9922B', label: 'Accent Gold' },
      { id: 'olive', color: '#6B8E4E', label: 'Accent Olive' },
      { id: 'blue', color: '#4A90A4', label: 'Accent Blue' },
      { id: 'violet', color: '#5B5FC7', label: 'Brand Violet' },
      { id: 'coral', color: '#D4735E', label: 'Warm Coral' },
    ],
  },
  'skittles': {
    id: 'skittles',
    label: 'Skittles',
    editable: true,
    colors: [
      { id: 'color1', color: '#F59E0B', label: 'Color 1' },
      { id: 'color2', color: '#EF4444', label: 'Color 2' },
      { id: 'color3', color: '#3B82F6', label: 'Color 3' },
      { id: 'color4', color: '#14B8A6', label: 'Color 4' },
      { id: 'color5', color: '#8B5CF6', label: 'Color 5' },
    ],
  },
} as const;

// Default color options (for backward compatibility)
const colorOptions = colorPalettes['dusty'].colors;

// Pattern options for project card backgrounds
const patternOptions = [
  { id: 'grid', src: '/accent_filters/Grid.svg', label: 'Grid' },
  { id: 'circle', src: '/accent_filters/Circle.svg', label: 'Circle' },
  { id: 'slice', src: '/accent_filters/Slice.svg', label: 'Slice' },
] as const;

export default function VaultPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const colorPopoverRef = useRef<HTMLDivElement>(null);
  const paletteDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Random colors state for project cards
  const [projectColors, setProjectColors] = useState<Record<number, string>>({});
  const [colorsEnabled, setColorsEnabled] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof colorPalettes>('dusty');
  const [paletteDropdownOpen, setPaletteDropdownOpen] = useState(false);
  const [skittlesColors, setSkittlesColors] = useState<Record<string, string>>({
    color1: '#F59E0B',
    color2: '#EF4444',
    color3: '#3B82F6',
    color4: '#14B8A6',
    color5: '#8B5CF6',
  });

  // Get colors for the current palette (handles editable Skittles palette)
  const getCurrentPaletteColors = () => {
    if (selectedPalette === 'skittles') {
      return Object.entries(skittlesColors).map(([id, color]) => ({
        id,
        color,
        label: `Color ${id.replace('color', '')}`,
      }));
    }
    return [...colorPalettes[selectedPalette].colors];
  };

  // Generate random colors for projects based on selected palette
  const generateRandomColors = () => {
    const colors = getCurrentPaletteColors();
    const newColors: Record<number, string> = {};
    for (let i = 1; i <= 10; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      newColors[i] = randomColor.color;
    }
    setProjectColors(newColors);
  };

  // Toggle colors on/off
  const handleToggleColors = (enabled: boolean) => {
    setColorsEnabled(enabled);
    if (enabled) {
      generateRandomColors();
    }
  };

  // Handle palette selection
  const handlePaletteSelect = (paletteId: keyof typeof colorPalettes) => {
    setSelectedPalette(paletteId);
    setPaletteDropdownOpen(false);
    // If colors are enabled, regenerate with new palette
    if (colorsEnabled) {
      let colors;
      if (paletteId === 'skittles') {
        colors = Object.values(skittlesColors);
      } else {
        colors = colorPalettes[paletteId].colors.map(c => c.color);
      }
      const newColors: Record<number, string> = {};
      for (let i = 1; i <= 10; i++) {
        newColors[i] = colors[Math.floor(Math.random() * colors.length)];
      }
      setProjectColors(newColors);
    }
  };

  // Handle color change for Skittles palette
  const handleSkittlesColorChange = (colorId: string, newColor: string) => {
    const oldColor = skittlesColors[colorId];
    setSkittlesColors(prev => ({ ...prev, [colorId]: newColor }));
    
    // Update any project cards that were using the old color
    if (colorsEnabled && selectedPalette === 'skittles') {
      setProjectColors(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key].toUpperCase() === oldColor.toUpperCase()) {
            updated[key] = newColor;
          }
        }
        return updated;
      });
    }
  };

  // Keyboard shortcut 'C' to toggle color popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'c' || e.key === 'C') {
        setColorPopoverOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Auto-focus the project name input when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && projectNameInputRef.current) {
      projectNameInputRef.current.focus();
    }
  }, [isCreateDialogOpen]);

  const handleCreateProject = () => {
    // Navigate to the staging example page with the project name
    router.push(`/staging-example?name=${encodeURIComponent(newProjectName || 'Untitled')}`);
    setIsCreateDialogOpen(false);
    setNewProjectName("");
    setNewProjectDescription("");
    setSelectedColor(null);
    setSelectedPattern(null);
  };

  // Get the selected color value (defaults to gray when no selection)
  const getSelectedColorValue = () => {
    if (!selectedColor) return defaultGrayColor;
    return colorOptions.find(c => c.id === selectedColor)?.color || defaultGrayColor;
  };

  // Get the selected pattern source
  const getSelectedPatternSrc = () => {
    if (!selectedPattern) return null;
    return patternOptions.find(p => p.id === selectedPattern)?.src || null;
  };

  const projects = [
    {
      id: 1,
      name: "Stubhub IPO Filing",
      fileCount: "2,593 files",
      type: "project",
      status: ""
    },
    {
      id: 2,
      name: "M&A (US)",
      fileCount: "2,593 files",
      type: "knowledge",
      status: "Knowledge base"
    },
    {
      id: 3,
      name: "Cross-Border Tax Strategies",
      fileCount: "2,593 files",
      type: "knowledge",
      status: "Knowledge base"
    },
    {
      id: 4,
      name: "Reevo AI - Series B Financing",
      fileCount: "2,593 files",
      type: "shared",
      status: "Shared"
    },
    {
      id: 5,
      name: "Regulatory Compliance Audit",
      fileCount: "2,593 files",
      type: "project",
      status: ""
    },
    {
      id: 6,
      name: "Amend v Delta IP Litigation",
      fileCount: "2,593 files",
      type: "shared",
      status: "Shared"
    },
    {
      id: 7,
      name: "Open Ledger Merger Integration (2024)",
      fileCount: "2,593 files",
      type: "project",
      status: ""
    },
  ];

  // Count vaults and knowledge bases
  const vaultCount = projects.filter(p => p.type === "project" || p.type === "shared").length;
  const knowledgeBaseCount = projects.filter(p => p.type === "knowledge").length;

  // Filter projects based on active tab and search query
  const filteredProjects = projects.filter(project => {
    // First filter by tab
    let tabMatch = true;
    if (activeTab === "shared") {
      tabMatch = project.type === "shared";
    } else if (activeTab === "your") {
      tabMatch = project.type !== "shared"; // Show project and knowledge types
    }
    // "all" tab shows everything, so tabMatch stays true
    
    // Then filter by search query
    let searchMatch = true;
    if (searchQuery.trim()) {
      try {
        const regex = new RegExp(searchQuery, 'i'); // Case-insensitive regex
        searchMatch = regex.test(project.name);
      } catch {
        // If regex is invalid, fall back to simple string matching
        searchMatch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
    }
    
    return tabMatch && searchMatch;
  });

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
                    Vault
                  </span>
                  <span className="text-fg-muted">{vaultCount} vaults・{knowledgeBaseCount} knowledge bases</span>
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
              {/* Action Cards Section */}
            <div className="pb-0" style={{ paddingTop: '40px' }}>
              
              {/* Action Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Create Project Card */}
                <div 
                  className="border border-border-base rounded-lg p-1 hover:border-border-strong transition-colors cursor-pointer" 
                  style={{ height: '100px' }}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <div className="flex items-center justify-center gap-4 h-full">
                    <div className="p-3 bg-bg-subtle rounded-lg w-[120px] h-full flex items-center justify-center">
                      <img 
                        src="/vault_project_illustration.svg" 
                        alt="Create project" 
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg-base">Create project</p>
                      <p className="text-sm text-fg-muted">Upload a new collection of files or folders.</p>
                    </div>
                  </div>
                </div>
                  
                  {/* Create Knowledge Base Card */}
                  <div className="border border-border-base rounded-lg p-1 hover:border-border-strong transition-colors cursor-pointer" style={{ height: '100px' }}>
                    <div className="flex items-center justify-center gap-4 h-full">
                      <div className="p-3 bg-bg-subtle rounded-lg w-[120px] h-full flex items-center justify-center">
                        <img 
                          src="/knowledge_base_illustration.svg" 
                          alt="Create knowledge base" 
                          className="w-10 h-10"
                        />
                      </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg-base">Create knowledge base</p>
                      <p className="text-sm text-fg-muted">Distribute a repository of files to your organization.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs and Search */}
            <div>
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
                      All projects
                    </button>
                    <button
                      data-id="your"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Your projects
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
              </div>
            </div>
            
            {/* Projects Grid */}
            <div className="flex-1 pt-4 pb-6 overflow-y-auto">
              <div className="grid grid-cols-4 gap-4">
                {filteredProjects.map((project) => {
                  const isStubhubProject = project.name === "Stubhub IPO Filing";
                  const isReevoProject = project.name === "Reevo AI - Series B Financing";
                  const isRegulatoryProject = project.name === "Regulatory Compliance Audit";
                  const projectLink = isStubhubProject 
                    ? "/stubhub-ipo-filing" 
                    : isReevoProject 
                      ? "/reevo-ai-series-b" 
                      : isRegulatoryProject 
                        ? "/regulatory-compliance-audit" 
                        : null;
                  
                  const projectColor = colorsEnabled ? projectColors[project.id] : null;
                  
                  // Determine icon src
                  const iconSrc = project.name === "Stubhub IPO Filing" ? "/privateFolderIcon.svg" :
                    project.type === "shared" ? "/sharedFolderIcon.svg" :
                    project.type === "knowledge" ? "/knowledgeBaseIcon.svg" :
                    "/folderIcon.svg";
                  
                  const content = (
                    <div
                      className="cursor-pointer group"
                    >
                  {/* Icon container */}
                  <div 
                    className="w-full rounded-lg flex items-center justify-center mb-2.5 relative overflow-hidden" 
                    style={{ 
                      height: '162px',
                      backgroundColor: projectColor ? `${projectColor}1F` : 'var(--bg-subtle)',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    {/* Hover overlay for non-colored state */}
                    <div 
                      className="absolute inset-0 bg-transparent group-hover:bg-bg-subtle-hover transition-colors pointer-events-none"
                      style={{ opacity: projectColor ? 0 : 1 }}
                    />
                    {/* Icon with mask for color */}
                    <div 
                      className="w-[72px] h-[72px] relative z-10"
                      style={{
                        backgroundColor: projectColor || '#CCCAC6',
                        WebkitMaskImage: `url(${iconSrc})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url(${iconSrc})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        transition: 'background-color 0.3s ease',
                      }}
                    />
                  </div>
                  
                  {/* Title and menu */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-fg-base leading-tight m-0">{project.name}</p>
                      <div className="flex items-center gap-1 leading-tight">
                        <p className="text-xs text-fg-muted m-0">{project.fileCount}</p>
                        {project.status && (
                          <>
                            <span className="text-fg-disabled">•</span>
                            <p className="text-xs text-fg-muted m-0">{project.status}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                    </div>
                  );
                  
                  return projectLink ? (
                    <Link href={projectLink} key={project.id} className="block no-underline">
                      {content}
                    </Link>
                  ) : (
                    <div key={project.id}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Popover */}
        {colorPopoverOpen && (
          <div 
            ref={colorPopoverRef}
            className="fixed bg-bg-base border border-border-base overflow-hidden"
            style={{ 
              right: '24px', 
              bottom: '24px',
              width: '260px',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.1)',
            }}
          >
            {/* Toggle Section */}
            <div className="border-b border-border-base" style={{ padding: '4px 0' }}>
              <div style={{ padding: '0 8px' }}>
                <div className="flex items-center justify-between" style={{ padding: '8px', borderRadius: '6px' }}>
                  <button
                    onClick={() => handleToggleColors(!colorsEnabled)}
                    className="flex items-center cursor-pointer"
                    style={{ gap: '8px' }}
                  >
                    {/* Switch */}
                    <div className="relative" style={{ width: '26px', height: '16px' }}>
                      <div 
                        className={`absolute inset-0 rounded-full transition-colors ${
                          colorsEnabled ? 'bg-fg-base' : 'bg-border-strong'
                        }`}
                      />
                      <div 
                        className="absolute bg-bg-base rounded-full transition-all"
                        style={{ 
                          top: '2px', 
                          left: colorsEnabled ? '12px' : '2px',
                          width: '12px', 
                          height: '12px',
                          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.15)',
                        }}
                      />
                    </div>
                    <span className="text-fg-base" style={{ fontSize: '14px', lineHeight: '20px' }}>
                      Let there be colors
                    </span>
                  </button>
                  
                  {/* Refresh Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={generateRandomColors}
                    disabled={!colorsEnabled}
                    className="h-7 w-7 p-0 text-fg-muted hover:text-fg-base disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Palette Selector & Colors Section */}
            <div style={{ padding: '4px 0' }}>
              {/* Palette Dropdown */}
              <div style={{ padding: '8px' }}>
                <div className="relative">
                  <button 
                    ref={paletteDropdownButtonRef}
                    onClick={() => {
                      if (!paletteDropdownOpen && paletteDropdownButtonRef.current) {
                        const rect = paletteDropdownButtonRef.current.getBoundingClientRect();
                        setDropdownPosition({
                          top: rect.bottom + 6,
                          left: rect.left,
                          width: rect.width,
                        });
                      }
                      setPaletteDropdownOpen(!paletteDropdownOpen);
                    }}
                    className="flex items-center justify-between bg-bg-base border border-border-base w-full cursor-pointer hover:border-border-strong transition-colors"
                    style={{ padding: '6px 10px', borderRadius: '6px' }}
                  >
                    <span className="text-fg-base" style={{ fontSize: '14px', lineHeight: '20px' }}>
                      {colorPalettes[selectedPalette].label}
                    </span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="transition-transform text-fg-muted"
                      style={{ transform: paletteDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu - Using Portal */}
                  {paletteDropdownOpen && typeof document !== 'undefined' && createPortal(
                    <div 
                      className="fixed bg-bg-base border border-border-base z-[9999]"
                      style={{ 
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        borderRadius: '6px',
                        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.12)',
                        padding: '4px',
                      }}
                    >
                      {Object.values(colorPalettes).map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => handlePaletteSelect(palette.id as keyof typeof colorPalettes)}
                          className={`w-full text-left transition-colors ${
                            selectedPalette === palette.id ? 'bg-bg-subtle' : 'hover:bg-bg-subtle'
                          }`}
                          style={{ 
                            padding: '6px 8px', 
                            fontSize: '14px', 
                            lineHeight: '20px',
                            borderRadius: '4px',
                          }}
                        >
                          <span className="text-fg-base">{palette.label}</span>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Color List */}
              {getCurrentPaletteColors().map((colorItem) => (
                <div key={colorItem.id} style={{ padding: '0 8px' }}>
                  <div 
                    className="flex items-center"
                    style={{ padding: '8px', borderRadius: '6px', gap: '6px' }}
                  >
                    {/* Color Swatch - clickable for Skittles */}
                    {selectedPalette === 'skittles' ? (
                      <div 
                        className="relative shrink-0 cursor-pointer hover:ring-2 hover:ring-border-strong hover:ring-offset-1 transition-all"
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px',
                          backgroundColor: colorItem.color,
                        }}
                      >
                        <input
                          type="color"
                          value={colorItem.color}
                          onChange={(e) => handleSkittlesColorChange(colorItem.id, e.target.value.toUpperCase())}
                          className="absolute inset-0 w-full h-full cursor-pointer"
                          style={{ 
                            opacity: 0,
                          }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="shrink-0"
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px',
                          backgroundColor: colorItem.color,
                        }}
                      />
                    )}
                    <div 
                      className="flex items-center justify-between flex-1"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      <span className="text-fg-base">{colorItem.label}</span>
                      <span className="text-fg-subtle">{colorItem.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SidebarInset>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent 
          className="p-0 gap-0 overflow-hidden"
          style={{ width: '940px', height: '550px', maxWidth: '940px' }}
        >
          <div className="flex h-full">
            {/* Left Side - Form */}
            <div className="w-1/2 flex flex-col" style={{ padding: '32px 32px 24px 32px' }}>
              <DialogTitle className="font-medium text-fg-base mb-1" style={{ fontSize: '16px' }}>
                Create vault
              </DialogTitle>
              <DialogDescription className="text-fg-muted mb-6" style={{ fontSize: '14px' }}>
                Build a central repository of case-specific sources tailored to your team&apos;s needs.
              </DialogDescription>

              <div className="flex flex-col gap-4 flex-1">
                <Input
                  ref={projectNameInputRef}
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateProject();
                    }
                  }}
                  className="border-border-base focus:ring-1 focus:ring-border-strong font-normal text-fg-base placeholder:text-fg-muted"
                  style={{ height: '40px', fontSize: '14px' }}
                />
                <textarea
                  placeholder="Set description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full rounded-md border border-border-base bg-transparent px-3 py-2 text-sm text-fg-base placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-border-strong resize-y"
                  style={{ height: '100px' }}
                />
                <p className="text-sm text-fg-muted">
                  Describe what this vault should be used for
                </p>

                {/* Color Selector */}
                <div className="flex items-center gap-2 mt-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedColor(option.id)}
                      className="w-4 h-4 rounded-full transition-all flex items-center justify-center hover:scale-110"
                      style={{ 
                        backgroundColor: option.color,
                        boxShadow: selectedColor === option.id 
                          ? `0 0 0 2px var(--bg-base), 0 0 0 4px ${option.color}` 
                          : 'none'
                      }}
                      aria-label={option.label}
                    />
                  ))}
                </div>
                
                {/* Pattern Selector - Hidden for now
                <div className="flex items-center gap-1">
                  {patternOptions.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setSelectedPattern(selectedPattern === pattern.id ? null : pattern.id)}
                      className={`w-7 h-7 rounded-md border transition-all flex items-center justify-center ${
                        selectedPattern === pattern.id 
                          ? 'border-border-strong bg-bg-subtle' 
                          : 'border-border-base hover:border-border-strong hover:bg-bg-subtle'
                      }`}
                      aria-label={pattern.label}
                    >
                      <img 
                        src={pattern.src} 
                        alt={pattern.label}
                        className="w-4 h-4 opacity-60"
                        style={{ 
                          filter: 'invert(1) brightness(0.4)'
                        }}
                      />
                    </button>
                  ))}
                </div>
                */}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewProjectName("");
                    setNewProjectDescription("");
                    setSelectedColor(null);
                    setSelectedPattern(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  className="bg-fg-base text-bg-base hover:bg-fg-base/90"
                >
                  Create project
                </Button>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="w-1/2 bg-bg-subtle p-8 flex flex-col items-center justify-center border-l border-border-base">
              {/* Preview Card */}
              <div className="w-full max-w-[280px]">
                {/* Icon container */}
                <div 
                  className="w-full rounded-lg flex items-center justify-center mb-2.5 border border-border-base transition-colors relative overflow-hidden" 
                  style={{ 
                    height: '164px',
                    backgroundColor: `${getSelectedColorValue()}1F`,
                  }}
                >
                  {/* Pattern overlay - Hidden for now
                  {getSelectedPatternSrc() && (
                    <img 
                      src={getSelectedPatternSrc()!}
                      alt=""
                      className="absolute pointer-events-none opacity-50"
                      style={{
                        width: '150%',
                        height: '150%',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  */}
                  {/* Private Folder Icon with dynamic color */}
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                    <path d="M27.6104 9C29.7253 9 31.7009 10.0575 32.874 11.8174L37.3223 18.4893H60.9326C64.4263 18.4893 67.2587 21.3209 67.2588 24.8145V56.4443C67.2587 59.938 64.4263 62.7695 60.9326 62.7695H10.3262C6.83255 62.7695 4.00012 59.938 4 56.4443V15.3262C4 11.8325 6.83248 9 10.3262 9H27.6104ZM36 31C33.2386 31 31 33.2386 31 36V38H30C28.8954 38 28 38.8954 28 40V49C28 50.1046 28.8954 51 30 51H42C43.1046 51 44 50.1046 44 49V40C44 38.8954 43.1046 38 42 38H41V36C41 33.2386 38.7614 31 36 31ZM36 42C36.5523 42 37 42.4477 37 43V46C37 46.5523 36.5523 47 36 47C35.4477 47 35 46.5523 35 46V43C35 42.4477 35.4477 42 36 42ZM36 33C37.6569 33 39 34.3432 39 36V38H33V36C33 34.3432 34.3431 33 36 33Z" fill={getSelectedColorValue()}/>
                  </svg>
                </div>
                
                {/* Title and menu */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-fg-base leading-tight m-0">
                      {newProjectName.trim() || "Untitled"}
                    </p>
                    <p className="text-xs text-fg-muted m-0">0 files</p>
                  </div>
                  <Button variant="ghost" size="icon" className="p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 