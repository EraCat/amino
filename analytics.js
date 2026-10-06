'use strict';
(() => {
  const counter = 113469613;
  const enabled = location.protocol === 'https:' && location.hostname === 'amino.aarapov.xyz';
  const send = (...args) => {
    try { if (enabled) window.ym?.(counter, ...args); } catch { /* Analytics must never interrupt a quiz. */ }
  };
  window.aminoAnalytics = {
    goal: (name, params) => send('reachGoal', name, params),
    section: (section) => send('reachGoal', 'section_open', {section})
  };
  if (!enabled) return;
  window.ym = window.ym || function () {
    // Bound the queue if an extension or network failure blocks the remote script.
    const queue = window.ym.a = window.ym.a || [];
    if (queue.length < 100) queue.push(arguments);
  };
  window.ym.l = Date.now();
  send('init', {
    clickmap: false, trackLinks: false, webvisor: false,
    accurateTrackBounce: true, trackHash: false,
    url: location.origin + location.pathname
  });
  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);
  } catch { /* Keep the application usable if loading is blocked. */ }
})();
