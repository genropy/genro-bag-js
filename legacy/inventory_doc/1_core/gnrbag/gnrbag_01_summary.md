# gnrbag.js - Summary

**File**: `gnrbag.js`
**Linee**: 2577
**Dimensione**: 81 KB
**Ultima modifica**: 2025-03-07
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Core del sistema Bag: implementa le classi fondamentali per la gestione di strutture dati gerarchiche con supporto per:
- Nodi etichettati con attributi
- Subscription/trigger system per reattività
- Lazy loading tramite resolver
- Serializzazione XML
- Path traversal con sintassi speciale

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.hitch`, `dojo.Deferred`, `dojo.forEach`, `dojo.toJson`
- **gnrlang.js**: Utility functions (`isBag`, `objectUpdate`, `convertFromText`, `xml_buildTag`, ecc.)
- **genro**: Global application object (per resolver, clsdict, evaluate)

## Classi Principali

| Nome | Tipo | Linee | Descrizione |
|------|------|-------|-------------|
| `gnr.GnrBagNode` | class | 31-543 | Nodo singolo con label, value, attr, resolver |
| `gnr.GnrBag` | class | 548-2321 | Container gerarchico di nodi |
| `gnr.GnrBagResolver` | class | 2339-2479 | Base per lazy loading |
| `gnr.GnrBagFormula` | class | 2485-2505 | Resolver per formule calcolate |
| `gnr.GnrBagGetter` | class | 2525-2543 | Resolver getter |
| `gnr.GnrBagCbResolver` | class | 2546-2558 | Resolver con callback |

## GnrBagNode - Metodi Chiave

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(parentbag, label, value, attr, resolver)` | Inizializza nodo |
| `getValue` | `(mode, optkwargs)` | Ottiene valore, risolve resolver se necessario |
| `setValue` | `(value, doTrigger, attr, updattr, fired)` | Imposta valore, triggera eventi |
| `getAttr` | `(label, default)` | Ottiene attributo |
| `setAttr` | `(attr, doTrigger, updateAttr, changedAttr)` | Imposta attributi |
| `getParentBag` | `()` | Ritorna bag padre |
| `getParentNode` | `()` | Ritorna nodo padre |
| `getFullpath` | `(mode, root)` | Path completo dalla root |
| `setResolver` | `(resolver)` | Imposta lazy resolver |
| `getResolver` | `()` | Ottiene resolver |
| `isExpired` | `()` | Controlla se resolver scaduto |
| `getInheritedAttributes` | `(attrname)` | Attributi ereditati |
| `attributeOwnerNode` | `(attrname, attrvalue)` | Trova nodo proprietario attributo |
| `_toXmlBlock` | `(kwargs)` | Serializza a XML |

## GnrBag - Metodi Chiave

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(source, kw)` | Inizializza bag, opzionalmente da source |
| `fillFrom` | `(source, kw)` | Riempie da array, object, XML string |
| `getItem` | `(path, dft, mode, optkwargs)` | Accesso per path |
| `setItem` | `(path, value, attr, kwargs)` | Imposta item per path |
| `get` | `(label, dflt, mode, optkwargs)` | Accesso diretto per label |
| `set` | `(label, value, attr, kwargs)` | Imposta per label |
| `getNode` | `(path, asTuple, autocreate, default)` | Ottiene BagNode |
| `getNodes` | `(condition)` | Lista nodi (filtrata opzionalmente) |
| `pop` | `(path, doTrigger)` | Rimuove e ritorna valore |
| `popNode` | `(path, doTrigger)` | Rimuove e ritorna nodo |
| `clear` | `(triggered)` | Svuota bag |
| `index` | `(label)` | Indice di label (supporta `#N`, `#attr=val`) |
| `htraverse` | `(pathlist, autocreate)` | Traversal gerarchico |
| `keys` | `()` | Lista labels |
| `values` | `()` | Lista valori |
| `items` | `()` | Lista {key, value} |
| `digest` | `(what, asColumns)` | Estrae dati (#k, #v, #a.attr) |
| `sort` | `(pars)` | Ordina nodi |
| `sum` | `(path, strictmode)` | Somma valori numerici |
| `walk` | `(callback, mode, kw, notRecursive)` | Visita ricorsiva |
| `forEach` | `(callback, mode, kw)` | Itera sui nodi diretti |
| `deepCopy` | `(deep)` | Copia profonda |
| `update` | `(bagOrObj, mode, reason)` | Merge di bag/object |
| `concat` | `(b)` | Concatena nodi |
| `asDict` | `(recursive, excludeNullValues)` | Converte a JS object |
| `toXml` | `(kwargs)` | Serializza a XML |
| `fromXmlDoc` | `(source, clsdict)` | Parsing da DOM XML |
| `subscribe` | `(subscriberId, kwargs)` | Registra subscriber |
| `unsubscribe` | `(subscriberId)` | Rimuove subscriber |
| `onNodeTrigger` | `(kw)` | Propaga evento trigger |
| `setBackRef` | `(node, parent)` | Attiva backref per trigger |
| `formula` | `(formula, kwargs)` | Crea formula resolver |

## GnrBagResolver - Metodi Chiave

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(kwargs, isGetter, cacheTime, load)` | Inizializza resolver |
| `expired` | `(kwargs)` | Controlla scadenza cache |
| `resolve` | `(optkwargs, destinationNode)` | Risolve e ritorna valore |
| `load` | `(kwargs, cb)` | Override per logica di caricamento |
| `reset` | `()` | Invalida cache |
| `meToo` | `(cb)` | Gestisce richieste pendenti |

## Path Syntax Speciale

| Syntax | Esempio | Descrizione |
|--------|---------|-------------|
| `.` | `a.b.c` | Traversal standard |
| `#N` | `#0`, `#5` | Accesso per indice |
| `#attr=val` | `#id=123` | Cerca per attributo |
| `?attr` | `config?name` | Ottiene attributo del nodo |
| `?#attr` | `node?#attr` | Ottiene tutti gli attributi |
| `?#keys` | `bag?#keys` | Ottiene lista chiavi |
| `?#node` | `path?#node` | Ottiene nodo invece di valore |
| `~path` | `node~subpath` | Accesso alternativo |
| `#parent` | `../` equivalente | Navigazione al padre |

## Sistema di Subscription/Trigger

```javascript
// Eventi supportati
{
    evt: 'ins' | 'upd' | 'del',
    node: BagNode,
    where: Bag,
    ind: number,
    pathlist: string[],
    oldvalue: any,
    value: any,
    oldattr: object,
    reason: string | boolean
}

// Registrazione
bag.subscribe('myId', {
    any: function(kw) { /* tutti gli eventi */ },
    ins: function(kw) { /* solo inserimenti */ },
    upd: function(kw) { /* solo aggiornamenti */ },
    del: function(kw) { /* solo cancellazioni */ }
});
```

## Resolver Cache Time

| Valore | Comportamento |
|--------|---------------|
| `> 0` | Risolve dopo N secondi |
| `= 0` | Risolve sempre |
| `< 0` | Risolve una sola volta |

## Pattern Utilizzati

1. **Lazy Loading**: Resolver pattern con cache expiration
2. **Observer**: Subscription/trigger per reattività
3. **Composite**: Bag contiene BagNode che possono contenere Bag
4. **Factory**: `newNode()` per creazione nodi
5. **Deferred/Promise**: Supporto asincrono con `dojo.Deferred`

## Rilevanza per genro-bag-js

⭐⭐⭐ **ALTA** - Questo è il file core da cui derivare l'implementazione TypeScript.

### Da Portare
- Struttura `Bag` / `BagNode`
- Sistema subscription/trigger
- Resolver con caching
- Path syntax (#N, ?attr, ecc.)
- Serializzazione XML (compatibile)

### Da Modernizzare
- Rimuovere dipendenza Dojo
- Usare Promise native invece di Deferred
- TypeScript strict types
- ES modules invece di global namespace

### Da NON Portare
- Dipendenza da `genro` global
- Metodi specifici per DOM (`asHtmlTable`, `getFormattedValue`)
- Dojo `declare` - usare class ES6

## Note

1. **_counter**: Contatore statico per ID univoci nodi (linea 45)
2. **_backref**: Flag per attivare trigger system (default false)
3. **Promise support**: Già presente supporto base per Promise (linea 257-261)
4. **Label speciale**: `#id` genera ID automatico con `genro.time36Id()`
5. **Formula system**: Sistema di formule con simboli per calcoli reattivi

## File Correlati

- `gnrlang.js` - Utility functions richieste
- `gnrdomsource.js` - Estensione DOM (GnrDomSource, GnrDomSourceNode)
- `genro_src.js` - Trigger handlers per DOM
