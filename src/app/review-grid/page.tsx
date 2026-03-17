"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import ReviewArtifactPanel from "@/components/review-artifact-panel";
import ShareArtifactDialog from "@/components/share-artifact-dialog";
import ExportReviewDialog from "@/components/export-review-dialog";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Copy, ListPlus, SquarePen, Download, RotateCcw, ThumbsUp, ThumbsDown, Paperclip, Scale, AudioLines, CornerDownLeft, X } from "lucide-react";
import VoiceMode from "@/components/voice/voice-mode";
import { SvgIcon } from "@/components/svg-icon";
import { Spinner } from "@/components/ui/spinner";
import { TextLoop } from "../../../components/motion-primitives/text-loop";
import ThinkingState from "@/components/thinking-state";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SelectedFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  modifiedDate: string;
  size?: string;
  path: string;
}

// Message type for chat
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

// Thinking content generator
function getThinkingContent(): {
  summary: string;
  bullets: string[];
} {
  return {
    summary: 'Parsing materials and selecting fields for a concise comparison.',
    bullets: [
      'Locate documents and parse key terms',
      'Normalize entities and dates',
      'Populate rows and verify data consistency'
    ]
  };
}

// Chat thread type
interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
}

export default function ReviewGridPage() {
  const [selectedArtifact, setSelectedArtifact] = useState<{ title: string; subtitle: string }>({
    title: 'New review table',
    subtitle: ''
  });
  const [isEditingArtifactTitle, setIsEditingArtifactTitle] = useState(false);
  const [editedArtifactTitle, setEditedArtifactTitle] = useState(selectedArtifact.title);
  const [shareArtifactDialogOpen, setShareArtifactDialogOpen] = useState(false);
  const [exportReviewDialogOpen, setExportReviewDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const isEmpty = selectedFiles.length === 0;
  
  const artifactTitleInputRef = useRef<HTMLInputElement | null>(null);

  // Handle saving artifact title
  const handleSaveArtifactTitle = useCallback(() => {
    if (editedArtifactTitle.trim()) {
      if (editedArtifactTitle !== selectedArtifact.title) {
        setSelectedArtifact({
          ...selectedArtifact,
          title: editedArtifactTitle
        });
        toast.success("Review grid title updated");
      }
    } else {
      setEditedArtifactTitle(selectedArtifact.title);
    }
    setIsEditingArtifactTitle(false);
  }, [editedArtifactTitle, selectedArtifact]);

  // Update edited artifact title when selected artifact changes
  const handleStartEditingTitle = useCallback(() => {
    setIsEditingArtifactTitle(true);
    setEditedArtifactTitle(selectedArtifact.title);
  }, [selectedArtifact.title]);

  // Handle clicking outside of input field
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (artifactTitleInputRef.current && !artifactTitleInputRef.current.contains(event.target as Node)) {
      handleSaveArtifactTitle();
    }
  }, [handleSaveArtifactTitle]);

  // Setup click outside listener
  useEffect(() => {
    if (isEditingArtifactTitle) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditingArtifactTitle, handleClickOutside]);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [demoScriptActive, setDemoScriptActive] = useState(false);
  const batchAddColumnsRef = useRef<((cols: { title: string; query: string; type: string }[]) => void) | null>(null);

  const DEMO_SCRIPT = useRef([
    {
      role: "assistant" as const,
      text: "To help you get started, can you tell me what you are planning to accomplish?",
    },
    {
      role: "assistant" as const,
      text: "I found 24 documents that contain change of control provisions. I can help you identify the key terms that vary significantly across the agreements, and find the patterns of the termination clauses. Should I go ahead with this plan?",
    },
    {
      role: "assistant" as const,
      text: "Perfect, I'll go ahead and generate a comprehensive analysis for you.",
    },
  ]);

  const handleScriptComplete = useCallback(() => {
    setDemoScriptActive(false);

    setTimeout(() => {
      if (batchAddColumnsRef.current) {
        batchAddColumnsRef.current([
          { title: "Change of Control", query: "What are the change of control provisions?", type: "text" },
          { title: "Key Terms", query: "What are the key terms and conditions?", type: "text" },
          { title: "Termination Clause", query: "What are the termination clauses and patterns?", type: "text" },
          { title: "Effective Date", query: "What is the effective date?", type: "date" },
          { title: "Parties", query: "Who are the parties involved?", type: "text" },
          { title: "Governing Law", query: "What is the governing law or jurisdiction?", type: "text" },
        ]);
      }
    }, 600);
  }, []);

  const hasTriggeredDemoRef = useRef(false);

  // Auto-open chat panel and voice mode after files are added
  useEffect(() => {
    if (selectedFiles.length > 0 && !hasTriggeredDemoRef.current) {
      hasTriggeredDemoRef.current = true;
      const timer = setTimeout(() => {
        setChatOpen(true);
        setTimeout(() => {
          setVoiceMode(true);
          setDemoScriptActive(true);
        }, 500);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedFiles.length]);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id;
    setActiveChatIdState(id);
  }, []);

  const activeChat = chatThreads.find(c => c.id === activeChatId);
  const chatMessages = activeChat?.messages || [];
  const isChatLoading = activeChat?.isLoading || false;
  const isInChatMode = chatThreads.length > 0;

  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setChatThreads(prev => prev.map(chat => 
      chat.id === chatId ? updater(chat) : chat
    ));
  }, []);

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

  // Scroll helpers
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

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
    return () => { if (container) container.removeEventListener('scroll', handleScroll); };
  }, []);

  useEffect(() => {
    if (isNearBottom && chatMessages.length > 0) {
      const timeoutId = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [chatMessages, isNearBottom, scrollToBottom]);

  // Generate a contextual response for review table context
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('column') || lowerQuery.includes('add')) {
      return "I can help you add columns to your review table. Based on common review patterns, I'd suggest adding columns like:\n\n1. **Key Terms** - Extract important terms from each document\n2. **Effective Date** - When each agreement takes effect\n3. **Parties** - The parties involved in each document\n4. **Governing Law** - Applicable jurisdiction\n\nWould you like me to add any of these columns, or do you have specific fields in mind?";
    } else if (lowerQuery.includes('extract') || lowerQuery.includes('review')) {
      return "I'll analyze the uploaded files and extract the relevant data for your review table. This typically includes identifying key clauses, dates, parties, and obligations across all documents.\n\nWould you like me to start with a standard extraction template, or do you have specific fields you'd like me to focus on?";
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference')) {
      return "I can create a comparison view highlighting differences across your documents. This is useful for identifying inconsistencies in terms, obligations, or risk areas.\n\nWhat specific aspects would you like me to compare?";
    }
    return `I'm ready to help with your review table. I can add columns, extract data from your documents, or help you analyze the results. What would you like to do?`;
  };

  // Send message
  const sendMessage = useCallback((messageText?: string) => {
    const text = messageText || chatInputValue;
    if (!text.trim() || isChatLoading) return;
    
    const chatId = ensureChatExists();
    const title = text.length > 40 ? text.substring(0, 40) + '...' : text;
    
    const userMessage: Message = { role: 'user', content: text, type: 'text' };
    const thinkingContent = getThinkingContent();
    const assistantMessage: Message = {
      role: 'assistant', content: '', type: 'text', isLoading: true,
      thinkingContent, loadingState: { showSummary: false, visibleBullets: 0 }
    };
    
    updateChatById(chatId, chat => ({
      ...chat, isLoading: true,
      title: chat.messages.length === 0 ? title : chat.title,
      messages: [...chat.messages, userMessage, assistantMessage]
    }));
    
    setChatInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = '20px';
    setTimeout(() => scrollToBottom(), 50);
    
    // Progressive reveal
    setTimeout(() => {
      updateChatById(chatId, chat => ({
        ...chat,
        messages: chat.messages.map((msg, idx) => 
          idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading
            ? { ...msg, loadingState: { ...msg.loadingState!, showSummary: true } } : msg
        )
      }));
      scrollToBottom();
    }, 600);
    
    thinkingContent.bullets.forEach((_, bulletIdx) => {
      setTimeout(() => {
        updateChatById(chatId, chat => ({
          ...chat,
          messages: chat.messages.map((msg, idx) => 
            idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading
              ? { ...msg, loadingState: { ...msg.loadingState!, visibleBullets: bulletIdx + 1 } } : msg
          )
        }));
        scrollToBottom();
      }, 1000 + (bulletIdx * 400));
    });
    
    setTimeout(() => {
      updateChatById(chatId, chat => ({
        ...chat, isLoading: false,
        messages: chat.messages.map((msg, idx) => {
          if (idx === chat.messages.length - 1 && msg.role === 'assistant' && msg.isLoading) {
            return { ...msg, content: generateResponse(text), isLoading: false };
          }
          return msg;
        })
      }));
      setTimeout(() => scrollToBottom(), 100);
    }, 2500);
  }, [chatInputValue, isChatLoading, ensureChatExists, updateChatById, scrollToBottom]);

  const handleToggleChat = () => {
    setChatOpen(prev => !prev);
  };

  const handleClose = () => {
    // Navigate back to assistant page or show a message
    window.history.back();
  };

  const handleFilesSelected = (files: SelectedFile[]) => {
    setSelectedFiles(files);
    // Update subtitle to show file count
    setSelectedArtifact(prev => ({
      ...prev,
      subtitle: `${files.length} ${files.length === 1 ? 'file' : 'files'}`
    }));
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <SidebarInset className="flex-1">
        <div className="h-screen flex">
          {/* Chat Panel - Left Side */}
          <AnimatePresence mode="wait">
            {chatOpen && (
              <>
                <motion.div
                  ref={chatPanelRef}
                  key="chat-panel"
                  className="flex flex-col bg-bg-base overflow-hidden w-[401px] flex-shrink-0"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 401, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{
                    width: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.15, ease: "easeOut" }
                  }}
                >
                  {/* Chat Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border-base" style={{ height: '52px' }}>
                    <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 max-w-[calc(100%-48px)]" style={{ flexWrap: 'nowrap' }}>
                      {chatThreads.length === 0 ? (
                        <span className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          New chat
                        </span>
                      ) : (
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={createNewChat}
                            className="h-7 w-7 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle transition-colors flex-shrink-0 text-fg-subtle hover:text-fg-base"
                          >
                            <Plus size={16} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>New chat</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {voiceMode ? (
                    <VoiceMode
                      onClose={() => {
                        setVoiceMode(false);
                        setDemoScriptActive(false);
                      }}
                      script={demoScriptActive ? DEMO_SCRIPT.current : undefined}
                      onScriptComplete={demoScriptActive ? handleScriptComplete : undefined}
                    />
                  ) : (
                  <>
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
                          /* Zero State */
                          <div className="flex flex-col items-center justify-center gap-6 py-3">
                            <div className="w-full max-w-[624px] px-3 flex flex-col gap-0.5">
                              <h1 className="text-[18px] font-medium leading-[24px] tracking-[-0.3px] text-fg-base">
                                Welcome to Review
                              </h1>
                              <p className="text-sm leading-5 text-fg-subtle">
                                Ask Harvey to help build your review table or add columns.
                              </p>
                            </div>
                            <div className="w-full max-w-[624px] flex flex-col">
                              <div className="px-3 pb-3">
                                <p className="text-xs leading-4 text-fg-muted">Get started…</p>
                              </div>
                              <div className="flex flex-col">
                                <button
                                  onClick={() => sendMessage("Add columns for key terms, effective date, and parties")}
                                  disabled={isChatLoading}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                  <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                  <span className="text-sm leading-5 text-fg-subtle">Add standard review columns</span>
                                </button>
                                <div className="h-px bg-border-base mx-3" />
                                <button
                                  onClick={() => sendMessage("Extract key clauses from all uploaded documents")}
                                  disabled={isChatLoading}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                  <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                  <span className="text-sm leading-5 text-fg-subtle">Extract key clauses</span>
                                </button>
                                <div className="h-px bg-border-base mx-3" />
                                <button
                                  onClick={() => sendMessage("Compare terms across all documents and highlight differences")}
                                  disabled={isChatLoading}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                  <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                  <span className="text-sm leading-5 text-fg-subtle">Compare document terms</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Messages */
                          chatMessages.map((message, index) => (
                            <div key={index} className={`${index !== chatMessages.length - 1 ? 'mb-6' : ''}`}>
                              {message.role === 'user' && (
                                <div className="flex flex-col gap-2 items-end pl-[68px]">
                                  <div className="bg-bg-subtle px-4 py-3 rounded-[12px]">
                                    <div className="text-sm text-fg-base leading-5">{message.content}</div>
                                  </div>
                                  <div className="flex items-center justify-end">
                                    <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                      <Copy className="w-3 h-3" />Copy
                                    </button>
                                    <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                      <ListPlus className="w-3 h-3" />Save prompt
                                    </button>
                                    <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5">
                                      <SquarePen className="w-3 h-3" />Edit query
                                    </button>
                                  </div>
                                </div>
                              )}
                              {message.role === 'assistant' && (
                                <div className="flex-1 min-w-0">
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
                                  {!message.isLoading && message.content && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                      >
                                        <div className="text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap">{message.content}</div>
                                        <div className="flex items-center justify-between mt-3">
                                          <div className="flex items-center">
                                            <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                                            <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Download className="w-3 h-3" />Export</button>
                                            <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><RotateCcw className="w-3 h-3" />Rewrite</button>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsUp className="w-3 h-3" /></button>
                                            <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsDown className="w-3 h-3" /></button>
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
                  
                  {/* Chat Input */}
                  <div className="px-5 pb-5 relative z-20 bg-bg-base">
                    <div className="mx-auto" style={{ maxWidth: '732px' }}>
                      <div className="bg-bg-subtle border border-border-base rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong shadow-sm">
                        <div className="p-[10px] flex flex-col gap-[10px]">
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
                                  if (e.key === 'Enter' && !e.shiftKey && !isChatLoading) {
                                    e.preventDefault();
                                    sendMessage();
                                  }
                                }}
                                onFocus={() => setIsChatInputFocused(true)}
                                onBlur={() => setIsChatInputFocused(false)}
                                disabled={isChatLoading}
                                className="w-full bg-transparent focus:outline-none text-fg-base placeholder-fg-muted resize-none overflow-hidden disabled:opacity-50"
                                style={{ fontSize: '14px', lineHeight: '20px', height: '20px', minHeight: '20px', maxHeight: '300px' }}
                              />
                              {!chatInputValue && !isChatInputFocused && (
                                <div className="absolute inset-0 pointer-events-none text-fg-muted flex items-start" style={{ fontSize: '14px', lineHeight: '20px' }}>
                                  <TextLoop interval={3000}>
                                    <span>Add columns for key terms and dates…</span>
                                    <span>Extract clauses from all documents…</span>
                                    <span>Compare terms across agreements…</span>
                                    <span>Summarize each document&apos;s obligations…</span>
                                  </TextLoop>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
                            {isChatLoading ? (
                              <button disabled className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] cursor-not-allowed">
                                <Spinner size="sm" />
                              </button>
                            ) : chatInputValue.trim() ? (
                              <button onClick={() => sendMessage()} className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] hover:bg-button-inverted-hover transition-all">
                                <CornerDownLeft size={16} />
                              </button>
                            ) : (
                              <button onClick={() => setVoiceMode(true)} className="h-[28px] px-[8px] flex items-center justify-center bg-bg-subtle-hover rounded-[6px] hover:bg-bg-subtle-pressed transition-all">
                                <AudioLines size={16} className="text-fg-base" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                </motion.div>
                
                {/* Separator */}
                <motion.div 
                  key="chat-separator"
                  className="w-px bg-border-base flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Review Table Panel */}
          <ReviewArtifactPanel
            selectedArtifact={selectedArtifact}
            isEditingArtifactTitle={isEditingArtifactTitle}
            editedArtifactTitle={editedArtifactTitle}
            onEditedArtifactTitleChange={setEditedArtifactTitle}
            onStartEditingTitle={handleStartEditingTitle}
            onSaveTitle={handleSaveArtifactTitle}
            onClose={handleClose}
            chatOpen={chatOpen}
            onToggleChat={handleToggleChat}
            shareArtifactDialogOpen={shareArtifactDialogOpen}
            onShareArtifactDialogOpenChange={setShareArtifactDialogOpen}
            exportReviewDialogOpen={exportReviewDialogOpen}
            onExportReviewDialogOpenChange={setExportReviewDialogOpen}
            artifactTitleInputRef={artifactTitleInputRef}
            isEmpty={isEmpty}
            showBackButton={true}
            selectedFiles={selectedFiles}
            onFilesSelected={handleFilesSelected}
            batchAddColumnsRef={batchAddColumnsRef}
          />
        </div>
      </SidebarInset>

      {/* Dialogs */}
      <ShareArtifactDialog 
        isOpen={shareArtifactDialogOpen} 
        onClose={() => setShareArtifactDialogOpen(false)} 
        artifactTitle={selectedArtifact.title}
      />
      <ExportReviewDialog 
        isOpen={exportReviewDialogOpen} 
        onClose={() => setExportReviewDialogOpen(false)} 
        artifactTitle={selectedArtifact.title}
      />
    </div>
  );
}

