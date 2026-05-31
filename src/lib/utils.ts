import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

