// Testa cloud.js contra um Firebase simulado (sem rede). Cobre a lógica de login,
// reconciliação, envio com atraso, alterações remotas, troca de conta e erros.
// O Firebase de verdade só pode ser testado no navegador.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(condition, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (condition()) return true;
    await sleep(10);
  }
  return false;
}

function createFakeFirebase() {
  const cloud = new Map(); // caminho -> documento
  const listeners = new Map(); // caminho -> Set de callbacks
  const calls = { setDoc: 0, getDoc: 0 };
  const fb = { cloud, calls, authCallback: null, user: null, failGetDoc: null, failSetDoc: null };
  const snapshotFor = (docPath, options = {}) => ({
    metadata: { hasPendingWrites: Boolean(options.pending), fromCache: Boolean(options.fromCache) },
    exists: () => cloud.has(docPath),
    data: () => cloud.get(docPath)
  });
  fb.remoteWrite = (docPath, value) => { // outro aparelho gravando
    cloud.set(docPath, value);
    (listeners.get(docPath) || new Set()).forEach((callback) => callback.next(snapshotFor(docPath)));
  };
  fb.modules = {
    'firebase-app.js': { initializeApp: () => ({}) },
    'firebase-auth.js': {
      getAuth: () => ({}),
      GoogleAuthProvider: class { setCustomParameters() {} },
      signInWithPopup: async () => { fb.authCallback && fb.authCallback(fb.user); },
      signOut: async () => { fb.authCallback && fb.authCallback(null); },
      onAuthStateChanged: (auth, callback) => { fb.authCallback = callback; }
    },
    'firebase-firestore.js': {
      initializeFirestore: () => ({}),
      getFirestore: () => ({}),
      persistentLocalCache: () => ({}),
      persistentMultipleTabManager: () => ({}),
      doc: (db, ...segments) => ({ path: segments.join('/') }),
      getDoc: async (ref) => {
        calls.getDoc += 1;
        if (fb.failGetDoc) throw Object.assign(new Error('x'), { code: fb.failGetDoc });
        return snapshotFor(ref.path);
      },
      setDoc: async (ref, value) => {
        calls.setDoc += 1;
        if (fb.failSetDoc) throw Object.assign(new Error('x'), { code: fb.failSetDoc });
        cloud.set(ref.path, value);
      },
      onSnapshot: (ref, next, error) => {
        if (!listeners.has(ref.path)) listeners.set(ref.path, new Set());
        const entry = { next, error };
        listeners.get(ref.path).add(entry);
        // Como o Firestore de verdade: permissão negada chega pelo callback de erro;
        // sem internet entrega o que há em cache.
        if (fb.failGetDoc === 'permission-denied') Promise.resolve().then(() => error && error(Object.assign(new Error('x'), { code: 'permission-denied' })));
        else next(snapshotFor(ref.path, { fromCache: fb.failGetDoc === 'unavailable' }));
        return () => listeners.get(ref.path).delete(entry);
      }
    }
  };
  fb.listenerCount = () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
  return fb;
}

async function createEnv({ config = { apiKey: 'x' }, failImport = false } = {}) {
  const data = new Map();
  const localStorage = {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); }
  };
  const handlers = new Map();
  const events = [];
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }
  const window = {
    OPERACAO15_FIREBASE_CONFIG: config,
    addEventListener: (type, handler) => { handlers.set(type, [...(handlers.get(type) || []), handler]); },
    dispatchEvent: (event) => { events.push(event); (handlers.get(event.type) || []).forEach((handler) => handler(event)); return true; }
  };
  const document = { visibilityState: 'visible', addEventListener() {} };
  const fb = createFakeFirebase();
  const context = vm.createContext({
    localStorage, window, document, CustomEvent, console, setTimeout, clearTimeout,
    __imp: async (url) => {
      if (failImport) throw new Error('sem rede');
      const name = url.split('/').pop();
      return fb.modules[name];
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'storage.js'), 'utf8'), context, { filename: 'storage.js' });
  const source = fs.readFileSync(path.join(__dirname, 'cloud.js'), 'utf8').replace(/\bimport\(/g, '__imp(');
  vm.runInContext(source, context, { filename: 'cloud.js' });
  const Store = vm.runInContext('Store', context);
  await sleep(20);
  return { data, events, window, fb, Store, CloudSync: window.CloudSync, state: () => window.CloudSync.getState(), eventsOf: (type) => events.filter((event) => event.type === type) };
}

const USER = { uid: 'u1', email: 'eu@example.com' };
const DOC = (uid, name) => `users/${uid}/data/${name}`;
let failures = 0;
let total = 0;
async function test(name, fn) {
  total += 1;
  try {
    await fn();
    console.log(`ok   - ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FALHA - ${name}\n       ${error.message}`);
  }
}
function assert(condition, message) { if (!condition) throw new Error(message); }

(async () => {
  await test('sem configuração do Firebase: sincronização desativada', async () => {
    const env = await createEnv({ config: null });
    assert(env.state().status === 'disabled', `status ${env.state().status}`);
  });

  await test('SDK não carrega: sincronização indisponível, app segue local', async () => {
    const env = await createEnv({ failImport: true });
    assert(env.state().status === 'unavailable', `status ${env.state().status}`);
  });

  await test('antes do login o estado é "signed-out"', async () => {
    const env = await createEnv();
    env.fb.authCallback(null);
    assert(env.state().status === 'signed-out', `status ${env.state().status}`);
  });

  await test('login com dados locais e nuvem vazia: sobem para a nuvem', async () => {
    const env = await createEnv();
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Local' });
    env.fb.user = USER;
    await env.CloudSync.signIn();
    assert(await waitFor(() => env.state().status === 'signed-in'), `status ${env.state().status}`);
    const doc = env.fb.cloud.get(DOC('u1', 'profile'));
    assert(doc && JSON.parse(doc.json).name === 'Local', 'perfil local deveria estar na nuvem');
    assert(!env.fb.cloud.has(DOC('u1', 'training')), 'dado inexistente não deveria subir');
    assert(env.state().email === 'eu@example.com', 'e-mail no estado');
  });

  await test('login com nuvem mais nova: dado da nuvem substitui o local e a tela é avisada', async () => {
    const env = await createEnv();
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Antigo' });
    env.fb.cloud.set(DOC('u1', 'profile'), { json: '{"name":"Da nuvem"}', updatedAt: Date.now() + 100000 });
    env.fb.user = USER;
    await env.CloudSync.signIn();
    assert(await waitFor(() => env.state().status === 'signed-in'), 'deveria conectar');
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile).name === 'Da nuvem', 'deveria aplicar o dado da nuvem');
    const changed = env.eventsOf('operacao15:data-changed');
    assert(changed.length === 1 && changed[0].detail.keys.includes(env.Store.SYNC_KEYS.profile), 'deveria avisar a interface');
    assert(env.fb.calls.setDoc === 0, 'não deveria enviar nada');
  });

  await test('alteração local depois do login chega à nuvem (agrupada, com atraso)', async () => {
    const env = await createEnv();
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    for (let i = 1; i <= 5; i += 1) env.Store.setJSON(env.Store.SYNC_KEYS.execution, { passo: i });
    assert(env.fb.calls.setDoc === 0, 'ainda não deveria ter enviado (atraso)');
    assert(await waitFor(() => env.fb.cloud.has(DOC('u1', 'execution')), 3000), 'deveria enviar');
    assert(JSON.parse(env.fb.cloud.get(DOC('u1', 'execution')).json).passo === 5, 'deveria enviar o último valor');
    assert(env.fb.calls.setDoc === 1, `5 alterações deveriam virar 1 envio, mas foram ${env.fb.calls.setDoc}`);
  });

  await test('alteração vinda de outro aparelho atualiza o local sem eco para a nuvem', async () => {
    const env = await createEnv();
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    const before = env.fb.calls.setDoc;
    env.fb.remoteWrite(DOC('u1', 'missions'), { json: '{"date":"2026-10-18","operation":"titan","completedMissionIds":["hydration"],"completedAt":null}', updatedAt: Date.now() + 5000 });
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.missions).operation === 'titan', 'deveria aplicar a mudança remota');
    assert(env.eventsOf('operacao15:data-changed').some((event) => event.detail.keys.includes(env.Store.SYNC_KEYS.missions)), 'deveria avisar a interface');
    await sleep(900);
    assert(env.fb.calls.setDoc === before, 'não deveria reenviar o que veio da nuvem');
  });

  await test('mudança remota mais antiga que a local é ignorada', async () => {
    const env = await createEnv();
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Novo' });
    env.fb.remoteWrite(DOC('u1', 'profile'), { json: '{"name":"Velho"}', updatedAt: 1 });
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile).name === 'Novo', 'dado local mais novo deveria prevalecer');
  });

  await test('trocar de conta no aparelho apaga os dados da conta anterior', async () => {
    const env = await createEnv();
    env.Store.setSyncedUid('conta-antiga');
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Da outra conta' });
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile) === null, 'dados da conta anterior não podem vazar');
    assert(!env.fb.cloud.has(DOC('u1', 'profile')), 'nada da conta anterior pode subir');
    assert(env.eventsOf('operacao15:data-changed').some((event) => event.detail.keys.length === env.Store.SYNC_KEY_LIST.length), 'tela deveria ser atualizada');
  });

  await test('mesma conta de antes: dados locais são mantidos', async () => {
    const env = await createEnv();
    env.Store.setSyncedUid('u1');
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Meu' });
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile).name === 'Meu', 'deveria manter');
  });

  await test('sem permissão no Firestore: erro claro e ouvintes continuam ativos', async () => {
    const env = await createEnv();
    env.fb.failGetDoc = 'permission-denied';
    env.fb.user = USER;
    await env.CloudSync.signIn();
    assert(await waitFor(() => env.state().status === 'error'), `status ${env.state().status}`);
    assert(/regras/i.test(env.state().message), `mensagem: ${env.state().message}`);
    assert(env.fb.listenerCount() === env.Store.SYNC_KEY_LIST.length, 'ouvintes deveriam estar ativos');
  });

  await test('erro ao enviar altera o estado e mostra a mensagem', async () => {
    const env = await createEnv();
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    env.fb.failSetDoc = 'permission-denied';
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'X' });
    assert(await waitFor(() => env.state().status === 'error'), 'deveria entrar em erro');
  });

  await test('voltar a receber dados da nuvem limpa o estado de erro', async () => {
    const env = await createEnv();
    env.fb.failGetDoc = 'unavailable';
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'error');
    env.fb.failGetDoc = null;
    env.fb.remoteWrite(DOC('u1', 'profile'), { json: '{"name":"Voltou"}', updatedAt: Date.now() + 1000 });
    assert(env.state().status === 'signed-in', `status ${env.state().status}`);
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile).name === 'Voltou', 'deveria aplicar o dado');
  });

  await test('sair da conta: dados ficam no aparelho e novas alterações não sobem', async () => {
    const env = await createEnv();
    env.fb.user = USER;
    await env.CloudSync.signIn();
    await waitFor(() => env.state().status === 'signed-in');
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Antes de sair' });
    await env.CloudSync.signOut();
    assert(env.state().status === 'signed-out' && env.state().email === null, 'deveria sair');
    assert(env.fb.listenerCount() === 0, 'ouvintes deveriam ser removidos');
    const sent = env.fb.calls.setDoc;
    env.Store.setJSON(env.Store.SYNC_KEYS.profile, { name: 'Depois de sair' });
    await sleep(900);
    assert(env.fb.calls.setDoc === sent, 'não deveria enviar depois de sair');
    assert(env.Store.getJSON(env.Store.SYNC_KEYS.profile).name === 'Depois de sair', 'dado local mantido');
  });

  console.log(`\n${total - failures} de ${total} testes passaram.`);
  process.exit(failures ? 1 : 0);
})();
