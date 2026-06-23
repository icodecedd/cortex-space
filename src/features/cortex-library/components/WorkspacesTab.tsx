import { useMemo } from "react";
import {
  Clock,
  ExternalLink,
  Folder,
  Trash2,
  Rocket,
  Plus,
  Archive,
  RotateCcw,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { SpaceTemplate } from "@/lib";
import { EmptyState } from "@/components/ui/empty-state";
import { truncatePath } from "@/lib/utils";
import { ViewMode } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  archivedSelectedIds: Set<string>;
  setArchivedSelectedIds: (ids: Set<string>) => void;
  onLaunch: (template: SpaceTemplate) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onCapture?: () => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export function WorkspacesTab({
  templates,
  searchQuery,
  viewMode,
  selectedIds,
  onToggleSelection,
  archivedSelectedIds,
  setArchivedSelectedIds,
  onLaunch,
  onDelete,
  onArchive,
  onRestore,
  onCapture,
  activeSubTab,
  onSubTabChange,
}: WorkspacesTabProps) {
  // State lifted to CortexLibraryDialog to persist across sidebar navigation

  const activeTemplates = useMemo(
    () => templates.filter((t) => !t.isArchived),
    [templates],
  );

  const archivedTemplates = useMemo(
    () => templates.filter((t) => t.isArchived),
    [templates],
  );

  const filtered = useMemo(
    () =>
      activeTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.rootPath.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [activeTemplates, searchQuery],
  );

  const archivedFiltered = useMemo(
    () =>
      archivedTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.rootPath.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [archivedTemplates, searchQuery],
  );

  // Active view: no delete button
  const renderActiveContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Rocket}
          title={
            searchQuery ? "No Active Workspaces Found" : "No Active Workspaces"
          }
          description={
            searchQuery
              ? `No active templates matching "${searchQuery}" were found.`
              : "Capture your workspace configurations or archive items from here."
          }
          iconColor="text-purple-500/30"
          compact
        />
      );
    }

    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedIds.has(template.id)}
              onToggleSelection={() => onToggleSelection(template.id)}
              onLaunch={() => onLaunch(template)}
              onArchive={onArchive ? () => onArchive(template.id) : undefined}
            />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Name
            </TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Path
            </TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Created
            </TableHead>
            <TableHead className="w-20 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((template) => (
            <TableRow
              key={template.id}
              className="cursor-pointer transition-all hover:bg-[var(--text-primary)]/[0.02]"
              onClick={() => onLaunch(template)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div
                  onClick={() => onToggleSelection(template.id)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                    selectedIds.has(template.id)
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                  )}
                >
                  {selectedIds.has(template.id) && (
                    <Plus size={10} className="text-black rotate-45" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <LayoutPreviewIcon
                    layout={template.layout}
                    className="w-8 h-6 border bg-[var(--bg-color)] rounded border-[var(--border-color)] shrink-0"
                  />
                  <div>
                    <div className="text-[12px] font-bold text-[var(--text-primary)] leading-tight">
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-[11.5px] text-[var(--text-secondary)]/75 truncate max-w-[200px]">
                        {template.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] text-[var(--text-secondary)]/70">
                  {truncatePath(template.rootPath, 25)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-[10px] text-[var(--text-secondary)]/60">
                  {formatTimeAgo(template.createdAt)}
                </span>
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                {onArchive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                        onClick={() => onArchive(template.id)}
                      >
                        <Archive size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Archive</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const toggleArchivedSelection = (id: string) => {
    const next = new Set(archivedSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setArchivedSelectedIds(next);
  };

  // Archived view: only Restore + Delete (Trash2), no archive button
  const renderArchivedContent = () => {
    if (archivedFiltered.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          title="No Archived Templates"
          description={
            searchQuery
              ? `No archived templates matching "${searchQuery}" were found.`
              : "Archived workspaces will appear here."
          }
          iconColor="text-[var(--text-secondary)]/30"
          compact
        />
      );
    }

    return (
      <>
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {archivedFiltered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={archivedSelectedIds.has(template.id)}
                onToggleSelection={() => toggleArchivedSelection(template.id)}
                onLaunch={undefined} // No launch in archived view
                onArchive={undefined} // No archive button in archived view
                onRestore={onRestore ? () => onRestore(template.id) : undefined}
                onDelete={() => onDelete(template.id)}
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Name
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Path
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Created
                </TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFiltered.map((template) => (
                <TableRow
                  key={template.id}
                  className={cn(
                    "transition-all cursor-default",
                    archivedSelectedIds.has(template.id)
                      ? "bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]"
                      : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]",
                  )}
                >
                  <TableCell>
                    <div
                      onClick={() => toggleArchivedSelection(template.id)}
                      className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                        archivedSelectedIds.has(template.id)
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                          : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                      )}
                    >
                      {archivedSelectedIds.has(template.id) && (
                        <Plus size={10} className="text-black rotate-45" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <LayoutPreviewIcon
                        layout={template.layout}
                        className="w-8 h-6 border bg-[var(--bg-color)] rounded border-[var(--border-color)] shrink-0 opacity-60"
                      />
                      <div>
                        <div className="text-[12px] font-medium text-[var(--text-primary)]/60 leading-tight">
                          {template.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px]">
                      {truncatePath(template.rootPath, 25)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px]">
                      {formatTimeAgo(template.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                            onClick={() => onRestore && onRestore(template.id)}
                          >
                            <RotateCcw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Restore</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => onDelete(template.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeSubTab}
        onValueChange={onSubTabChange}
        className="space-y-6"
      >
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger
              value="active"
              className="text-[11px] font-bold tracking-wider"
            >
              Active ({activeTemplates.length})
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="text-[11px] font-bold tracking-wider"
            >
              Archived ({archivedTemplates.length})
            </TabsTrigger>
          </TabsList>

          {onCapture && (
            <Button
              onClick={onCapture}
              className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
            >
              <Plus size={14} strokeWidth={3} /> Capture Current
            </Button>
          )}
        </div>

        <TabsContent value="active">{renderActiveContent()}</TabsContent>

        <TabsContent value="archived">{renderArchivedContent()}</TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onToggleSelection,
  onLaunch,
  onArchive,
  onRestore,
  onDelete,
}: {
  template: SpaceTemplate;
  isSelected: boolean;
  onToggleSelection: () => void;
  onLaunch?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 overflow-hidden border border-[var(--border-color)]",
        onLaunch ? "cursor-pointer" : "cursor-default",
      )}
      onClick={() => {
        if (onLaunch) onLaunch();
      }}
    >
      <CardHeader className="p-4 pb-2 border-none group/header">
        <div className="flex items-start gap-3 min-w-0">
          <LayoutPreviewIcon
            layout={template.layout}
            className="w-10 h-8 border bg-[var(--bg-color)] shrink-0 rounded-sm border-[var(--border-color)] mt-0.5"
          />
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection();
                }}
                className={cn(
                  "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0",
                  isSelected
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                    : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                )}
              >
                {isSelected && (
                  <Plus size={10} className="text-black rotate-45" />
                )}
              </div>
              <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight">
                {template.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] min-w-0">
              <Folder size={10} className="shrink-0 opacity-80" />
              <span className="block flex-1 truncate whitespace-nowrap">
                {truncatePath(template.rootPath, 35)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-0 pb-3 flex-1 min-w-0">
        {template.description ? (
          <p className="text-[13px] leading-relaxed line-clamp-2 text-[var(--text-secondary)]/85 font-medium">
            {template.description}
          </p>
        ) : (
          <p className="text-[11px] tracking-wider font-bold opacity-20 text-[var(--text-secondary)]">
            No description
          </p>
        )}
      </CardContent>

      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between group/footer">
        <span className="text-[9px] text-[var(--text-secondary)] font-medium flex items-center gap-1 leading-none">
          <Clock size={10} /> {formatTimeAgo(template.createdAt)}
        </span>
        <div className="flex items-center gap-2.5">
          {onArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Archive
              </TooltipContent>
            </Tooltip>
          )}
          {onRestore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                >
                  <RotateCcw size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Restore
              </TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400 hover:bg-red-500/10 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Delete Permanently
              </TooltipContent>
            </Tooltip>
          )}
          {onLaunch && (
            <ExternalLink
              size={11}
              className="text-[var(--text-secondary)]/60 group-hover/footer:text-[var(--accent-primary)] transition-colors"
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
