# Refactor - Nuova Implementazione Modulare

Questa cartella contiene il refactor del codice legacy in moduli ES6.

## Strategia di Validazione

### Come siamo sicuri che non rompa nulla?

**Problema**: Il codice legacy non ha test automatizzati.

**Soluzioni proposte:**

---

## 1. Contract Testing (Interface Snapshot)

Prima del refactor, catturiamo l'interfaccia pubblica:

```javascript
// test/interface_snapshot.js

// Esegui con il VECCHIO genro.js caricato
function captureInterface(obj, name = 'genro') {
    const snapshot = {
        properties: [],
        methods: []
    };

    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'function') {
            snapshot.methods.push({
                name: key,
                length: val.length  // numero parametri
            });
        } else {
            snapshot.properties.push({
                name: key,
                type: typeof val
            });
        }
    }

    return snapshot;
}

// Salva come JSON
const snapshot = captureInterface(genro);
console.log(JSON.stringify(snapshot, null, 2));
```

Poi verifichiamo che il NUOVO genro abbia la stessa interfaccia.

---

## 2. Dual-Run Testing

Carica ENTRAMBE le versioni e confronta i risultati:

```javascript
// test/dual_run.js

import { createGenro as createNewGenro } from '../refactor/genro_js/index.js';

// Carica vecchio genro globale (da script tag)
const oldGenro = window.genro;

// Crea nuovo genro
const newGenro = createNewGenro({
    page_id: 'test',
    startArgs: oldGenro.startArgs
});

// Confronta risultati
function compareResults(methodName, ...args) {
    const oldResult = oldGenro[methodName]?.(...args);
    const newResult = newGenro[methodName]?.(...args);

    if (!deepEqual(oldResult, newResult)) {
        console.error(`MISMATCH: ${methodName}`, {old: oldResult, new: newResult});
        return false;
    }
    return true;
}

// Test suite
compareResults('makeUrl', '/test', {foo: 'bar'});
compareResults('getCounter');
compareResults('time36Id');
// ... etc
```

---

## 3. Shadow Mode (Produzione Graduale)

In produzione, usa entrambi e logga differenze:

```javascript
// shadow_mode.js

const SHADOW_ENABLED = true;

function shadowCall(methodName, ...args) {
    const oldResult = oldGenro[methodName](...args);

    if (SHADOW_ENABLED) {
        try {
            const newResult = newGenro[methodName](...args);
            if (!deepEqual(oldResult, newResult)) {
                // Log a server per analisi
                logDifference(methodName, args, oldResult, newResult);
            }
        } catch (e) {
            logError(methodName, args, e);
        }
    }

    return oldResult;  // Sempre usa il vecchio in produzione
}
```

---

## 4. Monkey Patch Testing

Sostituisci un metodo alla volta e verifica:

```javascript
// Fase 1: Sostituisci solo genro.tools
const originalGetCounter = genro.getCounter;
genro.getCounter = function() {
    const newResult = genro.tools.counter();
    const oldResult = originalGetCounter.call(genro);

    console.assert(newResult === oldResult, 'getCounter mismatch!');
    return oldResult;
};
```

---

## 5. Test Funzionali Manuali

Checklist per validazione manuale:

- [ ] Pagina si carica senza errori console
- [ ] Login funziona
- [ ] Form si apre e salva
- [ ] Grid carica dati
- [ ] Filtri funzionano
- [ ] Dialog si apre/chiude
- [ ] WebSocket connette
- [ ] Navigazione tra pagine
- [ ] Refresh mantiene stato

---

## Ordine di Migrazione Sicuro

1. **Estrai utility pure** (compare, counter, time36Id) → Facili da testare
2. **Estrai storage** → Può essere testato in isolamento
3. **Estrai navigation** → Test con URL mock
4. **Estrai EventBus** → Test unitari semplici
5. **Ultimo: DataAccess** → Dipende da Bag, più delicato

---

## File Structure

```
legacy/refactor/
├── README.md                 # Questo file
├── genro_js/
│   ├── index.js              # Entry point
│   ├── GenroClient.js        # Core class
│   ├── core/
│   │   ├── DataAccess.js
│   │   ├── EventBus.js
│   │   └── DataTriggers.js
│   ├── tools/
│   │   └── Tools.js
│   ├── navigation/
│   │   └── Navigation.js
│   ├── storage/
│   │   ├── Storage.js
│   │   └── Context.js
│   ├── registry/
│   │   ├── NodeRegistry.js
│   │   └── FormRegistry.js
│   ├── format/
│   │   └── Formatter.js
│   └── compat/
│       └── Deprecate.js
└── test/
    ├── interface_snapshot.js
    ├── dual_run.js
    └── checklist.md
```
