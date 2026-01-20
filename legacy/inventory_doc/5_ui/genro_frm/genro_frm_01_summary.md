# genro_frm.js - Summary

**File**: `genro_frm.js`
**Linee**: 3186
**Dimensione**: 124 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Sistema completo di gestione form per Genro. Include handler form, validazione, form stores (per diversi tipi di dati/navigazione), e gestione del ciclo di vita completo (load/save/delete).

**Classi definite:**
- `gnr.GnrFrmHandler` - Form handler principale (~1500 righe)
- `gnr.GnrValidator` - Sistema di validazione (~330 righe)
- `gnr.formstores.Base` - Base class per form stores
- `gnr.formstores.SubForm` - Store per subform
- `gnr.formstores.Item` - Store per singolo item
- `gnr.formstores.Collection` - Store per collezioni con navigazione
- `gnr.formstores.Hierarchical` - Store per strutture gerarchiche

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.Deferred`, `dojo.hitch`
- **gnr.GnrBag**: Container dati per record
- **genro**: Global application object
- **gnrlang.js**: Utility functions

## GnrFrmHandler - Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `formId` | Identificativo unico form |
| `formDatapath` | Path ai dati del form in genro._data |
| `controllerPath` | Path al controller form |
| `pkeyPath` | Path alla primary key |
| `status` | Stato form ('readOnly', 'edit', 'locked') |
| `opStatus` | Stato operazione in corso |
| `changed` | Flag modifiche pendenti |
| `changesLogger` | Logger per tracciare modifiche |
| `store` | Form store associato |
| `_register` | Registro widget form |
| `gridEditors` | Editor grid associati |
| `autoSave` | Salvataggio automatico |
| `autoFocus` | Focus automatico |
| `_firstField` | Primo campo per focus |

## GnrFrmHandler - Metodi Principali

### Lifecycle

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(sourceNode, formId, formDatapath, controllerPath, pkeyPath, formAttr)` | Inizializza form |
| `onStartForm` | `()` | Avvio form (dopo creazione) |
| `load` | `(kw)` | Carica record (destPkey, default) |
| `doload_store` | `(kw)` | Caricamento via store |
| `doload_loader` | `(kw)` | Caricamento via loader node |
| `loaded` | `(loadedPkey, recordBag)` | Callback post-caricamento |
| `save` | `(kw, modifiers)` | Salva record |
| `do_save` | `(kw)` | Esecuzione salvataggio |
| `saved` | `(result)` | Callback post-salvataggio |
| `reload` | `(kw)` | Ricarica record corrente |
| `abort` | `()` | Annulla modifiche |
| `deleteRecord` | `()` | Elimina record |
| `deleted` | `()` | Callback post-eliminazione |

### Change Tracking

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `triggerUPD` | `(kw)` | Trigger aggiornamento campo |
| `triggerINS` | `(kw)` | Trigger inserimento |
| `triggerDEL` | `(kw)` | Trigger cancellazione |
| `getFormChanges` | `()` | Ottiene Bag modifiche |
| `hasChanges` | `()` | Verifica se ci sono modifiche |
| `isChangedField` | `(field)` | Campo specifico modificato |
| `reset` | `()` | Reset stato modifiche |
| `setLastSavedValues` | `()` | Salva valori per confronto |

### Status

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `updateStatus` | `()` | Aggiorna status form |
| `setOpStatus` | `(status)` | Imposta stato operazione |
| `isValid` | `()` | Verifica validità form |
| `isDisabled` | `()` | Verifica se disabilitato |
| `setLocked` | `(locked)` | Blocca/sblocca form |
| `applyDisabledStatus` | `()` | Applica stato disabled ai widget |
| `saveDisabled` | `()` | Verifica se save disabilitato |

### Data Access

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getFormData` | `()` | Ottiene Bag dati record |
| `getControllerData` | `(path)` | Ottiene dati controller |
| `setControllerData` | `(path, value)` | Imposta dati controller |
| `fireControllerData` | `(path, value)` | Fire evento su controller |
| `getCurrentPkey` | `()` | Primary key corrente |
| `setCurrentPkey` | `(pkey)` | Imposta primary key |
| `isNewRecord` | `()` | Verifica se nuovo record |
| `getFormCluster` | `()` | Ottiene record cluster per server |
| `getDataNodeAttributes` | `()` | Attributi nodo dati |

### Widget Registration

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `registerWidget` | `(sourceNode, wdg)` | Registra widget nel form |
| `unregisterWidget` | `(sourceNode)` | Deregistra widget |
| `isRegisteredWidget` | `(wdg)` | Verifica registrazione |
| `focus` | `(node)` | Focus su campo |
| `focusOnError` | `(path)` | Focus su primo errore |

### Copy/Paste

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `copyPasteMenu` | `()` | Menu copia/incolla |
| `copyCurrentRecord` | `()` | Copia record in clipboard |
| `pasteRecord` | `(path)` | Incolla da clipboard |
| `copyInClipboard` | `()` | Copia in clipboard browser |
| `updateFromClipboard` | `()` | Aggiorna da clipboard browser |

## GnrValidator

Sistema di validazione per campi form.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `validationTags` | Tag di validazione supportati |
| `application` | Riferimento a genro |

### validationTags

```javascript
['select', 'notnull', 'empty', 'case', 'len', 'min', 'max',
 'email', 'regex', 'call', 'gridnodup', 'nodup', 'exist', 'remote']
```

### Metodi Validazione

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `validate` | `(wdg, value, dflt, attr, kw)` | Entry point validazione |
| `_validate` | `(wdg, value, dflt, attr, kw)` | Validazione interna |
| `callValidation` | `(wdg, attr, value, userChange)` | Chiama validatori |
| `exitValidation` | `(wdg, errmsg)` | Termina con errore |

### Validatori Specifici

| Validatore | Descrizione |
|------------|-------------|
| `validate_notnull` | Campo obbligatorio |
| `validate_select` | Valore deve essere da selezione |
| `validate_empty` | Campo deve essere vuoto |
| `validate_case` | Verifica maiuscolo/minuscolo (u/l/c) |
| `validate_len` | Lunghezza minima/massima |
| `validate_min` | Valore minimo numerico |
| `validate_max` | Valore massimo numerico |
| `validate_email` | Formato email |
| `validate_regex` | Match regex |
| `validate_call` | Funzione custom |
| `validate_gridnodup` | No duplicati in grid |
| `validate_nodup` | No duplicati generici |
| `validate_exist` | Valore deve esistere |
| `validate_remote` | Validazione server-side |

### Attributi Validazione Widget

```javascript
// Su widget form:
validate_notnull: true,
validate_min: 0,
validate_max: 100,
validate_len: '3:50',     // min:max
validate_email: true,
validate_regex: '^[A-Z]',
validate_call: 'myValidator',
validate_remote: 'methodName',
validate_case: 'u',       // u=upper, l=lower, c=capitalize
```

## Form Stores

### gnr.formstores.Base

Classe base per tutti i form stores.

| Metodo | Descrizione |
|--------|-------------|
| `constructor` | Inizializza con form reference |
| `load_recordCluster` | Carica da record cluster (DB) |
| `save_recordCluster` | Salva su record cluster |
| `del_recordCluster` | Elimina da record cluster |
| `load_document` | Carica da document |
| `save_document` | Salva su document |
| `del_document` | Elimina document |
| `onSaving` | Hook pre-save |
| `onLoading` | Hook pre-load |
| `onDeleting` | Hook pre-delete |

### gnr.formstores.SubForm

Store per subform embedded.

```javascript
// Eredita da Base
// Gestisce form annidati in form principale
```

### gnr.formstores.Item

Store per singolo item.

```javascript
// Gestisce modifica singolo record
// Usato per form modali
```

### gnr.formstores.Collection

Store per collezioni con navigazione.

| Metodo | Descrizione |
|--------|-------------|
| `load_memory` | Carica da Bag in memoria |
| `save_memory` | Salva in Bag memoria |
| `del_memory` | Elimina da Bag memoria |
| `getNavigationPkey` | Ottiene pkey per navigazione |
| `setNavigationStatus` | Imposta stato navigazione |
| `firstRecord` | Vai a primo record |
| `prevRecord` | Vai a record precedente |
| `nextRecord` | Vai a record successivo |
| `lastRecord` | Vai a ultimo record |
| `goToRecord` | Vai a record specifico (idx) |

### gnr.formstores.Hierarchical

Store per strutture ad albero.

```javascript
// Estende Collection
// Supporta parent/children relationships
// Usato per strutture gerarchiche
```

## Pattern Importanti

### Change Logger

```javascript
// Traccia tutte le modifiche per undo/redo e server
changesLogger: {
    'field1': {oldValue: 'a', newValue: 'b'},
    'field2': {oldValue: 1, newValue: 2}
}

// Metodo per ottenere modifiche come Bag
getFormChanges: function() {
    var changes = new gnr.GnrBag();
    for (var field in this.changesLogger) {
        changes.setItem(field, this.changesLogger[field].newValue);
    }
    return changes;
}
```

### Record Cluster Pattern

```javascript
// Formato per save su server
getFormCluster: function() {
    return {
        pkey: this.getCurrentPkey(),
        recordBag: this.getFormData(),
        changesBag: this.getFormChanges(),
        isNew: this.isNewRecord()
    };
}
```

### Form Lifecycle Events

```javascript
// Eventi pubblicati durante lifecycle
'onLoading'     // Prima del caricamento
'onLoaded'      // Dopo caricamento
'onSaving'      // Prima del salvataggio
'onSaved'       // Dopo salvataggio
'onDeleting'    // Prima dell'eliminazione
'onDeleted'     // Dopo eliminazione
'onAbort'       // Su annullamento
```

### Widget Registration

```javascript
// Widget si registra nel form
registerWidget: function(sourceNode, wdg) {
    this._register[sourceNode._id] = sourceNode;
    if (!this._firstField) {
        this._firstField = sourceNode;
    }
    // Configura validazione
    this.setupValidation(sourceNode, wdg);
}
```

### Status Management

```javascript
// Stati del form
status: 'edit'      // Normale editing
status: 'readOnly'  // Solo lettura
status: 'locked'    // Bloccato

// Stati operazione
opStatus: null      // Idle
opStatus: 'loading' // In caricamento
opStatus: 'saving'  // In salvataggio
opStatus: 'saved'   // Appena salvato
opStatus: 'deleted' // Appena eliminato
```

### Copy/Paste con Clipboard API

```javascript
// Copia record in clipboard browser
copyInClipboard: function() {
    var local_clipboard = this.getControllerData('clipboard');
    let envelope = new gnr.GnrBag();
    envelope.addItem(genro.pageHash + '_' + this.formId, local_clipboard);
    navigator.clipboard.writeText(envelope.toXml());
}

// Incolla da clipboard browser
updateFromClipboard: function() {
    navigator.clipboard.readText().then(function(txt) {
        var envelope = new gnr.GnrBag(txt);
        // ... processa clipboard
    });
}
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è UI-specific per form Genro, non direttamente rilevante per genro-bag-js core.

### Concetti Utili

- Pattern change tracking con logger
- Validazione modulare con validators separati
- Form stores come layer di astrazione
- Clipboard usando XML serialization di Bag

### Da NON Portare

- Gestione form UI (specifico Genro)
- Widget registration (dipende da DOM)
- Form stores (specifici per database Genro)
- Integrazione con genro global

### Pattern Interessanti

- **Change Logger**: Tracciamento modifiche atomico
- **Validation System**: Validatori componibili
- **Store Abstraction**: Diversi backend (memory, DB, document)
- **Clipboard via Bag.toXml()**: Serializzazione per interoperabilità

## Note

1. **Form ID**: Ogni form ha ID unico, usato per namespace in genro._data
2. **Controller**: Path separato per stato form vs dati record
3. **Deferred**: Usa Dojo Deferred per operazioni async
4. **autoSave**: Supporto per salvataggio automatico su blur
5. **gridEditors**: Integrazione con editing inline nelle grid associate

## File Correlati

- `genro_wdg.js` - Widget handler (gnr.wdg)
- `genro_widgets.js` - Widget definitions
- `genro_grid.js` - Grid con editor inline
- `genro_dlg.js` - Dialogs per conferme
- `gnrbag.js` - GnrBag per dati
