"use client";

import { X, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ManageGroupedFilesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  parentFileName: string;
  groupedCount: number;
  onRemoveFile?: (index: number) => void;
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

export default function ManageGroupedFilesPopover({
  isOpen,
  onClose,
  anchorElement,
  parentFileName,
  groupedCount,
  onRemoveFile,
}: ManageGroupedFilesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);
  
  // Generate mock grouped files based on parent filename
  const groupedFiles = Array.from({ length: groupedCount }, (_, i) => ({
    id: `grouped-${i}`,
    name: `${parentFileName.replace('.pdf', '')} - Amendment ${i + 1}.pdf`
  }));

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorElement]);

  if (!anchorElement) return null;

  const rect = anchorElement.getBoundingClientRect();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-bg-base rounded-lg shadow-xl border border-border-base"
          style={{
            top: rect.top,
            left: rect.right + 8,
            width: "400px",
            maxHeight: "500px",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-base">
            <h3 className="text-sm font-medium text-fg-base">Grouped files</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-subtle rounded transition-colors text-fg-muted"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content - Grouped Files List */}
          <div className="py-2">
            {/* Grouped Files */}
            {groupedFiles.map((file, index) => (
              <div 
                key={file.id}
                className="flex items-center gap-2 px-4 py-2 hover:bg-bg-subtle transition-colors cursor-pointer"
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
                      className="p-1 hover:bg-bg-subtle-pressed rounded transition-colors text-fg-subtle"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add files button */}
            <div className="px-4 pt-2 pb-2">
              <button
                onClick={() => console.log('Add files to group')}
                className="flex items-center gap-1.5 px-2 py-1.5 border border-border-base rounded-md hover:bg-bg-subtle transition-colors text-fg-subtle text-sm font-normal w-full justify-center"
              >
                <Plus size={14} />
                <span>Add files</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

