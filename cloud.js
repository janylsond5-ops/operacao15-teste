// Login com Google e sincronização com o Firestore.
// O app funciona sem este módulo: se o Firebase não carregar, os dados ficam só no aparelho.
(() => {
  const SDK_BASE = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const DOC_IDS = {
    [Store.SYNC_KEYS.profile]: 'profile',
    [Store.SYNC_KEYS.training]: 'training',
    [Store.SYNC_KEYS.execution]: 'execution',
    [Store.SYNC_KEYS.missions]: 'missions'
  };
  const PUSH_DELAY_MS = 700;

  let state = { status: 'loading', email: null, lastSync: null, message: '' };
  let sdk = null;
  let auth = null;
  let db = null;
  let currentUid = null;
  let unsubscribers = [];
  const pushTimers = new Map();

  function setState(patch) {
    state = { ...state, ...patch };
    window.dispatchEvent(new CustomEvent('operacao15:cloud-state', { detail: state }));
  }

  function notifyDataChanged(keys) {
    window.dispatchEvent(new CustomEvent('operacao15:data-changed', { detail: { keys } }));
  }

  function friendlyError(error) {
    const code = error && error.code ? String(error.code) : '';
    const map = {
      'auth/popup-blocked': 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente de novo.',
      'auth/unauthorized-domain': 'Este endereço não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).',
      'auth/network-request-failed': 'Sem conexão. Tente novamente quando estiver online.',
      'auth/operation-not-allowed': 'O login com Google não está ativado no Firebase.',
      'auth/web-storage-unsupported': 'Este navegador bloqueia o armazenamento necessário para o login.',
      'permission-denied': 'Sem permissão no Firestore. Confira se as regras foram publicadas.',
      unavailable: 'Sem conexão com a nuvem no momento. As alterações ficam salvas e sobem quando a internet voltar.'
    };
    if (map[code]) return map[code];
    return `Falha na sincronização${code ? ` (${code})` : ''}.`;
  }

  function docRef(uid, key) {
    return sdk.firestore.doc(db, 'users', uid, 'data', DOC_IDS[key]);
  }

  // strict = true repassa o erro a quem chamou (usado na reconciliação ao entrar).
  async function pushNow(key, strict = false) {
    const uid = currentUid;
    if (!uid || !db) return;
    const raw = Store.getRaw(key);
    if (raw == null) return;
    const timestamp = Store.getUpdatedAt(key) || Date.now();
    try {
      const write = sdk.firestore.setDoc(docRef(uid, key), { json: raw, updatedAt: timestamp });
      // Sem internet, o Firestore guarda a escrita e só confirma quando voltar a conexão.
      // Ao entrar, não esperamos além de 8 s: a escrita continua na fila.
      if (strict) await Promise.race([write, new Promise((resolve) => setTimeout(resolve, 8000))]);
      else {
        await write;
        // Se o usuário saiu da conta enquanto o envio terminava, não mexe no estado.
        if (currentUid === uid) setState({ status: 'signed-in', lastSync: Date.now(), message: '' });
      }
    } catch (error) {
      if (strict) throw error;
      if (currentUid === uid) setState({ status: 'error', message: friendlyError(error) });
    }
  }

  function schedulePush(key) {
    clearTimeout(pushTimers.get(key));
    pushTimers.set(key, setTimeout(() => {
      pushTimers.delete(key);
      pushNow(key);
    }, PUSH_DELAY_MS));
  }

  function flushPushes() {
    [...pushTimers.keys()].forEach((key) => {
      clearTimeout(pushTimers.get(key));
      pushTimers.delete(key);
      pushNow(key);
    });
  }

  async function reconcile(uid, changed) {
    for (const key of Store.SYNC_KEY_LIST) {
      const snapshot = await sdk.firestore.getDoc(docRef(uid, key));
      const cloud = snapshot.exists() ? snapshot.data() : null;
      const action = Store.decideSync(key, cloud);
      if (action === 'pull') {
        if (Store.applyRemote(key, cloud.json, cloud.updatedAt)) changed.push(key);
      } else if (action === 'push') {
        const stamp = Store.getUpdatedAt(key) || Date.now();
        Store.markUploaded(key, stamp);
        await pushNow(key, true);
      }
    }
  }

  function attachListeners(uid) {
    detachListeners();
    Store.SYNC_KEY_LIST.forEach((key) => {
      const unsubscribe = sdk.firestore.onSnapshot(
        docRef(uid, key),
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites) return;
          if (!snapshot.metadata.fromCache && state.status === 'error' && state.email) setState({ status: 'signed-in', message: '' });
          if (!snapshot.exists()) return;
          const cloud = snapshot.data();
          if (Store.decideSync(key, cloud) !== 'pull') return;
          if (Store.applyRemote(key, cloud.json, cloud.updatedAt)) {
            setState({ lastSync: Date.now() });
            notifyDataChanged([key]);
          }
        },
        (error) => setState({ status: 'error', message: friendlyError(error) })
      );
      unsubscribers.push(unsubscribe);
    });
  }

  function detachListeners() {
    unsubscribers.forEach((unsubscribe) => { try { unsubscribe(); } catch { /* ignora */ } });
    unsubscribers = [];
  }

  async function onSignedIn(user) {
    setState({ status: 'syncing', email: user.email || user.displayName || 'conta Google', message: '' });
    const previousUid = Store.getSyncedUid();
    const accountChanged = Boolean(previousUid && previousUid !== user.uid);
    if (accountChanged) Store.clearSynced();
    Store.setSyncedUid(user.uid);
    currentUid = user.uid;
    const changed = [];
    try {
      await reconcile(user.uid, changed);
      setState({ status: 'signed-in', lastSync: Date.now(), message: '' });
    } catch (error) {
      setState({ status: 'error', message: friendlyError(error) });
    }
    // Os ouvintes entram mesmo se a primeira leitura falhar (por exemplo, sem internet):
    // quando a conexão volta, as alterações da nuvem chegam sozinhas.
    attachListeners(user.uid);
    if (accountChanged) notifyDataChanged(Store.SYNC_KEY_LIST);
    else if (changed.length) notifyDataChanged(changed);
  }

  function onSignedOut() {
    currentUid = null;
    detachListeners();
    setState({ status: 'signed-out', email: null, lastSync: null, message: '' });
  }

  async function signIn() {
    if (!sdk || !auth) return;
    const provider = new sdk.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await sdk.auth.signInWithPopup(auth, provider);
    } catch (error) {
      const code = error && error.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setState({ status: 'error', message: friendlyError(error) });
    }
  }

  async function signOut() {
    if (!sdk || !auth) return;
    flushPushes();
    try {
      await sdk.auth.signOut(auth);
    } catch (error) {
      setState({ status: 'error', message: friendlyError(error) });
    }
  }

  window.CloudSync = { getState: () => state, signIn, signOut };

  async function start() {
    const config = window.OPERACAO15_FIREBASE_CONFIG;
    if (!config || !config.apiKey) {
      setState({ status: 'disabled' });
      return;
    }
    try {
      const [appModule, authModule, firestoreModule] = await Promise.all([
        import(`${SDK_BASE}firebase-app.js`),
        import(`${SDK_BASE}firebase-auth.js`),
        import(`${SDK_BASE}firebase-firestore.js`)
      ]);
      sdk = { app: appModule, auth: authModule, firestore: firestoreModule };
      const app = sdk.app.initializeApp(config);
      auth = sdk.auth.getAuth(app);
      try {
        db = sdk.firestore.initializeFirestore(app, {
          localCache: sdk.firestore.persistentLocalCache({ tabManager: sdk.firestore.persistentMultipleTabManager() })
        });
      } catch {
        db = sdk.firestore.getFirestore(app);
      }
    } catch {
      setState({ status: 'unavailable' });
      return;
    }

    Store.onWrite((key) => {
      if (currentUid && DOC_IDS[key]) schedulePush(key);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushPushes();
    });
    window.addEventListener('pagehide', flushPushes);

    sdk.auth.onAuthStateChanged(auth, (user) => {
      if (user) onSignedIn(user);
      else onSignedOut();
    });
  }

  start();
})();
