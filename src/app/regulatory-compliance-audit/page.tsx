"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Users, Briefcase, ChevronRight,
  FileIcon, MessageSquare, Upload, Share2, Edit3,
  Scale, Paperclip, Mic, CornerDownLeft, CloudUpload, FolderPlus, SlidersHorizontal,
  Plus, Copy, Download, RotateCcw, ThumbsUp, ThumbsDown, ListPlus, SquarePen,
  Maximize2, Search
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { SvgIcon } from "@/components/svg-icon";
import { AnimatedBackground } from "../../../components/motion-primitives/animated-background";
import { TextLoop } from "../../../components/motion-primitives/text-loop";
import ThinkingState from "@/components/thinking-state";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Category options with their dot colors
const categoryOptions = [
  { label: 'Compliance Policy', color: '#CE5347' },
  { label: 'Audit Report', color: '#638DE0' },
  { label: 'Regulatory Filing', color: '#F2D646' },
  { label: 'Risk Assessment', color: '#93C5FD' },
  { label: 'Evidence File', color: '#86EFAC' },
] as const;

// Types for file management
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  category?: { label: string; color: string };
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
  
  return '/file.svg';
};

// Column helper for TanStack Table
const columnHelper = createColumnHelper<UploadedFile>();

// Mock files data for regulatory compliance audit
const mockFiles: UploadedFile[] = [
  { id: '1', name: 'Q4_2025_Compliance_Report.pdf', size: 2456789, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-15'), category: categoryOptions[1] },
  { id: '2', name: 'GDPR_Policy_v3.2.docx', size: 845632, type: 'application/docx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-14'), category: categoryOptions[0] },
  { id: '3', name: 'SOX_Control_Testing.xlsx', size: 1234567, type: 'application/xlsx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-12'), category: categoryOptions[3] },
  { id: '4', name: 'AML_Due_Diligence_Report.pdf', size: 3456789, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-10'), category: categoryOptions[1] },
  { id: '5', name: 'Data_Privacy_Assessment.pdf', size: 987654, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-08'), category: categoryOptions[3] },
  { id: '6', name: 'Regulatory_Correspondence_SEC.pdf', size: 567890, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-05'), category: categoryOptions[2] },
  { id: '7', name: 'Internal_Audit_Findings.docx', size: 1123456, type: 'application/docx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2026-01-03'), category: categoryOptions[1] },
  { id: '8', name: 'Vendor_Risk_Matrix.xlsx', size: 654321, type: 'application/xlsx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-12-28'), category: categoryOptions[3] },
  { id: '9', name: 'Compliance_Training_Records.xlsx', size: 234567, type: 'application/xlsx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-12-20'), category: categoryOptions[4] },
  { id: '10', name: 'Policy_Exception_Log.pdf', size: 345678, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-12-15'), category: categoryOptions[4] },
  { id: '11', name: 'Sanctions_Screening_Results.xlsx', size: 876543, type: 'application/xlsx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-12-10'), category: categoryOptions[3] },
  { id: '12', name: 'Board_Compliance_Report.pdf', size: 2345678, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-12-05'), category: categoryOptions[1] },
  { id: '13', name: 'KYC_Documentation_Guide.docx', size: 456789, type: 'application/docx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-11-28'), category: categoryOptions[0] },
  { id: '14', name: 'Incident_Response_Plan.pdf', size: 567890, type: 'application/pdf', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-11-20'), category: categoryOptions[0] },
  { id: '15', name: 'Regulatory_Change_Analysis.xlsx', size: 789012, type: 'application/xlsx', uploadProgress: 100, status: 'completed', uploadedAt: new Date('2025-11-15'), category: categoryOptions[2] },
];

// Query chip types
interface QueryChip {
  label: string;
  icon: string;
}

const chipTypes = {
  query: { label: 'Query', icon: '/central_icons/Assistant.svg' },
  reviewTable: { label: 'Review table', icon: '/central_icons/Review.svg' },
  draft: { label: 'Draft', icon: '/central_icons/Draft.svg' },
};

// Query interface
interface Query {
  id: string;
  name: string;
  chips: QueryChip[];
  lastModified: Date;
  createdOn: Date;
  createdBy: string;
}

// Mock queries data
const mockQueries: Query[] = [
  { id: 'q1', name: 'What are the key GDPR compliance requirements?', chips: [chipTypes.query], lastModified: new Date('2026-01-27'), createdOn: new Date('2026-01-25'), createdBy: 'Sarah Chen' },
  { id: 'q2', name: 'Summarize SOX control testing results', chips: [chipTypes.reviewTable, chipTypes.query], lastModified: new Date('2026-01-26'), createdOn: new Date('2026-01-24'), createdBy: 'Michael Ross' },
  { id: 'q3', name: 'Compare AML procedures across jurisdictions', chips: [chipTypes.query], lastModified: new Date('2026-01-25'), createdOn: new Date('2026-01-23'), createdBy: 'Sarah Chen' },
  { id: 'q4', name: 'Extract key findings from Q4 compliance report', chips: [chipTypes.draft, chipTypes.query], lastModified: new Date('2026-01-24'), createdOn: new Date('2026-01-22'), createdBy: 'David Kim' },
  { id: 'q5', name: 'Analyze data privacy assessment gaps', chips: [chipTypes.query], lastModified: new Date('2026-01-23'), createdOn: new Date('2026-01-21'), createdBy: 'Emily Zhang' },
  { id: 'q6', name: 'What regulatory changes affect our operations?', chips: [chipTypes.reviewTable, chipTypes.query], lastModified: new Date('2026-01-22'), createdOn: new Date('2026-01-20'), createdBy: 'Michael Ross' },
  { id: 'q7', name: 'Summary of vendor risk assessment findings', chips: [chipTypes.query], lastModified: new Date('2026-01-21'), createdOn: new Date('2026-01-19'), createdBy: 'Sarah Chen' },
  { id: 'q8', name: 'Compare incident response procedures', chips: [chipTypes.draft, chipTypes.query], lastModified: new Date('2026-01-20'), createdOn: new Date('2026-01-18'), createdBy: 'David Kim' },
  { id: 'q9', name: 'Extract sanctions screening results', chips: [chipTypes.query], lastModified: new Date('2026-01-19'), createdOn: new Date('2026-01-17'), createdBy: 'Emily Zhang' },
  { id: 'q10', name: 'Analyze board compliance report trends', chips: [chipTypes.query], lastModified: new Date('2026-01-18'), createdOn: new Date('2026-01-16'), createdBy: 'Michael Ross' },
];

// Floating Action Bar Component
function FloatingActionBar({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div 
      className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20"
    >
      <motion.div 
        className="rounded-full shadow-sm overflow-hidden bg-white dark:bg-neutral-800 border-[0.5px] border-neutral-200 dark:border-neutral-700 flex items-center justify-center py-px"
        animate={{
          width: isExpanded ? 'auto' : 40,
          height: isExpanded ? 28 : 8,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="flex items-center px-0.5 py-px"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <TooltipProvider delayDuration={0}>
                {/* Expand button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-8 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      <Maximize2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-fg-base text-bg-base text-xs px-2 py-1">
                    Show all
                  </TooltipContent>
                </Tooltip>
                
                {/* Export button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-8 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-fg-base text-bg-base text-xs px-2 py-1">
                    Export as CSV
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Sample people with access
const peopleWithAccess = [
  { id: '1', email: 'emily.zhang@company.com', access: 'Edit access', initial: 'E' },
  { id: '2', email: 'michael.ross@compliance.com', access: 'View access', initial: 'M' },
  { id: '3', email: 'sarah.lee@company.com', access: 'Edit access', initial: 'S' },
  { id: '4', email: 'auditor@pwc.com', access: 'View access', initial: 'A' },
];

// Sample activity
const activities = [
  { id: '1', type: 'share', user: 'emily.zhang@company.com', action: 'shared this vault with', target: 'auditor@pwc.com', time: '1d ago' },
  { id: '2', type: 'upload', user: 'sarah.lee@company.com', action: 'uploaded', target: '156 files', time: '2d ago' },
  { id: '3', type: 'rename', user: 'emily.zhang@company.com', action: 'renamed the vault from', target: 'Q1 Audit to Regulatory Compliance Audit', time: '5d ago' },
  { id: '4', type: 'create', user: 'emily.zhang@company.com', action: 'created the vault', time: '1w ago' },
];

// Message type - same as Stubhub
type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'artifact' | 'files';
  isLoading?: boolean;
  thinkingContent?: {
    summary: string;
    bullets: string[];
  };
  loadingState?: {
    showSummary: boolean;
    visibleBullets: number;
  };
  showThinking?: boolean;
};

// Thinking content generator - same as Stubhub
function getThinkingContent(variant: 'analysis' | 'draft' | 'review'): {
  summary: string;
  bullets: string[];
} {
  switch (variant) {
    case 'draft':
      return {
        summary: 'Planning structure and content before drafting the document.',
        bullets: [
          'Identify audience and objective',
          'Assemble relevant facts and authorities',
          'Outline sections and key arguments'
        ]
      };
    case 'review':
      return {
        summary: 'Parsing materials and selecting fields for a concise comparison.',
        bullets: [
          'Locate documents and parse key terms',
          'Normalize entities and dates',
          'Populate rows and verify data consistency'
        ]
      };
    default:
      return {
        summary: 'Analyzing the request and gathering relevant information.',
        bullets: [
          'Understanding the context and requirements',
          'Searching through available documents',
          'Preparing comprehensive response'
        ]
      };
  }
}

// Chat thread type for multi-chat support - same as Stubhub
interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
}

export default function RegulatoryComplianceAuditPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("Regulatory Compliance Audit");
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Configuration panel state (details drawer) - closed by default
  const [isConfigPanelCollapsed, setIsConfigPanelCollapsed] = useState(true);

  // Multi-chat state - same as Stubhub
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  
  // Chat panel state - open by default
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  
  // Card hover states for floating action bars
  const [isReviewedCardHovered, setIsReviewedCardHovered] = useState(false);
  const [isRedFlagsCardHovered, setIsRedFlagsCardHovered] = useState(false);
  const [isGapAnalysisCardHovered, setIsGapAnalysisCardHovered] = useState(false);
  
  // File table state
  const [files] = useState<UploadedFile[]>(mockFiles);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Queries table state
  const [queries] = useState<Query[]>(mockQueries);
  const [hoveredQueryRowId, setHoveredQueryRowId] = useState<string | null>(null);
  const [querySearchQuery, setQuerySearchQuery] = useState("");
  
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
  
  // Wrapper to set both state and ref
  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id;
    setActiveChatIdState(id);
  }, []);
  
  // Get active chat
  const activeChat = chatThreads.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];
  const isLoading = activeChat?.isLoading || false;
  
  // Helper to update active chat
  const updateActiveChat = useCallback((updater: (chat: ChatThread) => ChatThread) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? updater(chat) : chat
    ));
  }, []);
  
  // Helper to set messages for active chat
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const newMessages = typeof updater === 'function' ? updater(chat.messages) : updater;
        return { ...chat, messages: newMessages };
      }
      return chat;
    }));
  }, []);
  
  // Helper to set loading for active chat
  const setIsLoading = useCallback((loading: boolean) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? { ...chat, isLoading: loading } : chat
    ));
  }, []);
  
  // Helper to set chat title for active chat
  const setChatTitle = useCallback((title: string) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? { ...chat, title } : chat
    ));
  }, []);
  
  // Create new chat
  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatThread = {
      id: newChatId,
      title: 'Untitled',
      messages: [],
      isLoading: false
    };
    setChatThreads(prev => [...prev, newChat]);
    setActiveChatId(newChatId);
  }, [setActiveChatId]);
  
  // Ensure a chat exists before sending a message
  const ensureChatExists = useCallback((): string => {
    const currentChatId = activeChatIdRef.current;
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`;
      const newChat: ChatThread = {
        id: newChatId,
        title: 'Untitled',
        messages: [],
        isLoading: false
      };
      setChatThreads(prev => [...prev, newChat]);
      setActiveChatId(newChatId);
      return newChatId;
    }
    return currentChatId;
  }, [setActiveChatId]);
  
  // Helper to update a specific chat by ID
  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setChatThreads(prev => prev.map(chat => 
      chat.id === chatId ? updater(chat) : chat
    ));
  }, []);

  const [chatInputValue, setChatInputValue] = useState('');
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Chat panel resize state - same as Stubhub
  const [chatWidth, setChatWidth] = useState(401);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResizer, setIsHoveringResizer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const MIN_CHAT_WIDTH = 400;
  const MAX_CHAT_WIDTH = 800;

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        setIsScrolled(scrollTop > 0);
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setIsNearBottom(distanceFromBottom < 100);
        setShowBottomGradient(distanceFromBottom > 1);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isNearBottom, scrollToBottom]);

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

  // Send message from chat panel - same flow as Stubhub
  const sendMessage = useCallback((messageText?: string) => {
    const text = messageText || chatInputValue;
    if (!text.trim() || isLoading) return;
    
    const chatId = ensureChatExists();
    const title = text.length > 40 ? text.substring(0, 40) + '...' : text;
    
    const userMessage: Message = {
      role: 'user',
      content: text,
      type: 'text'
    };
    
    const thinkingContent = getThinkingContent('analysis');
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'text',
      isLoading: true,
      thinkingContent,
      loadingState: {
        showSummary: false,
        visibleBullets: 0
      }
    };
    
    updateChatById(chatId, chat => ({
      ...chat,
      isLoading: true,
      title: chat.messages.length === 0 ? title : chat.title,
      messages: [...chat.messages, userMessage, assistantMessage]
    }));
    
    setChatInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
    }
    setTimeout(() => scrollToBottom(), 50);
    
    // Progressive reveal of thinking states
    setTimeout(() => {
      updateChatById(chatId, chat => ({
        ...chat,
        messages: chat.messages.map((msg, idx) => 
          idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading
            ? { ...msg, loadingState: { ...msg.loadingState!, showSummary: true } }
            : msg
        )
      }));
      scrollToBottom();
    }, 600);
    
    // Show bullets progressively
    thinkingContent.bullets.forEach((_, bulletIdx) => {
      setTimeout(() => {
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading
              ? { ...msg, loadingState: { ...msg.loadingState!, visibleBullets: bulletIdx + 1 } }
              : msg
          )
        }));
        scrollToBottom();
      }, 1000 + (bulletIdx * 400));
    });
    
    // Complete the response
    setTimeout(() => {
      updateChatById(chatId, chat => ({
        ...chat,
        isLoading: false,
        messages: chat.messages.map((msg, idx) => {
          if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading) {
            return {
              ...msg,
              content: generateResponse(text),
              isLoading: false
            };
          }
          return msg;
        })
      }));
      setTimeout(() => scrollToBottom(), 100);
    }, 2500);
  }, [chatInputValue, isLoading, ensureChatExists, updateChatById, scrollToBottom]);

  // Generate a contextual response
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('compliance') || lowerQuery.includes('finding')) {
      return "Based on the audit documents in this vault, I can help you analyze the compliance findings. The current vault contains 156 files including policy documents, audit reports, regulatory correspondence, and evidence files. Would you like me to generate a compliance summary or identify areas requiring immediate attention?";
    } else if (lowerQuery.includes('gap') || lowerQuery.includes('risk') || lowerQuery.includes('issue')) {
      return "I've identified several compliance gaps based on the uploaded documents:\n\n1. **Data Privacy**: GDPR documentation needs updating for new processing activities\n2. **SOX Controls**: Two control deficiencies noted in Q4 testing\n3. **AML Procedures**: Customer due diligence documentation incomplete for 3 accounts\n\nWould you like me to draft a remediation plan for any of these areas?";
    } else if (lowerQuery.includes('checklist') || lowerQuery.includes('audit')) {
      return "Based on the regulatory requirements, here's the audit checklist status:\n\n• **Data Protection**: 85% complete - pending privacy impact assessments\n• **Financial Controls**: 92% complete - minor documentation gaps\n• **Operational Risk**: 78% complete - policies under review\n• **Third-Party Management**: 70% complete - vendor assessments in progress\n\nWould you like me to generate detailed action items for any category?";
    }
    
    return `I'm analyzing the compliance documents in this vault related to "${query}". Based on the available materials, I can help you with regulatory analysis, policy review, or audit preparation. What specific aspect would you like me to focus on?`;
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

  // Handle resize mouse down - same as Stubhub but reversed direction
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Resize effect - calculate from right edge
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate width from right edge of the content area
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = containerRect.right - e.clientX;
        const constrainedWidth = Math.max(MIN_CHAT_WIDTH, Math.min(newWidth, MAX_CHAT_WIDTH));
        setChatWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Check if in chat mode (has any chats)
  const isInChatMode = chatThreads.length > 0;
  
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      
      <SidebarInset>
        <div className="h-screen flex bg-bg-base">
          {/* Left side - Header + Content together (same structure as Reevo) */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
                <Button variant="default" size="medium" className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                {!isChatPanelOpen && (
                  <button 
                    onClick={() => setIsChatPanelOpen(true)}
                    className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
                  >
                    <SvgIcon 
                      src="/central_icons/Assistant.svg" 
                      alt="Open chat"
                      width={16} 
                      height={16} 
                      className="text-fg-base"
                    />
                  </button>
                )}
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
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0">
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
              <div className="flex-1 px-6 py-6 min-w-0">
                {activeTab === "overview" && (
                <div>
                  {/* Dashboard Cards */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {/* Reviewed Documents Card */}
                    <div 
                      className="flex-1 min-w-[280px] border border-border-base rounded-[10px] flex flex-col overflow-hidden relative" 
                      style={{ height: '350px' }}
                      onMouseEnter={() => setIsReviewedCardHovered(true)}
                      onMouseLeave={() => setIsReviewedCardHovered(false)}
                    >
                      {/* Bottom gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-base to-transparent pointer-events-none z-10" />
                      
                      {/* Floating Action Bar */}
                      <FloatingActionBar isExpanded={isReviewedCardHovered} />
                      
                      {/* Card Header */}
                      <div className="border-b border-border-base flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-bg-subtle flex items-center justify-center">
                            <SvgIcon 
                              src="/central_icons/Circle Check - Filled.svg" 
                              alt="Reviewed"
                              width={20} 
                              height={20} 
                              className="text-fg-subtle"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-fg-base leading-5">Reviewed documents</span>
                            <span className="text-xs text-fg-subtle leading-4 truncate">Progress of human-reviewed files</span>
                          </div>
                        </div>
                        <span className="px-1 bg-[#d1fae5] text-[#065f46] text-[10px] font-medium rounded h-4 flex items-center leading-[14px] whitespace-nowrap">60% reviewed</span>
                      </div>
                      
                      {/* Progress Items */}
                      <div className="flex flex-col">
                        {/* Real estate */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Real estate</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">6/8 documents</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-fg-base rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '75%' }}
                              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Commercial */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Commercial</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">7/8 documents</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-fg-base rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '87.5%' }}
                              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Corporation */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Corporation</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">0/8 documents</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-fg-base rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '0%' }}
                              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Other */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Other</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">2/8 documents</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-fg-base rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '25%' }}
                              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* IP */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">IP</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">1/8 documents</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-fg-base rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '12.5%' }}
                              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Red Flags Card */}
                    <div 
                      className="flex-1 min-w-[280px] border border-border-base rounded-[10px] flex flex-col overflow-hidden relative" 
                      style={{ height: '350px' }}
                      onMouseEnter={() => setIsRedFlagsCardHovered(true)}
                      onMouseLeave={() => setIsRedFlagsCardHovered(false)}
                    >
                      {/* Bottom gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-base to-transparent pointer-events-none z-10" />
                      
                      {/* Floating Action Bar */}
                      <FloatingActionBar isExpanded={isRedFlagsCardHovered} />
                      
                      {/* Card Header */}
                      <div className="border-b border-border-base flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-bg-subtle flex items-center justify-center">
                            <SvgIcon 
                              src="/central_icons/Flag - Filled.svg" 
                              alt="Red flags"
                              width={20} 
                              height={20} 
                              className="text-fg-subtle"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-fg-base leading-5">Red flags</span>
                            <span className="text-xs text-fg-subtle leading-4 truncate">Highest detected risk per document</span>
                          </div>
                        </div>
                        <span className="px-1 bg-[#ffe4e6] text-[#9f1239] text-[10px] font-medium rounded h-4 flex items-center leading-[14px] whitespace-nowrap">11 documents flagged</span>
                      </div>
                      
                      {/* Risk Items */}
                      <div className="flex flex-col">
                        {/* Real estate */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Real estate</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">7/8 documents</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1 h-1.5">
                              <motion.div 
                                className="flex-1 bg-[#fda4af] rounded-sm origin-left" 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                              />
                              <motion.div 
                                className="bg-[#e11d48] rounded-sm origin-left" 
                                style={{ width: '70%' }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                              />
                              <motion.div 
                                className="bg-[#ff7502] rounded-sm origin-left" 
                                style={{ width: '10%' }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#fda4af]" />
                                <span className="text-xs text-fg-subtle leading-4">2 AI</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#e11d48]" />
                                <span className="text-xs text-fg-subtle leading-4">3 human</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#ff7502]" />
                                <span className="text-xs text-fg-subtle leading-4">1 human</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Commercial */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Commercial</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">4/8 documents</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1 h-1.5">
                              <motion.div 
                                className="bg-[#fda4af] rounded-sm origin-left" 
                                style={{ width: '75%' }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
                              />
                              <motion.div 
                                className="flex-1 bg-[#e11d48] rounded-sm origin-left" 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#fda4af]" />
                                <span className="text-xs text-fg-subtle leading-4">4 AI</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#e11d48]" />
                                <span className="text-xs text-fg-subtle leading-4">2 human</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corporation */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Corporation</span>
                            <span className="px-1 bg-[#d1fae5] text-[#065f46] text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">No risk detected</span>
                          </div>
                        </div>
                        
                        {/* Other */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Other</span>
                            <span className="px-1 bg-[#d1fae5] text-[#065f46] text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">No risk detected</span>
                          </div>
                        </div>
                        
                        {/* IP */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">IP</span>
                            <span className="px-1 bg-[#d1fae5] text-[#065f46] text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">No risk detected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gap Analysis Card */}
                    <div 
                      className="flex-1 min-w-[280px] border border-border-base rounded-[10px] flex flex-col overflow-hidden relative" 
                      style={{ height: '350px' }}
                      onMouseEnter={() => setIsGapAnalysisCardHovered(true)}
                      onMouseLeave={() => setIsGapAnalysisCardHovered(false)}
                    >
                      {/* Bottom gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-base to-transparent pointer-events-none z-10" />
                      
                      {/* Floating Action Bar */}
                      <FloatingActionBar isExpanded={isGapAnalysisCardHovered} />
                      
                      {/* Card Header */}
                      <div className="border-b border-border-base flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-bg-subtle flex items-center justify-center">
                            <SvgIcon 
                              src="/central_icons/Code Analyze - Filled.svg" 
                              alt="Gap analysis"
                              width={20} 
                              height={20} 
                              className="text-fg-subtle"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-fg-base leading-5">Gap analysis</span>
                            <span className="text-xs text-fg-subtle leading-4 truncate">Complete document types by area</span>
                          </div>
                        </div>
                        <span className="px-1 bg-[#dbeafe] text-[#1e40af] text-[10px] font-medium rounded h-4 flex items-center leading-[14px] whitespace-nowrap">20% provided</span>
                      </div>
                      
                      {/* Gap Items */}
                      <div className="flex flex-col">
                        {/* Real estate */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Real estate</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">2 / 3 types</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#1E40AF] rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '67%' }}
                              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Commercial */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Commercial</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">4 / 4 types</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#1E40AF] rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Corporation */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Corporation</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">1 / 2 types</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#1E40AF] rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '50%' }}
                              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* Other */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">Other</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">0 / 2 types</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#1E40AF] rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '0%' }}
                              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        
                        {/* IP */}
                        <div className="p-3 flex flex-col gap-[15px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-fg-base leading-4">IP</span>
                            <span className="px-1 bg-bg-subtle text-fg-muted text-[10px] font-medium rounded h-4 flex items-center leading-[14px]">1 / 3 types</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#1E40AF] rounded-full" 
                              initial={{ width: '0%' }}
                              animate={{ width: '33%' }}
                              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* File Table */}
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
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                
                {activeTab === "queries" && (
                <div>
                  {/* Queries Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative w-[320px] min-w-[128px] h-7">
                      <div className="flex items-center w-full h-full px-2 py-1.5 bg-white border border-border-base rounded-md">
                        <div className="flex items-center gap-2 flex-1">
                          <Search className="w-4 h-4 text-fg-muted shrink-0" />
                          <input
                            type="text"
                            placeholder="Search"
                            value={querySearchQuery}
                            onChange={(e) => setQuerySearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-fg-base placeholder:text-fg-muted"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <button className="h-7 px-2 text-xs font-medium text-fg-base border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Filters
                      </button>
                    </div>
                  </div>

                  {/* Queries Table */}
                  <div className="flex flex-col w-full">
                    {/* Header Row */}
                    <div className="flex items-center h-10 border-b border-border-base sticky top-0 bg-bg-base z-20">
                      {/* Name Header */}
                      <div className="flex-[2] min-w-[200px] flex items-center gap-2 h-full px-1 py-3">
                        <span className="text-xs font-medium text-fg-subtle leading-4">Name</span>
                      </div>
                      {/* Query Type Header */}
                      <div className="flex-1 min-w-[180px] flex items-center gap-2 h-full px-1 py-3">
                        <span className="text-xs font-medium text-fg-muted leading-4">Query type</span>
                      </div>
                      {/* Last Modified Header */}
                      <div className="flex-1 min-w-[100px] flex items-center gap-2 h-full px-1 py-3">
                        <span className="text-xs font-medium text-fg-muted leading-4">Last modified</span>
                      </div>
                      {/* Created On Header */}
                      <div className="flex-1 min-w-[100px] flex items-center gap-2 h-full px-1 py-3">
                        <span className="text-xs font-medium text-fg-muted leading-4">Created on</span>
                      </div>
                      {/* Created By Header */}
                      <div className="flex-1 min-w-[100px] flex items-center gap-2 h-full px-1 py-3">
                        <span className="text-xs font-medium text-fg-muted leading-4">Created by</span>
                      </div>
                    </div>
                    
                    {/* Table Rows */}
                    <div className="flex flex-col">
                      {queries
                        .filter(query => query.name.toLowerCase().includes(querySearchQuery.toLowerCase()))
                        .map(query => {
                        const isHovered = hoveredQueryRowId === query.id;
                        
                        return (
                          <div 
                            key={query.id}
                            className="flex items-center h-10 border-b border-border-base relative group cursor-pointer"
                            onMouseEnter={() => setHoveredQueryRowId(query.id)}
                            onMouseLeave={() => setHoveredQueryRowId(null)}
                          >
                            {/* Row Background - extends beyond bounds */}
                            {isHovered && (
                              <div 
                                className="absolute inset-y-[-1px] -left-4 -right-4 bg-bg-base-hover rounded-xl pointer-events-none"
                                style={{ zIndex: 0 }}
                              />
                            )}
                            
                            {/* Name Cell */}
                            <div className="flex-[2] min-w-[200px] flex items-center gap-2 h-full px-1 py-3 overflow-hidden z-10">
                              <span className="text-sm text-fg-base leading-5 truncate">{query.name}</span>
                            </div>
                            
                            {/* Query Type Cell */}
                            <div className="flex-1 min-w-[180px] flex items-center gap-1.5 h-full px-1 py-3 z-10 overflow-hidden">
                              {query.chips.map((chip, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-bg-subtle rounded-full px-2 py-1 min-w-0">
                                  <SvgIcon src={chip.icon} alt={chip.label} width={14} height={14} className="text-fg-subtle shrink-0" />
                                  <span className="text-xs font-medium text-fg-subtle leading-4 whitespace-nowrap truncate">{chip.label}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Last Modified Cell */}
                            <div className="flex-1 min-w-[100px] flex items-center h-full px-1 py-3 z-10">
                              <span className="text-sm text-fg-muted leading-5">
                                {query.lastModified.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            
                            {/* Created On Cell */}
                            <div className="flex-1 min-w-[100px] flex items-center h-full px-1 py-3 z-10">
                              <span className="text-sm text-fg-muted leading-5">
                                {query.createdOn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            
                            {/* Created By Cell */}
                            <div className="flex-1 min-w-[100px] flex items-center h-full px-1 py-3 z-10">
                              <span className="text-sm text-fg-muted leading-5">{query.createdBy}</span>
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
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                          <Copy className="w-4 h-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Duplicate</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button className="w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Download</p>
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
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Chat Panel Separator */}
          {isChatPanelOpen && (
            <div className="w-px bg-border-base flex-shrink-0" />
          )}
          
          {/* Right Side - Chat Panel */}
          <AnimatePresence mode="wait">
            {isChatPanelOpen && (
              <motion.div
                ref={containerRef}
                key="chat-panel"
                className="flex flex-col bg-bg-base overflow-hidden w-[401px]"
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: 401,
                  opacity: 1 
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  width: { duration: 0.3, ease: "easeOut" },
                  opacity: { duration: 0.15, ease: "easeOut" }
                }}
                style={{ 
                  flexShrink: 0
                }}
              >
                {/* Chat Header - always visible */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ height: '52px' }}>
                  <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 max-w-[calc(100%-48px)]" style={{ flexWrap: 'nowrap' }}>
                    {chatThreads.length === 0 ? (
                      /* Show "New chat" when no chats exist */
                      <span
                        className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap"
                        style={{ padding: '4px 8px' }}
                      >
                        New chat
                      </span>
                    ) : (
                      /* Show chat tabs when chats exist */
                      chatThreads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => setActiveChatId(thread.id)}
                          className={cn(
                            "text-sm font-medium rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0",
                            thread.id === activeChatId
                              ? "text-fg-base bg-bg-subtle"
                              : "text-fg-muted hover:text-fg-base hover:bg-bg-subtle"
                          )}
                          style={{ padding: '4px 8px', maxWidth: '200px' }}
                          title={thread.title || 'Untitled'}
                        >
                          {(thread.title || 'Untitled').length > 25 ? (thread.title || 'Untitled').substring(0, 25) + '...' : (thread.title || 'Untitled')}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={createNewChat}
                      className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0"
                      title="New chat"
                    >
                      <Plus size={16} className="text-fg-base" />
                    </button>
                    <button 
                      onClick={() => setIsChatPanelOpen(false)}
                      className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0"
                      title="Close chat"
                    >
                      <SvgIcon 
                        src="/central_icons/Assistant - Filled.svg" 
                        alt="Close chat"
                        width={16} 
                        height={16} 
                        className="text-fg-base"
                      />
                    </button>
                  </div>
                </div>
                
                {/* Chat Content */}
                <div className="flex-1 relative flex flex-col overflow-hidden">
                  {/* Top Gradient */}
                  <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
                  
                  {/* Bottom Gradient */}
                  <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${showBottomGradient ? 'opacity-100' : 'opacity-0'}`} />
                  
                  <div 
                    ref={messagesContainerRef}
                    className={`flex-1 overflow-y-auto overflow-x-hidden px-5 pt-8 pb-4 ${!isInChatMode ? 'flex items-center justify-center' : ''}`}
                  >
                    <div className="mx-auto w-full" style={{ maxWidth: '740px' }}>
                      {!isInChatMode ? (
                        /* Zero State - Welcome Experience (same as Stubhub) */
                        <div className="flex flex-col items-center justify-center gap-6 py-3">
                          {/* Welcome Header */}
                          <div className="w-full max-w-[624px] px-3 flex flex-col gap-0.5">
                            <h1 className="text-[18px] font-medium leading-[24px] tracking-[-0.3px] text-fg-base">
                              Welcome to {projectName}
                            </h1>
                            <p className="text-sm leading-5 text-fg-subtle">
                              This is your vault workspace. What would you like to work on?
                            </p>
                          </div>

                          {/* Get Started Actions */}
                          <div className="w-full max-w-[624px] flex flex-col">
                            <div className="px-3 pb-3">
                              <p className="text-xs leading-4 text-fg-muted">Get started…</p>
                            </div>
                            
                            {/* Action Items */}
                            <div className="flex flex-col">
                              {/* Review compliance documentation */}
                              <button
                                onClick={() => sendMessage("Review the compliance documentation and summarize key findings")}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                              >
                                <SvgIcon 
                                  src="/central_icons/Review.svg" 
                                  alt="Review"
                                  width={16} 
                                  height={16} 
                                  className="text-fg-subtle flex-shrink-0"
                                />
                                <span className="text-sm leading-5 text-fg-subtle">Review compliance documentation</span>
                              </button>
                              
                              <div className="h-px bg-border-base mx-3" />
                              
                              {/* Generate audit checklist */}
                              <button
                                onClick={() => sendMessage("Generate a comprehensive audit checklist based on the uploaded documents")}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                              >
                                <SvgIcon 
                                  src="/central_icons/Review.svg" 
                                  alt="Review"
                                  width={16} 
                                  height={16} 
                                  className="text-fg-subtle flex-shrink-0"
                                />
                                <span className="text-sm leading-5 text-fg-subtle">Generate audit checklist</span>
                              </button>
                              
                              <div className="h-px bg-border-base mx-3" />
                              
                              {/* Draft regulatory response */}
                              <button
                                onClick={() => sendMessage("Draft a regulatory response letter addressing the audit findings")}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                              >
                                <SvgIcon 
                                  src="/central_icons/Draft.svg" 
                                  alt="Draft"
                                  width={16} 
                                  height={16} 
                                  className="text-fg-subtle flex-shrink-0"
                                />
                                <span className="text-sm leading-5 text-fg-subtle">Draft regulatory response</span>
                              </button>
                              
                              <div className="h-px bg-border-base mx-3" />
                              
                              {/* Identify compliance gaps */}
                              <button
                                onClick={() => sendMessage("Identify compliance gaps and recommend remediation steps")}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                              >
                                <SvgIcon 
                                  src="/central_icons/Review.svg" 
                                  alt="Review"
                                  width={16} 
                                  height={16} 
                                  className="text-fg-subtle flex-shrink-0"
                                />
                                <span className="text-sm leading-5 text-fg-subtle">Identify compliance gaps</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Messages - same as Stubhub */
                        messages.map((message, index) => (
                          <div key={index} className={`${index !== messages.length - 1 ? 'mb-6' : ''}`}>
                            {/* User Message - Right aligned */}
                            {message.role === 'user' && (
                              <div className="flex flex-col gap-2 items-end pl-[68px]">
                                <div className="bg-bg-subtle px-4 py-3 rounded-[12px]">
                                  <div className="text-sm text-fg-base leading-5">
                                    {message.content}
                                  </div>
                                </div>
                                <div className="flex items-center justify-end">
                                  <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </button>
                                  <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                    <ListPlus className="w-3 h-3" />
                                    Save prompt
                                  </button>
                                  <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                    <SquarePen className="w-3 h-3" />
                                    Edit query
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Assistant Message - Left aligned */}
                            {message.role === 'assistant' && (
                              <div className="flex-1 min-w-0">
                                {/* Thinking State */}
                                {message.showThinking !== false && (
                                  <>
                                    {message.isLoading && message.thinkingContent && message.loadingState ? (
                                      <ThinkingState
                                        variant="analysis"
                                        title="Thinking..."
                                        durationSeconds={undefined}
                                        summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined}
                                        bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)}
                                        isLoading={true}
                                      />
                                    ) : message.thinkingContent ? (
                                      <ThinkingState
                                        variant="analysis"
                                        title="Thought"
                                        durationSeconds={3}
                                        summary={message.thinkingContent.summary}
                                        bullets={message.thinkingContent.bullets}
                                        defaultOpen={false}
                                      />
                                    ) : null}
                                  </>
                                )}
                                
                                {/* Content */}
                                {!message.isLoading && message.content && (
                                  <AnimatePresence>
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                    >
                                      <div className="text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap">
                                        {message.content}
                                      </div>
                                      
                                      {/* Action buttons */}
                                      <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center">
                                          <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                            <Copy className="w-3 h-3" />Copy
                                          </button>
                                          <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                            <Download className="w-3 h-3" />Export
                                          </button>
                                          <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                            <RotateCcw className="w-3 h-3" />Rewrite
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5">
                                            <ThumbsUp className="w-3 h-3" />
                                          </button>
                                          <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5">
                                            <ThumbsDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </AnimatePresence>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Chat Input - same as Stubhub */}
                <div className="px-5 pb-5 relative z-20 bg-bg-base">
                  <div className="mx-auto" style={{ maxWidth: '732px' }}>
                    <div 
                      className="bg-[#f6f5f4] dark:bg-[#2a2a2a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong"
                      style={{ 
                        boxShadow: '0px 18px 47px 0px rgba(0,0,0,0.03), 0px 7.5px 19px 0px rgba(0,0,0,0.02), 0px 4px 10.5px 0px rgba(0,0,0,0.02), 0px 2.3px 5.8px 0px rgba(0,0,0,0.01), 0px 1.2px 3.1px 0px rgba(0,0,0,0.01), 0px 0.5px 1.3px 0px rgba(0,0,0,0.01)'
                      }}
                    >
                      <div className="p-[10px] flex flex-col gap-[10px]">
                        <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-white dark:bg-[#1a1a1a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[4px] w-fit">
                          <img src="/folderIcon.svg" alt="Vault" className="w-3 h-3" />
                          <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">{projectName}</span>
                        </div>
                        
                        <div className="px-[4px]">
                          <div className="relative">
                            <textarea
                              ref={textareaRef}
                              value={chatInputValue}
                              onChange={(e) => {
                                setChatInputValue(e.target.value);
                                e.target.style.height = '20px';
                                e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px';
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                              onFocus={() => setIsChatInputFocused(true)}
                              onBlur={() => setIsChatInputFocused(false)}
                              disabled={isLoading}
                              className="w-full bg-transparent focus:outline-none text-fg-base placeholder-[#9e9b95] resize-none overflow-hidden disabled:opacity-50"
                              style={{ 
                                fontSize: '14px', 
                                lineHeight: '20px',
                                height: '20px',
                                minHeight: '20px',
                                maxHeight: '300px'
                              }}
                            />
                            {!chatInputValue && !isChatInputFocused && (
                              <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                              <TextLoop interval={3000}>
                                <span>Summarize the compliance findings…</span>
                                <span>Draft a regulatory response letter…</span>
                                <span>Identify gaps in current policies…</span>
                                <span>Review audit documentation…</span>
                                <span>Generate a compliance checklist…</span>
                              </TextLoop>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between pl-[10px] pr-[10px] pb-[10px]">
                        <div className="flex items-center">
                          <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors">
                            <Paperclip size={16} className="text-fg-base" />
                          </button>
                          <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors">
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
                          ) : chatInputValue.trim() ? (
                            <button
                              onClick={() => sendMessage()}
                              className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] hover:bg-button-inverted-hover transition-all"
                            >
                              <CornerDownLeft size={16} />
                            </button>
                          ) : (
                            <button className="h-[28px] px-[8px] flex items-center justify-center bg-[#e4e1dd] dark:bg-[#3d3d3d] rounded-[6px] hover:bg-[#d9d6d1] dark:hover:bg-[#4a4a4a] transition-all">
                              <Mic className="w-4 h-4 text-fg-base" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Right Panel - Vault Details (same as Reevo) */}
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
                        <span className="text-xs text-fg-base leading-[16px] flex-1">156 files (945kb)</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Queries.svg" alt="Queries" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Queries</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">14 queries</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Tag.svg" alt="Tags" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Tags</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-[4px] flex-1">
                          {['Compliance', 'Audit', 'Regulatory'].map((label, i) => (
                            <span key={i} className="px-[4px] h-[16px] flex items-center bg-bg-subtle rounded-[4px] text-[10px] font-medium text-fg-muted leading-[14px]">{label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/User.svg" alt="Owner" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Owner</span>
                        </div>
                        <div className="flex items-center gap-[4px] flex-1">
                          <div className="w-4 h-4 rounded-full bg-bg-subtle flex items-center justify-center text-[9px] font-medium text-fg-base opacity-90">E</div>
                          <span className="text-xs text-fg-base leading-[16px]">emily.zhang@company.com</span>
                        </div>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/Calendar Edit.svg" alt="Created on" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Created on</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">January 15, 2026</span>
                      </div>
                      <div className="flex items-center h-[28px]">
                        <div className="flex items-center gap-[4px] w-[128px] shrink-0 text-fg-subtle">
                          <SvgIcon src="/central_icons/History.svg" alt="Last edited" width={16} height={16} className="text-fg-subtle" />
                          <span className="text-xs leading-[16px]">Last edited</span>
                        </div>
                        <span className="text-xs text-fg-base leading-[16px] flex-1">1d ago</span>
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
                  
                  {/* Memory Section */}
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
                  
                  {/* Instructions Section */}
                  <div className="border-t border-border-base px-[14px] pt-[8px] pb-[20px]">
                    <div className="flex items-center justify-between h-[44px] pl-[6px]">
                      <span className="text-xs font-medium text-fg-base leading-[20px]">Instructions</span>
                      <button className="h-[24px] px-[6px] py-[2px] text-xs font-medium text-fg-subtle hover:text-fg-base transition-colors leading-[16px]">
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
    </div>
  );
}
