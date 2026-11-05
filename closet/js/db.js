/* IndexedDB (옷 + 사진 + 코디) 와 localStorage 거울 */
(function (root) {
  const DB_NAME = "sangwoo-closet";
  const DB_VER = 1;
  const MIRROR_KEY = "closet.v1";

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!root.indexedDB) {
        reject(new Error("no idb"));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("items")) db.createObjectStore("items", { keyPath: "id" });
        if (!db.objectStoreNames.contains("outfits")) db.createObjectStore("outfits", { keyPath: "id" });
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("abort"));
    });
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const api = {
    db: null,
    ok: false,

    async init() {
      try {
        this.db = await openDB();
        this.ok = true;
      } catch (err) {
        this.ok = false;
        console.warn("IndexedDB를 못 열어서 이 브라우저 저장소만 씁니다.", err);
      }
    },

    async all(store) {
      if (!this.ok) return [];
      const tx = this.db.transaction(store, "readonly");
      const rows = await reqToPromise(tx.objectStore(store).getAll());
      return rows || [];
    },

    async put(store, value, key) {
      if (!this.ok) return;
      const tx = this.db.transaction(store, "readwrite");
      if (key === undefined) tx.objectStore(store).put(value);
      else tx.objectStore(store).put(value, key);
      await txDone(tx);
    },

    async del(store, key) {
      if (!this.ok) return;
      const tx = this.db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      await txDone(tx);
    },

    async get(store, key) {
      if (!this.ok) return undefined;
      const tx = this.db.transaction(store, "readonly");
      return reqToPromise(tx.objectStore(store).get(key));
    },

    readMirror() {
      try {
        const raw = localStorage.getItem(MIRROR_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },

    writeMirror(data) {
      try {
        const slim = {
          version: 1,
          items: (data.items || []).map((it) => {
            const copy = Object.assign({}, it);
            delete copy.photoData;
            return copy;
          }),
          outfits: data.outfits || [],
          look: data.look || null
        };
        localStorage.setItem(MIRROR_KEY, JSON.stringify(slim));
      } catch (err) {
        console.warn("localStorage 거울 저장 실패", err);
      }
    },

    async getPhoto(id) {
      if (!id || !this.ok) return null;
      const blob = await this.get("photos", id);
      return blob || null;
    },

    async savePhoto(id, blob) {
      if (!this.ok) return false;
      await this.put("photos", blob, id);
      return true;
    },

    async deletePhoto(id) {
      if (!id || !this.ok) return;
      await this.del("photos", id);
    }
  };

  root.ClosetDB = api;
})(typeof window !== "undefined" ? window : globalThis);
