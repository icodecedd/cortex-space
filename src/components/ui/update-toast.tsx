import { Zap, X } from "@/components/ui/icons";

export interface UpdateToastProps {
  version?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

/**
 * Premium, minimalist dark-mode update toast notification.
 * 
 * Specifications:
 * - Layout: Fixed width (max-w-md), rounded-xl, #121212 background.
 * - Alignment: Horizontal flex with square icon on left; text/buttons column on right.
 * - Button Alignment: Aligned with the left edge of the text, not the outer card edge.
 * - Primary: Low-contrast solid dark-charcoal background.
 * - Secondary: Outline style, transparent background, subtle border.
 */
export const UpdateToast = ({
  version = "v4.2",
  onInstall,
  onDismiss,
}: UpdateToastProps) => {
  return (
    <div className="flex w-full max-w-md gap-4 rounded-xl border border-zinc-800 bg-[#121212] p-4 text-left shadow-2xl">
      {/* Icon Container: Square icon container sits on the far left */}
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400">
          <Zap size={20} />
        </div>
      </div>

      {/* Content Column: houses the text and buttons */}
      <div className="flex flex-1 flex-col">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-100">
              A new update is available
            </span>
            <span className="font-light text-zinc-600">|</span>
            <span className="text-sm font-medium text-zinc-500">{version}</span>
          </div>
          <button 
            onClick={onDismiss}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="mt-1 text-xs font-normal leading-relaxed text-zinc-400">
          Includes the all new dashboard view. Pages and exports will now load faster.
        </p>

        {/* Action Buttons: Perfectly aligned with the left edge of Title/Description text */}
        <div className="mt-4 flex gap-3">
          {/* Primary Button ("Install now") */}
          <button
            onClick={onInstall}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-700 active:scale-[0.98]"
          >
            Install now
          </button>
          
          {/* Secondary Button ("Skip this update") */}
          <button
            onClick={onDismiss}
            className="rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800/50 active:scale-[0.98]"
          >
            Skip this update
          </button>
        </div>
      </div>
    </div>
  );
};
