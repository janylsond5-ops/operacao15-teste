// Testes em Node da camada de salvamento, dos dados, das missões e do backup.
// A nuvem (login e Firestore) só pode ser testada no navegador.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createEnv() {
  const data = new Map();
  const localStorage = {
    failWrites: false,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem(key, value) {
      if (this.failWrites) throw new Error('quota excedida');
      data.set(key, String(value));
    },
    removeItem: (key) => { data.delete(key); }
  };
  const events = [];
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }
  const window = { dispatchEvent: (event) => { events.push(event); return true; } };
  const context = vm.createContext({ localStorage, window, CustomEvent, console });
  ['storage.js', 'data.js', 'missions.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, { filename: file });
  });
  const get = (name) => vm.runInContext(name, context);
  return { data, localStorage, events, Store: get('Store'), OperationData: get('OperationData'), TrainingData: get('TrainingData'), MissionSystem: get('MissionSystem') };
}

let failures = 0;
let total = 0;
function test(name, fn) {
  total += 1;
  try {
    fn();
    console.log(`ok   - ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FALHA - ${name}\n       ${error.message}`);
  }
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function equal(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`);
}

const PROFILE = { name: 'Agente Teste', currentWeight: 80, goalWeight: 75, startDate: '2026-10-01', operation: 'phoenix', agentLevel: 'recruta', trainingFrequency: 3 };

test('Store: dado sincronizável recebe carimbo e avisa os ouvintes', () => {
  const { Store } = createEnv();
  const calls = [];
  Store.onWrite((key, raw, timestamp) => calls.push({ key, raw, timestamp }));
  assert(Store.setJSON(Store.SYNC_KEYS.profile, { a: 1 }), 'gravação deveria funcionar');
  equal(calls.length, 1, 'ouvintes chamados');
  assert(calls[0].timestamp > 0 && Store.getUpdatedAt(Store.SYNC_KEYS.profile) === calls[0].timestamp, 'carimbo deveria ser guardado');
  equal(Store.getJSON(Store.SYNC_KEYS.profile), { a: 1 }, 'leitura');
});

test('Store: chave fora da lista não gera carimbo nem aviso', () => {
  const { Store } = createEnv();
  let called = false;
  Store.onWrite(() => { called = true; });
  Store.setJSON('operacao15.protocol.v1', { x: 1 });
  assert(!called, 'não deveria avisar a nuvem');
  equal(Store.getUpdatedAt('operacao15.protocol.v1'), 0, 'carimbo');
});

test('Store: carimbos crescem mesmo com gravações no mesmo milissegundo', () => {
  const { Store } = createEnv();
  const key = Store.SYNC_KEYS.training;
  Store.setJSON(key, { n: 1 });
  const first = Store.getUpdatedAt(key);
  Store.setJSON(key, { n: 2 });
  assert(Store.getUpdatedAt(key) > first, 'segundo carimbo deveria ser maior');
});

test('Store: falha de gravação retorna false, emite erro e não avisa a nuvem', () => {
  const { Store, localStorage, events } = createEnv();
  let called = false;
  Store.onWrite(() => { called = true; });
  localStorage.failWrites = true;
  assert(Store.setJSON(Store.SYNC_KEYS.profile, { a: 1 }) === false, 'deveria retornar false');
  assert(!called, 'não deveria avisar a nuvem');
  assert(events.some((event) => event.type === 'operacao15:storage-error'), 'deveria emitir storage-error');
});

test('Store: applyRemote grava sem avisar a nuvem e rejeita dado inválido', () => {
  const { Store } = createEnv();
  let called = false;
  Store.onWrite(() => { called = true; });
  const key = Store.SYNC_KEYS.profile;
  assert(Store.applyRemote(key, '{"b":2}', 5000), 'deveria aplicar');
  assert(!called, 'não deveria ecoar para a nuvem');
  equal(Store.getUpdatedAt(key), 5000, 'carimbo remoto');
  assert(!Store.applyRemote(key, '{quebrado', 6000), 'JSON inválido deveria ser rejeitado');
  assert(!Store.applyRemote('outra.chave', '{}', 6000), 'chave desconhecida deveria ser rejeitada');
  equal(Store.getJSON(key), { b: 2 }, 'valor mantido');
});

test('Store: decideSync escolhe o dado mais recente', () => {
  const { Store } = createEnv();
  const key = Store.SYNC_KEYS.profile;
  equal(Store.decideSync(key, null), 'none', 'nada local e nada na nuvem');
  equal(Store.decideSync(key, { json: '{}', updatedAt: 10 }), 'pull', 'só na nuvem');
  Store.applyRemote(key, '{"v":1}', 100);
  equal(Store.decideSync(key, { json: '{}', updatedAt: 200 }), 'pull', 'nuvem mais nova');
  equal(Store.decideSync(key, { json: '{}', updatedAt: 100 }), 'none', 'iguais');
  equal(Store.decideSync(key, { json: '{}', updatedAt: 50 }), 'push', 'local mais novo');
  equal(Store.decideSync(key, null), 'push', 'só local');
  equal(Store.decideSync(key, { oops: true }), 'push', 'documento da nuvem inválido');
});

test('Store: dado local antigo, sem carimbo, perde para a nuvem e sobe se a nuvem estiver vazia', () => {
  const { Store, data } = createEnv();
  const key = Store.SYNC_KEYS.profile;
  data.set(key, '{"antigo":true}');
  equal(Store.decideSync(key, { json: '{}', updatedAt: 10 }), 'pull', 'nuvem vence dado sem carimbo');
  equal(Store.decideSync(key, null), 'push', 'sobe quando a nuvem está vazia');
});

test('Store: clearSynced remove só os dados de usuário e o carimbo', () => {
  const { Store } = createEnv();
  Store.SYNC_KEY_LIST.forEach((key) => Store.setJSON(key, { x: 1 }));
  Store.setJSON('operacao15.protocol.v1', { cache: true });
  Store.clearSynced();
  Store.SYNC_KEY_LIST.forEach((key) => { assert(Store.getJSON(key) === null, `${key} deveria ter sido removido`); equal(Store.getUpdatedAt(key), 0, 'carimbo'); });
  equal(Store.getJSON('operacao15.protocol.v1'), { cache: true }, 'cache local preservado');
});

test('Backup: exporta só o que existe e importa de volta', () => {
  const { Store, OperationData } = createEnv();
  OperationData.saveProfile(PROFILE);
  const backup = Store.exportBackup();
  equal(backup.app, 'operacao15', 'app');
  equal(Object.keys(backup.data), ['profile'], 'apenas o perfil existe');
  const other = createEnv();
  const result = other.Store.importBackup(JSON.parse(JSON.stringify(backup)));
  assert(result.ok, 'importação deveria funcionar');
  equal(other.OperationData.getProfile().name, 'Agente Teste', 'perfil importado');
});

test('Backup: importar dispara a sincronização dos dados importados', () => {
  const { Store } = createEnv();
  const keys = [];
  Store.onWrite((key) => keys.push(key));
  Store.importBackup({ app: 'operacao15', version: 1, data: { profile: { name: 'A' }, training: { schedule: [] } } });
  equal(keys.sort(), [Store.SYNC_KEYS.profile, Store.SYNC_KEYS.training].sort(), 'chaves enviadas à nuvem');
});

test('Backup: rejeita arquivos inválidos', () => {
  const { Store } = createEnv();
  const bad = [
    null, [], 'texto', {},
    { app: 'outro', version: 1, data: { profile: {} } },
    { app: 'operacao15', version: 2, data: { profile: {} } },
    { app: 'operacao15', version: 1, data: {} },
    { app: 'operacao15', version: 1, data: { desconhecido: {} } },
    { app: 'operacao15', version: 1, data: { profile: 'texto' } },
    { app: 'operacao15', version: 1, data: { profile: null } }
  ];
  bad.forEach((payload, index) => assert(Store.validateBackup(payload).ok === false, `caso ${index} deveria ser rejeitado`));
});

test('Perfil: salvar e ler passa pela camada de salvamento', () => {
  const { OperationData, Store } = createEnv();
  const keys = [];
  Store.onWrite((key) => keys.push(key));
  OperationData.saveProfile(PROFILE);
  equal(keys, [Store.SYNC_KEYS.profile], 'chave enviada à nuvem');
  equal(OperationData.getProfile().trainingFrequency, 3, 'frequência');
  let threw = false;
  try { OperationData.saveProfile({ name: '' }); } catch { threw = true; }
  assert(threw, 'perfil inválido deveria lançar erro');
});

test('Treino: agenda padrão não é gravada até o usuário salvar', () => {
  const { TrainingData, Store } = createEnv();
  const data = TrainingData.getTrainingData();
  assert(data.schedule.length > 0, 'deveria ter agenda padrão');
  assert(Store.getJSON(Store.SYNC_KEYS.training) === null, 'ler não deveria gravar');
  TrainingData.saveTrainingData(data);
  assert(Store.getJSON(Store.SYNC_KEYS.training) !== null, 'salvar deveria gravar');
});

test('Missões: ler o contexto não grava nada', () => {
  const { MissionSystem, Store } = createEnv();
  const context = MissionSystem.getContext('phoenix');
  equal(context.completedMissions, 0, 'nenhuma concluída');
  assert(Store.getJSON(Store.SYNC_KEYS.missions) === null, 'não deveria gravar ao ler');
});

test('Missões: concluir grava e hasActiveProtocol só vale com progresso', () => {
  const { MissionSystem, Store } = createEnv();
  assert(!MissionSystem.hasActiveProtocol('phoenix'), 'sem progresso não há protocolo ativo');
  const first = MissionSystem.getContext('phoenix').missions[0].id;
  MissionSystem.toggleMission('phoenix', first);
  assert(Store.getJSON(Store.SYNC_KEYS.missions) !== null, 'deveria gravar');
  assert(MissionSystem.hasActiveProtocol('phoenix'), 'com progresso há protocolo ativo');
  assert(!MissionSystem.hasActiveProtocol('titan'), 'outra operação não tem protocolo');
  MissionSystem.toggleMission('phoenix', first);
  assert(!MissionSystem.hasActiveProtocol('phoenix'), 'desmarcar tudo encerra o protocolo ativo');
});

test('Missões: concluir todas marca o protocolo do dia como concluído', () => {
  const { MissionSystem } = createEnv();
  const ids = MissionSystem.getContext('titan').missions.map((mission) => mission.id);
  let last;
  ids.forEach((id) => { last = MissionSystem.toggleMission('titan', id); });
  assert(last.isDailyMissionComplete && last.justCompleted, 'deveria concluir e avisar');
});

test('Missões: estado de outro dia é ignorado e trocar de operação reinicia', () => {
  const { MissionSystem, Store } = createEnv();
  Store.setJSON(Store.SYNC_KEYS.missions, { date: '2000-01-01', operation: 'phoenix', completedMissionIds: ['hydration'], completedAt: null });
  equal(MissionSystem.getContext('phoenix').completedMissions, 0, 'dia antigo não conta');
  const id = MissionSystem.getContext('phoenix').missions[0].id;
  MissionSystem.toggleMission('phoenix', id);
  MissionSystem.restartForOperation('titan');
  equal(MissionSystem.getContext('titan').completedMissions, 0, 'nova operação começa zerada');
  equal(Store.getJSON(Store.SYNC_KEYS.missions).operation, 'titan', 'estado gravado para a nova operação');
});

test('Missões: estado corrompido não quebra a leitura', () => {
  const { MissionSystem, data, Store } = createEnv();
  data.set(Store.SYNC_KEYS.missions, '{quebrado');
  equal(MissionSystem.getContext('phoenix').completedMissions, 0, 'leitura segura');
  data.set(Store.SYNC_KEYS.missions, '{"date":"x"}');
  equal(MissionSystem.getContext('phoenix').completedMissions, 0, 'estado sem lista também é ignorado');
});

console.log(`\n${total - failures} de ${total} testes passaram.`);
if (failures) process.exit(1);
