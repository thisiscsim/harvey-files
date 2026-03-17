"use client";

import { X, UserPlus, Layers, Sparkles, Trash2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewTableActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAssignTo?: () => void;
  onGroupFiles?: () => void;
  onOpenInAssistant?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export default function ReviewTableActionBar({
  selectedCount,
  onClearSelection,
  onAssignTo,
  onGroupFiles,
  onOpenInAssistant,
  onDelete,
  onExport,
}: ReviewTableActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-1/2 -translate-x-1/2 z-50 px-6"
          style={{ bottom: '24px', maxWidth: 'calc(100vw - 48px)' }}
        >
          <div 
            className="bg-button-inverted text-fg-on-color rounded-xl flex items-center gap-1 w-max" 
            style={{ 
              padding: '4px',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.08) inset'
            }}
          >
            {/* Selection count and clear button */}
            <button
              onClick={onClearSelection}
              className="flex items-center gap-2 px-3 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
            >
              <span className="text-xs font-medium whitespace-nowrap">
                {selectedCount} {selectedCount === 1 ? 'document' : 'documents'} selected
              </span>
              <X size={14} />
            </button>

            {/* Vertical divider */}
            <div className="w-px bg-white/15" style={{ height: '16px' }} />

            {/* Action buttons */}
            <div className="flex items-center">
              {/* Assign to */}
              <button
                onClick={onAssignTo}
                className="flex items-center gap-1.5 px-2.5 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
              >
                <UserPlus size={14} />
                <span className="text-xs font-medium">Assign to</span>
              </button>

              {/* Group files */}
              <button
                onClick={onGroupFiles}
                className="flex items-center gap-1.5 px-2.5 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
              >
                <Layers size={14} />
                <span className="text-xs font-medium">Group files</span>
              </button>

              {/* Open in Assistant */}
              <button
                onClick={onOpenInAssistant}
                className="flex items-center gap-1.5 px-2.5 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
              >
                <Sparkles size={14} />
                <span className="text-xs font-medium">Open in Assistant</span>
              </button>

              {/* Delete */}
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-2.5 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
              >
                <Trash2 size={14} />
                <span className="text-xs font-medium">Delete</span>
              </button>

              {/* Export */}
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-2.5 h-7 hover:bg-white/10 active:bg-white/15 rounded-[7px] transition-colors"
              >
                <Download size={14} />
                <span className="text-xs font-medium">Export</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

