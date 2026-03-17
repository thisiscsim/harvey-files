"use client";

import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline as UnderlineIcon,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Clipboard,
  Scissors,
  List,
  ListOrdered,
  Undo,
  Redo,
  Code
} from "lucide-react";
import { useState } from "react";
import { Editor } from '@tiptap/react';
import { SmallButton } from "@/components/ui/button";
import { SvgIcon } from "@/components/svg-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DraftDocumentToolbarProps {
  chatOpen: boolean;
  onToggleChat: () => void;
  onCloseArtifact?: () => void;
  editor: Editor | null;
  onEditModeChange?: (mode: 'editing' | 'suggesting') => void;
}

export default function DraftDocumentToolbar({ chatOpen, onToggleChat, onCloseArtifact, editor, onEditModeChange }: DraftDocumentToolbarProps) {
  const [editMode, setEditMode] = useState<'editing' | 'suggesting'>('editing');
  const [editModeOpen, setEditModeOpen] = useState(false);

  if (!editor) {
    return null;
  }

  // Helper function to set link
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Helper functions for clipboard operations
  const handleCopy = () => {
    document.execCommand('copy');
  };

  const handleCut = () => {
    document.execCommand('cut');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().insertContent(text).run();
    } catch {
      // Fallback for browsers that don't support clipboard API
      document.execCommand('paste');
    }
  };

  return (
    <div className="px-3 py-2 border-b border-border-base bg-bg-base flex items-center justify-between overflow-x-auto" style={{ minHeight: '42px' }}>
      <div className="flex items-center gap-1">
        {/* Toggle Chat Button */}
        <SmallButton
          onClick={onToggleChat}
          variant="secondary"
          className={chatOpen ? "bg-bg-subtle" : ""}
          icon={
            <SvgIcon 
              src={chatOpen ? "/central_icons/Assistant - Filled.svg" : "/central_icons/Assistant.svg"}
              alt="Harvey" 
              width={14} 
              height={14} 
              className={chatOpen ? "text-fg-base" : "text-fg-subtle"}
            />
          }
        >
          Ask Harvey
        </SmallButton>
        
        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '20px' }}></div>
        
        {/* Text Formatting Options */}
        <div className="flex items-center gap-1">
          {/* Bold */}
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('bold') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Bold (Cmd+B)"
          >
            <Bold size={14} />
          </button>

          {/* Italic */}
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('italic') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Italic (Cmd+I)"
          >
            <Italic size={14} />
          </button>

          {/* Underline */}
          <button 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('underline') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Underline (Cmd+U)"
          >
            <UnderlineIcon size={14} />
          </button>

          {/* Strikethrough */}
          <button 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('strike') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>

          {/* Code */}
          <button 
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('code') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Code"
          >
            <Code size={14} />
          </button>

          {/* Link */}
          <button 
            onClick={setLink}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('link') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Add Link"
          >
            <Link size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '20px' }}></div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' })) ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>

          <button 
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>

          <button 
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '20px' }}></div>

        {/* Lists */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('bulletList') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Bullet List"
          >
            <List size={14} />
          </button>

          <button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.isActive('orderedList') ? 'bg-bg-subtle-pressed text-fg-base hover:bg-bg-component' : 'text-fg-subtle hover:bg-bg-subtle'
            }`}
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '20px' }}></div>

        {/* Clipboard Operations */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCopy}
            className="w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors hover:bg-bg-subtle text-fg-subtle"
            title="Copy (Cmd+C)"
          >
            <Copy size={14} />
          </button>

          <button 
            onClick={handleCut}
            className="w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors hover:bg-bg-subtle text-fg-subtle"
            title="Cut (Cmd+X)"
          >
            <Scissors size={14} />
          </button>

          <button 
            onClick={handlePaste}
            className="w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors hover:bg-bg-subtle text-fg-subtle"
            title="Paste (Cmd+V)"
          >
            <Clipboard size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '20px' }}></div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.can().undo() 
                ? 'hover:bg-bg-subtle text-fg-subtle' 
                : 'text-fg-disabled cursor-not-allowed'
            }`}
            title="Undo (Cmd+Z)"
          >
            <Undo size={14} />
          </button>

          <button 
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors ${
              editor.can().redo() 
                ? 'hover:bg-bg-subtle text-fg-subtle' 
                : 'text-fg-disabled cursor-not-allowed'
            }`}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo size={14} />
          </button>
        </div>
      </div>

      {/* Right side — Edit mode toggle */}
      <div className="flex items-center flex-shrink-0 ml-2">
        <DropdownMenu open={editModeOpen} onOpenChange={setEditModeOpen}>
          <DropdownMenuTrigger asChild>
            <SmallButton
              variant="secondary"
              className={editModeOpen ? "bg-bg-subtle" : ""}
              icon={
                <SvgIcon
                  src={editMode === 'editing' ? "/central_icons/Draft.svg" : "/central_icons/Input.svg"}
                  alt={editMode === 'editing' ? "Editing" : "Suggesting"}
                  width={14}
                  height={14}
                  className="text-fg-subtle"
                />
              }
            >
              {editMode === 'editing' ? 'Editing' : 'Suggesting'}
            </SmallButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-[160px]">
            <DropdownMenuItem onClick={() => { setEditMode('editing'); onEditModeChange?.('editing'); }} className="gap-2">
              <SvgIcon src="/central_icons/Draft.svg" alt="Editing" width={14} height={14} className="text-fg-subtle" />
              <span>Editing</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditMode('suggesting'); onEditModeChange?.('suggesting'); }} className="gap-2">
              <SvgIcon src="/central_icons/Input.svg" alt="Suggesting" width={14} height={14} className="text-fg-subtle" />
              <span>Suggesting</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
