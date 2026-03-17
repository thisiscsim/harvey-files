"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { detectArtifactType } from "@/lib/artifact-detection";
import { 
  ArrowLeft, Users, Briefcase, ChevronRight, 
  Paperclip, CornerDownLeft, Plus,
  Copy, Download, RotateCcw, ThumbsUp, ThumbsDown, 
  Scale, Mic, ListPlus, CloudUpload, FileSearch, 
  LoaderCircle, SquarePen, FilePen, Table2, X
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { workflows as allWorkflows, type Workflow, type WorkflowType } from "@/lib/workflows";
import Image from "next/image";
import ThinkingState from "@/components/thinking-state";
import { TextLoop } from "../../../components/motion-primitives/text-loop";
import FileManagementDialog from "@/components/file-management-dialog";
import IManageFilePickerDialog from "@/components/imanage-file-picker-dialog";
import VaultFilePickerDialog from "@/components/vault-file-picker-dialog";
import ReviewTableArtifactCard from "@/components/review-table-artifact-card";
import DraftArtifactPanel from "@/components/draft-artifact-panel";
import ReviewArtifactPanel from "@/components/review-artifact-panel";
import PrecedentCompaniesTable from "@/components/precedent-companies-table";
import ConfigurationDrawer from "@/components/configuration-drawer";
import { SvgIcon } from "@/components/svg-icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Message type - matches harvey-s1 workflow properties
type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'artifact' | 'files';
  artifactData?: {
    title: string;
    subtitle: string;
    variant?: 'review' | 'draft';
  };
  filesData?: Array<{
    id: string;
    name: string;
    type: 'folder' | 'file';
    modifiedDate: string;
    size?: string;
    path: string;
  }>;
  fileSource?: 'imanage' | 'vault' | 'local';
  isLoading?: boolean;
  thinkingContent?: ReturnType<typeof getThinkingContent>;
  loadingState?: {
    showSummary: boolean;
    visibleBullets: number;
    showAdditionalText: boolean;
    visibleChildStates: number;
  };
  isWorkflowResponse?: boolean;
  workflowTitle?: string;
  isFirstWorkflowMessage?: boolean;
  showThinking?: boolean;
  showFileReview?: boolean;
  fileReviewContent?: {
    summary: string;
    files: Array<{
      name: string;
      type: 'pdf' | 'docx' | 'spreadsheet' | 'folder' | 'text';
    }>;
    totalFiles: number;
  };
  fileReviewLoadingState?: {
    isLoading: boolean;
    loadedFiles: number;
  };
  // Workflow action buttons
  workflowButtons?: Array<{
    label: string;
    action: string;
  }>;
  // S-1 Shell draft generation
  showDraftGeneration?: boolean;
  draftGenerationLoadingState?: {
    isLoading: boolean;
    showSummary?: boolean;
    visibleBullets?: number;
  };
  // Risk Factors workflow - EDGAR review
  showEdgarReview?: boolean;
  edgarReviewContent?: {
    summary: string;
    filings: Array<{
      company: string;
      date: string;
      type: string;
    }>;
    totalFilings: number;
  };
  edgarReviewLoadingState?: {
    isLoading: boolean;
    loadedFilings: number;
  };
  edgarReviewCompleteMessage?: string;
  // Precedent companies data (full data structure)
  precedentCompaniesData?: Array<{
    id: string;
    company: string;
    ticker: string;
    tier: string;
    tierColor: string;
    similarity: number;
    industry: string;
    revenueAtIPO: string;
    dateOfFiling: string;
    issuersCounsel: string;
    uwCounsel: string;
    class: string;
    selected: boolean;
    s1Url?: string;
    logo?: string;
  }>;
  // Time window thinking state
  showTimeWindowThinking?: boolean;
  timeWindowThinkingState?: {
    isLoading: boolean;
    showSummary?: boolean;
    visibleBullets?: number;
  };
  timeWindowMessage?: string;
  // Counsel filter selection
  selectedCounselFilter?: 'latham' | 'nofilter';
  // Precedent table confirmation
  isPrecedentTableConfirmed?: boolean;
  goldenPrecedentId?: string | null;
  // Review table generation
  showReviewTableGeneration?: boolean;
  reviewTableGenerationLoadingState?: {
    isLoading: boolean;
    showSummary?: boolean;
    visibleBullets?: number;
  };
  reviewTableArtifactData?: {
    title: string;
    subtitle: string;
  };
  reviewTableMessage?: string;
  // Research flow - multi-step inline thinking states
  researchFlowContent?: {
    steps: Array<{
      thinkingTitle: string;
      thinkingContent: string;
      response: string;
      durationSeconds?: number;
      buttons?: Array<{
        label: string;
        onClick?: () => void;
      }>;
    }>;
  };
  researchFlowLoadingState?: {
    currentStep: number;
    isThinking: boolean;
    showResponse: boolean;
  };
  // Research workflow - todo list
  showResearchTodos?: boolean;
  researchTodos?: Array<{
    id: string;
    text: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  // Research workflow - SEC search steps (array to support multiple search steps)
  secSearchSteps?: Array<{
    stepIndex: number;
    content: {
      summary: string;
      documents: Array<{
        title: string;
        date: string;
        type: string;
      }>;
      totalDocuments: number;
    };
    loadingState: {
      isLoading: boolean;
      loadedDocuments: number;
    };
    completeMessage?: string;
  }>;
  // Precedent companies table (simple version)
  showPrecedentTable?: boolean;
  precedentCompanies?: Array<{
    name: string;
    industry: string;
    filingDate: string;
    counsel: string;
  }>;
};

// Thinking content generator - same as assistant page
function getThinkingContent(variant: 'analysis' | 'draft' | 'review'): {
  summary: string;
  bullets: string[];
  additionalText?: string;
  childStates?: Array<{
    variant: 'analysis' | 'draft' | 'review';
    title: string;
    summary?: string;
    bullets?: string[];
  }>;
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

// Research flow steps - sequential thinking states and responses
const researchFlowSteps = [
  {
    thinkingTitle: 'Thinking...',
    thinkingContent: 'The user is asking to compile authoritative, up-to-date analysis of SEC climate disclosure rules. Scope spans regulatory text, interpretive guidance, enforcement posture, and secondary commentary. Output must be client-ready and structured for executive consumption.',
    response: "I'm going to research the SEC's climate disclosure framework end-to-end and synthesize it into a structured legal memo. This will involve regulatory text, staff guidance, enforcement signals, and recent legal interpretations. Let me formulate a plan of approach. I'll pause if I need clarification on jurisdiction, audience, or risk tolerance.",
    type: 'text'
  },
  {
    thinkingTitle: 'Thinking...',
    thinkingContent: 'This work is quite substantial. I will generate a plan of approach to ensure comprehensive coverage of the regulatory landscape, enforcement actions, and practical implementation guidance.',
    response: "Here's my research plan. I'll work through each step systematically to ensure comprehensive coverage.",
    type: 'todos'
  },
  {
    thinkingTitle: 'Searching sec.gov...',
    thinkingContent: 'I will now navigate to sec.gov and search for climate disclosure rules, adopting releases, and interpretive guidance to identify the full regulatory framework.',
    response: "I've searched the sec.gov for the final and proposed climate disclosure rules, including adopting releases and fact sheets. Now I will pull relevant SEC staff guidance, bulletins, and interpretive materials that clarify how the rules are expected to be applied in practice.",
    type: 'sec-search'
  },
  {
    thinkingTitle: 'Searching sec.gov...',
    thinkingContent: "I've identified the climate disclosure rules from March 2022 to April 2024, but rules alone insufficient. Need staff interpretation to understand enforcement expectations. Prioritize Staff Accounting Bulletins, Division of Corporation Finance guidance, FAQs, and public comment letters signaling interpretive friction.",
    response: "I've cross-referenced recent SEC enforcement actions and EDGAR filings to assess how aggressively climate disclosures are being scrutinized. Perfect, now I will look up law firms, regulators, and legal press often surface practical implications faster",
    type: 'sec-search-2'
  },
  {
    thinkingTitle: 'Searching external sources...',
    thinkingContent: "Now I will look up public sources on law firms, regulators, and legal press often surface practical implications faster. Focus on post-rule analyses and litigation risk commentary.",
    response: "I've reviewed recent legal news and law firm analyses for updates, challenges, and emerging interpretations of the SEC's climate disclosure rules. Now before I start drafting out the memo, I have a few questions:\n• Who is the intended audience (Board, GC, compliance team, investors, etc)?\n• Should the recommendations assume a conservative or minimal-compliance posture?\n• Do you want this framed as advisory guidance or as a formal legal memo?",
    type: 'sec-search-3'
  }
];

// Mock todo items for research workflow with status: 'pending' | 'in_progress' | 'completed'
const researchTodoItems = [
  { id: '1', text: 'Search SEC.gov for final and proposed climate disclosure rules', status: 'pending' as const },
  { id: '2', text: 'Cross-reference enforcement actions and EDGAR filings', status: 'pending' as const },
  { id: '3', text: 'Review legal news and law firm analyses for updates', status: 'pending' as const },
  { id: '4', text: 'Draft memo with citations and recommendations', status: 'pending' as const },
];

// Get the first 4 workflows as recommended for this project context
const recommendedWorkflows = allWorkflows.slice(0, 4);

// Chat thread type for multi-chat support
interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
  agentState: {
    isRunning: boolean;
    taskName: string;
    currentAction?: string;
    currentFile?: string;
    isAwaitingInput?: boolean;
  };
}

export default function StubhubIPOFilingPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("Stubhub IPO Filing");
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Multi-chat state
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  
  // Wrapper to set both state and ref
  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id;
    setActiveChatIdState(id);
  }, []);
  
  // Get active chat
  const activeChat = chatThreads.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];
  const isLoading = activeChat?.isLoading || false;
  const chatTitle = activeChat?.title || 'New chat';
  
  // Helper to update active chat (uses ref for latest value)
  const updateActiveChat = useCallback((updater: (chat: ChatThread) => ChatThread) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? updater(chat) : chat
    ));
  }, []);
  
  // Helper to set messages for active chat (uses ref for latest value)
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
  
  // Helper to set loading for active chat (uses ref for latest value)
  const setIsLoading = useCallback((loading: boolean) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? { ...chat, isLoading: loading } : chat
    ));
  }, []);
  
  // Helper to set chat title for active chat (uses ref for latest value)
  const setChatTitle = useCallback((title: string) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => 
      chat.id === currentChatId ? { ...chat, title } : chat
    ));
  }, []);
  
  // Helper to set agent state for active chat (uses ref for latest value)
  const setAgentState = useCallback((updater: { isRunning: boolean; taskName: string; currentAction?: string; currentFile?: string; isAwaitingInput?: boolean } | ((prev: ChatThread['agentState']) => ChatThread['agentState'])) => {
    const currentChatId = activeChatIdRef.current;
    setChatThreads(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const newAgentState = typeof updater === 'function' ? updater(chat.agentState) : updater;
        return { ...chat, agentState: newAgentState };
      }
      return chat;
    }));
  }, []);
  
  // Get current agent state
  const agentState = activeChat?.agentState || { isRunning: false, taskName: '' };
  
  // Get all active agents (for drawer)
  const activeAgents = chatThreads.filter(chat => chat.agentState.isRunning);
  
  // Create new chat
  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatThread = {
      id: newChatId,
      title: 'New chat',
      messages: [],
      isLoading: false,
      agentState: { isRunning: false, taskName: '' }
    };
    setChatThreads(prev => [...prev, newChat]);
    setActiveChatId(newChatId);
    // Close any open artifact panels
    setUnifiedArtifactPanelOpen(false);
    setDraftArtifactPanelOpen(false);
    setReviewArtifactPanelOpen(false);
  }, []);
  
  // Ensure a chat exists before sending a message - returns the chatId to use
  const ensureChatExists = useCallback((): string => {
    const currentChatId = activeChatIdRef.current;
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`;
      const newChat: ChatThread = {
        id: newChatId,
        title: 'New chat',
        messages: [],
        isLoading: false,
        agentState: { isRunning: false, taskName: '' }
      };
      setChatThreads(prev => [...prev, newChat]);
      setActiveChatId(newChatId);
      return newChatId;
    }
    return currentChatId;
  }, [setActiveChatId]);
  
  // Helper to update a specific chat by ID (for use when activeChatId may not be updated yet)
  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setChatThreads(prev => prev.map(chat => 
      chat.id === chatId ? updater(chat) : chat
    ));
  }, []);
  
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  
  // Track if we just switched chats to skip animations
  const [justSwitchedChat, setJustSwitchedChat] = useState(false);
  
  // Artifact panel state
  const [unifiedArtifactPanelOpen, setUnifiedArtifactPanelOpen] = useState(false);
  const [currentArtifactType, setCurrentArtifactType] = useState<'draft' | 'review' | null>(null);
  const [selectedDraftArtifact, setSelectedDraftArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [selectedReviewArtifact, setSelectedReviewArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [draftArtifactPanelOpen, setDraftArtifactPanelOpen] = useState(false);
  const [draftContentType, setDraftContentType] = useState<'s1-shell' | 'memorandum'>('memorandum');
  const [reviewArtifactPanelOpen, setReviewArtifactPanelOpen] = useState(false);
  
  // Artifact title editing
  const [isEditingDraftArtifactTitle, setIsEditingDraftArtifactTitle] = useState(false);
  const [editedDraftArtifactTitle, setEditedDraftArtifactTitle] = useState('');
  const [isEditingReviewArtifactTitle, setIsEditingReviewArtifactTitle] = useState(false);
  const [editedReviewArtifactTitle, setEditedReviewArtifactTitle] = useState('');
  const draftArtifactTitleInputRef = useRef<HTMLInputElement>(null);
  const reviewArtifactTitleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Dialog state
  const [isFileManagementOpen, setIsFileManagementOpen] = useState(false);
  const [isIManagePickerOpen, setIsIManagePickerOpen] = useState(false);
  const [isVaultPickerOpen, setIsVaultPickerOpen] = useState(false);
  
  // Uploaded files state for drawer
  interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadProgress: number;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    uploadedAt: Date;
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Simulate file upload progress
  const simulateFileUpload = useCallback((fileId: string) => {
    const uploadInterval = setInterval(() => {
      setUploadedFiles(prev => {
        const file = prev.find(f => f.id === fileId);
        if (!file || file.uploadProgress >= 100) {
          clearInterval(uploadInterval);
          return prev;
        }
        
        const increment = Math.random() * 15 + 5;
        const newProgress = Math.min(file.uploadProgress + increment, 100);
        
        return prev.map(f => {
          if (f.id === fileId) {
            if (newProgress >= 100) {
              setTimeout(() => {
                setUploadedFiles(p => p.map(pf => 
                  pf.id === fileId ? { ...pf, status: 'processing' as const } : pf
                ));
                setTimeout(() => {
                  setUploadedFiles(p => p.map(pf => 
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
  const [shareArtifactDialogOpen, setShareArtifactDialogOpen] = useState(false);
  const [exportReviewDialogOpen, setExportReviewDialogOpen] = useState(false);
  const [isConfigurationDrawerOpen, setIsConfigurationDrawerOpen] = useState(false); // Opens when files uploaded or during search
  
  // Check if any artifact panel is open
  const anyArtifactPanelOpen = draftArtifactPanelOpen || reviewArtifactPanelOpen || unifiedArtifactPanelOpen;
  
  // Switch to a specific chat
  const switchToChat = useCallback((chatId: string) => {
    // Mark that we're switching chats to skip animations
    setJustSwitchedChat(true);
    setActiveChatId(chatId);
    
    // Reset the flag after a short delay to allow new messages to animate
    setTimeout(() => setJustSwitchedChat(false), 100);
    
    // Find the chat we're switching to
    const targetChat = chatThreads.find(c => c.id === chatId);
    if (!targetChat) {
      setUnifiedArtifactPanelOpen(false);
      setDraftArtifactPanelOpen(false);
      setReviewArtifactPanelOpen(false);
      return;
    }
    
    // Look for artifact in the target chat's messages
    let foundDraftArtifact: { title: string; subtitle: string } | null = null;
    let foundReviewArtifact: { title: string; subtitle: string } | null = null;
    
    for (const msg of targetChat.messages) {
      if (msg.artifactData) {
        if (msg.artifactData.variant === 'draft') {
          foundDraftArtifact = { title: msg.artifactData.title, subtitle: msg.artifactData.subtitle };
        } else {
          foundReviewArtifact = { title: msg.artifactData.title, subtitle: msg.artifactData.subtitle };
        }
      }
      if (msg.reviewTableArtifactData) {
        foundReviewArtifact = { title: msg.reviewTableArtifactData.title, subtitle: msg.reviewTableArtifactData.subtitle };
      }
    }
    
    // If any artifact panel was open, try to switch to the target chat's artifact
    if (unifiedArtifactPanelOpen) {
      if (foundDraftArtifact) {
        setSelectedDraftArtifact(foundDraftArtifact);
        setCurrentArtifactType('draft');
        setDraftArtifactPanelOpen(true);
        setReviewArtifactPanelOpen(false);
        // Set content type based on artifact title
        setDraftContentType(foundDraftArtifact.title.toLowerCase().includes('s-1') ? 's1-shell' : 'memorandum');
      } else if (foundReviewArtifact) {
        setSelectedReviewArtifact(foundReviewArtifact);
        setCurrentArtifactType('review');
        setReviewArtifactPanelOpen(true);
        setDraftArtifactPanelOpen(false);
      } else {
        // No artifact in target chat, close all panels
        setUnifiedArtifactPanelOpen(false);
        setDraftArtifactPanelOpen(false);
        setReviewArtifactPanelOpen(false);
        setSelectedDraftArtifact(null);
        setSelectedReviewArtifact(null);
        setCurrentArtifactType(null);
      }
    }
  }, [chatThreads, unifiedArtifactPanelOpen, setActiveChatId]);
  
  // Shared animation configuration for consistency
  const PANEL_ANIMATION = {
    duration: 0.3,
    ease: "easeOut" as const
  };
  
  // Panel resize constants
  const MIN_CHAT_WIDTH = 400;
  const MAX_CHAT_WIDTH = 800;
  const MIN_DRAWER_WIDTH = 300;
  const MAX_DRAWER_WIDTH = 500;
  const DEFAULT_DRAWER_WIDTH = 400;
  
  // Chat panel state
  const [chatOpen, setChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(401);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResizer, setIsHoveringResizer] = useState(false);
  
  // Chat tabs overflow state
  const chatTabsRef = useRef<HTMLDivElement>(null);
  const [showLeftTabGradient, setShowLeftTabGradient] = useState(false);
  const [showRightTabGradient, setShowRightTabGradient] = useState(false);
  
  // Drawer resize state
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [isHoveringDrawerResizer, setIsHoveringDrawerResizer] = useState(false);
  
  // Threshold detection for collapse/expand behavior
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPastCollapseThresholdRef = useRef(false);
  const isPastExpandThresholdRef = useRef(false);
  const [isPastCollapseThreshold, setIsPastCollapseThreshold] = useState(false);
  const [isPastExpandThreshold, setIsPastExpandThreshold] = useState(false);
  const [shouldTriggerCollapse, setShouldTriggerCollapse] = useState(false);
  const [shouldTriggerExpand, setShouldTriggerExpand] = useState(false);
  
  // Track if chat panel is being toggled interactively
  const [isChatToggling, setIsChatToggling] = useState(false);

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
      const lastMessage = messages[messages.length - 1];
      const isArtifact = lastMessage.type === 'artifact';
      const delay = isArtifact ? 500 : 100;
      
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, delay);

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

  // Handle saving draft artifact title
  const handleSaveDraftArtifactTitle = useCallback(() => {
    if (editedDraftArtifactTitle.trim() && selectedDraftArtifact) {
      if (editedDraftArtifactTitle !== selectedDraftArtifact.title) {
        setSelectedDraftArtifact({
          ...selectedDraftArtifact,
          title: editedDraftArtifactTitle
        });
        toast.success("Draft artifact title updated");
      }
    } else if (selectedDraftArtifact) {
      setEditedDraftArtifactTitle(selectedDraftArtifact.title);
    }
    setIsEditingDraftArtifactTitle(false);
  }, [editedDraftArtifactTitle, selectedDraftArtifact]);

  // Handle saving review artifact title
  const handleSaveReviewArtifactTitle = useCallback(() => {
    if (editedReviewArtifactTitle.trim() && selectedReviewArtifact) {
      if (editedReviewArtifactTitle !== selectedReviewArtifact.title) {
        setSelectedReviewArtifact({
          ...selectedReviewArtifact,
          title: editedReviewArtifactTitle
        });
        toast.success("Review artifact title updated");
      }
    } else if (selectedReviewArtifact) {
      setEditedReviewArtifactTitle(selectedReviewArtifact.title);
    }
    setIsEditingReviewArtifactTitle(false);
  }, [editedReviewArtifactTitle, selectedReviewArtifact]);
  
  // Send workflow message - matches harvey-s1 exact messages
  const sendWorkflowMessage = useCallback((workflowTitle: string) => {
    // Ensure a chat exists and get the chatId
    const chatId = ensureChatExists();
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'text',
      isLoading: true,
      isWorkflowResponse: true,
      workflowTitle: workflowTitle,
      isFirstWorkflowMessage: true,
      showThinking: false
    };
    
    // Update chat state in a single call to avoid race conditions
    updateChatById(chatId, chat => ({
      ...chat,
      isLoading: true,
      title: workflowTitle,
      messages: [assistantMessage],
      agentState: {
        isRunning: true,
        taskName: workflowTitle,
        currentAction: 'Processing workflow...',
      }
    }));
    
    // Open configuration drawer to show agent
    setIsConfigurationDrawerOpen(true);
    setTimeout(() => scrollToBottom(), 50);
    
    // Show the content quickly without thinking states (matching harvey-s1 timing)
    setTimeout(() => {
      updateChatById(chatId, chat => {
        const messages = chat.messages.map((msg, idx) => {
          if (idx === 0 && msg.role === 'assistant' && msg.isLoading) {
            let content = '';
            
            if (workflowTitle.toLowerCase().includes('s-1') && workflowTitle.toLowerCase().includes('risk factors')) {
              content = "Let's draft comprehensive risk factors for your S-1 filing. To create accurate and company-specific risk factors, I'll need supporting materials that highlight your business operations, financial position, industry challenges, and regulatory environment. This includes financials, business plans, competitor analyses, and any existing risk assessments. How would you like to upload your supporting documents?";
            } else if (workflowTitle.toLowerCase().includes('s-1')) {
              content = "Let's get going on drafting your S-1. Before we get started, I'll need some supporting materials (charters, financials, press releases, prior filings). I'll also need key deal details like offering type, structure, and use of proceeds. After I have all the information, I can generate a draft S-1 shell that you can edit in draft mode. First things first, how would you like to upload your supporting documents?";
            } else if (workflowTitle.toLowerCase().includes('employment')) {
              content = "I'll help you draft employment agreements. To create comprehensive and legally sound employment contracts, I'll need information about the role, compensation structure, benefits, and any specific terms you want to include. Do you have any existing templates or specific requirements to share?";
            } else if (workflowTitle.toLowerCase().includes('post-closing') || workflowTitle.toLowerCase().includes('timeline')) {
              content = "I'll help you generate post-closing timelines. To create accurate and comprehensive timelines, I'll need information about the transaction structure, key milestones, and any regulatory requirements. How would you like to upload your supporting documents?";
            } else {
              content = `I'll help you with "${workflowTitle}". What specific information or documents would you like me to work with?`;
            }
            
            return {
              ...msg,
              content,
              isLoading: false
            };
          }
          return msg;
        });
        
        return {
          ...chat,
          isLoading: false,
          messages
        };
      });
      scrollToBottom();
    }, 300); // Shorter delay matching harvey-s1
  }, [scrollToBottom, ensureChatExists, updateChatById]);

  // Send research message - multi-step thinking flow with todos and SEC search
  const sendResearchMessage = useCallback((userMessage: string) => {
    // Ensure a chat exists and get the chatId
    const chatId = ensureChatExists();
    
    const title = userMessage.length > 40 ? userMessage.substring(0, 40) + '...' : userMessage;
    
    // Add user message and assistant message
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      type: 'text'
    };
    
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      type: 'text',
      isLoading: true,
      showThinking: false,
      researchFlowContent: {
        steps: researchFlowSteps.map(step => ({
          thinkingTitle: step.thinkingTitle,
          thinkingContent: step.thinkingContent,
          response: step.response,
          durationSeconds: 6
        }))
      },
      researchFlowLoadingState: {
        currentStep: 0,
        isThinking: true,
        showResponse: false
      }
    };
    
    // Update chat state in a single call to avoid race conditions
    updateChatById(chatId, chat => ({
      ...chat,
      isLoading: true,
      title,
      messages: [userMsg, assistantMsg],
      agentState: {
        isRunning: true,
        taskName: title,
        currentAction: 'Analyzing research request...',
      }
    }));
    
    // Open configuration drawer to show agent
    setIsConfigurationDrawerOpen(true);
    setTimeout(() => scrollToBottom(), 50);
    
    // Process steps sequentially
    let currentStep = 0;
    
    const processStep = () => {
      if (currentStep >= researchFlowSteps.length) {
        // All steps complete - awaiting user input
        updateChatById(chatId, chat => ({
          ...chat,
          isLoading: false,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant'
              ? { ...msg, isLoading: false }
              : msg
          ),
          agentState: {
            ...chat.agentState,
            currentAction: 'Awaiting user input...',
            currentFile: undefined,
            isAwaitingInput: true,
          }
        }));
        return;
      }
      
      const stepConfig = researchFlowSteps[currentStep];
      
      // Update agent state based on current step
      const agentActionMap: Record<string, string> = {
        'text': 'Formulating research approach...',
        'todos': 'Creating research plan...',
        'sec-search': 'Searching SEC.gov for climate disclosure rules...',
        'sec-search-2': 'Cross-referencing enforcement actions...',
        'sec-search-3': 'Reviewing law firm analyses...',
      };
      
      const agentAction = agentActionMap[stepConfig.type] || 'Processing...';
      updateChatById(chatId, chat => ({
        ...chat,
        agentState: {
          ...chat.agentState,
          currentAction: agentAction,
          currentFile: undefined, // Clear file when starting new step
        }
      }));
      
      // Show thinking for current step
      // For SEC search steps, show the SEC search UI immediately with loading state
      const isSecSearchType = stepConfig.type === 'sec-search' || stepConfig.type === 'sec-search-2' || stepConfig.type === 'sec-search-3';
      if (isSecSearchType) {
        let documents: Array<{ title: string; date: string; type: string }>;
        
        if (stepConfig.type === 'sec-search-3') {
          documents = [
            { title: "Latham & Watkins Alert", date: "(03152024)", type: "Law Firm" },
            { title: "Sullivan & Cromwell", date: "(03082024)", type: "Law Firm" },
            { title: "Skadden Climate Update", date: "(04022024)", type: "Law Firm" },
            { title: "Davis Polk Analysis", date: "(03122024)", type: "Law Firm" },
            { title: "Reuters Legal", date: "(03282024)", type: "Legal Press" },
            { title: "Law360 Coverage", date: "(04052024)", type: "Legal Press" },
            { title: "Harvard Law Forum", date: "(03182024)", type: "Academic" }
          ];
        } else if (stepConfig.type === 'sec-search-2') {
          documents = [
            { title: "SAB No. 121", date: "(03312022)", type: "Staff Bulletin" },
            { title: "Corp Fin CDI Update", date: "(09152023)", type: "Guidance" },
            { title: "Comment Letter: Tesla", date: "(01182024)", type: "Comment" },
            { title: "Comment Letter: Exxon", date: "(11222023)", type: "Comment" },
            { title: "Enforcement: BNY Mellon", date: "(05232022)", type: "Action" },
            { title: "Enforcement: Goldman", date: "(11222022)", type: "Action" },
            { title: "EDGAR Filing Review", date: "(02282024)", type: "Analysis" },
            { title: "Climate FAQ Update", date: "(04012024)", type: "FAQ" }
          ];
        } else {
          documents = [
            { title: "Release No. 33-11275", date: "(03062024)", type: "Final Rule" },
            { title: "Release No. 33-11042", date: "(03212022)", type: "Proposed Rule" },
            { title: "Staff Bulletin No. 14L", date: "(11032021)", type: "Staff Guidance" },
            { title: "Commission Statement", date: "(02242021)", type: "Policy Statement" },
            { title: "Corp Fin Disclosure", date: "(09222021)", type: "Sample Letter" },
            { title: "Interpretive Release", date: "(01242010)", type: "Guidance" },
            { title: "Staff Legal Bulletin", date: "(10272023)", type: "Legal Bulletin" },
            { title: "Compliance Guide", date: "(04152024)", type: "FAQ" },
            { title: "Fact Sheet", date: "(03062024)", type: "Summary" }
          ];
        }
        
        const newSecSearchStep = {
          stepIndex: currentStep,
          content: {
            summary: stepConfig.thinkingContent,
            documents,
            totalDocuments: documents.length
          },
          loadingState: {
            isLoading: true,
            loadedDocuments: 0
          }
        };
        
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant'
              ? { 
                  ...msg, 
                  researchFlowLoadingState: { 
                    currentStep, 
                    isThinking: true, 
                    showResponse: false 
                  },
                  secSearchSteps: [...(msg.secSearchSteps || []), newSecSearchStep]
                }
              : msg
          )
        }));
        
        // Open configuration drawer when SEC search starts
        setIsConfigurationDrawerOpen(true);
      } else {
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant'
              ? { 
                  ...msg, 
                  researchFlowLoadingState: { 
                    currentStep, 
                    isThinking: true, 
                    showResponse: false 
                  } 
                }
              : msg
          )
        }));
      }
      
      // Determine delay based on step type
      const isSecSearchTypeForDelay = stepConfig.type === 'sec-search' || stepConfig.type === 'sec-search-2' || stepConfig.type === 'sec-search-3';
      const thinkingDelay = isSecSearchTypeForDelay ? 1000 : 2500;
      
      // After thinking delay, show response based on step type
      setTimeout(() => {
        if (stepConfig.type === 'todos') {
          // For todos step, show todos with first one in progress
          const initialTodos = researchTodoItems.map((todo, idx) => ({
            ...todo,
            status: idx === 0 ? 'in_progress' as const : 'pending' as const
          }));
          
          updateChatById(chatId, chat => ({
            ...chat,
            messages: chat.messages.map((msg, idx) => 
              idx === chat.messages.length - 1 && msg.role === 'assistant'
                ? { 
                    ...msg, 
                    researchFlowLoadingState: { 
                      currentStep, 
                      isThinking: false, 
                      showResponse: true 
                    },
                    showResearchTodos: true,
                    researchTodos: initialTodos
                  }
                : msg
            )
          }));
          scrollToBottom();
          
          // Move to next step
          currentStep++;
          setTimeout(() => processStep(), 1200);
          
        } else if (stepConfig.type === 'sec-search' || stepConfig.type === 'sec-search-2' || stepConfig.type === 'sec-search-3') {
          // For SEC search steps, just start the document loading progress
          // (The UI was already set up when the step started)
          const documentCount = stepConfig.type === 'sec-search-3' ? 7 : (stepConfig.type === 'sec-search-2' ? 8 : 9);
          const currentStepIndex = currentStep;
          
          updateChatById(chatId, chat => ({
            ...chat,
            messages: chat.messages.map((msg, idx) => 
              idx === chat.messages.length - 1 && msg.role === 'assistant'
                ? { 
                    ...msg, 
                    researchFlowLoadingState: { 
                      currentStep, 
                      isThinking: false, 
                      showResponse: false
                    }
                  }
                : msg
            )
          }));
          scrollToBottom();
          
          // Simulate SEC search progress (longer duration)
          let loadedCount = 0;
          const progressInterval = setInterval(() => {
            loadedCount++;
            
            // Update agent state with current document being reviewed
            // Get documents from chat state and update both messages and agent state
            updateChatById(chatId, chat => {
              const assistantMsg = chat.messages[chat.messages.length - 1];
              let currentFile: string | undefined = undefined;
              
              if (assistantMsg?.role === 'assistant' && assistantMsg.secSearchSteps) {
                const currentSearchStep = assistantMsg.secSearchSteps.find(s => s.stepIndex === currentStepIndex);
                const stepDocuments = currentSearchStep?.content.documents || [];
                if (loadedCount <= stepDocuments.length) {
                  const currentDoc = stepDocuments[loadedCount - 1];
                  currentFile = currentDoc?.title || undefined;
                }
              }
              
              return {
                ...chat,
                agentState: {
                  ...chat.agentState,
                  currentFile,
                },
                messages: chat.messages.map((msg, idx) => {
                  if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.secSearchSteps) {
                    return {
                      ...msg,
                      secSearchSteps: msg.secSearchSteps.map(step => 
                        step.stepIndex === currentStepIndex
                          ? { ...step, loadingState: { ...step.loadingState, loadedDocuments: loadedCount } }
                          : step
                      )
                    };
                  }
                  return msg;
                })
              };
            });
            scrollToBottom();
            
            if (loadedCount >= documentCount) {
              clearInterval(progressInterval);
              
              // Complete SEC search and show response, update todo statuses
              setTimeout(() => {
                updateChatById(chatId, chat => {
                  const messages = chat.messages.map((msg, idx) => {
                    if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.secSearchSteps) {
                      // Determine which todo to complete based on step type
                      // sec-search = todo 1, sec-search-2 = todo 2, sec-search-3 = todo 3
                      const todoIndexToComplete = stepConfig.type === 'sec-search' ? 0 : 
                                                   stepConfig.type === 'sec-search-2' ? 1 : 2;
                      const nextTodoIndex = todoIndexToComplete + 1;
                      
                      const updatedTodos = msg.researchTodos?.map((todo, tIdx) => {
                        if (tIdx === todoIndexToComplete) {
                          return { ...todo, status: 'completed' as const };
                        } else if (tIdx === nextTodoIndex && nextTodoIndex < 3) {
                          // Set next todo to in_progress (but not todo 4, which is for draft)
                          return { ...todo, status: 'in_progress' as const };
                        }
                        return todo;
                      });
                      
                      return {
                        ...msg,
                        researchTodos: updatedTodos,
                        secSearchSteps: msg.secSearchSteps.map(step => 
                          step.stepIndex === currentStepIndex
                            ? { 
                                ...step, 
                                loadingState: { isLoading: false, loadedDocuments: documentCount },
                                completeMessage: stepConfig.response
                              }
                            : step
                        )
                      };
                    }
                    return msg;
                  });
                  return { ...chat, messages };
                });
                scrollToBottom();
                
                // Move to next step
                currentStep++;
                setTimeout(() => processStep(), 800);
              }, 500);
            }
          }, 800); // Longer interval for SEC search
          
        } else {
          // Regular text response
          updateChatById(chatId, chat => ({
            ...chat,
            messages: chat.messages.map((msg, idx) => 
              idx === chat.messages.length - 1 && msg.role === 'assistant'
                ? { 
                    ...msg, 
                    researchFlowLoadingState: { 
                      currentStep, 
                      isThinking: false, 
                      showResponse: true 
                    } 
                  }
                : msg
            )
          }));
          scrollToBottom();
          
          // Move to next step
          currentStep++;
          setTimeout(() => processStep(), 800);
        }
      }, thinkingDelay);
    };
    
    // Start processing after initial delay
    setTimeout(() => {
      processStep();
    }, 300);
  }, [scrollToBottom, ensureChatExists, updateChatById]);

  // Send message - handles regular messages and workflow continuations
  const sendMessage = useCallback((messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue;
    if (messageToSend.trim() && !isLoading) {
      // Ensure a chat exists and get the chatId
      const chatId = ensureChatExists();
      
      const userMessage = messageToSend;
      setInputValue('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px';
      }
      
      // Check if message contains "Research" - trigger research flow
      if (userMessage.toLowerCase().includes('research')) {
        sendResearchMessage(userMessage);
        return;
      }
      
      // Check if this is a response to research workflow questions (after step 5)
      const lastAssistantMsgForResearch = [...messages].reverse().find(m => m.role === 'assistant');
      const isResearchWorkflowComplete = lastAssistantMsgForResearch?.secSearchSteps?.some(
        step => step.completeMessage?.includes('I have a few questions')
      );
      
      if (isResearchWorkflowComplete) {
        // User responded to the research questions - generate draft
        // Update todo 4 to in_progress, add user message, and set agent state
        updateChatById(chatId, chat => ({
          ...chat,
          isLoading: true,
          messages: [
            ...chat.messages.map((msg) => {
              if (msg.role === 'assistant' && msg.researchTodos) {
                return {
                  ...msg,
                  researchTodos: msg.researchTodos.map((todo, tIdx) => 
                    tIdx === 3 ? { ...todo, status: 'in_progress' as const } : todo
                  )
                };
              }
              return msg;
            }),
            { role: 'user' as const, content: userMessage, type: 'text' as const }
          ],
          agentState: {
            ...chat.agentState,
            isRunning: true,
            currentAction: 'Synthesizing research findings...',
            isAwaitingInput: false,
          }
        }));
        setTimeout(() => scrollToBottom(), 50);
        
        // Add assistant response with thinking and draft generation
        setTimeout(() => {
          const thinkingContent = {
            summary: "The user has provided their preferences for the memo. I will now synthesize all the research findings into a comprehensive legal memo tailored to their specified audience, compliance posture, and format requirements.",
            bullets: [
              "Structure memo based on audience requirements",
              "Apply appropriate compliance framework",
              "Draft executive summary and key findings"
            ],
            additionalText: ""
          };
          
          const assistantMsg: Message = {
            role: 'assistant',
            content: '',
            type: 'text',
            isLoading: true,
            thinkingContent,
            loadingState: {
              showSummary: false,
              visibleBullets: 0,
              showAdditionalText: false,
              visibleChildStates: 0
            }
          };
          
          updateChatById(chatId, chat => ({
            ...chat,
            messages: [...chat.messages, assistantMsg]
          }));
          setTimeout(() => scrollToBottom(), 100);
          
          // Show thinking summary
          setTimeout(() => {
            updateChatById(chatId, chat => ({
              ...chat,
              messages: chat.messages.map((msg, idx) => 
                idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.loadingState
                  ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
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
                  idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.loadingState
                    ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
                    : msg
                )
              }));
              scrollToBottom();
            }, 1000 + (bulletIdx * 400));
          });
          
          // Complete thinking and show response with draft generation
          setTimeout(() => {
            updateChatById(chatId, chat => ({
              ...chat,
              messages: chat.messages.map((msg, idx) => {
                if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                  return {
                    ...msg,
                    content: "Perfect, I have everything I need. I'm now drafting a comprehensive legal memo on SEC climate disclosure rules based on your specifications.",
                    isLoading: false,
                    loadingState: undefined,
                    showDraftGeneration: true,
                    draftGenerationLoadingState: {
                      isLoading: true,
                      showSummary: false,
                      visibleBullets: 0
                    }
                  };
                }
                return msg;
              })
            }));
            setTimeout(() => scrollToBottom(), 100);
            
            // Show draft generation summary
            setTimeout(() => {
              updateChatById(chatId, chat => ({
                ...chat,
                messages: chat.messages.map((msg, idx) => 
                  idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading
                    ? { ...msg, draftGenerationLoadingState: { ...msg.draftGenerationLoadingState, showSummary: true } }
                    : msg
                ),
                agentState: {
                  ...chat.agentState,
                  currentAction: 'Analyzing regulatory framework...',
                }
              }));
            }, 600);
            
            // Show draft generation bullets with agent state updates
            const draftBullets = 3; // matches getThinkingContent('draft').bullets.length
            const bulletActions = [
              'Structuring memo sections...',
              'Synthesizing enforcement signals...',
              'Formatting citations and recommendations...'
            ];
            for (let i = 0; i < draftBullets; i++) {
              setTimeout(() => {
                updateChatById(chatId, chat => ({
                  ...chat,
                  messages: chat.messages.map((msg, idx) => 
                    idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading
                      ? { ...msg, draftGenerationLoadingState: { ...msg.draftGenerationLoadingState, visibleBullets: i + 1 } }
                      : msg
                  ),
                  agentState: {
                    ...chat.agentState,
                    currentAction: bulletActions[i] || 'Processing...',
                    currentFile: undefined,
                  }
                }));
              }, 1000 + (i * 400));
            }
            
            // Complete draft generation and show artifact
            setTimeout(() => {
              const artifactTitle = 'SEC Climate Disclosure Rules - Legal Memo';
              const artifactSubtitle = 'Draft v1';
              
              // Update todo 4 to completed, update last message, and stop agent
              updateChatById(chatId, chat => ({
                ...chat,
                isLoading: false,
                messages: chat.messages.map((msg, idx) => {
                  // Update research message with completed todo
                  if (msg.role === 'assistant' && msg.researchTodos) {
                    return {
                      ...msg,
                      researchTodos: msg.researchTodos.map((todo, tIdx) => 
                        tIdx === 3 ? { ...todo, status: 'completed' as const } : todo
                      )
                    };
                  }
                  // Update last assistant message with artifact
                  if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                    return {
                      ...msg,
                      draftGenerationLoadingState: {
                        isLoading: false,
                        showSummary: true,
                        visibleBullets: draftBullets
                      },
                      artifactData: {
                        title: artifactTitle,
                        subtitle: artifactSubtitle,
                        variant: 'draft' as const
                      }
                    };
                  }
                  return msg;
                }),
                agentState: {
                  isRunning: false,
                  taskName: '',
                }
              }));
              
              // Auto-open the artifact panel only if still in the same chat
              setTimeout(() => {
                if (activeChatIdRef.current === chatId) {
                  setSelectedDraftArtifact({ title: artifactTitle, subtitle: artifactSubtitle });
                  setCurrentArtifactType('draft');
                  setUnifiedArtifactPanelOpen(true);
                  setDraftArtifactPanelOpen(true);
                  setReviewArtifactPanelOpen(false);
                  // Set content type based on artifact title
                  setDraftContentType(artifactTitle.toLowerCase().includes('s-1') ? 's1-shell' : 'memorandum');
                }
              }, 300);
              
              setTimeout(() => scrollToBottom(), 100);
            }, 3500);
          }, 2800);
        }, 500);
        
        return;
      }
      
      // Check if this is a response to the time window question (Risk Factors workflow)
      const workflowMsg = messages.find(m => m.isWorkflowResponse && m.workflowTitle);
      const isRiskFactorsWorkflow = workflowMsg?.workflowTitle?.toLowerCase().includes('risk factors');
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
      const isTimeWindowResponse = lastAssistantMsg?.timeWindowMessage?.includes('five-year lookback');
      
      if (isRiskFactorsWorkflow && isTimeWindowResponse) {
        // Handle time window confirmation - trigger EDGAR review
        // Add user message, set loading, and update agent state
        updateChatById(chatId, chat => ({
          ...chat,
          isLoading: true,
          messages: [
            ...chat.messages,
            { role: 'user' as const, content: userMessage, type: 'text' as const }
          ],
          agentState: {
            ...chat.agentState,
            currentAction: 'Analyzing EDGAR filings...',
            isAwaitingInput: false,
          }
        }));
        
        setTimeout(() => scrollToBottom(), 50);
        
        // Add assistant response with EDGAR review
        setTimeout(() => {
          const edgarFilings = [
            { company: "CrowdStrike Holdings", date: "(08192832)", type: "S-1" },
            { company: "Okta Inc.", date: "(03172847)", type: "S-1" },
            { company: "SentinelOne", date: "(06302951)", type: "S-1" },
            { company: "Snowflake Inc.", date: "(08242857)", type: "S-1" },
            { company: "Datadog Inc.", date: "(09192841)", type: "S-1" },
            { company: "Zscaler Inc.", date: "(02162847)", type: "S-1" },
            { company: "MongoDB Inc.", date: "(09212849)", type: "S-1" },
            { company: "HashiCorp Inc.", date: "(11042861)", type: "S-1" },
            { company: "UiPath Inc.", date: "(03262854)", type: "S-1" }
          ];
          
          const assistantMsg: Message = {
            role: 'assistant',
            content: "Perfect! I'll use a five-year lookback period to ensure we capture comprehensive precedent data. Now let me pull and analyze relevant S-1 filings to identify industry-standard risk factors.",
            type: 'text',
            isLoading: false,
            showThinking: false,
            isWorkflowResponse: true,
            showEdgarReview: true,
            edgarReviewContent: {
              summary: "I will analyze recent S-1 filings from technology companies to identify common risk factors and industry-specific disclosures.",
              filings: edgarFilings,
              totalFilings: edgarFilings.length
            },
            edgarReviewLoadingState: {
              isLoading: true,
              loadedFilings: 0
            }
          };
          
          updateChatById(chatId, chat => ({
            ...chat,
            messages: [...chat.messages, assistantMsg]
          }));
          setTimeout(() => scrollToBottom(), 100);
          
          // Simulate EDGAR review progress
          let loadedCount = 0;
          const progressInterval = setInterval(() => {
            loadedCount++;
            updateChatById(chatId, chat => ({
              ...chat,
              messages: chat.messages.map((msg, idx) => {
                if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.edgarReviewLoadingState) {
                  return {
                    ...msg,
                    edgarReviewLoadingState: {
                      ...msg.edgarReviewLoadingState,
                      loadedFilings: loadedCount
                    }
                  };
                }
                return msg;
              })
            }));
            scrollToBottom();
            
            if (loadedCount >= 9) {
              clearInterval(progressInterval);
              
              // Complete EDGAR review and show precedent table
              setTimeout(() => {
                updateChatById(chatId, chat => ({
                  ...chat,
                  isLoading: false,
                  messages: chat.messages.map((msg, idx) => {
                    if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                      return {
                        ...msg,
                        edgarReviewLoadingState: {
                          isLoading: false,
                          loadedFilings: 9
                        },
                        edgarReviewCompleteMessage: "I've identified and compiled the 13 most relevant precedent IPO S-1s into a review table. I recommend selecting at least 3-7 companies from this table to include in the Risk Factor Matrix, which will serve as the basis for drafting the Risk Factor section.",
                        precedentCompaniesData: [
                          { id: '1', company: 'CrowdStrike Holdings', ticker: 'CRWD', tier: 'Tier 1', tierColor: 'blue', similarity: 90, industry: 'Cybersecurity', revenueAtIPO: '$249M', dateOfFiling: '2019-05-06', issuersCounsel: 'Wilson Sonsini', uwCounsel: 'Davis Polk', class: 'Single', selected: true, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/crowdstrike.jpg' },
                          { id: '2', company: 'Okta Inc.', ticker: 'OKTA', tier: 'Tier 1', tierColor: 'blue', similarity: 90, industry: 'Identity Management', revenueAtIPO: '$92M', dateOfFiling: '2017-03-17', issuersCounsel: 'Latham & Watkins', uwCounsel: 'Goodwin Procter', class: 'Double', selected: true, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/okta.jpg' },
                          { id: '3', company: 'SentinelOne', ticker: 'S', tier: 'Tier 1', tierColor: 'blue', similarity: 90, industry: 'Endpoint Security', revenueAtIPO: '$176M', dateOfFiling: '2021-06-08', issuersCounsel: 'Fenwick & West', uwCounsel: 'Cooley LLP', class: 'Single', selected: true, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/sentinelone.png' },
                          { id: '4', company: 'Snowflake Inc.', ticker: 'SNOW', tier: 'Tier 2', tierColor: 'yellow', similarity: 80, industry: 'Data Platform', revenueAtIPO: '$264M', dateOfFiling: '2020-08-24', issuersCounsel: 'Cooley LLP', uwCounsel: 'Simpson Thacher', class: 'Double', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/snowflake.png' },
                          { id: '5', company: 'Datadog Inc.', ticker: 'DDOG', tier: 'Tier 1', tierColor: 'blue', similarity: 85, industry: 'Monitoring Platform', revenueAtIPO: '$198M', dateOfFiling: '2019-08-20', issuersCounsel: 'Orrick Herrington', uwCounsel: 'Davis Polk', class: 'Double', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/datadog.png' },
                          { id: '6', company: 'Zscaler Inc.', ticker: 'ZS', tier: 'Tier 1', tierColor: 'blue', similarity: 88, industry: 'Cloud Security', revenueAtIPO: '$127M', dateOfFiling: '2018-02-16', issuersCounsel: 'Wilson Sonsini', uwCounsel: 'White & Case', class: 'Single', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/zscaler.jpg' },
                          { id: '7', company: 'MongoDB Inc.', ticker: 'MDB', tier: 'Tier 2', tierColor: 'yellow', similarity: 78, industry: 'Database Platform', revenueAtIPO: '$101M', dateOfFiling: '2017-09-21', issuersCounsel: 'Cooley LLP', uwCounsel: 'Wilson Sonsini', class: 'Double', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/mongodb.png' },
                          { id: '8', company: 'HashiCorp Inc.', ticker: 'HCP', tier: 'Tier 2', tierColor: 'yellow', similarity: 76, industry: 'Infrastructure Automation', revenueAtIPO: '$211M', dateOfFiling: '2021-11-04', issuersCounsel: 'Latham & Watkins', uwCounsel: 'Fenwick & West', class: 'Single', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/hashi.jpg' },
                          { id: '9', company: 'UiPath Inc.', ticker: 'PATH', tier: 'Tier 2', tierColor: 'yellow', similarity: 72, industry: 'Robotic Process Automation', revenueAtIPO: '$607M', dateOfFiling: '2021-03-26', issuersCounsel: 'Skadden Arps', uwCounsel: 'Sullivan & Cromwell', class: 'Double', selected: false, s1Url: 'https://www.sec.gov/Archives/edgar/data/1535527/000104746919003095/a2238800zs-1.htm', logo: '/company-precedent-logo/uipath.png' }
                        ]
                      };
                    }
                    return msg;
                  }),
                  // Set agent to awaiting input state when precedent table is shown
                  agentState: {
                    ...chat.agentState,
                    currentAction: 'Awaiting user input...',
                    isAwaitingInput: true,
                  }
                }));
                scrollToBottom();
              }, 500);
            }
          }, 600);
        }, 500);
        
        return;
      }
      
      const artifactType = detectArtifactType(userMessage);
      const isDraftArtifact = artifactType === 'draft';
      const isReviewArtifact = artifactType === 'review';
      
      const variant = isDraftArtifact ? 'draft' : isReviewArtifact ? 'review' : 'analysis';
      const thinkingContent = getThinkingContent(variant);
      
      const loadingState = {
        showSummary: false,
        visibleBullets: 0,
        showAdditionalText: false,
        visibleChildStates: 0
      };
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        type: isDraftArtifact || isReviewArtifact ? 'artifact' : 'text',
        thinkingContent,
        loadingState,
        isLoading: true,
        ...(isDraftArtifact || isReviewArtifact ? {
          artifactData: {
            title: isDraftArtifact ? 'Record of Deliberation' : 'Extraction of Agreements and Provisions',
            subtitle: isDraftArtifact ? 'Version 1' : '24 columns · 104 rows',
            variant: isDraftArtifact ? 'draft' as const : 'review' as const
          }
        } : {})
      };
      
      updateChatById(chatId, chat => ({
        ...chat,
        isLoading: true,
        title: chat.messages.length === 0 
          ? (userMessage.length > 40 ? userMessage.substring(0, 40) + '...' : userMessage)
          : chat.title,
        messages: [
          ...chat.messages, 
          { role: 'user' as const, content: userMessage, type: 'text' as const },
          assistantMessage
        ]
      }));
      
      setTimeout(() => scrollToBottom(), 50);
      
      // Progressive reveal of thinking content
      setTimeout(() => {
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
              ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
              : msg
          )
        }));
      }, 600);
      
      const bullets = thinkingContent.bullets || [];
      bullets.forEach((_, bulletIdx) => {
        setTimeout(() => {
          updateChatById(chatId, chat => ({
            ...chat,
            messages: chat.messages.map((msg, idx) => 
              idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
                : msg
            )
          }));
          scrollToBottom();
        }, 1200 + (bulletIdx * 400));
      });
      
      // Complete the response
      setTimeout(() => {
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => {
            if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading) {
              return {
                ...msg,
                content: isDraftArtifact 
                  ? 'I have drafted a memo for you. Please let me know if you would like to continue editing the draft or if you need any specific changes or additional information included.'
                  : isReviewArtifact
                    ? 'I have generated a review table extracting terms from the industrial merger agreements as requested. Please let me know if you would like to continue editing the table or if you need any specific changes.'
                    : 'Based on the documents in this vault, I can help you with that. Let me analyze the relevant materials and provide you with a comprehensive response.',
                isLoading: false,
                loadingStates: undefined
              };
            }
            return msg;
          }),
          isLoading: false
        }));
        
        scrollToBottom();
      }, 4000);
    }
  }, [inputValue, isLoading, messages, scrollToBottom, sendResearchMessage, ensureChatExists, updateChatById]);

  // Handle workflow click
  const handleWorkflowClick = useCallback((workflow: Workflow) => {
    sendWorkflowMessage(workflow.title);
  }, [sendWorkflowMessage]);
  
  // Check if we're in chat mode
  const isInChatMode = messages.length > 0;
  
  // Toggle chat open/closed
  const toggleChat = useCallback((open: boolean) => {
    setIsChatToggling(true);
    setChatOpen(open);
  }, []);

  // Reset chat toggling flag when chat closes
  useEffect(() => {
    if (!chatOpen && isChatToggling) {
      setIsChatToggling(false);
    }
  }, [chatOpen, isChatToggling]);

  // Handle collapse trigger
  useEffect(() => {
    if (shouldTriggerCollapse) {
      setIsResizing(false);
      requestAnimationFrame(() => {
        toggleChat(false);
        setShouldTriggerCollapse(false);
      });
    }
  }, [shouldTriggerCollapse, toggleChat]);

  // Handle expand trigger (collapse artifact panels)
  useEffect(() => {
    if (shouldTriggerExpand) {
      setIsResizing(false);
      requestAnimationFrame(() => {
        setDraftArtifactPanelOpen(false);
        setReviewArtifactPanelOpen(false);
        setUnifiedArtifactPanelOpen(false);
        setSelectedDraftArtifact(null);
        setSelectedReviewArtifact(null);
        setCurrentArtifactType(null);
        setShouldTriggerExpand(false);
      });
    }
  }, [shouldTriggerExpand]);

  // Check chat tabs overflow
  const checkTabsOverflow = useCallback(() => {
    if (chatTabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chatTabsRef.current;
      setShowLeftTabGradient(scrollLeft > 0);
      setShowRightTabGradient(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkTabsOverflow();
    // Re-check on resize
    window.addEventListener('resize', checkTabsOverflow);
    return () => window.removeEventListener('resize', checkTabsOverflow);
  }, [checkTabsOverflow, chatThreads]);

  // Container ref for resize calculations
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize mouse down for chat panel
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!anyArtifactPanelOpen) return;
    e.preventDefault();
    setIsResizing(true);
    // Reset threshold states when starting a new resize
    isPastCollapseThresholdRef.current = false;
    isPastExpandThresholdRef.current = false;
    setIsPastCollapseThreshold(false);
    setIsPastExpandThreshold(false);
  }, [anyArtifactPanelOpen]);

  // Resize effect for chat panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newWidth = e.clientX - containerRect.left;
        
        // Handle collapse threshold (dragging below minimum width)
        if (newWidth < MIN_CHAT_WIDTH - 50 && chatOpen) {
          if (!isPastCollapseThresholdRef.current) {
            isPastCollapseThresholdRef.current = true;
            setIsPastCollapseThreshold(true);
            // Start timer for collapse
            collapseTimerRef.current = setTimeout(() => {
              isPastCollapseThresholdRef.current = false;
              setIsPastCollapseThreshold(false);
              setShouldTriggerCollapse(true);
            }, 250); // Quarter second hold time
          }
        } else {
          // User moved back above threshold, cancel collapse
          if (isPastCollapseThresholdRef.current) {
            isPastCollapseThresholdRef.current = false;
            setIsPastCollapseThreshold(false);
            if (collapseTimerRef.current) {
              clearTimeout(collapseTimerRef.current);
              collapseTimerRef.current = null;
            }
          }
        }
        
        // Handle expand threshold (dragging above maximum width to collapse artifacts)
        if (newWidth > MAX_CHAT_WIDTH + 50 && chatOpen && anyArtifactPanelOpen) {
          if (!isPastExpandThresholdRef.current) {
            isPastExpandThresholdRef.current = true;
            setIsPastExpandThreshold(true);
            // Start timer for artifact collapse
            expandTimerRef.current = setTimeout(() => {
              isPastExpandThresholdRef.current = false;
              setIsPastExpandThreshold(false);
              setShouldTriggerExpand(true);
            }, 250); // Quarter second hold time
          }
        } else {
          // User moved back below threshold, cancel artifact collapse
          if (isPastExpandThresholdRef.current) {
            isPastExpandThresholdRef.current = false;
            setIsPastExpandThreshold(false);
            if (expandTimerRef.current) {
              clearTimeout(expandTimerRef.current);
              expandTimerRef.current = null;
            }
          }
        }
        
        // Only update width if chat is open and not past collapse threshold
        if (chatOpen && !isPastCollapseThreshold) {
          // Enforce min/max constraints
          newWidth = Math.max(MIN_CHAT_WIDTH, Math.min(newWidth, MAX_CHAT_WIDTH));
          setChatWidth(newWidth + 1); // +1 to account for the border
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      isPastCollapseThresholdRef.current = false;
      isPastExpandThresholdRef.current = false;
      setIsPastCollapseThreshold(false);
      setIsPastExpandThreshold(false);
      setShouldTriggerCollapse(false);
      setShouldTriggerExpand(false);
      
      // Clear any pending timers
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
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
      
      // Clean up timers and refs
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
      isPastCollapseThresholdRef.current = false;
      isPastExpandThresholdRef.current = false;
    };
  }, [isResizing, chatOpen, anyArtifactPanelOpen, isPastCollapseThreshold, isPastExpandThreshold]);

  // Handle resize mouse down for drawer
  const handleDrawerResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isConfigurationDrawerOpen) return;
    e.preventDefault();
    setIsResizingDrawer(true);
  }, [isConfigurationDrawerOpen]);

  // Resize effect for drawer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingDrawer) return;
      
      // Calculate width from right edge of viewport
      const newWidth = window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(MIN_DRAWER_WIDTH, Math.min(newWidth, MAX_DRAWER_WIDTH));
      setDrawerWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingDrawer(false);
    };

    if (isResizingDrawer) {
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
  }, [isResizingDrawer]);
  
  return (
    <div className="flex h-screen w-full">
      {/* Hidden file input for native file picker */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            // Create uploaded file entries and simulate upload
            const newUploadedFiles: UploadedFile[] = Array.from(files).map(file => ({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadProgress: 0,
              status: 'uploading' as const,
              uploadedAt: new Date(),
            }));
            
            setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
            
            // Start upload simulation for each file
            newUploadedFiles.forEach(file => {
              simulateFileUpload(file.id);
            });
            
            // Open configuration drawer when files are uploaded
            setIsConfigurationDrawerOpen(true);
            
            // Reset input so the same file can be selected again
            e.target.value = '';
          }
        }}
      />
      
      <AppSidebar />
      
      <SidebarInset>
        <div className="h-screen flex flex-col bg-bg-base">
          {/* Page Header - Parent */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border-base flex-shrink-0" style={{ minHeight: '52px' }}>
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
            </div>
          </div>
          
          {/* Content Area - Chat, Artifact, and Configuration Drawer side by side */}
          <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
            {/* Chat Panel - animates width when artifact opens */}
            <AnimatePresence mode="wait">
            {chatOpen && (
            <motion.div
              key="chat-panel"
              className="flex flex-col bg-bg-base overflow-hidden"
              initial={isChatToggling ? { width: 0, opacity: 0 } : false}
              animate={isResizing ? undefined : { 
                width: anyArtifactPanelOpen 
                  ? chatWidth 
                  : isConfigurationDrawerOpen 
                    ? `calc(100% - ${drawerWidth}px)` 
                    : '100%',
                opacity: 1
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                width: PANEL_ANIMATION,
                opacity: { duration: 0.15, ease: "easeOut" }
              }}
              onAnimationComplete={() => {
                if (isChatToggling) {
                  setIsChatToggling(false);
                }
              }}
              style={{ 
                flexShrink: 0,
                ...(isResizing && anyArtifactPanelOpen ? { width: chatWidth } : {})
              }}
            >
              {/* Chat Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat Header - show when there are chat threads */}
              {chatThreads.length > 0 && (
                <div className="px-4 py-3 border-b border-border-base flex items-center gap-1" style={{ height: '52px' }}>
                  {/* Chat Tabs */}
                  <div className="relative flex-1 min-w-0">
                    {/* Left fade gradient */}
                    <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showLeftTabGradient ? 'opacity-100' : 'opacity-0'}`} />
                    {/* Right fade gradient */}
                    <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showRightTabGradient ? 'opacity-100' : 'opacity-0'}`} />
                    <div 
                      ref={chatTabsRef}
                      onScroll={checkTabsOverflow}
                      className="flex items-center gap-1 overflow-x-auto" 
                      style={{ flexWrap: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                    {chatThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className={cn(
                          "relative flex items-center rounded-md transition-colors shrink-0 group/tab",
                          thread.id === activeChatId
                            ? "bg-bg-subtle"
                            : "hover:bg-bg-subtle"
                        )}
                        style={{ maxWidth: '200px' }}
                      >
                        <button
                          onClick={() => switchToChat(thread.id)}
                          className={cn(
                            "text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis",
                            thread.id === activeChatId
                              ? "text-fg-base"
                              : "text-fg-muted hover:text-fg-base"
                          )}
                          style={{ 
                            padding: '4px 8px', 
                            maxWidth: '200px'
                          }}
                          title={thread.title || 'New chat'}
                        >
                          {thread.title || 'New chat'}
                        </button>
                        {/* Gradient fade + close icon - only on hover when multiple chats */}
                        {chatThreads.length > 1 && (
                          <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover/tab:opacity-100 transition-opacity rounded-r-md">
                            {/* Gradient fade */}
                            <div 
                              className={cn(
                                "w-6 h-full",
                                "bg-gradient-to-r from-transparent to-bg-subtle"
                              )}
                            />
                            {/* Solid background behind X */}
                            <div className="h-full bg-bg-subtle flex items-center pr-2 rounded-r-md">
                              <X 
                                size={12} 
                                className="text-fg-muted hover:text-fg-base cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Close this chat
                                  setChatThreads(prev => {
                                    const newThreads = prev.filter(t => t.id !== thread.id);
                                    // If we're closing the active chat, switch to another one
                                    if (thread.id === activeChatId && newThreads.length > 0) {
                                      setActiveChatId(newThreads[0].id);
                                    }
                                    return newThreads;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={createNewChat}
                          className="p-2 hover:bg-bg-subtle rounded-md transition-colors flex-shrink-0"
                        >
                          <Plus size={16} className="text-fg-muted" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        New chat
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {/* Chat Content */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                {/* Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
                
                {/* Bottom Gradient */}
                <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showBottomGradient ? 'opacity-100' : 'opacity-0'}`} />
                
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-8 pb-4"
                >
                  <div className="mx-auto" style={{ maxWidth: '740px' }}>
                    {!isInChatMode ? (
                      /* Zero State - Welcome Experience */
                      <div className="flex flex-col items-center justify-center flex-1 gap-6 py-3">
                        {/* Welcome Header */}
                        <div className="w-[624px] px-3 flex flex-col gap-0.5">
                          <h1 className="text-[20px] font-medium leading-[26px] tracking-[-0.4px] text-fg-base">
                            Welcome to {projectName}
                          </h1>
                          <p className="text-sm leading-5 text-fg-subtle">
                            This is your vault workspace. What would you like to work on?
                          </p>
                        </div>

                        {/* Get Started Actions */}
                        <div className="w-[624px] flex flex-col">
                          <div className="px-3 pb-3">
                            <p className="text-xs leading-4 text-fg-muted">Get started…</p>
                          </div>
                          
                          {/* Action Items */}
                          <div className="flex flex-col">
                            {/* Draft S-1 shell */}
                            <button
                              onClick={() => {
                                sendWorkflowMessage("Draft me an S-1 shell");
                                // Open vault file picker after workflow message loads
                                setTimeout(() => setIsVaultPickerOpen(true), 800);
                              }}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SvgIcon 
                                src="/central_icons/Draft.svg" 
                                alt="Draft"
                                width={16} 
                                height={16} 
                                className="text-fg-subtle"
                              />
                              <span className="text-sm leading-5 text-fg-subtle">Draft me an S-1 shell</span>
                            </button>
                            
                            <div className="h-px bg-border-base mx-3" />
                            
                            {/* Generate risk factors */}
                            <button
                              onClick={() => {
                                sendWorkflowMessage("Generate risk factors for S-1 filing");
                                // Open vault file picker after workflow message loads
                                setTimeout(() => setIsVaultPickerOpen(true), 800);
                              }}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SvgIcon 
                                src="/central_icons/Review.svg" 
                                alt="Review"
                                width={16} 
                                height={16} 
                                className="text-fg-subtle"
                              />
                              <span className="text-sm leading-5 text-fg-subtle">Generate risk factors for S-1 filing</span>
                            </button>
                            
                            <div className="h-px bg-border-base mx-3" />
                            
                            {/* Draft employment agreements */}
                            <button
                              onClick={() => sendWorkflowMessage("Draft employment agreements")}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SvgIcon 
                                src="/central_icons/Draft.svg" 
                                alt="Draft"
                                width={16} 
                                height={16} 
                                className="text-fg-subtle"
                              />
                              <span className="text-sm leading-5 text-fg-subtle">Draft employment agreements</span>
                            </button>
                            
                            <div className="h-px bg-border-base mx-3" />
                            
                            {/* Generate post-closing timelines */}
                            <button
                              onClick={() => sendWorkflowMessage("Generate post-closing timelines")}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SvgIcon 
                                src="/central_icons/Review.svg" 
                                alt="Review"
                                width={16} 
                                height={16} 
                                className="text-fg-subtle"
                              />
                              <span className="text-sm leading-5 text-fg-subtle">Generate post-closing timelines</span>
                            </button>
                          </div>
                        </div>

                        {/* Or Divider */}
                        <div className="w-[600px] flex items-center gap-2">
                          <div className="flex-1 h-px bg-border-base" />
                          <span className="text-[10px] leading-[14px] text-fg-muted">OR</span>
                          <div className="flex-1 h-px bg-border-base" />
                        </div>

                        {/* Setup Cards */}
                        <div className="w-[600px] flex flex-col gap-3">
                          {/* Upload Files Card */}
                          <div className="bg-bg-subtle p-4 rounded-[10px] flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                              <h3 className="text-sm font-medium leading-5 text-fg-base">
                                Upload your files or connect data sources
                              </h3>
                              <p className="text-xs leading-4 text-fg-subtle">
                                Add documents and files so Harvey can help you analyze and draft.
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button 
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-1.5 h-7"
                              >
                                <SvgIcon src="/central_icons/Upload.svg" alt="Upload" width={16} height={16} className="text-white" />
                                Upload files
                              </Button>
                              <Button 
                                variant="outline" 
                                size="small"
                                onClick={() => setIsIManagePickerOpen(true)}
                                className="gap-1.5 h-7"
                              >
                                <SvgIcon src="/central_icons/Integrations.svg" alt="Integrations" width={16} height={16} className="text-fg-base" />
                                Connect integrations
                              </Button>
                            </div>
                          </div>

                          {/* Add Team Members Card */}
                          <div className="border border-border-base p-4 rounded-[10px] flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                              <h3 className="text-sm font-medium leading-5 text-fg-base">
                                Add team members who&apos;ll work on this deal
                              </h3>
                              <p className="text-xs leading-4 text-fg-subtle">
                                Invite colleagues to collaborate on this project.
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-7 min-w-[128px]">
                                <input
                                  type="email"
                                  placeholder="Enter email address"
                                  className="w-full h-full bg-bg-subtle px-2.5 py-1.5 rounded-md text-sm placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-border-strong"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="small"
                                className="gap-1.5 h-7"
                              >
                                <SvgIcon src="/central_icons/Send.svg" alt="Send" width={16} height={16} className="text-fg-base" />
                                Send invite
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Messages */
                      messages.map((message, index) => (
                        <div key={index} className={`${index !== messages.length - 1 ? 'mb-6' : ''}`}>
                          {/* User Message - Right aligned */}
                          {message.role === 'user' && (
                            <div className="flex flex-col gap-2 items-end pl-[68px]">
                              {/* Message bubble */}
                              <div className="bg-bg-subtle px-4 py-3 rounded-[12px]">
                                <div className="text-sm text-fg-base leading-5">
                                  {message.type === 'files' && message.filesData 
                                    ? `I've uploaded some files from ${message.fileSource === 'vault' ? 'this vault' : message.fileSource === 'local' ? 'my computer' : 'iManage'}`
                                    : message.content
                                  }
                                </div>
                              </div>
                              
                              {/* Files container - outside the bubble */}
                              {message.type === 'files' && message.filesData && (
                                <div className="border border-border-base rounded-lg px-3 py-1 bg-bg-base" style={{ minWidth: '350px' }}>
                                  <div className="space-y-0.5">
                                    {message.filesData.slice(0, 4).map((file) => (
                                      <div 
                                        key={file.id} 
                                        className="flex items-center gap-2 h-8 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer min-w-0"
                                      >
                                        <div className="flex-shrink-0">
                                          {file.name.toLowerCase().endsWith('.pdf') ? (
                                            <Image src="/pdf-icon.svg" alt="PDF" width={16} height={16} />
                                          ) : file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') ? (
                                            <Image src="/docx-icon.svg" alt="DOCX" width={16} height={16} />
                                          ) : file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') ? (
                                            <Image src="/xlsx-icon.svg" alt="Spreadsheet" width={16} height={16} />
                                          ) : file.type === 'folder' ? (
                                            <Image src="/folderIcon.svg" alt="Folder" width={16} height={16} />
                                          ) : (
                                            <Image src="/file.svg" alt="File" width={16} height={16} />
                                          )}
                                        </div>
                                        <span className="text-sm text-fg-base truncate flex-1">{file.name}</span>
                                      </div>
                                    ))}
                                    {message.filesData.length > 4 && (
                                      <div className="flex items-center gap-2 h-8 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer">
                                        <div className="text-sm text-fg-muted">
                                          View {message.filesData.length - 4} more...
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Action buttons - right aligned */}
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
                          
                          {/* Assistant Message - Left aligned, no avatar */}
                          {message.role === 'assistant' && (
                            <div className="flex-1 min-w-0">
                            {message.role === 'assistant' && (
                              <>
                                {/* Research Flow - Multi-step inline thinking states */}
                                {message.researchFlowContent && message.researchFlowLoadingState && (
                                  <div className="space-y-3">
                                    {message.researchFlowContent.steps.map((step, stepIdx) => {
                                      const loadingState = message.researchFlowLoadingState!;
                                      const isCurrentStep = stepIdx === loadingState.currentStep;
                                      const isPastStep = stepIdx < loadingState.currentStep;
                                      const isFutureStep = stepIdx > loadingState.currentStep;
                                      
                                      // Don't render future steps
                                      if (isFutureStep) return null;
                                      
                                      const showThinking = isPastStep || isCurrentStep;
                                      const showResponse = isPastStep || (isCurrentStep && loadingState.showResponse);
                                      const isThinkingLoading = isCurrentStep && loadingState.isThinking;
                                      
                                      // Check if this is a special step type
                                      const stepConfig = researchFlowSteps[stepIdx];
                                      const isTodosStep = stepConfig?.type === 'todos';
                                      const isSecSearchStep = stepConfig?.type === 'sec-search' || stepConfig?.type === 'sec-search-2' || stepConfig?.type === 'sec-search-3';
                                      
                                      return (
                                        <div key={stepIdx} className="space-y-3">
                                          {/* Thinking State - skip for SEC search step (it has its own UI) */}
                                          {showThinking && !isSecSearchStep && (
                                            <motion.div
                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.3, ease: "easeOut" }}
                                            >
                                              <ThinkingState
                                                variant="analysis"
                                                title={isThinkingLoading ? step.thinkingTitle : `Thought for ${step.durationSeconds || 6}s`}
                                                durationSeconds={isPastStep ? step.durationSeconds : undefined}
                                                summary={step.thinkingContent}
                                                isLoading={isThinkingLoading}
                                                defaultOpen={false}
                                              />
                                            </motion.div>
                                          )}
                                          
                                          {/* Todo List Response (for step 2) */}
                                          {isTodosStep && showResponse && message.showResearchTodos && message.researchTodos && (
                                            <motion.div
                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.4, ease: "easeOut" }}
                                              className="pl-2 space-y-3"
                                            >
                                              {/* Todo list */}
                                              <div className="border border-[#e6e5e2] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#1a1a1a] px-[10px] py-1">
                                                {message.researchTodos.map((todo, todoIdx) => (
                                                  <motion.div
                                                    key={todo.id}
                                                    initial={justSwitchedChat ? false : { opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: justSwitchedChat ? 0 : todoIdx * 0.1 }}
                                                    className="flex items-center gap-1.5 pr-[10px] py-1 rounded"
                                                  >
                                                    {/* Status indicator */}
                                                    <div className="flex-shrink-0 w-[14px] h-[14px] flex items-center justify-center">
                                                      {todo.status === 'completed' ? (
                                                        <SvgIcon 
                                                          src="/central_icons/Checked - Filled.svg" 
                                                          alt="Completed"
                                                          width={14} 
                                                          height={14} 
                                                          className="text-fg-muted dark:text-[#8f8c85]"
                                                        />
                                                      ) : todo.status === 'in_progress' ? (
                                                        <SvgIcon 
                                                          src="/central_icons/Current Arrow - Filled.svg" 
                                                          alt="In Progress"
                                                          width={14} 
                                                          height={14} 
                                                          className="text-fg-subtle dark:text-[#a8a5a0]"
                                                        />
                                                      ) : (
                                                        <div className="w-[14px] h-[14px] rounded-full border border-[#cccac6] dark:border-[#5a5a5a] bg-white dark:bg-transparent" />
                                                      )}
                                                    </div>
                                                    <span className={cn(
                                                      "flex-1 text-sm truncate",
                                                      todo.status === 'completed' 
                                                        ? "text-[#9e9b95] dark:text-[#6b6b6b] line-through" 
                                                        : todo.status === 'in_progress'
                                                          ? "text-[#524f49] dark:text-[#d4d4d4]"
                                                          : "text-[#524f49] dark:text-[#a8a5a0]"
                                                    )}>{todo.text}</span>
                                                  </motion.div>
                                                ))}
                                              </div>
                                              
                                              {/* Response message below the todo list */}
                                              {step.response && (
                                                <div className="text-sm text-fg-base leading-relaxed">
                                                  {step.response}
                                                </div>
                                              )}
                                            </motion.div>
                                          )}
                                          
                                          {/* SEC Search (for sec-search steps) */}
                                          {isSecSearchStep && message.secSearchSteps && (() => {
                                            const secSearchStep = message.secSearchSteps.find(s => s.stepIndex === stepIdx);
                                            if (!secSearchStep) return null;
                                            
                                            const isExternalSearch = stepConfig?.type === 'sec-search-3';
                                            const searchingTitle = isExternalSearch ? "Searching external sources..." : "Searching sec.gov...";
                                            const searchedTitle = isExternalSearch ? "Searched external sources" : "Searched sec.gov";
                                            
                                            return (
                                              <motion.div
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                <ThinkingState
                                                  variant="analysis"
                                                  title={secSearchStep.loadingState.isLoading ? searchingTitle : searchedTitle}
                                                  durationSeconds={undefined}
                                                  icon={FileSearch}
                                                  summary={secSearchStep.content.summary}
                                                  customContent={
                                                    <motion.div 
                                                      className="mt-3"
                                                      initial={justSwitchedChat ? false : { opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      transition={{ duration: 0.3, ease: "easeOut" }}
                                                    >
                                                      <div className="flex flex-wrap gap-2">
                                                        {secSearchStep.content.documents.map((doc, idx) => (
                                                          <motion.div
                                                            key={`sec-doc-${stepIdx}-${idx}`}
                                                            initial={justSwitchedChat ? false : { opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ 
                                                              duration: 0.2, 
                                                              ease: "easeOut",
                                                              delay: justSwitchedChat ? 0 : Math.floor(idx / 3) * 0.1
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border-base rounded-md text-xs"
                                                          >
                                                            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                                              {secSearchStep.loadingState.isLoading && idx >= secSearchStep.loadingState.loadedDocuments ? (
                                                                <LoaderCircle className="w-4 h-4 animate-spin text-fg-subtle" />
                                                              ) : (
                                                                <Image src="/SEC-logo.svg" alt="SEC" width={16} height={16} />
                                                              )}
                                                            </div>
                                                            <span className="text-fg-subtle truncate max-w-[180px]">
                                                              {doc.title} {doc.date}
                                                            </span>
                                                          </motion.div>
                                                        ))}
                                                      </div>
                                                    </motion.div>
                                                  }
                                                  defaultOpen={false}
                                                  isLoading={secSearchStep.loadingState.isLoading}
                                                />
                                                
                                                {/* Show response after SEC search completes */}
                                                {!secSearchStep.loadingState.isLoading && secSearchStep.completeMessage && (
                                                  <motion.div 
                                                    className="mt-2 text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap"
                                                    initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                                  >
                                                    {secSearchStep.completeMessage}
                                                  </motion.div>
                                                )}
                                              </motion.div>
                                            );
                                          })()}
                                          
                                          {/* Regular Text Response (for step 1 and others) */}
                                          {!isTodosStep && !isSecSearchStep && showResponse && step.response && (
                                            <motion.div
                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.4, ease: "easeOut" }}
                                              className="text-sm text-fg-base leading-relaxed pl-2"
                                            >
                                              {step.response}
                                            </motion.div>
                                          )}
                                          
                                          {/* Optional Buttons */}
                                          {showResponse && step.buttons && step.buttons.length > 0 && (
                                            <motion.div
                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.3, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                              className="flex flex-wrap gap-2 pl-2"
                                            >
                                              {step.buttons.map((btn, btnIdx) => (
                                                <Button
                                                  key={btnIdx}
                                                  variant="outline"
                                                  size="small"
                                                  onClick={btn.onClick}
                                                >
                                                  {btn.label}
                                                </Button>
                                              ))}
                                            </motion.div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Action buttons after all steps complete */}
                                    {!message.isLoading && (
                                      <motion.div
                                        initial={justSwitchedChat ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: justSwitchedChat ? 0 : 0.2 }}
                                        className="flex items-center justify-between mt-3"
                                      >
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
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Regular Thinking States (non-research flow) */}
                                {!message.researchFlowContent && message.showThinking !== false && (
                                  <>
                                    {message.isLoading && message.thinkingContent && message.loadingState ? (
                                      <ThinkingState
                                        variant={message.type === 'artifact' ? (message.artifactData?.variant === 'draft' ? 'draft' : 'review') : 'analysis'}
                                        title="Thinking..."
                                        durationSeconds={undefined}
                                        summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined}
                                        bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)}
                                        isLoading={true}
                                      />
                                    ) : message.thinkingContent ? (
                                      <ThinkingState
                                        variant={message.type === 'artifact' ? (message.artifactData?.variant === 'draft' ? 'draft' : 'review') : 'analysis'}
                                        title="Thought"
                                        durationSeconds={6}
                                        summary={message.thinkingContent.summary}
                                        bullets={message.thinkingContent.bullets}
                                        defaultOpen={false}
                                      />
                                    ) : null}
                                  </>
                                )}
                                
                                {/* Content (skip for research flow - it handles its own rendering) */}
                                {!message.researchFlowContent && !message.isLoading && message.content && (
                                  <AnimatePresence>
                                    <motion.div
                                      initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                    >
                                      {message.type === 'artifact' ? (
                                        <div className="space-y-3">
                                          <div className="text-sm text-fg-base leading-relaxed pl-2">
                                            {message.content}
                                          </div>
                                          <div className="pl-2">
                                            <ReviewTableArtifactCard
                                              title={message.artifactData?.title || 'Artifact'}
                                              subtitle={message.artifactData?.subtitle || ''}
                                              variant={anyArtifactPanelOpen ? 'small' : 'large'}
                                              isSelected={unifiedArtifactPanelOpen && (
                                                (currentArtifactType === 'draft' && message.artifactData?.variant === 'draft') ||
                                                (currentArtifactType === 'review' && message.artifactData?.variant !== 'draft')
                                              )}
                                              iconType={message.artifactData?.variant === 'draft' ? 'file' : 'table'}
                                              showSources={message.artifactData?.variant === 'draft'}
                                              onClick={() => {
                                                const artifactType = message.artifactData?.variant === 'draft' ? 'draft' : 'review';
                                                const artifactData = {
                                                  title: message.artifactData?.title || 'Artifact',
                                                  subtitle: message.artifactData?.subtitle || ''
                                                };
                                                
                                                setCurrentArtifactType(artifactType);
                                                setUnifiedArtifactPanelOpen(true);
                                                
                                                if (artifactType === 'draft') {
                                                  setSelectedDraftArtifact(artifactData);
                                                  setDraftArtifactPanelOpen(true);
                                                  setReviewArtifactPanelOpen(false);
                                                  // Set content type based on artifact title
                                                  const title = message.artifactData?.title || '';
                                                  setDraftContentType(title.toLowerCase().includes('s-1') ? 's1-shell' : 'memorandum');
                                                } else {
                                                  setSelectedReviewArtifact(artifactData);
                                                  setReviewArtifactPanelOpen(true);
                                                  setDraftArtifactPanelOpen(false);
                                                }
                                              }}
                                            />
                                          </div>
                                          {/* Action buttons for artifacts */}
                                          <div className="flex items-center justify-between mt-2">
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
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="text-sm text-fg-base leading-relaxed pl-2">
                                            {message.content}
                                          </div>
                                          
                                          {/* File Review Thinking State */}
                                          {message.showFileReview && message.fileReviewContent && (
                                            <AnimatePresence>
                                              <motion.div 
                                                key="file-review-content"
                                                className="mt-3"
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                <ThinkingState
                                                  variant="analysis"
                                                  title={message.fileReviewLoadingState?.isLoading ? "Reviewing files..." : "Reviewed all files"}
                                                  durationSeconds={undefined}
                                                  icon={FileSearch}
                                                  summary={message.fileReviewContent.summary}
                                                  customContent={
                                                    <motion.div 
                                                      className="mt-3"
                                                      initial={justSwitchedChat ? false : { opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      transition={{ duration: 0.3, ease: "easeOut" }}
                                                    >
                                                      <div className="flex flex-wrap gap-2">
                                                        {message.fileReviewContent.files.map((file, idx) => (
                                                          <motion.div
                                                            key={`file-chip-${idx}`}
                                                            initial={justSwitchedChat ? false : { opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ 
                                                              duration: 0.2, 
                                                              ease: "easeOut",
                                                              delay: justSwitchedChat ? 0 : Math.floor(idx / 3) * 0.1
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border-base rounded-md text-xs"
                                                          >
                                                            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                                              {message.fileReviewLoadingState?.isLoading && idx >= (message.fileReviewLoadingState?.loadedFiles || 0) ? (
                                                                <LoaderCircle className="w-4 h-4 animate-spin text-fg-subtle" />
                                                              ) : file.type === 'pdf' ? (
                                                                <Image src="/pdf-icon.svg" alt="PDF" width={16} height={16} />
                                                              ) : file.type === 'docx' ? (
                                                                <Image src="/docx-icon.svg" alt="DOCX" width={16} height={16} />
                                                              ) : file.type === 'spreadsheet' ? (
                                                                <Image src="/xlsx-icon.svg" alt="Spreadsheet" width={16} height={16} />
                                                              ) : file.type === 'folder' ? (
                                                                <Image src="/folderIcon.svg" alt="Folder" width={16} height={16} />
                                                              ) : (
                                                                <Image src="/file.svg" alt="File" width={16} height={16} />
                                                              )}
                                                            </div>
                                                            <span className="text-fg-subtle truncate max-w-[200px]">{file.name}</span>
                                                          </motion.div>
                                                        ))}
                                                      </div>
                                                    </motion.div>
                                                  }
                                                  defaultOpen={false}
                                                  isLoading={message.fileReviewLoadingState?.isLoading}
                                                />
                                              </motion.div>
                                            </AnimatePresence>
                                          )}
                                          
                                          {/* File review completion message - Risk Factors asks for counsel filter, S-1 Shell proceeds to draft */}
                                          {message.fileReviewLoadingState && !message.fileReviewLoadingState.isLoading && message.showFileReview && (
                                            <AnimatePresence>
                                              <motion.div 
                                                key="file-review-complete-message"
                                                className="mt-1 text-sm text-fg-base leading-relaxed pl-2"
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                {(() => {
                                                  const workflowMsg = messages.find(m => m.isWorkflowResponse && m.workflowTitle);
                                                  const isRiskFactorsWorkflow = workflowMsg?.workflowTitle?.toLowerCase().includes('risk factors');
                                                  
                                                  return isRiskFactorsWorkflow 
                                                    ? "I've received your documents and have a clear understanding of the business profile. Before I pull the proposed precedent set, I'll need a couple of preferences from you. Let's start with the counsel filter, should I limit the search to precedents where Latham & Watkins served as issuer's counsel, or not limit by law firm at all?"
                                                    : "Perfect, I've reviewed all the files that you've provided. I've managed to already identify key information that will be essential for drafting your S-1 registration statement, including business operations, financial data, risk factors, and material agreements. I'll help you generate a draft of the S-1 shell.";
                                                })()}
                                              </motion.div>
                                              
                                              {/* Counsel filter buttons for Risk Factors workflow */}
                                              {(() => {
                                                const workflowMsg = messages.find(m => m.isWorkflowResponse && m.workflowTitle);
                                                const isRiskFactorsWorkflow = workflowMsg?.workflowTitle?.toLowerCase().includes('risk factors');
                                                return isRiskFactorsWorkflow && !message.showTimeWindowThinking;
                                              })() && (
                                                <motion.div 
                                                  className="mt-3 flex gap-2 pl-2"
                                                  initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.1 }}
                                                >
                                                  <AnimatePresence mode="popLayout">
                                                    {(!message.selectedCounselFilter || message.selectedCounselFilter === 'latham') && (
                                                      <motion.button
                                                        key="latham-button"
                                                        initial={justSwitchedChat ? false : { opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className={cn(
                                                          "py-1.5 px-3 bg-bg-base rounded-md transition-all flex items-center gap-1.5",
                                                          message.selectedCounselFilter === 'latham' 
                                                            ? "bg-bg-subtle" 
                                                            : "border border-border-base hover:bg-bg-subtle hover:border-border-strong"
                                                        )}
                                                        onClick={() => {
                                                          // Handle Latham & Watkins filter selection
                                                          setMessages(prev => prev.map((msg, idx) => {
                                                            if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                              return {
                                                                ...msg,
                                                                selectedCounselFilter: 'latham' as const
                                                              };
                                                            }
                                                            return msg;
                                                          }));
                                                          
                                                          // Update agent state
                                                          setAgentState(prev => ({
                                                            ...prev,
                                                            currentAction: 'Filtering by counsel...',
                                                            isAwaitingInput: false,
                                                          }));
                                                          
                                                          // Show time window thinking state
                                                          setMessages(prev => prev.map((msg, idx) => {
                                                            if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                              return {
                                                                ...msg,
                                                                showTimeWindowThinking: true,
                                                                timeWindowThinkingState: {
                                                                  isLoading: true,
                                                                  showSummary: false,
                                                                  visibleBullets: 0
                                                                }
                                                              };
                                                            }
                                                            return msg;
                                                          }));
                                                          
                                                          // Progressive reveal
                                                          setTimeout(() => {
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                return {
                                                                  ...msg,
                                                                  timeWindowThinkingState: {
                                                                    isLoading: true,
                                                                    showSummary: true,
                                                                    visibleBullets: 0
                                                                  }
                                                                };
                                                              }
                                                              return msg;
                                                            }));
                                                          }, 600);
                                                          
                                                          const bullets = ['Analyzing date ranges for precedent S-1 filings', 'Filtering by Latham & Watkins as issuer counsel', 'Preparing to pull relevant risk factor sections'];
                                                          bullets.forEach((_, bulletIdx) => {
                                                            setTimeout(() => {
                                                              setMessages(prev => prev.map((msg, idx) => {
                                                                if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                  return {
                                                                    ...msg,
                                                                    timeWindowThinkingState: {
                                                                      isLoading: true,
                                                                      showSummary: true,
                                                                      visibleBullets: bulletIdx + 1
                                                                    }
                                                                  };
                                                                }
                                                                return msg;
                                                              }));
                                                            }, 1200 + (bulletIdx * 400));
                                                          });
                                                          
                                                          // Complete and show message
                                                          setTimeout(() => {
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                return {
                                                                  ...msg,
                                                                  timeWindowThinkingState: {
                                                                    isLoading: false,
                                                                    showSummary: true,
                                                                    visibleBullets: 3
                                                                  },
                                                                  timeWindowMessage: "Do you want me to default to a five-year lookback, or would you prefer a narrower or broader time window for pulling S-1 filings? Once you confirm, I can refine the precedent universe accordingly and move forward with tagging and scoring risk factors."
                                                                };
                                                              }
                                                              return msg;
                                                            }));
                                                            
                                                            // Set agent to awaiting input
                                                            setAgentState(prev => ({
                                                              ...prev,
                                                              currentAction: 'Awaiting user input...',
                                                              isAwaitingInput: true,
                                                            }));
                                                          }, 2800);
                                                        }}
                                                      >
                                                        <span className="text-fg-base text-sm font-normal">Latham & Watkins only</span>
                                                      </motion.button>
                                                    )}
                                                    
                                                    {(!message.selectedCounselFilter || message.selectedCounselFilter === 'nofilter') && (
                                                      <motion.button
                                                        key="nofilter-button"
                                                        initial={justSwitchedChat ? false : { opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className={cn(
                                                          "py-1.5 px-3 bg-bg-base rounded-md transition-all flex items-center gap-1.5",
                                                          message.selectedCounselFilter === 'nofilter' 
                                                            ? "bg-bg-subtle" 
                                                            : "border border-border-base hover:bg-bg-subtle hover:border-border-strong"
                                                        )}
                                                        onClick={() => {
                                                          setMessages(prev => prev.map((msg, idx) => {
                                                            if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                              return {
                                                                ...msg,
                                                                selectedCounselFilter: 'nofilter' as const
                                                              };
                                                            }
                                                            return msg;
                                                          }));
                                                          
                                                          // Update agent state
                                                          setAgentState(prev => ({
                                                            ...prev,
                                                            currentAction: 'Applying filter...',
                                                            isAwaitingInput: false,
                                                          }));
                                                          
                                                          setMessages(prev => prev.map((msg, idx) => {
                                                            if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                              return {
                                                                ...msg,
                                                                showTimeWindowThinking: true,
                                                                timeWindowThinkingState: {
                                                                  isLoading: true,
                                                                  showSummary: false,
                                                                  visibleBullets: 0
                                                                }
                                                              };
                                                            }
                                                            return msg;
                                                          }));
                                                          
                                                          setTimeout(() => {
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                return {
                                                                  ...msg,
                                                                  timeWindowThinkingState: {
                                                                    isLoading: true,
                                                                    showSummary: true,
                                                                    visibleBullets: 0
                                                                  }
                                                                };
                                                              }
                                                              return msg;
                                                            }));
                                                          }, 600);
                                                          
                                                          const bullets = ['Analyzing date ranges for precedent S-1 filings', 'Searching across all law firms', 'Preparing to pull relevant risk factor sections'];
                                                          bullets.forEach((_, bulletIdx) => {
                                                            setTimeout(() => {
                                                              setMessages(prev => prev.map((msg, idx) => {
                                                                if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                  return {
                                                                    ...msg,
                                                                    timeWindowThinkingState: {
                                                                      isLoading: true,
                                                                      showSummary: true,
                                                                      visibleBullets: bulletIdx + 1
                                                                    }
                                                                  };
                                                                }
                                                                return msg;
                                                              }));
                                                            }, 1200 + (bulletIdx * 400));
                                                          });
                                                          
                                                          setTimeout(() => {
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === prev.length - 1 && msg.role === 'assistant') {
                                                                return {
                                                                  ...msg,
                                                                  timeWindowThinkingState: {
                                                                    isLoading: false,
                                                                    showSummary: true,
                                                                    visibleBullets: 3
                                                                  },
                                                                  timeWindowMessage: "Do you want me to default to a five-year lookback, or would you prefer a narrower or broader time window for pulling S-1 filings? Once you confirm, I can refine the precedent universe accordingly and move forward with tagging and scoring risk factors."
                                                                };
                                                              }
                                                              return msg;
                                                            }));
                                                            
                                                            // Set agent to awaiting input
                                                            setAgentState(prev => ({
                                                              ...prev,
                                                              currentAction: 'Awaiting user input...',
                                                              isAwaitingInput: true,
                                                            }));
                                                          }, 2800);
                                                        }}
                                                      >
                                                        <span className="text-fg-base text-sm font-normal">No filter</span>
                                                      </motion.button>
                                                    )}
                                                  </AnimatePresence>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          )}
                                          
                                          {/* Draft Generation Thinking State - for S-1 Shell workflow */}
                                          {message.showDraftGeneration && (
                                            <AnimatePresence>
                                              <motion.div 
                                                key="draft-generation"
                                                className="mt-3.5"
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                <ThinkingState
                                                  variant="draft"
                                                  title={message.draftGenerationLoadingState?.isLoading ? "Generating draft..." : "Generated draft"}
                                                  durationSeconds={undefined}
                                                  summary={message.draftGenerationLoadingState?.showSummary || !message.draftGenerationLoadingState?.isLoading ? getThinkingContent('draft').summary : undefined}
                                                  bullets={message.draftGenerationLoadingState?.isLoading 
                                                    ? getThinkingContent('draft').bullets?.slice(0, message.draftGenerationLoadingState?.visibleBullets || 0)
                                                    : getThinkingContent('draft').bullets
                                                  }
                                                  defaultOpen={false}
                                                  isLoading={message.draftGenerationLoadingState?.isLoading}
                                                  icon={FilePen}
                                                />
                                                
                                                {/* Draft Artifact Card - show after generation completes */}
                                                {!message.draftGenerationLoadingState?.isLoading && message.artifactData && (
                                                  <motion.div 
                                                    className="mt-2.5 pl-2"
                                                    initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                                  >
                                                    <ReviewTableArtifactCard
                                                      title={message.artifactData.title}
                                                      subtitle={message.artifactData.subtitle}
                                                      variant={anyArtifactPanelOpen ? 'small' : 'large'}
                                                      isSelected={unifiedArtifactPanelOpen && currentArtifactType === 'draft'}
                                                      iconType="file"
                                                      showSources={true}
                                                      onClick={() => {
                                                        setCurrentArtifactType('draft');
                                                        setUnifiedArtifactPanelOpen(true);
                                                        setSelectedDraftArtifact({
                                                          title: message.artifactData?.title || 'Artifact',
                                                          subtitle: message.artifactData?.subtitle || ''
                                                        });
                                                        setDraftArtifactPanelOpen(true);
                                                        setReviewArtifactPanelOpen(false);
                                                        // Set content type based on artifact title
                                                        const title = message.artifactData?.title || '';
                                                        setDraftContentType(title.toLowerCase().includes('s-1') ? 's1-shell' : 'memorandum');
                                                      }}
                                                    />
                                                  </motion.div>
                                                )}
                                              </motion.div>
                                            </AnimatePresence>
                                          )}
                                          
                                          {/* Time Window Thinking State - for Risk Factors workflow */}
                                          {message.showTimeWindowThinking && (
                                            <AnimatePresence>
                                              <motion.div 
                                                key="time-window-thinking"
                                                className="mt-3.5"
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                <ThinkingState
                                                  variant="analysis"
                                                  title={message.timeWindowThinkingState?.isLoading ? "Thinking..." : "Thought"}
                                                  durationSeconds={message.timeWindowThinkingState?.isLoading ? undefined : 2}
                                                  summary={message.timeWindowThinkingState?.showSummary ? "Determining optimal time window for precedent analysis to ensure comprehensive risk factor coverage." : undefined}
                                                  bullets={message.timeWindowThinkingState?.isLoading ? 
                                                    ['Analyzing date ranges for precedent S-1 filings', 'Filtering by counsel preferences', 'Preparing to pull relevant risk factor sections'].slice(0, message.timeWindowThinkingState?.visibleBullets || 0)
                                                    : ['Analyzing date ranges for precedent S-1 filings', 'Filtering by counsel preferences', 'Preparing to pull relevant risk factor sections']
                                                  }
                                                  defaultOpen={false}
                                                  isLoading={message.timeWindowThinkingState?.isLoading}
                                                />
                                                
                                                {/* Show message after thinking completes */}
                                                {message.timeWindowMessage && (
                                                  <motion.div 
                                                    className="mt-1 text-sm text-fg-base leading-relaxed pl-2"
                                                    initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                                  >
                                                    {message.timeWindowMessage}
                                                  </motion.div>
                                                )}
                                              </motion.div>
                                            </AnimatePresence>
                                          )}
                                          
                                          {/* EDGAR Review Thinking State - for Risk Factors workflow */}
                                          {message.showEdgarReview && message.edgarReviewContent && (
                                            <AnimatePresence>
                                              <motion.div 
                                                key="edgar-review"
                                                className="mt-3.5"
                                                initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                              >
                                                <ThinkingState
                                                  variant="analysis"
                                                  title={message.edgarReviewLoadingState?.isLoading ? "Reviewing EDGAR filings..." : "Reviewed EDGAR filings"}
                                                  durationSeconds={undefined}
                                                  icon={FileSearch}
                                                  summary={message.edgarReviewContent.summary}
                                                  customContent={
                                                    <motion.div 
                                                      className="mt-3"
                                                      initial={justSwitchedChat ? false : { opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      transition={{ duration: 0.3, ease: "easeOut" }}
                                                    >
                                                      <div className="flex flex-wrap gap-2">
                                                        {message.edgarReviewContent.filings.map((filing, idx) => (
                                                          <motion.div
                                                            key={`filing-chip-${idx}`}
                                                            initial={justSwitchedChat ? false : { opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ 
                                                              duration: 0.2, 
                                                              ease: "easeOut",
                                                              delay: justSwitchedChat ? 0 : Math.floor(idx / 3) * 0.1
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border-base rounded-md text-xs"
                                                          >
                                                            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                                              {message.edgarReviewLoadingState?.isLoading && idx >= (message.edgarReviewLoadingState?.loadedFilings || 0) ? (
                                                                <LoaderCircle className="w-4 h-4 animate-spin text-fg-subtle" />
                                                              ) : (
                                                                <Image src="/SEC-logo.svg" alt="SEC" width={16} height={16} />
                                                              )}
                                                            </div>
                                                            <span className="text-fg-subtle truncate max-w-[200px]">
                                                              {filing.company} {filing.date}
                                                            </span>
                                                          </motion.div>
                                                        ))}
                                                      </div>
                                                    </motion.div>
                                                  }
                                                  defaultOpen={false}
                                                  isLoading={message.edgarReviewLoadingState?.isLoading}
                                                />
                                                
                                                {/* Show text response after EDGAR review completes */}
                                                {!message.edgarReviewLoadingState?.isLoading && message.edgarReviewCompleteMessage && (
                                                  <>
                                                    <motion.div 
                                                      className="mt-2 text-sm text-fg-base leading-relaxed pl-2"
                                                      initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                                    >
                                                      {message.edgarReviewCompleteMessage}
                                                    </motion.div>
                                                    
                                                    {/* Precedent Companies Table */}
                                                    {message.precedentCompaniesData && (
                                                      <motion.div 
                                                        className="mt-4 pl-2"
                                                        initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.4 }}
                                                      >
                                                        <PrecedentCompaniesTable 
                                                          data={message.precedentCompaniesData}
                                                          isConfirmed={message.isPrecedentTableConfirmed || false}
                                                          goldenPrecedentId={message.goldenPrecedentId}
                                                          onGoldenPrecedentChange={(id) => {
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === index) {
                                                                return { ...msg, goldenPrecedentId: id };
                                                              }
                                                              return msg;
                                                            }));
                                                          }}
                                                          onConfirm={(selectedCompanies) => {
                                                            // Capture current chat ID for later check
                                                            const currentChatId = activeChatIdRef.current;
                                                            
                                                            // Update message to show confirmed state and start review table generation
                                                            setMessages(prev => prev.map((msg, idx) => {
                                                              if (idx === prev.length - 1 && msg.role === 'assistant' && msg.precedentCompaniesData) {
                                                                const updatedData = msg.precedentCompaniesData.map(company => ({
                                                                  ...company,
                                                                  selected: selectedCompanies.some(selected => selected.id === company.id)
                                                                }));
                                                                
                                                                return {
                                                                  ...msg,
                                                                  precedentCompaniesData: updatedData,
                                                                  isPrecedentTableConfirmed: true,
                                                                  showReviewTableGeneration: true,
                                                                  reviewTableGenerationLoadingState: {
                                                                    isLoading: true,
                                                                    showSummary: false,
                                                                    visibleBullets: 0
                                                                  }
                                                                };
                                                              }
                                                              return msg;
                                                            }));
                                                            
                                                            // Update agent state to generating review table
                                                            setAgentState(prev => ({
                                                              ...prev,
                                                              currentAction: 'Generating review table...',
                                                              isAwaitingInput: false,
                                                            }));
                                                            
                                                            // Progressive reveal
                                                            setTimeout(() => {
                                                              setMessages(prev => prev.map((msg, idx) => {
                                                                if (idx === prev.length - 1 && msg.role === 'assistant' && msg.reviewTableGenerationLoadingState?.isLoading) {
                                                                  return {
                                                                    ...msg,
                                                                    reviewTableGenerationLoadingState: {
                                                                      ...msg.reviewTableGenerationLoadingState,
                                                                      showSummary: true
                                                                    }
                                                                  };
                                                                }
                                                                return msg;
                                                              }));
                                                            }, 1000);
                                                            
                                                            const reviewBullets = ['Analyzing selected precedent companies', 'Extracting risk factors from S-1 filings', 'Organizing by category and relevance'];
                                                            reviewBullets.forEach((_, bulletIdx) => {
                                                              setTimeout(() => {
                                                                setMessages(prev => prev.map((msg, idx) => {
                                                                  if (idx === prev.length - 1 && msg.role === 'assistant' && msg.reviewTableGenerationLoadingState?.isLoading) {
                                                                    return {
                                                                      ...msg,
                                                                      reviewTableGenerationLoadingState: {
                                                                        ...msg.reviewTableGenerationLoadingState,
                                                                        visibleBullets: bulletIdx + 1
                                                                      }
                                                                    };
                                                                  }
                                                                  return msg;
                                                                }));
                                                              }, 1800 + (bulletIdx * 800));
                                                            });
                                                            
                                                            // Complete generation
                                                            setTimeout(() => {
                                                              setMessages(prev => prev.map((msg, idx) => {
                                                                if (idx === prev.length - 1 && msg.role === 'assistant' && msg.precedentCompaniesData) {
                                                                  return {
                                                                    ...msg,
                                                                    reviewTableGenerationLoadingState: {
                                                                      isLoading: false,
                                                                      showSummary: true,
                                                                      visibleBullets: reviewBullets.length
                                                                    },
                                                                    reviewTableArtifactData: {
                                                                      title: 'Risk Factor Review Table',
                                                                      subtitle: `${selectedCompanies.length} columns • 126 rows`
                                                                    },
                                                                    reviewTableMessage: 'I\'ve generated a comprehensive Risk Factor Review Table based on your selected precedent companies. This table compiles and organizes the relevant risk factors from each company\'s S-1 filing.'
                                                                  };
                                                                }
                                                                return msg;
                                                              }));
                                                              
                                                              // Open review panel
                                                              setSelectedReviewArtifact({
                                                                title: 'Risk Factor Review Table',
                                                                subtitle: `${selectedCompanies.length} columns • 126 rows`
                                                              });
                                                              setCurrentArtifactType('review');
                                                              
                                                              // Stop agent when review table is complete
                                                              setAgentState({
                                                                isRunning: false,
                                                                taskName: '',
                                                              });
                                                              
                                                              setTimeout(() => {
                                                                // Only auto-open if still in the same chat
                                                                if (activeChatIdRef.current === currentChatId) {
                                                                  setUnifiedArtifactPanelOpen(true);
                                                                  setReviewArtifactPanelOpen(true);
                                                                }
                                                              }, 800);
                                                            }, 5600);
                                                          }}
                                                        />
                                                      </motion.div>
                                                    )}
                                                    
                                                    {/* Review Table Generation Thinking State */}
                                                    {message.showReviewTableGeneration && (
                                                      <AnimatePresence>
                                                        <motion.div 
                                                          key="review-table-generation"
                                                          className="mt-4.5"
                                                          initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                          animate={{ opacity: 1, y: 0 }}
                                                          transition={{ duration: 0.4, ease: "easeOut" }}
                                                        >
                                                          <ThinkingState
                                                            variant="draft"
                                                            title={message.reviewTableGenerationLoadingState?.isLoading ? "Generating review table..." : "Generated review table"}
                                                            durationSeconds={undefined}
                                                            summary={message.reviewTableGenerationLoadingState?.showSummary || !message.reviewTableGenerationLoadingState?.isLoading ? 'I will use the user selections from the precedent review table to generate the Risk Factor Matrix.' : undefined}
                                                            bullets={message.reviewTableGenerationLoadingState?.isLoading 
                                                              ? ['Analyzing selected precedent companies', 'Extracting risk factors from S-1 filings', 'Organizing by category and relevance'].slice(0, message.reviewTableGenerationLoadingState?.visibleBullets || 0)
                                                              : ['Analyzing selected precedent companies', 'Extracting risk factors from S-1 filings', 'Organizing by category and relevance']
                                                            }
                                                            defaultOpen={false}
                                                            isLoading={message.reviewTableGenerationLoadingState?.isLoading}
                                                            icon={Table2}
                                                          />
                                                          
                                                          {/* Review Table Message */}
                                                          {!message.reviewTableGenerationLoadingState?.isLoading && message.reviewTableMessage && (
                                                            <motion.div
                                                              className="mt-2 pl-2 text-sm text-fg-base leading-relaxed"
                                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                              animate={{ opacity: 1, y: 0 }}
                                                              transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.2 }}
                                                            >
                                                              {message.reviewTableMessage}
                                                            </motion.div>
                                                          )}
                                                          
                                                          {/* Review Table Artifact Card */}
                                                          {!message.reviewTableGenerationLoadingState?.isLoading && message.reviewTableArtifactData && (
                                                            <motion.div 
                                                              className="mt-2.5 pl-2"
                                                              initial={justSwitchedChat ? false : { opacity: 0, y: 10 }}
                                                              animate={{ opacity: 1, y: 0 }}
                                                              transition={{ duration: 0.4, ease: "easeOut", delay: justSwitchedChat ? 0 : 0.3 }}
                                                            >
                                                              <ReviewTableArtifactCard
                                                                title={message.reviewTableArtifactData.title}
                                                                subtitle={message.reviewTableArtifactData.subtitle}
                                                                variant={anyArtifactPanelOpen ? 'small' : 'large'}
                                                                isSelected={unifiedArtifactPanelOpen && currentArtifactType === 'review'}
                                                                iconType="table"
                                                                onClick={() => {
                                                                  setSelectedReviewArtifact({
                                                                    title: message.reviewTableArtifactData!.title,
                                                                    subtitle: message.reviewTableArtifactData!.subtitle
                                                                  });
                                                                  setCurrentArtifactType('review');
                                                                  setUnifiedArtifactPanelOpen(true);
                                                                  setReviewArtifactPanelOpen(true);
                                                                }}
                                                              />
                                                            </motion.div>
                                                          )}
                                                        </motion.div>
                                                      </AnimatePresence>
                                                    )}
                                                  </>
                                                )}
                                              </motion.div>
                                            </AnimatePresence>
                                          )}

                                          {/* File upload buttons - only show if no files have been uploaded yet */}
                                          {message.isWorkflowResponse && message.workflowTitle?.toLowerCase().includes('s-1') && !messages.some(msg => msg.type === 'files') && !message.workflowButtons && (
                                            <div className="pl-2 mt-4">
                                              <div className="flex flex-wrap gap-2">
                                                <button 
                                                  className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                                                  onClick={() => fileInputRef.current?.click()}
                                                >
                                                  <CloudUpload size={16} className="text-fg-subtle" />
                                                  <span className="text-fg-base text-sm font-normal">Upload files</span>
                                                </button>
                                                <button 
                                                  className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                                                  onClick={() => setIsIManagePickerOpen(true)}
                                                >
                                                  <Image src="/imanage.svg" alt="" width={16} height={16} />
                                                  <span className="text-fg-base text-sm font-normal">Add from iManage</span>
                                                </button>
                                                <button className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5">
                                                  <Image src="/sharepoint.svg" alt="" width={16} height={16} />
                                                  <span className="text-fg-base text-sm font-normal">Add from SharePoint</span>
                                                </button>
                                                <button className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5">
                                                  <Image src="/google-drive.svg" alt="" width={16} height={16} />
                                                  <span className="text-fg-base text-sm font-normal">Add from Google Drive</span>
                                                </button>
                                                <button className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5">
                                                  <Image src="/folderIcon.svg" alt="" width={16} height={16} />
                                                  <span className="text-fg-base text-sm font-normal">Add from Vault project</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Action buttons for non-workflow responses */}
                                          {!message.isWorkflowResponse && (
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
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  </AnimatePresence>
                                )}
                              </>
                            )}
                          </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Chat Input */}
              <div className="px-6 pb-6 relative z-20 bg-bg-base">
                <div className="mx-auto" style={{ maxWidth: '732px' }}>
                  <div 
                    className="bg-[#f6f5f4] dark:bg-[#2a2a2a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong"
                    style={{ 
                      boxShadow: '0px 18px 47px 0px rgba(0,0,0,0.03), 0px 7.5px 19px 0px rgba(0,0,0,0.02), 0px 4px 10.5px 0px rgba(0,0,0,0.02), 0px 2.3px 5.8px 0px rgba(0,0,0,0.01), 0px 1.2px 3.1px 0px rgba(0,0,0,0.01), 0px 0.5px 1.3px 0px rgba(0,0,0,0.01)'
                    }}
                  >
                    {/* Composer Text Field */}
                    <div className="p-[10px] flex flex-col gap-[10px]">
                      {/* Vault Badge */}
                      <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-white dark:bg-[#1a1a1a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[4px] w-fit">
                        <img src="/folderIcon.svg" alt="Vault" className="w-3 h-3" />
                        <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">{projectName}</span>
                      </div>
                      
                      {/* Textarea */}
                      <div className="px-[4px]">
                        <div className="relative">
                          <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => {
                              setInputValue(e.target.value);
                              e.target.style.height = '20px';
                              e.target.style.height = Math.max(20, e.target.scrollHeight) + 'px';
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
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
                          {!inputValue && (
                            <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
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
                        <button 
                          onClick={() => setIsFileManagementOpen(true)}
                          className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors"
                        >
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
                        ) : inputValue.trim() ? (
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
            </div>
          </motion.div>
          )}
          </AnimatePresence>
          
          {/* Resize Handle - only show when artifact panel is open and chat is open */}
          {anyArtifactPanelOpen && chatOpen && (
            <div 
              className={`relative group w-px cursor-col-resize transition-colors flex-shrink-0 ${
                (isPastCollapseThreshold || isPastExpandThreshold)
                  ? 'bg-fg-base'
                  : (isHoveringResizer || isResizing ? 'bg-border-strong' : 'bg-border-base')
              }`}
              onMouseEnter={() => setIsHoveringResizer(true)}
              onMouseLeave={() => setIsHoveringResizer(false)}
              onMouseDown={handleResizeMouseDown}
            >
              {/* Invisible wider hit area for easier grabbing */}
              <div 
                className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize"
              />
            </div>
          )}
          
          {/* Artifact Panels - with animated entrance */}
          <AnimatePresence mode="wait">
            {unifiedArtifactPanelOpen && currentArtifactType && (
              <motion.div 
                key="artifact-panel"
                initial={false}
                animate={{ 
                  width: !chatOpen
                    ? (isConfigurationDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%')
                    : isConfigurationDrawerOpen 
                      ? `calc(100% - ${chatWidth}px - ${drawerWidth}px)` 
                      : 'auto', 
                  opacity: 1, 
                  flex: (!chatOpen || isConfigurationDrawerOpen) ? 'none' : 1 
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  width: PANEL_ANIMATION,
                  opacity: { duration: 0.15, ease: "easeOut" },
                  flex: PANEL_ANIMATION
                }}
                className="flex flex-col min-w-0 overflow-hidden"
                style={{ 
                  flexShrink: 0,
                  minWidth: chatOpen ? 300 : undefined
                }}
              >
                {currentArtifactType === 'draft' ? (
                  <DraftArtifactPanel
                      selectedArtifact={selectedDraftArtifact}
                      isEditingArtifactTitle={isEditingDraftArtifactTitle}
                      editedArtifactTitle={editedDraftArtifactTitle}
                      onEditedArtifactTitleChange={setEditedDraftArtifactTitle}
                      onStartEditingTitle={() => {
                        setIsEditingDraftArtifactTitle(true);
                        setEditedDraftArtifactTitle(selectedDraftArtifact?.title || 'Artifact');
                      }}
                      onSaveTitle={handleSaveDraftArtifactTitle}
                      onClose={() => {
                        setUnifiedArtifactPanelOpen(false);
                        setDraftArtifactPanelOpen(false);
                        setSelectedDraftArtifact(null);
                        setCurrentArtifactType(null);
                      }}
                      chatOpen={chatOpen}
                      onToggleChat={toggleChat}
                      shareArtifactDialogOpen={shareArtifactDialogOpen}
                      onShareArtifactDialogOpenChange={setShareArtifactDialogOpen}
                      exportReviewDialogOpen={exportReviewDialogOpen}
                      onExportReviewDialogOpenChange={setExportReviewDialogOpen}
                      artifactTitleInputRef={draftArtifactTitleInputRef}
                      sourcesDrawerOpen={false}
                      onSourcesDrawerOpenChange={() => {}}
                      contentType={draftContentType}
                    />
                  ) : (
                    <ReviewArtifactPanel
                      selectedArtifact={selectedReviewArtifact}
                      isEditingArtifactTitle={isEditingReviewArtifactTitle}
                      editedArtifactTitle={editedReviewArtifactTitle}
                      onEditedArtifactTitleChange={setEditedReviewArtifactTitle}
                      onStartEditingTitle={() => {
                        setIsEditingReviewArtifactTitle(true);
                        setEditedReviewArtifactTitle(selectedReviewArtifact?.title || 'Artifact');
                      }}
                      onSaveTitle={handleSaveReviewArtifactTitle}
                      onClose={() => {
                        setUnifiedArtifactPanelOpen(false);
                        setReviewArtifactPanelOpen(false);
                        setSelectedReviewArtifact(null);
                        setCurrentArtifactType(null);
                      }}
                      chatOpen={chatOpen}
                      onToggleChat={toggleChat}
                      shareArtifactDialogOpen={shareArtifactDialogOpen}
                      onShareArtifactDialogOpenChange={setShareArtifactDialogOpen}
                      exportReviewDialogOpen={exportReviewDialogOpen}
                      onExportReviewDialogOpenChange={setExportReviewDialogOpen}
                      artifactTitleInputRef={reviewArtifactTitleInputRef}
                    />
                  )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Drawer Resize Handle - only show when drawer is open */}
          {isConfigurationDrawerOpen && (
            <div 
              className={`relative group w-px cursor-col-resize transition-colors flex-shrink-0 ${
                isHoveringDrawerResizer || isResizingDrawer ? 'bg-border-strong' : 'bg-border-base'
              }`}
              onMouseEnter={() => setIsHoveringDrawerResizer(true)}
              onMouseLeave={() => setIsHoveringDrawerResizer(false)}
              onMouseDown={handleDrawerResizeMouseDown}
            >
              {/* Invisible wider hit area for easier grabbing */}
              <div 
                className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize"
              />
            </div>
          )}
          
          {/* Configuration Drawer - Right side */}
          {isConfigurationDrawerOpen && (
            <ConfigurationDrawer
              isOpen={isConfigurationDrawerOpen}
              onClose={() => setIsConfigurationDrawerOpen(false)}
              variant="embedded"
              width={drawerWidth}
              isResizing={isResizingDrawer}
              uploadedFiles={uploadedFiles}
              agents={chatThreads.map(chat => ({
                id: chat.id,
                isRunning: chat.agentState.isRunning,
                taskName: chat.agentState.taskName,
                currentAction: chat.agentState.currentAction,
                currentFile: chat.agentState.currentFile,
                isAwaitingInput: chat.agentState.isAwaitingInput,
                isActive: chat.id === activeChatId
              }))}
              onStopAgent={(agentId) => {
                setChatThreads(prev => prev.map(chat => 
                  chat.id === agentId 
                    ? { ...chat, isLoading: false, agentState: { isRunning: false, taskName: '' } }
                    : chat
                ));
              }}
              onReviewAgent={(agentId) => {
                // Switch to the chat and scroll to bottom
                switchToChat(agentId);
                setTimeout(() => scrollToBottom(), 100);
              }}
              onSwitchAgent={(agentId) => {
                switchToChat(agentId);
              }}
            />
          )}
          </div>
        </div>
      </SidebarInset>
      
      {/* Dialogs */}
      <FileManagementDialog 
        isOpen={isFileManagementOpen} 
        onClose={() => setIsFileManagementOpen(false)} 
      />
      <IManageFilePickerDialog
        isOpen={isIManagePickerOpen}
        onClose={() => setIsIManagePickerOpen(false)}
        onFilesSelected={(files) => {
          setIsIManagePickerOpen(false);
          
          // Ensure a chat exists and get the chatId
          const chatId = ensureChatExists();
          
          // Update chat state using the specific chatId - preserve existing title if it's a workflow
          updateChatById(chatId, chat => ({
            ...chat,
            isLoading: true,
            messages: [...chat.messages, {
              role: 'user' as const,
              content: '',
              type: 'files' as const,
              filesData: files,
              fileSource: 'imanage' as const
            }],
            agentState: {
              ...chat.agentState,
              isRunning: true,
              // Only update taskName if not already set (preserve workflow title)
              taskName: chat.agentState.taskName || `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`,
              currentAction: 'Analyzing documents...',
            }
          }));
          
          // Open configuration drawer when files are uploaded
          setIsConfigurationDrawerOpen(true);
          
          // Scroll to bottom
          setTimeout(() => scrollToBottom(), 100);
          
          // Check if this is a Risk Factors workflow
          const workflowMessage = messages.find(msg => msg.isWorkflowResponse && msg.workflowTitle);
          const isRiskFactorsWorkflow = workflowMessage?.workflowTitle?.toLowerCase().includes('risk factors');
          
          // Add AI response with thinking states after a delay
          setTimeout(() => {
            // Get thinking content for file processing
            const thinkingContent = isRiskFactorsWorkflow ? {
              summary: "The user has uploaded documents that I need to analyze for risk identification. I'll extract key business risks, operational challenges, and regulatory considerations that should be disclosed in the S-1 risk factors section.",
              bullets: [
                "Identify business and operational risks",
                "Analyze financial vulnerabilities and market conditions",
                "Extract regulatory and compliance challenges"
              ],
              additionalText: ""
            } : {
              summary: "The user has uploaded documents that I need to process and review thoroughly. I'll analyze each document to extract key information, identify relevant sections for S-1 filing requirements that will be essential for drafting a comprehensive S-1 statement.",
              bullets: [
                "Understand the business structure and financials",
                "Locate risk factors and material agreements", 
                "Compile insights for risk"
              ],
              additionalText: ""
            };
            
            // Initialize loading state
            const loadingState = {
              showSummary: false,
              visibleBullets: 0,
              showAdditionalText: false,
              visibleChildStates: 0
            };
            
            // Add assistant message with thinking states
            const assistantMessage: Message = {
              role: 'assistant',
              content: '',
              type: 'text',
              thinkingContent,
              loadingState,
              isLoading: true,
              isWorkflowResponse: true,
              workflowTitle: workflowMessage?.workflowTitle
            };
            
            updateChatById(chatId, chat => ({
              ...chat,
              messages: [...chat.messages, assistantMessage]
            }));
            setTimeout(() => scrollToBottom(), 100);
            
            // Progressive reveal of thinking states
            setTimeout(() => {
              updateChatById(chatId, chat => ({
                ...chat,
                messages: chat.messages.map((msg, idx) => 
                  idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                    ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
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
                    idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                      ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
                      : msg
                  )
                }));
                scrollToBottom();
              }, 1000 + (bulletIdx * 400));
            });
            
            // After thinking completes, show the actual response
            setTimeout(() => {
              updateChatById(chatId, chat => ({
                ...chat,
                messages: chat.messages.map((msg, idx) => {
                  if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading) {
                    return {
                      ...msg,
                      content: `Thank you for uploading the files. I'm currently processing and reviewing the documents to understand their content and context. I'll provide you with a summary and insights shortly.`,
                      isLoading: false,
                      loadingState: undefined,
                      showFileReview: false
                    };
                  }
                  return msg;
                })
              }));
              
              setTimeout(() => scrollToBottom(), 100);
              
              // Show file review thinking state after a delay
              setTimeout(() => {
                // Convert uploaded files to the format needed for file review
                const reviewFiles = files.slice(0, 9).map(file => {
                  const fileName = file.name.toLowerCase();
                  let fileType: 'pdf' | 'docx' | 'spreadsheet' | 'folder' | 'text' = 'text';
                  
                  if (file.type === 'folder') {
                    fileType = 'folder';
                  } else if (fileName.endsWith('.pdf')) {
                    fileType = 'pdf';
                  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                    fileType = 'docx';
                  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    fileType = 'spreadsheet';
                  }
                  
                  return {
                    name: file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name,
                    type: fileType
                  };
                });
                
                updateChatById(chatId, chat => ({
                  ...chat,
                  messages: chat.messages.map((msg, idx) => {
                    if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                      return {
                        ...msg,
                        showFileReview: true,
                        fileReviewContent: {
                          summary: isRiskFactorsWorkflow
                            ? "I will review all the uploaded documents to identify and extract risk factors including business risks, operational challenges, financial exposures, regulatory considerations, and competitive threats."
                            : "I will review all the uploaded documents to extract key information needed for the S-1 registration statement, including business operations, financial data, risk factors, and material agreements.",
                          files: reviewFiles,
                          totalFiles: files.length
                        },
                        fileReviewLoadingState: {
                          isLoading: true,
                          loadedFiles: 0
                        }
                      };
                    }
                    return msg;
                  })
                }));
                
                setTimeout(() => scrollToBottom(), 100);
                
                // Progressively load each file
                reviewFiles.forEach((_, fileIdx) => {
                  setTimeout(() => {
                    updateChatById(chatId, chat => ({
                      ...chat,
                      messages: chat.messages.map((msg, idx) => {
                        if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.fileReviewLoadingState) {
                          return {
                            ...msg,
                            fileReviewLoadingState: {
                              ...msg.fileReviewLoadingState,
                              loadedFiles: fileIdx + 1
                            }
                          };
                        }
                        return msg;
                      })
                    }));
                  }, 1000 + (fileIdx * 300));
                });
                
                // After all files are loaded, complete the review
                const reviewFileCount = reviewFiles.length;
                const reviewFilesCompleteDelay = 1000 + (reviewFileCount * 300) + 500;
                setTimeout(() => {
                  updateChatById(chatId, chat => ({
                    ...chat,
                    messages: chat.messages.map((msg, idx) => {
                      if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                        return {
                          ...msg,
                          fileReviewLoadingState: {
                            isLoading: false,
                            loadedFiles: reviewFileCount
                          }
                        };
                      }
                      return msg;
                    })
                  }));
                  
                  setTimeout(() => scrollToBottom(), 100);
                  
                  // Show appropriate next step based on workflow type
                  setTimeout(() => {
                    if (isRiskFactorsWorkflow) {
                      // For Risk Factors workflow, wait for user to select counsel filter
                      updateChatById(chatId, chat => ({
                        ...chat,
                        isLoading: false,
                        agentState: {
                          ...chat.agentState,
                          currentAction: 'Awaiting user input...',
                          isAwaitingInput: true,
                        }
                      }));
                    } else {
                      // For S-1 Shell workflow, show draft generation
                      updateChatById(chatId, chat => ({
                        ...chat,
                        messages: chat.messages.map((msg, idx) => {
                          if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                            return {
                              ...msg,
                              showDraftGeneration: true,
                              draftGenerationLoadingState: {
                                isLoading: true,
                                showSummary: false,
                                visibleBullets: 0
                              }
                            };
                          }
                          return msg;
                        })
                      }));
                      
                      // Progressive reveal of draft generation
                      setTimeout(() => {
                        updateChatById(chatId, chat => ({
                          ...chat,
                          messages: chat.messages.map((msg, idx) => {
                            if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading) {
                              return {
                                ...msg,
                                draftGenerationLoadingState: {
                                  ...msg.draftGenerationLoadingState,
                                  showSummary: true
                                }
                              };
                            }
                            return msg;
                          })
                        }));
                      }, 600);
                      
                      // Show bullets progressively
                      const draftBullets = getThinkingContent('draft').bullets;
                      draftBullets.forEach((_, bulletIdx) => {
                        setTimeout(() => {
                          updateChatById(chatId, chat => ({
                            ...chat,
                            messages: chat.messages.map((msg, idx) => {
                              if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading) {
                                return {
                                  ...msg,
                                  draftGenerationLoadingState: {
                                    ...msg.draftGenerationLoadingState,
                                    visibleBullets: bulletIdx + 1
                                  }
                                };
                              }
                              return msg;
                            })
                          }));
                        }, 1000 + (bulletIdx * 400));
                      });
                      
                      // Complete draft generation and show artifact
                      setTimeout(() => {
                        updateChatById(chatId, chat => ({
                          ...chat,
                          isLoading: false,
                          messages: chat.messages.map((msg, idx) => {
                            if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                              return {
                                ...msg,
                                draftGenerationLoadingState: {
                                  isLoading: false,
                                  showSummary: true,
                                  visibleBullets: draftBullets.length
                                },
                                artifactData: {
                                  title: 'S-1 Registration Statement Shell',
                                  subtitle: 'Draft v1',
                                  variant: 'draft' as const
                                }
                              };
                            }
                            return msg;
                          }),
                          agentState: {
                            isRunning: false,
                            taskName: '',
                          }
                        }));
                        
                        setTimeout(() => scrollToBottom(), 100);
                      }, 3500);
                    }
                    
                    setTimeout(() => scrollToBottom(), 100);
                  }, 800);
                }, reviewFilesCompleteDelay);
              }, 800);
            }, 2800);
          }, 500);
        }}
      />
      <VaultFilePickerDialog
        isOpen={isVaultPickerOpen}
        onClose={() => setIsVaultPickerOpen(false)}
        vaultName="Stubhub IPO Filing"
        onFilesSelected={(files) => {
          setIsVaultPickerOpen(false);
          
          // Ensure a chat exists and get the chatId
          const chatId = ensureChatExists();
          
          // Update chat state using the specific chatId - preserve existing title if it's a workflow
          updateChatById(chatId, chat => ({
            ...chat,
            isLoading: true,
            messages: [...chat.messages, {
              role: 'user' as const,
              content: '',
              type: 'files' as const,
              filesData: files,
              fileSource: 'vault' as const
            }],
            agentState: {
              ...chat.agentState,
              isRunning: true,
              // Only update taskName if not already set (preserve workflow title)
              taskName: chat.agentState.taskName || `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`,
              currentAction: 'Analyzing documents...',
            }
          }));
          
          // Open configuration drawer when files are uploaded
          setIsConfigurationDrawerOpen(true);
          
          // Scroll to bottom
          setTimeout(() => scrollToBottom(), 100);
          
          // Check if this is a Risk Factors workflow
          const workflowMessage = messages.find(msg => msg.isWorkflowResponse && msg.workflowTitle);
          const isRiskFactorsWorkflow = workflowMessage?.workflowTitle?.toLowerCase().includes('risk factors');
          
          // Add AI response with thinking states after a delay
          setTimeout(() => {
            // Get thinking content for file processing
            const thinkingContent = isRiskFactorsWorkflow ? {
              summary: "The user has uploaded documents that I need to analyze for risk identification. I'll extract key business risks, operational challenges, and regulatory considerations that should be disclosed in the S-1 risk factors section.",
              bullets: [
                "Identify business and operational risks",
                "Analyze financial vulnerabilities and market conditions",
                "Extract regulatory and compliance challenges"
              ],
              additionalText: ""
            } : {
              summary: "The user has uploaded documents that I need to process and review thoroughly. I'll analyze each document to extract key information, identify relevant sections for S-1 filing requirements that will be essential for drafting a comprehensive S-1 statement.",
              bullets: [
                "Understand the business structure and financials",
                "Locate risk factors and material agreements", 
                "Compile insights for risk"
              ],
              additionalText: ""
            };
            
            // Initialize loading state
            const loadingState = {
              showSummary: false,
              visibleBullets: 0,
              showAdditionalText: false,
              visibleChildStates: 0
            };
            
            // Add assistant message with thinking states
            const assistantMessage: Message = {
              role: 'assistant',
              content: '',
              type: 'text',
              thinkingContent,
              loadingState,
              isLoading: true,
              isWorkflowResponse: true,
              workflowTitle: workflowMessage?.workflowTitle
            };
            
            updateChatById(chatId, chat => ({
              ...chat,
              messages: [...chat.messages, assistantMessage]
            }));
            setTimeout(() => scrollToBottom(), 100);
            
            // Progressive reveal of thinking states
            setTimeout(() => {
              updateChatById(chatId, chat => ({
                ...chat,
                messages: chat.messages.map((msg, idx) => 
                  idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                    ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
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
                    idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                      ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
                      : msg
                  )
                }));
                scrollToBottom();
              }, 1000 + (bulletIdx * 400));
            });
            
            // After thinking completes, show the actual response
            setTimeout(() => {
              updateChatById(chatId, chat => ({
                ...chat,
                messages: chat.messages.map((msg, idx) => {
                  if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading) {
                    return {
                      ...msg,
                      content: `Thank you for uploading the files. I'm currently processing and reviewing the documents to understand their content and context. I'll provide you with a summary and insights shortly.`,
                      isLoading: false,
                      loadingState: undefined,
                      showFileReview: false
                    };
                  }
                  return msg;
                })
              }));
              
              setTimeout(() => scrollToBottom(), 100);
              
              // Show file review thinking state after a delay
              setTimeout(() => {
                // Convert uploaded files to the format needed for file review
                const reviewFiles = files.slice(0, 9).map(file => {
                  const fileName = file.name.toLowerCase();
                  let fileType: 'pdf' | 'docx' | 'spreadsheet' | 'folder' | 'text' = 'text';
                  
                  if (file.type === 'folder') {
                    fileType = 'folder';
                  } else if (fileName.endsWith('.pdf')) {
                    fileType = 'pdf';
                  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                    fileType = 'docx';
                  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    fileType = 'spreadsheet';
                  }
                  
                  return {
                    name: file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name,
                    type: fileType
                  };
                });
                
                updateChatById(chatId, chat => ({
                  ...chat,
                  messages: chat.messages.map((msg, idx) => {
                    if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                      return {
                        ...msg,
                        showFileReview: true,
                        fileReviewContent: {
                          summary: isRiskFactorsWorkflow
                            ? "I will review all the uploaded documents to identify and extract risk factors including business risks, operational challenges, financial exposures, regulatory considerations, and competitive threats."
                            : "I will review all the uploaded documents to extract key information needed for the S-1 registration statement, including business operations, financial data, risk factors, and material agreements.",
                          files: reviewFiles,
                          totalFiles: files.length
                        },
                        fileReviewLoadingState: {
                          isLoading: true,
                          loadedFiles: 0
                        }
                      };
                    }
                    return msg;
                  })
                }));
                
                setTimeout(() => scrollToBottom(), 100);
                
                // Progressively load each file
                reviewFiles.forEach((_, fileIdx) => {
                  setTimeout(() => {
                    updateChatById(chatId, chat => ({
                      ...chat,
                      messages: chat.messages.map((msg, idx) => {
                        if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.fileReviewLoadingState) {
                          return {
                            ...msg,
                            fileReviewLoadingState: {
                              ...msg.fileReviewLoadingState,
                              loadedFiles: fileIdx + 1
                            }
                          };
                        }
                        return msg;
                      })
                    }));
                  }, 1000 + (fileIdx * 300));
                });
                
                // After all files are loaded, complete the review
                const reviewFileCount = reviewFiles.length;
                const reviewFilesCompleteDelay = 1000 + (reviewFileCount * 300) + 500;
                setTimeout(() => {
                  updateChatById(chatId, chat => ({
                    ...chat,
                    messages: chat.messages.map((msg, idx) => {
                      if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                        return {
                          ...msg,
                          fileReviewLoadingState: {
                            isLoading: false,
                            loadedFiles: reviewFileCount
                          }
                        };
                      }
                      return msg;
                    })
                  }));
                  
                  setTimeout(() => scrollToBottom(), 100);
                  
                  // Show appropriate next step based on workflow type
                  setTimeout(() => {
                    if (isRiskFactorsWorkflow) {
                      // For Risk Factors workflow, wait for user to select counsel filter
                      updateChatById(chatId, chat => ({
                        ...chat,
                        isLoading: false,
                        agentState: {
                          ...chat.agentState,
                          currentAction: 'Awaiting user input...',
                          isAwaitingInput: true,
                        }
                      }));
                    } else {
                      // For S-1 Shell workflow, show draft generation
                      updateChatById(chatId, chat => ({
                        ...chat,
                        messages: chat.messages.map((msg, idx) => {
                          if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                            return {
                              ...msg,
                              showDraftGeneration: true,
                              draftGenerationLoadingState: {
                                isLoading: true,
                                showSummary: false,
                                visibleBullets: 0
                              }
                            };
                          }
                          return msg;
                        })
                      }));
                      
                      // Progressive reveal of draft generation
                      setTimeout(() => {
                        updateChatById(chatId, chat => ({
                          ...chat,
                          messages: chat.messages.map((msg, idx) => {
                            if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading) {
                              return {
                                ...msg,
                                draftGenerationLoadingState: {
                                  ...msg.draftGenerationLoadingState,
                                  showSummary: true
                                }
                              };
                            }
                            return msg;
                          })
                        }));
                      }, 600);
                      
                      // Show bullets progressively
                      const draftBullets = getThinkingContent('draft').bullets;
                      draftBullets.forEach((_, bulletIdx) => {
                        setTimeout(() => {
                          updateChatById(chatId, chat => ({
                            ...chat,
                            messages: chat.messages.map((msg, idx) => {
                              if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.draftGenerationLoadingState?.isLoading) {
                                return {
                                  ...msg,
                                  draftGenerationLoadingState: {
                                    ...msg.draftGenerationLoadingState,
                                    visibleBullets: bulletIdx + 1
                                  }
                                };
                              }
                              return msg;
                            })
                          }));
                        }, 1000 + (bulletIdx * 400));
                      });
                      
                      // Complete draft generation and show artifact
                      setTimeout(() => {
                        updateChatById(chatId, chat => ({
                          ...chat,
                          isLoading: false,
                          messages: chat.messages.map((msg, idx) => {
                            if (idx === chat.messages.length - 1 && msg.role === 'assistant') {
                              return {
                                ...msg,
                                draftGenerationLoadingState: {
                                  isLoading: false,
                                  showSummary: true,
                                  visibleBullets: draftBullets.length
                                },
                                artifactData: {
                                  title: 'S-1 Registration Statement Shell',
                                  subtitle: 'Draft v1',
                                  variant: 'draft' as const
                                }
                              };
                            }
                            return msg;
                          }),
                          agentState: {
                            isRunning: false,
                            taskName: '',
                          }
                        }));
                        
                        setTimeout(() => scrollToBottom(), 100);
                      }, 3500);
                    }
                    
                    setTimeout(() => scrollToBottom(), 100);
                  }, 800);
                }, reviewFilesCompleteDelay);
              }, 800);
            }, 2800);
          }, 500);
        }}
      />
    </div>
  );
}
