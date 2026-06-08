import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import * as HugeIcons from "@hugeicons/core-free-icons";

export interface IconProps extends Omit<React.ComponentPropsWithoutRef<typeof HugeiconsIcon>, "icon"> {
  size?: number | string;
  color?: string;
  className?: string;
}

export type IconType = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export function wrapIcon(icon: any): IconType {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, color = "currentColor", className, ...props }, ref) => {
      const parsedSize = typeof size === "string" ? parseInt(size, 10) : size;
      return (
        <HugeiconsIcon
          ref={ref as any}
          icon={icon}
          size={isNaN(parsedSize) ? 24 : parsedSize}
          color={color}
          className={className}
          {...(props as any)}
        />
      );
    }
  );
  Component.displayName = "HugeiconWrapper";
  return Component;
}

// Icon Mappings
export const Square = wrapIcon(HugeIcons.SquareIcon);
export const Activity = wrapIcon(HugeIcons.ActivityIcon);
export const CornerDownLeft = wrapIcon(HugeIcons.CornerDownLeftIcon);
export const X = wrapIcon(HugeIcons.Cancel01Icon);
export const XIcon = wrapIcon(HugeIcons.Cancel01Icon);
export const OctagonXIcon = wrapIcon(HugeIcons.CancelCircleIcon);
export const MoreVertical = wrapIcon(HugeIcons.MoreVerticalIcon);
export const SquareSplitVertical = wrapIcon(HugeIcons.DistributeHorizontalCenterIcon);
export const SquareSplitHorizontal = wrapIcon(HugeIcons.DistributeVerticalCenterIcon);
export const Trash2 = wrapIcon(HugeIcons.Delete02Icon);
export const BookmarkPlus = wrapIcon(HugeIcons.Bookmark02Icon);
export const RefreshCw = wrapIcon(HugeIcons.RefreshCw);
export const Maximize2 = wrapIcon(HugeIcons.SquareArrowExpand01Icon);
export const Minimize2 = wrapIcon(HugeIcons.SquareArrowShrink02Icon);
export const Maximize = wrapIcon(HugeIcons.MaximizeIcon);
export const Copy = wrapIcon(HugeIcons.Copy01Icon);
export const ExternalLink = wrapIcon(HugeIcons.ArrowUpRight01Icon);
export const Globe = wrapIcon(HugeIcons.GlobeIcon);
export const Monitor = wrapIcon(HugeIcons.ComputerIcon);
export const Settings = wrapIcon(HugeIcons.Settings01Icon);
export const Settings2 = wrapIcon(HugeIcons.Settings02Icon);
export const Target = wrapIcon(HugeIcons.Target01Icon);
export const Keyboard = wrapIcon(HugeIcons.KeyboardIcon);
export const Terminal = wrapIcon(HugeIcons.TerminalIcon);
export const SquareTerminal = wrapIcon(HugeIcons.ComputerTerminal02Icon);
export const Palette = wrapIcon(HugeIcons.Palette);
export const FlaskConical = wrapIcon(HugeIcons.Chemistry01Icon);
export const Info = wrapIcon(HugeIcons.InformationCircleIcon);
export const InfoIcon = wrapIcon(HugeIcons.InformationCircleIcon);
export const Cpu = wrapIcon(HugeIcons.CpuIcon);
export const Plus = wrapIcon(HugeIcons.PlusSignIcon);
export const Database = wrapIcon(HugeIcons.Database01Icon);
export const CheckCircle2 = wrapIcon(HugeIcons.CheckmarkCircle02Icon);
export const CircleCheckIcon = wrapIcon(HugeIcons.CheckmarkCircle01Icon);
export const Check = wrapIcon(HugeIcons.CheckIcon);
export const CheckIcon = wrapIcon(HugeIcons.CheckIcon);
export const Code = wrapIcon(HugeIcons.CodeIcon);
export const Library = wrapIcon(HugeIcons.Book01Icon);
export const RotateCcw = wrapIcon(HugeIcons.ReloadIcon);
export const FolderOpen = wrapIcon(HugeIcons.FolderOpenIcon);
export const Download = wrapIcon(HugeIcons.Download01Icon);
export const AlertCircle = wrapIcon(HugeIcons.AlertCircleIcon);
export const TriangleAlertIcon = wrapIcon(HugeIcons.AlertTriangle);
export const Loader2 = wrapIcon(HugeIcons.Loading01Icon);
export const Loader2Icon = wrapIcon(HugeIcons.Loading01Icon);
export const Zap = wrapIcon(HugeIcons.FlashIcon);
export const Command = wrapIcon(HugeIcons.CommandIcon);
export const Lock = wrapIcon(HugeIcons.LockIcon);
export const Save = wrapIcon(HugeIcons.SaveIcon);
export const Layout = wrapIcon(HugeIcons.Layout01Icon);
export const Layers = wrapIcon(HugeIcons.Layers01Icon);
export const ShieldCheck = wrapIcon(HugeIcons.ShieldCheck);
export const ChevronLeft = wrapIcon(HugeIcons.ChevronLeftIcon);
export const ChevronRight = wrapIcon(HugeIcons.ChevronRightIcon);
export const ChevronRightIcon = wrapIcon(HugeIcons.ChevronRightIcon);
export const ChevronDownIcon = wrapIcon(HugeIcons.ChevronDownIcon);
export const ChevronUpIcon = wrapIcon(HugeIcons.ChevronUpIcon);
export const Play = wrapIcon(HugeIcons.PlayIcon);
export const Search = wrapIcon(HugeIcons.Search01Icon);
export const Folder = wrapIcon(HugeIcons.FolderIcon);
export const Bot = wrapIcon(HugeIcons.AiBrainIcon);
export const Rocket = wrapIcon(HugeIcons.RocketIcon);
export const ChevronRightSquare = wrapIcon(HugeIcons.SquareArrowRight01Icon);
export const Ban = wrapIcon(HugeIcons.UnavailableIcon);
export const Edit2 = wrapIcon(HugeIcons.PencilEdit01Icon);
export const ArrowRight = wrapIcon(HugeIcons.ArrowRight01Icon);
export const Pin = wrapIcon(HugeIcons.PinIcon);
export const PinOff = wrapIcon(HugeIcons.PinOffIcon);
export const Users = wrapIcon(HugeIcons.UserGroupIcon);
export const Minus = wrapIcon(HugeIcons.MinusSignIcon);
export const Clock = wrapIcon(HugeIcons.Clock01Icon);
export const History = wrapIcon(HugeIcons.HistoryIcon);
export const Type = wrapIcon(HugeIcons.TextIcon);
export const MousePointer2 = wrapIcon(HugeIcons.CursorPointer01Icon);
export const AlertTriangle = wrapIcon(HugeIcons.AlertTriangle);
export const RefreshCcw = wrapIcon(HugeIcons.ReloadIcon);
export const Book = wrapIcon(HugeIcons.Book02Icon);
export const Github = wrapIcon(HugeIcons.GithubIcon);
