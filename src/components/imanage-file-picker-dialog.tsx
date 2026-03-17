"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search, Plus, History, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface iManageFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  modifiedDate: string;
  size?: string;
  path: string;
}

interface iManageFilePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected?: (files: iManageFile[]) => void;
  overlayClassName?: string;
}

// Helper function to get file icon based on extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '/pdf-icon.svg';
    case 'docx':
    case 'doc':
      return '/docx-icon.svg';
    case 'xlsx':
    case 'xls':
      return '/xlsx-icon.svg';
    case 'txt':
    default:
      return '/file.svg';
  }
};

// Define columns once, outside of component
const columns: ColumnDef<iManageFile>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          disabled={!row.getCanSelect()}
        />
      </div>
    ),
    size: 24,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.type === 'folder' ? (
          <Image 
            src="/folderIcon.svg" 
            alt="Folder" 
            width={16} 
            height={16} 
            className="flex-shrink-0" 
          />
        ) : (
          <Image 
            src={getFileIcon(row.original.name)} 
            alt="File" 
            width={16} 
            height={16} 
            className="flex-shrink-0" 
          />
        )}
        <div className="min-w-0">
          <p className="text-sm text-fg-base truncate">{row.original.name}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: ({ getValue }) => (
      <span className="text-sm text-fg-subtle">{(getValue() as string) || '-'}</span>
    ),
  },
];

// Mock data - define once (3 folders + 24 files = 27 total items)
const mockFiles: iManageFile[] = [
  // Folders
  { id: '1', name: 'Acme Corporation', type: 'folder', modifiedDate: '2024-01-15', path: 'My Matters/Acme Corporation' },
  { id: '2', name: 'GlobalTech Inc', type: 'folder', modifiedDate: '2024-01-10', path: 'My Matters/GlobalTech Inc' },
  { id: '3', name: 'Litigation', type: 'folder', modifiedDate: '2024-01-12', path: 'My Matters/Litigation' },
  
  // Acme Corporation files
  { id: '4', name: 'Acme_Master_Services_Agreement_2024.pdf', type: 'file', modifiedDate: '2024-01-14', size: '2.3 MB', path: 'My Matters/Acme Corporation/Contracts' },
  { id: '5', name: 'Acme_Board_Resolution_Q1_2024.docx', type: 'file', modifiedDate: '2024-01-12', size: '567 KB', path: 'My Matters/Acme Corporation/Corporate' },
  { id: '6', name: 'Acme_NDA_Template_Signed.pdf', type: 'file', modifiedDate: '2024-01-10', size: '890 KB', path: 'My Matters/Acme Corporation/Contracts' },
  { id: '7', name: 'Acme_Shareholder_Meeting_Notes.docx', type: 'file', modifiedDate: '2024-01-08', size: '345 KB', path: 'My Matters/Acme Corporation/Notes' },
  
  // GlobalTech Inc files
  { id: '8', name: 'GlobalTech_Patent_Application_2024.pdf', type: 'file', modifiedDate: '2024-01-13', size: '4.2 MB', path: 'My Matters/GlobalTech Inc/Patents' },
  { id: '9', name: 'GlobalTech_Due_Diligence_Report.pdf', type: 'file', modifiedDate: '2024-01-11', size: '5.1 MB', path: 'My Matters/GlobalTech Inc/Due Diligence' },
  { id: '10', name: 'GlobalTech_Series_C_Term_Sheet.pdf', type: 'file', modifiedDate: '2024-01-09', size: '2.1 MB', path: 'My Matters/GlobalTech Inc/Financing' },
  { id: '11', name: 'GlobalTech_IP_Assignment_Agreement.docx', type: 'file', modifiedDate: '2024-01-07', size: '1.8 MB', path: 'My Matters/GlobalTech Inc/IP' },
  
  // Litigation files
  { id: '12', name: 'Echabarrai v. PPG Industries - Scheduling Order.pdf', type: 'file', modifiedDate: '2024-01-14', size: '1.2 MB', path: 'My Matters/Litigation/Echabarrai' },
  { id: '13', name: 'Schnupp v. Blair Pharmacy - Court Opinion.pdf', type: 'file', modifiedDate: '2024-01-12', size: '3.4 MB', path: 'My Matters/Litigation/Schnupp' },
  { id: '14', name: 'Morrison v. TechCorp - Settlement Agreement.pdf', type: 'file', modifiedDate: '2024-01-10', size: '1.8 MB', path: 'My Matters/Litigation/Morrison' },
  { id: '15', name: 'Jenkins v. Pharma Inc - Deposition Transcript.pdf', type: 'file', modifiedDate: '2024-01-08', size: '4.5 MB', path: 'My Matters/Litigation/Jenkins' },
  
  // Random standalone files (not in any folder)
  { id: '16', name: 'Unicorn Capital - Nkomati Claims Management.docx', type: 'file', modifiedDate: '2024-01-06', size: '856 KB', path: 'My Matters/Unicorn Capital' },
  { id: '17', name: 'Compliance_Review_2024.xlsx', type: 'file', modifiedDate: '2024-01-04', size: '890 KB', path: 'My Matters/Compliance' },
  { id: '18', name: 'Merger_Agreement_Draft_Confidential.pdf', type: 'file', modifiedDate: '2024-01-03', size: '3.2 MB', path: 'My Matters/M&A' },
  { id: '19', name: 'SEC_Filing_10-K_2023.pdf', type: 'file', modifiedDate: '2024-01-02', size: '5.8 MB', path: 'My Matters/SEC Filings' },
  { id: '20', name: 'Employment_Agreement_Template.docx', type: 'file', modifiedDate: '2024-01-01', size: '445 KB', path: 'My Matters/Templates' },
  { id: '21', name: 'Q4_2023_Financial_Summary.xlsx', type: 'file', modifiedDate: '2023-12-28', size: '1.2 MB', path: 'My Matters/Financials' },
  
  // Standalone ValarAI files (for grouping demo)
  { id: '22', name: 'ValarAI_Series_F_Financing.pdf', type: 'file', modifiedDate: '2024-11-28', size: '4.8 MB', path: 'My Matters/ValarAI/Financing' },
  { id: '23', name: 'ValarAI_Business_Plan_2024.pdf', type: 'file', modifiedDate: '2024-11-25', size: '3.2 MB', path: 'My Matters/ValarAI/Strategic' },
  { id: '24', name: 'ValarAI_Financial_Statements_Q3.xlsx', type: 'file', modifiedDate: '2024-11-20', size: '2.1 MB', path: 'My Matters/ValarAI/Financials' },
  { id: '25', name: 'ValarAI_Competitive_Analysis.docx', type: 'file', modifiedDate: '2024-11-15', size: '1.7 MB', path: 'My Matters/ValarAI/Strategic' },
  { id: '26', name: 'ValarAI_Technology_Risk_Assessment.pdf', type: 'file', modifiedDate: '2024-11-10', size: '2.4 MB', path: 'My Matters/ValarAI/Risk' },
  { id: '27', name: 'ValarAI_Regulatory_Compliance_Review.pdf', type: 'file', modifiedDate: '2024-11-05', size: '1.9 MB', path: 'My Matters/ValarAI/Compliance' },
];

export default function IManageFilePickerDialog({ 
  isOpen, 
  onClose, 
  onFilesSelected,
  overlayClassName 
}: iManageFilePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showIManage, setShowIManage] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setShowProgressBar(false);
      setShowIManage(false);
      setRowSelection({});
      setSearchQuery("");
    }
  }, [isOpen]);

  // Layout constants
  const HARVEY_SIZE = 40;
  const IMANAGE_SIZE = 40;
  const PROGRESS_BAR_WIDTH = 64;
  const GAP_PX = 8;
  const LEFT_OFFSET = PROGRESS_BAR_WIDTH / 2 + GAP_PX + HARVEY_SIZE / 2;
  const RIGHT_OFFSET = PROGRESS_BAR_WIDTH / 2 + GAP_PX + IMANAGE_SIZE / 2;
  const PROGRESS_SEGMENT_MIN = 16;
  const PROGRESS_SEGMENT_MAX = 32;
  const PROGRESS_TRAVEL = PROGRESS_BAR_WIDTH - PROGRESS_SEGMENT_MIN;

  useEffect(() => {
    if (!showIManage) return;

    const progressBarTimeout = setTimeout(() => setShowProgressBar(true), 150);
    const closeTimeout = setTimeout(() => setIsLoading(false), 2600);

    return () => {
      clearTimeout(progressBarTimeout);
      clearTimeout(closeTimeout);
    };
  }, [showIManage]);

  const table = useReactTable({
    data: mockFiles,
    columns,
    state: {
      rowSelection,
      globalFilter: searchQuery,
    },
    enableRowSelection: true, // Enable selection for all rows including folders
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleAdd = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const files = selectedRows.map(row => row.original);
    onFilesSelected?.(files);
    onClose();
  };

  const dialogContent = (
    <>
      <DialogTitle className="sr-only">Select Files from iManage</DialogTitle>
        {/* Loading Splash Screen */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="absolute inset-0 bg-bg-base z-50 flex items-center justify-center"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div 
                  className="absolute z-20"
                  initial={{ scale: 0, x: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    x: -LEFT_OFFSET
                  }}
                  transition={{ 
                    scale: { duration: 0.6, ease: "easeOut", times: [0, 0.6, 1] },
                    x: { delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                  }}
                  onUpdate={(latest: { x?: number }) => {
                    const xVal = latest.x;
                    if (!showIManage && typeof xVal === 'number' && xVal <= -LEFT_OFFSET + 0.5) {
                      setShowIManage(true);
                    }
                  }}
                >
                  <Image 
                    src="/Harvey_Glyph_Circle.svg" 
                    alt="Harvey" 
                    width={HARVEY_SIZE} 
                    height={HARVEY_SIZE}
                  />
                </motion.div>
                
                <AnimatePresence>
                  {showIManage && (
                    <motion.div 
                      className="absolute z-10"
                      initial={{ scale: 0, opacity: 0, x: RIGHT_OFFSET }}
                      animate={{ scale: [0, 1.1, 1], opacity: 1, x: RIGHT_OFFSET }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <Image 
                        src="/imanage_circle_blue.svg" 
                        alt="iManage" 
                        width={IMANAGE_SIZE} 
                        height={IMANAGE_SIZE}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {showProgressBar && (
                    <motion.div 
                      className="absolute z-0"
                      initial={{ opacity: 0, y: 12, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 360, damping: 26 }}
                      style={{ willChange: "transform, opacity" }}
                    >
                      <div className="w-[64px] h-1 bg-bg-subtle-pressed rounded-full overflow-hidden relative">
                        <motion.div
                          className="absolute left-0 top-0 h-full bg-fg-base rounded-full"
                          initial={{ x: 0, width: PROGRESS_SEGMENT_MIN }}
                          animate={{ 
                            x: [0, PROGRESS_TRAVEL],
                            width: [PROGRESS_SEGMENT_MIN, PROGRESS_SEGMENT_MAX, PROGRESS_SEGMENT_MIN]
                          }}
                          transition={{ 
                            x: { duration: 0.42, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 0.06 },
                            width: { duration: 0.42, ease: "easeInOut", times: [0, 0.5, 1], repeat: Infinity, repeatType: "reverse", delay: 0.06 }
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className="absolute bottom-16 left-0 right-0 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  <p className="text-sm text-fg-muted">Connecting to iManage...</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-border-base">
          <div className="flex items-center gap-2">
            <div className="h-[38px] w-[38px] rounded-md bg-bg-subtle flex items-center justify-center">
              <Image src="/imanage.svg" alt="iManage" width={24} height={24} />
            </div>
            <span className="text-md font-medium text-fg-base">Select files from iManage</span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-bg-subtle transition-colors text-fg-muted hover:text-fg-subtle self-start"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-border-base">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fg-muted" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 border-border-base focus:ring-1 focus:ring-border-strong font-normal text-fg-base placeholder:text-fg-muted"
              style={{ height: '36px', fontSize: '14px' }}
            />
          </div>
          
          {/* Filter Chips */}
          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border-strong hover:bg-bg-subtle rounded-md transition-colors">
              <Plus className="h-3.5 w-3.5 text-fg-muted" />
              <span className="text-xs text-fg-subtle">Document type</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border-strong hover:bg-bg-subtle rounded-md transition-colors">
              <Plus className="h-3.5 w-3.5 text-fg-muted" />
              <span className="text-xs text-fg-subtle">File type</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border-strong hover:bg-bg-subtle rounded-md transition-colors">
              <History className="h-3.5 w-3.5 text-fg-muted" />
              <span className="text-xs text-fg-subtle">Recent</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 border border-dashed border-border-strong hover:bg-bg-subtle rounded-md transition-colors">
              <Star className="h-3.5 w-3.5 text-fg-muted" />
              <span className="text-xs text-fg-subtle">Favorites</span>
            </button>
          </div>
        </div>

        {/* File Table */}
        <div className="flex-1 overflow-auto">
          {!isLoading && (
            <table className="w-full">
              <thead className="sticky top-0 z-10 h-8 bg-bg-base border-b border-border-base">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          "py-2 text-left text-xs font-medium text-fg-subtle tracking-wider",
                          header.id === 'select' ? "pl-4 pr-0.5" : 
                          header.id === 'name' ? "pl-1 pr-4" : "px-4"
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-bg-base divide-y divide-border-base">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-12">
                      <p className="text-sm text-fg-muted">No files found</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "hover:bg-bg-subtle transition-colors cursor-pointer",
                        row.getIsSelected() && "bg-bg-subtle hover:bg-bg-subtle"
                      )}
                      onClick={() => {
                        row.toggleSelected();
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn(
                            "py-3 text-sm text-fg-base",
                            cell.column.id === 'select' ? "pl-4 pr-0.5" : 
                            cell.column.id === 'name' ? "pl-1 pr-4" : "px-4"
                          )}
                          style={{ width: cell.column.getSize() }}
                          onClick={(e) => {
                            // Prevent row click when clicking checkbox
                            if ((e.target as HTMLElement).tagName === 'INPUT') {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="flex items-center justify-between px-3 py-3 border-t border-border-base">
            <p className="text-sm text-fg-subtle">
              {table.getSelectedRowModel().rows.length} {table.getSelectedRowModel().rows.length === 1 ? 'file' : 'files'} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdd} 
                disabled={table.getSelectedRowModel().rows.length === 0}
              >
                Add selected files
              </Button>
            </div>
          </div>
        )}
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {overlayClassName ? (
        <DialogPortal>
          <DialogOverlay className={overlayClassName} />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 w-[800px] max-w-[800px] h-[600px] translate-x-[-50%] translate-y-[-50%] border border-border-base bg-bg-base duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg p-0 gap-0 overflow-hidden flex flex-col"
          >
            {dialogContent}
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : (
        <DialogContent className="w-[800px] max-w-[800px] h-[600px] p-0 gap-0 overflow-hidden flex flex-col">
          {dialogContent}
        </DialogContent>
      )}
    </Dialog>
  );
}

