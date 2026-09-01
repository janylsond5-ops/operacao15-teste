const ProtocolEngine = typeof require === 'function'
  ? require('./protocol-engine.js')
  : window.ProtocolEngine;

const TrainingGenerator = typeof require === 'function'
  ? require('./training-library.js').TrainingGenerator
  : window.TrainingGenerator;

const testCases = [
  { name: 'FÊNIX + RECRUTA + 3 dias', profile: { name: 'Agente A', currentWeight: 85, targetWeight: 70, operation: 'phoenix', agentLevel: 'recruta', trainingDays: 3 } },
  { name: 'FÊNIX + VETERANO + 6 dias', profile: { name: 'Agente B', currentWeight: 82, targetWeight: 68, operation: 'phoenix', agentLevel: 'veterano', trainingDays: 6 } },
  { name: 'TITÃ + RECRUTA + 3 dias', profile: { name: 'Agente C', currentWeight: 78, targetWeight: 85, operation: 'titan', agentLevel: 'recruta', trainingDays: 3 } },
  { name: 'TITÃ + OPERADOR + 5 dias', profile: { name: 'Agente D', currentWeight: 80, targetWeight: 88, operation: 'titan', agentLevel: 'operador', trainingDays: 5 } },
  { name: 'EQUILÍBRIO + OPERADOR + 4 dias', profile: { name: 'Agente E', currentWeight: 76, targetWeight: 72, operation: 'equilibrio', agentLevel: 'operador', trainingDays: 4 } },
  { name: 'PERFORMANCE + VETERANO + 6 dias', profile: { name: 'Agente F', currentWeight: 74, targetWeight: 70, operation: 'performance', agentLevel: 'veterano', trainingDays: 6 } },
  { name: 'perfil sem nível', profile: { name: 'Agente G', currentWeight: 80, targetWeight: 75, operation: 'phoenix', trainingDays: 5 } },
  { name: 'perfil sem frequência', profile: { name: 'Agente H', currentWeight: 80, targetWeight: 75, operation: 'phoenix', agentLevel: 'operador' } },
  { name: 'operação inválida', profile: { name: 'Agente I', currentWeight: 80, targetWeight: 75, operation: 'invalida', agentLevel: 'operador', trainingDays: 5 } },
  { name: 'frequência inválida', profile: { name: 'Agente J', currentWeight: 80, targetWeight: 75, operation: 'titan', agentLevel: 'operador', trainingDays: 8 } },
  { name: 'perfil antigo', profile: { name: 'Agente K', currentWeight: 80, targetWeight: 75 } }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const results = testCases.map(({ name, profile }) => {
    const result = ProtocolEngine.generateProtocol(profile);
    assert(result && typeof result === 'object', `${name}: resultado ausente`);
    assert(typeof result.status === 'string', `${name}: status ausente`);
    assert(['ready', 'incomplete'].includes(result.status), `${name}: status inválido`);
    assert(result.structure && typeof result.structure === 'object', `${name}: estrutura ausente`);
    return { name, status: result.status, operation: result.operation || 'fallback', level: result.level || 'fallback', trainingDays: result.trainingDays || 0 };
  });

  assert(results[0].status === 'ready', 'FÊNIX + RECRUTA + 3 dias não gerou estrutura pronta');
  assert(results[1].status === 'ready', 'FÊNIX + VETERANO + 6 dias não gerou estrutura pronta');
  assert(results[2].status === 'ready', 'TITÃ + RECRUTA + 3 dias não gerou estrutura pronta');
  assert(results[3].status === 'ready', 'TITÃ + OPERADOR + 5 dias não gerou estrutura pronta');
  assert(results[4].status === 'ready', 'EQUILÍBRIO + OPERADOR + 4 dias não gerou estrutura pronta');
  assert(results[5].status === 'ready', 'PERFORMANCE + VETERANO + 6 dias não gerou estrutura pronta');
  assert(results[6].status === 'incomplete', 'Perfil sem nível deve cair em fallback seguro');
  assert(results[7].status === 'incomplete', 'Perfil sem frequência deve cair em fallback seguro');
  assert(results[8].status === 'incomplete', 'Operação inválida deve cair em fallback seguro');
  assert(results[9].status === 'incomplete', 'Frequência inválida deve cair em fallback seguro');
  assert(results[10].status === 'incomplete', 'Perfil antigo deve cair em fallback seguro');

  const generatorCases = [
    { name: 'FÊNIX + RECRUTA + 3 dias', profile: { name: 'Agente A', currentWeight: 85, goalWeight: 70, targetWeight: 70, operation: 'phoenix', agentLevel: 'recruta', trainingFrequency: 3, trainingDays: 3, startDate: '2026-08-01' } },
    { name: 'FÊNIX + VETERANO + 6 dias', profile: { name: 'Agente B', currentWeight: 82, goalWeight: 68, targetWeight: 68, operation: 'phoenix', agentLevel: 'veterano', trainingFrequency: 6, trainingDays: 6, startDate: '2026-08-01' } },
    { name: 'TITÃ + RECRUTA + 3 dias', profile: { name: 'Agente C', currentWeight: 78, goalWeight: 85, targetWeight: 85, operation: 'titan', agentLevel: 'recruta', trainingFrequency: 3, trainingDays: 3, startDate: '2026-08-01' } },
    { name: 'TITÃ + OPERADOR + 5 dias', profile: { name: 'Agente D', currentWeight: 80, goalWeight: 88, targetWeight: 88, operation: 'titan', agentLevel: 'operador', trainingFrequency: 5, trainingDays: 5, startDate: '2026-08-01' } },
    { name: 'EQUILÍBRIO + OPERADOR + 4 dias', profile: { name: 'Agente E', currentWeight: 76, goalWeight: 72, targetWeight: 72, operation: 'equilibrio', agentLevel: 'operador', trainingFrequency: 4, trainingDays: 4, startDate: '2026-08-01' } },
    { name: 'PERFORMANCE + VETERANO + 6 dias', profile: { name: 'Agente F', currentWeight: 74, goalWeight: 70, targetWeight: 70, operation: 'performance', agentLevel: 'veterano', trainingFrequency: 6, trainingDays: 6, startDate: '2026-08-01' } }
  ];

  generatorCases.forEach(({ name, profile }) => {
    const plan = TrainingGenerator.generateTrainingPlan(profile);
    assert(plan && typeof plan === 'object', `${name}: plano ausente`);
    assert(Array.isArray(plan.sessions), `${name}: sessões ausentes`);
    assert(plan.sessions.length === (profile.trainingDays || profile.trainingFrequency), `${name}: quantidade de sessões inválida`);
    assert(plan.sessions.every((session) => Array.isArray(session.exercises) && session.exercises.length >= 3), `${name}: sessão sem exercícios suficientes`);
    assert(plan.sessions.every((session) => session.exercises.every((exercise) => exercise && exercise.name && exercise.muscleGroup)), `${name}: exercício inválido`);
    assert(plan.sessions.every((session) => new Set(session.exercises.map((exercise) => exercise.id)).size === session.exercises.length), `${name}: exercícios duplicados`);
  });

  return { ok: true, results };
}

if (typeof window !== 'undefined') {
  window.ProtocolEngineTests = { run };
} else {
  console.log(run());
}
