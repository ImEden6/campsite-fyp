/**
 * Toggle performance dashboard visibility
 */
export const togglePerformanceDashboard = () => {
  const current = localStorage.getItem('show-performance-dashboard') === 'true';
  localStorage.setItem('show-performance-dashboard', String(!current));
  window.location.reload();
};
