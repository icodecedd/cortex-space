import { Clock, ExternalLink, Folder, Trash2, Rocket, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { SpaceTemplate } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { truncatePath } from "@/lib/utils";

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
          ? `No templates matching "${searchQuery}" were found in your library.`
          : "Capture your active workspace configurations to create reusable templates for different projects."
        }
        iconColor="text-purple-500/40"
        action={onCapture ? {
          label: "Capture Current Workspace",
          onClick: onCapture,
          icon: Plus
        } : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 px-2">
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
      className="group relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 cursor-pointer overflow-hidden border border-[var(--border-color)]"
      onClick={onLaunch}
    >
      <CardHeader className="p-4 pb-2 border-none group/header">
        <div className="flex items-start gap-3 min-w-0">
          <LayoutPreviewIcon layout={template.layout} className="w-10 h-8 border bg-[var(--bg-color)] shrink-0 rounded-sm border-[var(--border-color)] mt-0.5" />
          
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight">
              {template.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
              <Folder size={10} className="shrink-0 opacity-80" /> 
              <span className="block flex-1 truncate whitespace-nowrap">{truncatePath(template.rootPath, 35)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-0 pb-3 flex-1 min-w-0">
        {template.description ? (
          <p className="text-[11px] leading-relaxed line-clamp-2 text-[var(--text-secondary)]/70 font-medium">
            {template.description}
          </p>
        ) : (
          <p className="text-[10px] uppercase tracking-wider font-bold opacity-20 text-[var(--text-secondary)]">
            No description
          </p>
        )}
      </CardContent>

      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between group/footer">
         <span className="text-[9px] text-[var(--text-secondary)] font-medium flex items-center gap-1 leading-none"><Clock size={10} /> {formatTimeAgo(template.createdAt)}</span>
         
         <div className="flex items-center gap-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                Delete Template
              </TooltipContent>
            </Tooltip>
            <ExternalLink size={11} className="text-[var(--text-secondary)]/60 group-hover/footer:text-[var(--accent-primary)] transition-colors" />
         </div>
      </CardFooter>
    </Card>
  );
}
