/**
 * Extracts unique variable names from a command string using the {{VARIABLE}} syntax.
 */
export function extractVariables(command: string): string[] {
  const varRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  const seenVars = new Set<string>();
  while ((match = varRegex.exec(command)) !== null) {
    const varName = match[1];
    if (!seenVars.has(varName)) {
      seenVars.add(varName);
      variables.push(varName);
    }
  }
  
  return variables;
}

/**
 * Replaces placeholders in a command string with provided values.
 */
export function resolveVariables(command: string, values: Record<string, string>): string {
  let resolved = command;
  Object.entries(values).forEach(([key, val]) => {
    const placeholder = `{{${key}}}`;
    resolved = resolved.split(placeholder).join(val);
  });
  return resolved;
}
