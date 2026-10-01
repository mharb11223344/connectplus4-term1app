// Each learning site reports progress changes to the signed-in Mona portal.
// The portal validates the iframe and saves the matching app state in Supabase.
(() => {
  if (window.self === window.top) return;
  const keysByApp = {
    'english3-1termapp': ['monaPrimary3AppV1'],
    'connectplus3-term1app': ['connectPlus3MonaHarbV2'],
    'connectplus4-term1app': ['mona-primary4-profile-v1', 'mona-primary4-progress-v1'],
    'Plus4app-term1': ['connect-plus-student', 'connect-plus-progress', 'connect-plus-quiz-checkpoint', 'connect-plus-answer-count'],
  };
  const appId = location.pathname.split('/').filter(Boolean)[0];
  const keys = keysByApp[appId];
  if (!keys) return;
  const snapshot = () => JSON.stringify(keys.map(key => localStorage.getItem(key)));
  let last = snapshot();
  const announce = () => window.parent.postMessage({ type: 'mona:progress-changed', appId }, location.origin);
  setInterval(() => {
    const next = snapshot();
    if (next === last) return;
    last = next;
    announce();
  }, 700);
  window.addEventListener('pagehide', announce);
})();
