const TrainingGenerator = (() => {
  const TRAINING_LIBRARY = [
    { id: 'bench-press', name: 'Supino reto', muscleGroup: 'peito', secondaryGroups: ['tríceps', 'ombros'], movementPattern: 'empurrar horizontal', equipment: 'barra', level: 'recruta', characteristics: ['base de força', 'pressão horizontal'], possibilityOfSubstitution: 'supino inclinado', tags: ['titan', 'performance', 'operador', 'veterano'] },
    { id: 'incline-bench', name: 'Supino inclinado', muscleGroup: 'peito', secondaryGroups: ['ombros', 'tríceps'], movementPattern: 'empurrar horizontal', equipment: 'barra', level: 'recruta', characteristics: ['ângulo de desenvolvimento', 'força de empurrar'], possibilityOfSubstitution: 'press de máquina', tags: ['titan', 'performance', 'operador', 'veterano'] },
    { id: 'dumbbell-press', name: 'Press de halteres', muscleGroup: 'peito', secondaryGroups: ['ombros', 'tríceps'], movementPattern: 'empurrar horizontal', equipment: 'halteres', level: 'recruta', characteristics: ['mobilidade de ombro', 'controle'], possibilityOfSubstitution: 'supino reto', tags: ['titan', 'performance', 'equilibrio'] },
    { id: 'overhead-press', name: 'Desenvolvimento militar', muscleGroup: 'ombros', secondaryGroups: ['tríceps', 'core'], movementPattern: 'empurrar vertical', equipment: 'barra', level: 'operador', characteristics: ['estabilidade de tronco', 'potência vertical'], possibilityOfSubstitution: 'press de bancada', tags: ['performance', 'titan', 'veterano'] },
    { id: 'lateral-raise', name: 'Elevação lateral', muscleGroup: 'ombros', secondaryGroups: ['trapezio'], movementPattern: 'empurrar vertical', equipment: 'halteres', level: 'recruta', characteristics: ['deltoide médio', 'estética funcional'], possibilityOfSubstitution: 'elevação frontal', tags: ['performance', 'phoenix', 'equilibrio'] },
    { id: 'close-grip-press', name: 'Press pegada fechada', muscleGroup: 'tríceps', secondaryGroups: ['peito', 'ombros'], movementPattern: 'empurrar horizontal', equipment: 'barra', level: 'operador', characteristics: ['tríceps e empurrar', 'força pressora'], possibilityOfSubstitution: 'tríceps pulley', tags: ['titan', 'performance', 'veterano'] },
    { id: 'triceps-pulldown', name: 'Tríceps no pulley', muscleGroup: 'tríceps', secondaryGroups: ['ombros'], movementPattern: 'puxar vertical', equipment: 'pulley', level: 'recruta', characteristics: ['isolamento de extensão', 'controle de cabo'], possibilityOfSubstitution: 'press pegada fechada', tags: ['phoenix', 'performance', 'equilibrio'] },
    { id: 'barbell-row', name: 'Remada barra', muscleGroup: 'costas', secondaryGroups: ['bíceps', 'ombros'], movementPattern: 'puxar horizontal', equipment: 'barra', level: 'recruta', characteristics: ['força de puxada', 'postura'], possibilityOfSubstitution: 'remada sentada', tags: ['titan', 'performance', 'equilibrio'] },
    { id: 'seated-row', name: 'Remada sentada', muscleGroup: 'costas', secondaryGroups: ['bíceps', 'ombros'], movementPattern: 'puxar horizontal', equipment: 'cabo', level: 'recruta', characteristics: ['tráção controlada', 'retenção escapular'], possibilityOfSubstitution: 'remada barra', tags: ['titan', 'performance', 'phoenix'] },
    { id: 'lat-pulldown', name: 'Puxada na barra', muscleGroup: 'costas', secondaryGroups: ['bíceps', 'ombros'], movementPattern: 'puxar vertical', equipment: 'pulley', level: 'recruta', characteristics: ['amplitude e postura', 'tráção vertical'], possibilityOfSubstitution: 'remada sentada', tags: ['phoenix', 'performance', 'equilibrio', 'titan'] },
    { id: 'single-arm-row', name: 'Remada unilateral', muscleGroup: 'costas', secondaryGroups: ['bíceps', 'core'], movementPattern: 'puxar horizontal', equipment: 'halter', level: 'recruta', characteristics: ['assimetria controlada', 'estabilidade'], possibilityOfSubstitution: 'remada sentada', tags: ['equilibrio', 'phoenix', 'performance'] },
    { id: 'barbell-curl', name: 'Rosca direta', muscleGroup: 'bíceps', secondaryGroups: ['antebraço', 'ombros'], movementPattern: 'puxar vertical', equipment: 'barra', level: 'recruta', characteristics: ['força de flexão', 'controle de carga'], possibilityOfSubstitution: 'rosca martelo', tags: ['titan', 'performance', 'veterano'] },
    { id: 'hammer-curl', name: 'Rosca martelo', muscleGroup: 'bíceps', secondaryGroups: ['antebraço', 'ombros'], movementPattern: 'puxar vertical', equipment: 'halteres', level: 'recruta', characteristics: ['braquial e antebraço', 'controle'], possibilityOfSubstitution: 'rosca direta', tags: ['phoenix', 'equilibrio', 'performance'] },
    { id: 'preacher-curl', name: 'Rosca no banco', muscleGroup: 'bíceps', secondaryGroups: ['antebraço'], movementPattern: 'puxar vertical', equipment: 'máquina', level: 'operador', characteristics: ['isolamento de bíceps', 'controle'], possibilityOfSubstitution: 'rosca martelo', tags: ['titan', 'operador', 'veterano'] },
    { id: 'squat', name: 'Agachamento livre', muscleGroup: 'quadríceps', secondaryGroups: ['glúteos', 'core'], movementPattern: 'agachar', equipment: 'barra', level: 'recruta', characteristics: ['base de força', 'controle de tronco'], possibilityOfSubstitution: 'leg press', tags: ['titan', 'performance', 'veterano'] },
    { id: 'leg-press', name: 'Leg press', muscleGroup: 'quadríceps', secondaryGroups: ['glúteos', 'panturrilhas'], movementPattern: 'agachar', equipment: 'máquina', level: 'recruta', characteristics: ['carga controlada', 'volume eficaz'], possibilityOfSubstitution: 'agachamento livre', tags: ['titan', 'phoenix', 'performance'] },
    { id: 'front-squat', name: 'Agachamento front squat', muscleGroup: 'quadríceps', secondaryGroups: ['core', 'glúteos'], movementPattern: 'agachar', equipment: 'barra', level: 'operador', characteristics: ['trunk brace', 'força profunda'], possibilityOfSubstitution: 'leg press', tags: ['titan', 'veterano', 'performance'] },
    { id: 'romanian-deadlift', name: 'Hip hinge', muscleGroup: 'posteriores', secondaryGroups: ['glúteos', 'core'], movementPattern: 'dominante de quadril', equipment: 'barra', level: 'operador', characteristics: ['posteriores e glúteos', 'controle de extensão'], possibilityOfSubstitution: 'levantamento terra', tags: ['titan', 'performance', 'operador'] },
    { id: 'deadlift', name: 'Levantamento terra', muscleGroup: 'posteriores', secondaryGroups: ['glúteos', 'quadríceps'], movementPattern: 'dominante de quadril', equipment: 'barra', level: 'veterano', characteristics: ['força total', 'potência explosiva'], possibilityOfSubstitution: 'hip hinge', tags: ['titan', 'veterano', 'performance'] },
    { id: 'hip-thrust', name: 'Hip thrust', muscleGroup: 'glúteos', secondaryGroups: ['posteriores', 'core'], movementPattern: 'dominante de quadril', equipment: 'barra', level: 'recruta', characteristics: ['ativa glúteo', 'estabilidade de pelve'], possibilityOfSubstitution: 'levantamento terra', tags: ['titan', 'performance', 'equilibrio'] },
    { id: 'hamstring-curl', name: 'Flexão de joelho em máquina', muscleGroup: 'posteriores', secondaryGroups: ['glúteos'], movementPattern: 'flexão de joelho', equipment: 'máquina', level: 'recruta', characteristics: ['seleção de posteriores', 'resistência'], possibilityOfSubstitution: 'hip hinge', tags: ['phoenix', 'performance', 'equilibrio'] },
    { id: 'walking-lunge', name: 'Avanço caminhado', muscleGroup: 'quadríceps', secondaryGroups: ['glúteos', 'core'], movementPattern: 'agachar', equipment: 'halteres', level: 'recruta', characteristics: ['estabilidade unilateral', 'mobilidade'], possibilityOfSubstitution: 'leg press', tags: ['phoenix', 'equilibrio', 'performance'] },
    { id: 'calf-raise', name: 'Elevação de panturrilha', muscleGroup: 'panturrilhas', secondaryGroups: ['posteriores'], movementPattern: 'flexão de joelho', equipment: 'máquina', level: 'recruta', characteristics: ['sustentação do tornozelo', 'estabilidade'], possibilityOfSubstitution: 'pular na caixa', tags: ['phoenix', 'performance', 'equilibrio', 'titan'] },
    { id: 'plank', name: 'Prancha frontal', muscleGroup: 'core', secondaryGroups: ['ombros', 'quadril'], movementPattern: 'core', equipment: 'sem carga', level: 'recruta', characteristics: ['anti-extensão', 'rigidez'], possibilityOfSubstitution: 'dead bug', tags: ['phoenix', 'equilibrio', 'performance', 'titan'] },
    { id: 'dead-bug', name: 'Dead bug', muscleGroup: 'core', secondaryGroups: ['abdômen', 'quadril'], movementPattern: 'core', equipment: 'sem carga', level: 'recruta', characteristics: ['controle de tronco', 'coordenação'], possibilityOfSubstitution: 'prancha', tags: ['equilibrio', 'phoenix', 'performance'] },
    { id: 'kettlebell-swing', name: 'Swing de kettlebell', muscleGroup: 'glúteos', secondaryGroups: ['posteriores', 'core'], movementPattern: 'dominante de quadril', equipment: 'kettlebell', level: 'operador', characteristics: ['potência de quadril', 'coordenação'], possibilityOfSubstitution: 'hip thrust', tags: ['performance', 'phoenix', 'veterano'] },
    { id: 'burpee', name: 'Burpee', muscleGroup: 'core', secondaryGroups: ['ombros', 'quadríceps', 'glúteos'], movementPattern: 'core', equipment: 'sem carga', level: 'recruta', characteristics: ['cardio e força', 'resistência'], possibilityOfSubstitution: 'mountain climber', tags: ['phoenix', 'performance', 'equilibrio'] },
    { id: 'mountain-climber', name: 'Mountain climber', muscleGroup: 'core', secondaryGroups: ['ombros', 'quadríceps'], movementPattern: 'core', equipment: 'sem carga', level: 'recruta', characteristics: ['resistência e estabilização', 'mobilidade'], possibilityOfSubstitution: 'burpee', tags: ['phoenix', 'performance', 'equilibrio'] },
    { id: 'pull-up', name: 'Barra fixa', muscleGroup: 'costas', secondaryGroups: ['bíceps', 'ombros'], movementPattern: 'puxar vertical', equipment: 'barra', level: 'operador', characteristics: ['tráção bruto', 'força de suspensão'], possibilityOfSubstitution: 'puxada na barra', tags: ['titan', 'performance', 'veterano'] },
    { id: 'dip', name: 'Dips', muscleGroup: 'peito', secondaryGroups: ['tríceps', 'ombros'], movementPattern: 'empurrar vertical', equipment: 'barras paralelas', level: 'operador', characteristics: ['força de empurrar', 'tríceps e peito'], possibilityOfSubstitution: 'supino inclinado', tags: ['titan', 'performance', 'veterano'] }
  ];

  const focusLibrary = {
    phoenix: { priorities: ['cardio', 'mobilidade', 'core', 'lower-body'], movementBias: ['empurrar horizontal', 'agachar', 'core', 'puxar vertical'], muscles: ['peito', 'quadríceps', 'core', 'costas', 'panturrilhas'] },
    titan: { priorities: ['push', 'pull', 'lower-body'], movementBias: ['empurrar horizontal', 'puxar horizontal', 'agachar', 'dominante de quadril'], muscles: ['peito', 'costas', 'quadríceps', 'posteriores', 'glúteos'] },
    equilibrio: { priorities: ['balanced', 'stability', 'mobility'], movementBias: ['core', 'agachar', 'puxar vertical', 'empurrar horizontal'], muscles: ['core', 'quadríceps', 'costas', 'ombros', 'panturrilhas'] },
    performance: { priorities: ['power', 'speed', 'strength'], movementBias: ['empurrar vertical', 'puxar vertical', 'dominante de quadril', 'agachar'], muscles: ['ombros', 'costas', 'quadríceps', 'glúteos', 'core'] }
  };

  const levelRules = {
    recruta: { minComplexity: 0, setBias: 0, repBias: 0, repRange: [8, 12], rest: 75, exerciseCount: 4, extraFocus: ['base'] },
    operador: { minComplexity: 1, setBias: 1, repBias: 1, repRange: [6, 10], rest: 90, exerciseCount: 5, extraFocus: ['controle'] },
    veterano: { minComplexity: 2, setBias: 2, repBias: 2, repRange: [5, 8], rest: 105, exerciseCount: 6, extraFocus: ['densidade'] }
  };

  const frequencyOrder = {
    3: ['base', 'principal', 'fundamental'],
    4: ['base', 'principal', 'fundamental', 'recuperação'],
    5: ['base', 'principal', 'fundamental', 'secundário', 'recuperação'],
    6: ['base', 'principal', 'fundamental', 'secundário', 'resistencia', 'recuperação']
  };

  const storage = (() => {
    const store = new Map();
    const fallback = {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    };

    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return fallback;
  })();

  function normalizeProfile(profile) {
    if (!profile || typeof profile !== 'object') return null;
    const operation = Object.prototype.hasOwnProperty.call(focusLibrary, String(profile.operation || '')) ? String(profile.operation) : null;
    const agentLevel = Object.prototype.hasOwnProperty.call(levelRules, String(profile.agentLevel || '')) ? String(profile.agentLevel) : null;
    const trainingFrequency = [3, 4, 5, 6].includes(Number(profile.trainingFrequency ?? profile.trainingDays)) ? Number(profile.trainingFrequency ?? profile.trainingDays) : null;

    if (!operation || !agentLevel || !trainingFrequency) return null;

    return {
      name: String(profile.name || 'Agente'),
      operation,
      agentLevel,
      trainingFrequency,
      currentWeight: Number(profile.currentWeight ?? profile.goalWeight ?? 0),
      goalWeight: Number(profile.goalWeight ?? profile.targetWeight ?? profile.currentWeight ?? 0),
      startDate: String(profile.startDate || new Date().toISOString().slice(0, 10))
    };
  }

  const sessionCodeNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];

  function createSessionName(index) {
    const labels = ['Ficha A', 'Ficha B', 'Ficha C', 'Ficha D', 'Ficha E', 'Ficha F'];
    const shortName = labels[index] || `Ficha ${index + 1}`;
    const codename = sessionCodeNames[index] || null;
    return codename ? `${shortName} (${codename})` : shortName;
  }

  function getOperationFocus(operation) {
    return focusLibrary[operation] || focusLibrary.titan;
  }

  function createSessionConfig(profile, index, protocol) {
    const focusList = protocol?.structure?.distribution || [];
    const frequencyConfig = frequencyOrder[profile.trainingFrequency] || frequencyOrder[3];
    const focusKey = focusList[index]?.focus || frequencyConfig[index] || 'base';
    const focusLabel = focusKey === 'base' ? 'Base funcional' : focusKey === 'principal' ? 'Estímulo principal' : focusKey === 'fundamental' ? 'Fundamental' : focusKey === 'secundário' ? 'Estímulo secundário' : focusKey === 'resistencia' ? 'Resistência' : focusKey === 'recuperação' ? 'Recuperação' : focusKey === 'cardio' ? 'Cardio estratégico' : focusKey === 'mobilidade' ? 'Mobilidade e controle' : focusKey === 'core' ? 'Core e estabilização' : focusKey === 'lower-body' ? 'Inferior' : focusKey === 'push' ? 'Empurrar' : focusKey === 'pull' ? 'Puxar' : focusKey;

    return { id: `${profile.operation}-${profile.agentLevel}-${index + 1}`, name: createSessionName(index), focus: focusLabel, emphasis: focusKey, dayIndex: index + 1 };
  }

  function buildExerciseMetrics(operation, level, movementPattern) {
    const levelMeta = levelRules[level] || levelRules.recruta;
    const baseSets = 3 + levelMeta.setBias;
    const reps = Math.max(6, 12 - levelMeta.repBias);
    const rest = levelMeta.rest;
    const operationAdjustments = {
      phoenix: { sets: baseSets - 1, reps: reps + 2, rest: rest - 10 },
      titan: { sets: baseSets + 1, reps: reps, rest: rest + 15 },
      equilibrio: { sets: baseSets, reps: reps + 1, rest: rest },
      performance: { sets: baseSets, reps: reps - 1, rest: rest + 5 }
    };
    const config = operationAdjustments[operation] || operationAdjustments.titan;
    return { sets: Math.max(2, Math.min(6, config.sets)), reps: Math.max(6, Math.min(15, config.reps)), rest: Math.max(45, Math.min(120, config.rest)), movementPattern: movementPattern || 'agachar' };
  }

  function scoreExercise(exercise, operation, level, focus, usedIds) {
    const operationBias = getOperationFocus(operation);
    let score = 0;
    if (exercise.tags.includes(operation)) score += 5;
    if (exercise.tags.includes(level)) score += 2;
    if (exercise.movementPattern === focus || exercise.tags.includes(focus)) score += 3;
    if (operationBias.muscles.includes(exercise.muscleGroup)) score += 4;
    if (operationBias.movementBias.includes(exercise.movementPattern)) score += 2;
    if (exercise.secondaryGroups.includes(operationBias.muscles[0])) score += 1;
    if (usedIds && usedIds.has(exercise.id)) score -= 100;
    if (exercise.level === 'veterano' && level === 'recruta') score -= 5;
    if (exercise.level === 'recruta' && level === 'veterano') score += 1;
    return score;
  }

  function createSessionExercises(profile, sessionConfig) {
    const levelMeta = levelRules[profile.agentLevel] || levelRules.recruta;
    const targetCount = Math.max(3, levelMeta.exerciseCount - (profile.trainingFrequency <= 3 ? 1 : 0));
    const focusToken = sessionConfig.emphasis || 'base';
    const sessionUsed = new Set();

    const candidates = TRAINING_LIBRARY.filter((exercise) => {
      if (exercise.level === 'veterano' && profile.agentLevel === 'recruta') return false;
      if (exercise.level === 'operador' && profile.agentLevel === 'recruta') return false;
      if (focusToken === 'core' && !(exercise.muscleGroup === 'core' || exercise.secondaryGroups.includes('core'))) return false;
      return true;
    });

    const scored = candidates
      .map((exercise) => ({ exercise, score: scoreExercise(exercise, profile.operation, profile.agentLevel, focusToken, sessionUsed) }))
      .sort((left, right) => right.score - left.score)
      .map((item) => item.exercise);

    const selected = [];
    const patternTracker = new Map();

    for (const exercise of scored) {
      if (selected.length >= targetCount) break;
      if (sessionUsed.has(exercise.id)) continue;
      const patternKey = exercise.movementPattern;
      const currentPatternCount = patternTracker.get(patternKey) || 0;
      if (currentPatternCount >= 2) continue;

      const metrics = buildExerciseMetrics(profile.operation, profile.agentLevel, exercise.movementPattern);
      sessionUsed.add(exercise.id);
      patternTracker.set(patternKey, currentPatternCount + 1);
      selected.push({ id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, movementPattern: exercise.movementPattern, sets: metrics.sets, reps: metrics.reps, rest: metrics.rest, equipment: exercise.equipment, notes: exercise.characteristics[0] || 'estímulo base' });
    }

    if (selected.length < targetCount) {
      for (const exercise of TRAINING_LIBRARY) {
        if (selected.length >= targetCount) break;
        if (sessionUsed.has(exercise.id)) continue;
        if (exercise.level === 'veterano' && profile.agentLevel === 'recruta') continue;
        const metrics = buildExerciseMetrics(profile.operation, profile.agentLevel, exercise.movementPattern);
        sessionUsed.add(exercise.id);
        selected.push({ id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, movementPattern: exercise.movementPattern, sets: metrics.sets, reps: metrics.reps, rest: metrics.rest, equipment: exercise.equipment, notes: exercise.characteristics[0] || 'estímulo base' });
      }
    }

    return { selected, consumed: sessionUsed };
  }

  function createFallbackPlan(profile) {
    return {
      operation: profile?.operation || 'phoenix',
      level: profile?.agentLevel || 'recruta',
      frequency: profile?.trainingFrequency || 3,
      sessions: Array.from({ length: profile?.trainingFrequency || 3 }, (_, index) => ({ id: `fallback-${index + 1}`, name: createSessionName(index), focus: 'Base funcional', dayIndex: index + 1, exercises: [{ id: `fallback-${index + 1}-1`, name: 'Agachamento básico', muscleGroup: 'quadríceps', movementPattern: 'agachar', sets: 3, reps: 10, rest: 75, equipment: 'halter' }, { id: `fallback-${index + 1}-2`, name: 'Remada simples', muscleGroup: 'costas', movementPattern: 'puxar horizontal', sets: 3, reps: 10, rest: 75, equipment: 'cabo' }, { id: `fallback-${index + 1}-3`, name: 'Prancha', muscleGroup: 'core', movementPattern: 'core', sets: 3, reps: 30, rest: 45, equipment: 'sem carga' }] }))
    };
  }

  function readStoredPlan(profile) {
    const key = `operacao15.training-plan.v1:${profile?.operation || 'default'}:${profile?.agentLevel || 'default'}:${profile?.trainingFrequency || 3}`;
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function persistPlan(plan, profile) {
    const key = `operacao15.training-plan.v1:${profile?.operation || 'default'}:${profile?.agentLevel || 'default'}:${profile?.trainingFrequency || 3}`;
    try { storage.setItem(key, JSON.stringify(plan)); } catch { /* ignore */ }
    return plan;
  }

  function generateTrainingPlan(profile) {
    const normalized = normalizeProfile(profile);
    if (!normalized) return createFallbackPlan(profile || {});

    const saved = readStoredPlan(normalized);
    if (saved && Array.isArray(saved.sessions) && saved.sessions.length === normalized.trainingFrequency) return saved;

    const protocol = typeof ProtocolEngine !== 'undefined' && typeof ProtocolEngine.generateProtocol === 'function'
      ? ProtocolEngine.generateProtocol(normalized)
      : null;

    if (!protocol || protocol.status !== 'ready') return createFallbackPlan(normalized);

    const usedIds = new Set();
    const sessions = Array.from({ length: normalized.trainingFrequency }, (_, index) => {
      const sessionConfig = createSessionConfig(normalized, index, protocol);
      const { selected, consumed } = createSessionExercises(normalized, sessionConfig, usedIds);
      usedIds.clear();
      for (const value of consumed) usedIds.add(value);
      return { id: sessionConfig.id, name: sessionConfig.name, focus: sessionConfig.focus, dayIndex: sessionConfig.dayIndex, exercises: selected };
    });

    const result = { operation: normalized.operation, level: normalized.agentLevel, frequency: normalized.trainingFrequency, sessions };
    return persistPlan(result, normalized);
  }

  const api = { TRAINING_LIBRARY, focusLibrary, levelRules, frequencyOrder, generateTrainingPlan, createFallbackPlan, readStoredPlan, persistPlan };

  if (typeof window !== 'undefined') {
    window.TrainingGenerator = api;
    window.TrainingLibrary = TRAINING_LIBRARY;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.TrainingGenerator = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TRAINING_LIBRARY, TrainingGenerator: api };
  }

  return api;
})();

if (typeof window !== 'undefined') {
  window.TrainingGenerator = TrainingGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRAINING_LIBRARY: TrainingGenerator.TRAINING_LIBRARY, TrainingGenerator };
}
