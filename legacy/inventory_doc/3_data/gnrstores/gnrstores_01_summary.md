# gnrstores.js - Summary

**File**: `gnrstores.js`
**Linee**: 744
**Dimensione**: 30 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Implementa adapters per usare GnrBag come data store per widget Dojo (Tree, Grid, ComboBox). Wrappa GnrBag per esporre l'interfaccia `dojo.data` API.

**Classi definite:**
- `gnr.GnrStoreBag` - Store base per Bag
- `gnr.GnrStoreGrid` - Store specializzato per Grid
- `gnr.GnrStoreQuery` - Store specializzato per query/autocomplete

## Dipendenze

- **dojo.data.util.filter**: Pattern matching per query
- **dojo.data.util.sorter**: Sorting utility
- **gnr.GnrBag**: Data container
- **gnr.GnrBagNode**: Node container
- **genro**: Global application object
- **dojo.Deferred**: Async support

## GnrStoreBag - Store Base

### Configurazione

| Proprietà | Default | Descrizione |
|-----------|---------|-------------|
| `_identifier` | `'#id'` | Tipo di identificatore per nodi |
| `_staticStore` | `true` | Se store è statico |
| `_rootNodeName` | `'root'` | Nome nodo root |
| `hideValues` | `false` | Nascondi valori (mostra solo nodi con children) |
| `datapath` | `null` | Path dati in genro._data |
| `labelAttribute` | `null` | Attributo per label |
| `labelCb` | `null` | Callback per label |
| `nodeFilter` | `null` | Filtro nodi |

### Identifier Modes (_identifier)

| Valore | Descrizione |
|--------|-------------|
| `#id` | Usa `node._id` interno |
| `#k` | Usa `node.label` |
| `#i` | Usa indice posizione |
| `#p` | Usa fullpath stringa |
| `##` | Usa fullpath numerico |
| `.xx` | Usa child `xx` del valore |
| `xx` | Usa attributo `xx` |

### Metodi - dojo.data.api.Read

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getValue` | `(item, attribute, defaultValue)` | Ottiene valore attributo |
| `getValues` | `(item, attribute)` | Ottiene valori multipli |
| `getAttributes` | `(item)` | Lista attributi |
| `hasAttribute` | `(item, attribute)` | Verifica presenza attributo |
| `containsValue` | `(item, attribute, value)` | Verifica valore (non implementato) |
| `isItem` | `(something)` | Verifica se è BagNode |
| `isDictItem` | `(something)` | Verifica se è dizionario |
| `isItemLoaded` | `(something)` | Verifica se item caricato |
| `loadItem` | `(request)` | Carica item (resolver) |
| `fetch` | `(request)` | Fetch con query/paging/sorting |
| `close` | `(request)` | Chiude fetch (non implementato) |
| `getLabel` | `(item)` | Ottiene label |
| `getLabelAttributes` | `(item)` | Attributi label (non implementato) |

### Metodi - dojo.data.api.Write

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `newItem` | `(keywordArgs, parentInfo)` | Crea nuovo item (stub) |
| `deleteItem` | `(item)` | Elimina item (stub) |
| `setValue` | `(item, attribute, value)` | Imposta valore (stub) |
| `setValues` | `(item, attribute, values)` | Imposta valori multipli (stub) |
| `unsetAttribute` | `(item, attribute)` | Rimuove attributo (stub) |
| `save` | `(keywordArgs)` | Salva modifiche (stub) |
| `revert` | `()` | Annulla modifiche (stub) |
| `isDirty` | `(item)` | Verifica modifiche (stub) |

### Metodi - dojo.data.api.Identity

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getIdentity` | `(item)` | Ottiene ID univoco |
| `getIdentityAttributes` | `(item)` | Attributi identity (non implementato) |
| `fetchItemByIdentity` | `(request)` | Cerca item per ID |

### Metodi - dojo.data.api.Notification

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `onSet` | `(item, attribute, oldValue, newValue)` | Callback su modifica |
| `onNew` | `(newItem, parentInfo)` | Callback su inserimento |
| `onDelete` | `(deletedItem)` | Callback su eliminazione |

### Metodi Interni

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `rootDataNode` | `()` | Ottiene nodo root dati |
| `rootData` | `()` | Ottiene Bag root dati |
| `getFeatures` | `()` | Ritorna features supportate |
| `_doFetch` | `(request, findCallback, errCallback)` | Implementazione fetch |
| `_applyQuery` | `(query, ignoreCase, items)` | Applica filtro query |
| `_triggerUpd` | `(kw)` | Trigger aggiornamento |
| `_triggerIns` | `(kw)` | Trigger inserimento |
| `_triggerDel` | `(kw)` | Trigger eliminazione |

### Attribute Speciali per getValue/getValues

| Attributo | Descrizione |
|-----------|-------------|
| `#k` | Label del nodo |
| `#v` | Valore del nodo |
| `.xxx` | Child `xxx` del valore |
| `xxx` | Attributo `xxx` del nodo |

## GnrStoreGrid - Store per Grid

Estende `GnrStoreBag` con paginazione server-side.

### Metodi Override

| Metodo | Descrizione |
|--------|-------------|
| `_doFetch` | Passa `row_start`/`row_count` al resolver per paginazione |
| `fetchItemByIdentity` | Query con `where='id=:_pkey'` |

## GnrStoreQuery - Store per Query/Autocomplete

Estende `GnrStoreBag` con caching e query string.

### Proprietà Aggiuntive

| Proprietà | Default | Descrizione |
|-----------|---------|-------------|
| `cached_values` | `{}` | Cache risultati per ID |
| `cache_time` | `60` | Tempo cache in secondi |
| `switches` | `null` | Pattern matching per azioni speciali |

### Metodi

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `clearCache` | `(pkey)` | Svuota cache (singolo o tutto) |
| `fetchItemByIdentity` | `(request)` | Cerca con caching |
| `_doFetch` | `(request, findCallback, errCallback)` | Query con `_querystring` |

### Switches

Permette di intercettare pattern di input e eseguire azioni:

```javascript
switches: {
    'email': {
        search: /^.*@.*\..*$/,  // Pattern regex
        action: function(match) { /* ... */ }
    },
    'code': {
        search: /^[A-Z]{3}\d{4}$/,
        set: '=.some.path'  // Imposta displayedValue
    }
}
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è specifico per l'integrazione con widget Dojo.

### Concetti Utili

- Pattern adapter per esporre Bag come data source
- Sistema di identità flessibile (#id, #k, #p, etc.)
- Paginazione server-side con resolver

### Da NON Portare

- Dipendenza totale da Dojo data API
- Integrazione specifica con widget Dojo (Tree, Grid, ComboBox)
- Logica di caching per autocomplete

### Eventuale Equivalente Moderno

Se si volessero usare widget moderni (React, Vue, etc.), si creerebbe un adapter diverso specifico per quel framework, non un port di questo modulo.

## Note

1. **Lazy loading**: `hasAttribute` con `#v` gestisce resolver non ancora risolti
2. **Async support**: Usa `dojo.Deferred` per operazioni asincrone
3. **Query filtering**: Supporta pattern matching con `*` wildcard
4. **Notification**: Gli eventi `onSet`, `onNew`, `onDelete` permettono aggiornamento automatico widget

## File Correlati

- `gnrbag.js` - GnrBag/GnrBagNode base
- `genro_tree.js` - Widget Tree che usa questo store
- `genro_grid.js` - Widget Grid che usa questo store
- `genro_widgets.js` - Widget ComboBox/FilteringSelect che usano GnrStoreQuery
