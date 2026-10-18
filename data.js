const OperationData = (() => {
  const STORAGE_KEY = Store.SYNC_KEYS.profile;
  const OPERATIONS = ['phoenix', 'titan', 'equilibrio', 'performance'];
  const AGENT_LEVELS = ['recruta', 'operador', 'veterano'];
  const TRAINING_FREQUENCIES = [3, 4, 5, 6];

  function normalize(profile) {
    if (!profile || typeof profile !== 'object') return null;
    const name = String(profile.name || '').trim();
    const currentWeight = Number(profile.currentWeight);
    const goalWeight = Number(profile.goalWeight);
    const startDate = String(profile.startDate || '');
    const startingWeight = Number(profile.startingWeight || currentWeight);
    const operation = OPERATIONS.includes(profile.operation) ? profile.operation : null;
    const agentLevel = AGENT_LEVELS.includes(profile.agentLevel) ? profile.agentLevel : null;
    const trainingFrequency = TRAINING_FREQUENCIES.includes(Number(profile.trainingFrequency)) ? Number(profile.trainingFrequency) : null;

    if (!name || !Number.isFinite(currentWeight) || !Number.isFinite(goalWeight) || !Number.isFinite(startingWeight) || !startDate) return null;
    return { name, currentWeight, goalWeight, startingWeight, startDate, operation, agentLevel, trainingFrequency };
  }

  function getProfile() {
    return normalize(Store.getJSON(STORAGE_KEY));
  }

  function saveProfile(profile) {
    const normalized = normalize(profile);
    if (!normalized) throw new Error('Dados de perfil inválidos.');
    Store.setJSON(STORAGE_KEY, normalized);
    return normalized;
  }

  return { getProfile, saveProfile, AGENT_LEVELS, TRAINING_FREQUENCIES };
})();

const TrainingData = (() => {
  const STORAGE_KEY = Store.SYNC_KEYS.training;
  const DAY_OPTIONS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const PROTOCOL_OPTIONS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

  function uid(prefix) {
    const random = Math.random().toString(16).slice(2, 10);
    return `${prefix}-${Date.now()}-${random}`;
  }

  function normalizeExercise(exercise, fallbackId) {
    if (!exercise || typeof exercise !== 'object') return null;
    const name = String(exercise.name || '').trim();
    const sets = Number(exercise.sets);
    const reps = Number(exercise.reps);
    const rest = Number(exercise.rest);
    const weight = String(exercise.weight || '').trim();
    const notes = String(exercise.notes || '').trim();
    const id = String(exercise.id || fallbackId || uid('ex'));

    if (!name || !Number.isFinite(sets) || !Number.isFinite(reps) || !Number.isFinite(rest)) return null;
    return {
      id,
      name,
      sets: Math.max(1, Math.round(sets)),
      reps: Math.max(1, Math.round(reps)),
      weight,
      rest: Math.min(120, Math.max(30, Math.round(rest))),
      notes
    };
  }

  function normalizeProtocol(name, exercises) {
    const protocolName = PROTOCOL_OPTIONS.includes(name) ? name : 'Bravo';
    const list = Array.isArray(exercises) ? exercises : [];
    const normalized = list
      .map((exercise, index) => normalizeExercise(exercise, `${protocolName}-${index + 1}`))
      .filter(Boolean);
    return { name: protocolName, exercises: normalized };
  }

  function buildDefaultProtocols() {
    return {
      Alpha: [
        { id: 'alpha-1', name: 'Aquecimento funcional', sets: 2, reps: 12, weight: 'Sem carga', rest: 45, notes: 'Movimento controlado.' },
        { id: 'alpha-2', name: 'Agachamento goblet', sets: 4, reps: 10, weight: '16 kg', rest: 75, notes: 'Manteve postura neutra.' }
      ],
      Bravo: [
        { id: 'bravo-1', name: 'Supino reto', sets: 4, reps: 10, weight: '20 kg', rest: 90, notes: 'Controle de descida.' },
        { id: 'bravo-2', name: 'Remada baixa', sets: 4, reps: 10, weight: '18 kg', rest: 90, notes: 'Elasrom pela escápula.' }
      ],
      Charlie: [
        { id: 'charlie-1', name: 'Leg press', sets: 4, reps: 12, weight: '60 kg', rest: 90, notes: 'Pé firme.' },
        { id: 'charlie-2', name: 'Desenvolvimento', sets: 3, reps: 8, weight: '15 kg', rest: 90, notes: 'Sem perda de postura.' }
      ],
      Delta: [
        { id: 'delta-1', name: 'Puxada alta', sets: 4, reps: 8, weight: '25 kg', rest: 75, notes: 'Cotovelo alinhado.' },
        { id: 'delta-2', name: 'Mesa flexora', sets: 3, reps: 12, weight: '35 kg', rest: 60, notes: 'Contração lenta.' }
      ],
      Echo: [
        { id: 'echo-1', name: 'Burpee', sets: 4, reps: 8, weight: 'Sem carga', rest: 60, notes: 'Execução em tempo.' },
        { id: 'echo-2', name: 'Corrida em marcha', sets: 1, reps: 1, weight: 'Sem carga', rest: 30, notes: 'Aquecimento final.' }
      ]
    };
  }

  function buildDefaultSchedule() {
    return [
      { id: uid('day'), day: 'Segunda-feira', time: '13:30', protocol: 'Bravo' },
      { id: uid('day'), day: 'Terça-feira', time: '13:30', protocol: 'Charlie' }
    ];
  }

  function normalizeScheduleItem(item, index) {
    if (!item || typeof item !== 'object') return null;
    const day = DAY_OPTIONS.includes(item.day) ? item.day : DAY_OPTIONS[index % DAY_OPTIONS.length];
    const time = String(item.time || '13:30');
    const protocol = PROTOCOL_OPTIONS.includes(item.protocol) ? item.protocol : 'Bravo';
    return { id: String(item.id || uid('day')), day, time, protocol };
  }

  function normalize(data) {
    const defaultProtocols = buildDefaultProtocols();
    const defaultSchedule = buildDefaultSchedule();
    const source = data && typeof data === 'object' ? data : {};
    const protocolsSource = source.protocols && typeof source.protocols === 'object' ? source.protocols : defaultProtocols;
    const scheduleSource = Array.isArray(source.schedule) ? source.schedule : defaultSchedule;

    const protocols = {};
    PROTOCOL_OPTIONS.forEach((protocolName) => {
      const sourceExercises = Array.isArray(protocolsSource[protocolName]) ? protocolsSource[protocolName] : defaultProtocols[protocolName];
      const normalizedProtocol = normalizeProtocol(protocolName, sourceExercises);
      protocols[protocolName] = normalizedProtocol.exercises;
    });

    const schedule = scheduleSource
      .map((item, index) => normalizeScheduleItem(item, index))
      .filter(Boolean);

    return {
      schedule: schedule.length ? schedule : defaultSchedule,
      protocols
    };
  }

  function getTrainingData() {
    return normalize(Store.getJSON(STORAGE_KEY));
  }

  function saveTrainingData(data) {
    const normalized = normalize(data);
    Store.setJSON(STORAGE_KEY, normalized);
    return normalized;
  }

  return {
    DAY_OPTIONS,
    PROTOCOL_OPTIONS,
    buildDefaultProtocols,
    buildDefaultSchedule,
    getTrainingData,
    saveTrainingData,
    uid
  };
})();
