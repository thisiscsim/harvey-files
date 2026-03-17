"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Maximize2, ChevronRight, RotateCcw, Brain } from "lucide-react";
import { SvgIcon } from "@/components/svg-icon";
import { TextShimmer } from "../../components/motion-primitives/text-shimmer";

interface ReviewNudgeProps {
  userQuery: string;
  onSelectThread: () => void;
  onSelectReviewTable: () => void;
}

// ── Left card preview content (matches the legal-analysis response) ──

const PREVIEW_PARAGRAPHS = [
  { type: "p" as const, text: "The entitlement of a commercial tenant to self-help rights depends on the jurisdiction and the specific circumstances of the case. Below is an analysis based on federal principles, state laws, and relevant case law:" },
  { type: "h3" as const, text: "Federal and General Principles" },
  { type: "p" as const, text: "Under federal law and general principles, there is no inherent right for a commercial tenant to engage in self-help. Instead, the remedies available to tenants are typically governed by statutory frameworks or common law principles, which vary by jurisdiction." },
  { type: "h3" as const, text: "Jurisdictional Analysis" },
  { type: "h4" as const, text: "New York" },
  { type: "p" as const, text: "In New York, the focus is primarily on the landlord's right to self-help rather than the tenant's. Case law such as Sol De Ibiza, LLC v. Panjo Realty, Inc., 911 N.Y.S.2d 567 (App. Term 2010) confirms that landlords may utilize self-help to regain possession of commercial premises under specific conditions." },
];

// Flatten into words for streaming
const ALL_WORDS = PREVIEW_PARAGRAPHS.flatMap((block) =>
  block.text.split(" ").map((w) => ({ word: w, blockType: block.type }))
);

// ── Right card preview content (matches review artifact panel) ──

// TypeIcon matching the actual review-artifact-panel.tsx TypeIcon
const TypeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-fg-muted shrink-0">
    <path d="M3 4.5V3H9M9 3H15V4.5M9 3V15M9 15H7.5M9 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// SelectionIcon matching the actual review-artifact-panel.tsx SelectionIcon
const SelectionIcon = () => (
  <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-fg-muted shrink-0">
    <path d="M5.65721 7.12331L6.50096 7.68585L7.9047 5.81418M10.5434 6.75H12.0434M10.5 11.25H12M5.65721 11.6242L6.50096 12.1867L7.9047 10.315M3.75 15H14.25C14.6642 15 15 14.6642 15 14.25V3.75C15 3.33579 14.6642 3 14.25 3H3.75C3.33579 3 3 3.33579 3 3.75V14.25C3 14.6642 3.33579 15 3.75 15Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TABLE_COLUMNS = [
  { header: "Agreement Parties", icon: "type" as const },
  { header: "Force Majeure Clause Reference", icon: "selection" as const },
  { header: "Assignment Provision Summary", icon: "type" as const },
];

type CellState = "loading" | "loaded";

const TABLE_ROWS: { cells: { text: string; isBadge?: boolean }[] }[] = [
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "The document references multiple related agreements including the Side Letter\u2026" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "Yes \u2014 subject to customary conditions precedent including regulatory approval\u2026" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "N/A", isBadge: true }, { text: "No applicable provision identified after reviewing all sections of the agreement" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "Per Section 9.1, the agreement may be terminated by either party upon 30 days\u2026" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "The document references multiple related agreements including the Side Letter\u2026" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "N/A", isBadge: true }, { text: "Yes \u2014 subject to customary conditions precedent including regulatory approval\u2026" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "No applicable provision identified after reviewing all sections of the agreement" }] },
  { cells: [{ text: "The document does not outline negotiation as\u2026" }, { text: "Disputed", isBadge: true }, { text: "Per Section 9.1, the agreement may be terminated by either party upon 30 days\u2026" }] },
];

export default function ReviewNudge({
  userQuery,
  onSelectThread,
  onSelectReviewTable,
}: ReviewNudgeProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [visibleWords, setVisibleWords] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  // Track per-row generation state: which rows have finished generating
  const [cellStates, setCellStates] = useState<CellState[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Left card
    timers.push(setTimeout(() => setShowThinking(true), 400));
    const wordInterval = 25;
    for (let i = 1; i <= ALL_WORDS.length; i++) {
      timers.push(setTimeout(() => setVisibleWords(i), 600 + i * wordInterval));
    }

    // Right card: rows appear, then cells "generate" one by one
    for (let i = 0; i < TABLE_ROWS.length; i++) {
      // Show row in loading state
      timers.push(setTimeout(() => {
        setVisibleRows((v) => v + 1);
        setCellStates((prev) => [...prev, "loading"]);
      }, 300 + i * 200));

      // Transition row from loading → loaded (staggered)
      timers.push(setTimeout(() => {
        setCellStates((prev) => {
          const next = [...prev];
          next[i] = "loaded";
          return next;
        });
      }, 1200 + i * 350));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  // Build the visible paragraph blocks from the word stream
  const getVisibleBlocks = useCallback(() => {
    const visibleSlice = ALL_WORDS.slice(0, visibleWords);
    const blocks: { type: "p" | "h3" | "h4"; text: string }[] = [];
    let currentType: "p" | "h3" | "h4" = "p";
    let currentWords: string[] = [];

    for (const { word, blockType } of visibleSlice) {
      if (blockType !== currentType && currentWords.length > 0) {
        blocks.push({ type: currentType, text: currentWords.join(" ") });
        currentWords = [];
      }
      currentType = blockType;
      currentWords.push(word);
    }
    if (currentWords.length > 0) {
      blocks.push({ type: currentType, text: currentWords.join(" ") });
    }
    return blocks;
  }, [visibleWords]);

  const visibleBlocks = getVisibleBlocks();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-4"
    >
      <div
        className="flex mx-auto"
        style={{ width: "1100px", height: "420px", gap: "12px", marginLeft: "calc((100% - 1100px) / 2)" }}
      >
        {/* ── Left card: Continue in thread ── */}
        <motion.button
          onClick={onSelectThread}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 min-w-0 h-full rounded-lg overflow-hidden hover:border-ui-blue-border transition-colors text-left group cursor-pointer flex flex-col"
          style={{ border: "1.5px solid var(--border-base)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ui-blue-border)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-base)"; }}
        >
          <div className="flex items-center justify-between flex-shrink-0 border-b border-border-base bg-bg-base" style={{ paddingLeft: "12px", paddingRight: "8px", paddingTop: "8px", paddingBottom: "8px" }}>
            <div className="flex items-center gap-[6px]">
              <SvgIcon src="/central_icons/Assistant.svg" alt="Thread" width={14} height={14} className="text-fg-base" />
              <span className="text-xs font-medium text-fg-base">Continue in thread</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                <RotateCcw size={14} className="text-fg-muted" />
              </div>
              <div className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                <Maximize2 size={14} className="text-fg-muted" />
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden bg-bg-base">
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden hide-scrollbar pb-16">
              {/* User message — right-aligned bubble (matches chat page) */}
              <div className="flex justify-end px-4 pt-4">
                <div className="bg-bg-subtle px-4 py-3 rounded-[12px] max-w-[85%]">
                  <p className="text-sm text-fg-base leading-5 line-clamp-3">{userQuery}</p>
                </div>
              </div>

              {/* Harvey response area — left-aligned, same layout as actual chat thread */}
              <div className="px-4 pt-4">
                {/* Thinking state — pl-2 matches ThinkingState component internal padding */}
                {showThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="pl-2 mb-1">
                    <div className="inline-flex items-center gap-1.5 text-[13px] leading-5 text-fg-subtle">
                      <Brain className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">Thought for 6s</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </div>
                  </motion.div>
                )}

                {/* Response text — pl-2 matches assistant message content in chat thread */}
                <div className="pl-2 space-y-4 text-fg-base leading-relaxed" style={{ fontSize: "14px", lineHeight: "22px" }}>
                  {visibleBlocks.map((block, i) => {
                    if (block.type === "h3") return <h3 key={i} className="text-base font-semibold">{block.text}</h3>;
                    if (block.type === "h4") return <h4 key={i} className="text-sm font-semibold mt-1">{block.text}</h4>;
                    return <p key={i}>{block.text}</p>;
                  })}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-8 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, var(--bg-base), transparent)" }} />
            <div className="absolute inset-x-0 bottom-px h-16 pointer-events-none z-10" style={{ background: "linear-gradient(to top, var(--bg-base), transparent)" }} />
          </div>
        </motion.button>

        {/* ── Right card: Use research tool ── */}
        <motion.button
          onClick={onSelectReviewTable}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 min-w-0 h-full rounded-lg overflow-hidden hover:border-ui-blue-border transition-colors text-left group cursor-pointer flex flex-col"
          style={{ border: "1.5px solid var(--border-base)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ui-blue-border)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-base)"; }}
        >
          <div className="flex items-center justify-between flex-shrink-0 border-b border-border-base bg-bg-base" style={{ paddingLeft: "12px", paddingRight: "8px", paddingTop: "8px", paddingBottom: "8px" }}>
            <div className="flex items-center gap-[6px]">
              <SvgIcon src="/central_icons/Review.svg" alt="Review" width={14} height={14} className="text-fg-base" />
              <span className="text-xs font-medium text-fg-base">Use research tool</span>
              <span className="px-1 rounded-[4px] text-[10px] font-medium leading-[14px]" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                Suggested
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                <RotateCcw size={14} className="text-fg-muted" />
              </div>
              <div className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle-hover transition-colors">
                <Maximize2 size={14} className="text-fg-muted" />
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden bg-bg-base">
            <table className="w-full" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "35%" }} />
              </colgroup>
              <thead>
                <tr>
                  {TABLE_COLUMNS.map((col, i) => (
                    <th
                      key={i}
                      className="px-3 text-left font-medium text-fg-subtle bg-bg-base border-b border-border-base overflow-hidden"
                      style={{
                        fontSize: "12px",
                        lineHeight: "16px",
                        height: "32px",
                        borderLeft: i > 0 ? "1px solid var(--border-base)" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1 h-4">
                        {col.icon === "selection" ? <SelectionIcon /> : <TypeIcon />}
                        <span className="truncate">{col.header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.slice(0, visibleRows).map((row, ri) => {
                  const state = cellStates[ri] || "loading";
                  return (
                    <motion.tr key={ri} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 bg-bg-base border-b border-border-base overflow-hidden"
                          style={{
                            fontSize: "12px",
                            lineHeight: "16px",
                            height: "32px",
                            borderLeft: ci > 0 ? "1px solid var(--border-base)" : undefined,
                          }}
                        >
                          {state === "loading" ? (
                            <div className="flex items-center justify-between">
                              <div style={{ minWidth: "100px", whiteSpace: "nowrap" }}>
                                <TextShimmer duration={1.5} spread={2}>Generating output...</TextShimmer>
                              </div>
                              <div className="relative flex items-center justify-center ml-2">
                                <motion.div
                                  className="w-3 h-3 bg-fg-disabled rounded-full"
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div className="absolute w-1.5 h-1.5 bg-fg-base rounded-full" />
                              </div>
                            </div>
                          ) : cell.isBadge ? (
                            <span className="inline-block px-2 py-1 rounded-[6px] bg-bg-subtle border border-border-base text-fg-base whitespace-nowrap">
                              {cell.text}
                            </span>
                          ) : (
                            <span className="text-fg-base truncate block">{cell.text}</span>
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
                {/* Ghost rows to suggest more output */}
                {Array.from({ length: 4 }).map((_, gi) => (
                  <tr key={`ghost-${gi}`}>
                    {TABLE_COLUMNS.map((_, ci) => (
                      <td
                        key={ci}
                        className="px-3 bg-bg-base border-b border-border-base"
                        style={{
                          height: "32px",
                          borderLeft: ci > 0 ? "1px solid var(--border-base)" : undefined,
                        }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="absolute inset-x-0 bottom-px h-16 pointer-events-none" style={{ background: "linear-gradient(to top, var(--bg-base), transparent)" }} />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
