"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Users, Briefcase, ChevronRight, ChevronDown, ChevronLeft,
  FileIcon, MessageSquare, Upload, Share2, Edit3,
  Scale, Paperclip, Mic, CornerDownLeft, CloudUpload, FolderPlus, SlidersHorizontal,
  Plus, Copy, Download, RotateCcw, ThumbsUp, ThumbsDown, ListPlus, SquarePen,
  Search, Star, Sparkles, Eye, Trash2, ArrowRightFromLine, FilePlus2, MoreHorizontal, BookOpen
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
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { SvgIcon } from "@/components/svg-icon";
import { AnimatedBackground } from "../../../components/motion-primitives/animated-background";
import { TextLoop } from "../../../components/motion-primitives/text-loop";
import { TextShimmer } from "../../../components/motion-primitives/text-shimmer";
import ThinkingState from "@/components/thinking-state";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const categoryOptions = [
  { label: 'Compliance Policy', color: '#CE5347' },
  { label: 'Audit Report', color: '#638DE0' },
  { label: 'Regulatory Filing', color: '#F2D646' },
  { label: 'Risk Assessment', color: '#93C5FD' },
  { label: 'Evidence File', color: '#86EFAC' },
] as const;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  category?: { label: string; color: string };
  createdBy: string;
  parentPath: string;
  slug?: string;
  itemCount?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const getFileIconPath = (fileName: string, mimeType: string): string => {
  const lowerName = fileName.toLowerCase();
  const lowerType = mimeType.toLowerCase();
  if (lowerType === 'folder') return '/folderIcon.svg';
  if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) return '/pdf-icon.svg';
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerType.includes('word') || lowerType.includes('document')) return '/docx-icon.svg';
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv') || lowerType.includes('spreadsheet') || lowerType.includes('excel') || lowerType.includes('csv')) return '/xlsx-icon.svg';
  return '/file.svg';
};

const columnHelper = createColumnHelper<UploadedFile>();

const allFiles: UploadedFile[] = [
  // Root folders
  { id: 'f1', name: 'Due Diligence Reports', size: 0, type: 'folder', uploadedAt: new Date('2026-02-28'), createdBy: 'Emily Zhang', parentPath: '', slug: 'due-diligence-reports', itemCount: 8 },
  { id: 'f2', name: 'LP Comment Letters', size: 0, type: 'folder', uploadedAt: new Date('2026-02-20'), createdBy: 'Sarah Lee', parentPath: '', slug: 'lp-comment-letters', itemCount: 6 },
  { id: 'f3', name: 'Corporate Governance', size: 0, type: 'folder', uploadedAt: new Date('2026-01-30'), createdBy: 'Michael Ross', parentPath: '', slug: 'corporate-governance', itemCount: 6 },
  // Root files
  { id: '1', name: 'Q4_2025_Compliance_Report.pdf', size: 2456789, type: 'application/pdf', uploadedAt: new Date('2026-03-10'), category: categoryOptions[1], createdBy: 'Harvey', parentPath: '' },
  { id: '2', name: 'GDPR_Policy_v3.2.docx', size: 845632, type: 'application/docx', uploadedAt: new Date('2026-03-08'), category: categoryOptions[0], createdBy: 'Emily Zhang', parentPath: '' },
  { id: '3', name: 'SOX_Control_Testing.xlsx', size: 1234567, type: 'application/xlsx', uploadedAt: new Date('2026-03-05'), category: categoryOptions[3], createdBy: 'Michael Ross', parentPath: '' },
  { id: '4', name: 'AML_Due_Diligence_Report.pdf', size: 3456789, type: 'application/pdf', uploadedAt: new Date('2026-03-01'), category: categoryOptions[1], createdBy: 'Harvey', parentPath: '' },
  { id: '5', name: 'Data_Privacy_Assessment.pdf', size: 987654, type: 'application/pdf', uploadedAt: new Date('2026-02-25'), category: categoryOptions[3], createdBy: 'Sarah Lee', parentPath: '' },
  { id: '6', name: 'Regulatory_Correspondence_SEC.pdf', size: 567890, type: 'application/pdf', uploadedAt: new Date('2026-02-20'), category: categoryOptions[2], createdBy: 'Emily Zhang', parentPath: '' },
  { id: '7', name: 'Internal_Audit_Findings.docx', size: 1123456, type: 'application/docx', uploadedAt: new Date('2026-02-18'), category: categoryOptions[1], createdBy: 'Harvey', parentPath: '' },
  { id: '8', name: 'Vendor_Risk_Matrix.xlsx', size: 654321, type: 'application/xlsx', uploadedAt: new Date('2026-02-15'), category: categoryOptions[3], createdBy: 'Michael Ross', parentPath: '' },
  { id: '9', name: 'Compliance_Training_Records.xlsx', size: 234567, type: 'application/xlsx', uploadedAt: new Date('2026-02-10'), category: categoryOptions[4], createdBy: 'Sarah Lee', parentPath: '' },
  { id: '10', name: 'Policy_Exception_Log.pdf', size: 345678, type: 'application/pdf', uploadedAt: new Date('2026-02-05'), category: categoryOptions[4], createdBy: 'Emily Zhang', parentPath: '' },
  { id: '11', name: 'Sanctions_Screening_Results.xlsx', size: 876543, type: 'application/xlsx', uploadedAt: new Date('2026-01-28'), category: categoryOptions[3], createdBy: 'Harvey', parentPath: '' },
  { id: '12', name: 'Board_Compliance_Report.pdf', size: 2345678, type: 'application/pdf', uploadedAt: new Date('2026-01-22'), category: categoryOptions[1], createdBy: 'Michael Ross', parentPath: '' },
  { id: '13', name: 'KYC_Documentation_Guide.docx', size: 456789, type: 'application/docx', uploadedAt: new Date('2026-01-18'), category: categoryOptions[0], createdBy: 'Emily Zhang', parentPath: '' },
  { id: '14', name: 'Incident_Response_Plan.pdf', size: 567890, type: 'application/pdf', uploadedAt: new Date('2026-01-15'), category: categoryOptions[0], createdBy: 'Harvey', parentPath: '' },
  { id: '15', name: 'Regulatory_Change_Analysis.xlsx', size: 789012, type: 'application/xlsx', uploadedAt: new Date('2026-01-10'), category: categoryOptions[2], createdBy: 'Sarah Lee', parentPath: '' },
  { id: '16', name: 'Anti_Bribery_Policy_2026.pdf', size: 1567890, type: 'application/pdf', uploadedAt: new Date('2026-01-08'), category: categoryOptions[0], createdBy: 'Emily Zhang', parentPath: '' },
  { id: '17', name: 'Risk_Assessment_Framework.docx', size: 923456, type: 'application/docx', uploadedAt: new Date('2026-01-05'), category: categoryOptions[3], createdBy: 'Harvey', parentPath: '' },
  { id: '18', name: 'SEC_Form_10K_Draft.pdf', size: 4567890, type: 'application/pdf', uploadedAt: new Date('2025-12-10'), category: categoryOptions[2], createdBy: 'Michael Ross', parentPath: '' },
  { id: '19', name: 'Business_Continuity_Plan.docx', size: 867543, type: 'application/docx', uploadedAt: new Date('2025-11-15'), category: categoryOptions[0], createdBy: 'Sarah Lee', parentPath: '' },
  { id: '20', name: 'Cross_Border_Transaction_Review.pdf', size: 1567234, type: 'application/pdf', uploadedAt: new Date('2025-10-05'), category: categoryOptions[2], createdBy: 'Harvey', parentPath: '' },
  // Due Diligence Reports folder contents
  { id: 'dd1', name: 'Aquametals_Supply_Agreement.pdf', size: 7925760, type: 'application/pdf', uploadedAt: new Date('2026-02-27'), category: categoryOptions[1], createdBy: 'Emily Zhang', parentPath: 'due-diligence-reports' },
  { id: 'dd2', name: 'Macrogenics_Commercial_Supply.pdf', size: 2396160, type: 'application/pdf', uploadedAt: new Date('2026-02-25'), category: categoryOptions[1], createdBy: 'Harvey', parentPath: 'due-diligence-reports' },
  { id: 'dd3', name: 'GNC_Supply_Agreement.pdf', size: 20480, type: 'application/pdf', uploadedAt: new Date('2026-02-22'), category: categoryOptions[1], createdBy: 'Michael Ross', parentPath: 'due-diligence-reports' },
  { id: 'dd4', name: 'Delta_Inventory_Supply_Agreement.pdf', size: 9093120, type: 'application/pdf', uploadedAt: new Date('2026-02-20'), category: categoryOptions[1], createdBy: 'Emily Zhang', parentPath: 'due-diligence-reports' },
  { id: 'dd5', name: 'Carvana_License_Agreement.pdf', size: 241050, type: 'application/pdf', uploadedAt: new Date('2026-02-18'), category: categoryOptions[1], createdBy: 'Sarah Lee', parentPath: 'due-diligence-reports' },
  { id: 'dd6', name: 'AIG_License_Agreement.pdf', size: 10240, type: 'application/pdf', uploadedAt: new Date('2026-02-15'), category: categoryOptions[1], createdBy: 'Harvey', parentPath: 'due-diligence-reports' },
  { id: 'dd7', name: 'KLK_tempe_218731298372.csv', size: 1966080, type: 'application/csv', uploadedAt: new Date('2026-02-12'), category: categoryOptions[3], createdBy: 'Michael Ross', parentPath: 'due-diligence-reports' },
  { id: 'dd8', name: 'vo_lottie-20123.csv', size: 5509120, type: 'application/csv', uploadedAt: new Date('2026-02-10'), category: categoryOptions[4], createdBy: 'Emily Zhang', parentPath: 'due-diligence-reports' },
  // LP Comment Letters folder contents
  { id: 'lp1', name: 'UmberPension_Fund_V_LPA_Markup.docx', size: 1234567, type: 'application/docx', uploadedAt: new Date('2026-02-19'), category: categoryOptions[0], createdBy: 'Sarah Lee', parentPath: 'lp-comment-letters' },
  { id: 'lp2', name: 'BurgundyPension_Comment_Letter.pdf', size: 987654, type: 'application/pdf', uploadedAt: new Date('2026-02-17'), category: categoryOptions[0], createdBy: 'Emily Zhang', parentPath: 'lp-comment-letters' },
  { id: 'lp3', name: 'CrimsonSWF_Redline.docx', size: 567890, type: 'application/docx', uploadedAt: new Date('2026-02-15'), category: categoryOptions[0], createdBy: 'Harvey', parentPath: 'lp-comment-letters' },
  { id: 'lp4', name: 'FernSWF_Markup.docx', size: 456789, type: 'application/docx', uploadedAt: new Date('2026-02-12'), category: categoryOptions[0], createdBy: 'Michael Ross', parentPath: 'lp-comment-letters' },
  { id: 'lp5', name: 'BronzePension_Redline.docx', size: 345678, type: 'application/docx', uploadedAt: new Date('2026-02-10'), category: categoryOptions[0], createdBy: 'Sarah Lee', parentPath: 'lp-comment-letters' },
  { id: 'lp6', name: 'LP_Summary_Comparison.xlsx', size: 234567, type: 'application/xlsx', uploadedAt: new Date('2026-02-08'), category: categoryOptions[3], createdBy: 'Harvey', parentPath: 'lp-comment-letters' },
  // Corporate Governance folder contents
  { id: 'cg-f1', name: 'Board Resolutions', size: 0, type: 'folder', uploadedAt: new Date('2026-01-28'), createdBy: 'Michael Ross', parentPath: 'corporate-governance', slug: 'board-resolutions', itemCount: 3 },
  { id: 'cg1', name: 'Articles_of_Incorporation.pdf', size: 2345678, type: 'application/pdf', uploadedAt: new Date('2026-01-25'), category: categoryOptions[0], createdBy: 'Emily Zhang', parentPath: 'corporate-governance' },
  { id: 'cg2', name: 'Bylaws_Amended_2026.docx', size: 1234567, type: 'application/docx', uploadedAt: new Date('2026-01-22'), category: categoryOptions[0], createdBy: 'Michael Ross', parentPath: 'corporate-governance' },
  { id: 'cg3', name: 'Officer_Certificate.pdf', size: 567890, type: 'application/pdf', uploadedAt: new Date('2026-01-20'), category: categoryOptions[4], createdBy: 'Sarah Lee', parentPath: 'corporate-governance' },
  { id: 'cg4', name: 'Shareholder_Agreement.pdf', size: 3456789, type: 'application/pdf', uploadedAt: new Date('2026-01-18'), category: categoryOptions[0], createdBy: 'Harvey', parentPath: 'corporate-governance' },
  { id: 'cg5', name: 'Corporate_Structure_Chart.xlsx', size: 456789, type: 'application/xlsx', uploadedAt: new Date('2026-01-15'), category: categoryOptions[4], createdBy: 'Emily Zhang', parentPath: 'corporate-governance' },
  // Board Resolutions sub-folder
  { id: 'br1', name: 'Resolution_2026_001.pdf', size: 234567, type: 'application/pdf', uploadedAt: new Date('2026-01-27'), category: categoryOptions[4], createdBy: 'Michael Ross', parentPath: 'corporate-governance/board-resolutions' },
  { id: 'br2', name: 'Resolution_2025_012.pdf', size: 345678, type: 'application/pdf', uploadedAt: new Date('2025-12-15'), category: categoryOptions[4], createdBy: 'Emily Zhang', parentPath: 'corporate-governance/board-resolutions' },
  { id: 'br3', name: 'Resolution_2025_011.pdf', size: 456789, type: 'application/pdf', uploadedAt: new Date('2025-11-20'), category: categoryOptions[4], createdBy: 'Michael Ross', parentPath: 'corporate-governance/board-resolutions' },
];

const suggestedItems: UploadedFile[] = [
  allFiles.find(f => f.id === '1')!,
  allFiles.find(f => f.id === 'dd6')!,
  allFiles.find(f => f.id === 'f1')!,
  allFiles.find(f => f.id === 'f3')!,
  allFiles.find(f => f.id === '4')!,
  allFiles.find(f => f.id === 'f2')!,
];

const peopleWithAccess = [
  { id: '1', email: 'emily.zhang@company.com', access: 'Edit access', initial: 'E' },
  { id: '2', email: 'michael.ross@compliance.com', access: 'View access', initial: 'M' },
  { id: '3', email: 'sarah.lee@company.com', access: 'Edit access', initial: 'S' },
  { id: '4', email: 'auditor@pwc.com', access: 'View access', initial: 'A' },
];

const activities = [
  { id: '1', type: 'share', user: 'emily.zhang@company.com', action: 'shared this vault with', target: 'auditor@pwc.com', time: '1d ago' },
  { id: '2', type: 'upload', user: 'sarah.lee@company.com', action: 'uploaded', target: '156 files', time: '2d ago' },
  { id: '3', type: 'rename', user: 'emily.zhang@company.com', action: 'renamed from', target: 'Q1 Audit to Regulatory Compliance Audit', time: '5d ago' },
  { id: '4', type: 'create', user: 'emily.zhang@company.com', action: 'created this collection', time: '1w ago' },
];

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

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
}

export default function FilesPage() {
  const router = useRouter();
  const params = useParams();
  
  // Derive current path from URL params
  const pathSegments = params?.path ? (Array.isArray(params.path) ? params.path : [params.path]) : [];
  const currentPath = pathSegments.join('/');
  const isRoot = currentPath === '';
  
  // Load user-saved files from localStorage
  const [savedFiles, setSavedFiles] = useState<UploadedFile[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem('harvey-saved-files');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedFiles(parsed.map((f: Record<string, unknown>) => ({
          ...f,
          uploadedAt: new Date(f.uploadedAt as string),
        })));
      } catch { /* ignore */ }
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'harvey-saved-files' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSavedFiles(parsed.map((f: Record<string, unknown>) => ({
            ...f,
            uploadedAt: new Date(f.uploadedAt as string),
          })));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  // Merge static + saved files
  const mergedFiles = useMemo(() => [...allFiles, ...savedFiles], [savedFiles]);
  
  // Organized folders from AI grouping
  const [organizedFolders, setOrganizedFolders] = useState<UploadedFile[]>([]);
  const [groupedFileIds, setGroupedFileIds] = useState<Set<string>>(new Set());
  
  // Filter files for current path
  const currentFiles = useMemo(() => [
    ...mergedFiles.filter(f => f.parentPath === currentPath && !groupedFileIds.has(f.id)),
    ...organizedFolders.filter(f => f.parentPath === currentPath),
  ], [mergedFiles, currentPath, organizedFolders, groupedFileIds]);
  
  // Build breadcrumb segments
  const breadcrumbs = useMemo(() => {
    if (isRoot) return [];
    const segments: { label: string; href: string }[] = [{ label: 'All files', href: '/files' }];
    let accumulated = '';
    for (const seg of pathSegments) {
      accumulated = accumulated ? `${accumulated}/${seg}` : seg;
      const folder = mergedFiles.find(f => f.type === 'folder' && f.slug === seg && f.parentPath === (accumulated.includes('/') ? accumulated.substring(0, accumulated.lastIndexOf('/')) : (pathSegments.indexOf(seg) === 0 ? '' : accumulated)));
      segments.push({ label: folder?.name || seg, href: `/files/${accumulated}` });
    }
    return segments;
  }, [isRoot, pathSegments, mergedFiles]);
  
  // Current folder name (for non-root views)
  const currentFolderName = useMemo(() => {
    if (isRoot) return 'All files';
    const lastSlug = pathSegments[pathSegments.length - 1];
    const parentOfLast = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : '';
    const folder = mergedFiles.find(f => f.type === 'folder' && f.slug === lastSlug && f.parentPath === parentOfLast);
    return folder?.name || lastSlug;
  }, [isRoot, pathSegments, mergedFiles]);
  
  // File/folder counts for current view
  const folderCount = currentFiles.filter(f => f.type === 'folder').length;
  const fileCount = currentFiles.filter(f => f.type !== 'folder').length;
  
  // Organize files state
  const [isOrganizingFiles, setIsOrganizingFiles] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleOrganizeFiles = useCallback(() => {
    if (isOrganizingFiles) return;
    setIsOrganizingFiles(true);

    setTimeout(() => {
      setIsOrganizingFiles(false);

      const filesInCurrentPath = mergedFiles.filter(f => f.parentPath === currentPath && f.type !== 'folder');
      const existingFolders = mergedFiles.filter(f => f.parentPath === currentPath && f.type === 'folder');
      const existingFolderNames = new Set(existingFolders.map(f => f.name));

      // Group by common name patterns in file names
      const nameGroups: Record<string, UploadedFile[]> = {};
      const patterns = ['Supply Agreement', 'License Agreement', 'Comment Letter', 'Side Letter', 'Resolution', 'Compliance', 'Audit Report'];
      
      filesInCurrentPath.forEach(f => {
        const matchedPattern = patterns.find(p => f.name.replace(/_/g, ' ').includes(p));
        if (matchedPattern) {
          const groupName = matchedPattern.endsWith('s') ? matchedPattern : matchedPattern + 's';
          if (!nameGroups[groupName]) nameGroups[groupName] = [];
          nameGroups[groupName].push(f);
        }
      });

      const newFolders: UploadedFile[] = [];
      const newGroupedIds = new Set<string>();
      Object.entries(nameGroups).forEach(([groupName, files]) => {
        if (files.length >= 2 && !existingFolderNames.has(groupName)) {
          newFolders.push({
            id: `org-${Date.now()}-${toSlug(groupName)}`,
            name: groupName,
            size: 0,
            type: 'folder',
            uploadedAt: new Date(),
            createdBy: 'Harvey',
            parentPath: currentPath,
            slug: toSlug(groupName),
            itemCount: files.length,
          });
          files.forEach(f => newGroupedIds.add(f.id));
        }
      });

      if (newFolders.length > 0) {
        setOrganizedFolders(newFolders);
        setGroupedFileIds(newGroupedIds);
      }
    }, 4000);
  }, [isOrganizingFiles, currentPath]);

  // Folder summary state
  const [summaryState, setSummaryState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [summaryText, setSummaryText] = useState('');
  
  const folderSummaries: Record<string, string> = {
    'due-diligence-reports': 'This folder contains 8 due diligence documents including supply agreements from Aquametals, Macrogenics, GNC, and Delta Inventory, license agreements from Carvana and AIG, and two data files (KLK_tempe and vo_lottie CSV exports). The documents span February 2026 and primarily relate to commercial supply chain and licensing arrangements.',
    'lp-comment-letters': 'This folder contains 6 LP comment letters and markups from limited partners including UmberPension, BurgundyPension, CrimsonSWF, FernSWF, and BronzePension, along with a summary comparison spreadsheet. The documents relate to Fund V LPA negotiations and were submitted between February 8-19, 2026.',
    'corporate-governance': 'This folder contains 5 corporate governance documents and 1 sub-folder of board resolutions. Key documents include the Articles of Incorporation, Amended Bylaws (2026), Officer Certificate, Shareholder Agreement, and Corporate Structure Chart. The board resolutions sub-folder contains 3 resolutions spanning November 2025 to January 2026.',
  };

  const handleSummarizeFolder = useCallback(() => {
    if (summaryState !== 'idle') return;
    setSummaryState('loading');
    setSummaryText('');
    
    const fullText = folderSummaries[currentPath] || `This folder contains ${fileCount} files${folderCount > 0 ? ` and ${folderCount} sub-folders` : ''}. The documents cover various topics and were uploaded across multiple dates.`;
    
    setTimeout(() => {
      setSummaryState('done');
      setSummaryText(fullText);
    }, 2500);
  }, [summaryState, currentPath, fileCount, folderCount]);

  // Reset summary and organized folders when navigating to a different folder
  useEffect(() => {
    setSummaryState('idle');
    setSummaryText('');
    setOrganizedFolders([]);
    setGroupedFileIds(new Set());
  }, [currentPath]);
  
  // Suggestions carousel scroll ref
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Suggestions carousel scroll state
  const [showLeftCarouselGradient, setShowLeftCarouselGradient] = useState(false);
  const [showRightCarouselGradient, setShowRightCarouselGradient] = useState(true);
  
  useEffect(() => {
    const el = suggestionsRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowLeftCarouselGradient(el.scrollLeft > 0);
      setShowRightCarouselGradient(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };
    el.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isRoot]);

  // Configuration panel state (details drawer) - closed by default
  const [isConfigPanelCollapsed, setIsConfigPanelCollapsed] = useState(true);

  // Multi-chat state
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  
  // Chat panel state - hidden by default
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  
  // View mode state - persisted across navigations
  const [viewMode, setViewModeState] = useState<"list" | "grid">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('files-view-mode') as "list" | "grid") || "list";
    }
    return "list";
  });
  const setViewMode = useCallback((mode: "list" | "grid") => {
    setViewModeState(mode);
    localStorage.setItem('files-view-mode', mode);
  }, []);
  
  // File table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  
  // Navigate into a folder
  const navigateToFolder = useCallback((file: UploadedFile) => {
    if (file.type !== 'folder' || !file.slug) return;
    const newPath = currentPath ? `${currentPath}/${file.slug}` : file.slug;
    router.push(`/files/${newPath}`);
  }, [currentPath, router]);
  
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
    if (selectedRows.size === currentFiles.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentFiles.map(f => f.id)));
    }
  }, [currentFiles, selectedRows.size]);
  
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
    columnHelper.accessor('createdBy', {
      header: 'Created by',
      cell: info => (
        <span className="text-sm text-fg-subtle leading-5">{info.getValue()}</span>
      ),
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
    data: currentFiles,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  const allRows = table.getRowModel().rows;
  
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
  
  // Chat panel resize state
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

  // Send message from chat panel
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

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('compliance') || lowerQuery.includes('finding')) {
      return "Based on the documents in your files, I can help you analyze the compliance findings. The collection contains 156 files including policy documents, audit reports, regulatory correspondence, and evidence files. Would you like me to generate a compliance summary or identify areas requiring immediate attention?";
    } else if (lowerQuery.includes('gap') || lowerQuery.includes('risk') || lowerQuery.includes('issue')) {
      return "I've identified several compliance gaps based on the uploaded documents:\n\n1. **Data Privacy**: GDPR documentation needs updating for new processing activities\n2. **SOX Controls**: Two control deficiencies noted in Q4 testing\n3. **AML Procedures**: Customer due diligence documentation incomplete for 3 accounts\n\nWould you like me to draft a remediation plan for any of these areas?";
    } else if (lowerQuery.includes('checklist') || lowerQuery.includes('audit')) {
      return "Based on the regulatory requirements, here's the audit checklist status:\n\n• **Data Protection**: 85% complete - pending privacy impact assessments\n• **Financial Controls**: 92% complete - minor documentation gaps\n• **Operational Risk**: 78% complete - policies under review\n• **Third-Party Management**: 70% complete - vendor assessments in progress\n\nWould you like me to generate detailed action items for any category?";
    }
    
    return `I'm analyzing the documents in your files related to "${query}". Based on the available materials, I can help you with regulatory analysis, policy review, or audit preparation. What specific aspect would you like me to focus on?`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'share': return Share2;
      case 'upload': return Upload;
      case 'rename': return Edit3;
      case 'create': return FileIcon;
      default: return MessageSquare;
    }
  };

  // Handle resize mouse down
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Resize effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
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

  const isInChatMode = chatThreads.length > 0;
  
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      
      <SidebarInset>
        <div className="h-screen flex bg-bg-base">
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Page Header - top nav bar */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border-base shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-fg-base" style={{ padding: '4px 6px' }}>Files</span>
              </div>
              <div className="flex items-center gap-2">
                {!isChatPanelOpen && (
                  <button 
                    onClick={() => setIsChatPanelOpen(true)}
                    className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
                  >
                    <SvgIcon src="/central_icons/Assistant.svg" alt="Open chat" width={16} height={16} className="text-fg-base" />
                  </button>
                )}
                {isConfigPanelCollapsed && (
                  <button 
                    onClick={() => setIsConfigPanelCollapsed(false)}
                    className="h-7 w-7 flex items-center justify-center border border-border-base rounded-[6px] hover:bg-bg-subtle transition-colors"
                  >
                    <SvgIcon src="/central_icons/RightSidebar.svg" alt="Expand drawer" width={16} height={16} className="text-fg-base" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Main Content Panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Content header: breadcrumb + title + actions */}
              <div className="px-6 pt-6 pb-4 shrink-0">
                {/* Breadcrumb (folder views only) */}
                {!isRoot && breadcrumbs.length > 0 && (
                  <div className="flex items-center gap-1 mb-1">
                    {breadcrumbs.map((crumb, i) => (
                      <div key={crumb.href} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="w-3 h-3 text-fg-muted" />}
                        {i < breadcrumbs.length - 1 ? (
                          <button
                            onClick={() => router.push(crumb.href)}
                            className="text-xs text-fg-muted hover:text-fg-base transition-colors"
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span className="text-xs text-fg-muted">{crumb.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-lg font-medium text-fg-base leading-7">{currentFolderName}</h1>
                    <span className="text-sm text-fg-muted">
                      {fileCount > 0 && `${fileCount.toLocaleString()} file${fileCount !== 1 ? 's' : ''}`}
                      {fileCount > 0 && folderCount > 0 && ' · '}
                      {folderCount > 0 && `${folderCount} folder${folderCount !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="medium" className="gap-1.5">
                      <FolderPlus className="h-4 w-4" />
                      Create folder
                    </Button>
                    <Button variant="default" size="medium" className="gap-1.5">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Folder Summary */}
              <AnimatePresence>
                {summaryState !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="mx-6 mb-4 px-4 py-3 shrink-0 overflow-hidden bg-bg-subtle rounded-lg"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img src="/harvey-glyph.png" alt="Harvey" className="w-4 h-4 rounded-[3px] shrink-0" />
                          {summaryState === 'loading' ? (
                            <TextShimmer duration={1.5} spread={3} className="text-xs">
                              Summarizing...
                            </TextShimmer>
                          ) : (
                            <span className="text-xs text-fg-subtle">AI summary</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setSummaryState('idle'); setSummaryText(''); }}
                          className="h-6 px-2 text-xs font-medium text-fg-muted rounded-md hover:text-fg-base hover:bg-bg-subtle transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                      {summaryState === 'done' && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className="text-sm text-fg-base leading-5"
                        >
                          {summaryText}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggested files & folders (root only) */}
              {isRoot && (
                <div className="px-6 pb-4 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-fg-muted">Suggested files & folders</span>
                      <Eye className="w-4 h-4 text-fg-muted" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => suggestionsRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                        className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-fg-muted" />
                      </button>
                      <button
                        onClick={() => suggestionsRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                        className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-bg-subtle transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-fg-muted" />
                      </button>
                    </div>
                  </div>
                  <div className="relative" style={{ height: '68px' }}>
                    <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showLeftCarouselGradient ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showRightCarouselGradient ? 'opacity-100' : 'opacity-0'}`} />
                    <div
                      ref={suggestionsRef}
                      className="absolute inset-x-0 top-0 flex gap-3 overflow-x-auto"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {suggestedItems.map((item) => {
                        const isFolder = item.type === 'folder';
                        const ext = item.name.split('.').pop()?.toUpperCase() || '';
                        return (
                          <div
                            key={item.id}
                            className="flex items-center w-[280px] h-[68px] shrink-0 rounded-lg border border-border-base hover:border-border-strong transition-colors cursor-pointer overflow-hidden"
                            onClick={() => isFolder ? navigateToFolder(item) : undefined}
                          >
                            <div className="w-[80px] h-full flex items-center justify-center bg-bg-subtle shrink-0">
                              {isFolder ? (
                                <img src="/folderIcon.svg" alt="" className="w-8 h-8" />
                              ) : (
                                <div className="relative w-[30px] h-[40px]">
                                  <div className="absolute inset-0 bg-white rounded-[3px] border border-black/[0.06] shadow-xs" />
                                  <div className="absolute top-[1px] left-[-2px] w-[30px] h-[40px] bg-white rounded-[3px] border border-black/[0.06] shadow-xs" />
                                  <div className="absolute top-[-2px] left-[-4px] w-[30px] h-[40px] bg-white rounded-[3px] border border-black/[0.06] shadow-xs overflow-hidden p-1.5">
                                    <div className="space-y-[3px]">
                                      <div className="h-[2px] bg-fg-disabled/20 rounded-full w-[70%]" />
                                      <div className="h-[2px] bg-fg-disabled/20 rounded-full w-full" />
                                      <div className="h-[2px] bg-fg-disabled/20 rounded-full w-[85%]" />
                                      <div className="h-[2px] bg-fg-disabled/20 rounded-full w-full" />
                                      <div className="h-[2px] bg-fg-disabled/20 rounded-full w-[60%]" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 px-3 py-3">
                              <p className="text-sm font-medium text-fg-base leading-5 truncate">{item.name}</p>
                              <p className="text-xs text-fg-muted leading-4">
                                {isFolder ? `Folder · ${item.itemCount || 0} items` : `${ext} · ${formatFileSize(item.size)}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar - fixed above scroll area */}
              <div className="flex items-center justify-between pt-2 pb-3 px-6 bg-bg-base shrink-0">
                  <div className="relative h-[28px] flex items-center">
                    <AnimatePresence mode="wait">
                      {selectedRows.size > 0 ? (
                        <motion.div
                          key="actions"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                          <span className="text-sm font-medium text-fg-base whitespace-nowrap">
                            {selectedRows.size} file{selectedRows.size !== 1 ? 's' : ''} selected
                          </span>
                          <div className="h-5 w-px bg-border-base" />
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            <ArrowRightFromLine className="w-4 h-4" />
                            Move files
                          </button>
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            <FilePlus2 className="w-4 h-4" />
                            Create files
                          </button>
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Delete files
                          </button>
                          <button className="h-[28px] w-[28px] text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center justify-center hover:bg-bg-subtle transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="filters"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                          {!isRoot && (
                            <>
                              {organizedFolders.length === 0 && (
                                <button 
                                  onClick={handleOrganizeFiles}
                                  disabled={isOrganizingFiles}
                                  className="h-[28px] px-2 text-sm font-medium text-[#5f3ba5] bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Organize my files
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}
                              {summaryState === 'idle' && (
                                <button 
                                  onClick={handleSummarizeFolder}
                                  className="h-[28px] px-2 text-sm font-medium text-[#5f3ba5] bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors"
                                >
                                  Summarize folder
                                  <BookOpen className="w-4 h-4" />
                                </button>
                              )}
                              <div className="h-5 w-px bg-border-base" />
                            </>
                          )}
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            Starred
                            <Star className="w-4 h-4" />
                          </button>
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            Type
                            <ChevronDown className="w-4 h-4 text-fg-muted" />
                          </button>
                          <button className="h-[28px] px-2 text-sm font-medium text-fg-base bg-bg-base rounded-[6px] border border-border-base flex items-center gap-1.5 hover:bg-bg-subtle transition-colors">
                            Extension
                            <ChevronDown className="w-4 h-4 text-fg-muted" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* List/Grid view toggle */}
                  <div className="flex items-center gap-1">
                    <AnimatedBackground
                      defaultValue={viewMode}
                      onValueChange={(value) => value && setViewMode(value as "list" | "grid")}
                      className="bg-bg-subtle rounded-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <button
                        data-id="list"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <img src="/central_icons/List.svg" alt="List" className="w-[14px] h-[14px] dark:invert" />
                      </button>
                      <button
                        data-id="grid"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <img src="/central_icons/Dot Grid.svg" alt="Grid" className="w-[14px] h-[14px] dark:invert" />
                      </button>
                    </AnimatedBackground>
                  </div>
              </div>

              {/* Scrollable content area */}
              <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overflow-x-hidden px-6 relative">
                {/* Organize files overlay — aligned to table area */}
                {isOrganizingFiles && (
                  <div className="absolute z-30 pointer-events-none" style={{ top: '40px', bottom: '8px', left: '10px', right: '10px', borderRadius: '8px' }}>
                    <div 
                      className="absolute inset-0"
                      style={{ border: '2px solid var(--color-violet-600, #7c3aed)', borderRadius: '8px' }}
                    />
                    <div 
                      className="absolute inset-0 animate-grouping-shimmer"
                      style={{ borderRadius: '8px' }}
                    />
                    <div 
                      className="absolute flex items-center gap-1.5 px-2 py-1 rounded-md font-medium text-white"
                      style={{ top: '4px', left: '4px', backgroundColor: 'var(--color-violet-600, #7c3aed)', fontSize: '12px', lineHeight: '16px', zIndex: 31 }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Organizing files...</span>
                    </div>
                  </div>
                )}
                {/* List View */}
                {viewMode === "list" && (
                <div className="flex flex-col w-full">
                  {/* Header Row */}
                  <div className="flex items-center h-10 border-b border-border-base sticky top-0 bg-bg-base z-20">
                    <div className="flex items-center h-full pr-3 py-3 shrink-0">
                      <button
                        onClick={toggleAllRows}
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                          selectedRows.size > 0 ? 'border-bg-interactive bg-bg-interactive' : 'border-border-strong bg-bg-base hover:border-fg-muted'
                        }`}
                      >
                        {selectedRows.size === currentFiles.length && currentFiles.length > 0 && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {selectedRows.size > 0 && selectedRows.size < currentFiles.length && (
                          <div className="w-2 h-0.5 bg-white rounded-full" />
                        )}
                      </button>
                    </div>
                    <button className="flex-[2] min-w-0 flex items-center gap-2 h-full px-1 py-3 cursor-pointer group overflow-hidden" onClick={() => table.getColumn('name')?.toggleSorting()}>
                      <span className="text-xs font-medium text-fg-subtle leading-4 truncate">Name</span>
                      {table.getColumn('name')?.getIsSorted() && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={table.getColumn('name')?.getIsSorted() === 'desc' ? 'rotate-180' : ''}>
                          <path d="M3 5L6 8L9 5" stroke="#848079" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <button className="flex-1 min-w-0 flex items-center gap-2 h-full px-1 py-3 cursor-pointer overflow-hidden" onClick={() => table.getColumn('category')?.toggleSorting()}>
                      <span className="text-xs font-medium text-fg-muted leading-4">Category</span>
                    </button>
                    <div className="w-[120px] flex items-center gap-2 h-full px-1 py-3 shrink-0">
                      <span className="text-xs font-medium text-fg-muted leading-4">Created by</span>
                    </div>
                    <button className="w-[140px] flex items-center gap-2 h-full px-1 py-3 cursor-pointer shrink-0" onClick={() => table.getColumn('uploadedAt')?.toggleSorting()}>
                      <span className="text-xs font-medium text-fg-muted leading-4">Last modified</span>
                    </button>
                    <div className="w-[90px] flex items-center gap-2 h-full px-1 py-3 shrink-0">
                      <span className="text-xs font-medium text-fg-muted leading-4">Size</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    {allRows.map(row => {
                      const file = row.original;
                      const isSelected = selectedRows.has(file.id);
                      const isHovered = hoveredRowId === file.id;
                      
                      return (
                        <div 
                          key={row.id}
                          className="flex items-center h-10 border-b border-border-base relative group cursor-pointer"
                          onMouseEnter={() => setHoveredRowId(file.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          onClick={() => file.type === 'folder' && navigateToFolder(file)}
                        >
                          {isHovered && (
                            <div 
                              className="absolute inset-y-[-1px] -left-4 -right-4 bg-bg-base-hover rounded-lg pointer-events-none"
                              style={{ zIndex: 0 }}
                            />
                          )}
                          <div className="flex items-center h-full pr-3 py-3 shrink-0 z-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRowSelection(file.id); }}
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
                          
                          <div className="flex-[2] min-w-0 flex items-center gap-2 h-full px-1 py-3 overflow-hidden z-10">
                            {(() => {
                              const cell = row.getVisibleCells().find(c => c.column.id === 'name');
                              return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                            })()}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex items-center h-full px-1 py-3 overflow-hidden z-10">
                            {(() => {
                              const cell = row.getVisibleCells().find(c => c.column.id === 'category');
                              return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                            })()}
                          </div>
                          
                          <div className="w-[120px] flex items-center h-full px-1 py-3 shrink-0 z-10">
                            {(() => {
                              const cell = row.getVisibleCells().find(c => c.column.id === 'createdBy');
                              return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                            })()}
                          </div>
                          
                          <div className="w-[140px] flex items-center h-full px-1 py-3 shrink-0 z-10">
                            {(() => {
                              const cell = row.getVisibleCells().find(c => c.column.id === 'uploadedAt');
                              return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                            })()}
                          </div>
                          
                          <div className="w-[90px] flex items-center h-full px-1 py-3 shrink-0 z-10">
                            {(() => {
                              const cell = row.getVisibleCells().find(c => c.column.id === 'size');
                              return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
                            })()}
                          </div>
                          
                          {isHovered && (
                            <div className="absolute -right-4 top-0 bottom-0 flex items-center pr-4 z-20">
                              <div className="absolute inset-y-0 bg-gradient-to-r from-transparent to-bg-base-hover pointer-events-none" style={{ right: '100%', width: '64px' }} />
                              <div className="absolute inset-0 bg-bg-base-hover rounded-r-lg pointer-events-none" />
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
                                    <TooltipContent side="top"><p>Move</p></TooltipContent>
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
                                    <TooltipContent side="top"><p>Download</p></TooltipContent>
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
                                    <TooltipContent side="top"><p>Rename</p></TooltipContent>
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
                                    <TooltipContent side="top"><p>Delete</p></TooltipContent>
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
                )}

                {/* Grid View */}
                {viewMode === "grid" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
                  {currentFiles.map((file) => {
                    const iconSrc = getFileIconPath(file.name, file.type);
                    const isFolder = file.type === 'folder';
                    return (
                      <div key={file.id} className="cursor-pointer group" onClick={() => isFolder && navigateToFolder(file)}>
                        <div 
                          className="w-full rounded-lg flex items-center justify-center mb-2.5 relative overflow-hidden" 
                          style={{ height: '162px', backgroundColor: 'var(--bg-subtle)', transition: 'background-color 0.3s ease' }}
                        >
                          <div className="absolute inset-0 bg-transparent group-hover:bg-bg-subtle-hover transition-colors pointer-events-none" />
                          {isFolder ? (
                            <div 
                              className="w-[72px] h-[72px] relative z-10"
                              style={{
                                backgroundColor: '#CCCAC6',
                                WebkitMaskImage: 'url(/folderIcon.svg)',
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskImage: 'url(/folderIcon.svg)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                              }}
                            />
                          ) : (
                            <div className="relative z-10 w-[90px] h-[120px] bg-white dark:bg-neutral-800 rounded shadow-xs border border-black/[0.04] dark:border-white/[0.08] p-3 overflow-hidden">
                              <div className="space-y-[5px]">
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[70%]" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[85%]" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[60%]" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[75%]" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[50%]" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-full" />
                                <div className="h-[3px] bg-fg-disabled/20 rounded-full w-[80%]" />
                              </div>
                              <img src={iconSrc} alt="" className="absolute bottom-1.5 right-1.5 w-6 h-6 object-contain" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-fg-base leading-tight m-0 truncate">{file.name}</p>
                          <p className="text-xs text-fg-muted leading-tight m-0">
                            {isFolder ? 'Folder' : `${formatFileSize(file.size)}${file.category ? ` · ${file.category.label}` : ''}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                {/* Chat Header */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ height: '52px' }}>
                  <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 max-w-[calc(100%-48px)]" style={{ flexWrap: 'nowrap' }}>
                    {chatThreads.length === 0 ? (
                      <span
                        className="text-sm font-medium rounded-md text-fg-base bg-bg-subtle whitespace-nowrap"
                        style={{ padding: '4px 8px' }}
                      >
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
                  <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
                  <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${showBottomGradient ? 'opacity-100' : 'opacity-0'}`} />
                  
                  <div 
                    ref={messagesContainerRef}
                    className={`flex-1 overflow-y-auto overflow-x-hidden px-5 pt-8 pb-4 ${!isInChatMode ? 'flex items-center justify-center' : ''}`}
                  >
                    <div className="mx-auto w-full" style={{ maxWidth: '740px' }}>
                      {!isInChatMode ? (
                        <div className="flex flex-col items-center justify-center gap-6 py-3">
                          <div className="w-full max-w-[624px] px-3 flex flex-col gap-0.5">
                            <h1 className="text-[18px] font-medium leading-[24px] tracking-[-0.3px] text-fg-base">
                              Welcome to Files
                            </h1>
                            <p className="text-sm leading-5 text-fg-subtle">
                              This is your file workspace. What would you like to work on?
                            </p>
                          </div>

                          <div className="w-full max-w-[624px] flex flex-col">
                            <div className="px-3 pb-3">
                              <p className="text-xs leading-4 text-fg-muted">Get started…</p>
                            </div>
                            
                            <div className="flex flex-col">
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
                        messages.map((message, index) => (
                          <div key={index} className={`${index !== messages.length - 1 ? 'mb-6' : ''}`}>
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
                                      <div className="text-sm text-fg-base leading-relaxed pl-2 whitespace-pre-wrap">
                                        {message.content}
                                      </div>
                                      
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
                
                {/* Chat Input */}
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
                          <img src="/folderIcon.svg" alt="Files" className="w-3 h-3" />
                          <span className="text-[12px] font-medium text-[#848079] dark:text-[#a8a5a0] leading-[16px]">Files</span>
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
                                <span>Search across your files…</span>
                                <span>Summarize a document…</span>
                                <span>Compare two files…</span>
                                <span>Extract key information…</span>
                                <span>Generate a report…</span>
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
          
          {/* Right Panel - Details */}
          <div className={`${isConfigPanelCollapsed ? 'w-0 border-l-0' : 'w-[400px] border-l'} border-border-base flex flex-col bg-bg-base transition-all duration-200 ease-linear flex-shrink-0 overflow-hidden`}>
            <div className="w-[400px] flex flex-col h-full">
              <div className="pl-[20px] pr-[14px] pt-[12px] pb-[8px] flex items-center justify-between">
                <span className="text-sm font-medium text-fg-base leading-[20px]">Details</span>
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
                        <span className="text-xs text-fg-base leading-[16px] flex-1">35 files, 3 folders (42.3 MB)</span>
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
                        Provide Harvey with relevant instructions and information for queries within this workspace.
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
