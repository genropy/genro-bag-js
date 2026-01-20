/**
 * GenroNavigation - URL building and navigation
 *
 * Namespace: genro.nav
 *
 * Metodi estratti da genro.js:
 * - makeUrl (linee 1502-1516)
 * - addKwargs (linee 1517-1532)
 * - addParamsToUrl (linee 1952-1967)
 * - absoluteUrl (linee 1883-1911)
 * - constructUrl (linee 2145-2156)
 * - gotoURL (linee 2112-2119)
 * - gotoHome (linee 2138-2140)
 * - pageReload (linee 2218-2239)
 * - joinPath (linee 2120-2134)
 */

export class GenroNavigation {
    constructor(genro) {
        this.genro = genro;
    }

    /**
     * Costruisce URL completo
     * @param {string} url - URL relativo o assoluto
     * @param {Object} [kwargs] - Parametri query string
     * @returns {string}
     */
    makeUrl(url, kwargs) {
        // Se non ha protocollo, costruisci URL completo
        if (!url.includes('://')) {
            if (!url.startsWith('/')) {
                const base = document.location.pathname || '/index';
                url = base + '/' + url;
            }
            url = document.location.protocol + '//' + document.location.host + url;
        }

        return this.addKwargs(url, kwargs);
    }

    /**
     * Aggiunge parametri a URL
     * @param {string} url - URL base
     * @param {Object} [kwargs] - Parametri da aggiungere
     * @returns {string}
     */
    addKwargs(url, kwargs) {
        if (!kwargs || Object.keys(kwargs).length === 0) {
            return url + document.location.search;
        }

        const params = new URLSearchParams();
        params.set('page_id', this.genro.pageId);
        params.set('_no_cache_', this.genro.tools.counter());

        for (const [key, value] of Object.entries(kwargs)) {
            if (value !== null && value !== undefined) {
                params.set(key, String(value));
            }
        }

        return url + '?' + params.toString();
    }

    /**
     * Aggiunge parametri a URL esistente (preserva parametri esistenti)
     * @param {string} url - URL con eventuali parametri
     * @param {Object} [params] - Parametri da aggiungere
     * @returns {string}
     */
    addParams(url, params) {
        if (!url) return url;
        if (!params || Object.keys(params).length === 0) return url;

        const paramPairs = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '') {
                paramPairs.push(`${key}=${encodeURIComponent(value)}`);
            }
        }

        if (paramPairs.length === 0) return url;

        const sep = url.includes('?') ? '&' : '?';
        return url + sep + paramPairs.join('&');
    }

    /**
     * Costruisce URL assoluto dalla path corrente
     * @param {string} [url] - URL relativo
     * @param {Object} [kwargs] - Parametri
     * @param {boolean} [avoidCache=true] - Aggiunge cache buster
     * @returns {string}
     */
    absoluteUrl(url, kwargs, avoidCache = true) {
        const base = document.location.pathname;

        if (url) {
            const sep = url.startsWith('?') ? '' : '/';
            url = base + sep + url;
        } else {
            url = base;
        }

        if (kwargs) {
            const params = { page_id: this.genro.pageId };
            if (avoidCache) {
                params._no_cache_ = this.genro.tools.counter();
            }
            Object.assign(params, kwargs);

            const paramPairs = Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&');

            return url + '?' + paramPairs;
        }

        return url + document.location.search;
    }

    /**
     * Costruisce URL relativo a homeFolder
     * @param {string} path - Path relativa
     * @param {Object} [params] - Parametri query string
     * @returns {string}
     */
    constructUrl(path, params) {
        const homeFolder = this.genro.getData?.('gnr.homeFolder') || '';
        let url = homeFolder + path;

        if (params) {
            const paramPairs = Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&');
            url = url + '?' + paramPairs;
        }

        return url;
    }

    /**
     * Naviga a URL
     * @param {string} url - URL destinazione
     * @param {boolean} [relative=false] - Se true, usa constructUrl
     */
    gotoURL(url, relative = false) {
        if (relative) {
            url = this.constructUrl(url);
        } else if (!url.includes('://')) {
            const homeUrl = this.genro.getData?.('gnr.homeUrl') || '';
            url = this.joinPath(homeUrl, url);
        }

        window.location.assign(url);
    }

    /**
     * Naviga a homepage
     */
    gotoHome() {
        const homepage = this.genro.getData?.('gnr.homepage') || '/';
        window.location.assign(homepage);
    }

    /**
     * Ricarica pagina corrente
     * @param {Object} [params] - Parametri da aggiungere
     * @param {boolean} [replaceParams=false] - Se true, sostituisce parametri esistenti
     */
    reload(params, replaceParams = false) {
        this.genro._reloading = true;

        if (params) {
            if (!replaceParams) {
                // Merge con parametri esistenti
                const url = new URL(window.location.href);
                const existingParams = Object.fromEntries(url.searchParams);
                params = { ...existingParams, ...params };
            }

            if (Object.keys(params).length > 0) {
                params._no_cache_ = this.genro.tools.counter();
                const paramStr = Object.entries(params)
                    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                    .join('&');
                window.location.search = paramStr;
            } else {
                window.location.search = '';
            }
        } else {
            window.location.assign(window.location.href);
        }
    }

    /**
     * Torna indietro nella history
     */
    back() {
        window.history.back();
    }

    /**
     * Risale di un livello nella path
     */
    goUp() {
        const pathlist = window.location.pathname.split('/');
        if (pathlist.slice(-1)[0] !== '') {
            window.location.pathname = pathlist.slice(0, -1).join('/');
        } else {
            window.location.pathname = pathlist.slice(0, -2).join('/');
        }
    }

    /**
     * Unisce path evitando doppi slash
     * @param {...string} parts - Parti del path
     * @returns {string}
     */
    joinPath(...parts) {
        let result = parts[0] || '';

        for (let i = 1; i < parts.length; i++) {
            let part = parts[i] || '';

            if (!result.endsWith('/')) {
                result += '/';
            }
            if (part.startsWith('/')) {
                part = part.slice(1);
            }

            result += part;
        }

        return result;
    }

    /**
     * Apre URL in nuova finestra
     * @param {string} url - URL da aprire
     * @param {string} [name] - Nome finestra
     * @param {Object|string} [params] - Parametri finestra
     * @returns {Window}
     */
    openWindow(url, name, params = { height: '600', width: '900' }) {
        let paramStr = params;

        if (typeof params === 'object') {
            paramStr = Object.entries(params)
                .map(([k, v]) => `${k}=${v}`)
                .join(',');
        }

        const newWindow = window.open(url, name, paramStr);

        if (window.focus) {
            try {
                newWindow?.focus();
            } catch (e) {
                console.warn('New window blocked focus');
            }
        }

        return newWindow;
    }

    /**
     * Apre URL in nuovo tab
     * @param {string} url - URL da aprire
     * @param {Object} [params] - Parametri query string
     */
    openTab(url, params) {
        url = this.addParams(url, params);
        window.open(url);
    }
}

/**
 * Crea deprecation wrapper per metodi spostati in nav
 */
export function createNavigationDeprecations(genro) {
    const deprecations = {
        makeUrl: 'makeUrl',
        addKwargs: 'addKwargs',
        addParamsToUrl: 'addParams',
        absoluteUrl: 'absoluteUrl',
        constructUrl: 'constructUrl',
        gotoURL: 'gotoURL',
        gotoHome: 'gotoHome',
        pageReload: 'reload',
        pageBack: 'back',
        goBack: 'goUp',
        joinPath: 'joinPath',
        openWindow: 'openWindow',
        openBrowserTab: 'openTab'
    };

    for (const [oldName, newName] of Object.entries(deprecations)) {
        Object.defineProperty(genro, oldName, {
            get() {
                console.warn(`DEPRECATED: genro.${oldName}() → use genro.nav.${newName}()`);
                return (...args) => this.nav[newName](...args);
            },
            configurable: true
        });
    }
}
