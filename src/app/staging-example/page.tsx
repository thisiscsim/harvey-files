"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { 
  ArrowLeft, Users, Briefcase, ChevronRight,
  FileIcon, MessageSquare, Upload, Share2, Edit3,
  Scale, Paperclip, Mic, CornerDownLeft, CloudUpload, FolderPlus, SlidersHorizontal
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { SvgIcon } from "@/components/svg-icon";
import { AnimatedBackground } from "../../../components/motion-primitives/animated-background";
import { TextLoop } from "../../../components/motion-primitives/text-loop";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";

// Category options with their dot colors
const categoryOptions = [
  { label: 'Collaboration Agreement', color: '#CE5347' },
  { label: 'Court Filing', color: '#638DE0' },
  { label: 'Balance Sheet', color: '#F2D646' },
  { label: 'Capitalization Table', color: '#93C5FD' },
  { label: 'Bond', color: '#86EFAC' },
] as const;

// Types for file management
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  category?: { label: string; color: string };
}

// Types for activity tracking
interface Activity {
  id: string;
  type: 'create' | 'upload' | 'share' | 'rename';
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

// Helper to get file icon path based on file name/type
const getFileIconPath = (fileName: string, mimeType: string): string => {
  const lowerName = fileName.toLowerCase();
  const lowerType = mimeType.toLowerCase();
  
  // Check by file extension first
  if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) {
    return '/pdf-icon.svg';
  }
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerType.includes('word') || lowerType.includes('document')) {
    return '/docx-icon.svg';
  }
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv') || 
      lowerType.includes('spreadsheet') || lowerType.includes('excel') || lowerType.includes('csv')) {
    return '/xlsx-icon.svg';
  }
  
  // Default to generic file icon
  return '/file.svg';
};

// Column helper for TanStack Table
const columnHelper = createColumnHelper<UploadedFile>();

// Sample people with access
const peopleWithAccess = [
  { id: '1', email: 'you@company.com', access: 'Edit access', initial: 'Y' },
];

// Sample activity
// Initial activity (will be augmented by state)
const initialActivities: Activity[] = [
  { id: '1', type: 'create', user: 'you@company.com', action: 'created the vault', time: 'Just now' },
];

function StagingExampleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial title from URL query params, default to "Untitled"
  const initialTitle = searchParams.get('name') || 'Untitled';
  
  const [projectName, setProjectName] = useState(initialTitle);
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Configuration panel state - default to collapsed for new projects
  const [isConfigPanelCollapsed, setIsConfigPanelCollapsed] = useState(true);
  
  // Instructions dialog state
  const [isInstructionsDialogOpen, setIsInstructionsDialogOpen] = useState(false);
  
  // File management state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Activity state
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  
  // Simulate file upload progress
  const simulateUpload = useCallback((fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => {
        const file = prev.find(f => f.id === fileId);
        if (!file || file.uploadProgress >= 100) {
          clearInterval(uploadInterval);
          return prev;
        }
        
        // Random progress increment (faster simulation)
        const increment = Math.random() * 15 + 5;
        const newProgress = Math.min(file.uploadProgress + increment, 100);
        
        return prev.map(f => {
          if (f.id === fileId) {
            if (newProgress >= 100) {
              // Upload complete, start "processing"
              setTimeout(() => {
                setFiles(p => p.map(pf => 
                  pf.id === fileId ? { ...pf, status: 'processing' as const } : pf
                ));
                // Simulate processing time
                setTimeout(() => {
                  setFiles(p => p.map(pf => 
                    pf.id === fileId ? { ...pf, status: 'completed' as const } : pf
                  ));
                }, 500 + Math.random() * 1000);
              }, 100);
            }
            return { ...f, uploadProgress: newProgress };
          }
          return f;
        });
      });
    }, 100);
  }, []);
  
  // Handle files being dropped or selected
  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'uploading' as const,
      uploadedAt: new Date(),
      category: categoryOptions[Math.floor(Math.random() * categoryOptions.length)],
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Add activity for uploaded files
    const fileNames = Array.from(fileList).map(f => f.name);
    const activityTarget = fileNames.length === 1 
      ? fileNames[0] 
      : `${fileNames.length} files`;
    
    const newActivity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'upload',
      user: 'you@company.com',
      action: 'uploaded',
      target: activityTarget,
      time: 'Just now',
    };
    
    setActivities(prev => [newActivity, ...prev]);
    
    // Start upload simulation for each file
    newFiles.forEach(file => {
      simulateUpload(file.id);
    });
  }, [simulateUpload]);
  
  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  }, [handleFiles]);
  
  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  
  // Toggle row selection
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Toggle all rows selection
  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === files.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(files.map(f => f.id)));
    }
  }, [files, selectedRows.size]);
  
  // TanStack Table columns
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => {
        const file = info.row.original;
        const iconPath = getFileIconPath(file.name, file.type);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <img src={iconPath} alt="" className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm text-fg-base truncate leading-5">{info.getValue()}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => {
        const category = info.getValue();
        if (!category) return null;
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-bg-subtle rounded">
            <div 
              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: category.color }}
            />
            <span className="text-xs font-medium text-fg-subtle leading-4">{category.label}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('uploadedAt', {
      header: 'Last modified',
      cell: info => {
        const date = info.getValue();
        return (
          <span className="text-sm text-fg-subtle leading-5">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    }),
    columnHelper.accessor('size', {
      header: 'Size',
      cell: info => (
        <span className="text-sm text-fg-subtle leading-5">{formatFileSize(info.getValue())}</span>
      ),
    }),
  ], []);
  
  // TanStack Table instance
  const table = useReactTable({
    data: files,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  // Count completed files for display
  const completedFilesCount = files.filter(f => f.status === 'completed').length;
  
  // Pagination calculations
  const totalItems = files.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  
  // Get paginated rows
  const paginatedRows = useMemo(() => {
    const allRows = table.getRowModel().rows;
    return allRows.slice(startIndex, endIndex);
  }, [table, startIndex, endIndex]);
  
  // Reset to page 1 when files change
  useEffect(() => {
    setCurrentPage(1);
  }, [files.length]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (!projectName.trim()) {
      setProjectName("Untitled");
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingName(false);
      if (!projectName.trim()) {
        setProjectName("Untitled");
      }
    }
    if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && !isLoading) {
      setIsLoading(true);
      
      // Generate a URL-friendly ID from the message
      const chatId = inputValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      // Navigate to the assistant chat page with the message
      sessionStorage.setItem('fromVaultProject', 'true');
      sessionStorage.setItem('vaultProjectName', projectName);
      router.push(`/assistant/${chatId}?initialMessage=${encodeURIComponent(inputValue)}`);
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'share': return Share2;
      case 'upload': return Upload;
      case 'rename': return Edit3;
      case 'create': return FileIcon;
      default: return MessageSquare;
    }
  };
  
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      
      <SidebarInset>
        <div className="h-screen flex bg-bg-base">
          {/* Left side - Header + Content together */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                    className="text-fg-muted hover:text-fg-base hover:bg-bg-subtle cursor-pointer rounded-md transition-colors"
                    style={{ padding: '4px 6px' }}
                    onClick={() => router.push('/vault')}
                  >
                    Vault
                  </span>
                  <ChevronRight className="h-3 w-3 text-fg-muted" />
                  {isEditingName ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={handleNameKeyDown}
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.setSelectionRange(0, 0);
                          e.target.scrollLeft = 0;
                        }, 0);
                      }}
                      className="text-fg-base font-medium bg-bg-subtle border border-border-interactive outline-none px-2 py-1.5 rounded-md text-sm"
                      style={{ 
                        width: `${Math.min(Math.max(projectName.length * 8 + 40, 120), 600)}px`,
                        height: '28px'
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-medium text-fg-base hover:bg-bg-subtle cursor-pointer rounded-md transition-colors"
                      style={{ padding: '4px 6px' }}
                      onClick={handleNameClick}
                    >
                      {projectName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="medium" className="gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  Matter
                </Button>
                <Button variant="outline" size="medium" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Share
                </Button>
                {isConfigPanelCollapsed && (
                  <button 
                    onClick={() => setIsConfigPanelCollapsed(false)}
                    className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
                  >
                    <SvgIcon 
                      src="/central_icons/RightSidebar.svg" 
                      alt="Expand drawer"
                      width={16} 
                      height={16} 
                      className="text-fg-base"
                    />
                  </button>
                )}
              </div>
            </div>
            
            {/* Main Content Panel */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Tabs */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-1">
                  <AnimatedBackground 
                    defaultValue={activeTab}
                    onValueChange={(value) => value && setActiveTab(value)}
                    className="bg-bg-subtle rounded-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <button
                      data-id="overview"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Overview
                    </button>
                    <button
                      data-id="queries"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Queries
                    </button>
                    <button
                      data-id="activity"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Activity
                    </button>
                    <button
                      data-id="settings"
                      className="relative px-2 py-1.5 font-medium transition-colors text-fg-subtle hover:text-fg-base data-[checked=true]:text-fg-base"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      Settings
                    </button>
                  </AnimatedBackground>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 px-6 py-6 flex flex-col min-h-0">
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Chat and Action Buttons - Centered */}
                  <div className="flex flex-col items-center">
                    {/* Chat Composer */}
                    <div 
                      className="w-full bg-bg-subtle border border-border-base rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong shadow-sm"
                      style={{ maxWidth: '600px' }}
                    >
                    {/* Composer Text Field */}
                    <div className="p-[10px] flex flex-col gap-[10px]">
                      {/* Vault Badge */}
                      <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-bg-base border border-border-base rounded-[4px] w-fit">
                        <img src="/sharedFolderIcon.svg" alt="Vault" className="w-3 h-3" />
                        <span className="text-[12px] font-medium text-fg-muted leading-[16px]">{projectName}</span>
                      </div>
                      
                      {/* Textarea */}
                      <div className="px-[4px]">
                        <div className="relative">
                          <textarea
                            value={inputValue}
                            onChange={(e) => {
                              setInputValue(e.target.value);
                              e.target.style.height = '20px';
                              e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px';
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            disabled={isLoading}
                            className="w-full bg-transparent focus:outline-none text-fg-base placeholder-fg-muted resize-none overflow-hidden disabled:opacity-50"
                            style={{ 
                              fontSize: '14px', 
                              lineHeight: '20px',
                              height: '20px',
                              minHeight: '20px',
                              maxHeight: '300px'
                            }}
                          />
                          {!inputValue && !isInputFocused && (
                            <div className="absolute inset-0 pointer-events-none text-fg-muted flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                            <TextLoop interval={3000}>
                              <span>Research IP infringement cases…</span>
                              <span>Draft deposition questions for fraud case…</span>
                              <span>Draft an S-1 shell…</span>
                              <span>Extract key clauses from contract…</span>
                              <span>Draft a memo on new SEC rules…</span>
                            </TextLoop>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Controls */}
                    <div className="flex items-end justify-between pl-[10px] pr-[10px] pb-[10px]">
                      <div className="flex items-center">
                        <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                          <Paperclip size={16} className="text-fg-base" />
                        </button>
                        <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                          <Scale size={16} className="text-fg-base" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <button
                            disabled
                            className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] cursor-not-allowed"
                          >
                            <Spinner size="sm" />
                          </button>
                        ) : inputValue.trim() ? (
                          <button
                            onClick={handleSendMessage}
                            className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] hover:bg-button-inverted-hover transition-all"
                          >
                            <CornerDownLeft size={16} />
                          </button>
                        ) : (
                          <button className="h-[28px] px-[8px] flex items-center justify-center bg-bg-subtle-hover rounded-[6px] hover:bg-bg-subtle-pressed transition-all">
                            <Mic className="w-4 h-4 text-fg-base" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {[
                        { icon: "/central_icons/Review.svg", label: "Generate a review" },
                        { icon: "/central_icons/Draft.svg", label: "Draft a document" },
                        { icon: "/central_icons/Workflows.svg", label: "Use a workflow" },
                      ].map((action, index) => (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.3 + index * 0.08,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                          className="px-[10px] py-[6px] border border-border-base rounded-full hover:border-border-strong hover:bg-bg-subtle transition-colors flex items-center gap-1"
                        >
                          <SvgIcon 
                            src={action.icon} 
                            alt={action.label}
                            width={14} 
                            height={14} 
                            className="text-fg-muted"
                          />
                          <span className="text-fg-base text-xs font-medium leading-4">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Files Section - flex container to fill remaining space */}
                  <div className="flex flex-col flex-1 mt-8 min-h-0">
                    {/* Files Section Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-fg-base">Files</span>
                      <div className="flex items-center gap-[6px]">
                        <button className="h-7 px-2 text-xs font-medium text-fg-base border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex items-center gap-1.5">
                          <FolderPlus className="w-3.5 h-3.5" />
                          Create folder
                        </button>
                        <button className="h-7 px-2 text-xs font-medium text-fg-base border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Filters
                        </button>
                      </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".csv,.eml,.msg,.xlsx,.xls,.pdf,.pptx,.ppt,.rtf,.txt,.doc,.docx,.zip"
                    />
                    
                    {/* Dropzone or File Table */}
                    {files.length === 0 ? (
                      // Empty state - Dropzone
                      <div 
                        className={`flex-1 bg-bg-base border border-dashed rounded-lg flex flex-col items-center justify-center p-8 transition-colors cursor-pointer ${
                          isDragOver 
                            ? 'border-fg-base bg-bg-subtle' 
                            : 'border-border-strong hover:border-fg-muted'
                        }`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-3 w-[411px]">
                        <CloudUpload className={`w-6 h-6 transition-colors ${isDragOver ? 'text-fg-base' : 'text-fg-muted'}`} />
                        <div className="text-center flex flex-col gap-0.5">
                          <p className="text-sm font-medium text-fg-base leading-5">
                            {isDragOver ? 'Drop files here' : 'Drag and drop your files'}
                          </p>
                          <p className="text-xs text-fg-subtle leading-4">Supported file types: CSV, Email, Excel, PDF, PowerPoint, RTF, Text, Word, Zip</p>
                        </div>
                        <button 
                          className="h-7 px-2 bg-bg-interactive text-fg-on-color rounded-[6px] hover:opacity-90 transition-all flex items-center gap-1.5 text-sm font-medium leading-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                        <p className="text-[10px] text-fg-muted leading-[14px]">Or choose from</p>
                        <div className="flex gap-1">
                          <button 
                            className="h-7 px-[9px] border border-border-base rounded-[6px] hover:border-border-strong hover:bg-bg-subtle transition-colors flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image src="/sharepoint.svg" alt="SharePoint" width={16} height={16} />
                            <span className="text-sm font-medium text-fg-base leading-5">SharePoint (OneDrive)</span>
                          </button>
                          <button 
                            className="h-7 px-[9px] border border-border-base rounded-[6px] hover:border-border-strong hover:bg-bg-subtle transition-colors flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image src="/google-drive.svg" alt="Google Drive" width={16} height={16} />
                            <span className="text-sm font-medium text-fg-base leading-5">Google Drive</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // File Table
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* TanStack Table with Figma-style design */}
                      <div className="flex flex-col w-full">
                        {/* Header Row */}
                        <div className="flex items-center h-10 border-b border-border-base sticky top-0 bg-bg-base z-20">
                          {/* Checkbox Header */}
                          <div className="flex items-center h-full pr-3 py-3 shrink-0">
                            <button
                              onClick={toggleAllRows}
                              className="w-4 h-4 rounded-[4px] border border-border-strong bg-bg-base flex items-center justify-center hover:border-fg-muted transition-colors"
                            >
                              {selectedRows.size === files.length && files.length > 0 && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {selectedRows.size > 0 && selectedRows.size < files.length && (
                                <div className="w-2 h-0.5 bg-fg-base rounded-full" />
                              )}
                            </button>
                          </div>
                          {/* Name Header */}
                          <button 
                            className="flex-1 min-w-[200px] flex items-center gap-2 h-full px-1 py-3 cursor-pointer group"
                            onClick={() => table.getColumn('name')?.toggleSorting()}
                          >
                            <span className="text-xs font-medium text-fg-subtle leading-4">Name</span>
                            {table.getColumn('name')?.getIsSorted() && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={table.getColumn('name')?.getIsSorted() === 'desc' ? 'rotate-180' : ''}>
                                <path d="M3 5L6 8L9 5" stroke="#848079" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          {/* Category Header */}
                          <button 
                            className="flex-1 min-w-[180px] flex items-center gap-2 h-full px-1 py-3 cursor-pointer"
                            onClick={() => table.getColumn('category')?.toggleSorting()}
                          >
                            <span className="text-xs font-medium text-fg-muted leading-4">Category</span>
                          </button>
                          {/* Last Modified Header */}
                          <button 
                            className="w-[128px] flex items-center gap-2 h-full px-1 py-3 cursor-pointer shrink-0"
                            onClick={() => table.getColumn('uploadedAt')?.toggleSorting()}
                          >
                            <span className="text-xs font-medium text-fg-muted leading-4">Last modified</span>
                          </button>
                          {/* Size Header */}
                          <button 
                            className="w-[80px] flex items-center gap-2 h-full px-1 py-3 cursor-pointer shrink-0"
                            onClick={() => table.getColumn('size')?.toggleSorting()}
                          >
                            <span className="text-xs font-medium text-fg-muted leading-4">Size</span>
                          </button>
                        </div>
                        
                        {/* Table Rows */}
                        <div className="flex flex-col">
                          {paginatedRows.map(row => {
                            const file = row.original;
                            const isSelected = selectedRows.has(file.id);
                            const isHovered = hoveredRowId === file.id;
                            
                            return (
                              <div 
                                key={row.id}
                                className="flex items-center h-10 border-b border-border-base relative group cursor-pointer"
                                onMouseEnter={() => setHoveredRowId(file.id)}
                                onMouseLeave={() => setHoveredRowId(null)}
                              >
                                {/* Row Background - extends beyond bounds */}
                                {isHovered && (
                                  <div 
                                    className="absolute inset-y-[-1px] -left-4 -right-4 bg-bg-base-hover rounded-xl pointer-events-none"
                                    style={{ zIndex: 0 }}
                                  />
                                )}
                                {/* Checkbox Cell */}
                                <div className="flex items-center h-full pr-3 py-3 shrink-0 z-10">
                                  <button
                                    onClick={() => toggleRowSelection(file.id)}
                                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                                      isSelected ? 'border-bg-interactive bg-bg-interactive' : 'border-border-strong bg-bg-base hover:border-fg-muted'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                
                                {/* Name Cell */}
                                <div className="flex-1 min-w-[200px] flex items-center gap-2 h-full px-1 py-3 overflow-hidden z-10">
                                  {(() => {
                                    const cell = row.getVisibleCells().find(c => c.column.id === 'name');
                                    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                                  })()}
                                </div>
                                
                                {/* Category Cell */}
                                <div className="flex-1 min-w-[180px] flex items-center h-full px-1 py-3 z-10">
                                  {(() => {
                                    const cell = row.getVisibleCells().find(c => c.column.id === 'category');
                                    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                                  })()}
                                </div>
                                
                                {/* Last Modified Cell */}
                                <div className="w-[128px] flex items-center h-full px-1 py-3 shrink-0 z-10">
                                  {(() => {
                                    const cell = row.getVisibleCells().find(c => c.column.id === 'uploadedAt');
                                    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                                  })()}
                                </div>
                                
                                {/* Size Cell */}
                                <div className="w-[80px] flex items-center h-full px-1 py-3 shrink-0 z-10">
                                  {(() => {
                                    const cell = row.getVisibleCells().find(c => c.column.id === 'size');
                                    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                                  })()}
                                </div>
                                
                                {/* Hover Action Buttons */}
                                {isHovered && (
                                  <div className="absolute -right-4 top-0 bottom-0 flex items-center pr-4 z-20">
                                    {/* Gradient fade */}
                                    <div className="absolute inset-y-0 bg-gradient-to-r from-transparent to-bg-base-hover pointer-events-none" style={{ right: '100%', width: '64px' }} />
                                    {/* Solid background behind buttons */}
                                    <div className="absolute inset-0 bg-bg-base-hover rounded-r-xl pointer-events-none" />
                                    <div className="flex items-center gap-0 relative z-10">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors">
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M2 5.5C2 4.67157 2.67157 4 3.5 4H6L7.5 6H12.5C13.3284 6 14 6.67157 14 7.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M9 8L11 10M11 10L9 12M11 10H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <p>Move</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors">
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 2V11M8 11L4 7M8 11L12 7M2 14H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <p>Download</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors">
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L12 2L14 4L4.5 13.5L2 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <p>Rename</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors">
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <p>Delete</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between py-4 mt-auto">
                          <span className="text-xs font-medium text-fg-subtle leading-4">
                            Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} items
                          </span>
                          <div className="flex items-center gap-12">
                            {/* Rows per page */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-fg-subtle leading-4">Rows per page</span>
                              <div className="relative">
                                <select 
                                  value={rowsPerPage}
                                  onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                  }}
                                  className="h-8 w-20 px-2.5 pr-8 text-sm border border-border-base rounded-md bg-bg-base text-fg-base appearance-none cursor-pointer hover:border-border-strong transition-colors"
                                >
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                  <option value={100}>100</option>
                                </select>
                                <svg 
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-fg-muted" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 16 16" 
                                  fill="none"
                                >
                                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            {/* Pagination buttons */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="w-7 h-7 flex items-center justify-center border border-border-base rounded-[7px] text-fg-base hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M9 5L6 8L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M13 5L10 8L13 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-7 h-7 flex items-center justify-center border border-border-base rounded-[7px] text-fg-base hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M10 5L7 8L10 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-7 h-7 flex items-center justify-center border border-border-base rounded-[7px] text-fg-base hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M6 5L9 8L6 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-7 h-7 flex items-center justify-center border border-border-base rounded-[7px] text-fg-base hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M7 5L10 8L7 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 5L6 8L3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Vault Details */}
          <div className={`${isConfigPanelCollapsed ? 'w-0 border-l-0' : 'w-[400px] border-l'} border-border-base flex flex-col bg-bg-base transition-all duration-200 ease-linear flex-shrink-0 overflow-hidden`}>
            <div className="w-[400px] flex flex-col h-full">
              <div className="pl-[20px] pr-[14px] pt-[12px] pb-[8px] flex items-center justify-between">
                <span className="text-sm font-medium text-fg-base leading-[20px]">Vault details</span>
                <button 
                  onClick={() => setIsConfigPanelCollapsed(true)}
                  className="h-[28px] px-[6px] flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
                >
                  <SvgIcon 
                    src="/central_icons/RightSidebar - Filled.svg" 
                    alt="Collapse drawer"
                    width={16} 
                    height={16} 
                    className="text-fg-base"
                  />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  {/* Details Section */}
                  <div className="pl-[20px] pr-[14px] pt-[4px] pb-[20px]">
                    <div className="flex flex-col gap-[8px]">
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/File.svg" alt="Files" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Files</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Queries.svg" alt="Queries" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Queries</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">0 queries</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Tag.svg" alt="Tags" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Tags</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-[4px] flex-1">
                          <button className="text-xs text-fg-muted hover:text-fg-base transition-colors leading-[16px]">Add tags</button>
                        </div>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/User.svg" alt="Owner" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Owner</span>
                        </div>
                        <div className="flex items-center gap-[4px] flex-1">
                          <div className="w-4 h-4 rounded-full bg-bg-subtle flex items-center justify-center text-[9px] font-medium text-fg-base opacity-90">Y</div>
                          <span className="text-xs text-fg-base leading-[16px]">you@company.com</span>
                        </div>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Calendar Edit.svg" alt="Created on" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Created on</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">Just now</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/History.svg" alt="Last edited" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Last edited</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">Just now</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center gap-[4px] w-[122px] shrink-0 h-[28px] text-fg-subtle">
                          <SvgIcon src="/central_icons/Description.svg" alt="Description" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Description</span>
                        </div>
                        <div className="flex-1 rounded-[6px]">
                          <button className="text-xs text-fg-muted hover:text-fg-base transition-colors leading-[16px]">Set description</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Memory - Empty State */}
                  <div className="border-t border-border-base px-[14px] pt-[8px] pb-[20px]">
                    <div className="flex items-center justify-between h-[44px] pl-[6px]">
                      <span className="text-xs font-medium text-fg-base leading-[20px]">Memory</span>
                    </div>
                    <div className="flex flex-col gap-[12px] items-center justify-center px-[6px]">
                      <div className="h-[92px] w-[100px] flex items-center justify-center">
                        <img src="/memory_cube.svg" alt="Memory" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs text-fg-muted leading-[16px] text-center">
                        Memory will automatically build up over time as you start working and generating more queries
                      </p>
                    </div>
                  </div>
                  
                  {/* Instructions - Empty State */}
                  <div className="border-t border-border-base px-[14px] pt-[8px] pb-[20px]">
                    <div className="flex items-center justify-between h-[44px] pl-[6px]">
                      <span className="text-xs font-medium text-fg-base leading-[20px]">Instructions</span>
                      <button 
                        onClick={() => setIsInstructionsDialogOpen(true)}
                        className="h-[24px] px-[6px] py-[2px] text-xs font-medium text-fg-subtle hover:text-fg-base transition-colors leading-[16px]"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-col gap-[12px] items-center justify-center px-[6px]">
                      <div className="h-[92px] w-[92px] flex items-center justify-center">
                        <img src="/instruction_lines.svg" alt="Instructions" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs text-fg-muted leading-[16px] text-center">
                        Provide Harvey with relevant instructions and information for queries within this vault.
                      </p>
                    </div>
                  </div>
                  
                  {/* Activity */}
                  <div className="border-t border-border-base px-[14px] pt-[8px] pb-[20px]">
                    <div className="flex items-center justify-between h-[44px] pl-[6px]">
                      <span className="text-xs font-medium text-fg-base leading-[20px]">Activity</span>
                      <button className="h-[24px] px-[6px] py-[2px] text-xs font-medium text-fg-subtle hover:text-fg-base transition-colors leading-[16px]">See all</button>
                    </div>
                    <div className="pl-[6px]">
                      {activities.map((activity, index) => {
                        const IconComponent = getActivityIcon(activity.type);
                        const isLast = index === activities.length - 1;
                        return (
                          <div key={activity.id} className="flex gap-[6px] items-start">
                            <div className="flex flex-col items-center gap-[4px] py-[2px] self-stretch shrink-0">
                              <IconComponent className="w-4 h-4 text-fg-subtle shrink-0" />
                              {!isLast && <div className="w-px flex-1 bg-border-base" />}
                            </div>
                            <div className={`flex-1 flex flex-col gap-[4px] ${!isLast ? 'pb-[16px]' : ''}`}>
                              <p className="text-xs text-fg-subtle leading-[16px]">
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
                  </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Instructions Dialog */}
      <Dialog open={isInstructionsDialogOpen} onOpenChange={setIsInstructionsDialogOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogTitle className="text-base font-medium text-fg-base">
            Instructions
          </DialogTitle>
          {/* Dialog content placeholder */}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StagingExamplePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
      <StagingExampleContent />
    </Suspense>
  );
}
