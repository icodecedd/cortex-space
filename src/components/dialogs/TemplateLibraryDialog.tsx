import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardAction
} from "@/components/ui/card";
import { SpaceTemplate } from "@/types";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { Search, Plus, Trash2, Clock, Folder, ExternalLink } from "lucide-react";

function formatTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

interface TemplateLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SpaceTemplate[];
  onLaunch: (template: SpaceTemplate) => void;
  onDelete: (id: string) => void;
  onCapture: () => void;
}

export function TemplateLibraryDialog({
  isOpen,
  onOpenChange,
  templates,
  onLaunch,
  onDelete,
  onCapture
}: TemplateLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.rootPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={true}
        isDeep={true}
        open={isOpen}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl flex flex-col p-0 gap-0 overflow-hidden"
        style={{
          maxWidth: "900px",
          width: "calc(100% - 2rem)",
          height: "75vh",
          maxHeight: "800px",
        }}
      >
        <DialogHeader 
          className="p-6 shrink-0 border-b border-[var(--border-color)] bg-[var(--text-primary)]/[0.01]"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Space Templates
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium">
                Instant-launch your curated multi-pane environments.
              </DialogDescription>
            </div>
            <Button 
              onClick={onCapture}
              variant="secondary"
              className="btn-tactile gap-2 h-[36px] px-4 font-bold text-[13px] rounded-md shadow-sm border-[var(--border-color)] text-[var(--text-primary)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Capture Current
            </Button>
          </div>
          
          <div className="relative mt-5">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]/80" 
            />
            <Input 
              placeholder="Search templates, paths, or commands..." 
              className="pl-9 text-[13px] h-[38px] transition-all bg-[var(--bg-color)] border-[var(--border-color)] focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {filteredTemplates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center border border-[var(--border-color)] shadow-sm bg-[var(--surface-color)]"
                >
                  <Search className="w-6 h-6 opacity-60 text-[var(--text-primary)]" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-[15px] text-[var(--text-primary)]">No templates found</p>
                  <p className="text-[13px] text-[var(--text-secondary)] font-medium">Try searching for something else or capture your first template.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onLaunch={() => onLaunch(template)}
                    onDelete={() => onDelete(template.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ 
  template, 
  onLaunch, 
  onDelete 
}: { 
  template: SpaceTemplate; 
  onLaunch: () => void;
  onDelete: () => void;
}) {
  return (
    <Card 
      className="group relative flex flex-col p-0 bg-transparent transition-all duration-300 cursor-pointer overflow-hidden border border-[var(--border-color)]"
      onClick={onLaunch}
    >
      {/* Dynamic Hover Background */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[var(--text-primary)]/[0.02]"
      />
      {/* Accent Glow on Hover */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none blur-2xl bg-[var(--accent-primary)]" 
      />

      <CardHeader className="p-5 pb-3 border-none relative z-10">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <LayoutPreviewIcon 
              layout={template.layout} 
              className="w-12 h-10 border bg-[var(--bg-color)] border-[var(--border-color)] shrink-0" 
            />
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle 
                className="text-[14px] font-bold tracking-tight truncate group-hover:text-[var(--accent-primary)] transition-colors duration-200 text-[var(--text-primary)]"
              >
                {template.name}
              </CardTitle>
              <div 
                className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] min-w-0"
              >
                <Folder className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate flex-1">{template.rootPath}</span>
              </div>
            </div>
          </div>
          
          <CardAction className="shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-600 text-[var(--text-secondary)]"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-0 flex-1 relative z-10 min-w-0">
        <div className="min-h-[2.5rem] py-1">
          {template.description ? (
            <p 
              className="text-[12px] leading-relaxed line-clamp-2 text-[var(--text-secondary)] font-medium"
            >
              {template.description}
            </p>
          ) : (
            <p 
              className="text-[11px] uppercase tracking-wider font-bold opacity-30 text-[var(--text-secondary)]"
            >
              No description
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter 
        className="px-5 py-3.5 mt-4 flex items-center justify-between border-t border-[var(--border-color)] bg-[var(--text-primary)]/[0.03] relative z-10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]"
          >
            <Clock className="w-3 h-3 opacity-80" />
            {formatTimeAgo(template.createdAt)}
          </div>
          {template.mode && (
             <span 
               className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
             >
              {template.mode}
            </span>
          )}
        </div>
        
        <div 
          className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--accent-primary)] shrink-0"
        >
          Launch <ExternalLink className="w-3 h-3" />
        </div>
      </CardFooter>
    </Card>
  );
}
