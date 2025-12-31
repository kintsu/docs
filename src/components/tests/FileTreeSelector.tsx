"use client";

import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  File,
  Folder,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface FileEntry {
  path: string;
  content: string;
}

interface FileTreeSelectorProps {
  files: FileEntry[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  focusedFile?: string | null;
  /** File path that has an error (will show error icon) */
  errorFile?: string | null;
  /** Severity of the error for icon color */
  errorSeverity?: "error" | "warning" | string;
}

interface FolderNode {
  name: string;
  children: Map<string, FolderNode>;
  files: FileEntry[];
}

function buildTree(files: FileEntry[]): FolderNode {
  const root: FolderNode = { name: "", children: new Map(), files: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          children: new Map(),
          files: [],
        });
      }
      const next = current.children.get(part);
      if (next) current = next;
    }

    current.files.push(file);
  }

  return root;
}

interface TreeNodeProps {
  node: FolderNode;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  focusedFile?: string | null;
  errorFile?: string | null;
  errorSeverity?: "error" | "warning" | string;
  depth?: number;
}

function TreeNode({
  node,
  selectedFile,
  onFileSelect,
  focusedFile,
  errorFile,
  errorSeverity,
  depth = 0,
}: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.size > 0 || node.files.length > 0;

  // Helper to check if a file has an error
  const isErrorFile = (path: string) => {
    if (!errorFile) return false;
    const normalizedError = errorFile.replace(/^\.\//, "");
    const normalizedPath = path.replace(/^\.\//, "");
    return (
      normalizedPath === normalizedError ||
      path.endsWith(normalizedError) ||
      normalizedError.endsWith(normalizedPath)
    );
  };

  // Helper to get the appropriate icon for a file
  const getFileIcon = (path: string) => {
    if (isErrorFile(path)) {
      if (errorSeverity === "warning") {
        return <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />;
      }
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />;
    }
    return <File className="h-4 w-4 shrink-0" />;
  };

  if (!node.name && depth === 0) {
    return (
      <>
        {Array.from(node.children.values()).map((child) => (
          <TreeNode
            key={child.name}
            node={child}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            focusedFile={focusedFile}
            errorFile={errorFile}
            errorSeverity={errorSeverity}
            depth={depth}
          />
        ))}
        {node.files.map((file) => (
          <button
            type="button"
            key={file.path}
            data-file-path={file.path}
            onClick={() => onFileSelect(file.path)}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent",
              selectedFile === file.path && "bg-accent text-accent-foreground",
              focusedFile === file.path &&
                selectedFile !== file.path &&
                "ring-2 ring-primary/50 bg-accent/20",
            )}
            style={{ paddingLeft: "8px" }}
          >
            {getFileIcon(file.path)}
            <span className="truncate">{file.path.split("/").pop()}</span>
          </button>
        ))}
      </>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate flex-1">{node.name}</span>
        {hasChildren && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1 py-0 h-4 shrink-0"
          >
            {node.children.size + node.files.length}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {Array.from(node.children.values()).map((child) => (
          <TreeNode
            key={child.name}
            node={child}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            focusedFile={focusedFile}
            errorFile={errorFile}
            errorSeverity={errorSeverity}
            depth={depth + 1}
          />
        ))}
        {node.files.map((file) => (
          <button
            type="button"
            key={file.path}
            data-file-path={file.path}
            onClick={() => onFileSelect(file.path)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent",
              selectedFile === file.path && "bg-accent text-accent-foreground",
              focusedFile === file.path &&
                selectedFile !== file.path &&
                "ring-2 ring-primary/50 bg-accent/20",
            )}
            style={{ paddingLeft: `${(depth + 1) * 12 + 8 + 12}px` }}
          >
            {getFileIcon(file.path)}
            <span className="truncate">{file.path.split("/").pop()}</span>
          </button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FileTreeSelector({
  files,
  selectedFile,
  onFileSelect,
  focusedFile,
  errorFile,
  errorSeverity,
}: FileTreeSelectorProps) {
  const isMobile = useIsMobile();
  const tree = buildTree(files);

  if (isMobile) {
    return (
      <Select
        value={selectedFile ?? undefined}
        onValueChange={(value) => value && onFileSelect(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(value: string | null) => value ?? "Select a file"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {files.map((file) => (
            <SelectItem key={file.path} value={file.path}>
              {file.path}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="py-1">
      <TreeNode
        node={tree}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        focusedFile={focusedFile}
        errorFile={errorFile}
        errorSeverity={errorSeverity}
      />
    </div>
  );
}

export default FileTreeSelector;
