"use client";

import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { StandardDialog } from "@/components/ui/standard-dialog";
import { Button } from "@/components/ui/button";
import { SvgIcon } from "@/components/svg-icon";

interface ManageGroupedFilesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentFileName: string;
  groupedCount: number;
  onRemoveFile?: (index: number) => void;
  onAddFiles?: () => void;
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

export default function ManageGroupedFilesDialog({
  isOpen,
  onClose,
  parentFileName,
  groupedCount,
  onRemoveFile,
  onAddFiles,
}: ManageGroupedFilesDialogProps) {
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);
  
  // Generate mock grouped files based on parent filename
  const groupedFiles = Array.from({ length: groupedCount }, (_, i) => ({
    id: `grouped-${i}`,
    name: `${parentFileName.replace('.pdf', '').replace('.docx', '').replace('.xlsx', '')} - Amendment ${i + 1}.pdf`
  }));

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manage grouped files"
      icon={
        <SvgIcon 
          src="/central_icons/Database - Filled.svg" 
          alt="Grouped files" 
          width={20} 
          height={20}
          className="text-ui-violet-fg"
        />
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </>
      }
      width={480}
    >
      <div className="flex flex-col gap-3">
        {/* Description */}
        <p className="text-sm text-fg-subtle">
          {groupedCount} files grouped under &quot;{parentFileName}&quot;
        </p>

        {/* Grouped Files List */}
        <div className="border border-border-base rounded-lg overflow-hidden">
          {groupedFiles.map((file, index) => (
            <div 
              key={file.id}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-bg-subtle transition-colors ${
                index !== groupedFiles.length - 1 ? 'border-b border-border-base' : ''
              }`}
              onMouseEnter={() => setHoveredFileIndex(index)}
              onMouseLeave={() => setHoveredFileIndex(null)}
            >
              {/* File icon and name */}
              <Image 
                src={getFileIcon(file.name)} 
                alt="File" 
                width={16} 
                height={16}
                className="flex-shrink-0"
              />
              <span className="text-sm text-fg-base flex-1 truncate">{file.name}</span>
              
              {/* Delete button - always reserve space */}
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {hoveredFileIndex === index && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile?.(index);
                    }}
                    className="p-1 hover:bg-bg-subtle-pressed rounded transition-colors text-fg-subtle hover:text-fg-base"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add files button */}
        <button
          onClick={() => {
            onAddFiles?.();
            console.log('Add files to group');
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-border-base rounded-lg hover:bg-bg-subtle transition-colors text-fg-subtle text-sm font-normal w-full justify-center"
        >
          <Plus size={14} />
          <span>Add files to group</span>
        </button>
      </div>
    </StandardDialog>
  );
}

