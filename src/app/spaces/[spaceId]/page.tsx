"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Users, MoreHorizontal,
  Paperclip, Scale, Mic, CornerDownLeft, Plus,
  Copy, Download, RotateCcw, ThumbsUp, ThumbsDown,
  ListPlus, SquarePen, X, Search, FileText, LoaderCircle, AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { SvgIcon } from "@/components/svg-icon";
import { TextLoop } from "../../../../components/motion-primitives/text-loop";
import ThinkingState from "@/components/thinking-state";
import Image from "next/image";
import ConfigurationDrawer from "@/components/configuration-drawer";
import type { DrawerSource } from "@/components/configuration-drawer";
import DraftArtifactPanel from "@/components/draft-artifact-panel";
import ReviewArtifactPanel from "@/components/review-artifact-panel";
import { ArtifactCard } from "@/components/artifact-card";
import ReviewTableArtifactCard from "@/components/review-table-artifact-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─── Panel animation ──────────────────────────────────────────────────


// ─── Tool call icon components for ThinkingState ──────────────────────
const ReadIcon = ({ className }: { className?: string }) => <SvgIcon src="/central_icons/Reading.svg" alt="Read" width={14} height={14} className={className} />;
const DraftIcon = ({ className }: { className?: string }) => <SvgIcon src="/central_icons/Draft.svg" alt="Draft" width={14} height={14} className={className} />;
const ReviewIcon = ({ className }: { className?: string }) => <SvgIcon src="/central_icons/Review.svg" alt="Review" width={14} height={14} className={className} />;

type SpaceType = "team" | "shared" | "personal";

// ─── Diligence workflow types ──────────────────────────────────────────
type ChecklistItem = { text: string; checked: boolean };

type ToolCallDef = {
  title: string;
  result: string;
  icon: "read" | "search" | "draft" | "analyze";
  pills?: { name: string; icon: "docx" | "pdf" | "folder" | "search" }[];
  durationMs: number;
};

type DiligenceStepState = {
  thinkingVisible: boolean;
  thinkingDone: boolean;
  visibleToolCalls: number;
  toolCallDone: boolean[];
  toolCallPillsLoaded: number[];
  showResponse: boolean;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text";
  isLoading?: boolean;
  thinkingContent?: { summary: string; bullets: string[] };
  loadingState?: { showSummary: boolean; visibleBullets: number };
  diligenceFlow?: { currentStep: number; stepStates: DiligenceStepState[] };
  checklist?: ChecklistItem[];
};

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
  agentState?: { isRunning: boolean; taskName: string; currentAction?: string; isAwaitingInput?: boolean };
}

const spacesData: Record<string, { name: string; createdBy: string; type: SpaceType; initials: string }> = {
  "crestonridge-equity-fund-v-formation": { name: "Crestonridge Equity Fund V Formation", createdBy: "Whitfield & Crane LLP", type: "team", initials: "WL" },
  "ma-due-diligence": { name: "M&A Due Diligence", createdBy: "Cross-Border Group", type: "shared", initials: "CB" },
  "client-deliverables": { name: "Client Deliverables", createdBy: "Litigation Practice", type: "shared", initials: "LP" },
  "research-and-memos": { name: "Research & Memos", createdBy: "Sarah Chen", type: "personal", initials: "SC" },
  "regulatory-filings": { name: "Regulatory Filings", createdBy: "Compliance Team", type: "team", initials: "CT" },
  "ip-portfolio-review": { name: "IP Portfolio Review", createdBy: "Patent Division", type: "shared", initials: "PD" },
  "contract-templates": { name: "Contract Templates", createdBy: "Standards Board", type: "team", initials: "SB" },
  "case-notes": { name: "Case Notes", createdBy: "Alex Rivera", type: "personal", initials: "AR" },
};

function getThinkingContent() {
  return {
    summary: "Analyzing the shared space content and context to provide a comprehensive response.",
    bullets: [
      "Reviewing available documents and resources",
      "Cross-referencing with relevant precedents",
      "Synthesizing findings into a clear summary",
    ],
  };
}

// ─── Diligence workflow step definitions ────────────────────────────────
interface StepDef {
  thinkingLabel: string;
  thinkingSummary: string;
  thinkingDurationMs: number;
  toolCalls: ToolCallDef[];
  agentAction: string;
  checklistUpdate?: boolean[];
}

const STEP_DEFS: StepDef[] = [
  // Step 0 — Understanding Request (~1.25s)
  { thinkingLabel: "Understanding request", thinkingSummary: "The user is asking me to do a first-pass review of LP comment letters for a Crestonridge Equity fund formation. This is substantial — I'll need to read every LP's markup against the draft LPA, understand what each LP is asking for, and figure out how the GP handled similar asks in their prior funds.", thinkingDurationMs: 1250, toolCalls: [], agentAction: "Understanding diligence request..." },
  // Step 1 — Creating Plan (~1.25s)
  { thinkingLabel: "Planning approach", thinkingSummary: "This is a substantial review — 74 LP comment letters, two prior fund precedent sets, and a GP preference note to factor in. I should generate a structured plan before starting to ensure comprehensive coverage and consistent disposition logic across all 74 memos.", thinkingDurationMs: 1250, toolCalls: [], agentAction: "Creating research plan..." },
  // Step 2 — Context Gathering (~11s)
  { thinkingLabel: "Gathering context", thinkingSummary: "Before I start reading comment letters, I need to pull context on this engagement — the review framework, the client matter details, the uploaded files, any internal communications about negotiation strategy, and the precedent library from prior funds.", thinkingDurationMs: 3000, toolCalls: [
    { title: "Read Fund Formation Review Playbook", result: "Loaded LP comment review framework: read each comment, map to LPA section, classify by type, cross-reference against prior fund precedent, assign recommended disposition.", icon: "read", durationMs: 1200 },
    { title: 'Search client matter: "Crestonridge Equity Partners"', result: "Found matter #22-0847-FF: Crestonridge Equity Partners Fund V, L.P. $2.5B target raise. GP entity: Crestonridge Equity Advisors LLC.", icon: "search", durationMs: 1500 },
    { title: "Search workspace: Crestonridge Equity Fund V", result: "Found 74 LP comment letters uploaded Feb 12, 2026. Mix of .docx redlines and PDF comment letters.", icon: "search", durationMs: 1500, pills: [{ name: "74 LP comment letters", icon: "docx" }, { name: "~2,400 pages total", icon: "docx" }] },
    { title: 'Search emails: "Crestonridge" OR "Fund V"', result: "Found 23 emails. Partner email from Sarah Chen (Feb 10): GP is more flexible on governance this round but wants to hold the line on economics.", icon: "search", durationMs: 1500 },
    { title: "Search precedent library: Crestonridge Equity prior funds", result: "Found Fund IV (2022, $1.8B) — executed LPA + 74 side letters. Found Fund III (2019, $1.2B) — executed LPA + 61 side letters.", icon: "search", durationMs: 1800, pills: [{ name: "Fund IV LPA (Executed)", icon: "docx" }, { name: "Fund IV Side Letters (74)", icon: "folder" }, { name: "Fund III LPA (Executed)", icon: "docx" }, { name: "Fund III Side Letters (61)", icon: "folder" }] },
  ], agentAction: "Gathering context on Crestonridge Equity..." },
  // Step 3 — Reading LP Comment Letters (~2.5s)
  { thinkingLabel: "Reading LP comment letters", thinkingSummary: "74 files to work through. I need to read each one carefully — some are full redlines of the LPA with tracked changes, others are comment letters organized by section. For each file I need to: identify the LP and their counsel, extract every discrete comment or markup, tag it to the relevant LPA section, and classify it by type.", thinkingDurationMs: 1000, toolCalls: [
    { title: "Reviewed all 74 LP comment letters", result: "74 files processed across ~2,400 pages. 2,847 discrete comments extracted and tagged to 16 LPA sections. Mix of .docx redlines and PDF comment letters.", icon: "read", durationMs: 1500, pills: [{ name: "UmberPension — Fund V LPA Markup.docx", icon: "docx" }, { name: "BurgundyPension — Comment Letter.pdf", icon: "pdf" }, { name: "CrimsonSWF — Redline.docx", icon: "docx" }, { name: "FernSWF — Markup.docx", icon: "docx" }, { name: "BronzePension — Redline.docx", icon: "docx" }, { name: "JadeEndowment — Redline.docx", icon: "docx" }, { name: "TanSWF — Comment Letter.docx", icon: "docx" }, { name: "CarmineSWF — Markup.docx", icon: "docx" }, { name: "BisquePension — Redline.docx", icon: "docx" }, { name: "+ 65 more files", icon: "docx" }] },
  ], agentAction: "Reading 74 LP comment letters..." },
  // Step 4 — Cross-Referencing Precedent (~3s)
  { thinkingLabel: "Loading precedent and mapping comments", thinkingSummary: "This is the most important analytical step. I need to load the Fund IV executed LPA and all 74 of its side letters, plus the Fund III LPA and its 61 side letters. For each of the 2,847 comments I just extracted, I need to find the closest precedent — did the GP agree to this exact ask in Fund IV? Did they agree to a modified version? Did they reject it?", thinkingDurationMs: 1000, toolCalls: [
    { title: "Loaded Fund IV & Fund III precedent", result: "Fund IV (2022): 156-page LPA + 74 side letters with 412 provisions. Fund III (2019): 142-page LPA + 61 side letters with 287 provisions.", icon: "read", durationMs: 1000, pills: [{ name: "Fund IV — Executed LPA.docx", icon: "docx" }, { name: "Fund IV Side Letters (74)", icon: "folder" }, { name: "Fund III — Executed LPA.docx", icon: "docx" }, { name: "Fund III Side Letters (61)", icon: "folder" }] },
    { title: "Mapping 2,847 comments to precedent…", result: "Each comment matched against Fund IV dispositions by LPA section and substantive content.", icon: "analyze", durationMs: 700 },
  ], agentAction: "Cross-referencing Fund IV & III precedent..." },
  // Step 5 — 74 Response Memos (~15s)
  { thinkingLabel: "Drafting 74 response memos", thinkingSummary: "Now I need to turn the precedent mapping into 74 individual response memos. Each memo should address that LP's comments in order, cite the Fund IV or Fund III precedent for each disposition, categorize every response using the four-color system, and use the firm's standard fund formation response memo format. I also need to factor in Sarah's note about the GP being more flexible on governance.", thinkingDurationMs: 4000, toolCalls: [
    { title: "Drafting: UmberPension response memo", result: "67 comments addressed. 42 agree, 12 agree with modification, 9 decline, 4 flagged.", icon: "draft", durationMs: 1800 },
    { title: "Drafting: BurgundyPension response memo", result: "54 comments addressed. 35 agree, 11 agree with modification, 6 decline, 2 flagged.", icon: "draft", durationMs: 1500 },
    { title: "Drafting: CrimsonSWF response memo", result: "41 comments addressed. 24 agree, 10 agree with modification, 5 decline, 2 flagged.", icon: "draft", durationMs: 1500 },
    { title: "Drafting: FernSWF response memo", result: "49 comments addressed. 30 agree, 9 agree with modification, 8 decline, 2 flagged.", icon: "draft", durationMs: 1500 },
    { title: "Drafting: BronzePension response memo", result: "45 comments addressed. 26 agree, 11 agree with modification, 6 decline, 2 flagged.", icon: "draft", durationMs: 1500 },
    { title: "Generating remaining 69 memos…", result: "69 memos drafted in parallel. Consistent disposition logic applied across common asks.", icon: "draft", durationMs: 3000 },
  ], agentAction: "Generating 74 response memos...", checklistUpdate: [true, true, true, false, false, false, false] },
  // Step 6 — Master Compendium (~10s)
  { thinkingLabel: "Building master compendium", thinkingSummary: "Now I need to take all 2,847 comments and the dispositions I assigned in the 74 memos and aggregate them into a single cross-LP view. The compendium should be organized by LPA section. But the more important task here is the consistency check — when I drafted 74 memos individually, I may have made slightly different recommendations for substantially similar asks.", thinkingDurationMs: 3000, toolCalls: [
    { title: "Aggregating 2,847 comments into section-by-section matrix", result: "Organized by LPA section (§3.1 through §18.4). Each row: LP Name, Counsel, Section, Comment, Fund IV Precedent, Disposition.", icon: "analyze", durationMs: 3000 },
    { title: "Running consistency check across all 74 memos", result: "Comparing disposition recommendations for substantively similar comments.", icon: "analyze", durationMs: 2500 },
    { title: "Flagged 12 inconsistencies", result: "12 cases where similar comments received different dispositions.", icon: "analyze", durationMs: 1500 },
  ], agentAction: "Building master compendium...", checklistUpdate: [true, true, true, true, false, false, false] },
  // Step 7 — 10 Side Letters (~12s)
  { thinkingLabel: "Identifying anchors and drafting side letters", thinkingSummary: "Side letters need to be drafted for the anchor investors — the LPs with the largest commitments who get individually negotiated terms. I need to figure out who qualifies as an anchor for this fund. In Fund IV the threshold was $100M. For each anchor, I need to structure a proper side letter with recitals, negotiated provisions, MFN mechanics, and signature blocks.", thinkingDurationMs: 4000, toolCalls: [
    { title: "Identifying anchor investors (≥$100M commitment)", result: "10 LPs identified. Combined commitment: $1,490M (60% of $2.5B target).", icon: "analyze", durationMs: 1200 },
    { title: "Drafting: UmberPension side letter ($200M)", result: "7 provisions: fee step-down, 100% fee offset, carry escrow, co-invest, ESG exclusion, affiliate transfer, LPAC seat.", icon: "draft", durationMs: 1500 },
    { title: "Drafting: BurgundyPension side letter ($175M)", result: "5 provisions: fee step-down, 100% fee offset, Key Person expansion, ESG exclusion, LPAC seat.", icon: "draft", durationMs: 1200 },
    { title: "Drafting: CrimsonSWF side letter ($200M)", result: "6 provisions: fee step-down, co-invest, Key Person expansion, LPAC approval, affiliate transfer, LPAC seat.", icon: "draft", durationMs: 1200 },
    { title: "Drafting remaining 7 anchor side letters…", result: "7 side letters drafted. All include full recitals, provision sections, MFN mechanics, and signature blocks.", icon: "draft", durationMs: 2000 },
    { title: "Running MFN consistency check across all 10 side letters", result: "No direct conflicts found. 3 provisions MFN-excluded, 7 cascadable.", icon: "analyze", durationMs: 1500 },
  ], agentAction: "Drafting 10 anchor investor side letters...", checklistUpdate: [true, true, true, true, true, false, false] },
  // Step 8 — Redline LPA (~10s)
  { thinkingLabel: "Identifying majority-supported changes and redlining the LPA", thinkingSummary: "When 50% or more of LPs are asking for the same modification, it usually makes more sense to move that term into the base LPA rather than granting it individually across dozens of side letters. I need to find every provision where a majority converged, generate a redline with tracked changes, and cross-check against the side letters.", thinkingDurationMs: 3000, toolCalls: [
    { title: "Analyzing LP consensus across 2,847 comments", result: "Identified 23 provisions with 50%+ LP support. Range: 53% to 78%.", icon: "analyze", durationMs: 3000 },
    { title: "Generating tracked changes in Fund V draft LPA", result: "23 modifications applied across 12 sections.", icon: "draft", durationMs: 2500 },
    { title: "Cross-checking redline against 10 anchor side letters", result: "4 provisions now redundant in side letters (already in base LPA). Noted for cleanup.", icon: "analyze", durationMs: 1500 },
  ], agentAction: "Producing redline LPA...", checklistUpdate: [true, true, true, true, true, true, false] },
  // Step 9 — Analytical Workbooks (~12s)
  { thinkingLabel: "Building MFN cascade analysis and negotiation tracker", thinkingSummary: "The MFN cascade analysis is the deliverable the partner will spend the most time with. The question it answers is: if I grant this provision to one LP in a side letter, how many other LPs can piggyback on it through their MFN election right?", thinkingDurationMs: 4000, toolCalls: [
    { title: "Defining MFN tier structure based on Fund V commitments", result: "Tier 1 (≥$150M): 8 LPs. Tier 2 ($75–149M): 14 LPs. Tier 3 ($25–74M): 31 LPs. Tier 4 (<$25M): 21 LPs.", icon: "analyze", durationMs: 1500 },
    { title: "Mapping cascadable provisions across tiers", result: "10 side letter provisions analyzed. 3 MFN-excluded, 7 cascadable.", icon: "analyze", durationMs: 1500 },
    { title: "Calculating revenue impact for each cascadable provision", result: "Modeled full-election scenario. Largest exposure: management fee reduction at -$4.2M/yr post-IP.", icon: "analyze", durationMs: 2000 },
    { title: "Building 74-LP negotiation tracker", result: "All 74 LPs mapped with commitment, tier, counsel, side letter status, current round, days open.", icon: "draft", durationMs: 1800 },
    { title: "Generating side letter consistency matrix", result: "10 provisions × 74 LPs. Showing: directly granted, MFN-eligible, or not available.", icon: "draft", durationMs: 1500 },
  ], agentAction: "Building analytical workbooks...", checklistUpdate: [true, true, true, true, true, true, true] },
  // Step 10 — Final Summary (~1.25s)
  { thinkingLabel: "Compiling summary and open items", thinkingSummary: "Everything is generated. I need to give the user a clean summary of what I produced, what needs their attention, and what the most important next steps are.", thinkingDurationMs: 1250, toolCalls: [], agentAction: "Compiling final summary..." },
];

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { text: "Read all 74 LP comment letters and classify every comment by LPA section", checked: false },
  { text: "Cross-reference each comment against Fund IV and Fund III precedent", checked: false },
  { text: "Generate 74 individually tailored response memos", checked: false },
  { text: "Build a master compendium mapping all comments across all LPs", checked: false },
  { text: "Draft 10 side letters for anchor investors", checked: false },
  { text: "Produce a redline LPA incorporating majority-requested changes", checked: false },
  { text: "Build analytical workbooks — MFN cascade analysis and negotiation tracker", checked: false },
];

// Sources — all input documents are already in the default list, no step-based additions needed

// Artifacts = generated outputs from the workflow
const STEP_ARTIFACTS: Record<number, DrawerSource[]> = {
  5: [
    { title: "UmberPension — Response Memo", icon: "docx" }, { title: "BurgundyPension — Response Memo", icon: "docx" },
    { title: "CrimsonSWF — Response Memo", icon: "docx" }, { title: "FernSWF — Response Memo", icon: "docx" },
    { title: "BronzePension — Response Memo", icon: "docx" }, { title: "JadeEndowment — Response Memo", icon: "docx" },
    { title: "TanSWF — Response Memo", icon: "docx" }, { title: "CarmineSWF — Response Memo", icon: "docx" },
    { title: "BisquePension — Response Memo", icon: "docx" }, { title: "WalnutPension — Response Memo", icon: "docx" },
    { title: "GarnetSWF — Response Memo", icon: "docx" }, { title: "OnyxAssetManager — Response Memo", icon: "docx" },
    { title: "RubyInsurance — Response Memo", icon: "docx" }, { title: "SageAssetManager — Response Memo", icon: "docx" },
    { title: "TealCorporate — Response Memo", icon: "docx" }, { title: "VioletFundOfFunds — Response Memo", icon: "docx" },
    { title: "CedarFundOfFunds — Response Memo", icon: "docx" },
  ],
  6: [{ title: "Master LP Comment Compendium — Fund V", icon: "docx" }],
  7: [{ title: "Side Letter — UmberPension ($200M)", icon: "docx" }, { title: "Side Letter — BurgundyPension ($175M)", icon: "docx" }, { title: "Side Letter — CrimsonSWF ($200M)", icon: "docx" }, { title: "Side Letter — FernSWF ($175M)", icon: "docx" }, { title: "Side Letter — BronzePension ($150M)", icon: "docx" }],
  8: [{ title: "Crestonridge Equity Fund V LPA — Redline (First Pass)", icon: "docx" }],
  9: [{ title: "MFN Cascade Analysis — Fund V", icon: "xlsx" }, { title: "74-LP Negotiation Tracker", icon: "xlsx" }, { title: "Side Letter Consistency Matrix", icon: "xlsx" }],
};

// ─── Helper components ────────────────────────────────────────────────

function InlineTable({ headers, rows, boldLastRow }: { headers: string[]; rows: string[][]; boldLastRow?: boolean }) {
  return (
    <div className="my-3 border border-border-base rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="bg-bg-subtle border-b border-border-base">{headers.map((h, i) => <th key={i} className="text-left px-3 py-2 font-medium text-fg-base whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} className={i < rows.length - 1 ? "border-b border-border-base" : ""}>{row.map((cell, j) => <td key={j} className={cn("px-3 py-2 text-fg-subtle", boldLastRow && i === rows.length - 1 && "font-semibold text-fg-base")}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function FileListCard({ files, overflowCount, onFileClick }: { files: { name: string; type: "docx" | "xlsx" | "folder" }[]; overflowCount?: number; onFileClick?: (name: string) => void }) {
  return (
    <div className="border border-border-base rounded-lg px-3 py-1 bg-bg-base my-3" style={{ minWidth: "320px" }}>
      <div className="space-y-0.5">
        {files.map((file, idx) => (
          <div key={idx} className="flex items-center gap-2 h-8 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer min-w-0" onClick={() => onFileClick?.(file.name)}>
            <div className="flex-shrink-0">
              {file.type === "folder" ? <Image src="/folderIcon.svg" alt="Folder" width={16} height={16} /> : file.type === "xlsx" ? <Image src="/xls.svg" alt="XLSX" width={16} height={16} /> : <Image src="/msword.svg" alt="DOCX" width={16} height={16} />}
            </div>
            <span className="text-sm text-fg-base truncate flex-1">{file.name}</span>
          </div>
        ))}
        {overflowCount != null && overflowCount > 0 && (
          <div className="flex items-center gap-2 h-8 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer">
            <span className="text-sm text-fg-muted">View {overflowCount} more...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DiligenceChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="border border-[#e6e5e2] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#1a1a1a] px-[10px] py-1 my-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 pr-[10px] py-1 rounded">
          <div className="flex-shrink-0 w-[14px] h-[14px] flex items-center justify-center">
            {item.checked ? <SvgIcon src="/central_icons/Checked - Filled.svg" alt="Done" width={14} height={14} className="text-fg-muted dark:text-[#8f8c85]" /> : <div className="w-[14px] h-[14px] rounded-full border border-[#cccac6] dark:border-[#5a5a5a] bg-white dark:bg-transparent" />}
          </div>
          <span className={cn("flex-1 text-sm truncate", item.checked ? "text-[#9e9b95] dark:text-[#6b6b6b] line-through" : "text-[#524f49] dark:text-[#d4d4d4]")}>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Step response renderers ──────────────────────────────────────────

// ─── Inbox Popover ────────────────────────────────────────────────

const INBOX_ITEMS = [
  {
    category: "Modify space",
    items: [
      { avatar: "SC", name: "sarah@wc.com", action: "wants to give everyone in", target: '"Space"', detail: 'run only access to "Fund IV Precedent Library"' },
    ],
  },
  {
    category: "Invite to space",
    items: [
      { avatar: "JR", name: "james@wc.com", action: "wants to add", target: "michael@connectgen.com", detail: 'to "Space"' },
      { avatar: "JR", name: "james@wc.com", action: "wants to add", target: "lisa@connectgen.com", detail: 'to "Space"' },
    ],
  },
  {
    category: "Modify space",
    items: [
      { avatar: "SC", name: "sarah@wc.com", action: "wants to give everyone in", target: '"Space"', detail: 'run only access to "LP Response Memo Workflow"' },
    ],
  },
  {
    category: "Share request",
    items: [
      { avatar: "SC", name: "sarah@wc.com", action: "wants to give", target: "partner@connectgen.com", detail: 'edit access to "Fund V Diligence Vault"' },
    ],
  },
  {
    category: "Activity",
    items: [
      { avatar: "JR", name: "james@wc.com", action: "uploaded", target: "3 documents", detail: "to Fund V workspace · 2h ago" },
      { avatar: "MK", name: "maria@wc.com", action: "commented on", target: "UmberPension Response Memo", detail: "· 4h ago" },
      { avatar: "SC", name: "sarah@wc.com", action: "shared", target: "MFN Cascade Analysis", detail: "with the deal team · 5h ago" },
    ],
  },
];

function InboxPopoverContent({ showUploadActivity, uploadNotifications, skipAnimation }: { showUploadActivity?: boolean; uploadNotifications?: Array<{ id: string; avatar: string; email: string; count: number; detail: string; time: string }>; skipAnimation?: boolean }) {
  return (
    <div className="w-[380px] max-h-[480px] flex flex-col">
      <div className="px-4 py-3 border-b border-border-base flex-shrink-0 flex items-center justify-between">
        <h3 className="text-sm font-medium text-fg-base">Inbox</h3>
        <button className="-mr-2 text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-button-neutral-hover rounded-[6px] px-2 h-6 flex items-center transition-colors">
          View all
        </button>
      </div>
      <div className="py-1 overflow-y-auto flex-1">
        {showUploadActivity && uploadNotifications && uploadNotifications.length > 0 && (
          <div>
            <AnimatePresence>
              {uploadNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={skipAnimation ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mx-2 px-2 py-2.5 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                        <AvatarFallback className="text-[9px] font-medium">{notif.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-fg-base leading-[18px]">
                          <span className="font-medium">{notif.email}</span>
                          {" "}uploaded{" "}
                          <span className="font-medium">{notif.count} comments</span>
                        </p>
                        <p className="text-[11px] text-fg-muted leading-[16px] mt-0.5">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="border-t border-border-base my-1" />
          </div>
        )}
        {INBOX_ITEMS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-border-base my-1" />}
            <div className="px-4 pt-2 pb-1">
              <span className="text-[11px] font-medium text-fg-muted">{group.category}</span>
            </div>
            {group.items.map((item, ii) => (
              <div key={`${gi}-${ii}`} className="mx-2 px-2 py-2.5 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] font-medium">{item.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-fg-subtle leading-[18px]">
                      <span className="font-medium text-fg-base">{item.name}</span>
                      {" "}{item.action}{" "}
                      <span className="font-medium text-fg-base">{item.target}</span>
                      {" "}{item.detail}
                    </p>
                    {group.category !== "Activity" && (
                      <div className="flex items-center gap-2 mt-2">
                        <button className="flex-1 h-[28px] text-xs font-medium rounded-[7px] bg-button-neutral border border-border-base hover:bg-button-neutral-hover active:bg-button-neutral-pressed text-fg-base transition-colors">
                          Deny
                        </button>
                        <button className="flex-1 h-[28px] text-xs font-medium rounded-[7px] bg-button-inverted text-fg-on-color hover:bg-button-inverted-hover active:bg-button-inverted-pressed transition-colors">
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function InboxPopoverButton({ showUploadActivity, uploadNotifications, open, onOpenChange }: { showUploadActivity?: boolean; uploadNotifications?: Array<{ id: string; avatar: string; email: string; count: number; detail: string; time: string }>; open: boolean; onOpenChange: (open: boolean) => void }) {
  const hasOpenedBefore = useRef(false);
  const skipAnimation = hasOpenedBefore.current;
  useEffect(() => { if (open) hasOpenedBefore.current = true; }, [open]);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="medium" className={cn("gap-1.5", open && "bg-button-neutral-hover")}>
          <span className="relative flex items-center">
            <SvgIcon src="/central_icons/Inbox.svg" alt="Inbox" width={16} height={16} className="text-fg-base" />
            {showUploadActivity && !open && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1917]" />}
          </span>
          Inbox
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-auto p-0 rounded-lg shadow-lg border border-border-base">
        <InboxPopoverContent showUploadActivity={showUploadActivity} uploadNotifications={uploadNotifications} skipAnimation={skipAnimation} />
      </PopoverContent>
    </Popover>
  );
}

function ChecklistProgressBar({ itemIdx, text, total }: { itemIdx: number; text: string; total: number }) {
  const [displayIdx, setDisplayIdx] = useState(itemIdx);
  const [phase, setPhase] = useState<"active" | "completing" | "entering">("active");
  const prevIdxRef = useRef(itemIdx);

  useEffect(() => {
    if (itemIdx !== prevIdxRef.current) {
      // Item changed — run completion animation on old item, then transition
      setPhase("completing");
      const t1 = setTimeout(() => {
        setDisplayIdx(itemIdx);
        setPhase("entering");
      }, 900); // Time for check + strikethrough to play
      const t2 = setTimeout(() => {
        setPhase("active");
      }, 1200);
      prevIdxRef.current = itemIdx;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [itemIdx]);

  const displayText = phase === "completing" ? INITIAL_CHECKLIST[prevIdxRef.current]?.text || text : (phase === "entering" ? text : text);
  const displayNum = phase === "completing" ? prevIdxRef.current + 1 : displayIdx + 1;

  return (
    <div className="px-3 py-2 bg-bg-subtle border border-border-base rounded-lg overflow-hidden">
      <style>{`
        @keyframes clCheckIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <AnimatePresence mode="wait">
        {phase === "completing" ? (
          <motion.div
            key={`completing-${prevIdxRef.current}`}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center" style={{ animation: "clCheckIn 0.35s ease-out forwards" }}>
              <SvgIcon src="/central_icons/Checked - Filled.svg" alt="Done" width={14} height={14} className="text-fg-muted" />
            </div>
            <span className="text-xs text-fg-muted font-medium truncate flex-1 line-through">{displayText}</span>
            <span className="text-xs text-fg-muted flex-shrink-0">{displayNum} / {total}</span>
          </motion.div>
        ) : (
          <motion.div
            key={`active-${displayIdx}`}
            initial={phase === "entering" ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 w-4 h-4 relative">
              <div className="absolute inset-0 rounded-full border-2 border-fg-disabled/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-fg-subtle animate-spin" />
            </div>
            <span className="text-xs text-fg-subtle font-medium truncate flex-1">{text}</span>
            <span className="text-xs text-fg-muted flex-shrink-0">{displayNum} / {total}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedResponse({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="text-sm text-fg-base leading-relaxed pl-2 space-y-2">
      <style>{`@keyframes stepFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {items.map((child, index) => (
        <div key={index} style={{ opacity: 0, animation: `stepFadeIn 0.35s ease-out ${index * 0.25}s forwards` }}>
          {child}
        </div>
      ))}
    </div>
  );
}

function StepResponse({ stepIndex, checklist, onOpenDraftArtifact, onOpenReviewArtifact }: {
  stepIndex: number; checklist?: ChecklistItem[];
  onOpenDraftArtifact?: (t: string, s: string) => void;
  onOpenReviewArtifact?: (t: string, s: string) => void;
}) {
  const R = AnimatedResponse;
  switch (stepIndex) {
    case 0: return (<R><p>I&apos;ll take a first pass at the LP diligence for Crestonridge Equity. This is a full-book review — 74 LP comment letters against the draft LPA. I&apos;ll need to read every markup, understand what each LP is asking for, and cross-reference against prior fund precedent.</p><p>This is substantial work — let me put together a plan of approach before diving in.</p></R>);
    case 1: return null;
    case 2: return (<R><p>Good context. This is Fund V in a series — Crestonridge Equity raised Fund IV at $1.8B in 2022 and Fund III at $1.2B in 2019, so there&apos;s a strong precedent trail. I have the executed LPA and every side letter from both prior funds.</p><p>One thing worth noting from Sarah Chen&apos;s email — the GP is more flexible on governance provisions this round but wants to hold firm on economics. I&apos;ll weight my recommendations accordingly, though I&apos;ll flag anywhere that creates tension with Fund IV.</p><p>Starting by reading all 74 comment letters now.</p></R>);
    case 3: return (<R><p>All 74 files read. This is a heavily marked-up book — <strong>2,847 total comments</strong> across 16 LPA sections. Here&apos;s where the pressure is concentrated:</p><InlineTable headers={["LPA Section","# Comments","% of Total","Top 3 LPs by Volume"]} rows={[["§3.1 Management Fee","312","11%","UmberPension (18), CrimsonSWF (14), BurgundyPension (12)"],["§4.2 Carried Interest","287","10%","BronzePension (16), UmberPension (14), FernSWF (13)"],["§5.3 Key Person","198","7%","BurgundyPension (11), CrimsonSWF (9), CarmineSWF (8)"],["§6.1 Investment Restrictions","243","9%","JadeEndowment (12), FernSWF (11), BisquePension (9)"],["§8.4 LPAC","176","6%","CrimsonSWF (10), BronzePension (9), BurgundyPension (8)"],["§10.2 Transfer Restrictions","134","5%","UmberPension (8), TanSWF (7), GarnetSWF (6)"],["All other sections","1,497","52%","Distributed across 74 LPs"],["Total","2,847","100%",""]]} boldLastRow /><p>A few things stand out. The economics sections account for 21% of all comments. But §5.3 (Key Person) is getting more attention than I&apos;d expect — 198 comments, with several LPs asking for named individuals beyond the founders. That&apos;s probably driven by Crestonridge Equity&apos;s new CIO promotion since Fund IV.</p><p>I also noticed that 14 of the 74 LPs are using the same two law firms — Ashford Keene is representing 8 LPs and Calloway Reeves LLP is representing 6. That means I&apos;ll likely see clusters of identical language I can batch together.</p></R>);
    case 4: return (<R><p>Precedent mapping is complete. I now know how Crestonridge Equity handled each type of ask across their last two funds. Here&apos;s the breakdown:</p><InlineTable headers={["Category","# Comments","%","What This Means"]} rows={[["Direct Fund IV precedent","2,211","78%","The GP agreed, modified, or rejected an identical ask in Fund IV. High confidence."],["Partial Fund III precedent","602","21%","The ask appeared in Fund III but not Fund IV, or was materially different. Needs judgment."],["Novel — no prior analog","34","1%","First time the GP has seen this. Mostly ESG reporting (22) and GP-led secondaries (12)."],["Total","2,847","100%",""]]} boldLastRow /><p>The 78% with direct precedent is the easy part. The interesting layer is the 21% with partial precedent — for example, 47 LPs are asking for LPAC <em>approval rights</em> on conflict transactions, but Fund IV only granted <em>consultation rights</em>. Given Sarah&apos;s note about more flexibility on governance, I&apos;m recommending the approval right above a materiality threshold.</p><p>The 34 novel items will be flagged in yellow across every deliverable. I have enough to start generating the response memos now.</p></R>);
    case 5: return (<R><p>All 74 response memos are done. Each one addresses the LP&apos;s comments point-by-point in LPA section order, with a Fund IV citation for every disposition. Here&apos;s the aggregate picture:</p><InlineTable headers={["Disposition","Color","# Comments","%","Meaning"]} rows={[["Agree — Consistent with Precedent","🟢 Green","1,642","58%","Fund IV granted the same or substantially similar term"],["Agree with Modification","🔵 Blue","569","20%","Precedent supports a narrower version of the ask"],["Decline — Against Precedent","🔴 Red","602","21%","Fund IV rejected this and no market shift justifies a change"],["Flag for Review — Novel","🟡 Yellow","34","1%","No precedent — requires partner judgment"]]} /><p>Over half (58%) are clean agrees. The 20% in &quot;agree with modification&quot; are cases where the LP is pushing further than Fund IV — for example, UmberPension asking for 100% fee offset when Fund IV granted 80%. The 21% declines are mostly in economics — asks for reduced carry and fee structures Crestonridge Equity has never agreed to.</p><p>Moving on to the master compendium — I need to pull all 2,847 comments into one view.</p><FileListCard files={[{name:"UmberPension — Response Memo.docx",type:"docx"},{name:"BurgundyPension — Response Memo.docx",type:"docx"},{name:"CrimsonSWF — Response Memo.docx",type:"docx"},{name:"FernSWF — Response Memo.docx",type:"docx"},{name:"BronzePension — Response Memo.docx",type:"docx"}]} overflowCount={69} onFileClick={(name) => onOpenDraftArtifact?.(name, "LP Response Memo")} /></R>);
    case 6: return (<R><p>Master compendium is built. While aggregating, I ran a consistency check across all 74 memos and found <strong>12 cases</strong> where I recommended different dispositions for substantively similar asks. These need to be aligned before anything goes out.</p><InlineTable headers={["#","LPA Section","Issue","LPs Affected","Root Cause"]} rows={[["1","§3.1 Mgmt Fee","Fee offset scope — recommended 100% for BurgundyPension but 80% for WalnutPension and CarmineSWF on near-identical language","BurgundyPension, WalnutPension, CarmineSWF","BurgundyPension had a direct Fund IV precedent at 100%; the others' wording matched a Fund III precedent at 80%"],["2","§4.2 Carry","Clawback escrow — recommended 25% for UmberPension but 30% for BronzePension and FernSWF","UmberPension, BronzePension, FernSWF","UmberPension negotiated 25% specifically in Fund IV; the others asked for 30% with no direct precedent"],["3","§6.1 Restrictions","ESG exclusion scope — thermal coal only for JadeEndowment but broader fossil fuel for BisquePension and WalnutPension","JadeEndowment, BisquePension, WalnutPension","BisquePension and WalnutPension have SFDR regulatory obligations justifying broader scope"],["…","…","…","…","…"],["12","§10.2 Transfer","Affiliate transfer consent threshold inconsistently applied","CrimsonSWF, TanSWF, GarnetSWF","Wording variation across three different counsel"]]} /><p>For what it&apos;s worth, inconsistency #3 (ESG scope) might actually be correct — BisquePension has a regulatory obligation and JadeEndowment doesn&apos;t. But you&apos;ll want to confirm that&apos;s a distinction you&apos;re comfortable defending.</p><div className="my-3"><ArtifactCard title="Master LP Comment Compendium — Fund V" subtitle="2,847 rows × 14 columns · 12 inconsistencies flagged" onClick={() => onOpenDraftArtifact?.("Master LP Comment Compendium — Fund V","2,847 rows × 14 columns · 12 inconsistencies flagged")} /></div></R>);
    case 7: return (<R><p>All 10 anchor side letters are drafted and MFN-checked. No conflicts — the provisions granted to each anchor are consistent with the MFN tier structure.</p><InlineTable headers={["LP","Commitment","Tier","# Provisions","Key Terms"]} rows={[["UmberPension","$200M","1","7","Fee step-down, 100% fee offset, carry escrow, co-invest, ESG exclusion, affiliate transfer, LPAC seat"],["CrimsonSWF","$200M","1","6","Fee step-down, co-invest, Key Person expansion, LPAC approval, affiliate transfer, LPAC seat"],["BurgundyPension","$175M","1","5","Fee step-down, 100% fee offset, Key Person expansion, ESG exclusion, LPAC seat"],["FernSWF","$175M","1","4","Fee offset, clawback survival, affiliate transfer, LPAC seat"],["BronzePension","$150M","1","5","Fee step-down, co-invest, Key Person supermajority, carry escrow, LPAC seat"]]} /><p>One thing to flag: UmberPension is getting 7 provisions, which is the most in the book. CrimsonSWF is at 6 for the same commitment size but with a different mix. The partner may want to review whether that gap creates relationship issues.</p><FileListCard files={[{name:"Side Letter — UmberPension ($200M).docx",type:"docx"},{name:"Side Letter — BurgundyPension ($175M).docx",type:"docx"},{name:"Side Letter — CrimsonSWF ($200M).docx",type:"docx"},{name:"Side Letter — FernSWF ($175M).docx",type:"docx"},{name:"Side Letter — BronzePension ($150M).docx",type:"docx"}]} overflowCount={5} onFileClick={(name) => onOpenDraftArtifact?.(name, "Anchor Investor Side Letter")} /></R>);
    case 8: return (<R><p>Redline LPA is ready with <strong>23 tracked changes</strong> across 12 sections. These are all provisions where a majority of LPs asked for the same thing.</p><InlineTable headers={["LPA Section","Change","LP Consensus","Fund IV Position","Departure?"]} rows={[["§3.1 Management Fee","Step-down from 2.0% to 1.75% post-IP on invested capital","58 / 74 (78%)","Agreed in Fund IV","No"],["§5.3 Key Person","Added CIO (Jane Smith) as named Key Person; auto-suspension","51 / 74 (69%)","Partial — CIO not named; no auto-suspension","Yes"],["§8.4 LPAC","Approval right for affiliate transactions >$10M","47 / 74 (64%)","Consultation only in Fund IV","Yes"],["§6.1 Restrictions","Concentration cap reduced from 25% to 20%","44 / 74 (59%)","Agreed in Fund IV","No"],["§3.1 Management Fee","100% fee offset for monitoring and transaction fees","41 / 74 (55%)","80% offset in Fund IV","Yes"],["…","17 additional changes","50–53%","Various","Mixed"]]} /><p>Three of these are departures from Fund IV. The fee offset expansion from 80% to 100% is an economic concession — I&apos;d flag that specifically since the GP said they want to hold firm on economics.</p><div className="my-3"><ArtifactCard title="Crestonridge Equity Fund V LPA — Redline (First Pass)" subtitle="147 pages · 23 changes tracked · 3 Fund IV departures" onClick={() => onOpenDraftArtifact?.("Crestonridge Equity Fund V LPA — Redline (First Pass)","147 pages · 23 changes tracked")} /></div></R>);
    case 9: return (<R><p>Analytical workbooks are done. The MFN cascade analysis is the one I&apos;d bring to the partner meeting — here&apos;s the summary:</p><InlineTable headers={["Provision","Cascade Risk","Eligible LPs","Revenue / Capacity Impact","Recommendation"]} rows={[["SL-01: Mgmt Fee Reduction","🔴 HIGH","22 (Tiers 1–2)","-$4.2M/yr post-IP","Strongest candidate for MFN exclusion. Consider narrowing Tier 2 MFN."],["SL-03: Co-Invest Pro Rata","🔴 HIGH","53 (Tiers 1–3)","Over-allocation risk","Need formal co-invest allocation policy before final close."],["SL-06: ESG Exclusion","🟡 MEDIUM","53 (Tiers 1–3)","Pipeline narrowing","Manageable if exclusion list stays narrow."],["SL-02: 100% Fee Offset","🟡 MEDIUM","22 (Tiers 1–2)","-$1.8M/yr","Acceptable if portfolio company fees remain modest."],["SL-05: 25% Carry Escrow","⚪ EXCLUDED","N/A","N/A","MFN-excluded. UmberPension and BronzePension only."],["SL-07: LPAC Seat Guarantee","⚪ EXCLUDED","N/A","N/A","MFN-excluded. Committee capped at 9."]]} /><p>The headline number: if every eligible Tier 1–2 LP elects the management fee reduction, annual fee revenue drops approximately <strong>$4.2M</strong> post-Investment Period. That&apos;s the single biggest cascade exposure in the book.</p><div className="my-3"><ReviewTableArtifactCard title="MFN Cascade Analysis & Negotiation Tracker" subtitle="3 workbooks · 10 provisions analyzed · 74 LPs tracked" hideIcon onClick={() => onOpenReviewArtifact?.("MFN Cascade Analysis & Negotiation Tracker","3 workbooks · 10 provisions analyzed · 74 LPs tracked")} /></div></R>);
    case 10: return (<R>{checklist && <DiligenceChecklist items={checklist} />}<p>First-pass diligence is complete. Here&apos;s everything I generated:</p><InlineTable headers={["Count","Deliverable","Detail"]} rows={[["74","Response memos","2,847 comments addressed point-by-point with Fund IV/III citations"],["1","Master compendium","All comments mapped by LPA section, 12 inconsistencies flagged"],["10","Side letters","Anchor investors, execution-ready with recitals and signature blocks"],["1","Redline LPA","23 tracked changes with margin annotations, 3 Fund IV departures flagged"],["3","Analytical workbooks","MFN cascade analysis, 74-LP tracker, consistency matrix"],["89","Total documents",""]]} boldLastRow /><p>Four things need your attention before anything goes to Crestonridge Equity or opposing counsel:</p><InlineTable headers={["Priority","Item","Detail"]} rows={[["🔴 Strategic","MFN cascade — fee reduction","SL-01 carries -$4.2M/yr exposure if all eligible LPs elect. Recommend discussing MFN exclusion with UmberPension."],["🟡 Requires judgment","34 novel requests","ESG reporting (22 comments, 14 LPs) and GP-led secondaries (12 comments, 8 LPs). No Fund IV/III precedent."],["🟡 Consistency","12 disposition mismatches","Similar asks got different recommendations. Most significant: fee offset scope (§3.1) and clawback escrow (§4.2)."],["🟡 GP posture tension","Fee offset expansion (80% → 100%)","Moved into base LPA redline at 55% LP consensus, but it's an economic concession. Sarah's email noted GP wants to hold firm on economics."]]} /><p>The last item is one I&apos;d raise with Sarah directly — the 100% fee offset has enough LP support to justify putting it in the base LPA, but it conflicts with the GP&apos;s stated preference. That&apos;s a judgment call I can&apos;t make from precedent alone.</p><p>Want me to walk through the 34 novel items, or would you prefer to start with the 12 consistency issues? I can also pull up any individual LP&apos;s memo if you want to review a specific response.</p></R>);
    default: return null;
  }
}

// ─── Main component ────────────────────────────────────────────────────

export default function SpaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const space = spacesData[spaceId] || { name: "Untitled Space", createdBy: "Unknown", type: "team" as SpaceType, initials: "?" };
  const [projectName, setProjectName] = useState(space.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCrestview = spaceId === "crestonridge-equity-fund-v-formation";

  // Chat state
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState("");
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setActiveChatId = useCallback((id: string | null) => { activeChatIdRef.current = id; setActiveChatIdState(id); }, []);

  const activeChat = chatThreads.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];
  const isLoading = activeChat?.isLoading || false;
  const isInChatMode = messages.length > 0;

  const updateChatById = useCallback((chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setChatThreads((prev) => prev.map((chat) => (chat.id === chatId ? updater(chat) : chat)));
  }, []);

  const ensureChatExists = useCallback((): string => {
    const currentChatId = activeChatIdRef.current;
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`;
      const newChat: ChatThread = { id: newChatId, title: "Untitled", messages: [], isLoading: false, agentState: { isRunning: false, taskName: "" } };
      setChatThreads((prev) => [...prev, newChat]);
      setActiveChatId(newChatId);
      return newChatId;
    }
    return currentChatId;
  }, [setActiveChatId]);

  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatThread = { id: newChatId, title: "Untitled", messages: [], isLoading: false, agentState: { isRunning: false, taskName: "" } };
    setChatThreads((prev) => [...prev, newChat]);
    setActiveChatId(newChatId);
  }, [setActiveChatId]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        setIsScrolled(scrollTop > 0);
        const d = scrollHeight - scrollTop - clientHeight;
        setIsNearBottom(d < 100);
        setShowBottomGradient(d > 1);
      }
    };
    const container = messagesContainerRef.current;
    if (container) { container.addEventListener("scroll", handleScroll); handleScroll(); }
    return () => { if (container) container.removeEventListener("scroll", handleScroll); };
  }, []);

  useEffect(() => {
    if (isNearBottom && messages.length > 0) { const t = setTimeout(() => scrollToBottom(), 100); return () => clearTimeout(t); }
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => { setProjectName(space.name); }, [space.name]);

  // ─── Artifact panel state (Crestview only) ─────────────────────────
  const [unifiedArtifactPanelOpen, setUnifiedArtifactPanelOpen] = useState(false);
  const [currentArtifactType, setCurrentArtifactType] = useState<"draft" | "review" | null>(null);
  const [selectedDraftArtifact, setSelectedDraftArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [selectedReviewArtifact, setSelectedReviewArtifact] = useState<{ title: string; subtitle: string } | null>(null);
  const [isEditingDraftTitle, setIsEditingDraftTitle] = useState(false);
  const [editedDraftTitle, setEditedDraftTitle] = useState("");
  const [isEditingReviewTitle, setIsEditingReviewTitle] = useState(false);
  const [editedReviewTitle, setEditedReviewTitle] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const draftTitleRef = useRef<HTMLInputElement>(null);
  const reviewTitleRef = useRef<HTMLInputElement>(null);
  const anyArtifactOpen = unifiedArtifactPanelOpen;

  // ─── Chat panel resize ─────────────────────────────────────────
  const MIN_PANEL_WIDTH = 400;
  const [chatWidth, setChatWidth] = useState(401);
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [drawerLocked, setDrawerLocked] = useState(false);
  const [isHoveringResizer, setIsHoveringResizer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Chat width management
  useEffect(() => {
    if (isCrestview && isInChatMode && !anyArtifactOpen && containerRef.current) {
      const cw = containerRef.current.getBoundingClientRect().width;
      setChatWidth(cw - MIN_PANEL_WIDTH - 1);
    } else if (isCrestview && isInChatMode && anyArtifactOpen) {
      setChatWidth(MIN_PANEL_WIDTH);
    }
   
  }, [isInChatMode, anyArtifactOpen, isCrestview]);

  // Keep drawer at fixed width during artifact close transition so it doesn't slide
  const prevArtifactOpen = useRef(false);
  useEffect(() => {
    if (prevArtifactOpen.current && !anyArtifactOpen) {
      setDrawerLocked(true);
      const t = setTimeout(() => setDrawerLocked(false), 400);
      return () => clearTimeout(t);
    }
    prevArtifactOpen.current = anyArtifactOpen;
  }, [anyArtifactOpen]);

  // Window resize: update chat width
  useEffect(() => {
    if (!isCrestview || !isInChatMode || anyArtifactOpen) return;
    const handleResize = () => {
      if (containerRef.current && !isResizing) {
        setChatWidth(containerRef.current.getBoundingClientRect().width - MIN_PANEL_WIDTH - 1);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCrestview, isInChatMode, anyArtifactOpen, isResizing]);

  useEffect(() => {
    if (isInChatMode) {
      const t = setTimeout(() => scrollToBottom(false), 400);
      return () => clearTimeout(t);
    }
  }, [chatWidth, anyArtifactOpen, scrollToBottom, isInChatMode]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isInChatMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (chatPanelRef.current) setChatWidth(chatPanelRef.current.getBoundingClientRect().width);
    setIsResizing(true);
  }, [isInChatMode]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxChatWidth = containerRect.width - MIN_PANEL_WIDTH - 1;
      let newWidth = e.clientX - containerRect.left;
      newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxChatWidth));
      setChatWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(f => (f.style.pointerEvents = "none"));
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      iframes.forEach(f => (f.style.pointerEvents = ""));
    };
  }, [isResizing]);

  // ─── Drawer resize (between artifact and drawer) ──────────────
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [isHoveringDrawerResizer, setIsHoveringDrawerResizer] = useState(false);

  const handleDrawerResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!anyArtifactOpen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingDrawer(true);
  }, [anyArtifactOpen]);

  useEffect(() => {
    if (!isResizingDrawer) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = containerRect.right - e.clientX;
      newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, containerRect.width - chatWidth - MIN_PANEL_WIDTH));
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizingDrawer(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(f => (f.style.pointerEvents = "none"));
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      iframes.forEach(f => (f.style.pointerEvents = ""));
    };
  }, [isResizingDrawer, chatWidth]);

  // "A" key trigger — simulates multiple people uploading LP comment letters
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [uploadNotifications, setUploadNotifications] = useState<Array<{ id: string; avatar: string; email: string; count: number; detail: string; time: string }>>([]); 
  const [inboxOpen, setInboxOpen] = useState(false);

  useEffect(() => {
    if (!isCrestview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
        if (documentsUploaded || isInChatMode) return;
        setDocumentsUploaded(true);

        const uploads = [
          { id: "up1", avatar: "JR", email: "j.rivera@crestonridge.com", count: 8, detail: "UmberPension comments", time: "Just now", folder: "UmberPension Comments" },
          { id: "up2", avatar: "SC", email: "s.chen@crestonridge.com", count: 6, detail: "BurgundyPension comments", time: "Just now", folder: "BurgundyPension Comments" },
          { id: "up3", avatar: "MK", email: "m.kim@crestonridge.com", count: 7, detail: "CrimsonSWF comments", time: "Just now", folder: "CrimsonSWF Comments" },
          { id: "up4", avatar: "DL", email: "d.lee@crestonridge.com", count: 5, detail: "FernSWF comments", time: "Just now", folder: "FernSWF Comments" },
          { id: "up5", avatar: "AP", email: "a.patel@crestonridge.com", count: 9, detail: "BronzePension comments", time: "Just now", folder: "BronzePension Comments" },
          { id: "up6", avatar: "TN", email: "t.nguyen@crestonridge.com", count: 6, detail: "CarmineSWF comments", time: "Just now", folder: "CarmineSWF Comments" },
          { id: "up7", avatar: "RW", email: "r.wang@crestonridge.com", count: 5, detail: "TanSWF comments", time: "Just now", folder: "TanSWF Comments" },
          { id: "up8", avatar: "EF", email: "e.fischer@crestonridge.com", count: 7, detail: "JadeEndowment comments", time: "Just now", folder: "JadeEndowment Comments" },
          { id: "up9", avatar: "LM", email: "l.martinez@crestonridge.com", count: 4, detail: "BisquePension comments", time: "Just now", folder: "BisquePension Comments" },
          { id: "up10", avatar: "KT", email: "k.tanaka@crestonridge.com", count: 6, detail: "WalnutPension comments", time: "Just now", folder: "WalnutPension Comments" },
          { id: "up11", avatar: "BH", email: "b.hassan@crestonridge.com", count: 5, detail: "GarnetSWF comments", time: "Just now", folder: "GarnetSWF Comments" },
          { id: "up12", avatar: "JC", email: "j.cohen@crestonridge.com", count: 6, detail: "remaining comments", time: "Just now", folder: "Additional LP Comments" },
        ];

        // Open the inbox popover immediately
        setTimeout(() => setInboxOpen(true), 300);

        // Stagger notifications — 1.4s between each
        uploads.forEach((upload, i) => {
          setTimeout(() => {
            setUploadNotifications(prev => [upload, ...prev]);
            setDrawerActivities(prev => [{
              id: upload.id,
              type: "create" as const,
              user: upload.email.split("@")[0],
              action: "uploaded",
              target: `${upload.count} files to ${upload.folder}`,
              time: upload.time,
            }, ...prev]);
          }, i * 1400);
        });

        // Add uploaded folders to drawer sources progressively
        setUploadedDrawerSources([
          { title: "Crestonridge Equity Fund V — Draft LPA.docx", icon: "docx" as const },
        ]);
        uploads.forEach((upload, i) => {
          setTimeout(() => {
            setUploadedDrawerSources(prev => [
              { title: upload.folder, icon: "folder" as const },
              ...prev,
            ]);
          }, i * 1400);
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCrestview, documentsUploaded, isInChatMode]);

  // Delay hiding the checklist bar so the last item's completion animation can finish
  const [showChecklistBar, setShowChecklistBar] = useState(false);
  useEffect(() => {
    if (isLoading && isCrestview) {
      setShowChecklistBar(true);
    } else if (!isLoading && showChecklistBar) {
      const t = setTimeout(() => setShowChecklistBar(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, isCrestview, showChecklistBar]);

  const openDraftArtifact = useCallback((title: string, subtitle: string) => {
    setSelectedDraftArtifact({ title, subtitle }); setCurrentArtifactType("draft"); setUnifiedArtifactPanelOpen(true);
  }, []);
  const openReviewArtifact = useCallback((title: string, subtitle: string) => {
    setSelectedReviewArtifact({ title, subtitle }); setCurrentArtifactType("review"); setUnifiedArtifactPanelOpen(true);
  }, []);

  // ─── Drawer state (Crestview) ──────────────────────────────────────
  const [uploadedDrawerSources, setUploadedDrawerSources] = useState<DrawerSource[]>([]);
  const [drawerSources, setDrawerSources] = useState<DrawerSource[]>([]);
  const [drawerArtifacts, setDrawerArtifacts] = useState<DrawerSource[]>([]);
  const [drawerActivities, setDrawerActivities] = useState<{ id: string; type: "search" | "create"; user: string; action: string; target?: string; time: string }[]>([]);

  // ─── Diligence workflow ────────────────────────────────────────────
  const sendDiligenceMessage = useCallback((userMessage: string) => {
    const chatId = ensureChatExists();
    const title = userMessage.length > 40 ? userMessage.substring(0, 40) + "..." : userMessage;
    const userMsg: Message = { role: "user", content: userMessage, type: "text" };
    const initStepStates: DiligenceStepState[] = STEP_DEFS.map(s => ({
      thinkingVisible: false, thinkingDone: false,
      visibleToolCalls: 0, toolCallDone: s.toolCalls.map(() => false),
      toolCallPillsLoaded: s.toolCalls.map(() => 0), showResponse: false,
    }));
    const assistantMsg: Message = {
      role: "assistant", content: "", type: "text", isLoading: true,
      diligenceFlow: { currentStep: 0, stepStates: initStepStates },
      checklist: [...INITIAL_CHECKLIST],
    };
    updateChatById(chatId, chat => ({ ...chat, isLoading: true, title, messages: [userMsg, assistantMsg], agentState: { isRunning: true, taskName: title, currentAction: "Understanding diligence request..." } }));
    setTimeout(() => scrollToBottom(), 50);

    // Helper to update the last assistant message's diligence state
    const updateStep = (stepIdx: number, updater: (s: DiligenceStepState) => DiligenceStepState) => {
      updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((m, i) =>
        i === chat.messages.length - 1 && m.role === "assistant" && m.diligenceFlow
          ? { ...m, diligenceFlow: { ...m.diligenceFlow, currentStep: stepIdx, stepStates: m.diligenceFlow.stepStates.map((s, si) => si === stepIdx ? updater(s) : s) } }
          : m
      ) }));
    };

    let currentStep = 0;

    const processStep = () => {
      if (currentStep >= STEP_DEFS.length) {
        updateChatById(chatId, chat => ({
          ...chat, isLoading: false,
          messages: chat.messages.map((m, i) => i === chat.messages.length - 1 && m.role === "assistant" ? { ...m, isLoading: false } : m),
          agentState: { ...chat.agentState!, isRunning: false, currentAction: "Diligence complete", isAwaitingInput: true },
        }));
        setTimeout(() => scrollToBottom(), 150);
        return;
      }

      const stepDef = STEP_DEFS[currentStep];
      const stepIdx = currentStep;

      updateChatById(chatId, chat => ({ ...chat, agentState: { ...chat.agentState!, currentAction: stepDef.agentAction } }));

      // Phase 1: Show thinking
      updateStep(stepIdx, s => ({ ...s, thinkingVisible: true }));
      scrollToBottom();

      // Phase 2: After thinking duration, mark thinking done and start tool calls
      setTimeout(() => {
        updateStep(stepIdx, s => ({ ...s, thinkingDone: true }));
        scrollToBottom();

        // Phase 3: Process tool calls sequentially
        let tcIdx = 0;
        const processToolCall = () => {
          if (tcIdx >= stepDef.toolCalls.length) {
            // All tool calls done — show response, update sources/activities/checklist
            const newArtifacts = STEP_ARTIFACTS[stepIdx];
            if (newArtifacts) {
              newArtifacts.forEach((artifact, ai) => {
                setTimeout(() => {
                  setDrawerArtifacts(prev => [...prev, artifact]);
                }, ai * 200);
              });
            }
            setDrawerActivities(prev => [{ id: `act-${stepIdx}`, type: "search" as const, user: "Assistant", action: stepDef.agentAction.replace("...", ""), time: "Just now" }, ...prev.map(a => ({ ...a, time: a.time === "Just now" ? "1m ago" : a.time }))]);

            updateChatById(chatId, chat => ({ ...chat, messages: chat.messages.map((m, i) => {
              if (i === chat.messages.length - 1 && m.role === "assistant" && m.diligenceFlow) {
                const newChecklist = stepDef.checklistUpdate
                  ? (m.checklist || INITIAL_CHECKLIST).map((item, ci) => ({ ...item, checked: stepDef.checklistUpdate![ci] ?? item.checked }))
                  : m.checklist;
                return { ...m, checklist: newChecklist, diligenceFlow: { ...m.diligenceFlow, currentStep: stepIdx, stepStates: m.diligenceFlow.stepStates.map((s, si) => si === stepIdx ? { ...s, showResponse: true } : s) } };
              }
              return m;
            }) }));
            scrollToBottom();
            currentStep++;
            setTimeout(() => processStep(), 800);
            return;
          }

          const tc = stepDef.toolCalls[tcIdx];
          const currentTcIdx = tcIdx;

          // Make tool call visible (loading state)
          updateStep(stepIdx, s => ({ ...s, visibleToolCalls: currentTcIdx + 1 }));
          scrollToBottom();

          // If tool call has pills, load them progressively
          if (tc.pills && tc.pills.length > 0) {
            const pillCount = tc.pills.length;
            const pillInterval = Math.min(tc.durationMs / (pillCount + 1), 400);
            let pillIdx = 0;
            const pillTimer = setInterval(() => {
              pillIdx++;
              if (pillIdx <= pillCount) {
                updateStep(stepIdx, s => {
                  const newPills = [...s.toolCallPillsLoaded];
                  newPills[currentTcIdx] = pillIdx;
                  return { ...s, toolCallPillsLoaded: newPills };
                });
                scrollToBottom();
              }
              if (pillIdx >= pillCount) clearInterval(pillTimer);
            }, pillInterval);

            setTimeout(() => {
              clearInterval(pillTimer);
              updateStep(stepIdx, s => {
                const newDone = [...s.toolCallDone];
                newDone[currentTcIdx] = true;
                const newPills = [...s.toolCallPillsLoaded];
                newPills[currentTcIdx] = pillCount;
                return { ...s, toolCallDone: newDone, toolCallPillsLoaded: newPills };
              });
              scrollToBottom();
              tcIdx++;
              setTimeout(() => processToolCall(), 300);
            }, tc.durationMs);
          } else {
            // No pills — just show loading then done
            setTimeout(() => {
              updateStep(stepIdx, s => {
                const newDone = [...s.toolCallDone];
                newDone[currentTcIdx] = true;
                return { ...s, toolCallDone: newDone };
              });
              scrollToBottom();
              tcIdx++;
              setTimeout(() => processToolCall(), 300);
            }, tc.durationMs);
          }
        };

        // Start tool calls after a brief pause
        setTimeout(() => processToolCall(), 200);
      }, stepDef.thinkingDurationMs);
    };

    setTimeout(() => processStep(), 300);
  }, [scrollToBottom, ensureChatExists, updateChatById]);

  // ─── Generic message for non-Crestview ────────────────────────────
  const sendGenericMessage = useCallback((text: string) => {
    const chatId = ensureChatExists();
    const title = text.length > 40 ? text.substring(0, 40) + "..." : text;
    const userMessage: Message = { role: "user", content: text, type: "text" };
    const thinkingContent = getThinkingContent();
    const assistantMessage: Message = { role: "assistant", content: "", type: "text", isLoading: true, thinkingContent, loadingState: { showSummary: false, visibleBullets: 0 } };
    updateChatById(chatId, (chat) => ({ ...chat, title, messages: [...chat.messages, userMessage, assistantMessage], isLoading: true }));
    setChatInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "20px";

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => { updateChatById(chatId, (chat) => ({ ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, loadingState: { showSummary: true, visibleBullets: 0 } } : m) })); }, 500));
    timers.push(setTimeout(() => { updateChatById(chatId, (chat) => ({ ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, loadingState: { showSummary: true, visibleBullets: 1 } } : m) })); }, 1200));
    timers.push(setTimeout(() => { updateChatById(chatId, (chat) => ({ ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, loadingState: { showSummary: true, visibleBullets: 2 } } : m) })); }, 2000));
    timers.push(setTimeout(() => { updateChatById(chatId, (chat) => ({ ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, loadingState: { showSummary: true, visibleBullets: 3 } } : m) })); }, 2800));
    timers.push(setTimeout(() => { updateChatById(chatId, (chat) => ({ ...chat, isLoading: false, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, isLoading: false, content: "Based on my analysis of the shared space content, here are the key findings:\n\nThe documents in this workspace cover several critical areas that require attention. I've identified patterns across the uploaded materials and cross-referenced them with relevant regulatory frameworks.\n\nKey observations include compliance gaps in reporting timelines, areas where documentation could be strengthened, and opportunities for process improvements that align with current best practices." } : m) })); }, 4000));
    return () => timers.forEach(clearTimeout);
  }, [ensureChatExists, updateChatById]);

  // ─── Send message router ───────────────────────────────────────────
  const sendMessage = useCallback((messageText?: string) => {
    const text = messageText || chatInputValue;
    if (!text.trim() || isLoading) return;
    setChatInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "20px";
    if (isCrestview) { sendDiligenceMessage(text); } else { sendGenericMessage(text); }
  }, [chatInputValue, isLoading, isCrestview, sendDiligenceMessage, sendGenericMessage]);

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full">
      <div className="h-screen flex flex-col bg-bg-base w-full">
        {/* Header + Cover */}
        <motion.div className="flex-shrink-0 border-b border-border-base overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }} initial={false} animate={{ height: isInChatMode ? 52 : 132 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
          <div className="flex items-center justify-between px-3 py-3" style={{ height: "52px" }}>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={() => router.push("/spaces")}>
                <ArrowLeft className="h-4 w-4 text-fg-muted" />
              </Button>
              <AnimatePresence mode="wait">
                {isInChatMode && (
                  <motion.div key="header-title" className="flex items-center gap-2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                    <div className="flex items-center gap-[6px]">
                      <div className="w-6 h-6 rounded-[4px] border border-border-strong flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: isCrestview ? "transparent" : "#333f40" }}>
                        {isCrestview ? <img src="/whitefield_logo.png" alt="Whitestone Lane" className="w-full h-full object-cover" /> : <span className="text-[8px] font-medium text-white leading-none">{space.initials}</span>}
                      </div>
                      <div className="w-6 h-6 rounded-[4px] overflow-hidden shrink-0">
                        {isCrestview ? <img src="/crestview_logo.webp" alt="Crestonridge Equity" className="w-full h-full object-cover" /> : <img src="/harvey-glyph.png" alt="Harvey" className="w-full h-full object-cover" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-fg-base">{projectName}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5">
              <AnimatePresence mode="wait">
                {isInChatMode && (
                  <motion.div key="collapsed-actions" className="flex items-center gap-1.5" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                    <AvatarGroup>
                      <Avatar className="w-7 h-7">
                        <AvatarImage src="/avatar_images/avatar_image_1.png" alt="User 1" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-7 h-7">
                        <AvatarImage src="/avatar_images/avatar_image_2.png" alt="User 2" />
                        <AvatarFallback>ML</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-7 h-7">
                        <AvatarImage src="/avatar_images/avatar_image_3.png" alt="User 3" />
                        <AvatarFallback>ER</AvatarFallback>
                      </Avatar>
                      <AvatarGroupCount className="w-7 h-7 text-[10px]">+20</AvatarGroupCount>
                    </AvatarGroup>
                    <Button variant="outline" size="medium" className="gap-1.5"><Users className="h-4 w-4" />Share</Button>
                    {isCrestview ? (
                      <InboxPopoverButton showUploadActivity={documentsUploaded} uploadNotifications={uploadNotifications} open={inboxOpen} onOpenChange={setInboxOpen} />
                    ) : (
                      <Button variant="outline" size="medium" className="gap-1.5"><SvgIcon src="/central_icons/Inbox.svg" alt="Inbox" width={16} height={16} className="text-fg-base" />Inbox</Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4 text-fg-muted" /></Button>
            </div>
          </div>
          {/* Cover Section */}
          <motion.div className="flex items-end justify-between" style={{ paddingLeft: "20px", paddingRight: "20px", paddingTop: "0", paddingBottom: "12px", height: "80px" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: isInChatMode ? 0 : 1, y: isInChatMode ? -10 : 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-[6px]">
                <div className="w-8 h-8 rounded-[5px] border border-border-strong flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: isCrestview ? "transparent" : "#333f40" }}>
                  {isCrestview ? <img src="/whitefield_logo.png" alt="Whitestone Lane" className="w-full h-full object-cover" /> : <span className="text-[10px] font-medium text-white leading-none">{space.initials}</span>}
                </div>
                <div className="w-8 h-8 rounded-[5px] overflow-hidden shrink-0">
                  {isCrestview ? <img src="/crestview_logo.webp" alt="Crestonridge Equity" className="w-full h-full object-cover" /> : <img src="/harvey-glyph.png" alt="Harvey" className="w-full h-full object-cover" />}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-fg-base" style={{ fontSize: "20px", lineHeight: "28px", fontFamily: "'Harvey Serif', serif" }}>{projectName}</span>
                <span className="text-fg-subtle" style={{ fontSize: "12px", lineHeight: "16px" }}>Created by {space.createdBy}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AvatarGroup>
                <Avatar className="w-7 h-7">
                  <AvatarImage src="/avatar_images/avatar_image_1.png" alt="User 1" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar className="w-7 h-7">
                  <AvatarImage src="/avatar_images/avatar_image_2.png" alt="User 2" />
                  <AvatarFallback>ML</AvatarFallback>
                </Avatar>
                <Avatar className="w-7 h-7">
                  <AvatarImage src="/avatar_images/avatar_image_3.png" alt="User 3" />
                  <AvatarFallback>ER</AvatarFallback>
                </Avatar>
                <AvatarGroupCount className="w-7 h-7 text-[10px]">+20</AvatarGroupCount>
              </AvatarGroup>
              <Button variant="outline" size="medium" className="gap-1.5"><Users className="h-4 w-4" />Share</Button>
              {isCrestview ? (
                <InboxPopoverButton showUploadActivity={documentsUploaded} uploadNotifications={uploadNotifications} open={inboxOpen} onOpenChange={setInboxOpen} />
              ) : (
                <Button variant="outline" size="medium" className="gap-1.5"><SvgIcon src="/central_icons/Inbox.svg" alt="Inbox" width={16} height={16} className="text-fg-base" />Inbox</Button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Area */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          {/* Left Panel - Chat: hidden when chatOpen is false */}
          <div
            ref={chatPanelRef}
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ width: !chatOpen ? 0 : (isCrestview && isInChatMode ? chatWidth : 401), transition: isResizing ? 'none' : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ height: "52px" }}>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-1 overflow-x-auto" style={{ flexWrap: "nowrap", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
                  {chatThreads.length === 0 ? (
                    <span className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap" style={{ padding: "4px 8px" }}>New chat</span>
                  ) : (
                    chatThreads.map((thread) => (
                      <div key={thread.id} className={cn("relative flex items-center rounded-md transition-colors shrink-0 group/tab", thread.id === activeChatId ? "bg-bg-subtle" : "hover:bg-bg-subtle")} style={{ maxWidth: "200px" }}>
                        <button onClick={() => setActiveChatId(thread.id)} className={cn("text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis", thread.id === activeChatId ? "text-fg-base" : "text-fg-muted hover:text-fg-base")} style={{ padding: "4px 8px", maxWidth: "200px" }} title={thread.title || "New chat"}>{thread.title || "New chat"}</button>
                        {chatThreads.length > 1 && (
                          <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover/tab:opacity-100 transition-opacity rounded-r-md">
                            <div className={cn("w-6 h-full","bg-gradient-to-r from-transparent to-bg-subtle")} />
                            <div className="h-full bg-bg-subtle flex items-center pr-2 rounded-r-md">
                              <X size={12} className="text-fg-muted hover:text-fg-base cursor-pointer" onClick={(e) => { e.stopPropagation(); setChatThreads((prev) => { const n = prev.filter((t) => t.id !== thread.id); if (thread.id === activeChatId && n.length > 0) setActiveChatId(n[0].id); return n; }); }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-7 h-7 flex items-center justify-center hover:bg-bg-subtle rounded-[7px] transition-colors flex-shrink-0">
                    <SvgIcon src="/central_icons/History.svg" alt="Chat history" width={16} height={16} className="text-fg-muted" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}><p>Chat history</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={createNewChat} className="w-7 h-7 flex items-center justify-center hover:bg-bg-subtle rounded-[7px] transition-colors flex-shrink-0"><Plus size={16} className="text-fg-muted" /></button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}><p>New chat</p></TooltipContent>
              </Tooltip>
            </div>

            {/* Chat Content */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${isScrolled ? "opacity-100" : "opacity-0"}`} />
              <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto overflow-x-hidden px-5 pt-8 pb-4 ${!isInChatMode ? "flex items-center justify-center" : ""}`}>
                <div className="mx-auto w-full" style={{ maxWidth: "740px" }}>
                  {!isInChatMode ? (
                    /* Zero State */
                    <div className="flex flex-col items-center justify-center gap-6 py-3">
                      <div className="w-full max-w-[624px] px-3 flex flex-col gap-0.5">
                        <h1 className="text-[18px] font-medium leading-[24px] tracking-[-0.3px] text-fg-base">{isCrestview ? "Crestonridge Equity Fund V Formation" : `Welcome to ${projectName}`}</h1>
                        <p className="text-sm leading-5 text-fg-subtle">{isCrestview ? "What would you like to work on?" : "This is your shared workspace. What would you like to work on?"}</p>
                      </div>
                      <div className="w-full max-w-[624px] flex flex-col">
                        <div className="px-3 pb-3"><p className="text-xs leading-4 text-fg-muted">Get started…</p></div>
                        <div className="flex flex-col">
                          {isCrestview ? (
                            <>
                              <AnimatePresence>
                                {documentsUploaded && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3, ease: "easeOut" }}>
                                    <button onClick={() => sendMessage("Generate LPA comment memos with suggested responses for each commenting investor, along with any corresponding side letters")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full min-w-0">
                                      <SvgIcon src="/central_icons/Workflows.svg" alt="Workflow" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                      <span className="text-sm leading-5 text-fg-subtle">Generate LPA comment response memos</span>
                                    </button>
                                    <div className="h-px bg-border-base mx-3" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <button onClick={() => sendMessage("Ask about changes in this shared space")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left min-w-0">
                                <SvgIcon src="/central_icons/Assistant.svg" alt="Ask" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle truncate">Ask about changes in this shared space</span>
                              </button>
                              <div className="h-px bg-border-base mx-3" />
                              <button onClick={() => sendMessage("Draft side letters for anchor investors")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left min-w-0">
                                <SvgIcon src="/central_icons/Draft.svg" alt="Draft" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle truncate">Draft side letters for anchor investors</span>
                              </button>
                              <div className="h-px bg-border-base mx-3" />
                              <button onClick={() => sendMessage("Compare key terms across funds")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left min-w-0">
                                <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle truncate">Compare key terms across funds</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => sendMessage("Guide to Shared Spaces")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
                                <SvgIcon src="/central_icons/Guidance.svg" alt="Guide" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle">Guide to Shared Spaces</span>
                              </button>
                              <div className="h-px bg-border-base mx-3" />
                              <button onClick={() => sendMessage("Draft memo from shared content")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
                                <SvgIcon src="/central_icons/Draft.svg" alt="Draft" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle">Draft memo from shared content</span>
                              </button>
                              <div className="h-px bg-border-base mx-3" />
                              <button onClick={() => sendMessage("Create a shared review table")} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left">
                                <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                <span className="text-sm leading-5 text-fg-subtle">Create a shared review table</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Messages */
                    messages.map((message, index) => (
                      <div key={index} className={`${index !== messages.length - 1 ? "mb-6" : ""}`}>
                        {message.role === "user" && (
                          <div className="flex flex-col gap-2 items-end pl-[68px]">
                            <div className="bg-bg-subtle px-4 py-3 rounded-[12px]"><div className="text-sm text-fg-base leading-5">{message.content}</div></div>
                            <div className="flex items-center justify-end">
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><ListPlus className="w-3 h-3" />Save prompt</button>
                              <button className="text-xs font-medium text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded px-2 py-1 flex items-center gap-1.5"><SquarePen className="w-3 h-3" />Edit query</button>
                            </div>
                          </div>
                        )}
                        {/* Diligence flow assistant message */}
                        {message.role === "assistant" && message.diligenceFlow && (
                          <div className="flex-1 min-w-0">
                            <div className="space-y-5">
                              {STEP_DEFS.map((stepDef, stepIdx) => {
                                const flow = message.diligenceFlow!;
                                const stepState = flow.stepStates[stepIdx];
                                if (stepIdx > flow.currentStep) return null;
                                const isPast = stepIdx < flow.currentStep;
                                const isCurrent = stepIdx === flow.currentStep;
                                const showThinking = isPast || (isCurrent && stepState.thinkingVisible);
                                const showResponse = isPast || (isCurrent && stepState.showResponse);

                                // Build childStates for tool calls dynamically
                                const visibleTcCount = isPast ? stepDef.toolCalls.length : stepState.visibleToolCalls;
                                const childStates = stepDef.toolCalls.slice(0, visibleTcCount).map((tc, tcIdx) => {
                                  const isDone = isPast || stepState.toolCallDone[tcIdx];
                                  const pillsLoaded = isPast ? (tc.pills?.length || 0) : stepState.toolCallPillsLoaded[tcIdx];
                                  const tcIcon = tc.icon === "search" ? Search : tc.icon === "read" ? ReadIcon : tc.icon === "draft" ? DraftIcon : tc.icon === "analyze" ? ReviewIcon : undefined;
                                  return {
                                    variant: "analysis" as const,
                                    title: tc.title,
                                    summary: isDone ? tc.result : undefined,
                                    icon: tcIcon,
                                    isLoading: !isDone,
                                    isChild: true,
                                    customContent: tc.pills && tc.pills.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {tc.pills.map((pill, pillIdx) => {
                                          if (pillIdx >= pillsLoaded && !isPast) return null;
                                          return (
                                            <motion.div
                                              key={`pill-${stepIdx}-${tcIdx}-${pillIdx}`}
                                              initial={{ opacity: 0, y: 4 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                              className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border-base rounded-md text-xs"
                                            >
                                              <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                                {!isDone && pillIdx >= pillsLoaded - 1 ? (
                                                  <LoaderCircle className="w-4 h-4 animate-spin text-fg-subtle" />
                                                ) : pill.icon === "pdf" ? (
                                                  <Image src="/pdf-icon.svg" alt="PDF" width={16} height={16} />
                                                ) : pill.icon === "folder" ? (
                                                  <Image src="/folderIcon.svg" alt="Folder" width={16} height={16} />
                                                ) : pill.icon === "search" ? (
                                                  <Search className="w-3.5 h-3.5 text-fg-subtle" />
                                                ) : (
                                                  <Image src="/msword.svg" alt="DOCX" width={16} height={16} />
                                                )}
                                              </div>
                                              <span className="text-fg-subtle truncate max-w-[200px]">{pill.name}</span>
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    ) : undefined,
                                  };
                                });

                                // Parent is loading until all tool calls done and response shown
                                const allToolCallsDone = isPast || (stepDef.toolCalls.length === 0) || stepState.toolCallDone.every(Boolean);
                                const parentIsLoading = isCurrent && !(allToolCallsDone && stepState.showResponse);

                                return (
                                  <div key={stepIdx} className="space-y-3">
                                    {/* Single parent ThinkingState with tool calls as children */}
                                    {showThinking && (
                                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                                        <ThinkingState
                                          variant="analysis"
                                          title={parentIsLoading ? stepDef.thinkingLabel : stepDef.thinkingLabel}
                                          durationSeconds={isPast ? Math.round((stepDef.thinkingDurationMs + stepDef.toolCalls.reduce((a, tc) => a + tc.durationMs, 0)) / 1000) : undefined}
                                          summary={stepDef.thinkingSummary}
                                          childStates={childStates.length > 0 ? childStates : undefined}
                                          isLoading={parentIsLoading}
                                          defaultOpen={false}
                                        />
                                      </motion.div>
                                    )}

                                    {/* Agent Response — AnimatedResponse inside handles its own stagger */}
                                    {showResponse && (
                                      <StepResponse stepIndex={stepIdx} checklist={message.checklist} onOpenDraftArtifact={openDraftArtifact} onOpenReviewArtifact={openReviewArtifact} />
                                    )}

                                    {/* Step 1: Plan checklist + trailing text */}
                                    {stepIdx === 1 && showResponse && message.checklist && (
                                      <>
                                        <div style={{ opacity: 0, animation: "stepFadeIn 0.35s ease-out 0.3s forwards" }} className="pl-2">
                                          <DiligenceChecklist items={message.checklist} />
                                        </div>
                                        <div style={{ opacity: 0, animation: "stepFadeIn 0.35s ease-out 0.7s forwards" }} className="text-sm text-fg-base leading-relaxed pl-2">
                                          <p>Here&apos;s my plan. I&apos;ll work through each step systematically — starting by gathering context on the engagement, then reading all 74 comment letters.</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              {!message.isLoading && (
                                <>
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex items-center justify-between mt-3">
                                    <div className="flex items-center">
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Copy className="w-3 h-3" />Copy</button>
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><Download className="w-3 h-3" />Export</button>
                                      <button className="text-xs text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm px-2 py-1 flex items-center gap-1.5"><RotateCcw className="w-3 h-3" />Rewrite</button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsUp className="w-3 h-3" /></button>
                                      <button className="text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors rounded-sm p-1.5"><ThumbsDown className="w-3 h-3" /></button>
                                    </div>
                                  </motion.div>

                                  {/* Follow-up suggestions */}
                                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 }} className="mt-5">
                                    <div className="flex flex-col">
                                      <div className="px-3 pb-3"><p className="text-sm font-medium leading-5 text-fg-subtle">Suggested follow-ups</p></div>
                                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors text-left min-w-0">
                                        <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                        <span className="text-sm leading-5 text-fg-subtle truncate">Walk me through the 34 novel items</span>
                                      </button>
                                      <div className="h-px bg-border-base mx-3" />
                                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors text-left min-w-0">
                                        <SvgIcon src="/central_icons/Guidance.svg" alt="Guide" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                        <span className="text-sm leading-5 text-fg-subtle truncate">Resolve the 12 consistency issues</span>
                                      </button>
                                      <div className="h-px bg-border-base mx-3" />
                                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors text-left min-w-0">
                                        <SvgIcon src="/central_icons/Draft.svg" alt="Draft" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                        <span className="text-sm leading-5 text-fg-subtle truncate">Send response memos back to LPs as emails</span>
                                      </button>
                                      <div className="h-px bg-border-base mx-3" />
                                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-bg-subtle transition-colors text-left min-w-0">
                                        <SvgIcon src="/central_icons/Review.svg" alt="Review" width={16} height={16} className="text-fg-subtle flex-shrink-0" />
                                        <span className="text-sm leading-5 text-fg-subtle truncate">Pull up the UmberPension memo for review</span>
                                      </button>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Generic assistant message (non-diligence) */}
                        {message.role === "assistant" && !message.diligenceFlow && (
                          <div className="flex-1 min-w-0">
                            {message.isLoading && message.thinkingContent && message.loadingState ? (
                              <ThinkingState variant="analysis" title="Thinking..." durationSeconds={undefined} summary={message.loadingState.showSummary ? message.thinkingContent.summary : undefined} bullets={message.thinkingContent.bullets?.slice(0, message.loadingState.visibleBullets)} isLoading={true} />
                            ) : message.thinkingContent ? (
                              <ThinkingState variant="analysis" title="Thought" durationSeconds={3} summary={message.thinkingContent.summary} bullets={message.thinkingContent.bullets} defaultOpen={false} />
                            ) : null}
                            {!message.isLoading && message.content && (
                              <AnimatePresence><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
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
                              </motion.div></AnimatePresence>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom gradient — overlaps the bottom of scroll area, above input */}
            <div className={`relative z-20 pointer-events-none h-0`}>
              <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent transition-opacity duration-300 ${showBottomGradient ? "opacity-100" : "opacity-0"}`} />
            </div>

            {/* Chat Input */}
            <div className="px-5 pb-5 relative z-20 bg-bg-base">
              <div className="mx-auto" style={{ maxWidth: "732px" }}>
                {/* Checklist progress — slides up from behind the chatbox */}
                <AnimatePresence>
                  {isCrestview && showChecklistBar && (() => {
                    const lastMsg = messages[messages.length - 1];
                    if (!lastMsg?.diligenceFlow || !lastMsg.checklist) return null;
                    const currentStepIdx = lastMsg.diligenceFlow.currentStep;
                    const stepToItem: Record<number, number> = { 2: 0, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
                    const currentItemIdx = stepToItem[currentStepIdx];
                    if (currentItemIdx === undefined) return null;
                    const item = lastMsg.checklist[currentItemIdx];
                    if (!item) return null;
                    return (
                      <motion.div
                        key="checklist-bar"
                        initial={{ opacity: 0, y: 20, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 8 }}
                        exit={{ opacity: 0, y: 20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="px-1 overflow-hidden"
                      >
                        <ChecklistProgressBar itemIdx={currentItemIdx} text={item.text} total={lastMsg.checklist.length} />
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                <div className="bg-[#f6f5f4] dark:bg-[#2a2a2a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[12px] flex flex-col transition-all duration-200 focus-within:border-border-strong" style={{ boxShadow: "0px 18px 47px 0px rgba(0,0,0,0.03), 0px 7.5px 19px 0px rgba(0,0,0,0.02), 0px 4px 10.5px 0px rgba(0,0,0,0.02), 0px 2.3px 5.8px 0px rgba(0,0,0,0.01), 0px 1.2px 3.1px 0px rgba(0,0,0,0.01), 0px 0.5px 1.3px 0px rgba(0,0,0,0.01)" }}>
                  <div className="p-[10px] flex flex-col gap-[10px]">
                    <div className="inline-flex items-center gap-[4px] px-[4px] py-[2px] bg-white dark:bg-[#1a1a1a] border border-[#f1efec] dark:border-[#3d3d3d] rounded-[4px] w-fit">
                      <SvgIcon src="/central_icons/Spaces.svg" alt="Space" width={12} height={12} className="text-fg-subtle" />
                      <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">{projectName}</span>
                    </div>
                    <div className="px-[4px]">
                      <div className="relative">
                        <textarea ref={textareaRef} value={chatInputValue} onChange={(e) => { setChatInputValue(e.target.value); e.target.style.height = "20px"; e.target.style.height = Math.max(20, e.target.scrollHeight) + "px"; }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !isLoading) { e.preventDefault(); sendMessage(); } }} onFocus={() => setIsChatInputFocused(true)} onBlur={() => setIsChatInputFocused(false)} disabled={isLoading} className="w-full bg-transparent focus:outline-none text-fg-base placeholder-[#9e9b95] resize-none overflow-hidden disabled:opacity-50" style={{ fontSize: "14px", lineHeight: "20px", height: "20px", minHeight: "20px", maxHeight: "300px" }} />
                        {!chatInputValue && !isChatInputFocused && (
                          <div className="absolute inset-0 pointer-events-none text-[#9e9b95] dark:text-[#6b6b6b] flex items-start" style={{ fontSize: "14px", lineHeight: "20px" }}>
                            <TextLoop interval={3000}>
                              {isCrestview ? <span>Ask about Fund V formation…</span> : <span>Ask Harvey about this shared space…</span>}
                              {isCrestview ? <span>Review LP comment letters…</span> : <span>Summarize the key documents…</span>}
                              {isCrestview ? <span>Draft side letters for anchors…</span> : <span>Draft a memo from shared content…</span>}
                              {isCrestview ? <span>Analyze MFN cascade risk…</span> : <span>Create a review table…</span>}
                            </TextLoop>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pl-[10px] pr-[10px] pb-[10px]">
                    <div className="flex items-center">
                      <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors"><Paperclip size={16} className="text-fg-base" /></button>
                      <button className="h-[28px] px-[6px] flex items-center justify-center rounded-[6px] hover:bg-[#e4e1dd] dark:hover:bg-[#3d3d3d] transition-colors"><Scale size={16} className="text-fg-base" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <button disabled className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] cursor-not-allowed"><Spinner size="sm" /></button>
                      ) : chatInputValue.trim() ? (
                        <button onClick={() => sendMessage()} className="h-[28px] px-[8px] flex items-center justify-center bg-button-inverted text-fg-on-color rounded-[6px] hover:bg-button-inverted-hover transition-all"><CornerDownLeft size={16} /></button>
                      ) : (
                        <button className="h-[28px] px-[8px] flex items-center justify-center bg-[#e4e1dd] dark:bg-[#3d3d3d] rounded-[6px] hover:bg-[#d9d6d1] dark:hover:bg-[#4a4a4a] transition-all"><AudioLines className="w-4 h-4 text-fg-base" /></button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-2"><span className="text-[11px] text-fg-disabled leading-4">All queries are private and visible to only you</span></div>
              </div>
            </div>
          </div>

          {/* Resize Handle — between chat and right panel (Crestview in chat mode) */}
          {isCrestview && isInChatMode ? (
            <div
              className={`relative group w-px cursor-col-resize transition-colors flex-shrink-0 ${isHoveringResizer || isResizing ? "bg-border-strong" : "bg-border-base"}`}
              onMouseEnter={() => setIsHoveringResizer(true)}
              onMouseLeave={() => setIsHoveringResizer(false)}
              onMouseDown={handleResizeMouseDown}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
            </div>
          ) : (
            <div className="w-px bg-border-base flex-shrink-0" />
          )}

          {/* Right Panel */}
          {isCrestview ? (
            <div className="flex-1 flex justify-end overflow-hidden">
              {/* Artifact Panel — always mounted, sized by remaining flex space (no transition needed; chat width transition drives the slide) */}
              <div
                className="flex flex-col min-w-0 overflow-hidden"
                style={{ flex: anyArtifactOpen ? '1 0 0px' : '0 0 0px' }}
              >
                {anyArtifactOpen && currentArtifactType === "draft" && (
                  <DraftArtifactPanel selectedArtifact={selectedDraftArtifact} isEditingArtifactTitle={isEditingDraftTitle} editedArtifactTitle={editedDraftTitle} onEditedArtifactTitleChange={setEditedDraftTitle} onStartEditingTitle={() => { setIsEditingDraftTitle(true); setEditedDraftTitle(selectedDraftArtifact?.title || ""); }} onSaveTitle={() => { setIsEditingDraftTitle(false); if (selectedDraftArtifact && editedDraftTitle.trim()) setSelectedDraftArtifact({ ...selectedDraftArtifact, title: editedDraftTitle.trim() }); }} onClose={() => { setUnifiedArtifactPanelOpen(false); setSelectedDraftArtifact(null); setCurrentArtifactType(null); }} chatOpen={chatOpen} onToggleChat={setChatOpen} shareArtifactDialogOpen={shareDialogOpen} onShareArtifactDialogOpenChange={setShareDialogOpen} exportReviewDialogOpen={exportDialogOpen} onExportReviewDialogOpenChange={setExportDialogOpen} artifactTitleInputRef={draftTitleRef} sourcesDrawerOpen={false} onSourcesDrawerOpenChange={() => {}} contentType={selectedDraftArtifact?.title?.includes("Response Memo") ? "response-memo" : selectedDraftArtifact?.title?.includes("Side Letter") ? "side-letter" : "memorandum"} />
                )}
                {anyArtifactOpen && currentArtifactType === "review" && (
                  <ReviewArtifactPanel selectedArtifact={selectedReviewArtifact} isEditingArtifactTitle={isEditingReviewTitle} editedArtifactTitle={editedReviewTitle} onEditedArtifactTitleChange={setEditedReviewTitle} onStartEditingTitle={() => { setIsEditingReviewTitle(true); setEditedReviewTitle(selectedReviewArtifact?.title || ""); }} onSaveTitle={() => { setIsEditingReviewTitle(false); if (selectedReviewArtifact && editedReviewTitle.trim()) setSelectedReviewArtifact({ ...selectedReviewArtifact, title: editedReviewTitle.trim() }); }} onClose={() => { setUnifiedArtifactPanelOpen(false); setSelectedReviewArtifact(null); setCurrentArtifactType(null); }} chatOpen={chatOpen} onToggleChat={setChatOpen} shareArtifactDialogOpen={shareDialogOpen} onShareArtifactDialogOpenChange={setShareDialogOpen} exportReviewDialogOpen={exportDialogOpen} onExportReviewDialogOpenChange={setExportDialogOpen} artifactTitleInputRef={reviewTitleRef} />
                )}
              </div>

              {/* Drawer resize handle — between artifact and drawer */}
              {anyArtifactOpen && (
                <div
                  className={`relative group w-px cursor-col-resize transition-colors flex-shrink-0 ${isHoveringDrawerResizer || isResizingDrawer ? "bg-border-strong" : "bg-border-base"}`}
                  onMouseEnter={() => setIsHoveringDrawerResizer(true)}
                  onMouseLeave={() => setIsHoveringDrawerResizer(false)}
                  onMouseDown={handleDrawerResizeMouseDown}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                </div>
              )}

              {/* Configuration Drawer — fixed width in chat mode, flex-1 otherwise */}
              <ConfigurationDrawer
                isOpen={true}
                onClose={() => {}}
                variant="embedded"
                width={(anyArtifactOpen || drawerLocked) ? drawerWidth : undefined}
                isResizing={isResizingDrawer}
                activeTabOverride={isInChatMode ? "work-product" : undefined}
                customSources={[
                  ...uploadedDrawerSources,
                  { title: "Cross-Border Tax Strategies", icon: "knowledge" as const },
                  { title: "M&A Due Diligence", icon: "vault" as const },
                  { title: "Fund V — Draft LPA", icon: "docx" as const },
                  { title: "Fund IV — Executed LPA", icon: "docx" as const },
                  { title: "Fund IV Side Letters (74)", icon: "folder" as const },
                  { title: "Fund III — Executed LPA", icon: "docx" as const },
                  { title: "Fund III Side Letters (61)", icon: "folder" as const },
                  { title: "Negotiation Playbook", icon: "docx" as const },
                  ...drawerSources,
                ]}
                customArtifacts={drawerArtifacts.length > 0 ? drawerArtifacts : undefined}
                customActivities={drawerActivities.length > 0 ? drawerActivities : undefined}
                agents={chatThreads.filter(c => c.agentState?.isRunning).map(chat => ({
                  id: chat.id,
                  isRunning: chat.agentState!.isRunning,
                  taskName: chat.agentState!.taskName,
                  currentAction: chat.agentState!.currentAction,
                  isAwaitingInput: chat.agentState!.isAwaitingInput,
                  isActive: chat.id === activeChatId,
                }))}
                onStopAgent={(agentId) => { setChatThreads(prev => prev.map(c => c.id === agentId ? { ...c, isLoading: false, agentState: { isRunning: false, taskName: "" } } : c)); }}
                onReviewAgent={() => { setTimeout(() => scrollToBottom(), 100); }}
                onSwitchAgent={(agentId) => { setActiveChatId(agentId); }}
                activeArtifactTitle={anyArtifactOpen && currentArtifactType === "draft" ? selectedDraftArtifact?.title : anyArtifactOpen && currentArtifactType === "review" ? selectedReviewArtifact?.title : undefined}
                onArtifactClick={(title, icon) => { if (icon === "xlsx") { openReviewArtifact(title, ""); } else { openDraftArtifact(title, ""); } }}
              />
            </div>
          ) : (
            /* Default right panel for non-Crestview spaces */
            <div className="flex-1 flex flex-col overflow-hidden bg-bg-base">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center"><p className="text-sm text-fg-muted">Content</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
