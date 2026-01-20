/**
 * GenroTools - Utility methods
 *
 * Namespace: genro.tools
 *
 * Metodi estratti da genro.js:
 * - getCounter (linee 1400-1408)
 * - time36Id (linee 1410-1418)
 * - compare (linee 264-270)
 * - isEqual (linee 2197-2201)
 * - safetry (linee 307-315)
 */

export class GenroTools {
    constructor(genro) {
        this.genro = genro;
        this._counters = {};
        this._lastTime36Id = 0;
        this._lastTime36IdCnt = 0;

        // Operatori di confronto
        this.compareDict = {
            '==': (a, b) => a == b,
            '>': (a, b) => a > b,
            '>=': (a, b) => a >= b,
            '<': (a, b) => a < b,
            '<=': (a, b) => a <= b,
            '!=': (a, b) => a != b,
            '%': (a, b) => String(a).indexOf(b) >= 0,
            '!%': (a, b) => String(a).indexOf(b) < 0
        };
    }

    /**
     * Incrementa e ritorna un contatore
     * @param {string} [what] - Nome contatore (default: globale)
     * @param {boolean} [reset] - Se true, resetta il contatore
     * @returns {number}
     */
    counter(what, reset) {
        const key = what ? `_counter_${what}` : '_counter';

        if (reset === true) {
            this._counters[key] = 0;
        } else {
            this._counters[key] = (this._counters[key] || 0) + 1;
        }

        return this._counters[key];
    }

    /**
     * Genera ID univoco basato su timestamp in base36
     * @returns {string}
     */
    time36Id() {
        const t = Date.now();

        if (this._lastTime36Id !== t) {
            this._lastTime36Id = t;
            this._lastTime36IdCnt = 0;
        }

        this._lastTime36IdCnt += 1;
        return ((this._lastTime36Id * 1000) + this._lastTime36IdCnt).toString(36);
    }

    /**
     * Confronta due valori con operatore
     * @param {string} op - Operatore ('==', '>', '<', '>=', '<=', '!=', '%', '!%')
     * @param {*} a - Primo valore
     * @param {*} b - Secondo valore
     * @returns {boolean}
     */
    compare(op, a, b) {
        // Normalizza Date a valueOf per confronto
        if (a instanceof Date && b instanceof Date) {
            a = a.valueOf();
            b = b.valueOf();
        }

        const compareFn = this.compareDict[op];
        if (!compareFn) {
            throw new Error(`Unknown comparison operator: ${op}`);
        }

        return compareFn(a, b);
    }

    /**
     * Verifica uguaglianza (gestisce Date)
     * @param {*} a
     * @param {*} b
     * @returns {boolean}
     */
    isEqual(a, b) {
        const valA = a instanceof Date ? a.valueOf() : a;
        const valB = b instanceof Date ? b.valueOf() : b;
        return valA == valB;
    }

    /**
     * Esegue callback con try-catch, logga errori
     * @param {Function} cb
     * @returns {*}
     */
    safetry(cb) {
        try {
            return cb();
        } catch (e) {
            console.error(e.message);
            console.log(e.stack);
            return undefined;
        }
    }

    /**
     * Breakpoint per debug
     * @param {*} aux - Se true, attiva debugger
     */
    bp(aux) {
        console.log('bp', arguments);
        if (aux === true) {
            debugger;
        }
    }

    /**
     * Misura tempo tra chiamate
     * @param {string} msg - Messaggio da loggare
     */
    timeIt(msg) {
        const now = new Date();
        const elapsed = now - (this._lastTime || now);
        const total = now - (this._startTime || now);

        if (!this._startTime) {
            this._startTime = now;
        }
        this._lastTime = now;

        console.log(`----timeIt: ${msg}: ${elapsed} - totalTime: ${total}`);
    }
}

/**
 * Crea deprecation wrapper per metodi spostati in tools
 */
export function createToolsDeprecations(genro) {
    const deprecations = {
        getCounter: 'counter',
        time36Id: 'time36Id',
        compare: 'compare',
        isEqual: 'isEqual',
        safetry: 'safetry',
        bp: 'bp',
        timeIt: 'timeIt'
    };

    for (const [oldName, newName] of Object.entries(deprecations)) {
        Object.defineProperty(genro, oldName, {
            get() {
                console.warn(`DEPRECATED: genro.${oldName}() → use genro.tools.${newName}()`);
                return (...args) => this.tools[newName](...args);
            },
            configurable: true
        });
    }
}
