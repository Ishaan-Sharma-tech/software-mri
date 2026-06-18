import { initTheme } from './core/theme.js';
import { createTitlebar } from './components/titlebar.js';
import { showWelcomeScreen } from './screens/welcome.js';
import { showDashboardScreen } from './screens/dashboard.js';

// Bootstrapping the application
async function bootstrap() {
  // Initialize theme
  await initTheme();

  // Create Titlebar
  createTitlebar(document.getElementById('titlebar-container'));

  // Logic to determine which screen to show
  // For Phase 0, if it's the first launch, show Welcome. Otherwise show Dashboard.
  const isFirstLaunch = !localStorage.getItem('smri_has_launched');
  
  if (isFirstLaunch) {
    showWelcomeScreen(document.getElementById('main-content'));
  } else {
    showDashboardScreen(document.getElementById('main-content'));
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
