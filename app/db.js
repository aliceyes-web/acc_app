// IndexedDB 簡易封裝：所有資料只存在這台手機的瀏覽器中
const DB = (() => {
  const NAME = 'jizhang';
  const VERSION = 1;
  const STORES = {
    accounts: 'id',
    categories: 'id',
    txs: 'id',
    invoices: 'invNum',
    rules: 'id',
    meta: 'key',
  };
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        for (const [name, keyPath] of Object.entries(STORES)) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath });
        }
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const result = fn(t.objectStore(store));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const all = (store) => tx(store, 'readonly', (s) => s.getAll());
  const put = (store, obj) => tx(store, 'readwrite', (s) => { s.put(obj); });
  const putMany = (store, list) => tx(store, 'readwrite', (s) => { list.forEach((o) => s.put(o)); });
  const del = (store, key) => tx(store, 'readwrite', (s) => { s.delete(key); });
  const clear = (store) => tx(store, 'readwrite', (s) => { s.clear(); });

  async function replaceAll(data) {
    for (const name of Object.keys(STORES)) {
      await clear(name);
      if (Array.isArray(data[name]) && data[name].length) await putMany(name, data[name]);
    }
  }

  return { open, all, put, putMany, del, clear, replaceAll, STORES: Object.keys(STORES) };
})();
