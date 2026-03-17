"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TextShimmer } from "../../components/motion-primitives/text-shimmer";

type ThinkingVariant = "analysis" | "draft" | "review";

export interface ThinkingStateProps {
  variant: ThinkingVariant;
  title?: string;
  durationSeconds?: number;
  /**
   * Optional summary text shown at the top of the expanded area
   */
  summary?: string;
  /**
   * Optional bullet list to render inside the expanded area
   */
  bullets?: string[];
  /**
   * Optional additional text to show after bullets
   */
  additionalText?: string;
  /**
   * Optional custom content to render instead of bullets/additionalText
   */
  customContent?: React.ReactNode;
  /**
   * If true, the component starts expanded
   */
  defaultOpen?: boolean;
  /**
   * Optional timing data for tooltip
   */
  timingData?: {
    model?: string;
    date?: string;
    timestamp?: string;
    responseTime?: string;
  };
  /**
   * If true, this is a child thinking state that cannot be collapsed
   */
  isChild?: boolean;
  /**
   * Optional child thinking states to render within this one
   */
  childStates?: ThinkingStateProps[];
  /**
   * If true, shows a pulsing animation on the icon
   */
  isLoading?: boolean;
  /**
   * Optional custom icon component to use instead of variant-based icon
   */
  icon?: React.ComponentType<{ className?: string }>;
}

function getVariantIcon(isLoading?: boolean, IconComponent?: React.ComponentType<{ className?: string }>) {
  // Use custom icon if provided, otherwise default to brain icon
  if (IconComponent) {
    return (
      <IconComponent 
        className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} 
      />
    );
  }
  return (
    <Brain 
      className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} 
    />
  );
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Compact, reusable expandable block that surfaces the AI's high-level
 * thinking. Appears above an assistant message, aligned with the message
 * content area (to the right of the avatar).
 */
export default function ThinkingState({
  title = "Thought",
  durationSeconds,
  summary,
  bullets,
  additionalText,
  customContent,
  defaultOpen = false,
  timingData = {
    model: "Claude 4 Sonnet",
    date: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }),
    timestamp: new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }),
    responseTime: "6.987s"
  },
  isChild = false,
  childStates = [],
  isLoading = false,
  icon: IconComponent,
}: ThinkingStateProps) {
  // When loading, always show expanded, otherwise use defaultOpen
  const [open, setOpen] = useState<boolean>(isLoading || defaultOpen || isChild);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Handle open state based on loading
  useEffect(() => {
    if (isLoading) {
      // Always open when loading
      setOpen(true);
    } else if (!isChild && defaultOpen === false) {
      // Give a small delay before collapsing to show the final state
      const timer = setTimeout(() => {
        setOpen(false);
      }, 800); // Slightly longer delay to see the complete state
      return () => clearTimeout(timer);
    }
  }, [isLoading, defaultOpen, isChild]);

  const headerLabel = isChild ? title : `${title}${durationSeconds ? ` for ${formatDuration(durationSeconds)}` : ""}`;

  return (
    <div className={`${open && !isChild ? 'mb-4' : 'mb-1'} ${!isChild ? 'pl-2' : 'pl-0'}`}>
      <button
        type="button"
        onClick={isChild ? undefined : () => setOpen(!open)}
        onMouseEnter={isChild ? undefined : () => setIsHovered(true)}
        onMouseLeave={isChild ? undefined : () => setIsHovered(false)}
        className={`w-full flex items-start gap-1.5 text-[13px] leading-5 text-fg-subtle py-0 ${!isChild ? 'hover:opacity-80 transition-opacity cursor-pointer px-0' : 'cursor-default px-0'}`}
      >
        <span className="relative flex items-center justify-center text-fg-subtle mt-0.5 w-3.5 h-3.5">
          {isChild ? (
            // Child states always show their variant icon
            getVariantIcon(isLoading, IconComponent)
          ) : (
            // Parent states have animated icon transitions
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="chevron-down"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              ) : isHovered ? (
                <motion.div
                  key="chevron-right"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <motion.div
                  key="variant-icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {getVariantIcon(isLoading, IconComponent)}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </span>
        <div className="flex-1 text-left">
          {isChild ? (
            // Child states don't have tooltips
            isLoading ? (
              <TextShimmer 
                duration={1.5} 
                spread={3}
              >
                {headerLabel}
              </TextShimmer>
            ) : (
              <span className="font-medium truncate inline-block">
                {headerLabel}
              </span>
            )
          ) : (
            // Parent states have tooltips
            <Tooltip>
              <TooltipTrigger asChild>
                {isLoading ? (
                  <span className="inline-block w-fit">
                    <TextShimmer 
                      duration={1.5} 
                      spread={3}
                    >
                      {headerLabel}
                    </TextShimmer>
                  </span>
                ) : (
                  <span className="font-medium truncate inline-block">
                    {headerLabel}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                align="center"
                sideOffset={8}
                className="bg-bg-base border border-border-base text-fg-subtle px-3 py-2 shadow-xs"
              >
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-8">
                  <span className="text-fg-subtle">Model:</span>
                  <span className="text-fg-base">{timingData.model}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-fg-subtle">Date:</span>
                  <span className="text-fg-base">{timingData.date}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-fg-subtle">Timestamp:</span>
                  <span className="text-fg-base">{timingData.timestamp}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-fg-subtle">Response time:</span>
                  <span className="text-fg-base">{timingData.responseTime}</span>
                </div>
              </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={isChild ? undefined : { height: 0, opacity: 0 }}
            animate={isChild ? undefined : { height: "auto", opacity: 1 }}
            exit={isChild ? undefined : { height: 0, opacity: 0 }}
            transition={isChild ? undefined : { duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden relative"
          >
            {/* Vertical line from chevron */}
            <div 
              className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-fg-disabled/20"
              style={{ marginBottom: '-1px' }}
            />
            <div className="mt-1 pl-6 text-[13px] leading-5 text-fg-subtle space-y-2">
              <AnimatePresence mode="wait">
                {summary && (
                  <motion.p
                    key="summary"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {summary}
                  </motion.p>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {bullets && bullets.length > 0 && (
                  <motion.ul 
                    className="list-disc pl-4 space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {bullets.map((item, idx) => (
                        <motion.li 
                          key={`bullet-${idx}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ 
                            duration: 0.3, 
                            ease: "easeOut",
                            delay: idx * 0.05 // Stagger bullets slightly
                          }}
                        >
                          {item}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {additionalText && (
                  <motion.p 
                    key="additional"
                    className="whitespace-pre-wrap"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {additionalText}
                  </motion.p>
                )}
              </AnimatePresence>
              
              {/* Custom content */}
              <AnimatePresence>
                {customContent && (
                  <motion.div
                    key="custom-content"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {customContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Render child thinking states at the same level */}
      <AnimatePresence>
        {open && !isChild && childStates && childStates.length > 0 && (
          <motion.div 
            className="space-y-1 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="popLayout">
              {childStates.map((child, idx) => (
                <motion.div
                  key={`child-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    delay: idx * 0.1 // Stagger child states
                  }}
                >
                  <ThinkingState
                    {...child}
                    isChild={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


