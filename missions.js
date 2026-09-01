const MissionSystem = (() => {
  const STORAGE_KEY = 'operacao15.daily-missions.v1';

  // Catálogo inicial: futuras fontes inteligentes, especiais e sazonais serão agregadas aqui.
  const INITIAL_MISSION_CATALOG = {
    phoenix: [
      { id: 'training-alpha', title: 'Treino Alfa', detail: 'Ficha A · cardio estratégico', icon: '↗' },
      { id: 'daily-movement', title: 'Movimento diário', detail: 'Meta de 8.000 passos', icon: '⌁' },
      { id: 'hydration', title: 'Hidratação tática', detail: 'Complete sua meta de água', icon: '◒' },
      { id: 'nutrition-alignment', title: 'Nutrição alinhada', detail: 'Mantenha o protocolo alimentar', icon: '◈' }
    ],
    titan: [
      { id: 'training-bravo', title: 'Treino Bravo', detail: 'Ficha B · execute a sessão programada', icon: '◆' },
      { id: 'construction-nutrition', title: 'Nutrição de construção', detail: 'Siga o plano alimentar do dia', icon: '◈' },
      { id: 'hydration', title: 'Hidratação tática', detail: 'Complete sua meta de água', icon: '◒' },
      { id: 'recovery', title: 'Recuperação estratégica', detail: 'Reserve tempo para recuperação', icon: '⌁' }
    ],
    equilibrio: [
      { id: 'training-charlie', title: 'Treino Charlie', detail: 'Ficha C · execute a sessão planejada', icon: '◆' },
      { id: 'daily-movement', title: 'Movimento diário', detail: 'Mantenha seu corpo em ação', icon: '↗' },
      { id: 'balanced-nutrition', title: 'Nutrição equilibrada', detail: 'Siga o protocolo do dia', icon: '◈' },
      { id: 'hydration', title: 'Hidratação tática', detail: 'Complete sua meta de água', icon: '◒' }
    ],
    performance: [
      { id: 'training-delta', title: 'Treino Delta', detail: 'Ficha D · condicionamento programado', icon: '↗' },
      { id: 'mobility', title: 'Mobilidade operacional', detail: 'Reserve tempo para mobilidade', icon: '⌁' },
      { id: 'daily-activity', title: 'Atividade de base', detail: 'Mantenha seu nível de movimento', icon: '◆' },
      { id: 'recovery', title: 'Recuperação estratégica', detail: 'Priorize a recuperação do corpo', icon: '◒' }
    ]
  };

  function todayKey() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function createState(operation) {
    return saveState({ date: todayKey(), operation, completedMissionIds: [], completedAt: null });
  }

  function getDailyState(operation) {
    const state = readState();
    if (!state || state.date !== todayKey() || state.operation !== operation) return createState(operation);
    return state;
  }

  function getContext(operation) {
    if (!INITIAL_MISSION_CATALOG[operation]) return null;
    const state = getDailyState(operation);
    const missions = INITIAL_MISSION_CATALOG[operation];
    const completedMissionIds = state.completedMissionIds.filter((id) => missions.some((mission) => mission.id === id));
    const completedMissions = completedMissionIds.length;
    return {
      operation,
      date: state.date,
      catalog: 'initial',
      missions,
      completedMissionIds,
      totalMissions: missions.length,
      completedMissions,
      pendingMissionIds: missions.filter((mission) => !completedMissionIds.includes(mission.id)).map((mission) => mission.id),
      progressPercent: Math.round((completedMissions / missions.length) * 100),
      isDailyMissionComplete: completedMissions === missions.length,
      completedAt: state.completedAt
    };
  }

  function toggleMission(operation, missionId) {
    const state = getDailyState(operation);
    const missions = INITIAL_MISSION_CATALOG[operation] || [];
    if (!missions.some((mission) => mission.id === missionId)) return getContext(operation);
    const completed = new Set(state.completedMissionIds);
    completed.has(missionId) ? completed.delete(missionId) : completed.add(missionId);
    state.completedMissionIds = [...completed];
    const isComplete = state.completedMissionIds.length === missions.length;
    const justCompleted = isComplete && !state.completedAt;
    state.completedAt = isComplete ? (state.completedAt || new Date().toISOString()) : null;
    saveState(state);
    return { ...getContext(operation), justCompleted };
  }

  function hasActiveProtocol(operation) {
    const state = readState();
    return Boolean(state && state.date === todayKey() && state.operation === operation);
  }

  function restartForOperation(operation) {
    return createState(operation);
  }

  return { getContext, toggleMission, hasActiveProtocol, restartForOperation };
})();
