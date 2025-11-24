/**
 * Navigation Service
 * Provides a way for non-React code (like API interceptors) to navigate
 * using React Router without directly using hooks.
 * 
 * This service must be initialized from a React component that has access
 * to the React Router context (useNavigate hook).
 */

type NavigateFunction = (to: string, options?: { replace?: boolean }) => void;

let navigateFunction: NavigateFunction | null = null;

/**
 * Initialize the navigation service with a navigate function from React Router
 * This should be called from a component that has access to useNavigate()
 */
export function initNavigation(navigate: NavigateFunction) {
  navigateFunction = navigate;
}

/**
 * Navigate to a route
 * @param to - The path to navigate to
 * @param options - Navigation options (replace: true to replace current history entry)
 */
export function navigate(to: string, options?: { replace?: boolean }) {
  if (!navigateFunction) {
    // Fallback to window.location if navigation not initialized
    // This can happen if called before React Router is ready
    console.warn('Navigation service not initialized, falling back to window.location');
    window.location.href = to;
    return;
  }
  navigateFunction(to, options);
}

/**
 * Check if navigation service is initialized
 */
export function isNavigationInitialized(): boolean {
  return navigateFunction !== null;
}

