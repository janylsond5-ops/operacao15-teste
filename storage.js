// Camada única de salvamento local. Todo dado do usuário passa por aqui.
// Os módulos de dados nunca falam direto com o localStorage; a nuvem (cloud.js) se
// conecta pelos ganchos onWrite / applyRemote.
const Store = (() => {
  const SYNC_KEYS = {
    profile: 'operacao15.profile.v1',
    training: 'operacao15.training.v1',
    execution: 'operacao15.training-execution.v1',
    missions: 'operacao15.daily-missions.v1'
  };
  const SYNC_KEY_LIST = Object.values(SYNC_KEYS);
  const META_KEY = 'operacao15.sync-meta.v1';
  const UID_KEY = 'operacao15.sync-uid.v1';
  const BACKUP_APP = 'operacao15';
  const BACKUP_VERSION = 1;
  const writeListeners = new Set();

  function emitError(detail) {
    try { window.dispatchEvent(new CustomEvent('operacao15:storage-error', { detail })); } catch { /* sem window (testes) */ }
  }

  function rawGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function rawSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      emitError({ key, message: String(error && error.message ? error.message : error) });
      return false;
    }
  }

  function rawRemove(key) {
    try { localStorage.removeItem(key); } catch { /* ignora */ }
  }

  function readMeta() {
    try {
      const meta = JSON.parse(rawGet(META_KEY));
      return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
    } catch {
      return {};
    }
  }

  function writeMeta(meta) {
    rawSet(META_KEY, JSON.stringify(meta));
  }

  function getUpdatedAt(key) {
    const value = Number(readMeta()[key]);
    return Number.isFinite(value) ? value : 0;
  }

  function nextTimestamp(key) {
    return Math.max(Date.now(), getUpdatedAt(key) + 1);
  }

  function getJSON(key) {
    try {
      const raw = rawGet(key);
      return raw == null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Grava uma alteração feita pelo usuário. Dados sincronizáveis recebem carimbo de hora
  // e avisam a nuvem. Retorna false se o navegador recusou a gravação.
  function setJSON(key, value) {
    const raw = JSON.stringify(value);
    if (!rawSet(key, raw)) return false;
    if (SYNC_KEY_LIST.includes(key)) {
      const timestamp = nextTimestamp(key);
      const meta = readMeta();
      meta[key] = timestamp;
      writeMeta(meta);
      writeListeners.forEach((listener) => {
        try { listener(key, raw, timestamp); } catch { /* um ouvinte com erro não pode impedir o salvamento */ }
      });
    }
    return true;
  }

  // Aplica um dado vindo da nuvem sem avisar a nuvem de volta.
  function applyRemote(key, raw, timestamp) {
    if (!SYNC_KEY_LIST.includes(key) || typeof raw !== 'string' || !Number.isFinite(timestamp)) return false;
    try { JSON.parse(raw); } catch { return false; }
    if (!rawSet(key, raw)) return false;
    const meta = readMeta();
    meta[key] = timestamp;
    writeMeta(meta);
    return true;
  }

  function markUploaded(key, timestamp) {
    const meta = readMeta();
    meta[key] = timestamp;
    writeMeta(meta);
  }

  function getRaw(key) {
    return rawGet(key);
  }

  function onWrite(listener) {
    writeListeners.add(listener);
    return () => writeListeners.delete(listener);
  }

  // Decide o que fazer com um dado ao entrar na conta: o mais recente vence.
  // Dado local antigo, sem carimbo, conta como mais velho que qualquer dado da nuvem.
  function decideSync(key, cloud) {
    const raw = rawGet(key);
    const localTimestamp = getUpdatedAt(key) || (raw != null ? 1 : 0);
    const valid = cloud && typeof cloud.json === 'string' && Number.isFinite(cloud.updatedAt);
    const cloudTimestamp = valid ? cloud.updatedAt : 0;
    if (cloudTimestamp > localTimestamp) return 'pull';
    if (raw != null && localTimestamp > cloudTimestamp) return 'push';
    return 'none';
  }

  function getSyncedUid() {
    return rawGet(UID_KEY);
  }

  function setSyncedUid(uid) {
    rawSet(UID_KEY, String(uid));
  }

  // Ao trocar de conta no mesmo aparelho, os dados da conta anterior não podem vazar.
  function clearSynced() {
    SYNC_KEY_LIST.forEach(rawRemove);
    rawRemove(META_KEY);
  }

  function exportBackup() {
    const data = {};
    Object.entries(SYNC_KEYS).forEach(([name, key]) => {
      const value = getJSON(key);
      if (value != null) data[name] = value;
    });
    return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
  }

  function validateBackup(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, error: 'Arquivo inválido.' };
    if (payload.app !== BACKUP_APP) return { ok: false, error: 'Este arquivo não é um backup da Operação 15.' };
    if (payload.version !== BACKUP_VERSION) return { ok: false, error: 'Versão de backup não suportada.' };
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) return { ok: false, error: 'O backup não contém dados.' };
    const names = Object.keys(payload.data);
    if (!names.length) return { ok: false, error: 'O backup está vazio.' };
    for (const name of names) {
      if (!Object.prototype.hasOwnProperty.call(SYNC_KEYS, name)) return { ok: false, error: `Dado desconhecido no backup: ${name}.` };
      const value = payload.data[name];
      if (value === null || typeof value !== 'object') return { ok: false, error: `Dado inválido no backup: ${name}.` };
    }
    return { ok: true, names };
  }

  function importBackup(payload) {
    const check = validateBackup(payload);
    if (!check.ok) return check;
    for (const name of check.names) {
      if (!setJSON(SYNC_KEYS[name], payload.data[name])) return { ok: false, error: 'Não foi possível gravar neste aparelho.' };
    }
    return { ok: true, names: check.names };
  }

  return {
    SYNC_KEYS, SYNC_KEY_LIST,
    getJSON, setJSON, getRaw, applyRemote, markUploaded, getUpdatedAt, onWrite,
    decideSync, getSyncedUid, setSyncedUid, clearSynced,
    exportBackup, validateBackup, importBackup
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Store;
