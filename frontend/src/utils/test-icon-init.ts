/**
 * Test utility to verify lucide-react icon initialization
 * This helps diagnose timing issues with icon imports
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function testIconInitialization() {
  const results = {
    timestamp: performance.now(),
    tests: [] as Array<{ name: string; passed: boolean; error?: string; details?: any }>,
  };

  // Test 1: Check if lucide-react module is available
  try {
    const lucideModule = await import('lucide-react');
    results.tests.push({
      name: 'Module import',
      passed: true,
      details: {
        hasActivity: 'Activity' in lucideModule,
        activityType: typeof lucideModule.Activity,
        totalExports: Object.keys(lucideModule).length,
      },
    });
  } catch (error) {
    results.tests.push({
      name: 'Module import',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return results;
  }

  // Test 2: Try to import Activity icon specifically
  try {
    const { Activity } = await import('lucide-react');
    results.tests.push({
      name: 'Activity icon import',
      passed: typeof Activity === 'function',
      details: {
        type: typeof Activity,
        isReactComponent: Activity.displayName !== undefined,
      },
    });
  } catch (error) {
    results.tests.push({
      name: 'Activity icon import',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 3: Check if icons are available on window (from main.tsx)
  if (typeof window !== 'undefined' && (window as any).__lucideReact) {
    const windowLucide = (window as any).__lucideReact;
    results.tests.push({
      name: 'Window global check',
      passed: 'Activity' in windowLucide,
      details: {
        hasActivity: 'Activity' in windowLucide,
        activityType: typeof windowLucide.Activity,
      },
    });
  } else {
    results.tests.push({
      name: 'Window global check',
      passed: false,
      error: '__lucideReact not found on window',
    });
  }

  return results;
}

// Auto-run test if in browser and dev mode
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(async () => {
      const results = await testIconInitialization();
      console.log('[IconInitTest] Results:', results);
    }, 1000);
  });
}

