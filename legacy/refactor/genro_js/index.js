/**
 * genro_js - Entry Point
 *
 * Assembla tutti i moduli e crea l'istanza genro globale.
 *
 * Struttura:
 * - genro (root)
 *   ├── tools     → GenroTools
 *   ├── nav       → GenroNavigation
 *   ├── storage   → GenroStorage
 *   ├── _eventBus → EventBus (interno)
 *   └── [handler] → rpc, src, wdg, dom, dlg, dev, wsk (iniettati esternamente)
 */

// Core
import { EventBus, EventBusMixin } from './core/EventBus.js';

// Namespace modules
import { GenroTools, createToolsDeprecations } from './tools/Tools.js';
import { GenroStorage, createStorageDeprecations } from './storage/Storage.js';
import { GenroNavigation, createNavigationDeprecations } from './navigation/Navigation.js';

/**
 * Configurazione per GenroClient
 * @typedef {Object} GenroConfig
 * @property {string} page_id - ID sessione pagina
 * @property {Object} [startArgs] - Argomenti iniziali dal server
 * @property {string} [baseUrl] - URL base applicazione
 * @property {string} [domRootName] - ID elemento root DOM
 * @property {string} [websockets_url] - URL WebSocket
 */

/**
 * Crea nuova istanza GenroClient
 * @param {GenroConfig} config
 * @returns {Object} Istanza genro
 */
export function createGenro(config) {
    const genro = new GenroClientCore(config);

    // Inizializza namespace modules
    genro._eventBus = new EventBus();
    genro.tools = new GenroTools(genro);
    genro.storage = new GenroStorage(genro);
    genro.nav = new GenroNavigation(genro);

    // Applica mixin
    Object.assign(genro, EventBusMixin);

    // Crea deprecation wrapper per backward compatibility
    createToolsDeprecations(genro);
    createStorageDeprecations(genro);
    createNavigationDeprecations(genro);

    return genro;
}

/**
 * GenroClient Core - Solo proprietà e lifecycle base
 *
 * I metodi sono aggiunti tramite mixin per mantenere i moduli separati.
 */
class GenroClientCore {
    constructor(config) {
        // Configurazione base
        this.pageId = config.page_id;
        this.page_id = config.page_id;  // Alias per compatibilità
        this.startArgs = config.startArgs || {};
        this.baseUrl = config.baseUrl || '';
        this.domRootName = config.domRootName || 'mainWindow';
        this.websockets_url = config.websockets_url;

        // Stato
        this._pageStarted = false;
        this._reloading = false;
        this._windowClosing = false;

        // Data bags (saranno inizializzate in start())
        this._data = null;
        this._dataroot = null;

        // Handler placeholder (iniettati esternamente)
        this.rpc = null;
        this.src = null;
        this.wdg = null;
        this.dom = null;
        this.dlg = null;
        this.dev = null;
        this.wsk = null;
        this.vld = null;
        this.som = null;

        // Registry
        this.widget = {};
        this.contextIndex = {};
        this.pendingCallAfter = {};
        this.watches = {};
        this.sounds = {};

        // Platform detection
        this.isMac = navigator.appVersion.includes('Macintosh');
        this.isChrome = navigator.appVersion.includes('Chrome');
        this.isMobile = this.startArgs.isMobile || false;
        this.isCordova = this.startArgs.isCordova || false;
        this.isDeveloper = this.startArgs.isDeveloper || false;

        // Iframe/window management
        this.mainGenroWindow = window;
        this.root_page_id = null;
        this.parent_page_id = null;
        this.parentIframeSourceNode = null;
        this.externalWindowsObjects = {};

        // Timing
        this.serverTimeDelta = 0;
        this._lastUserEventTs = new Date();
        this._lastRpc = new Date();

        // Debug
        this.debuglevel = this.startArgs.debug || null;
        this._debugPaths = {};
    }

    /**
     * Accesso shortcut ai dati relativi
     * @param {string} path - Path relativa
     * @returns {*}
     */
    _(path) {
        return this.src?.getNode()?.getRelativeData(path);
    }

    /**
     * Ottiene dati da path
     * @param {string} [path] - Path (se omesso, ritorna _data)
     * @param {*} [dflt=null] - Valore default
     * @returns {*}
     */
    getData(path, dflt = null) {
        if (!path) return this._data;

        const node = this.getDataNode(path);
        if (node) {
            const value = node.getValue();
            return value ?? dflt;
        }
        return dflt;
    }

    /**
     * Imposta dati a path
     * @param {string} path - Path
     * @param {*} value - Valore
     * @param {Object} [attributes] - Attributi nodo
     * @param {*} [doTrigger] - Trigger flag
     */
    setData(path, value, attributes, doTrigger) {
        path = this.pathResolve(path);
        this._data?.setItem(path, value, attributes, {
            doTrigger,
            lazySet: true
        });
    }

    /**
     * Ottiene nodo dati
     * @param {string} path - Path
     * @param {boolean} [autocreate] - Crea se non esiste
     * @param {*} [dflt] - Valore default
     * @returns {Object|null}
     */
    getDataNode(path, autocreate, dflt) {
        path = this.pathResolve(path);

        if (!path) {
            return this._dataroot?.getNode('main');
        }

        // Path speciali
        if (path.startsWith('*S')) {
            return this.src?.getNode(path.slice(3));
        }
        if (path.startsWith('*D')) {
            path = path.slice(3);
        }

        return this._data?.getNode(path, false, autocreate, dflt);
    }

    /**
     * Ottiene attributo da nodo dati
     * @param {string} path - Path
     * @param {string} attr - Nome attributo
     * @param {*} [dflt] - Default
     * @returns {*}
     */
    getDataAttr(path, attr, dflt) {
        const node = this.getDataNode(path);
        return node?.getAttr(attr, dflt);
    }

    /**
     * Risolve path (assoluto o relativo)
     * @param {string|Object} obj - Path o oggetto con sourceNode
     * @returns {string|null}
     */
    pathResolve(obj) {
        if (!obj) return null;

        if (typeof obj === 'string') {
            return this.src?.getNode()?.absDatapath(obj) ?? obj;
        }

        // GnrDomSourceNode
        if (obj.absDatapath) {
            return obj.absDatapath();
        }

        // Widget o domNode
        if (obj.sourceNode) {
            return obj.sourceNode.absDatapath();
        }

        return null;
    }

    /**
     * Trova sourceNode per ID
     * @param {string} nodeId - ID nodo
     * @param {Object} [scope] - Scope per path relativi
     * @returns {Object|null}
     */
    nodeById(nodeId, scope) {
        // Implementazione delegata a src quando disponibile
        return this.src?._index?.[nodeId] ?? null;
    }

    /**
     * Trova DOM element per nodeId
     * @param {string} nodeId - ID nodo
     * @param {Object} [scope] - Scope
     * @returns {HTMLElement|null}
     */
    domById(nodeId, scope) {
        const node = this.nodeById(nodeId, scope);
        return node?.getDomNode() ?? document.getElementById(nodeId);
    }

    /**
     * Trova widget per nodeId
     * @param {string} nodeId - ID nodo
     * @param {Object} [scope] - Scope
     * @returns {Object|null}
     */
    wdgById(nodeId, scope) {
        return this.nodeById(nodeId, scope)?.getWidget();
    }

    /**
     * Ottiene sourceNode da evento o elemento
     * @param {Event|HTMLElement} obj
     * @returns {Object|null}
     */
    getSourceNode(obj) {
        return this.src?.getNode(obj);
    }

    /**
     * Ottiene form per ID o frameCode
     * @param {string} frameCode
     * @returns {Object|null}
     */
    getForm(frameCode) {
        const frameNode = this.getFrameNode(frameCode);
        return frameNode?.form ?? this.formById(frameCode);
    }

    /**
     * Ottiene form per ID
     * @param {string} formId
     * @returns {Object|null}
     */
    formById(formId) {
        const node = this.nodeById(formId);
        return node?.form;
    }

    /**
     * Ottiene frame node
     * @param {string} frameCode
     * @param {string} [side]
     * @returns {Object|null}
     */
    getFrameNode(frameCode, side) {
        const frameNode = this.nodeById(frameCode + '_frame');
        if (!frameNode) return null;

        if (side === 'frame') return frameNode;

        const containerNode = frameNode.getValue()?.getNodes()?.[0];
        if (!side) return containerNode;

        return containerNode?.getValue()?.getNodeByAttr('region', side);
    }

    /**
     * Ottiene genro del parent (se in iframe)
     * @returns {Object|null}
     */
    getParentGenro() {
        if (this.parentIframeSourceNode) {
            return window.parent.genro;
        }
        if (this.root_page_id && this.page_id !== this.root_page_id) {
            return this.mainGenroWindow.genro;
        }
        return null;
    }

    /**
     * Esegue callback dopo timeout (con debounce opzionale)
     * @param {Function|string} cb - Callback
     * @param {number} timeout - Delay ms
     * @param {Object} [scope] - Scope
     * @param {string} [reason] - ID per debounce
     */
    callAfter(cb, timeout, scope, reason) {
        scope = scope || this;

        if (typeof cb === 'string') {
            cb = new Function(cb);
        }

        if (reason) {
            if (this.pendingCallAfter[reason]) {
                clearTimeout(this.pendingCallAfter[reason]);
            }
            this.pendingCallAfter[reason] = setTimeout(cb.bind(scope), timeout);
        } else {
            setTimeout(cb.bind(scope), timeout);
        }
    }

    /**
     * Watch con polling su condizione
     * @param {string} watchId - ID univoco
     * @param {Function} conditionCb - Condizione (ritorna true per eseguire)
     * @param {Function} action - Azione da eseguire
     * @param {number} [delay=200] - Intervallo polling
     */
    watch(watchId, conditionCb, action, delay = 200) {
        if (this.watches[watchId]) {
            this.unwatch(watchId);
        }

        if (conditionCb()) {
            action();
        } else {
            this.watches[watchId] = setInterval(() => {
                if (conditionCb()) {
                    this.unwatch(watchId);
                    action();
                }
            }, delay);
        }
    }

    /**
     * Rimuove watch
     * @param {string} watchId
     */
    unwatch(watchId) {
        if (this.watches[watchId]) {
            clearInterval(this.watches[watchId]);
            delete this.watches[watchId];
        }
    }

    /**
     * Server call shortcut
     * @param {string} method - Nome metodo
     * @param {Object} [params] - Parametri
     * @param {Function|string} [asyncCb] - Callback
     * @param {string} [mode] - Modo risposta
     * @param {string} [httpMethod='POST'] - Metodo HTTP
     * @returns {*}
     */
    serverCall(method, params, asyncCb, mode, httpMethod = 'POST') {
        if (typeof asyncCb === 'string') {
            asyncCb = new Function(asyncCb);
        }
        return this.rpc?.remoteCall(method, params, mode, httpMethod, null, asyncCb);
    }
}

// ============================================================
// SINGLETON E COMPATIBILITÀ GLOBALE
// ============================================================

/**
 * Istanza singleton globale
 * @type {Object|null}
 */
export let genro = null;

/**
 * Inizializza genro globale
 * @param {GenroConfig} config
 * @returns {Object}
 */
export function initGenro(config) {
    genro = createGenro(config);

    // Esponi globalmente per backward compatibility
    if (typeof window !== 'undefined') {
        window.genro = genro;
    }

    return genro;
}

// Default export per import semplificato
export default { createGenro, initGenro };
