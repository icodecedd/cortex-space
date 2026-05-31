import { Clock, ExternalLink, Folder, Trash2, Rocket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { SpaceTemplate } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";

function formatTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

interface WorkspacesTabProps {
  templates: SpaceTemplate[];
  searchQuery: string;
  onLaunch: (template: SpaceTemplate) => void;
  onDelete: (id: string) => void;
  onCapture?: () => void;
}

export function WorkspacesTab({ templates, searchQuery, onLaunch, onDelete, onCapture }: WorkspacesTabProps) {
  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.rootPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState 
        icon={Rocket}
        title={searchQuery ? "No Workspaces Found" : "Your Library is Empty"}
        description={searchQuery 
          ? `No templates matching "${searchQuery}" were discovered in your central repository.`
          : "Capture your active workspace configurations to create reusable templates for different projects."
        }
        iconColor="text-purple-500/40"
        action={onCapture ? {
          label: "Capture Current Space",
          onClick: onCapture,
          icon: Plus
        } : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {filtered.map((template) => (
        <TemplateCard 
          key={template.id} 
          template={template} 
          onLaunch={() => onLaunch(template)}
          onDelete={() => onDelete(template.id)}
        />
      ))}
    </div>
  );
}

function TemplateCard({ template, onLaunch, onDelete }: { template: SpaceTemplate; onLaunch: () => void; onDelete: () => void }) {
  return (
    <Card 
      className="group relative flex flex-col p-0 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden border border-white/5"
      onClick={onLaunch}
    >
      <CardHeader className="p-4 pb-3 border-none">
        <div className="flex items-start gap-3">
          <LayoutPreviewIcon layout={template.layout} className="w-10 h-8 border bg-black shrink-0 rounded-sm border-white/10 mt-0.5" />
          
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <CardTitle className="text-[13px] font-bold truncate text-white/90 group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
              {template.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono overflow-hidden">
              <Folder size={10} className="shrink-0 opacity-50" /> 
              <span className="truncate whitespace-nowrap block">{template.rootPath}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between">
         <span className="text-[9px] text-white/20 font-medium flex items-center gap-1 leading-none"><Clock size={10} /> {formatTimeAgo(template.createdAt)}</span>
         
         <div className="flex items-center gap-2.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white/10 hover:bg-red-500/10 hover:text-red-400 group-hover:text-white/30 transition-all active:scale-95"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete Template"
            >
              <Trash2 size={13} />
            </Button>
            <ExternalLink size={11} className="text-white/10 group-hover:text-[var(--accent-primary)] transition-colors" />
         </div>
      </CardFooter>
    </Card>
  );
}
