import { useState, useEffect } from "react";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

interface ParsedIcon {
  href: string;
}

function parseIconReferences(html: string): ParsedIcon[] {
  const icons: ParsedIcon[] = [];
  const patterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
  ];
  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const href = match[1];
      if (!icons.some((i) => i.href === href)) {
        icons.push({ href });
      }
    }
  }
  return icons;
}

function resolveIconPath(rootPath: string, href: string): string {
  const clean = href.replace(/^\//, "");
  return `${rootPath}/${clean}`;
}

async function findIconFile(rootPath: string): Promise<string | null> {
  try {
    const indexPath = `${rootPath}/index.html`;
    const htmlExists = await exists(indexPath);
    if (!htmlExists) return null;

    const html = await readTextFile(indexPath);
    const icons = parseIconReferences(html);
    if (icons.length === 0) return null;

    for (const icon of icons) {
      const iconPath = resolveIconPath(rootPath, icon.href);
      const fileExists = await exists(iconPath);
      if (fileExists) return iconPath;

      const withPublic = `${rootPath}/public${icon.href.startsWith("/") ? icon.href : `/${icon.href}`}`;
      const publicExists = await exists(withPublic);
      if (publicExists) return withPublic;
    }

    return null;
  } catch {
    return null;
  }
}

export function useProjectIcon(rootPath: string | null | undefined): string | null {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rootPath) {
      setIconUrl(null);
      return;
    }

    let cancelled = false;

    (async () => {
      // Check if it is a direct image file path
      const isImagePath = /\.(png|jpe?g|svg|ico|webp)$/i.test(rootPath);
      if (isImagePath) {
        if (!cancelled) {
          setIconUrl(convertFileSrc(rootPath));
        }
        return;
      }

      const filePath = await findIconFile(rootPath);
      if (cancelled) return;
      if (filePath) {
        setIconUrl(convertFileSrc(filePath));
      } else {
        setIconUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rootPath]);

  return iconUrl;
}
