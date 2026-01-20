/**
 * GenroStorage - Local/Session storage wrapper
 *
 * Namespace: genro.storage
 *
 * Metodi estratti da genro.js:
 * - setInStorage (linee 1915-1924)
 * - getFromStorage (linee 1925-1942)
 */

export class GenroStorage {
    constructor(genro) {
        this.genro = genro;
    }

    /**
     * Costruisce chiave con namespace
     * @private
     */
    _namespaceKey(key, nameSpace) {
        if (!nameSpace) return key;

        // Legacy: sessionNameSpaceKey logic
        // Usa page path come namespace di default
        const ns = nameSpace === true
            ? this.genro?.pageHash || 'default'
            : nameSpace;

        return `${ns}:${key}`;
    }

    /**
     * Serializza valore con tipo (compatibile con legacy asTypedTxt)
     * @private
     */
    _serialize(value) {
        if (value === null || value === undefined) {
            return null;
        }

        // Per compatibilità con legacy, usiamo JSON
        // Il vecchio asTypedTxt aveva format speciali per date, etc.
        // Per ora semplifichiamo
        if (value instanceof Date) {
            return JSON.stringify({ _type: 'date', _value: value.toISOString() });
        }

        return JSON.stringify(value);
    }

    /**
     * Deserializza valore (compatibile con legacy convertFromText)
     * @private
     */
    _deserialize(text) {
        if (text === null || text === undefined) {
            return null;
        }

        try {
            const parsed = JSON.parse(text);

            // Gestisce tipi speciali
            if (parsed && parsed._type === 'date') {
                return new Date(parsed._value);
            }

            return parsed;
        } catch (e) {
            // Fallback: ritorna come stringa
            return text;
        }
    }

    /**
     * Ottiene storage per tipo
     * @private
     */
    _getStorage(type) {
        if (type === 'local') return localStorage;
        return sessionStorage;
    }

    /**
     * Salva valore in storage
     * @param {string} type - 'session' o 'local'
     * @param {string} key - Chiave
     * @param {*} value - Valore da salvare
     * @param {string|boolean} [nameSpace] - Namespace opzionale
     */
    set(type, key, value, nameSpace) {
        const storage = this._getStorage(type || 'session');
        const fullKey = this._namespaceKey(key, nameSpace);

        if (value === null || value === undefined || value === '') {
            storage.removeItem(fullKey);
        } else {
            storage.setItem(fullKey, this._serialize(value));
        }
    }

    /**
     * Legge valore da storage
     * @param {string} type - 'session' o 'local'
     * @param {string} key - Chiave
     * @param {string|boolean} [nameSpace] - Namespace opzionale
     * @returns {*}
     */
    get(type, key, nameSpace) {
        const storage = this._getStorage(type || 'session');
        const fullKey = this._namespaceKey(key, nameSpace);
        const value = storage.getItem(fullKey);

        if (value === null) return null;

        try {
            return this._deserialize(value);
        } catch (e) {
            console.warn('Storage: auto-fix corrupted key', fullKey);
            storage.removeItem(fullKey);
            return null;
        }
    }

    /**
     * Rimuove valore da storage
     * @param {string} type - 'session' o 'local'
     * @param {string} key - Chiave
     * @param {string|boolean} [nameSpace] - Namespace opzionale
     */
    remove(type, key, nameSpace) {
        const storage = this._getStorage(type || 'session');
        const fullKey = this._namespaceKey(key, nameSpace);
        storage.removeItem(fullKey);
    }

    /**
     * Verifica esistenza chiave
     * @param {string} type - 'session' o 'local'
     * @param {string} key - Chiave
     * @param {string|boolean} [nameSpace] - Namespace opzionale
     * @returns {boolean}
     */
    has(type, key, nameSpace) {
        const storage = this._getStorage(type || 'session');
        const fullKey = this._namespaceKey(key, nameSpace);
        return storage.getItem(fullKey) !== null;
    }

    // === Shortcut methods ===

    /**
     * Salva in sessionStorage
     */
    setSession(key, value, nameSpace) {
        this.set('session', key, value, nameSpace);
    }

    /**
     * Legge da sessionStorage
     */
    getSession(key, nameSpace) {
        return this.get('session', key, nameSpace);
    }

    /**
     * Salva in localStorage
     */
    setLocal(key, value, nameSpace) {
        this.set('local', key, value, nameSpace);
    }

    /**
     * Legge da localStorage
     */
    getLocal(key, nameSpace) {
        return this.get('local', key, nameSpace);
    }
}

/**
 * Crea deprecation wrapper per metodi spostati in storage
 */
export function createStorageDeprecations(genro) {
    Object.defineProperty(genro, 'setInStorage', {
        get() {
            console.warn('DEPRECATED: genro.setInStorage() → use genro.storage.set()');
            return (type, key, value, ns) => this.storage.set(type, key, value, ns);
        },
        configurable: true
    });

    Object.defineProperty(genro, 'getFromStorage', {
        get() {
            console.warn('DEPRECATED: genro.getFromStorage() → use genro.storage.get()');
            return (type, key, ns) => this.storage.get(type, key, ns);
        },
        configurable: true
    });
}
