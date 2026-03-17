"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface StandardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function StandardDialog({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 540,
}: StandardDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 gap-0 overflow-hidden"
        style={{ width: `${width}px`, maxWidth: `${width}px` }}
      >
        {/* Header - 12px padding all around */}
        <div className="flex items-center justify-between p-3 border-b border-border-base">
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle asChild>
              <h2 className="text-base font-medium text-fg-base">{title}</h2>
            </DialogTitle>
          </div>
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
        
        {/* Content - 16px padding */}
        <div className="p-4">
          {children}
        </div>
        
        {/* Footer - 12px padding all around */}
        {footer && (
          <div className="border-t border-border-base p-3 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

