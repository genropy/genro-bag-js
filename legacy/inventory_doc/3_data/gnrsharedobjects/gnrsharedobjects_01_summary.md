# gnrsharedobjects.js - Summary

**File**: `gnrsharedobjects.js`
**Linee**: 167
**Dimensione**: 7 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Gestione di oggetti condivisi tra pagine/utenti tramite WebSocket. Permette la sincronizzazione real-time di porzioni di dati tra client multipli.

## Dipendenze

- **gnr.GnrBag**: Per manipolazione dati
- **gnr.GnrDomSourceNode**: Per trovare nodi DOM
- **genro**: Oggetto globale (wsk, _data, _sharedObjects, _sharedObjects_paths, dom, publish)

## GnrSharedObjectHandler

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento applicazione Genro |
| `lockedPaths` | Dizionario path → user per lock |

### Metodi

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `registerSharedObject` | `(path, shared_id, kw)` | Registra oggetto condiviso |
| `unregisterSharedObject` | `(shared_id)` | Annulla registrazione |
| `saveSharedObject` | `(shared_id)` | Salva oggetto su server |
| `loadSharedObject` | `(shared_id)` | Ricarica oggetto da server |
| `do_sharedObjectChange` | `(data)` | Handler cambio da server |
| `do_onPathLock` | `(data)` | Handler lock/unlock path |

### registerSharedObject

Registra un oggetto condiviso:

```javascript
genro.som.registerSharedObject('gnr.record.data', 'record_123', {
    on_registered: function(shared_id) { /* ready */ },
    on_unregistered: function(shared_id) { /* cleanup */ }
});
```

**Flusso:**
1. Crea entry in `genro._sharedObjects`
2. Chiama WebSocket `som.subscribe`
3. Al successo, imposta `ready: true` e `privilege`
4. Registra `genro._sharedObjects_paths[path] = shared_id`
5. Pubblica topic `shared_<shared_id>` con `{ready: true, privilege}`
6. Aggiunge listener focus/blur per notificare editing

### do_sharedObjectChange

Handler per cambiamenti ricevuti dal server:

```javascript
{
    shared_id: 'record_123',
    path: 'field.subfield',  // relativo
    value: <any>,
    attr: <object>,
    evt: 'upd' | 'del',
    fired: <boolean>,
    from_page_id: 'page_xyz'
}
```

**Azioni:**
- `evt == 'del'`: Rimuove nodo con `popNode`
- `evt != 'del'` + `fired`: Fire con `fireItem`
- `evt != 'del'`: Set con `setItem` e `doTrigger: 'serverChange'`

### do_onPathLock

Handler per lock/unlock di path:

```javascript
{
    lock_path: 'gnr.record.data.field',
    locked: true/false,
    user: 'username'
}
```

**Azioni:**
1. Aggiorna `lockedPaths`
2. Cerca nodo DOM con quel path
3. Disabilita/abilita il nodo

### Focus/Blur Tracking

Quando un widget con value su shared path riceve focus/blur:
- Invia `som.onPathFocus` via WebSocket
- Include `shared_id`, `curr_path`, `focused`

## Strutture Dati Globali

### genro._sharedObjects

```javascript
genro._sharedObjects = {
    'shared_id': {
        shared_id: 'shared_id',
        path: 'gnr.record.data',
        ready: true/false,
        privilege: 'read' | 'write',
        on_unregistered: function() {}
    }
}
```

### genro._sharedObjects_paths

```javascript
genro._sharedObjects_paths = {
    'gnr.record.data': 'shared_id'
}
```

Mappa inversa path → shared_id per attivare trigger.

## Comandi WebSocket

| Comando | Direzione | Descrizione |
|---------|-----------|-------------|
| `som.subscribe` | Client → Server | Registra shared object |
| `som.unsubscribe` | Client → Server | Annulla registrazione |
| `som.saveSharedObject` | Client → Server | Salva su server |
| `som.loadSharedObject` | Client → Server | Ricarica da server |
| `som.onPathFocus` | Client → Server | Notifica focus/blur |
| `sharedObjectChange` | Server → Client | Notifica cambio dati |
| `onPathLock` | Server → Client | Notifica lock/unlock |

## Rilevanza per genro-bag-js

⭐ **BASSA** - Specifico per sincronizzazione Genro multi-client.

### Concetti Interessanti

- Pattern per sincronizzazione dati real-time
- Sistema di lock collaborativo
- Tracking focus per conflict resolution

### Da NON Portare

- Dipendenza completa da infrastruttura Genro (wsk, src, dom)
- Logica specifica per form editing collaborativo

## Note

1. **Privilege**: `read` o `write` determina se client può modificare
2. **serverChange**: Reason speciale per distinguere trigger locali da remoti
3. **Focus tracking**: Permette di sapere chi sta editando cosa
4. **Path locking**: Blocca widget quando un altro utente sta editando

## File Correlati

- `gnrwebsocket.js` - WebSocket handler (genro.wsk)
- `gnrdomsource.js` - GnrDomSourceNode per trovare widget
- `gnrbag.js` - Manipolazione dati
