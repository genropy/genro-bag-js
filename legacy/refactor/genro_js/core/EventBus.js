/**
 * EventBus - Sistema pub/sub senza Dojo
 *
 * Sostituisce:
 * - dojo.publish()
 * - dojo.subscribe()
 * - dojo.unsubscribe()
 *
 * Metodi genro estratti:
 * - publish (linee 1801-1881)
 * - fireEvent (linee 1119-1124)
 */

export class EventBus {
    constructor() {
        this._subscribers = new Map();
        this._onceSubscribers = new Map();
    }

    /**
     * Sottoscrive a un topic
     * @param {string} topic - Nome topic
     * @param {Function} handler - Callback
     * @returns {Function} Funzione per unsubscribe
     */
    subscribe(topic, handler) {
        if (!this._subscribers.has(topic)) {
            this._subscribers.set(topic, new Set());
        }

        this._subscribers.get(topic).add(handler);

        // Ritorna funzione per unsubscribe
        return () => this.unsubscribe(topic, handler);
    }

    /**
     * Sottoscrive per una sola esecuzione
     * @param {string} topic - Nome topic
     * @param {Function} handler - Callback
     * @returns {Function} Funzione per unsubscribe
     */
    subscribeOnce(topic, handler) {
        const wrappedHandler = (...args) => {
            this.unsubscribe(topic, wrappedHandler);
            handler(...args);
        };

        return this.subscribe(topic, wrappedHandler);
    }

    /**
     * Rimuove sottoscrizione
     * @param {string} topic - Nome topic
     * @param {Function} handler - Callback da rimuovere
     */
    unsubscribe(topic, handler) {
        this._subscribers.get(topic)?.delete(handler);
    }

    /**
     * Pubblica evento
     * @param {string} topic - Nome topic
     * @param {...*} args - Argomenti da passare ai subscriber
     */
    publish(topic, ...args) {
        const subs = this._subscribers.get(topic);

        if (subs) {
            for (const handler of subs) {
                try {
                    handler(...args);
                } catch (e) {
                    console.error(`EventBus error on topic "${topic}":`, e);
                }
            }
        }
    }

    /**
     * Verifica se topic ha subscriber
     * @param {string} topic - Nome topic
     * @returns {boolean}
     */
    hasSubscribers(topic) {
        const subs = this._subscribers.get(topic);
        return subs ? subs.size > 0 : false;
    }

    /**
     * Rimuove tutti i subscriber di un topic
     * @param {string} [topic] - Se omesso, pulisce tutto
     */
    clear(topic) {
        if (topic) {
            this._subscribers.delete(topic);
        } else {
            this._subscribers.clear();
        }
    }

    /**
     * Conta subscriber per un topic
     * @param {string} topic - Nome topic
     * @returns {number}
     */
    subscriberCount(topic) {
        return this._subscribers.get(topic)?.size || 0;
    }
}

/**
 * Mixin per genro - gestisce publish complesso con target
 *
 * genro.publish() supporta:
 * - Stringa semplice: genro.publish('topic', data)
 * - Oggetto con target: genro.publish({topic: 'x', parent: true, iframe: '*'}, data)
 */
export const EventBusMixin = {
    /**
     * Pubblica evento (compatibile con sintassi legacy)
     * @param {string|Object} topic - Topic o oggetto configurazione
     * @param {*} [kw] - Dati evento
     */
    publish(topic, kw) {
        // Caso semplice: stringa
        if (typeof topic === 'string') {
            this._eventBus.publish(topic, kw);
            return;
        }

        // Caso complesso: oggetto con target
        const {
            topic: topicName,
            parent,
            iframe,
            extWin,
            nodeId,
            form,
            kw: topicKw
        } = topic;

        const data = topicKw || kw;

        // Pubblica a nodeId specifico
        if (nodeId) {
            const node = this.nodeById(nodeId);
            node?.publish(topicName, data);
        }
        // Pubblica a form specifico
        else if (form) {
            const formObj = this.getForm(form);
            formObj?.publish(topicName, data);
        }
        // Pubblica normale
        else {
            this._eventBus.publish(topicName, data);
        }

        // Propaga a finestra esterna
        if (extWin && this.externalWindowsObjects?.[extWin]) {
            const extWindow = this.externalWindowsObjects[extWin];
            this.dom?.windowMessage(extWindow, { topic: topicName, ...data });
            return;
        }

        // Propaga a iframe
        if (iframe) {
            const targetTopic = { ...topic };
            delete targetTopic.parent;

            if (iframe === '*') {
                // Tutti gli iframe
                for (const frame of window.frames) {
                    try {
                        frame.genro?.publish(targetTopic, data);
                    } catch (e) {
                        // iframe cross-origin, ignora
                    }
                }
            } else {
                // iframe specifico
                const iframeNode = this.domById?.(iframe);
                const frameWindow = iframeNode?.contentWindow;
                try {
                    frameWindow?.genro?.publish(targetTopic, data);
                } catch (e) {
                    // iframe cross-origin
                }
            }
        }

        // Propaga a parent
        if (parent) {
            const parentGenro = this.getParentGenro?.();
            if (parentGenro) {
                const targetTopic = { ...topic };
                delete targetTopic.iframe;
                delete targetTopic.parent;
                parentGenro.publish(targetTopic, data);
            }
        }
    },

    /**
     * Sottoscrive a topic
     * @param {string} topic - Nome topic
     * @param {Function} handler - Callback
     * @returns {Function} Funzione per unsubscribe
     */
    subscribe(topic, handler) {
        return this._eventBus.subscribe(topic, handler);
    },

    /**
     * Rimuove sottoscrizione
     * @param {string} topic - Nome topic
     * @param {Function} handler - Callback
     */
    unsubscribe(topic, handler) {
        this._eventBus.unsubscribe(topic, handler);
    },

    /**
     * Spara evento one-shot su path dati
     * @param {string} path - Path nel databag
     * @param {*} [msg=true] - Valore evento
     */
    fireEvent(path, msg = true) {
        const absPath = this.src?.getNode()?.absDatapath(path) || path;

        // Setta valore, poi lo rimuove (evento one-shot)
        this._data?.setItem(absPath, msg);
        this._data?.setItem(absPath, null, null, { doTrigger: false });
    },

    /**
     * Spara evento dopo delay
     * @param {string} path - Path nel databag
     * @param {*} [msg] - Valore evento
     * @param {number} [timeout=1] - Delay in ms
     */
    fireAfter(path, msg, timeout = 1) {
        if (this.pendingCallAfter[path]) {
            clearTimeout(this.pendingCallAfter[path]);
        }

        this.pendingCallAfter[path] = setTimeout(() => {
            this.fireEvent(path, msg);
        }, timeout);
    }
};
