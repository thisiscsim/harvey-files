"use client";

import { use } from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { detectArtifactType, shouldShowReviewNudge } from "@/lib/artifact-detection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Download, ArrowLeft, X, Plus, ListPlus, Copy, SquarePen, RotateCcw, ThumbsUp, ThumbsDown, Scale, Paperclip, Mic, SlidersHorizontal, CornerDownLeft, AudioLines, CloudUpload, FileSearch, LoaderCircle, Table2 } from "lucide-react";
import ConfigurationDrawer from "@/components/configuration-drawer";
import type { DrawerSource } from "@/components/configuration-drawer";
import ShareThreadDialog from "@/components/share-thread-dialog";
import ShareArtifactDialog from "@/components/share-artifact-dialog";
import ExportThreadDialog from "@/components/export-thread-dialog";
import ExportReviewDialog from "@/components/export-review-dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, useSidebar } from "@/components/ui/sidebar";
import ReviewTableArtifactCard from "@/components/review-table-artifact-card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import DraftArtifactPanel from "@/components/draft-artifact-panel";
import ReviewArtifactPanel from "@/components/review-artifact-panel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import FileManagementDialog from "@/components/file-management-dialog";
import ThinkingState from "@/components/thinking-state";
import IManageFilePickerDialog from "@/components/imanage-file-picker-dialog";
import PrecedentCompaniesTable from "@/components/precedent-companies-table";
import ArtifactCard from "@/components/artifact-card";
import ReviewNudge from "@/components/review-nudge";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'artifact' | 'files';
  artifactData?: {
    title: string;
    subtitle: string;
    variant?: 'review' | 'draft'; // Determines which panel to open
  };
  filesData?: Array<{
    id: string;
    name: string;
    type: 'folder' | 'file';
    modifiedDate: string;
    size?: string;
    path: string;
  }>;
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
  showTimeWindowThinking?: boolean;
  timeWindowThinkingState?: {
    isLoading: boolean;
    showSummary?: boolean;
    visibleBullets?: number;
  };
  timeWindowMessage?: string;
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
  selectedCounselFilter?: 'latham' | 'nofilter';
  isPrecedentTableConfirmed?: boolean;
  goldenPrecedentId?: string | null;
  showNudge?: boolean;
  nudgeUserQuery?: string;
  nudgeDismissed?: boolean;
  showSaveNudge?: boolean;
  saveNudgeDismissed?: boolean;
};

// Shared animation configuration for consistency - refined timing
const PANEL_ANIMATION = {
  duration: 0.3,
  ease: "easeOut" as const
};

// Basic default content for the expandable thinking state per response type
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
        summary: 'The user wants me to recreate a morphing dialog component using shadcn dialog as the foundation. This sounds like they want a dialog that has smooth morphing animations - likely expanding from a trigger element or morphing between different states/sizes.',
        bullets: [
          'Since they mentioned "recreate", they might have seen this pattern somewhere, but they haven\'t provided a specific reference.',
          'I should first understand their current codebase structure to see what\'s available',
          'Then build a morphing dialog component that extends the shadcn dialog with smooth transitions'
        ],
        additionalText: '',
        childStates: [
          {
            variant: 'analysis',
            title: 'Found codebase structure',
            summary: 'Searching "Give me an overview of the codebase"',
            bullets: [
              'Reading files: layout.tsx, globals.css'
            ]
          },
          {
            variant: 'analysis',
            title: 'Analyzing component patterns',
            summary: 'Identifying existing dialog and animation implementations',
            bullets: [
              'Checking for existing dialog components',
              'Looking for animation libraries like Framer Motion',
              'Understanding current UI component structure'
            ]
          },
          {
            variant: 'analysis',
            title: 'Planning implementation approach',
            summary: 'Determining the best way to create the morphing effect',
            bullets: [
              'Considering layout animation techniques',
              'Planning state management for morphing states',
              'Designing smooth transition choreography'
            ]
          }
        ]
      };
  }
}

// In a real app, this would fetch from an API based on the chatId
const getChatTitle = (chatId: string): string => {
  const chatTitles: { [key: string]: string } = {
    'key-terms-provisions-clauses-property-us': 'Key terms, provisions and clauses to sell property in the U.S.',
    // Add more mappings as needed
  };
  
  return chatTitles[chatId] || 'Chat';
};

export default function AssistantChatPage({
  params
}: {
  params: Promise<{ chatId: string }>
}) {
  // Unwrap params using React.use()
  const { chatId } = use(params);
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('initialMessage');
  const isWorkflow = searchParams.get('isWorkflow') === 'true';
  const router = useRouter();
  
  // Sidebar control hook
  const { setOpen: setSidebarOpen } = useSidebar();
  
  // Hook to detect if viewport is above 2xl breakpoint (1536px)
  const [isAbove2xl, setIsAbove2xl] = useState(false);
  
  useEffect(() => {
    const checkBreakpoint = () => {
      setIsAbove2xl(window.innerWidth >= 1536);
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  // Use the initial message as the title if it's a new chat
  const chatTitle = getChatTitle(chatId) === 'Chat' && initialMessage ? initialMessage : getChatTitle(chatId);
  
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(401);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResizer, setIsHoveringResizer] = useState(false);
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(true);
  
  
  const [shareThreadDialogOpen, setShareThreadDialogOpen] = useState(false);
  const [shareArtifactDialogOpen, setShareArtifactDialogOpen] = useState(false);
  const [exportThreadDialogOpen, setExportThreadDialogOpen] = useState(false);
  const [exportReviewDialogOpen, setExportReviewDialogOpen] = useState(false);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [draftArtifactPanelOpen, setDraftArtifactPanelOpen] = useState(false);
  const [reviewArtifactPanelOpen, setReviewArtifactPanelOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [selectedDraftArtifact, setSelectedDraftArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [selectedReviewArtifact, setSelectedReviewArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  
  // New unified artifact panel state
  const [unifiedArtifactPanelOpen, setUnifiedArtifactPanelOpen] = useState(false);
  const [currentArtifactType, setCurrentArtifactType] = useState<'draft' | 'review' | null>(null);
  const [isFileManagementOpen, setIsFileManagementOpen] = useState(false);
  const [isiManagePickerOpen, setIsiManagePickerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; name: string; type: 'file' | 'folder'; modifiedDate: string; size?: string; path: string }>>([]);
  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;
  const dragCounterRef = useRef(0);
  const fileChipsRef = useRef<HTMLDivElement>(null);
  const [showLeftChipGradient, setShowLeftChipGradient] = useState(false);
  const [showRightChipGradient, setShowRightChipGradient] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessageRef = useRef(false);
  
  // Track if chat panel is being toggled interactively (not on mount)
  const [isChatToggling, setIsChatToggling] = useState(false);
  // Track timers for threshold hold detection
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPastCollapseThresholdRef = useRef(false);
  const isPastExpandThresholdRef = useRef(false);
  const [isPastCollapseThreshold, setIsPastCollapseThreshold] = useState(false);
  const [isPastExpandThreshold, setIsPastExpandThreshold] = useState(false);
  const [shouldTriggerCollapse, setShouldTriggerCollapse] = useState(false);
  const [shouldTriggerExpand, setShouldTriggerExpand] = useState(false);
  
  // Track if we've already auto-collapsed the sidebar for this artifact session
  const hasAutoCollapsedSidebarRef = useRef(false);
  
  // Check if any artifact panel is open
  const anyArtifactPanelOpen = artifactPanelOpen || draftArtifactPanelOpen || reviewArtifactPanelOpen || unifiedArtifactPanelOpen;
  
  // Build sources for ConfigurationDrawer — only files from this chat session
  const configDrawerSources = useMemo<DrawerSource[]>(() => {
    const fileSources: DrawerSource[] = [];
    messages.forEach(m => {
      if (m.type === 'files' && m.filesData) {
        m.filesData.forEach(f => {
          if (!fileSources.some(s => s.title === f.name)) {
            fileSources.push({
              title: f.name,
              icon: (f.name.toLowerCase().endsWith('.pdf') ? 'pdf'
                : f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls') ? 'xlsx'
                : f.type === 'folder' ? 'folder'
                : 'docx') as DrawerSource['icon'],
            });
          }
        });
      }
    });
    return fileSources;
  }, [messages]);
  
  // Build artifacts for ConfigurationDrawer — only completed (non-loading) artifacts
  const configDrawerArtifacts = useMemo<DrawerSource[]>(() => {
    return messages
      .filter(m => !m.isLoading && (m.artifactData || m.reviewTableArtifactData))
      .map(m => ({
        title: (m.artifactData?.title || m.reviewTableArtifactData?.title || ''),
        icon: (m.artifactData?.variant === 'review' || m.reviewTableArtifactData ? 'xlsx' : 'docx') as DrawerSource['icon'],
      }));
  }, [messages]);
  
  // Check if we're coming from the assistant homepage
  const [isFromHomepage] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromHomepage = sessionStorage.getItem('fromAssistantHomepage') === 'true';
      if (fromHomepage) {
        sessionStorage.removeItem('fromAssistantHomepage');
      }
      return fromHomepage;
    }
    return false;
  });
  
  // Check if this is a workflow-initiated chat
  const [isWorkflowInitiated] = useState(() => {
    if (typeof window !== 'undefined') {
      const workflowInitiated = sessionStorage.getItem('isWorkflowInitiated') === 'true';
      if (workflowInitiated) {
        sessionStorage.removeItem('isWorkflowInitiated');
      }
      return workflowInitiated;
    }
    return false;
  });

  // Track if animations have already been played to prevent replaying on chat panel toggle
  const hasPlayedAnimationsRef = useRef(false);

  // Track if source drawer has been opened once during the session
  const hasOpenedSourcesDrawerRef = useRef(false);

  // Add states for editing titles
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [editedChatTitle, setEditedChatTitle] = useState(chatTitle);
  const [currentChatTitle, setCurrentChatTitle] = useState(chatTitle);
  const [isEditingArtifactTitle, setIsEditingArtifactTitle] = useState(false);
  const [editedArtifactTitle, setEditedArtifactTitle] = useState(selectedArtifact?.title || '');
  
  const [isEditingDraftArtifactTitle, setIsEditingDraftArtifactTitle] = useState(false);
  const [editedDraftArtifactTitle, setEditedDraftArtifactTitle] = useState(selectedDraftArtifact?.title || '');
  
  const [isEditingReviewArtifactTitle, setIsEditingReviewArtifactTitle] = useState(false);
  const [editedReviewArtifactTitle, setEditedReviewArtifactTitle] = useState(selectedReviewArtifact?.title || '');
  
  const chatTitleInputRef = useRef<HTMLInputElement>(null);
  const artifactTitleInputRef = useRef<HTMLInputElement>(null);
  const draftArtifactTitleInputRef = useRef<HTMLInputElement>(null);
  const reviewArtifactTitleInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showBottomGradient, setShowBottomGradient] = useState(false);

  const MIN_CHAT_WIDTH = 400;
  const MAX_CHAT_WIDTH = 800;

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);





  // Update edited artifact title when selected artifact changes
  useEffect(() => {
    if (selectedArtifact) {
      setEditedArtifactTitle(selectedArtifact.title);
    }
  }, [selectedArtifact]);

  // Update edited draft artifact title when selected draft artifact changes
  useEffect(() => {
    if (selectedDraftArtifact) {
      setEditedDraftArtifactTitle(selectedDraftArtifact.title);
    }
  }, [selectedDraftArtifact]);

  // Update edited review artifact title when selected review artifact changes
  useEffect(() => {
    if (selectedReviewArtifact) {
      setEditedReviewArtifactTitle(selectedReviewArtifact.title);
    }
  }, [selectedReviewArtifact]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // Show top gradient when content has scrolled past the top
        setIsScrolled(scrollTop > 0);
        
        // Check if user is near the bottom (within 100px)
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setIsNearBottom(distanceFromBottom < 100);
        
        // Show bottom gradient when not at the very bottom
        setShowBottomGradient(distanceFromBottom > 1);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
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
    // Only auto-scroll if user is near the bottom
    if (isNearBottom && messages.length > 0) {
      // Check if the last message is an artifact - they need more time to render
      const lastMessage = messages[messages.length - 1];
      const isArtifact = lastMessage.type === 'artifact';
      
      // Use longer delay for artifact messages to ensure they're fully rendered
      const delay = isArtifact ? 500 : 100;
      
      let timeoutId: NodeJS.Timeout;
      
      // For artifact messages, use requestAnimationFrame to ensure DOM is ready
      if (isArtifact) {
        // Double RAF to ensure React has committed to DOM
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            timeoutId = setTimeout(() => {
              scrollToBottom();
            }, delay);
          });
        });
      } else {
        timeoutId = setTimeout(() => {
          scrollToBottom();
        }, delay);
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [messages, isNearBottom, scrollToBottom]);

  // Handle saving chat title
  const handleSaveChatTitle = useCallback(() => {
    if (editedChatTitle.trim()) {
      if (editedChatTitle !== currentChatTitle) {
        setCurrentChatTitle(editedChatTitle);
        toast.success("Chat title updated");
      }
    } else {
      setEditedChatTitle(currentChatTitle);
    }
    setIsEditingChatTitle(false);
  }, [editedChatTitle, currentChatTitle]);

  // Handle saving artifact title
  const handleSaveArtifactTitle = useCallback(() => {
    if (editedArtifactTitle.trim() && selectedArtifact) {
      if (editedArtifactTitle !== selectedArtifact.title) {
        // Update the selected artifact
        setSelectedArtifact({
          ...selectedArtifact,
          title: editedArtifactTitle
        });
        
        // Also update the title in the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.type === 'artifact' && msg.artifactData?.title === selectedArtifact.title) {
              return {
                ...msg,
                artifactData: {
                  ...msg.artifactData,
                  title: editedArtifactTitle
                }
              };
            }
            return msg;
          })
        );
        
        toast.success("Artifact title updated");
      }
    } else if (selectedArtifact) {
      setEditedArtifactTitle(selectedArtifact.title);
    }
    setIsEditingArtifactTitle(false);
  }, [editedArtifactTitle, selectedArtifact]);

  // Handle saving draft artifact title
  const handleSaveDraftArtifactTitle = useCallback(() => {
    if (editedDraftArtifactTitle.trim() && selectedDraftArtifact) {
      if (editedDraftArtifactTitle !== selectedDraftArtifact.title) {
        // Update the selected draft artifact
        setSelectedDraftArtifact({
          ...selectedDraftArtifact,
          title: editedDraftArtifactTitle
        });
        
        // Also update the title in the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.type === 'artifact' && msg.artifactData?.title === selectedDraftArtifact.title) {
              return {
                ...msg,
                artifactData: {
                  ...msg.artifactData,
                  title: editedDraftArtifactTitle
                }
              };
            }
            return msg;
          })
        );
        
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
        // Update the selected review artifact
        setSelectedReviewArtifact({
          ...selectedReviewArtifact,
          title: editedReviewArtifactTitle
        });
        
        // Also update the title in the messages array
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.type === 'artifact' && msg.artifactData?.title === selectedReviewArtifact.title) {
              return {
                ...msg,
                artifactData: {
                  ...msg.artifactData,
                  title: editedReviewArtifactTitle
                }
              };
            }
            return msg;
          })
        );
        
        toast.success("Review artifact title updated");
      }
    } else if (selectedReviewArtifact) {
      setEditedReviewArtifactTitle(selectedReviewArtifact.title);
    }
    setIsEditingReviewArtifactTitle(false);
  }, [editedReviewArtifactTitle, selectedReviewArtifact]);

  // Handle clicking outside of input fields
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatTitleInputRef.current && !chatTitleInputRef.current.contains(event.target as Node)) {
        handleSaveChatTitle();
      }
      if (artifactTitleInputRef.current && !artifactTitleInputRef.current.contains(event.target as Node)) {
        handleSaveArtifactTitle();
      }
      if (draftArtifactTitleInputRef.current && !draftArtifactTitleInputRef.current.contains(event.target as Node)) {
        handleSaveDraftArtifactTitle();
      }
      if (reviewArtifactTitleInputRef.current && !reviewArtifactTitleInputRef.current.contains(event.target as Node)) {
        handleSaveReviewArtifactTitle();
      }
    };

    if (isEditingChatTitle || isEditingArtifactTitle || isEditingDraftArtifactTitle || isEditingReviewArtifactTitle) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditingChatTitle, isEditingArtifactTitle, isEditingDraftArtifactTitle, isEditingReviewArtifactTitle, editedChatTitle, editedArtifactTitle, editedDraftArtifactTitle, editedReviewArtifactTitle, handleSaveChatTitle, handleSaveArtifactTitle, handleSaveDraftArtifactTitle, handleSaveReviewArtifactTitle]);

  // Auto-collapse sidebar when drawer or artifact panel is open
  useEffect(() => {
    if ((sourcesDrawerOpen || anyArtifactPanelOpen) && !hasAutoCollapsedSidebarRef.current) {
      setSidebarOpen(false);
      hasAutoCollapsedSidebarRef.current = true;
    }
  }, [sourcesDrawerOpen, anyArtifactPanelOpen, setSidebarOpen]);

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
      setIsResizing(false); // Stop resizing before triggering animation
      // Use requestAnimationFrame to ensure state update is processed
      requestAnimationFrame(() => {
        toggleChat(false);
        setShouldTriggerCollapse(false);
      });
    }
  }, [shouldTriggerCollapse, toggleChat]);

  // Handle expand trigger
  useEffect(() => {
    if (shouldTriggerExpand) {
      setIsResizing(false); // Stop resizing before closing artifacts
      // Use requestAnimationFrame to ensure state update is processed
      requestAnimationFrame(() => {
        setArtifactPanelOpen(false);
        setDraftArtifactPanelOpen(false);
        setReviewArtifactPanelOpen(false);
        setUnifiedArtifactPanelOpen(false);
        setSelectedArtifact(null);
        setSelectedDraftArtifact(null);
        setSelectedReviewArtifact(null);
        setCurrentArtifactType(null);
        setShouldTriggerExpand(false);
      });
    }
  }, [shouldTriggerExpand]);

  // Drag-and-drop file handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles).map((file) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: 'file' as const,
        modifiedDate: new Date().toLocaleDateString(),
        size: file.size < 1024 * 1024
          ? `${Math.round(file.size / 1024)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        path: file.name,
      }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const removeAttachedFile = useCallback((fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const checkChipsOverflow = useCallback(() => {
    if (fileChipsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = fileChipsRef.current;
      setShowLeftChipGradient(scrollLeft > 0);
      setShowRightChipGradient(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkChipsOverflow();
    window.addEventListener('resize', checkChipsOverflow);
    return () => window.removeEventListener('resize', checkChipsOverflow);
  }, [checkChipsOverflow, attachedFiles]);

  // Function to handle workflow-initiated messages (AI-only response)
  const sendWorkflowMessage = useCallback((workflowTitle: string) => {
    setIsLoading(true);
    
    // Create assistant message without thinking states for first workflow message
    const assistantMessage = {
      role: 'assistant' as const,
      content: '', // Will be populated shortly
      type: 'text' as const, // Text type for workflow responses
      isLoading: true,
      isWorkflowResponse: true, // Flag to identify workflow responses
      workflowTitle: workflowTitle,
      isFirstWorkflowMessage: true, // Flag to identify this is the first message
      showThinking: false // Explicitly disable thinking state for first message
    };
    
    // Add only the assistant message (no user message for workflow)
    setMessages([assistantMessage]);
    
    // Scroll to bottom after message is added
    setTimeout(() => scrollToBottom(), 50);
    
    // Show the content quickly without thinking states
    setTimeout(() => {
      // Update the assistant message with actual content for S-1 workflow
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === 0 && msg.role === 'assistant' && msg.isLoading) {
          let content = '';
          
          if (workflowTitle.toLowerCase().includes('s-1') && workflowTitle.toLowerCase().includes('risk factors')) {
            content = "Let's draft comprehensive risk factors for your S-1 filing. To create accurate and company-specific risk factors, I'll need supporting materials that highlight your business operations, financial position, industry challenges, and regulatory environment. This includes financials, business plans, competitor analyses, and any existing risk assessments. How would you like to upload your supporting documents?";
          } else if (workflowTitle.toLowerCase().includes('s-1')) {
            content = "Let's get going on drafting your S-1. Before we get started, I'll need some supporting materials (charters, financials, press releases, prior filings). I'll also need key deal details like offering type, structure, and use of proceeds. After I have all the information, I can generate a draft S-1 shell that you can edit in draft mode. First things first, how would you like to upload your supporting documents?";
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
      }));
      
      setIsLoading(false);
      scrollToBottom();
    }, 300); // Much shorter delay since no thinking states
  }, [scrollToBottom]);

  const sendMessage = useCallback((messageOverride?: string, opts?: { skipNudge?: boolean }) => {
    const messageToSend = messageOverride || inputValue;
    if (messageToSend.trim() && !isLoading) {
      const userMessage = messageToSend;
      setInputValue('');
      setIsLoading(true);
      
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '20px';
      }
      
      // Check if we should show the review table nudge
      const showNudge = !opts?.skipNudge && shouldShowReviewNudge(userMessage);
      
      // Determine artifact type using weighted keyword scoring
      const artifactType = showNudge ? null : detectArtifactType(userMessage);
      const isDraftArtifact = artifactType === 'draft';
      const isReviewArtifact = artifactType === 'review';
      
      
      // Get the thinking content for the appropriate variant
      const variant = showNudge ? 'review' : isDraftArtifact ? 'draft' : isReviewArtifact ? 'review' : 'analysis';
      const thinkingContent = getThinkingContent(variant);
      
      // Initialize progressive loading states
      const loadingState = {
        showSummary: false,
        visibleBullets: 0,
        showAdditionalText: false,
        visibleChildStates: 0
      };
      
      // Create assistant message with loading thinking states
      const assistantMessage: Message = {
        role: 'assistant' as const,
        content: '',
        type: showNudge ? 'text' as const : (isDraftArtifact || isReviewArtifact ? 'artifact' as const : 'text' as const),
        thinkingContent,
        loadingState,
        isLoading: true,
        ...(showNudge ? {
          showNudge: true,
          nudgeUserQuery: userMessage,
        } : {}),
        ...(!showNudge && (isDraftArtifact || isReviewArtifact) ? {
          artifactData: {
            title: isDraftArtifact ? 'Record of Deliberation' : 'Extraction of Agreements and Provisions',
            subtitle: isDraftArtifact ? 'Version 1' : '24 columns · 104 rows',
            variant: isDraftArtifact ? 'draft' as const : 'review' as const
          }
        } : {})
      };
      
      const currentFiles = attachedFilesRef.current;
      const hasFiles = currentFiles.length > 0;
      const userMsg: Message = hasFiles
        ? { role: 'user' as const, content: userMessage, type: 'files' as const, filesData: [...currentFiles], showSaveNudge: true }
        : { role: 'user' as const, content: userMessage, type: 'text' as const };

      setAttachedFiles([]);

      setMessages(prev => [
        ...prev,
        userMsg,
        assistantMessage
      ]);
      
      setTimeout(() => scrollToBottom(), 50);
      
      // Progressively reveal thinking content
      setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
            ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
            : msg
        ));
      }, 600);
      
      const bullets = thinkingContent.bullets || [];
      bullets.forEach((_, bulletIdx) => {
        setTimeout(() => {
          setMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
              ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
              : msg
          ));
          scrollToBottom();
        }, 1200 + (bulletIdx * 400));
      });
      
      if (thinkingContent.additionalText) {
        setTimeout(() => {
          setMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
              ? { ...msg, loadingState: { ...msg.loadingState, showAdditionalText: true } }
              : msg
          ));
          scrollToBottom();
        }, 1200 + (bullets.length * 400) + 300);
      }
      
      const childStates = thinkingContent.childStates || [];
      childStates.forEach((_, childIdx) => {
        setTimeout(() => {
          setMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
              ? { ...msg, loadingState: { ...msg.loadingState, visibleChildStates: childIdx + 1 } }
              : msg
          ));
          scrollToBottom();
        }, 2800 + (childIdx * 350));
      });
      
      // After thinking completes, show final content
      setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) => {
          if (idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading) {
            if (showNudge) {
              return {
                ...msg,
                content: 'This query would work best with a review table as you\u2019re attempting to run multiple questions across several documents. A review table splits up your query into multiple questions (or columns) and processes these simultaneously.',
                isLoading: false,
                showNudge: true,
                nudgeUserQuery: userMessage,
              };
            }
            return {
              ...msg,
              content: isDraftArtifact 
                ? 'I have drafted a memo for you. Please let me know if you would like to continue editing the draft or if you need any specific changes or additional information included.'
                : isReviewArtifact
                  ? 'I have generated a review table extracting terms from the industrial merger agreements as requested. Please let me know if you would like to continue editing the table or if you need any specific changes.'
                  : 'legal-analysis',
              isLoading: false,
            };
          }
          return msg;
        }));
        
        setIsLoading(false);
        scrollToBottom();
      }, 4000);
    }
  }, [inputValue, isLoading, sourcesDrawerOpen, hasOpenedSourcesDrawerRef, scrollToBottom]);

  // Handle saving uploaded files to Files
  const handleSaveToFiles = useCallback((messageIndex: number) => {
    const msg = messages[messageIndex];
    if (msg?.filesData) {
      const savedFiles = JSON.parse(localStorage.getItem('harvey-saved-files') || '[]');
      const categories = [
        { label: 'Compliance Policy', color: '#CE5347' },
        { label: 'Audit Report', color: '#638DE0' },
        { label: 'Regulatory Filing', color: '#F2D646' },
        { label: 'Risk Assessment', color: '#93C5FD' },
        { label: 'Evidence File', color: '#86EFAC' },
      ];
      const newFiles = msg.filesData.map((f, i) => ({
        id: `saved-${Date.now()}-${f.id}`,
        name: f.name,
        size: f.size ? parseInt(f.size) * 1024 : 0,
        type: f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf'
            : f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc') ? 'application/docx'
            : f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls') ? 'application/xlsx'
            : f.type === 'folder' ? 'folder'
            : 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        createdBy: 'You',
        parentPath: '',
        category: categories[i % categories.length],
      }));
      localStorage.setItem('harvey-saved-files', JSON.stringify([...savedFiles, ...newFiles]));
    }
    setMessages(prev => prev.map((msg, i) =>
      i === messageIndex ? { ...msg, saveNudgeDismissed: true } : msg
    ));
    toast.success("Saved to files");
  }, [messages]);

  // Handle user selecting an option from the review-table nudge
  const handleNudgeSelection = useCallback((choice: 'thread' | 'review', nudgeMessageIndex: number, originalQuery: string) => {
    setIsLoading(true);

    // Mark the nudge as dismissed so cards hide
    setMessages(prev => prev.map((msg, idx) =>
      idx === nudgeMessageIndex ? { ...msg, nudgeDismissed: true } : msg
    ));

    // Automated user message indicating the choice
    const userChoiceContent = choice === 'thread'
      ? 'Continue in thread'
      : 'Use the review table tool';

    const thinkingVariant = choice === 'review' ? 'review' : 'analysis';
    const thinkingContent = getThinkingContent(thinkingVariant as 'analysis' | 'draft' | 'review');

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      type: choice === 'review' ? 'artifact' : 'text',
      thinkingContent,
      loadingState: { showSummary: false, visibleBullets: 0, showAdditionalText: false, visibleChildStates: 0 },
      isLoading: true,
      ...(choice === 'review' ? {
        artifactData: {
          title: 'Extraction of Agreements and Provisions',
          subtitle: '24 columns · 104 rows',
          variant: 'review' as const,
        }
      } : {}),
    };

    setMessages(prev => [
      ...prev,
      { role: 'user' as const, content: userChoiceContent, type: 'text' as const },
      assistantMessage,
    ]);

    setTimeout(() => scrollToBottom(), 50);

    // Progressive thinking reveal
    setTimeout(() => {
      setMessages(prev => prev.map((msg, idx) =>
        idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
          ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
          : msg
      ));
    }, 600);

    const bullets = thinkingContent.bullets || [];
    bullets.forEach((_, bulletIdx) => {
      setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
            ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
            : msg
        ));
        scrollToBottom();
      }, 1200 + bulletIdx * 400);
    });

    // Final content
    setTimeout(() => {
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading) {
          return {
            ...msg,
            content: choice === 'review'
              ? 'I have generated a review table extracting terms from the industrial merger agreements as requested. Please let me know if you would like to continue editing the table or if you need any specific changes.'
              : 'legal-analysis',
            isLoading: false,
          };
        }
        return msg;
      }));

      // Open drawer for nudge selections only if there are files in the session
      const sessionHasFiles = messages.some(m => m.type === 'files' && m.filesData && m.filesData.length > 0);
      if (!sourcesDrawerOpen && sessionHasFiles) {
        setSourcesDrawerOpen(true);
        setSidebarOpen(false);
        hasOpenedSourcesDrawerRef.current = true;
      }

      setIsLoading(false);
      scrollToBottom();
    }, 4000);
  }, [scrollToBottom, sourcesDrawerOpen]);
  
  // Process initial message when component mounts
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessageRef.current) {
      hasProcessedInitialMessageRef.current = true;
      
      // Check if this is a workflow-initiated chat
      if (isWorkflow || isWorkflowInitiated) {
        // For workflows, send AI message directly
        setTimeout(() => {
          sendWorkflowMessage(initialMessage);
        }, 100);
      } else {
        // For regular chats, send as user message
        // Read attached files from sessionStorage directly to avoid stale closure
        let homepageFiles: typeof attachedFiles = [];
        try {
          const stored = sessionStorage.getItem('attachedFiles');
          if (stored) {
            homepageFiles = JSON.parse(stored);
            sessionStorage.removeItem('attachedFiles');
            setAttachedFiles(homepageFiles);
          }
        } catch { /* ignore */ }

        if (homepageFiles.length > 0) {
          // Send with files immediately — don't rely on state
          setTimeout(() => {
            const userMsg: Message = { role: 'user', content: initialMessage, type: 'files', filesData: homepageFiles, showSaveNudge: true };
            const thinkingContent = getThinkingContent(shouldShowReviewNudge(initialMessage) ? 'review' : 'analysis');
            const showNudge = shouldShowReviewNudge(initialMessage, { fileCount: homepageFiles.length });

            const assistantMessage: Message = {
              role: 'assistant',
              content: '',
              type: 'text',
              thinkingContent,
              loadingState: { showSummary: false, visibleBullets: 0, showAdditionalText: false, visibleChildStates: 0 },
              isLoading: true,
              ...(showNudge ? { showNudge: true, nudgeUserQuery: initialMessage } : {}),
            };

            setMessages([userMsg, assistantMessage]);
            setIsLoading(true);
            setAttachedFiles([]);

            setTimeout(() => {
              setMessages(prev => prev.map((msg, idx) =>
                idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                  ? { ...msg, loadingState: { ...msg.loadingState, showSummary: true } }
                  : msg
              ));
            }, 600);

            const bullets = thinkingContent.bullets || [];
            bullets.forEach((_, bulletIdx) => {
              setTimeout(() => {
                setMessages(prev => prev.map((msg, idx) =>
                  idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading && msg.loadingState
                    ? { ...msg, loadingState: { ...msg.loadingState, visibleBullets: bulletIdx + 1 } }
                    : msg
                ));
              }, 1200 + bulletIdx * 400);
            });

            setTimeout(() => {
              setMessages(prev => prev.map((msg, idx) => {
                if (idx === prev.length - 1 && msg.role === 'assistant' && msg.isLoading) {
                  if (showNudge) {
                    return { ...msg, content: 'This query would work best with a review table as you\u2019re attempting to run multiple questions across several documents. A review table splits up your query into multiple questions (or columns) and processes these simultaneously.', isLoading: false, showNudge: true, nudgeUserQuery: initialMessage };
                  }
                  return { ...msg, content: 'legal-analysis', isLoading: false };
                }
                return msg;
              }));
              setIsLoading(false);
            }, 4000);
          }, 100);
        } else {
          setInputValue(initialMessage);
          setTimeout(() => {
            sendMessage(initialMessage);
          }, 100);
        }
      }
    }
  }, [initialMessage, sendMessage, sendWorkflowMessage, isWorkflow, isWorkflowInitiated]);


  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow resizing if any artifact panel is open
    if (!anyArtifactPanelOpen) return;
    e.preventDefault();

    setIsResizing(true);
    // Reset threshold states when starting a new resize
    isPastCollapseThresholdRef.current = false;
    isPastExpandThresholdRef.current = false;
    setIsPastCollapseThreshold(false);
    setIsPastExpandThreshold(false);
  };

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
      
      // Add class to body to maintain cursor during drag
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
  }, [isResizing, chatOpen, artifactPanelOpen, draftArtifactPanelOpen, reviewArtifactPanelOpen, anyArtifactPanelOpen, isPastCollapseThreshold, isPastExpandThreshold]);

  return (
    <div
      className="flex h-screen w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <SidebarInset>
        <div ref={containerRef} className="h-screen flex text-sm" style={{ fontSize: '14px', lineHeight: '20px' }}>
          {/* AI Chat Interface - Left Panel */}
          <AnimatePresence mode="wait">
            {chatOpen && (
              <motion.div 
                key="chat-panel"
                initial={isChatToggling ? { width: 0, opacity: 0 } : false}
                animate={isResizing ? undefined : { 
                  width: anyArtifactPanelOpen ? chatWidth : (sourcesDrawerOpen ? 'calc(100% - 400px)' : '100%'),
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
                className="flex relative overflow-hidden bg-bg-base"
                style={{ 
                  flexShrink: 0,
                  ...(isResizing && anyArtifactPanelOpen ? { width: chatWidth } : {})
                }}
              >
        <div className="flex flex-col bg-bg-base relative" style={{ 
          width: anyArtifactPanelOpen ? chatWidth - 1 : '100%',
          minWidth: 0
        }}>

          {/* Chat Header - tabs style like Crestonridge */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ height: '52px' }}>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-1 overflow-x-auto" style={{ flexWrap: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
                <span
                  className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                  style={{ padding: '4px 8px', maxWidth: '300px' }}
                  title={currentChatTitle}
                >
                  {currentChatTitle}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                className="w-7 h-7 flex items-center justify-center hover:bg-bg-subtle rounded-[7px] transition-colors flex-shrink-0"
                title="Chat history"
              >
                <img src="/central_icons/History.svg" alt="Chat history" width={16} height={16} className="opacity-50" />
              </button>
              <button
                onClick={() => router.push('/assistant')}
                className="w-7 h-7 flex items-center justify-center hover:bg-bg-subtle rounded-[7px] transition-colors flex-shrink-0"
                title="New chat"
              >
                <Plus size={16} className="text-fg-muted" />
              </button>
            </div>
          </div>
          
          {/* Messages Area Container */}
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Top Gradient Overlay - positioned outside scrollable area */}
            <div 
              className={`absolute top-0 left-0 right-0 pointer-events-none z-10 transition-opacity duration-300 chat-scroll-gradient ${
                isScrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Bottom Gradient Overlay */}
            <div 
              className={`absolute bottom-0 left-0 right-0 pointer-events-none z-10 transition-opacity duration-300 chat-scroll-gradient-bottom ${
                showBottomGradient ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Messages Area */}
            <motion.div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-8 pb-8 hide-scrollbar"
              initial={initialMessage && isFromHomepage && !hasPlayedAnimationsRef.current ? { opacity: 0 } : {}}
              animate={{ opacity: 1 }}
              transition={initialMessage && isFromHomepage && !hasPlayedAnimationsRef.current ? { delay: 0.4, duration: 0.6 } : {}}
            >
              <div className="mx-auto" style={{ maxWidth: '740px' }}>

            {messages.length === 0 ? (
              <div className="text-center text-fg-muted mt-8">
                <p>Start a conversation with Harvey</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} data-message className={`${index !== messages.length - 1 ? 'mb-6' : ''}`}>
                  {/* User Message - Right aligned */}
                  {message.role === 'user' && (
                    <div className="flex flex-col gap-1 items-end pl-[68px]">
                      <div className="bg-bg-subtle px-4 py-3 rounded-[12px]">
                        <div className="text-sm text-fg-base leading-5">
                          {message.content}
                        </div>
                      </div>
                      {/* Files list below the message bubble */}
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
                      <>

                        {/* Show loading thinking states OR regular thinking state - unless explicitly disabled */}
                        {message.showThinking !== false && (
                          <>
                            {message.isLoading && message.thinkingContent && message.loadingState ? (
                              // Loading thinking states - progressively reveal content
                              <ThinkingState
                                variant={message.type === 'artifact' ? (message.artifactData?.variant === 'draft' ? 'draft' : 'review') : 'analysis'}
                                title="Thinking..."
                                durationSeconds={undefined}
                                summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined}
                                bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)}
                                additionalText={message.loadingState.showAdditionalText ? message.thinkingContent.additionalText : undefined}
                                childStates={message.thinkingContent.childStates?.slice(0, message.loadingState.visibleChildStates)}
                                isLoading={true} // This will keep it expanded and show shimmer
                              />
                            ) : message.thinkingContent ? (
                              // Regular thinking state (after loading) - use the stored thinking content
                              <ThinkingState
                                variant={message.type === 'artifact' ? (message.artifactData?.variant === 'draft' ? 'draft' : 'review') : 'analysis'}
                                title="Thought"
                                durationSeconds={6}
                                summary={message.thinkingContent.summary}
                                bullets={message.thinkingContent.bullets}
                                additionalText={message.thinkingContent.additionalText}
                                childStates={message.thinkingContent.childStates}
                                defaultOpen={false} // Will be collapsed after loading
                              />
                            ) : null}
                          </>
                        )}
                        
                        {/* Show content only if not loading */}
                        {!message.isLoading && message.content && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                              {message.type === 'artifact' ? (
                      <div className="space-y-3">
                        <div className="text-fg-base leading-relaxed pl-2">
                          {message.content}
                        </div>
                        <div className="pl-2">
                          <ReviewTableArtifactCard
                            title={message.artifactData?.title || 'Artifact'}
                            subtitle={message.artifactData?.subtitle || ''}
                            variant={anyArtifactPanelOpen ? 'small' : 'large'}
                            isSelected={unifiedArtifactPanelOpen && (
                              (currentArtifactType === 'draft' && message.artifactData?.variant === 'draft' && selectedDraftArtifact?.title === message.artifactData?.title) ||
                              (currentArtifactType === 'review' && message.artifactData?.variant !== 'draft' && selectedReviewArtifact?.title === message.artifactData?.title)
                            )}
                            iconType={message.artifactData?.variant === 'draft' ? 'file' : 'table'}
                            showSources={message.artifactData?.variant === 'draft'}
                            onClick={() => {
                            // Immediately update the artifact content
                            const artifactType = message.artifactData?.variant === 'draft' ? 'draft' : 'review';
                            const artifactData = {
                              title: message.artifactData?.title || 'Artifact',
                              subtitle: message.artifactData?.subtitle || ''
                            };
                            
                            // Update unified panel state
                            setCurrentArtifactType(artifactType);
                            setUnifiedArtifactPanelOpen(true);
                            
                            // Also update the legacy states for backward compatibility
                            if (artifactType === 'draft') {
                              setSelectedDraftArtifact(artifactData);
                              setDraftArtifactPanelOpen(true);
                              setReviewArtifactPanelOpen(false);
                            } else {
                              setSelectedReviewArtifact(artifactData);
                              setReviewArtifactPanelOpen(true);
                              setDraftArtifactPanelOpen(false);
                            }
                          }}
                          />
                        </div>
                        {/* Ghost buttons for AI messages with artifacts */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <Download className="w-3 h-3" />
                                Export
                              </button>
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <RotateCcw className="w-3 h-3" />
                                Rewrite
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
                        <div className="text-fg-base leading-relaxed pl-2">
                          {message.content === 'legal-analysis' ? (
                            <div className="space-y-4">
                              <p>The entitlement of a commercial tenant to self-help rights depends on the jurisdiction and the specific circumstances of the case. Below is an analysis based on federal principles, state laws, and relevant case law:</p>
                              
                              <h3 className="text-base font-semibold">Federal and General Principles</h3>
                              <p>Under federal law and general principles, there is no inherent right for a commercial tenant to engage in self-help. Instead, the remedies available to tenants are typically governed by statutory frameworks or common law principles, which vary by jurisdiction. For example, in the District of Columbia, the common law right of self-help for landlords has been abrogated, and statutory remedies are deemed exclusive. This principle applies equally to commercial tenancies, as established in Mendes v. Johnson, 389 A.2d 781 (D.C. 1978), where the court held that a tenant has the right not to have their possession interfered with except by lawful process.</p>
                              
                              <h3 className="text-base font-semibold">Jurisdictional Analysis</h3>
                              
                              <h4 className="text-sm font-semibold mt-2">New York</h4>
                              <p>In New York, the focus is primarily on the landlord&apos;s right to self-help rather than the tenant&apos;s. Case law such as Sol De Ibiza, LLC v. Panjo Realty, Inc., 911 N.Y.S.2d 567 (App. Term 2010) and Martinez v. Ulloa, 22 N.Y.S.3d 787 (N.Y. App. Term. 2015) confirms that landlords may utilize self-help to regain possession of commercial premises under specific conditions, including a lease provision reserving the right, a valid rent demand, and peaceable reentry. However, there is no indication in these cases that commercial tenants have a reciprocal right to self-help. Instead, tenants typically seek judicial remedies, such as restoration of possession or damages for wrongful eviction under RPAPL § 853.</p>
                              
                              <h4 className="text-sm font-semibold mt-2">District of Columbia</h4>
                              <p>In the District of Columbia, the courts have explicitly rejected the use of self-help by landlords and tenants alike. In Mendes v. Johnson and Sarete, Inc. v. 1344 U St. Ltd. P&apos;ship, 871 A.2d 480 (D.C. 2005), the courts held that statutory remedies for reacquiring possession are exclusive, and any interference with possession outside of lawful process constitutes wrongful eviction. This prohibition applies to both residential and commercial tenancies.</p>
                              
                              <h4 className="text-sm font-semibold mt-2">Rhode Island</h4>
                              <p>Rhode Island law explicitly prohibits the use of self-help by landlords to reenter and repossess leased premises, whether under common law or contractual agreements. While the statute, R.I. Gen. Laws § 34-18.1-15, does not directly address tenants, the prohibition on self-help for landlords suggests a strong preference for judicial processes to resolve possession disputes.</p>
                              
                              <h4 className="text-sm font-semibold mt-2">Virginia</h4>
                              <p>Virginia law permits self-help eviction by landlords in commercial tenancies, provided it does not incite a breach of the peace, as outlined in Va. Code Ann. § 55.1-1400. However, the statute does not extend this right to tenants, and tenants are generally expected to rely on judicial remedies to address disputes.</p>
                              
                              <h3 className="text-base font-semibold">Conclusion</h3>
                              <p>In most jurisdictions, commercial tenants are not entitled to self-help rights. Instead, they are expected to seek judicial remedies to address disputes with landlords. Jurisdictions like the District of Columbia and Rhode Island explicitly prohibit self-help, while others, such as New York and Virginia, focus on the landlord&apos;s rights without extending similar rights to tenants. Tenants should carefully review their lease agreements and applicable state laws to determine their rights and remedies in possession disputes.</p>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                        {/* Sources section for legal analysis */}
                        {message.content === 'legal-analysis' && (
                          <>
                            <p className="text-xs font-medium text-fg-subtle mt-4 pl-2">Sources</p>
                            <button 
                              className="flex items-center gap-2 text-sm text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1.5 max-w-full"
                              onClick={() => { setSourcesDrawerOpen(true); setSidebarOpen(false); }}
                            >
                            {/* Facepile avatars */}
                            <div className="flex -space-x-1.5 flex-shrink-0">
                              <div className="w-5 h-5 rounded-full bg-bg-base flex items-center justify-center border-[1px] border-white overflow-hidden z-[3]">
                                <Image src="/lexis.svg" alt="LexisNexis" width={20} height={20} className="w-full h-full object-cover" />
                              </div>
                              <div className="w-5 h-5 rounded-full bg-bg-base flex items-center justify-center border-[1.5px] border-white overflow-hidden z-[2]">
                                <Image src="/EDGAR.svg" alt="EDGAR" width={20} height={20} className="w-full h-full object-cover" />
                              </div>
                              <div className="w-5 h-5 rounded-full bg-bg-base flex items-center justify-center border-[1.5px] border-white overflow-hidden z-[1]">
                                <Image src="/bloomberg.jpg" alt="Bloomberg" width={20} height={20} className="w-full h-full object-cover" />
                              </div>
                            </div>
                            <span className="truncate">6 sources from LexisNexis, EDGAR, and more</span>
                          </button>
                          </>
                        )}
                        {/* Review table nudge */}
                        {message.showNudge && !message.nudgeDismissed && (
                          <ReviewNudge
                            userQuery={message.nudgeUserQuery || ''}
                            onSelectThread={() => handleNudgeSelection('thread', index, message.nudgeUserQuery || '')}
                            onSelectReviewTable={() => handleNudgeSelection('review', index, message.nudgeUserQuery || '')}
                          />
                        )}
                        {/* File Review Thinking State */}
                        {message.showFileReview && message.fileReviewContent && (
                          <AnimatePresence>
                            <motion.div 
                              key="file-review-content"
                              className="mt-3"
                              initial={{ opacity: 0, y: 10 }}
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                  >
                                    <div className="flex flex-wrap gap-2">
                                      {message.fileReviewContent.files.map((file, idx) => (
                                        <motion.div
                                          key={`file-chip-${idx}`}
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ 
                                            duration: 0.2, 
                                            ease: "easeOut",
                                            delay: Math.floor(idx / 3) * 0.1
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
                        
                        {/* Counsel filter buttons for Risk Factors workflow */}
                        {message.fileReviewLoadingState && !message.fileReviewLoadingState.isLoading && message.showFileReview && !message.selectedCounselFilter && (
                          <motion.div 
                            className="mt-3 flex gap-2 pl-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                          >
                            <button
                              className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                              onClick={() => {
                                // Handle Latham & Watkins filter selection
                                setMessages(prev => prev.map((msg, idx) => {
                                  if (idx === prev.length - 1 && msg.role === 'assistant') {
                                    return {
                                      ...msg,
                                      selectedCounselFilter: 'latham' as const,
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
                                
                                // Simulate thinking progress
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
                                
                                // Show bullets progressively
                                [1, 2, 3].forEach((_, bulletIdx) => {
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
                                
                                // Complete thinking state and show message
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
                                        timeWindowMessage: "Do you want me to default to a five-year lookback, or would you prefer a narrower or broader time window for pulling S-1 filings?"
                                      };
                                    }
                                    return msg;
                                  }));
                                }, 2800);
                              }}
                            >
                              <span className="text-fg-base text-sm font-normal">Latham & Watkins only</span>
                            </button>
                            
                            <button
                              className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                              onClick={() => {
                                // Handle no filter selection
                                setMessages(prev => prev.map((msg, idx) => {
                                  if (idx === prev.length - 1 && msg.role === 'assistant') {
                                    return {
                                      ...msg,
                                      selectedCounselFilter: 'nofilter' as const,
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
                                
                                // Simulate thinking progress (same as above)
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
                                
                                [1, 2, 3].forEach((_, bulletIdx) => {
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
                                        timeWindowMessage: "Do you want me to default to a five-year lookback, or would you prefer a narrower or broader time window for pulling S-1 filings?"
                                      };
                                    }
                                    return msg;
                                  }));
                                }, 2800);
                              }}
                            >
                              <span className="text-fg-base text-sm font-normal">No filter</span>
                            </button>
                          </motion.div>
                        )}
                        
                        {/* Time Window Thinking State */}
                        {message.showTimeWindowThinking && (
                          <AnimatePresence>
                            <motion.div 
                              key="time-window-thinking"
                              className="mt-3.5"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                              <ThinkingState
                                variant="analysis"
                                title={message.timeWindowThinkingState?.isLoading ? "Thinking..." : "Thought"}
                                durationSeconds={message.timeWindowThinkingState?.isLoading ? undefined : 2}
                                summary={message.timeWindowThinkingState?.showSummary ? "Determining optimal time window for precedent analysis." : undefined}
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
                                  className="mt-1 text-fg-base leading-relaxed pl-2"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                                >
                                  {message.timeWindowMessage}
                                </motion.div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        )}
                        
                        {/* EDGAR Review Thinking State */}
                        {message.showEdgarReview && message.edgarReviewContent && (
                          <AnimatePresence>
                            <motion.div 
                              key="edgar-review"
                              className="mt-3.5"
                              initial={{ opacity: 0, y: 10 }}
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                  >
                                    <div className="flex flex-wrap gap-2">
                                      {message.edgarReviewContent.filings.map((filing, idx) => (
                                        <motion.div
                                          key={`filing-chip-${idx}`}
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ 
                                            duration: 0.2, 
                                            ease: "easeOut",
                                            delay: Math.floor(idx / 3) * 0.1
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
                                    className="mt-2 text-fg-base leading-relaxed pl-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                                  >
                                    {message.edgarReviewCompleteMessage}
                                  </motion.div>
                                  
                                  {/* Precedent Companies Table */}
                                  {message.precedentCompaniesData && (
                                    <motion.div 
                                      className="mt-4 pl-2"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
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
                                          // Update the current message to show thinking state and mark as confirmed
                                          setMessages(prev => prev.map((msg, idx) => {
                                            if (idx === prev.length - 1 && msg.role === 'assistant' && msg.precedentCompaniesData) {
                                              // Update the precedentCompaniesData to reflect current selections
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
                                          
                                          // Progressive reveal of review table generation content
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
                                          
                                          // Show bullets progressively
                                          [1, 2, 3].forEach((_, bulletIdx) => {
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
                                          
                                          // Complete the generation and show the artifact
                                          setTimeout(() => {
                                            setMessages(prev => prev.map((msg, idx) => {
                                              if (idx === prev.length - 1 && msg.role === 'assistant' && msg.precedentCompaniesData) {
                                                return {
                                                  ...msg,
                                                  reviewTableGenerationLoadingState: {
                                                    isLoading: false,
                                                    showSummary: true,
                                                    visibleBullets: 3
                                                  },
                                                  reviewTableArtifactData: {
                                                    title: 'Risk Factor Review Table',
                                                    subtitle: `${selectedCompanies.length} columns • 126 rows`
                                                  },
                                                  reviewTableMessage: 'I\'ve generated a comprehensive Risk Factor Review Table based on your selected precedent companies.'
                                                };
                                              }
                                              return msg;
                                            }));
                                            
                                            // Set artifact data and open panel
                                            const artifactData = {
                                              title: 'Risk Factor Review Table',
                                              subtitle: `${selectedCompanies.length} columns • 126 rows`
                                            };
                                            
                                            setSelectedReviewArtifact(artifactData);
                                            setCurrentArtifactType('review');
                                            
                                            setTimeout(() => {
                                              setUnifiedArtifactPanelOpen(true);
                                              setReviewArtifactPanelOpen(true);
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
                                        initial={{ opacity: 0, y: 10 }}
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
                                            className="mt-2 pl-2 text-fg-subtle"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                                          >
                                            {message.reviewTableMessage}
                                          </motion.div>
                                        )}
                                        
                                        {/* Review Table Artifact Card */}
                                        {!message.reviewTableGenerationLoadingState?.isLoading && message.reviewTableArtifactData && (
                                          <motion.div 
                                            className="mt-2.5 pl-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                                          >
                                            <ArtifactCard
                                              title={message.reviewTableArtifactData.title}
                                              subtitle={message.reviewTableArtifactData.subtitle}
                                              variant={unifiedArtifactPanelOpen ? 'small' : 'large'}
                                              isSelected={unifiedArtifactPanelOpen && (
                                                currentArtifactType === 'review' && selectedReviewArtifact?.title === message.reviewTableArtifactData.title
                                              )}
                                              iconType="table"
                                              onClick={() => {
                                                const artifactData = {
                                                  title: message.reviewTableArtifactData!.title,
                                                  subtitle: message.reviewTableArtifactData!.subtitle
                                                };
                                                setSelectedReviewArtifact(artifactData);
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
                        
                        {/* Workflow shortcut buttons */}
                        {message.isWorkflowResponse && message.workflowTitle?.toLowerCase().includes('s-1') && !messages.some(msg => msg.type === 'files') && (
                          <div className="pl-2 mt-4">
                            <div className="flex flex-wrap gap-2">
                              <button 
                                className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                                onClick={() => setIsFileManagementOpen(true)}
                              >
                                <CloudUpload size={16} className="text-fg-subtle" />
                                <span className="text-fg-base text-sm font-normal">Upload files</span>
                              </button>
                              
                              <button 
                                className="py-1.5 px-3 bg-bg-base border border-border-base rounded-md hover:bg-bg-subtle hover:border-border-strong transition-all flex items-center gap-1.5"
                                onClick={() => setIsiManagePickerOpen(true)}
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
                        
                        {/* Ghost buttons for AI responses — hidden while nudge is active */}
                        {!message.isWorkflowResponse && !(message.showNudge && !message.nudgeDismissed) && (
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center">
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <Download className="w-3 h-3" />
                                Export
                              </button>
                              <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5">
                                <RotateCcw className="w-3 h-3" />
                                Rewrite
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
                    </div>
                  )}
                </div>
              ))
            )}
            </div>
            </motion.div>
          </div>
          
          {/* Input Area - Animation simulating movement from center to bottom */}
          <motion.div 
            className="px-6 pb-6 overflow-x-hidden relative z-20 bg-bg-base"
            initial={initialMessage && isFromHomepage && !hasPlayedAnimationsRef.current ? { y: "calc(-45vh + 120px)" } : {}}
            animate={{ y: 0 }}
            transition={initialMessage && isFromHomepage && !hasPlayedAnimationsRef.current ? { 
              duration: 0.8,
              ease: [0.4, 0.0, 0.2, 1]
            } : {}}
            onAnimationComplete={() => {
              // Mark animations as played after the main animation completes
              if (initialMessage && isFromHomepage && !hasPlayedAnimationsRef.current) {
                hasPlayedAnimationsRef.current = true;
              }
            }}
          >
            <div className="mx-auto" style={{ maxWidth: '732px' }}>
              {/* Save to Files nudge - floats above chatbox */}
              <AnimatePresence>
                {messages.some(m => m.showSaveNudge && !m.saveNudgeDismissed) && (() => {
                  const nudgeIndex = messages.findIndex(m => m.showSaveNudge && !m.saveNudgeDismissed);
                  const nudgeMsg = messages[nudgeIndex];
                  return (
                    <motion.div
                      key="save-nudge"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="px-3 py-2 bg-bg-subtle border border-border-base rounded-lg flex items-center gap-2 mb-2"
                    >
                      <img src="/folderIcon.svg" alt="" className="w-4 h-4 shrink-0" />
                      <span className="text-xs text-fg-subtle font-medium truncate flex-1">
                        {nudgeMsg?.filesData?.length || 0} file{(nudgeMsg?.filesData?.length || 0) !== 1 ? 's' : ''} uploaded
                      </span>
                      <button
                        onClick={() => {
                          setMessages(prev => prev.map((msg, i) =>
                            i === nudgeIndex ? { ...msg, saveNudgeDismissed: true } : msg
                          ));
                        }}
                        className="h-6 px-2 text-xs font-medium text-fg-muted rounded-md hover:text-fg-base hover:bg-bg-subtle-hover transition-colors whitespace-nowrap"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleSaveToFiles(nudgeIndex)}
                        className="h-6 px-2 text-xs font-medium text-fg-base rounded-md border border-border-base hover:bg-bg-base transition-colors whitespace-nowrap"
                      >
                        Save to files
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
              <div className="w-full bg-bg-subtle border border-border-base rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong shadow-sm" style={{ minHeight: '84px' }}>
                {/* Composer Text Field */}
                <div className={`p-[10px] flex flex-col gap-[10px] flex-1 ${attachedFiles.length === 0 ? 'pt-[16px]' : ''}`}>
                  {/* Attached file chips */}
                  {attachedFiles.length > 0 && (
                    <div className="relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-subtle to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showLeftChipGradient ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-subtle to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showRightChipGradient ? 'opacity-100' : 'opacity-0'}`} />
                      <div
                        ref={fileChipsRef}
                        onScroll={checkChipsOverflow}
                        className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar"
                      >
                        {attachedFiles.map((file) => (
                          <div key={file.id} className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-bg-base border border-border-base rounded-[4px] shrink-0">
                            <Image
                              src={
                                file.name.toLowerCase().endsWith('.pdf') ? '/pdf-icon.svg'
                                : file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') ? '/docx-icon.svg'
                                : file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') ? '/xlsx-icon.svg'
                                : '/file.svg'
                              }
                              alt="" width={12} height={12} className="w-3 h-3"
                            />
                            <span className="text-[12px] font-medium text-fg-muted leading-[16px] truncate max-w-[140px]">{file.name}</span>
                            <button onClick={() => removeAttachedFile(file.id)} className="text-fg-muted hover:text-fg-base transition-colors">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="px-[4px]">
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
                          sendMessage();
                        }
                      }}
                      placeholder="Ask Harvey. Use @ for sources and attached files."
                      className="w-full bg-transparent focus:outline-none text-fg-base placeholder-fg-muted resize-none overflow-hidden"
                      style={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        height: '20px',
                        minHeight: '20px',
                        maxHeight: '300px'
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-end justify-between pl-[10px] pr-[10px] pb-[10px]">
                  {/* Left Controls - Labeled buttons */}
                  <div className="flex items-center gap-1 -ml-0.5">
                    <button className="h-7 px-2 flex items-center gap-1.5 rounded-[7px] hover:bg-bg-subtle-hover transition-colors text-sm font-medium text-fg-subtle">
                      <Scale size={16} />
                      Sources
                    </button>
                    <button
                      onClick={() => setIsFileManagementOpen(true)}
                      className="h-7 px-2 flex items-center gap-1.5 rounded-[7px] hover:bg-bg-subtle-hover transition-colors text-sm font-medium text-fg-subtle"
                    >
                      <Paperclip size={16} />
                      Files
                    </button>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                        <SlidersHorizontal size={16} className="text-fg-base" />
                      </button>
                    </div>

                    {/* Dynamic Submit/Voice Button */}
                    {isLoading ? (
                      <button
                        disabled
                        className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] transition-all cursor-not-allowed"
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
                      <button
                        className="h-[28px] px-[8px] flex items-center justify-center bg-bg-subtle-hover rounded-[6px] hover:bg-bg-subtle-pressed transition-all"
                      >
                        <AudioLines size={16} className="text-fg-base" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Resizable Separator - Only show when artifact panel is open and chat is open */}
        {anyArtifactPanelOpen && chatOpen && (
          <div 
            className="relative group"
            onMouseEnter={() => setIsHoveringResizer(true)}
            onMouseLeave={() => setIsHoveringResizer(false)}
            onMouseDown={handleMouseDown}
            style={{
              width: (isPastCollapseThreshold || isPastExpandThreshold) 
                ? '3px' // Thicker when past threshold
                : (isHoveringResizer || isResizing ? '2px' : '1px'),
              backgroundColor: (isPastCollapseThreshold || isPastExpandThreshold) 
                ? '#262626' // neutral-800 when past threshold
                : (isHoveringResizer || isResizing ? '#d4d4d4' : '#e5e5e5'),
              cursor: 'col-resize',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            {/* Invisible wider hit area for easier grabbing */}
            <div 
              className="absolute inset-y-0"
              style={{
                left: '-4px',
                right: '-4px',
                cursor: 'col-resize',
              }}
            />
          </div>
        )}
      </motion.div>
      )}
      </AnimatePresence>
      
      {/* Configuration Drawer - Shows as right panel */}
      <AnimatePresence>
        {sourcesDrawerOpen && !anyArtifactPanelOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              width: PANEL_ANIMATION,
              opacity: { duration: 0.15, ease: "easeOut" }
            }}
            className="h-full bg-bg-base border-l border-border-base flex flex-col overflow-hidden"
            style={{ flexShrink: 0 }}
          >
            <ConfigurationDrawer
              isOpen={true}
              onClose={() => setSourcesDrawerOpen(false)}
              variant="embedded"
              customSources={configDrawerSources}
              customArtifacts={configDrawerArtifacts.length > 0 ? configDrawerArtifacts : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Unified Artifact Panel - Right Panel */}
      <AnimatePresence>
        {unifiedArtifactPanelOpen && currentArtifactType && (
          <>
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
                sourcesDrawerOpen={sourcesDrawerOpen}
                onSourcesDrawerOpenChange={setSourcesDrawerOpen}
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
          </>
        )}
      </AnimatePresence>

      {/* Legacy Artifact Panel - For backward compatibility */}
      <AnimatePresence>
        {artifactPanelOpen && (
          <ReviewArtifactPanel
            selectedArtifact={selectedArtifact}
            isEditingArtifactTitle={isEditingArtifactTitle}
            editedArtifactTitle={editedArtifactTitle}
            onEditedArtifactTitleChange={setEditedArtifactTitle}
            onStartEditingTitle={() => {
              setIsEditingArtifactTitle(true);
              setEditedArtifactTitle(selectedArtifact?.title || 'Artifact');
            }}
            onSaveTitle={handleSaveArtifactTitle}
            onClose={() => {
              setArtifactPanelOpen(false);
              setSelectedArtifact(null);
            }}
            chatOpen={chatOpen}
            onToggleChat={toggleChat}
            shareArtifactDialogOpen={shareArtifactDialogOpen}
            onShareArtifactDialogOpenChange={setShareArtifactDialogOpen}
            exportReviewDialogOpen={exportReviewDialogOpen}
            onExportReviewDialogOpenChange={setExportReviewDialogOpen}
            artifactTitleInputRef={artifactTitleInputRef}
          />
        )}
      </AnimatePresence>
      
      {/* Configuration Drawer - Shows as panel alongside artifacts */}
      <AnimatePresence>
        {sourcesDrawerOpen && (artifactPanelOpen || draftArtifactPanelOpen || reviewArtifactPanelOpen) && isAbove2xl && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              width: PANEL_ANIMATION,
              opacity: { duration: 0.15, ease: "easeOut" }
            }}
            className="h-full bg-bg-base border-l border-border-base flex flex-col overflow-hidden"
            style={{ flexShrink: 0 }}
          >
            <ConfigurationDrawer
              isOpen={true}
              onClose={() => setSourcesDrawerOpen(false)}
              variant="embedded"
              customSources={configDrawerSources}
              customArtifacts={configDrawerArtifacts.length > 0 ? configDrawerArtifacts : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Share Dialogs */}
      <ShareThreadDialog 
        isOpen={shareThreadDialogOpen} 
        onClose={() => setShareThreadDialogOpen(false)} 
      />
      <ShareArtifactDialog 
        isOpen={shareArtifactDialogOpen} 
        onClose={() => setShareArtifactDialogOpen(false)} 
        artifactTitle={selectedArtifact?.title || "Artifact"}
      />
      
      {/* Export Dialogs */}
      <ExportThreadDialog 
        isOpen={exportThreadDialogOpen} 
        onClose={() => setExportThreadDialogOpen(false)} 
      />
      <ExportReviewDialog 
        isOpen={exportReviewDialogOpen} 
        onClose={() => setExportReviewDialogOpen(false)} 
        artifactTitle={selectedArtifact?.title || "Review"}
      />
      <FileManagementDialog 
        isOpen={isFileManagementOpen} 
        onClose={() => setIsFileManagementOpen(false)} 
      />
      <IManageFilePickerDialog
        isOpen={isiManagePickerOpen}
        onClose={() => setIsiManagePickerOpen(false)}
        onFilesSelected={(files) => {
          console.log('Selected files from iManage:', files);
          setIsiManagePickerOpen(false);
          // Simulate file review for Risk Factors workflow
          const workflowMsg = messages.find(m => m.isWorkflowResponse && m.workflowTitle);
          const isRiskFactorsWorkflow = workflowMsg?.workflowTitle?.toLowerCase().includes('risk factors');
          
          if (isRiskFactorsWorkflow && files.length > 0) {
            // Create a files message
            const filesMessage: Message = {
              role: 'user',
              content: `Added ${files.length} files from iManage`,
              type: 'files',
              filesData: files.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                modifiedDate: f.modifiedDate,
                size: f.size,
                path: f.path
              }))
            };
            
            // Create AI response with file review
            const aiResponse: Message = {
              role: 'assistant',
              content: '',
              type: 'text',
              isLoading: true,
              showThinking: false,
              isWorkflowResponse: true,
              workflowTitle: workflowMsg?.workflowTitle,
              showFileReview: true,
              fileReviewContent: {
                summary: "I'll review the files you've provided to extract key information about your company.",
                files: files.slice(0, 6).map(f => ({
                  name: f.name,
                  type: f.name.endsWith('.pdf') ? 'pdf' as const : f.name.endsWith('.docx') ? 'docx' as const : 'text' as const
                })),
                totalFiles: files.length
              },
              fileReviewLoadingState: {
                isLoading: true,
                loadedFiles: 0
              }
            };
            
            setMessages(prev => [...prev, filesMessage, aiResponse]);
            
            // Simulate file review progress
            let loadedCount = 0;
            const progressInterval = setInterval(() => {
              loadedCount++;
              setMessages(prev => prev.map((msg, idx) => {
                if (idx === prev.length - 1 && msg.role === 'assistant' && msg.fileReviewLoadingState) {
                  return {
                    ...msg,
                    fileReviewLoadingState: {
                      ...msg.fileReviewLoadingState,
                      loadedFiles: loadedCount
                    }
                  };
                }
                return msg;
              }));
              
              if (loadedCount >= Math.min(6, files.length)) {
                clearInterval(progressInterval);
                
                // Complete file review
                setTimeout(() => {
                  setMessages(prev => prev.map((msg, idx) => {
                    if (idx === prev.length - 1 && msg.role === 'assistant') {
                      return {
                        ...msg,
                        content: "I've reviewed all the files. Before I pull the proposed precedent set, I need a couple of preferences. Should I limit the search to precedents where Latham & Watkins served as issuer's counsel, or not filter by law firm at all?",
                        isLoading: false,
                        fileReviewLoadingState: {
                          isLoading: false,
                          loadedFiles: Math.min(6, files.length)
                        },
                        selectedCounselFilter: undefined
                      };
                    }
                    return msg;
                  }));
                }, 500);
              }
            }, 400);
          }
        }}
      />
        </div>
      </SidebarInset>

      {/* Full-screen dropzone overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/90"
          >
            <div className="flex flex-col items-center gap-3">
              <Image src="/file.svg" alt="File" width={24} height={24} className="opacity-60" />
              <p className="text-base font-semibold text-fg-base">Drop your files here</p>
              <p className="text-sm text-fg-muted">Drop files here to add them to your conversation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 