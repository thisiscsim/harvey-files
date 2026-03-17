"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CreateViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateView: (name: string) => void;
}

export default function CreateViewDialog({
  isOpen,
  onClose,
  onCreateView,
}: CreateViewDialogProps) {
  const [viewName, setViewName] = useState("");

  // Reset name when dialog opens
  useEffect(() => {
    if (isOpen) {
      setViewName("");
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (viewName.trim()) {
      onCreateView(viewName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && viewName.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 gap-0 overflow-hidden"
        style={{ width: '400px', maxWidth: '400px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border-base">
          <DialogTitle asChild>
            <h2 className="text-base font-medium text-fg-base">Create a view</h2>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter name here"
            autoFocus
            className="border-border-base focus:ring-1 focus:ring-border-strong font-normal text-fg-base placeholder:text-fg-muted"
            style={{ height: '36px', fontSize: '14px' }}
          />
        </div>
        
        {/* Footer */}
        <div className="border-t border-border-base p-3 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!viewName.trim()}
            onClick={handleCreate}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

