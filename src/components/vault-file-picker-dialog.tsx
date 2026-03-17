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
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface VaultFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  modifiedDate: string;
  size?: string;
  path: string;
}

interface VaultFilePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected?: (files: VaultFile[]) => void;
  overlayClassName?: string;
  vaultName?: string;
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
const columns: ColumnDef<VaultFile>[] = [
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

// Mock data - Vault project files
const mockVaultFiles: VaultFile[] = [
  // Folders
  { id: '1', name: 'Financial Statements', type: 'folder', modifiedDate: '2026-01-20', path: 'StubHub IPO/Financial Statements' },
  { id: '2', name: 'Legal Documents', type: 'folder', modifiedDate: '2026-01-18', path: 'StubHub IPO/Legal Documents' },
  { id: '3', name: 'Risk Assessments', type: 'folder', modifiedDate: '2026-01-15', path: 'StubHub IPO/Risk Assessments' },
  
  // Financial files
  { id: '4', name: 'StubHub_10K_2025.pdf', type: 'file', modifiedDate: '2026-01-19', size: '4.8 MB', path: 'StubHub IPO/Financial Statements' },
  { id: '5', name: 'StubHub_Quarterly_Revenue_Q4_2025.xlsx', type: 'file', modifiedDate: '2026-01-17', size: '2.1 MB', path: 'StubHub IPO/Financial Statements' },
  { id: '6', name: 'StubHub_Balance_Sheet_2025.pdf', type: 'file', modifiedDate: '2026-01-15', size: '1.2 MB', path: 'StubHub IPO/Financial Statements' },
  { id: '7', name: 'StubHub_Cash_Flow_Statement.xlsx', type: 'file', modifiedDate: '2026-01-12', size: '890 KB', path: 'StubHub IPO/Financial Statements' },
  
  // Legal files
  { id: '8', name: 'StubHub_Articles_of_Incorporation.pdf', type: 'file', modifiedDate: '2026-01-18', size: '567 KB', path: 'StubHub IPO/Legal Documents' },
  { id: '9', name: 'StubHub_Bylaws_Amended.pdf', type: 'file', modifiedDate: '2026-01-16', size: '345 KB', path: 'StubHub IPO/Legal Documents' },
  { id: '10', name: 'StubHub_Board_Resolutions_2025.docx', type: 'file', modifiedDate: '2026-01-14', size: '234 KB', path: 'StubHub IPO/Legal Documents' },
  { id: '11', name: 'StubHub_Material_Contracts_Summary.pdf', type: 'file', modifiedDate: '2026-01-10', size: '1.8 MB', path: 'StubHub IPO/Legal Documents' },
  
  // Risk files
  { id: '12', name: 'StubHub_Market_Risk_Analysis.pdf', type: 'file', modifiedDate: '2026-01-15', size: '2.3 MB', path: 'StubHub IPO/Risk Assessments' },
  { id: '13', name: 'StubHub_Competitive_Landscape.docx', type: 'file', modifiedDate: '2026-01-13', size: '1.5 MB', path: 'StubHub IPO/Risk Assessments' },
  { id: '14', name: 'StubHub_Regulatory_Risk_Assessment.pdf', type: 'file', modifiedDate: '2026-01-11', size: '980 KB', path: 'StubHub IPO/Risk Assessments' },
  { id: '15', name: 'StubHub_Technology_Risk_Review.pdf', type: 'file', modifiedDate: '2026-01-08', size: '1.1 MB', path: 'StubHub IPO/Risk Assessments' },
  
  // Root level files
  { id: '16', name: 'StubHub_Executive_Summary.pdf', type: 'file', modifiedDate: '2026-01-20', size: '456 KB', path: 'StubHub IPO' },
  { id: '17', name: 'StubHub_Business_Plan_2026.docx', type: 'file', modifiedDate: '2026-01-19', size: '2.4 MB', path: 'StubHub IPO' },
  { id: '18', name: 'StubHub_Valuation_Report.pdf', type: 'file', modifiedDate: '2026-01-17', size: '3.2 MB', path: 'StubHub IPO' },
  { id: '19', name: 'StubHub_Cap_Table_Jan_2026.xlsx', type: 'file', modifiedDate: '2026-01-15', size: '567 KB', path: 'StubHub IPO' },
  { id: '20', name: 'StubHub_Prior_S1_Draft.pdf', type: 'file', modifiedDate: '2026-01-10', size: '5.8 MB', path: 'StubHub IPO' },
];

export default function VaultFilePickerDialog({ 
  isOpen, 
  onClose, 
  onFilesSelected,
  overlayClassName,
  vaultName = "Vault"
}: VaultFilePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRowSelection({});
      setSearchQuery("");
    }
  }, [isOpen]);

  const table = useReactTable({
    data: mockVaultFiles,
    columns,
    state: {
      rowSelection,
      globalFilter: searchQuery,
    },
    enableRowSelection: true,
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
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
    >
      <DialogTitle className="sr-only">Select Files from {vaultName}</DialogTitle>

      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border-base">
        <div className="flex items-center gap-2">
          <div className="h-[38px] w-[38px] rounded-md bg-bg-subtle flex items-center justify-center">
            <Image src="/folderIcon.svg" alt="Folder" width={24} height={24} />
          </div>
          <span className="text-md font-medium text-fg-base">{vaultName}</span>
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
        <table className="w-full">
          <thead className="sticky top-0 z-10 h-8" style={{background: 'linear-gradient(to bottom, white calc(100% - 1px), rgb(212, 212, 212) 100%)'}}>
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
      </div>

      {/* Footer */}
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
    </motion.div>
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
