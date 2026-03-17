"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, Download, RotateCcw, ThumbsUp, ThumbsDown, 
  ListPlus, SquarePen, FileSearch, LoaderCircle,
  LucideIcon
} from "lucide-react";
import Image from "next/image";
import ThinkingState from "@/components/thinking-state";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

// Types for message content patterns
export type ThinkingStep = {
  thinkingTitle: string;
  thinkingContent: string;
  response: string;
  durationSeconds?: number;
  buttons?: Array<{
    label: string;
    onClick?: () => void;
  }>;
};

export type FileChip = {
  name: string;
  type: 'pdf' | 'docx' | 'spreadsheet' | 'folder' | 'text';
};

export type FileReviewContent = {
  summary: string;
  files: FileChip[];
  totalFiles: number;
};

export type ArtifactData = {
  title: string;
  subtitle: string;
  variant?: 'review' | 'draft';
};

export type ThinkingContent = {
  summary: string;
  bullets?: string[];
};

export type ThinkingLoadingState = {
  showSummary: boolean;
  visibleBullets: number;
};

export type ResearchFlowLoadingState = {
  currentStep: number;
  isThinking: boolean;
  showResponse: boolean;
};

export type FileReviewLoadingState = {
  isLoading: boolean;
  loadedFiles: number;
};

// Main message props
export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  isLoading?: boolean;
  
  // Pattern toggles
  showThinking?: boolean;
  showFileReview?: boolean;
  showActionButtons?: boolean;
  showUserActions?: boolean;
  
  // Thinking state (single)
  thinkingContent?: ThinkingContent;
  thinkingLoadingState?: ThinkingLoadingState;
  thinkingVariant?: 'analysis' | 'draft' | 'review';
  
  // Multi-step research flow
  researchFlowSteps?: ThinkingStep[];
  researchFlowLoadingState?: ResearchFlowLoadingState;
  
  // File review pattern
  fileReviewContent?: FileReviewContent;
  fileReviewLoadingState?: FileReviewLoadingState;
  
  // Artifact pattern
  artifactData?: ArtifactData;
  artifactContent?: ReactNode;
  
  // Workflow response buttons
  workflowButtons?: ReactNode;
  
  // Custom content after main content
  customContent?: ReactNode;
  
  // Callbacks
  onCopy?: () => void;
  onExport?: () => void;
  onRewrite?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onSavePrompt?: () => void;
  onEditQuery?: () => void;
}

// Action buttons component
function MessageActionButtons({ 
  onCopy, 
  onExport, 
  onRewrite, 
  onThumbsUp, 
  onThumbsDown 
}: {
  onCopy?: () => void;
  onExport?: () => void;
  onRewrite?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center">
        <button 
          onClick={onCopy}
          className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
        >
          <Copy className="w-3 h-3" />Copy
        </button>
        <button 
          onClick={onExport}
          className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
        >
          <Download className="w-3 h-3" />Export
        </button>
        <button 
          onClick={onRewrite}
          className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />Rewrite
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onThumbsUp}
          className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button 
          onClick={onThumbsDown}
          className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// User action buttons component
function UserActionButtons({
  onCopy,
  onSavePrompt,
  onEditQuery
}: {
  onCopy?: () => void;
  onSavePrompt?: () => void;
  onEditQuery?: () => void;
}) {
  return (
    <div className="flex items-center mt-2">
      <button 
        onClick={onCopy}
        className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
      >
        <Copy className="w-3 h-3" />Copy
      </button>
      <button 
        onClick={onSavePrompt}
        className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
      >
        <ListPlus className="w-3 h-3" />Save prompt
      </button>
      <button 
        onClick={onEditQuery}
        className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"
      >
        <SquarePen className="w-3 h-3" />Edit query
      </button>
    </div>
  );
}

// File review thinking state
function FileReviewState({
  content,
  loadingState
}: {
  content: FileReviewContent;
  loadingState?: FileReviewLoadingState;
}) {
  const isLoading = loadingState?.isLoading ?? false;
  const loadedFiles = loadingState?.loadedFiles ?? content.files.length;
  
  return (
    <motion.div 
      className="mt-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <ThinkingState
        variant="analysis"
        title={isLoading ? "Reviewing files..." : "Reviewed all files"}
        durationSeconds={undefined}
        icon={FileSearch}
        summary={content.summary}
        customContent={
          <motion.div 
            className="mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex flex-wrap gap-2">
              {content.files.map((file, idx) => (
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
                    {isLoading && idx >= loadedFiles ? (
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
        isLoading={isLoading}
      />
    </motion.div>
  );
}

// Multi-step research flow
function ResearchFlowContent({
  steps,
  loadingState,
  isMessageLoading,
  onCopy,
  onExport,
  onRewrite,
  onThumbsUp,
  onThumbsDown
}: {
  steps: ThinkingStep[];
  loadingState: ResearchFlowLoadingState;
  isMessageLoading?: boolean;
  onCopy?: () => void;
  onExport?: () => void;
  onRewrite?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, stepIdx) => {
        const isCurrentStep = stepIdx === loadingState.currentStep;
        const isPastStep = stepIdx < loadingState.currentStep;
        const isFutureStep = stepIdx > loadingState.currentStep;
        
        // Don't render future steps
        if (isFutureStep) return null;
        
        const showThinking = isPastStep || isCurrentStep;
        const showResponse = isPastStep || (isCurrentStep && loadingState.showResponse);
        const isThinkingLoading = isCurrentStep && loadingState.isThinking;
        
        return (
          <div key={stepIdx} className="space-y-3">
            {/* Thinking State */}
            {showThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
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
            
                          {/* Response */}
                          {showResponse && step.response && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
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
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
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
      {!isMessageLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <MessageActionButtons 
            onCopy={onCopy}
            onExport={onExport}
            onRewrite={onRewrite}
            onThumbsUp={onThumbsUp}
            onThumbsDown={onThumbsDown}
          />
        </motion.div>
      )}
    </div>
  );
}

// Main ChatMessage component
export function ChatMessage({
  role,
  content,
  isLoading = false,
  showThinking = true,
  showFileReview = false,
  showActionButtons = true,
  showUserActions = true,
  thinkingContent,
  thinkingLoadingState,
  thinkingVariant = 'analysis',
  researchFlowSteps,
  researchFlowLoadingState,
  fileReviewContent,
  fileReviewLoadingState,
  artifactData,
  artifactContent,
  workflowButtons,
  customContent,
  onCopy,
  onExport,
  onRewrite,
  onThumbsUp,
  onThumbsDown,
  onSavePrompt,
  onEditQuery
}: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  const isUser = role === 'user';
  const hasResearchFlow = researchFlowSteps && researchFlowLoadingState;
  
  return (
    <div className="flex items-start space-x-1">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-6 h-6 bg-bg-base border border-border-base rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-fg-subtle">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center">
            <Image src="/harvey-avatar.svg" alt="Harvey" width={24} height={24} />
          </div>
        )}
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isAssistant && (
          <>
            {/* Research Flow - Multi-step inline thinking states */}
            {hasResearchFlow && (
              <ResearchFlowContent
                steps={researchFlowSteps}
                loadingState={researchFlowLoadingState}
                isMessageLoading={isLoading}
                onCopy={onCopy}
                onExport={onExport}
                onRewrite={onRewrite}
                onThumbsUp={onThumbsUp}
                onThumbsDown={onThumbsDown}
              />
            )}
            
            {/* Regular Thinking States (non-research flow) */}
            {!hasResearchFlow && showThinking && thinkingContent && (
              <>
                {isLoading && thinkingLoadingState ? (
                  <ThinkingState
                    variant={thinkingVariant}
                    title="Thinking..."
                    durationSeconds={undefined}
                    summary={thinkingLoadingState.showSummary ? thinkingContent.summary : undefined}
                    bullets={thinkingContent.bullets?.slice(0, thinkingLoadingState.visibleBullets)}
                    isLoading={true}
                  />
                ) : (
                  <ThinkingState
                    variant={thinkingVariant}
                    title="Thought"
                    durationSeconds={6}
                    summary={thinkingContent.summary}
                    bullets={thinkingContent.bullets}
                    defaultOpen={false}
                  />
                )}
              </>
            )}
            
            {/* Content (skip for research flow) */}
            {!hasResearchFlow && !isLoading && content && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Text content */}
                  <div className="text-sm text-fg-base leading-relaxed pl-2">
                    {content}
                  </div>
                  
                  {/* Artifact */}
                  {artifactContent && (
                    <div className="mt-3 pl-2">
                      {artifactContent}
                    </div>
                  )}
                  
                  {/* File Review */}
                  {showFileReview && fileReviewContent && (
                    <FileReviewState 
                      content={fileReviewContent}
                      loadingState={fileReviewLoadingState}
                    />
                  )}
                  
                  {/* Workflow Buttons */}
                  {workflowButtons && (
                    <div className="mt-4 pl-2">
                      {workflowButtons}
                    </div>
                  )}
                  
                  {/* Custom Content */}
                  {customContent && (
                    <div className="pl-2">
                      {customContent}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {showActionButtons && (
                    <MessageActionButtons 
                      onCopy={onCopy}
                      onExport={onExport}
                      onRewrite={onRewrite}
                      onThumbsUp={onThumbsUp}
                      onThumbsDown={onThumbsDown}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
        
        {/* User message content */}
        {isUser && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="text-sm text-fg-base leading-relaxed pl-2">
                {content}
              </div>
              {customContent && (
                <div className="pl-2">
                  {customContent}
                </div>
              )}
            </motion.div>
            
            {showUserActions && (
              <UserActionButtons
                onCopy={onCopy}
                onSavePrompt={onSavePrompt}
                onEditQuery={onEditQuery}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
