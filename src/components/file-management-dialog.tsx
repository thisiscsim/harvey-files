"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, Search, Globe, Upload, FileText, Database, GraduationCap, Clock, FileIcon, Folder } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FileManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileManagementDialog({ isOpen, onClose }: FileManagementDialogProps) {
  const [selectedSection, setSelectedSection] = useState<string>("recent");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFolderUpload = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle the uploaded files here
      console.log("Files selected:", files);
      // You can add logic to process the files
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between px-4 py-3 border-b border-border-base">
          <span className="text-sm font-medium text-fg-base">Files and sources</span>
          <button
            onClick={() => onClose()}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-bg-subtle transition-colors text-fg-muted hover:text-fg-subtle"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {/* Split View Content */}
        <div className="flex flex-1">
          {/* Left Navigation */}
          <div className="w-[240px] border-r border-border-base bg-bg-subtle p-3">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fg-muted" />
              <Input
                type="text"
                placeholder="Search files and sources"
                className="pl-9 pr-3 border-border-base focus:ring-1 focus:ring-border-strong font-normal text-fg-base placeholder:text-fg-muted"
                style={{ height: '32px', fontSize: '14px', lineHeight: '20px', color: '#171717' }}
              />
            </div>

            {/* Navigation Sections */}
            <div className="space-y-1">
              {/* Files Section */}
              <div className="mb-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors border border-border-base bg-bg-base hover:bg-bg-subtle text-fg-subtle"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuItem onClick={handleFileUpload}>
                      <FileIcon className="h-4 w-4 mr-2" />
                      Upload files
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFolderUpload}>
                      <Folder className="h-4 w-4 mr-2" />
                      Upload folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Recent button */}
                <button
                  onClick={() => setSelectedSection("recent")}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors mt-1",
                    selectedSection === "recent" 
                      ? "bg-bg-subtle-pressed text-fg-base" 
                      : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span>Recent</span>
                </button>
              </div>

              {/* Sources Section */}
              <div className="mb-3">
                <h3 className="text-xs font-medium text-fg-muted tracking-wider mb-2 px-2">Sources</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedSection("imanage")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "imanage" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <img src="/imanage.svg" alt="iManage" className="h-4 w-4" />
                    <span>iManage</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("vault")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "vault" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <Database className="h-4 w-4" />
                    <span>Vault project</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("knowledge")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "knowledge" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Knowledge base</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("web")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "web" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Web search</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("edgar")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "edgar" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <img src="/EDGAR.svg" alt="EDGAR" className="h-4 w-4" />
                    <span>EDGAR</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("eurlex")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "eurlex" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <img src="/lexis.svg" alt="EUR-Lex" className="h-4 w-4" />
                    <span>EUR-Lex</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSection("memos")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      selectedSection === "memos" 
                        ? "bg-bg-subtle-pressed text-fg-base" 
                        : "text-fg-subtle hover:bg-bg-subtle hover:text-fg-base"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Memos</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-bg-base">
            {/* Empty State or Content based on selection */}
            {selectedSection === "upload" && (
              <div className="p-6">
                <div className="h-full border-2 border-dashed border-border-base rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-fg-muted mx-auto mb-3" />
                    <p className="text-sm text-fg-subtle mb-2">Drag and drop files here or click to browse</p>
                    <Button variant="secondary" size="default">
                      Select files
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "edgar" && (
              <div className="p-6">
                {/* Recently used section */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-fg-base mb-3">Recently used</h3>
                  <div className="space-y-2">
                    {/* Example recent file */}
                    <div className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                      <img src="/EDGAR.svg" alt="EDGAR" className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-fg-base">10K</p>
                        <p className="text-xs text-fg-muted">EDGAR</p>
                      </div>
                    </div>
                    
                    {/* Placeholder recent files */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                        <FileIcon className="h-5 w-5 text-fg-muted" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-fg-base">File name</p>
                          <p className="text-xs text-fg-muted">File type</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent tab content */}
            {selectedSection === "recent" && (
              <div className="p-6 h-full overflow-y-auto">
                {/* Upload Dropzone */}
                <div className="mb-6">
                  <div 
                    className="border-2 border-dashed border-border-base rounded-lg p-8 text-center hover:border-border-strong transition-colors cursor-pointer"
                    onClick={handleFileUpload}
                  >
                    <Upload className="h-12 w-12 text-fg-muted mx-auto mb-3" />
                    <p className="text-sm text-fg-subtle mb-2">Drag and drop files here or click to browse</p>
                    <Button variant="secondary" size="default" className="text-sm">
                      Select files
                    </Button>
                  </div>
                </div>

                {/* Recent files and sources */}
                <div>
                  <h3 className="text-sm font-medium text-fg-base mb-3">Recent files and sources</h3>
                  <div className="space-y-2">
                    {/* Example recent items - you can populate this with actual data */}
                    <div className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                      <FileIcon className="h-5 w-5 text-fg-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-fg-base">Contract_Draft_v3.docx</p>
                        <p className="text-xs text-fg-muted">Uploaded 2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                      <img src="/EDGAR.svg" alt="EDGAR" className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-fg-base">10-K Filing</p>
                        <p className="text-xs text-fg-muted">EDGAR • Accessed yesterday</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                      <Database className="h-5 w-5 text-fg-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-fg-base">Project Alpha Documents</p>
                        <p className="text-xs text-fg-muted">Vault project • 15 documents</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-border-base rounded-md hover:bg-bg-subtle cursor-pointer">
                      <Globe className="h-5 w-5 text-fg-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-fg-base">Market Research Report</p>
                        <p className="text-xs text-fg-muted">Web search • Last week</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default empty state for other sections */}
            {!["upload", "edgar", "recent"].includes(selectedSection) && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-fg-muted">Select a source to view content</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      </DialogContent>
    </Dialog>
  );
}