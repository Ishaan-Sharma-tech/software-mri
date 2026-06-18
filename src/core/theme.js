// Theme switcher logic
export async function initTheme() {
  const savedTheme = localStorage.getItem('smri_theme');
  setTheme(savedTheme || 'dark');
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('smri_theme', theme);
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}
