import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates a file path from the middle to preserve the most important parts (start and end).
 * Example: C:\Users\Name\Documents\Project -> C:\...\Project
 */
export function truncatePath(path: string, maxLength: number = 40): string {
  if (!path || path.length <= maxLength) return path;

  // Determine separator (detect both but prefer what's in the path)
  const hasBackslash = path.includes('\\');
  const hasForwardSlash = path.includes('/');
  const separator = hasBackslash ? '\\' : '/';
  
  // Split the path into parts, preserving empty parts for leading slashes
  const parts = path.split(/[\\/]/);
  
  if (parts.length <= 1) {
    return path.substring(0, maxLength - 3) + "...";
  }

  // Handle Windows drive or Unix root
  const firstPart = parts[0] === "" ? (hasForwardSlash ? "/" : "") : parts[0];
  const lastPart = parts[parts.length - 1];

  // If even just the last part is too long
  if (lastPart.length > maxLength - 5) {
    return "..." + separator + lastPart.slice(-(maxLength - 4));
  }

  const start = firstPart + separator;
  const end = separator + lastPart;
  const middle = "...";

  if ((start + middle + end).length <= maxLength) {
    return start + middle + end;
  }

  // Fallback to just the end
  return "..." + end;
}

export function formatWorkspaceName(name: string): string {
  if (!name) return "";
  
  // Replace hyphens and underscores with spaces
  const spaced = name.replace(/[-_]/g, " ");
  
  // Capitalize each word
  return spaced
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

