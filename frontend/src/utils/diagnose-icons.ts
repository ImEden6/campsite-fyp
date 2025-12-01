/**
 * Diagnostic utility to trace lucide-react icon loading issues
 * This helps identify timing and initialization problems
 */

// Track when icons are imported
const iconImportLog: Array<{ icon: string; timestamp: number; stack: string }> = [];

export function logIconImport(iconName: string) {
  const entry = {
    icon: iconName,
    timestamp: performance.now(),
    stack: new Error().stack || 'no stack',
  };
  iconImportLog.push(entry);
  console.log(`[IconDiagnostic] Imported ${iconName} at ${entry.timestamp}ms`, entry);
}

export function getIconImportLog() {
  return iconImportLog;
}

export function clearIconImportLog() {
  iconImportLog.length = 0;
}

// Check if lucide-react module is properly initialized
export function checkLucideReactInit() {
  try {
    // Try to import a simple icon to see if it works
    const testImport = () => import('lucide-react').then(m => {
      console.log('[IconDiagnostic] lucide-react module:', m);
      console.log('[IconDiagnostic] Has Activity?', 'Activity' in m);
      console.log('[IconDiagnostic] Activity type:', typeof m.Activity);
      return m;
    });
    
    return testImport();
  } catch (error) {
    console.error('[IconDiagnostic] Failed to check lucide-react init:', error);
    return Promise.reject(error);
  }
}

// Wrap icon imports to track them
export function wrapIconImport<T>(iconName: string, importFn: () => Promise<T>): Promise<T> {
  logIconImport(iconName);
  return importFn().catch(error => {
    console.error(`[IconDiagnostic] Failed to import ${iconName}:`, error);
    throw error;
  });
}

