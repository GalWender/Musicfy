// Early PWA install event capture so React components don't miss the event
let _deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent automatic mini-infobar
  e.preventDefault();
  _deferredPrompt = e;
  // Notify app that install prompt is available
  window.dispatchEvent(new CustomEvent('pwa:beforeinstallprompt'));
});

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa:appinstalled'));
});

export function getDeferredPrompt() {
  return _deferredPrompt;
}
