"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GripVertical, ArrowLeft, Layers, UserPlus, Check, X, Download, Upload, ChevronRight, ChevronDown } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnResizeMode,
  RowData,
} from '@tanstack/react-table';
import ReviewTableToolbar from "@/components/review-table-toolbar";
import { Button, SmallButton } from "@/components/ui/button";
import ReviewFilterBar, { FilterableColumn, DisplayColumn, ActiveFilter } from "@/components/review-filter-bar";
import ShareArtifactDialog from "@/components/share-artifact-dialog";
import ExportReviewDialog from "@/components/export-review-dialog";
import IManageFilePickerDialog from "@/components/imanage-file-picker-dialog";
import ReviewTableActionBar from "@/components/review-table-action-bar";
import ManageGroupedFilesDialog from "@/components/manage-grouped-files-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BatchColumnsDialog from "@/components/batch-columns-dialog";
import ReviewTableViewBar, { View } from "@/components/review-table-view-bar";
import CreateViewDialog from "@/components/create-view-dialog";
import Image from "next/image";
import { SvgIcon } from "@/components/svg-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TextShimmer } from "../../components/motion-primitives/text-shimmer";

// Extend column meta type for draggable property
declare module '@tanstack/table-core' {
   
  interface ColumnMeta<TData extends RowData, TValue> {
    draggable?: boolean;
  }
}

// SVG Icon Components
const PdfHarveyIcon = ({ className }: { className?: string }) => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
  >
    <path
      d='M6 1.25H13.7578C14.487 1.25012 15.1865 1.54005 15.7021 2.05566L19.9443 6.29785C20.46 6.81347 20.7499 7.51301 20.75 8.24219V20C20.75 21.5188 19.5188 22.75 18 22.75H6C4.48122 22.75 3.25 21.5188 3.25 20V4C3.25 2.48122 4.48122 1.25 6 1.25Z'
      fill='#FAFAF9'
      stroke='#CCCAC6'
      strokeWidth='0.5'
    />
    <path
      d='M7.77703 17C9.56757 17 12.4054 9.90541 12.4054 7.81081C12.4054 7.37162 12.0338 7 11.6284 7C11.223 7 10.9527 7.50676 10.9527 8.08108C10.9527 11.6622 14.7365 14.5 16.1892 14.5C16.5781 14.5 17 14.3649 17 13.8243C17 13.2838 16.4595 12.9797 15.8176 12.9797C12.4054 12.9797 7 15.1081 7 16.3243C7 16.7635 7.30405 17 7.77703 17Z'
      stroke='#E7000B'
      strokeWidth='1.25'
    />
  </svg>
);

const TypeIcon = ({ className }: { className?: string }) => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 18 18'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={`text-fg-muted ${className || ''}`}
  >
    <path
      d='M3 4.5V3H9M9 3H15V4.5M9 3V15M9 15H7.5M9 15H10.5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SelectionIcon = ({ className }: { className?: string }) => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 18 18'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={`text-fg-muted ${className || ''}`}
  >
    <path
      d='M5.65721 7.12331L6.50096 7.68585L7.9047 5.81418M10.5434 6.75H12.0434M10.5 11.25H12M5.65721 11.6242L6.50096 12.1867L7.9047 10.315M3.75 15H14.25C14.6642 15 15 14.6642 15 14.25V3.75C15 3.33579 14.6642 3 14.25 3H3.75C3.33579 3 3 3.33579 3 3.75V14.25C3 14.6642 3.33579 15 3.75 15Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <SvgIcon 
    src="/central_icons/File.svg" 
    alt="File" 
    width={14} 
    height={14} 
    className={className || "text-fg-subtle"} 
  />
);

type Document = {
  id: number;
  selected: boolean;
  fileName: string;
  agreementParties: string;
  forceMajeureClause: 'Disputed' | 'Not Disputed' | 'Somewhat Disputed';
  assignmentProvisionSummary: string;
  groupedCount?: number;
  // Folder support
  isFolder?: boolean;
  isExpanded?: boolean;
  parentFolderId?: number;
  childFileIds?: number[];
  originalFolderId?: string;
};

interface SelectedFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  modifiedDate: string;
  size?: string;
  path: string;
}

const columnHelper = createColumnHelper<Document>();

// We'll define columns inside the component to access textWrap state

// Streaming cell component with TextShimmer animation
const StreamingCell = React.memo(({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) => {
  // Track if we've transitioned from loading to loaded to trigger animation only once
  const hasAnimatedRef = React.useRef(false);
  const wasLoadingRef = React.useRef(isLoading);
  
  // Only animate if we're transitioning from loading to loaded
  const shouldAnimate = wasLoadingRef.current && !isLoading && !hasAnimatedRef.current;
  
  React.useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      hasAnimatedRef.current = true;
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);
  
  if (isLoading) {
    return (
      <div className='flex items-center justify-between'>
        <div style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
          <TextShimmer duration={1.5} spread={2}>
            Generating output...
          </TextShimmer>
        </div>
        <div className='relative flex items-center justify-center ml-2'>
          <motion.div
            className='w-3 h-3 bg-fg-disabled rounded-full'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className='absolute w-1.5 h-1.5 bg-fg-base rounded-full'></div>
        </div>
      </div>
    );
  }

  // Only use animation if we just transitioned from loading
  if (shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }
  
  // Already loaded, no animation needed
  return <>{children}</>;
});

StreamingCell.displayName = 'StreamingCell';

interface ReviewArtifactPanelProps {
  selectedArtifact: { title: string; subtitle: string } | null;
  isEditingArtifactTitle: boolean;
  editedArtifactTitle: string;
  onEditedArtifactTitleChange: (value: string) => void;
  onStartEditingTitle: () => void;
  onSaveTitle: () => void;
  onClose: () => void;
  chatOpen: boolean;
  onToggleChat: (open: boolean) => void;
  shareArtifactDialogOpen: boolean;
  onShareArtifactDialogOpenChange: (open: boolean) => void;
  exportReviewDialogOpen: boolean;
  onExportReviewDialogOpenChange: (open: boolean) => void;
  artifactTitleInputRef: React.RefObject<HTMLInputElement | null>;
  isEmpty?: boolean;
  showBackButton?: boolean;
  selectedFiles?: SelectedFile[];
  onFilesSelected?: (files: SelectedFile[]) => void;
  batchAddColumnsRef?: React.MutableRefObject<((cols: { title: string; query: string; type: string }[]) => void) | null>;
}

// Stable empty array to avoid re-renders when selectedFiles prop is not provided
const EMPTY_FILES_ARRAY: SelectedFile[] = [];

const PANEL_ANIMATION = {
  duration: 0.3,
  ease: "easeOut" as const
};

export default function ReviewArtifactPanel({
  selectedArtifact,
  isEditingArtifactTitle,
  editedArtifactTitle,
  onEditedArtifactTitleChange,
  onStartEditingTitle,
  onSaveTitle,
  onClose,
  chatOpen,
  onToggleChat,
  shareArtifactDialogOpen,
  onShareArtifactDialogOpenChange,
  exportReviewDialogOpen,
  onExportReviewDialogOpenChange,
  artifactTitleInputRef,
  isEmpty = false,
  showBackButton = false,
  selectedFiles = EMPTY_FILES_ARRAY,
  onFilesSelected,
  batchAddColumnsRef
}: ReviewArtifactPanelProps) {
  const [alignment, setAlignment] = React.useState<'top' | 'center' | 'bottom'>('center');
  const [textWrap, setTextWrap] = React.useState<boolean>(false);
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);
  const [isScrolledHorizontally, setIsScrolledHorizontally] = React.useState(false);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = React.useState<string | null>(null);
  const draggedColumnRef = React.useRef<string | null>(null);
  const [hoveredHeader, setHoveredHeader] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [iManageDialogOpen, setIManageDialogOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Document[]>([]);
  const [manageGroupedFilesRowId, setManageGroupedFilesRowId] = React.useState<number | null>(null);
  const [addColumnPopoverOpen, setAddColumnPopoverOpen] = React.useState(false);
  const [expandedFolders, setExpandedFolders] = React.useState<Set<number>>(new Set());
  const fileColumnRef = React.useRef<HTMLTableCellElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [addColumnPopoverPosition, setAddColumnPopoverPosition] = React.useState({ top: 0, left: 0 });
  
  // File grouping animation state
  const [isGroupingFiles, setIsGroupingFiles] = React.useState(false);
  const groupingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [groupingOverlayDimensions, setGroupingOverlayDimensions] = React.useState({ width: 0, height: 0, left: 0, top: 0 });
  
  // Grouping acceptance state - tracks all rows pending acceptance
  const [pendingGroupRowIds, setPendingGroupRowIds] = React.useState<Set<number>>(new Set());
  const preGroupingDataRef = React.useRef<Document[] | null>(null);
  
  // Add column popover state
  const [columnQuestion, setColumnQuestion] = React.useState('');
  const [columnHeader, setColumnHeader] = React.useState('');
  const [isGeneratingHeader, setIsGeneratingHeader] = React.useState(false);
  const [hasStartedTyping, setHasStartedTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [selectedModel, setSelectedModel] = React.useState('auto');
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);
  const [pendingColumnId, setPendingColumnId] = React.useState<string | null>(null);
  const [batchColumnsDialogOpen, setBatchColumnsDialogOpen] = React.useState(false);
  
  // View bar state
  const [views, setViews] = React.useState<View[]>([
    { id: 'all', name: 'All', isDefault: true }
  ]);
  const [activeViewId, setActiveViewId] = React.useState('all');
  const [createViewDialogOpen, setCreateViewDialogOpen] = React.useState(false);
  
  // Filters per view - stored as a ref to avoid re-renders when switching views
  const viewFiltersRef = React.useRef<Record<string, ActiveFilter[]>>({
    'all': []
  });
  
  // Dynamic columns state - only stores structure, not data
  interface DynamicColumn {
    id: string;
    header: string;
    question: string;
    visible: boolean;
  }
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  
  // Cell data stored in ref to avoid re-renders - columnId -> rowId -> { isLoading, response }
  const cellDataRef = React.useRef<Record<string, Record<number, { isLoading: boolean; response: string }>>>({});
  
  // Force update counter for individual cells - columnId -> rowId -> updateCount
  const [cellUpdateTriggers, setCellUpdateTriggers] = useState<Record<string, Record<number, number>>>({});
  
  // Update popover position when it opens - align with the pending column's header
  React.useEffect(() => {
    if (addColumnPopoverOpen && pendingColumnId && tableContainerRef.current) {
      const popoverWidth = 400;
      const allCols = table.getAllColumns();
      const pendingColIndex = allCols.findIndex(c => c.id === pendingColumnId);
      const thElements = tableContainerRef.current.querySelectorAll('thead th');
      const pendingTh = pendingColIndex >= 0 ? thElements[pendingColIndex] : null;

      let top = 0;
      let left = 0;

      if (pendingTh) {
        const rect = pendingTh.getBoundingClientRect();
        top = rect.bottom + 4;
        left = rect.left + 4;
      } else if (fileColumnRef.current) {
        const rect = fileColumnRef.current.getBoundingClientRect();
        top = rect.bottom + 4;
        left = rect.right + 4;
      }

      left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));
      top = Math.max(8, top);

      setAddColumnPopoverPosition({ top, left });
    }
   
  }, [addColumnPopoverOpen, pendingColumnId]);
  
  // Reset popover state when closed - remove pending column if not run
  React.useEffect(() => {
    if (!addColumnPopoverOpen) {
      // Remove the pending column if it wasn't "run"
      if (pendingColumnId) {
        setDynamicColumns(prev => prev.filter(c => c.id !== pendingColumnId));
        setPendingColumnId(null);
      }
      setColumnQuestion('');
      setColumnHeader('');
      setIsGeneratingHeader(false);
      setHasStartedTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
   
  }, [addColumnPopoverOpen]);
  
  // Handle question input change with debounced header generation
  const handleQuestionChange = (value: string) => {
    setColumnQuestion(value);
    
    if (value.length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
    }
    
    if (value.length === 0) {
      setHasStartedTyping(false);
      setColumnHeader('');
      setIsGeneratingHeader(false);
      return;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Start skeleton loading
    setIsGeneratingHeader(true);
    setColumnHeader('');
    
    // Simulate header generation after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      // Generate a header based on the question (simplified simulation)
      const generatedHeader = generateHeaderFromQuestion(value);
      setColumnHeader(generatedHeader);
      setIsGeneratingHeader(false);
    }, 1000);
  };
  
  // Simple function to generate a header from a question
  const generateHeaderFromQuestion = (question: string): string => {
    // Remove common question words and create a title
    const cleanedQuestion = question
      .replace(/^(what|who|when|where|why|how|is|are|does|do|can|will|should)\s+/i, '')
      .replace(/\?$/, '')
      .trim();
    
    // Capitalize first letter of each word and truncate
    const words = cleanedQuestion.split(' ').slice(0, 4);
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Mock responses for dynamic columns (simulating AI-generated content)
  const generateMockResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('date') || q.includes('signing') || q.includes('effective')) {
      const dates = ['January 15, 2024', 'March 3, 2023', 'December 1, 2022', 'August 22, 2023', 'November 8, 2024', 'February 14, 2023', 'July 4, 2022', 'September 30, 2023', 'April 19, 2024', 'October 11, 2023', 'May 5, 2023', 'June 28, 2024'];
      return dates[Math.floor(Math.random() * dates.length)];
    }
    if (q.includes('term') || q.includes('duration')) {
      const terms = ['12 months from execution date', '24 months', '36 months with automatic renewal for successive 12-month periods unless terminated by either party with 90 days written notice', '5 years', '10 years from the closing date', 'Perpetual, subject to termination provisions in Section 8', 'Until terminated by mutual agreement', '18 months with option to extend'];
      return terms[Math.floor(Math.random() * terms.length)];
    }
    if (q.includes('value') || q.includes('amount') || q.includes('price') || q.includes('consideration')) {
      const values = ['$1,500,000 in cash at closing, plus an additional earn-out of up to $500,000 based on performance milestones', '$250,000', '$5,000,000 aggregate consideration consisting of $3.2M cash and $1.8M in stock', '$750,000 payable in three equal installments', '$2,300,000', 'Undisclosed', '$450,000 plus assumption of approximately $120,000 in outstanding liabilities', '$8,200,000'];
      return values[Math.floor(Math.random() * values.length)];
    }
    if (q.includes('party') || q.includes('parties') || q.includes('acquiror') || q.includes('target') || q.includes('who')) {
      const parties = [
        'Acme Corporation (Acquiror) and GlobalTech Inc. (Target)', 
        'Valar AI, Inc.', 
        'Unicorn Capital Partners LLC, as administrative agent, and Nkomati Claims Management Ltd., as borrower',
        'Not specified in document',
        'TerreStar 1.4 Holdings LLC (Lessor), TerreStar Networks Inc. (Lessee), and Harbinger Capital Partners (Guarantor)',
        'Multiple parties including the Company, the Investors (as defined in Schedule A), and the Placement Agent',
        'Litigation Holdings Corp.',
      ];
      return parties[Math.floor(Math.random() * parties.length)];
    }
    if (q.includes('clause') || q.includes('provision') || q.includes('section')) {
      const clauses = [
        'Section 7.2 contains a standard force majeure clause covering acts of God, war, terrorism, pandemic, and governmental action. The clause requires written notice within 5 business days.',
        'Clause present in agreement — see Article IV, Section 4.3(b)',
        'No such provision found in this document',
        'The agreement contains a broad non-compete provision restricting the seller for 3 years within a 50-mile radius',
        'Standard representations and warranties as set forth in Sections 3.1 through 3.24, with survival period of 18 months post-closing',
        'See section 4.2 for details',
        'The indemnification provision caps liability at the lesser of $2M or the total consideration paid, subject to a deductible basket of $150,000',
      ];
      return clauses[Math.floor(Math.random() * clauses.length)];
    }
    if (q.includes('govern') || q.includes('jurisdiction') || q.includes('law')) {
      const laws = ['State of Delaware', 'New York', 'State of California', 'England and Wales', 'State of Texas', 'Singapore', 'Governed by the laws of the State of New York without regard to conflicts of law principles'];
      return laws[Math.floor(Math.random() * laws.length)];
    }
    // Default varied responses
    const defaults = [
      'Information extracted from document — the relevant provisions are found in Exhibit B, which outlines the operational requirements and compliance obligations applicable to both parties.',
      'See section 4.2 for details',
      'Clause present in agreement',
      'Not specified in document',
      'The document references multiple related agreements including the Side Letter dated January 10, 2023 and the Amendment No. 2 to the Credit Agreement',
      'Yes — subject to customary conditions precedent including regulatory approval and third-party consents',
      'No applicable provision identified after reviewing all sections of the agreement',
      'Omnis hic dignissimos repellendus incidunt tempore sunt. Magni null corrupti dolores quia et.',
      'Per Section 9.1, the agreement may be terminated by either party upon 30 days written notice in the event of a material breach that remains uncured',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  };
  
  // Handle running a column - updates the pending column with real data
  const handleRunColumn = useCallback(() => {
    if (!columnHeader || !columnQuestion || !pendingColumnId) return;
    
    const columnId = pendingColumnId;
    
    // Update the pending column with the real header and question
    setDynamicColumns(prev => prev.map(c => 
      c.id === columnId ? { ...c, header: columnHeader, question: columnQuestion } : c
    ));
    
    // Initialize cell data in ref (loading state, empty response)
    cellDataRef.current[columnId] = {};
    const initialTriggers: Record<number, number> = {};
    tableData.forEach(row => {
      cellDataRef.current[columnId][row.id] = { isLoading: true, response: '' };
      initialTriggers[row.id] = 0;
    });
    
    setCellUpdateTriggers(prev => ({ ...prev, [columnId]: initialTriggers }));
    
    // Clear pending so the close effect doesn't remove it
    setPendingColumnId(null);
    
    // Close the popover
    setAddColumnPopoverOpen(false);
    
    // Generate random delays for each row (not sequential)
    const baseDelay = 600; // Minimum delay
    const maxAdditionalDelay = 2500; // Random additional delay up to this
    
    tableData.forEach((row) => {
      // Random delay between baseDelay and baseDelay + maxAdditionalDelay
      const randomDelay = baseDelay + Math.random() * maxAdditionalDelay;
      
      // Generate mock response and reveal after random delay
      setTimeout(() => {
        const response = generateMockResponse(columnQuestion);
        
        // Update cell data in ref
        if (cellDataRef.current[columnId]) {
          cellDataRef.current[columnId][row.id] = { isLoading: false, response };
        }
        
        // Trigger only this specific cell to re-render
        setCellUpdateTriggers(prev => ({
          ...prev,
          [columnId]: { 
            ...prev[columnId], 
            [row.id]: (prev[columnId]?.[row.id] || 0) + 1 
          }
        }));
      }, randomDelay);
    });
  }, [columnHeader, columnQuestion, tableData]);

  // Handle batch adding multiple columns at once
  const handleBatchAddColumns = useCallback((batchCols: { title: string; query: string; type: string }[]) => {
    batchCols.forEach((col, idx) => {
      const columnId = `dynamic-${Date.now()}-${idx}`;
      const newColumn: DynamicColumn = {
        id: columnId,
        header: col.title,
        question: col.query,
        visible: true,
      };
      
      cellDataRef.current[columnId] = {};
      const initialTriggers: Record<number, number> = {};
      tableData.forEach(row => {
        cellDataRef.current[columnId][row.id] = { isLoading: true, response: '' };
        initialTriggers[row.id] = 0;
      });
      
      setDynamicColumns(prev => [...prev, newColumn]);
      setCellUpdateTriggers(prev => ({ ...prev, [columnId]: initialTriggers }));
      
      // Generate mock responses with staggered delays
      const baseDelay = 600 + idx * 300;
      const maxAdditionalDelay = 2500;
      
      tableData.forEach((row) => {
        const randomDelay = baseDelay + Math.random() * maxAdditionalDelay;
        setTimeout(() => {
          const response = generateMockResponse(col.query);
          if (cellDataRef.current[columnId]) {
            cellDataRef.current[columnId][row.id] = { isLoading: false, response };
          }
          setCellUpdateTriggers(prev => ({
            ...prev,
            [columnId]: { 
              ...prev[columnId], 
              [row.id]: (prev[columnId]?.[row.id] || 0) + 1 
            }
          }));
        }, randomDelay);
      });
    });
  }, [tableData]);

  React.useEffect(() => {
    if (batchAddColumnsRef) {
      batchAddColumnsRef.current = handleBatchAddColumns;
    }
    return () => {
      if (batchAddColumnsRef) {
        batchAddColumnsRef.current = null;
      }
    };
  }, [batchAddColumnsRef, handleBatchAddColumns]);
  
  // Transform selected files into table data format - only for initialization
  const initialData: Document[] = React.useMemo(() => {
    if (selectedFiles.length === 0) {
      // Return original mock data when no files selected
      return [
        {
          id: 1,
          selected: false,
          fileName: 'SEC_Filing_10-K_2023.pdf',
          agreementParties: 'TerreStar 1.4 Holdings LLC (Lessor), TerreStar...',
          forceMajeureClause: 'Disputed',
          assignmentProvisionSummary: 'No assignment without consent, except to wh...',
        },
        {
          id: 2,
          selected: false,
          fileName: 'C05763098.pdf',
          agreementParties: 'T-Mobile USA, Inc., DISH Purchasing Corporat...',
          forceMajeureClause: 'Somewhat Disputed',
          assignmentProvisionSummary: 'No assignment without prior written consent.',
        },
        {
          id: 3,
          selected: false,
          fileName: 'Probable Cause Hearing Transcripts...',
          agreementParties: 'SunSpark Technology Inc. (California corporati...',
          forceMajeureClause: 'Not Disputed',
          assignmentProvisionSummary: 'No assignment without consent, null if viola...',
        },
        {
          id: 4,
          selected: false,
          fileName: 'Delta Inventory Supply Agreement.pdf',
          agreementParties: 'Delta Airlines LLC (Georgia corporation)',
          forceMajeureClause: 'Not Disputed',
          assignmentProvisionSummary: 'No assignment without prior written consent.',
        },
        {
          id: 5,
          selected: false,
          fileName: 'menlo-shankar-PEO.pdf',
          agreementParties: 'Smith & Wesson Inc., Crimson Trace Corporati...',
          forceMajeureClause: 'Not Disputed',
          assignmentProvisionSummary: 'WKKC cannot assign the contract without Kel...',
        },
        {
          id: 6,
          selected: false,
          fileName: 'Deposition_Transcript_Jones.pdf',
          agreementParties: 'No information',
          forceMajeureClause: 'Disputed',
          assignmentProvisionSummary: 'No assignment without consent, except to wh...',
        },
        {
          id: 7,
          selected: false,
          fileName: 'Discovery_Request_21083.pdf',
          agreementParties: 'Ultragenyx Pharmaceutical Inc. (UGX), IOI Oleo...',
          forceMajeureClause: 'Disputed',
          assignmentProvisionSummary: 'Assignment allowed with conditions.',
        },
        {
          id: 8,
          selected: false,
          fileName: 'AD08912631234.pdf',
          agreementParties: 'No information',
          forceMajeureClause: 'Disputed',
          assignmentProvisionSummary: 'Assignment requires prior written consent.',
        },
        {
          id: 9,
          selected: false,
          fileName: 'tmp_lease_document2023621.pdf',
          agreementParties: "Pilgrim's Pride Corporation (Shipper), Pat Pilgri...",
          forceMajeureClause: 'Somewhat Disputed',
          assignmentProvisionSummary: 'No assignment without prior written consent.',
        },
        {
          id: 10,
          selected: false,
          fileName: 'policy_document_12_24_08.pdf',
          agreementParties: 'No information',
          forceMajeureClause: 'Somewhat Disputed',
          assignmentProvisionSummary: 'Assignment requires consent, with exception...',
        },
        {
          id: 11,
          selected: false,
          fileName: '2-23-20250207T001925Z-001.pdf',
          agreementParties: 'Seattle Genetics, Inc. and SAFC, an operating...',
          forceMajeureClause: 'Disputed',
          assignmentProvisionSummary: 'Assignment requires consent, with exception...',
        },
        {
          id: 12,
          selected: false,
          fileName: 'Plaintiff_Exhibit_List.pdf',
          agreementParties: 'Crown Electrokinetics Corp., Brandywine O...',
          forceMajeureClause: 'Not Disputed',
          assignmentProvisionSummary: "Company needs Aron's consent to assign; Aro...",
        },
      ];
    }
    
    // First pass: create folder id map and collect folder names
    const folders = selectedFiles.filter(file => file.type === 'folder');
    const folderIdMap = new Map<string, number>();
    const folderChildrenMap = new Map<number, number[]>();
    
    let currentId = 1;
    
    // Pre-assign IDs to folders
    folders.forEach((folder) => {
      const folderId = currentId++;
      folderIdMap.set(folder.name, folderId);
      folderChildrenMap.set(folderId, []);
    });
    
    // Calculate how many IDs to reserve for folders
    const folderCount = folders.length;
    currentId = folderCount + 1;
    
    // Pre-process files to determine parent folder relationships
    const fileParentMap = new Map<string, number>();
    selectedFiles.filter(file => file.type === 'file').forEach((file) => {
      for (const folder of folders) {
        if (file.path.includes(folder.name)) {
          const parentFolderId = folderIdMap.get(folder.name);
          if (parentFolderId !== undefined) {
            fileParentMap.set(file.id, parentFolderId);
          }
          break;
        }
      }
    });
    
    const result: Document[] = [];
    let fileRowNumber = 1; // Track file row numbers separately
    currentId = 1;
    
    // Process in original order, but insert child files right after their parent folders
    const processedFolders = new Set<string>();
    
    selectedFiles.forEach((item) => {
      if (item.type === 'folder') {
        // Add folder row
        const folderId = folderIdMap.get(item.name)!;
        result.push({
          id: folderId,
          selected: false,
          fileName: item.name,
          agreementParties: '',
          forceMajeureClause: 'Not Disputed' as const,
          assignmentProvisionSummary: '',
          isFolder: true,
          isExpanded: false,
          originalFolderId: item.id,
          childFileIds: [],
        });
        processedFolders.add(item.name);
        
        // Now add all child files of this folder right after
        const childFiles = selectedFiles.filter(f => 
          f.type === 'file' && fileParentMap.get(f.id) === folderId
        );
        
        childFiles.forEach((childFile) => {
          const fileId = folderCount + fileRowNumber;
          fileRowNumber++;
          
          // Update folder's childFileIds
          const folderRow = result.find(r => r.id === folderId);
          if (folderRow && folderRow.childFileIds) {
            folderRow.childFileIds.push(fileId);
          }
          
          result.push({
            id: fileId,
            selected: false,
            fileName: childFile.name,
            agreementParties: 'Processing...',
            forceMajeureClause: 'Not Disputed' as const,
            assignmentProvisionSummary: 'Analyzing document...',
            parentFolderId: folderId,
          });
        });
      } else {
        // Only add file if it doesn't have a parent folder (standalone file)
        const parentFolderId = fileParentMap.get(item.id);
        if (parentFolderId === undefined) {
          const fileId = folderCount + fileRowNumber;
          fileRowNumber++;
          
          result.push({
            id: fileId,
            selected: false,
            fileName: item.name,
            agreementParties: 'Processing...',
            forceMajeureClause: 'Not Disputed' as const,
            assignmentProvisionSummary: 'Analyzing document...',
          });
        }
      }
    });
    
    return result;
  }, [selectedFiles]);

  // Update tableData when initialData changes
  React.useEffect(() => {
    setTableData(initialData);
  }, [initialData]);

  // Active filters state
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
  
  // Handle switching views - load filters for the selected view
  const handleViewChange = React.useCallback((viewId: string) => {
    // Save current filters to the current view before switching
    viewFiltersRef.current[activeViewId] = activeFilters;
    
    // Switch to the new view
    setActiveViewId(viewId);
    
    // Load filters for the new view
    const viewFilters = viewFiltersRef.current[viewId] || [];
    setActiveFilters(viewFilters);
  }, [activeViewId, activeFilters]);
  
  // Handle creating a new view
  const handleCreateView = React.useCallback((name: string) => {
    const newView: View = {
      id: `view-${Date.now()}`,
      name,
      isDefault: false
    };
    
    // Initialize empty filters for the new view
    viewFiltersRef.current[newView.id] = [];
    
    setViews(prev => [...prev, newView]);
    
    // Save current filters before switching
    viewFiltersRef.current[activeViewId] = activeFilters;
    
    setActiveViewId(newView.id);
    setActiveFilters([]); // New view starts with no filters
  }, [activeViewId, activeFilters]);
  
  // Filter the data based on active filters and folder expansion state
  const filteredData = React.useMemo(() => {
    // First apply folder visibility filter
    const visibleData = tableData.filter(row => {
      // Folders are always visible
      if (row.isFolder) return true;
      // Files without a parent folder are always visible
      if (!row.parentFolderId) return true;
      // Files with a parent folder are only visible if the folder is expanded
      return expandedFolders.has(row.parentFolderId);
    });
    
    // Then apply active filters
    if (activeFilters.length === 0) return visibleData;
    
    return visibleData.filter(row => {
      // Check each active filter
      return activeFilters.every(filter => {
        // Skip filters with no values selected (show all)
        if (filter.values.length === 0) return true;
        
        let cellValue: string = '';
        
        if (filter.columnId === 'fileName') {
          cellValue = row.fileName;
        } else {
          // Get value from dynamic column data
          const columnData = cellDataRef.current[filter.columnId];
          if (columnData && columnData[row.id]) {
            cellValue = columnData[row.id].response || '';
          }
        }
        
        const matchesFilter = filter.values.some(filterValue => 
          cellValue.toLowerCase().includes(filterValue.toLowerCase()) ||
          filterValue.toLowerCase().includes(cellValue.toLowerCase()) ||
          cellValue === filterValue
        );
        
        // Apply condition logic
        if (filter.condition === 'is_any_of') {
          return matchesFilter;
        } else {
          // is_none_of
          return !matchesFilter;
        }
      });
    });
  }, [tableData, activeFilters, expandedFolders]);

  const data = filteredData;
  
  // Handle group files
  const handleGroupFiles = React.useCallback(() => {
    if (selectedRows.size === 0) return;
    
    // Get all selected row IDs
    const selectedIds = Array.from(selectedRows);
    
    // Find the first selected row
    const firstSelectedId = Math.min(...selectedIds);
    
    // Count how many rows to group (excluding the first one)
    const groupCount = selectedIds.length - 1;
    
    if (groupCount === 0) return; // Nothing to group if only one row selected
    
    // Update the data: keep only the first selected row, remove others, and add grouped count
    setTableData(prevData => 
      prevData
        .map(row => {
          if (row.id === firstSelectedId) {
            // Add the grouped count to the first selected row
            return { 
              ...row, 
              groupedCount: (row.groupedCount || 0) + groupCount 
            };
          }
          return row;
        })
        .filter(row => !selectedIds.includes(row.id) || row.id === firstSelectedId)
    );
    
    // Clear selection
    setSelectedRows(new Set());
  }, [selectedRows]);
  
  // Get vertical alignment style based on alignment prop
  const getVerticalAlign = () => {
    switch (alignment) {
      case 'center':
        return 'middle';
      case 'bottom':
        return 'bottom';
      default:
        return 'top';
    }
  };
  
  // Handle row selection
  const toggleRowSelection = React.useCallback((rowId: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);
  
  // Handle select all
  const toggleSelectAll = React.useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(row => row.id)));
    }
  }, [selectedRows.size, data]);
  
  // Handle clear selection
  const clearSelection = React.useCallback(() => {
    setSelectedRows(new Set());
  }, []);
  
  // Toggle folder expansion
  const toggleFolderExpansion = React.useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);
  
  // Handle accepting a single grouped row
  const handleAcceptGroupingRow = React.useCallback((rowId: number) => {
    setPendingGroupRowIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
    // Clear hover state so action bar disappears until re-hover
    setHoveredRow(null);
  }, []);
  
  // Handle rejecting a single grouped row - revert just that row
  const handleRejectGroupingRow = React.useCallback((rowId: number) => {
    if (preGroupingDataRef.current) {
      const originalRow = preGroupingDataRef.current.find(r => r.id === rowId);
      if (originalRow) {
        // Find the original children too
        const originalChildren = preGroupingDataRef.current.filter(r => r.parentFolderId === rowId);
        setTableData(prev => {
          // Remove the current grouped row
          const filtered = prev.filter(r => r.id !== rowId);
          // Find where to insert the original folder and children
          const insertIndex = prev.findIndex(r => r.id === rowId);
          // Insert original row and children at the correct position
          const result = [...filtered];
          result.splice(insertIndex >= 0 ? insertIndex : result.length, 0, originalRow, ...originalChildren);
          return result;
        });
      }
    }
    setPendingGroupRowIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
    // Clear hover state so action bar disappears until re-hover
    setHoveredRow(null);
  }, []);
  
  // Handle accepting all grouped files
  const handleAcceptGrouping = React.useCallback(() => {
    setPendingGroupRowIds(new Set());
    preGroupingDataRef.current = null;
    setSelectedRows(new Set());
  }, []);
  
  // Handle rejecting all grouped files - revert to original data
  const handleRejectGrouping = React.useCallback(() => {
    if (preGroupingDataRef.current) {
      setTableData(preGroupingDataRef.current);
    }
    setPendingGroupRowIds(new Set());
    preGroupingDataRef.current = null;
    setSelectedRows(new Set());
  }, []);
  
  // Handle automated file grouping (toolbar button)
  const handleAutomatedGrouping = React.useCallback(() => {
    if (isGroupingFiles) return;
    
    // Save current data before grouping
    preGroupingDataRef.current = [...tableData];
    
    setIsGroupingFiles(true);
    
    // Clear any existing timeout
    if (groupingTimeoutRef.current) {
      clearTimeout(groupingTimeoutRef.current);
    }
    
    // After 10 seconds, stop the grouping animation and perform grouping
    groupingTimeoutRef.current = setTimeout(() => {
      setIsGroupingFiles(false);
      
      const currentData = preGroupingDataRef.current || tableData;
      const result: Document[] = [];
      const processedIds = new Set<number>();
      const pendingIds = new Set<number>();
      
      // Process each row
      currentData.forEach(row => {
        // Skip if already processed (e.g., child files of a folder)
        if (processedIds.has(row.id)) return;
        
        // Handle folders - transform into grouped file rows
        if (row.isFolder && row.childFileIds && row.childFileIds.length > 0) {
          const childCount = row.childFileIds.length;
          
          // Mark child files as processed so they don't appear separately
          row.childFileIds.forEach(childId => processedIds.add(childId));
          
          // Transform folder into grouped file row
          const groupedRow: Document = {
            ...row,
            isFolder: false, // No longer a folder
            isExpanded: undefined,
            childFileIds: undefined,
            parentFolderId: undefined,
            groupedCount: childCount, // Number of files in the folder
          };
          
          result.push(groupedRow);
          processedIds.add(row.id);
          pendingIds.add(row.id);
        } else if (row.isFolder) {
          // Empty folder - just keep it as is but not as a folder
          result.push({
            ...row,
            isFolder: false,
            isExpanded: undefined,
            childFileIds: undefined,
          });
          processedIds.add(row.id);
        } else if (!row.parentFolderId) {
          // Standalone files (not children of folders) - keep as is
          result.push(row);
          processedIds.add(row.id);
        }
        // Child files with parentFolderId are skipped (they're grouped into the folder)
      });
      
      // Also handle ValarAI files grouping (original behavior)
      const valarAIFiles = result.filter(row => row.fileName.startsWith('ValarAI_'));
      if (valarAIFiles.length > 1) {
        const firstValarAI = valarAIFiles[0];
        const groupedCount = valarAIFiles.length - 1;
        
        // Create the grouped row
        const groupedRow = {
          ...firstValarAI,
          groupedCount: (firstValarAI.groupedCount || 0) + groupedCount
        };
        
        // Replace valarAI files with the grouped one
        const finalResult = result.filter(row => !row.fileName.startsWith('ValarAI_'));
        finalResult.unshift(groupedRow);
        
        // Add ValarAI grouped row to pending
        pendingIds.add(firstValarAI.id);
        
        setTableData(finalResult);
      } else {
        setTableData(result);
      }
      
      // Clear expanded folders since folders are now grouped
      setExpandedFolders(new Set());
      
      // Select all grouped rows and mark them as pending acceptance
      if (pendingIds.size > 0) {
        setPendingGroupRowIds(pendingIds);
        setSelectedRows(pendingIds); // Select ALL grouped rows
      }
    }, 10000);
  }, [isGroupingFiles, tableData]);
  
  // Update grouping overlay dimensions when grouping starts or table changes
  React.useEffect(() => {
    if (isGroupingFiles && tableContainerRef.current) {
      const container = tableContainerRef.current;
      const table = container.querySelector('table');
      if (table) {
        // Get the select column and fileName column widths
        const selectColumn = table.querySelector('colgroup col:nth-child(1)');
        const fileColumn = table.querySelector('colgroup col:nth-child(2)');
        const selectWidth = selectColumn ? parseInt(getComputedStyle(selectColumn).width) || 48 : 48;
        const fileWidth = fileColumn ? parseInt(getComputedStyle(fileColumn).width) || 220 : 220;
        // Get header height (32px default)
        const thead = table.querySelector('thead');
        const headerHeight = thead ? thead.offsetHeight : 32;
        // Height is table height minus header
        const height = table.offsetHeight - headerHeight;
        
        setGroupingOverlayDimensions({ width: fileWidth, height, left: selectWidth, top: headerHeight });
      }
    }
  }, [isGroupingFiles, tableData]);
  
  // Check if all rows are selected
  const isAllSelected = selectedRows.size === data.length && selectedRows.size > 0;
  
  // Check if we're in "files only" mode (files added from iManage but no query run yet)
  const isFilesOnlyMode = selectedFiles.length > 0;
  
  // Define base columns (select and fileName)
  const baseColumns = React.useMemo(() => [
    columnHelper.display({
      id: 'select',
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableResizing: false,
      header: () => (
        <div className='flex justify-center'>
          <input 
            type='checkbox' 
            className='custom-checkbox' 
            checked={isAllSelected}
            onChange={toggleSelectAll}
          />
        </div>
      ),
      cell: ({ row }) => {
        const isSelected = selectedRows.has(row.original.id);
        const isHovered = hoveredRow === row.original.id;
        const isFolder = row.original.isFolder;
        const isFolderExpanded = expandedFolders.has(row.original.id);
        const showCheckbox = isSelected || isHovered;
        
        // For folder rows: show chevron or checkbox on hover
        if (isFolder) {
          return (
            <div 
              className='flex justify-center h-full items-center'
              onClick={(e) => e.stopPropagation()}
            >
              {showCheckbox ? (
                <input
                  type='checkbox'
                  className='custom-checkbox'
                  checked={isSelected}
                  onChange={() => toggleRowSelection(row.original.id)}
                />
              ) : (
                <button
                  onClick={() => toggleFolderExpansion(row.original.id)}
                  className="flex items-center justify-center w-5 h-5 hover:bg-bg-subtle rounded transition-colors"
                >
                  {isFolderExpanded ? (
                    <ChevronDown size={14} className="text-fg-muted" />
                  ) : (
                    <ChevronRight size={14} className="text-fg-muted" />
                  )}
                </button>
              )}
            </div>
          );
        }
        
        // For file rows: show row number or checkbox
        // Calculate file row number (excluding folder rows)
        const fileRowNumber = data
          .slice(0, row.index + 1)
          .filter(r => !r.isFolder)
          .length;
        
        return (
          <div className='flex justify-center h-full items-center'>
            {showCheckbox ? (
              <input
                type='checkbox'
                className='custom-checkbox'
                checked={isSelected}
                onChange={() => toggleRowSelection(row.original.id)}
              />
            ) : (
              <span className="text-fg-muted">{fileRowNumber}</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('fileName', {
      header: () => (
        <div className='flex items-center gap-1 h-4'>
          <FileIcon />
          <span>File</span>
        </div>
      ),
      size: 260,
      minSize: 100,
      maxSize: 280,
      cell: ({ row }) => {
        const isHovered = hoveredRow === row.original.id;
        const hasGroupedFiles = row.original.groupedCount && row.original.groupedCount > 0;
        const isPendingAcceptance = pendingGroupRowIds.has(row.original.id);
        const isFolder = row.original.isFolder;
        const isChildFile = row.original.parentFolderId !== undefined;
        
        // For folder rows
        if (isFolder) {
          return (
            <div className='flex items-center gap-1.5 relative'>
              <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                <Image 
                  src="/folderIcon.svg" 
                  alt="Folder" 
                  width={14} 
                  height={14} 
                  className="flex-shrink-0" 
                />
                <span className='truncate text-fg-base font-medium'>{row.original.fileName}</span>
              </div>
            </div>
          );
        }
        
        // For file rows (with optional indentation for child files)
        return (
          <div className={`flex items-center gap-1.5 relative w-full ${isChildFile ? 'pl-4' : ''}`}>
            <div className={`flex items-center gap-1.5 ${hasGroupedFiles ? 'text-ui-violet-fg' : 'flex-1 min-w-0'}`}>
              {hasGroupedFiles ? (
                <SvgIcon 
                  src="/central_icons/Database - Filled.svg" 
                  alt="Grouped files" 
                  width={14} 
                  height={14}
                  className="text-ui-violet-fg"
                />
              ) : (
                <PdfHarveyIcon className='h-[14px] w-[14px] shrink-0' />
              )}
              <span className={`${hasGroupedFiles ? 'text-ui-violet-fg font-medium' : 'truncate border-b border-border-base text-fg-base'}`}>{row.original.fileName}</span>
            </div>
            {hasGroupedFiles && (
              <span 
                className='bg-ui-violet-bg text-ui-violet-fg font-medium shrink-0'
                style={{ 
                  padding: '0 3px',
                  fontSize: '12px',
                  borderRadius: '4px'
                }}
              >
                +{row.original.groupedCount}
              </span>
            )}
            
            {/* Hover Control Bar - Accept/Reject for pending, normal actions otherwise */}
            {isPendingAcceptance ? (
              <div className='absolute right-0 top-0 bottom-0 flex items-center pr-1 z-20'>
                <div className="absolute inset-y-0 bg-gradient-to-r from-transparent to-bg-base-hover pointer-events-none" style={{ right: '100%', width: '48px' }} />
                <div className="absolute inset-0 bg-bg-base-hover pointer-events-none" />
                <div className='flex items-center gap-0 relative z-10'>
                  {/* Reject button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectGroupingRow(row.original.id);
                    }}
                    className='w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors'
                    title="Reject grouping"
                  >
                    <X size={14} />
                  </button>
                  
                  {/* Accept button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptGroupingRow(row.original.id);
                    }}
                    className='w-7 h-7 flex items-center justify-center rounded-[7px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors'
                    title="Accept grouping"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ) : isHovered && (
              <div className='absolute top-0 bottom-0 flex items-center z-20' style={{ right: '-8px' }}>
                {/* Gradient fade */}
                <div className="absolute inset-y-0 bg-gradient-to-r from-transparent to-bg-base-hover pointer-events-none" style={{ right: '100%', width: '48px' }} />
                {/* Solid background behind buttons */}
                <div className="absolute inset-0 bg-bg-base-hover pointer-events-none" />
                <div className='flex items-center gap-0 relative z-10'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasGroupedFiles) {
                              setManageGroupedFilesRowId(row.original.id);
                            } else {
                              toggleRowSelection(row.original.id);
                            }
                          }}
                          className='w-6 h-6 flex items-center justify-center rounded-[6px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors'
                        >
                          <Layers size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{hasGroupedFiles ? 'Manage grouped files' : 'Group files'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Assign');
                          }}
                          className='w-6 h-6 flex items-center justify-center rounded-[6px] text-fg-subtle hover:text-fg-base hover:bg-black/5 transition-colors'
                        >
                          <UserPlus size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Assign</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        );
      },
    }),
  ], [isAllSelected, toggleSelectAll, selectedRows, hoveredRow, toggleRowSelection, pendingGroupRowIds, expandedFolders, toggleFolderExpansion, data]);
  
  // Define query columns (only shown when query has been run)
  const queryColumns = React.useMemo(() => [
    columnHelper.accessor('agreementParties', {
      header: ({ column }) => {
        const isHovered = hoveredHeader === column.id;
        const isDragging = draggedColumn === column.id;
        
        return (
                        <div className='flex items-center gap-1 h-4'>
            {(isHovered || isDragging) ? (
              <GripVertical 
                size={12} 
                className="cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg-subtle shrink-0" 
              />
            ) : (
              <TypeIcon className="shrink-0" />
            )}
            <span>Agreement Parties</span>
          </div>
        );
      },
      size: 325,
      minSize: 150,
      maxSize: 500,
      enableSorting: false,
      meta: {
        draggable: true
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span
            className={`block ${textWrap ? '' : 'truncate'} ${value === 'No information' ? 'text-fg-muted' : 'text-fg-base'}`}
            style={{ 
              whiteSpace: textWrap ? 'normal' : 'nowrap',
              wordBreak: textWrap ? 'break-word' : 'normal'
            }}
          >
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor('forceMajeureClause', {
      header: ({ column }) => {
        const isHovered = hoveredHeader === column.id;
        const isDragging = draggedColumn === column.id;
        
        return (
          <div className='flex items-center gap-1 h-4 overflow-hidden'>
            {(isHovered || isDragging) ? (
              <GripVertical 
                size={12} 
                className="cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg-subtle shrink-0" 
              />
            ) : (
              <SelectionIcon className="shrink-0" />
            )}
            <span className='truncate min-w-0'>Force Majeure Clause Reference</span>
          </div>
        );
      },
      size: 325,
      minSize: 150,
      maxSize: 400,
      enableSorting: false,
      meta: {
        draggable: true
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span className='inline-block px-2 py-1 rounded-[6px] bg-bg-subtle border border-border-base text-fg-base'>
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor('assignmentProvisionSummary', {
      header: ({ column }) => {
        const isHovered = hoveredHeader === column.id;
        const isDragging = draggedColumn === column.id;
        
        return (
                        <div className='flex items-center gap-1 h-4'>
            {(isHovered || isDragging) ? (
              <GripVertical 
                size={12} 
                className="cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg-subtle shrink-0" 
              />
            ) : (
              <TypeIcon className="shrink-0" />
            )}
            <span>Assignment Provision Summary</span>
          </div>
        );
      },
      size: 325,
      minSize: 150,
      maxSize: 500,
      enableSorting: false,
      meta: {
        draggable: true
      },
      cell: ({ getValue }) => (
        <span className={`block ${textWrap ? '' : 'truncate'}`} style={{
          whiteSpace: textWrap ? 'normal' : 'nowrap',
          wordBreak: textWrap ? 'break-word' : 'normal'
        }}>{getValue()}</span>
      ),
    }),
  ], [textWrap, hoveredHeader, draggedColumn]);
  
  // Memoized cell component that only re-renders when its specific data changes
  // Wrapped in useMemo to prevent recreation on parent re-renders
  const MemoizedDynamicCell = React.useMemo(() => {
    const Component = React.memo(({ 
      columnId, 
      rowId, 
      textWrapEnabled,
    }: { 
      columnId: string; 
      rowId: number; 
      textWrapEnabled: boolean;
      // updateTrigger is intentionally not used in render, just for triggering re-render
      updateTrigger?: number;
    }) => {
      const cellData = cellDataRef.current[columnId]?.[rowId];
      // If no cell data exists yet (pending column), show empty cell
      if (!cellData) {
        return <span className="text-fg-muted"></span>;
      }
      const { isLoading, response } = cellData;
      
      return (
        <StreamingCell isLoading={isLoading}>
          <span
            className={`block ${textWrapEnabled ? '' : 'truncate'} ${response === 'Not specified in document' ? 'text-fg-muted' : 'text-fg-base'}`}
            style={{ 
              whiteSpace: textWrapEnabled ? 'normal' : 'nowrap',
              wordBreak: textWrapEnabled ? 'break-word' : 'normal'
            }}
          >
            {response}
          </span>
        </StreamingCell>
      );
    });
    Component.displayName = 'MemoizedDynamicCell';
    return Component;
  }, []);
  
  // Create dynamic column definitions - stable, doesn't depend on hover/drag state
  // Only include visible columns
  const dynamicColumnDefs = React.useMemo(() => {
    return dynamicColumns.filter(col => col.visible).map(col => 
      columnHelper.display({
        id: col.id,
        header: () => {
          // Use CSS to show/hide the grip icon on hover instead of React state
          return (
            <div className='flex items-center gap-1 h-4 dynamic-column-header'>
              <GripVertical 
                size={12} 
                className="cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg-subtle shrink-0 grip-icon hidden" 
              />
              <TypeIcon className="shrink-0 type-icon" />
              <span className="truncate">{col.header}</span>
            </div>
          );
        },
        size: 300,
        minSize: 300,
        maxSize: 500,
        meta: {
          draggable: true
        },
        cell: ({ row }) => {
          // Get the update trigger for this specific cell to force re-render when needed
          const trigger = cellUpdateTriggers[col.id]?.[row.original.id] || 0;
          
          return (
            <MemoizedDynamicCell 
              columnId={col.id} 
              rowId={row.original.id}
              textWrapEnabled={textWrap}
              updateTrigger={trigger}
            />
          );
        },
      })
    );
  }, [dynamicColumns, cellUpdateTriggers, textWrap, MemoizedDynamicCell]);
  
  // Combine columns based on mode - only show query columns when NOT in files-only mode
  const columns = React.useMemo(() => {
    if (isFilesOnlyMode) {
      // When files are added but no columns run yet, show base columns plus any dynamic columns
      return [...baseColumns, ...dynamicColumnDefs];
    }
    return [...baseColumns, ...queryColumns, ...dynamicColumnDefs];
  }, [isFilesOnlyMode, baseColumns, queryColumns, dynamicColumnDefs]);
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange' as ColumnResizeMode,
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 50,
    },
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
  });

  return (
    <>
      <motion.div 
        initial={false}
        animate={{ width: '100%', opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{
          width: PANEL_ANIMATION,
          opacity: { duration: 0.15, ease: "easeOut" }
        }}
        className="flex-1 min-w-0 flex flex-col bg-bg-base overflow-x-hidden"
      >
        {/* Header */}
        <div className="px-3 py-4 border-b border-border-base bg-bg-base flex items-center justify-between" style={{ height: '52px' }}>
          <div className="flex items-center flex-1 min-w-0">
            {/* Back Button */}
            {showBackButton && (
              <>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-bg-subtle rounded-md transition-colors mr-1"
                >
                  <ArrowLeft size={16} className="text-fg-subtle" />
                </button>
                
                {/* Vertical Separator */}
                <div className="w-px bg-bg-subtle-pressed mr-3" style={{ height: '20px' }}></div>
              </>
            )}
            
            {/* Editable Artifact Title */}
            {isEditingArtifactTitle ? (
              <input
                ref={artifactTitleInputRef}
                type="text"
                value={editedArtifactTitle}
                onChange={(e) => onEditedArtifactTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveTitle();
                  }
                }}
                onFocus={(e) => {
                  // Move cursor to start and scroll to beginning
                  setTimeout(() => {
                    e.target.setSelectionRange(0, 0);
                    e.target.scrollLeft = 0;
                  }, 0);
                }}
                className="text-fg-base font-medium bg-bg-subtle border border-border-interactive outline-none px-2 py-1.5 -ml-1 rounded-md text-sm"
                style={{ 
                  width: `${Math.min(Math.max(editedArtifactTitle.length * 8 + 40, 120), 600)}px`,
                  height: '32px'
                }}
                autoFocus
              />
            ) : (
              <button
                onClick={onStartEditingTitle}
                className="text-fg-base font-medium px-2 py-1.5 -ml-1 rounded-md hover:bg-bg-subtle transition-colors cursor-pointer text-sm"
                style={{ height: '32px' }}
              >
                {selectedArtifact?.title || 'Artifact'}
              </button>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Export Button - matches Draft Artifact header style */}
            <Button 
              variant="outline" 
              size="medium" 
              className="gap-1.5"
              onClick={() => onExportReviewDialogOpenChange(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {/* Close Button - only show when chat is open (artifact context) */}
            {chatOpen && (
              <button 
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-bg-subtle transition-colors text-fg-subtle"
                title="Close artifact"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <ReviewTableToolbar
          chatOpen={chatOpen}
          onToggleChat={() => {
            console.log('Toggle button clicked, current state:', chatOpen);
            onToggleChat(!chatOpen);
          }}
          alignment={alignment}
          onAlignmentChange={setAlignment}
          textWrap={textWrap}
          onTextWrapChange={setTextWrap}
          hasFiles={isFilesOnlyMode}
          onAddColumn={() => {
            const colId = `dynamic-${Date.now()}`;
            const newCol: DynamicColumn = { id: colId, header: 'Untitled', question: '', visible: true };
            setDynamicColumns(prev => [...prev, newCol]);
            setPendingColumnId(colId);
            setAddColumnPopoverOpen(true);
          }}
          isGroupingFiles={isGroupingFiles}
          onGroupFiles={handleAutomatedGrouping}
          onBatchColumns={() => setBatchColumnsDialogOpen(true)}
        />
        
        {/* Filter Bar */}
        <ReviewFilterBar 
          columns={(() => {
            // Only show filter columns when we have files AND at least one dynamic column
            if (!isFilesOnlyMode || dynamicColumns.length === 0) return [];
            
            // Get unique file names from tableData
            const fileNames = tableData.map(row => row.fileName);
            
            const filterColumns: FilterableColumn[] = [
              { id: 'fileName', header: 'File name', type: 'file', values: fileNames },
            ];
            
            // Add dynamic columns with their unique values from cellDataRef
            dynamicColumns.forEach(col => {
              const columnData = cellDataRef.current[col.id] || {};
              const uniqueValues = [...new Set(
                Object.values(columnData)
                  .map(cell => cell.response)
                  .filter(val => val && val.trim() !== '')
              )];
              
              filterColumns.push({
                id: col.id,
                header: col.header,
                type: 'text',
                values: uniqueValues.length > 0 ? uniqueValues : ['No values yet'],
              });
            });
            
            return filterColumns;
          })()}
          displayColumns={(() => {
            // Only show display options when we have files AND at least one dynamic column
            if (!isFilesOnlyMode || dynamicColumns.length === 0) return [];
            
            const displayCols: DisplayColumn[] = [
              { id: 'fileName', header: 'File', visible: true, fixed: true },
            ];
            
            // Add dynamic columns
            dynamicColumns.forEach(col => {
              displayCols.push({
                id: col.id,
                header: col.header,
                visible: col.visible,
                fixed: false,
              });
            });
            
            return displayCols;
          })()}
          onToggleColumnVisibility={(columnId) => {
            setDynamicColumns(prev => prev.map(col => 
              col.id === columnId ? { ...col, visible: !col.visible } : col
            ));
          }}
          onReorderColumns={(newDisplayColumns) => {
            // Extract the new order of dynamic columns (excluding fixed ones)
            const newOrder = newDisplayColumns
              .filter(col => !col.fixed)
              .map(col => col.id);
            
            // Reorder dynamic columns based on the new order
            setDynamicColumns(prev => {
              const reordered: typeof prev = [];
              newOrder.forEach(id => {
                const col = prev.find(c => c.id === id);
                if (col) reordered.push(col);
              });
              return reordered;
            });
          }}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />
        
        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-bg-base flex flex-col" style={{ minHeight: 0 }}>
          {/* Table Area */}
          <div className="flex-1 min-w-0 bg-bg-base" style={{ minHeight: 0 }}>
          {isEmpty ? (
            /* Empty State */
            <div className="h-full relative bg-bg-base overflow-auto">
              {/* Table Header with File column */}
              <div className="border-b border-border-base">
                <div className="flex items-center">
                  {/* Checkbox column */}
                  <div className="w-[48px] h-8 flex items-center justify-center border-r border-border-base shrink-0">
                    <input type="checkbox" className="custom-checkbox" disabled />
                  </div>
                  
                  {/* File column header */}
                  <div className="px-3 h-8 flex items-center border-r border-border-base flex-1" style={{ minWidth: '220px' }}>
                    <div className="flex items-center gap-1">
                      <FileIcon />
                      <span className="text-xs font-medium text-fg-subtle">File</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add file row */}
              <div className="border-b border-border-base bg-bg-base hover:bg-bg-base-hover transition-colors cursor-pointer">
                <div className="flex items-center" style={{ height: '32px' }}>
                  {/* Plus icon in checkbox column */}
                  <div className="w-[48px] h-full flex items-center justify-center border-r border-border-base shrink-0 text-fg-subtle">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  
                  {/* Add file text */}
                  <div className="px-3 h-full flex items-center" style={{ width: '220px' }}>
                    <div className="flex items-center gap-1.5 text-fg-subtle">
                      <SvgIcon 
                        src="/central_icons/Add File.svg" 
                        alt="Add file" 
                        width={14} 
                        height={14}
                        className="text-fg-subtle"
                      />
                      <span className="font-medium" style={{ fontSize: '12px' }}>Add file</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Centered empty state content */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ top: '88px' }}>
                <div className="flex flex-col items-center" style={{ maxWidth: '420px' }}>
                  {/* Review Icon */}
                  <div>
                    <SvgIcon 
                      src="/central_icons/Review.svg" 
                      alt="Review" 
                      width={24} 
                      height={24} 
                      className="text-fg-muted" 
                    />
                  </div>
                  
                  {/* Heading */}
                  <h3 className="text-base font-medium text-fg-base mb-0.5">
                    Add documents to get started
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-fg-muted text-center mb-6" style={{ lineHeight: '20px' }}>
                    Upload files to run multiple queries at once — analyze, compare, and extract insights with Harvey’s purpose-built platform.
                  </p>
                  
                  {/* Upload Button */}
                  <Button 
                    variant="default"
                    size="medium"
                    className="mb-4 gap-1.5"
                  >
                    <Upload className="h-4 w-4" />
                    Upload files
                  </Button>
                  
                  {/* Divider Text */}
                  <p className="text-xs text-fg-muted mb-4">Or choose from</p>
                  
                  {/* Integration Options */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="medium"
                      className="gap-1.5"
                    >
                      <SvgIcon 
                        src="/central_icons/Vault.svg" 
                        alt="Vault" 
                        width={16} 
                        height={16}
                        className="text-fg-base"
                      />
                      Add from Vault
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="medium"
                      className="gap-1.5"
                      onClick={() => setIManageDialogOpen(true)}
                    >
                      <Image 
                        src="/imanage.svg" 
                        alt="iManage" 
                        width={16} 
                        height={16}
                      />
                      Add from iManage
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Table container */
            <div className="h-full relative">
              <div 
                ref={tableContainerRef}
                className={`absolute inset-0 ${isFilesOnlyMode && dynamicColumns.length === 0 ? 'overflow-x-hidden' : 'overflow-x-auto'} overflow-y-auto`}
                style={{ containerType: 'inline-size', '--table-width': `${table.getCenterTotalSize()}px` } as React.CSSProperties}
                onScroll={(e) => {
                  const scrollLeft = (e.target as HTMLElement).scrollLeft;
                  setIsScrolledHorizontally(scrollLeft > 0);
                }}
              >
              {/* Grouping Files Overlay */}
              {isGroupingFiles && (
                <div 
                  className="absolute pointer-events-none z-30"
                  style={{ 
                    width: groupingOverlayDimensions.width,
                    height: groupingOverlayDimensions.height || '100%',
                    left: groupingOverlayDimensions.left,
                    top: groupingOverlayDimensions.top
                  }}
                >
                  {/* Solid border */}
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      border: '2px solid var(--color-violet-600)',
                      borderRadius: '8px'
                    }}
                  />
                  
                  {/* Shimmer gradient overlay */}
                  <div 
                    className="absolute inset-0 animate-grouping-shimmer"
                    style={{ borderRadius: '8px' }}
                  />
                  
                  {/* Label badge - positioned at top-left of overlay */}
                  <div 
                    className="absolute flex items-center gap-1.5 px-2 py-1 rounded-md font-medium text-fg-on-color"
                    style={{ 
                      top: '4px',
                      left: '4px',
                      backgroundColor: 'var(--color-violet-600)',
                      fontSize: '12px',
                      lineHeight: '16px',
                      zIndex: 31,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <SvgIcon 
                      src="/central_icons/Layers - Filled.svg" 
                      alt="Layers" 
                      width={14} 
                      height={14}
                    />
                    <span>Grouping files...</span>
                  </div>
                </div>
              )}
              <table
              ref={tableRef}
              className={`border-separate border-spacing-0 ${
                table.getState().columnSizingInfo.isResizingColumn ? 'select-none cursor-col-resize' : ''
              }`} 
              style={{ width: table.getCenterTotalSize(), tableLayout: 'fixed' }}
            >
              <colgroup>
                {table.getAllColumns().map((column) => (
                  <col 
                    key={column.id} 
                    style={{ 
                      width: column.getSize()
                    }} 
                  />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-20 bg-bg-base">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        ref={header.id === 'fileName' ? fileColumnRef : undefined}
                        className={`px-3 h-8 text-left font-medium relative transition-colors text-fg-subtle ${
                          header.id === 'select' ? 'w-[48px]' : ''
                        } ${header.id === 'forceMajeureClause' ? 'w-[325px]' : ''} ${header.id === 'agreementParties' ? 'w-[325px]' : ''} ${header.id === 'assignmentProvisionSummary' ? 'w-[325px]' : ''} ${header.index !== 0 ? 'border-l border-border-base' : ''} ${header.index === headerGroup.headers.length - 1 ? 'border-r border-border-base' : ''} border-b border-border-base ${
                          header.column.columnDef.meta?.draggable && !header.id.startsWith('dynamic-') && draggedColumn === header.id ? 'bg-bg-subtle opacity-40' : 
                          header.column.columnDef.meta?.draggable && !header.id.startsWith('dynamic-') && hoveredHeader === header.id ? 'bg-bg-subtle' : 
                          'bg-bg-base'
                        } ${
                          header.column.columnDef.meta?.draggable ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${
                          dropTarget === header.id && draggedColumn !== header.id ? 'border-l-[2px] border-l-border-interactive' : ''
                        } ${
                          header.index === headerGroup.headers.length - 1 && isFilesOnlyMode ? 'extend-border-line' : ''
                        }`}
                        style={{
                          fontSize: '12px',
                          lineHeight: '16px',
                          width: header.column.getSize(),
                          position: header.id === 'select' || header.id === 'fileName' ? 'sticky' : 'relative',
                          left: header.id === 'select' ? 0 : header.id === 'fileName' ? 48 : undefined,
                          zIndex: header.id === 'select' || header.id === 'fileName' ? 25 : undefined,
                          boxShadow: header.id === 'fileName' && isScrolledHorizontally ? '4px 0 8px -2px rgba(0,0,0,0.06)' : undefined,
                          overflow: 'visible',
                        }}
                        onMouseEnter={() => {
                          if (header.column.columnDef.meta?.draggable && !header.id.startsWith('dynamic-')) {
                            setHoveredHeader(header.id);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!header.id.startsWith('dynamic-')) {
                            setHoveredHeader(null);
                          }
                        }}
                        draggable={header.column.columnDef.meta?.draggable && !table.getState().columnSizingInfo.isResizingColumn}
                        onDragStart={(e) => {
                          if (table.getState().columnSizingInfo.isResizingColumn) {
                            e.preventDefault();
                            return;
                          }
                          if (header.column.columnDef.meta?.draggable) {
                            if (columnOrder.length === 0) {
                              setColumnOrder(table.getAllColumns().map(col => col.id));
                            }
                            draggedColumnRef.current = header.id;
                            setDraggedColumn(header.id);
                            e.dataTransfer.effectAllowed = 'move';
                            // Create a properly visible off-screen element for the drag image
                            const th = e.currentTarget as HTMLElement;
                            const dragEl = document.createElement('div');
                            const text = th.textContent?.trim() || '';
                            dragEl.textContent = text;
                            Object.assign(dragEl.style, {
                              position: 'fixed',
                              top: '0px',
                              left: '0px',
                              padding: '4px 12px',
                              background: '#ffffff',
                              border: '1px solid #e5e3e0',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#6b6860',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              whiteSpace: 'nowrap',
                              zIndex: '99999',
                              pointerEvents: 'none',
                              transform: 'translate(-100%, -100%)',
                            });
                            document.body.appendChild(dragEl);
                            e.dataTransfer.setDragImage(dragEl, dragEl.offsetWidth / 2, 14);
                            setTimeout(() => { try { document.body.removeChild(dragEl); } catch {} }, 0);
                          }
                        }}
                        onDragEnd={() => {
                          draggedColumnRef.current = null;
                          setDraggedColumn(null);
                          setDropTarget(null);
                        }}
                        onDragOver={(e) => {
                          if (header.column.columnDef.meta?.draggable && draggedColumnRef.current && draggedColumnRef.current !== header.id) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDropTarget(header.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dropTarget === header.id) {
                            setDropTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDropTarget(null);
                          const dragged = draggedColumnRef.current;
                          if (!dragged || dragged === header.id || !header.column.columnDef.meta?.draggable) return;
                          const currentOrder = columnOrder.length > 0 
                            ? [...columnOrder] 
                            : table.getAllColumns().map(col => col.id);
                          const draggedColumnIndex = currentOrder.indexOf(dragged);
                          const targetColumnIndex = currentOrder.indexOf(header.id);
                          if (draggedColumnIndex !== -1 && targetColumnIndex !== -1) {
                            const [removed] = currentOrder.splice(draggedColumnIndex, 1);
                            currentOrder.splice(targetColumnIndex, 0, removed);
                            setColumnOrder(currentOrder);
                          }
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full cursor-col-resize select-none touch-none group"
                            style={{ width: '9px', transform: 'translateX(50%)', zIndex: 10 }}
                          >
                            {/* Visual line - spans table content height */}
                            <div
                              className={`absolute left-1/2 top-0 pointer-events-none ${
                                header.column.getIsResizing() 
                                  ? 'bg-fg-base opacity-100' 
                                  : 'bg-fg-base opacity-0 group-hover:opacity-100'
                              }`}
                              style={{
                                width: '1px',
                                transform: 'translateX(-50%)',
                                height: tableRef.current 
                                  ? `${tableRef.current.offsetHeight}px` 
                                  : '100%',
                              }}
                            />
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const isRowSelected = selectedRows.has(row.original.id);
                  const isRowHovered = hoveredRow === row.original.id;
                  const isPendingAcceptanceRow = pendingGroupRowIds.has(row.original.id);
                  const isFolder = row.original.isFolder;
                  return (
                    <tr 
                      key={row.id}
                      onMouseEnter={() => setHoveredRow(row.original.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={isFolder ? () => toggleFolderExpansion(row.original.id) : undefined}
                      className={`transition-colors relative ${isFolder ? 'cursor-pointer' : ''}`}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const cellPadding =
                          cell.column.id === 'fileName' ? 'px-3' : 'px-3';
                        const isSelectColumn = cell.column.id === 'select';
                        const isLastCell = cellIndex === row.getVisibleCells().length - 1;
                        const shouldExtendBorder = isLastCell && isFilesOnlyMode;
                        
                        return (
                        <td
                          key={cell.id}
                          className={`${cellPadding} ${textWrap ? 'py-2' : 'h-8'} ${isRowSelected ? 'bg-bg-base-hover' : isRowHovered ? 'bg-bg-base-hover' : 'bg-bg-base'} ${cell.column.id === 'forceMajeureClause' ? 'w-[325px]' : ''} ${cell.column.id === 'agreementParties' ? 'w-[325px]' : ''} ${cell.column.id === 'assignmentProvisionSummary' ? 'w-[325px]' : ''} ${cell.column.id !== table.getAllColumns()[0].id ? 'border-l border-border-base' : ''} ${isLastCell ? 'border-r border-border-base' : ''} border-b border-border-base relative ${shouldExtendBorder ? 'extend-border-line' : cell.column.id === 'fileName' ? '' : 'overflow-hidden'} ${isSelectColumn ? 'cursor-pointer' : ''}`}
                          style={{ 
                            fontSize: '12px', 
                            lineHeight: '16px',
                            verticalAlign: textWrap ? getVerticalAlign() : 'middle',
                            width: cell.column.getSize(),
                            position: cell.column.id === 'select' || cell.column.id === 'fileName' ? 'sticky' : undefined,
                            left: cell.column.id === 'select' ? 0 : cell.column.id === 'fileName' ? 48 : undefined,
                            zIndex: cell.column.id === 'select' || cell.column.id === 'fileName' ? 5 : undefined,
                            boxShadow: cell.column.id === 'fileName' && isScrolledHorizontally ? '4px 0 8px -2px rgba(0,0,0,0.06)' : undefined,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                          {/* Hover detection area extending to the right for files-only mode */}
                          {shouldExtendBorder && (
                            <div 
                              className="absolute top-0 bottom-0 cursor-default"
                              style={{ 
                                left: '100%',
                                width: '100vw',
                              }}
                              onMouseEnter={() => setHoveredRow(row.original.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            />
                          )}
                        </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
              </div>
              
            </div>
          )}
          </div>
          
          {/* View Bar - Fixed to bottom */}
          <ReviewTableViewBar
            views={views}
            activeViewId={activeViewId}
            onViewChange={handleViewChange}
            onAddView={() => setCreateViewDialogOpen(true)}
          />
        </div>
      </motion.div>

      {/* Dialogs */}
      <ShareArtifactDialog
        isOpen={shareArtifactDialogOpen}
        onClose={() => onShareArtifactDialogOpenChange(false)}
        artifactTitle={selectedArtifact?.title || 'Artifact'}
      />
      <ExportReviewDialog
        isOpen={exportReviewDialogOpen}
        onClose={() => onExportReviewDialogOpenChange(false)}
        artifactTitle={selectedArtifact?.title || 'Artifact'}
      />
      <IManageFilePickerDialog
        isOpen={iManageDialogOpen}
        onClose={() => setIManageDialogOpen(false)}
        onFilesSelected={(files) => {
          onFilesSelected?.(files);
        }}
      />
      
      {/* Action Bar */}
      <ReviewTableActionBar
        selectedCount={selectedRows.size}
        onClearSelection={clearSelection}
        onAssignTo={() => console.log('Assign to')}
        onGroupFiles={handleGroupFiles}
        onOpenInAssistant={() => console.log('Open in Assistant')}
        onDelete={() => console.log('Delete')}
        onExport={() => console.log('Export')}
      />
      
      {/* Manage Grouped Files Dialog */}
      <ManageGroupedFilesDialog
        isOpen={manageGroupedFilesRowId !== null}
        onClose={() => setManageGroupedFilesRowId(null)}
        parentFileName={
          data.find(row => row.id === manageGroupedFilesRowId)?.fileName || ''
        }
        groupedCount={
          data.find(row => row.id === manageGroupedFilesRowId)?.groupedCount || 0
        }
        onRemoveFile={(index) => {
          console.log('Remove file at index:', index);
          // TODO: Implement remove file from group
        }}
      />
      
      {/* Create View Dialog */}
      <CreateViewDialog
        isOpen={createViewDialogOpen}
        onClose={() => setCreateViewDialogOpen(false)}
        onCreateView={handleCreateView}
      />
      
      {/* Batch Columns Dialog */}
      <BatchColumnsDialog
        isOpen={batchColumnsDialogOpen}
        onClose={() => setBatchColumnsDialogOpen(false)}
        onAddColumns={handleBatchAddColumns}
      />

      {/* Add Column Popover */}
      {addColumnPopoverOpen && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setAddColumnPopoverOpen(false)}
        >
          <div 
            className="fixed bg-bg-base border border-border-base"
            style={{ 
              width: '400px',
              top: addColumnPopoverPosition.top,
              left: addColumnPopoverPosition.left,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
              borderRadius: '10px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header label */}
            <div style={{ padding: '8px 12px', paddingTop: '10px' }}>
              <p className="text-fg-muted" style={{ fontSize: '12px' }}>
                Get started by asking Harvey a question.
              </p>
            </div>
            
            {/* Question textarea container */}
            <div style={{ padding: '0 4px' }}>
              <div className="relative">
                <textarea
                  value={columnQuestion}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  placeholder="What is the signing date of this agreement?"
                  className="w-full bg-bg-subtle rounded-[8px] p-3 text-fg-base placeholder:text-fg-muted resize-none outline-none focus:ring-1 focus:ring-border-interactive text-sm"
                  style={{ 
                    minHeight: '120px',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
            
            {/* Expanded section - shows when user has started typing */}
            {hasStartedTyping && (
              <>
                <div className="border-t border-border-base" />
                {/* Helper text */}
                <div style={{ padding: '8px 12px' }}>
                  <p className="text-fg-muted" style={{ fontSize: '12px' }}>
                    Header and type are generated based on your question.
                  </p>
                </div>
                  
                {/* Bottom section with header input, type and model selectors */}
                <div className="flex flex-col" style={{ padding: '2px 0', gap: '2px' }}>
                  {/* Header input */}
                  <div style={{ padding: '0 4px' }}>
                    <div>
                      {isGeneratingHeader ? (
                        <div className="bg-bg-subtle rounded-[8px] animate-pulse" style={{ height: '32px' }} />
                      ) : (
                        <input
                          type="text"
                          value={columnHeader}
                          onChange={(e) => setColumnHeader(e.target.value)}
                          placeholder="Column header"
                          className="w-full px-3 bg-bg-subtle rounded-[8px] text-fg-base placeholder:text-fg-muted outline-none focus:ring-1 focus:ring-border-interactive text-sm"
                          style={{ height: '32px', fontSize: '14px' }}
                        />
                      )}
                    </div>
                  </div>
                    
                  {/* Type selector */}
                  <div style={{ padding: '0 4px' }}>
                    <button className="w-full flex items-center justify-between px-2 py-2 rounded-[8px] hover:bg-bg-subtle-hover transition-colors">
                      <span className="text-fg-subtle font-medium" style={{ fontSize: '12px' }}>Type</span>
                      {isGeneratingHeader ? (
                        <div className="h-5 w-28 bg-bg-subtle rounded animate-pulse" />
                      ) : (
                        <div className="flex items-center gap-2 text-fg-base">
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-fg-subtle">
                            <path d="M3 4.5H15M3 9H15M3 13.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-sm">Free response</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-muted">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                    
                  {/* Model selector */}
                  <div style={{ padding: '0 4px' }}>
                    <DropdownMenu open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <button className={`w-full flex items-center justify-between px-2 py-2 rounded-[8px] hover:bg-bg-subtle-hover transition-colors ${modelDropdownOpen ? 'bg-bg-subtle-hover' : ''}`}>
                          <span className="text-fg-subtle font-medium" style={{ fontSize: '12px' }}>Model</span>
                          <div className="flex items-center gap-2 text-fg-base">
                            <Image 
                              src="/central_icons/Harvey Auto.svg" 
                              alt="Harvey Auto" 
                              width={24} 
                              height={24}
                            />
                            <span className="text-sm">
                              {selectedModel === 'auto' && 'Auto'}
                              {selectedModel === 'gpt4' && 'GPT-5.1 with Harvey'}
                              {selectedModel === 'claude' && 'Claude 4.5 Sonnet with Harvey'}
                              {selectedModel === 'gemini' && 'Gemini 3 with Harvey'}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-fg-muted">
                              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-[320px] p-1">
                        {/* Auto option */}
                        <button
                          className={`w-full flex items-center gap-3 px-2 py-3 rounded-md hover:bg-bg-subtle-hover transition-colors ${selectedModel === 'auto' ? 'bg-bg-subtle' : ''}`}
                          onClick={() => { setSelectedModel('auto'); setModelDropdownOpen(false); }}
                        >
                          <div className="w-5 flex items-center justify-center">
                            {selectedModel === 'auto' && <Check className="w-4 h-4 text-fg-base" />}
                          </div>
                          <Image 
                            src="/central_icons/Harvey Auto.svg" 
                            alt="Harvey Auto" 
                            width={32} 
                            height={32}
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-fg-base font-medium text-sm">Auto</span>
                            <span className="text-fg-muted" style={{ fontSize: '12px' }}>Use the best model available</span>
                          </div>
                        </button>
                        
                        <DropdownMenuSeparator />
                        
                        {/* GPT-5.1 with Harvey */}
                        <button
                          className={`w-full flex items-center gap-3 px-2 py-3 rounded-md hover:bg-bg-subtle-hover transition-colors ${selectedModel === 'gpt4' ? 'bg-bg-subtle' : ''}`}
                          onClick={() => { setSelectedModel('gpt4'); setModelDropdownOpen(false); }}
                        >
                          <div className="w-5 flex items-center justify-center">
                            {selectedModel === 'gpt4' && <Check className="w-4 h-4 text-fg-base" />}
                          </div>
                          <Image 
                            src="/central_icons/Harvey ChatGPT.svg" 
                            alt="GPT-5.1" 
                            width={32} 
                            height={32}
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-fg-base font-medium text-sm">GPT-5.1 with Harvey</span>
                            <span className="text-fg-muted" style={{ fontSize: '12px' }}>OpenAI&apos;s latest model</span>
                          </div>
                        </button>
                        
                        {/* Claude 4.5 Sonnet with Harvey */}
                        <button
                          className={`w-full flex items-center gap-3 px-2 py-3 rounded-md hover:bg-bg-subtle-hover transition-colors ${selectedModel === 'claude' ? 'bg-bg-subtle' : ''}`}
                          onClick={() => { setSelectedModel('claude'); setModelDropdownOpen(false); }}
                        >
                          <div className="w-5 flex items-center justify-center">
                            {selectedModel === 'claude' && <Check className="w-4 h-4 text-fg-base" />}
                          </div>
                          <Image 
                            src="/central_icons/Harvey Anthropic.svg" 
                            alt="Claude" 
                            width={32} 
                            height={32}
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-fg-base font-medium text-sm">Claude 4.5 Sonnet with Harvey</span>
                            <span className="text-fg-muted" style={{ fontSize: '12px' }}>Anthropic&apos;s advanced reasoning model</span>
                          </div>
                        </button>
                        
                        {/* Gemini 3 with Harvey */}
                        <button
                          className={`w-full flex items-center gap-3 px-2 py-3 rounded-md hover:bg-bg-subtle-hover transition-colors ${selectedModel === 'gemini' ? 'bg-bg-subtle' : ''}`}
                          onClick={() => { setSelectedModel('gemini'); setModelDropdownOpen(false); }}
                        >
                          <div className="w-5 flex items-center justify-center">
                            {selectedModel === 'gemini' && <Check className="w-4 h-4 text-fg-base" />}
                          </div>
                          <Image 
                            src="/central_icons/Harvey Google.svg" 
                            alt="Gemini" 
                            width={32} 
                            height={32}
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-fg-base font-medium text-sm">Gemini 3 with Harvey</span>
                            <span className="text-fg-muted" style={{ fontSize: '12px' }}>Google&apos;s advanced reasoning model</span>
                          </div>
                        </button>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Footer text */}
                        <div className="px-2 py-3">
                          <p className="text-fg-muted" style={{ fontSize: '12px' }}>
                            Generates a response using the selected model augmented with Harvey&apos;s proprietary enhancements.
                          </p>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </>
            )}
            
            {/* Footer */}
            <div className="border-t border-border-base flex items-center justify-between" style={{ padding: '8px 12px' }}>
              <Button 
                variant="secondary"
                size="small"
                onClick={() => setAddColumnPopoverOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                size="small"
                disabled={columnQuestion.length === 0 || columnHeader.length === 0 || isGeneratingHeader}
                onClick={handleRunColumn}
              >
                Run column
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}