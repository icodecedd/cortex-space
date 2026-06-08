# Code Standards & Iconography Rules

To maintain high software quality, performance, and UI consistency, all development on Cortex Space must adhere to the following coding standards.

---

## 1. TypeScript & React Guidelines

- **Strict Type Checking:** TypeScript compilation checks must always pass. Do not suppress typescript warnings with `@ts-ignore` or `@ts-expect-error` unless absolutely unavoidable and documented.
- **Avoid `any`:** Prefer structured interfaces, custom union types, or generic type parameters.
- **Component Signatures:** Define components using standard functional declarations. Avoid inline type declarations for complex props; declare them explicitly:
  ```tsx
  interface PaneHeaderProps {
    id: string;
    title: string;
    isActive: boolean;
    onClose: () => void;
  }
  
  export function PaneHeader({ id, title, isActive, onClose }: PaneHeaderProps) {
    // ...
  }
  ```
- **Custom React Hooks:** Business logic, settings accessors, and asynchronous state loading should live inside centralized hooks under `src/hooks/` (e.g., `useTheme.ts`, `useAgents.ts`, `useSetupPanes.ts`).

---

## 2. Iconography & Hugeicons Standard (CRITICAL)

The project has completely removed the `lucide-react` dependency and migrated to **Hugeicons**. All UI components must follow these guidelines:

### A. The Core Mapping Registry
- All icon components used in JSX/TSX files **must** be imported from the central wrapper at `@/components/ui/icons`.
- **Direct import of icons from `@hugeicons/react` or other library subpaths is prohibited.** This ensures a single abstraction layer, standard size defaults, and prop forwarding.

### B. Adding a New Icon
If your component requires an icon that is not yet mapped in [icons.tsx](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/src/components/ui/icons.tsx):
1. Look up the icon name in `@hugeicons/core-free-icons` by viewing or searching the type declarations file at [node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts).
2. Open `src/components/ui/icons.tsx`.
3. Import the icon (if using namespace `HugeIcons.*` you can just reference it directly).
4. Add a new wrapped export mapping the name your component expects:
   ```typescript
   // Example mapping:
   export const Settings = wrapIcon(HugeIcons.Settings01Icon);
   ```
5. Import it in your React component file:
   ```typescript
   import { Settings } from "@/components/ui/icons";
   ```

### C. Standard Icon Props
The custom wrapper returns a React component matching:
```typescript
export interface IconProps extends Omit<React.ComponentPropsWithoutRef<typeof HugeiconsIcon>, "icon"> {
  size?: number | string; // Numeric value (e.g., 14) or string (e.g., "14")
  color?: string;         // Hex, HSL, or CSS variables
  className?: string;     // Tailwind classes or native styles
}
```

---

## 3. Project Configuration & package.json

- **Package Dependency Standard:** 
  All project dependencies are defined inside [package.json](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/package.json). Do not introduce UI packages that conflict with our CSS system or bloat build chunks without checking bundle impact.
- **Verification Scripts:**
  - `npm run check-types`: Runs `tsc --noEmit` to verify type safety. Always run this before pushing changes.
  - `npm run build`: Bundles the production application using Vite. Verifies that no build issues or chunk resolution errors exist.
  - `npm run tauri dev`: Launches the Tauri developer workflow with live hot-reloading for rapid UI prototyping.
