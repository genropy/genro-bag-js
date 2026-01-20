# genro_patch.js - Summary

**File**: `genro_patch.js`
**Linee**: ~1423
**Dimensione**: 59 KB
**Ultima modifica**: Legacy code

## Scopo

Modulo che contiene patch e fix per i widget Dojo e altre funzionalità JavaScript. Raccoglie tutte le modifiche e le estensioni necessarie per adattare il comportamento standard di Dojo alle esigenze di Genropy.

## Dipendenze

- Dojo framework (dijit, dojo.dnd, dojo.parser)
- `genro` (oggetto globale applicazione)
- `gnr.GnrBag` (per alcune patch)
- Browser APIs (XMLHttpRequest, FileReader, Blob)

## Struttura Principale

### Oggetto `genropatches`

Oggetto contenitore di tutte le funzioni di patch, applicabili selettivamente:

```javascript
genropatches = {
    places: function() {...},
    forEachError: function() {...},
    indexOfError: function() {...},
    // ... altre patch
}
```

## Patch Principali

| Patch | Target | Descrizione |
|-------|--------|-------------|
| `places` | `dojo.number` | Fix per formattazione numeri (locales) |
| `forEachError` | `Array.prototype` | forEach con try/catch per errori |
| `indexOfError` | `Array.prototype` | indexOf con gestione errori |
| `setStateClass` | `dijit._Widget` | Fix per classi di stato widget |
| `getDocumentWindow` | `dojo.html` | Compatibilità cross-browser per window |
| `sendAsBinary` | `XMLHttpRequest` | Polyfill per sendAsBinary |
| `dojoToJson` | `dojo.toJson` | Serializzazione JSON migliorata per Bag |
| `dnd` | `dojo.dnd` | Patch drag-and-drop |
| `tabContainer` | `dijit.layout.TabContainer` | Gestione tab migliorata |
| `menu` | `dijit.Menu` | Menu contestuali migliorati |
| `comboBox` | `dijit.form.ComboBox` | Fix comportamento combo |
| `borderContainer` | `dijit.layout.BorderContainer` | Fix resize e splitter |
| `tree` | `dijit.Tree` | Gestione alberi migliorata |
| `parseNumbers` | `dojo.parser` | Parsing numeri migliorato |
| `decimalRound` | `Number.prototype` | Arrotondamento decimale |

## Dettaglio Patch Significative

### `places` (Formattazione Numeri)

```javascript
places: function() {
    // Override dojo.number.format per gestire
    // correttamente le cifre decimali
    dojo.number._applyPattern = function(value, pattern, options) {
        // ... implementazione custom
    };
}
```

### `dojoToJson` (Serializzazione Bag)

```javascript
dojoToJson: function() {
    var _dojoToJson = dojo.toJson;
    dojo.toJson = function(it, prettyPrint, _indentStr) {
        if (it instanceof gnr.GnrBag) {
            return it.toJson();
        }
        return _dojoToJson(it, prettyPrint, _indentStr);
    };
}
```

### `sendAsBinary` (Upload Binario)

```javascript
sendAsBinary: function() {
    if (!XMLHttpRequest.prototype.sendAsBinary) {
        XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
            // Polyfill per browser che non supportano sendAsBinary
            var byteArray = new Uint8Array(datastr.length);
            // ...
        };
    }
}
```

### `dnd` (Drag and Drop)

Patch estesa per il sistema drag-and-drop di Dojo:
- Gestione avatar migliorata
- Eventi touch support
- Integrazione con sistema Genropy

### `tabContainer` (Tab Container)

```javascript
tabContainer: function() {
    dojo.extend(dijit.layout.TabContainer, {
        // Metodi aggiuntivi per gestione tab
        closeAllTabs: function() {...},
        closeOtherTabs: function() {...},
        // ...
    });
}
```

### `borderContainer` (Layout)

Fix per BorderContainer:
- Gestione resize corretta
- Splitter touch-friendly
- Persistenza dimensioni pane

### `tree` (Alberi)

Patch per dijit.Tree:
- Espansione/collasso migliorati
- Drag-drop nodi
- Selezione multipla

### `parseNumbers` (Parser)

```javascript
parseNumbers: function() {
    // Fix per parsing di valori numerici
    // in attributi widget
}
```

### `decimalRound` (Arrotondamento)

```javascript
decimalRound: function() {
    Number.prototype.decimalRound = function(decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(this * multiplier) / multiplier;
    };
}
```

## Pattern Utilizzati

1. **Monkey Patching**: Override di metodi esistenti preservando originale
2. **Extension via dojo.extend**: Aggiunta metodi a classi Dojo
3. **Polyfill Pattern**: Implementazione feature mancanti
4. **Decorator Pattern**: Wrapping funzioni per aggiungere comportamento

## Applicazione Patch

Le patch vengono applicate in `genro.js` durante l'inizializzazione:

```javascript
// In genro.js
for (var k in genropatches) {
    genropatches[k]();
}
```

## Rilevanza per genro-bag-js

⭐ Bassa

**Motivazione**:
- La maggior parte delle patch sono specifiche per Dojo
- Il nuovo progetto non userà Dojo
- Alcune utility (decimalRound, parseNumbers) potrebbero essere utili
- La patch `dojoToJson` mostra l'integrazione Bag-JSON

**Da considerare**:
- `decimalRound` - utility generica utile
- Pattern di serializzazione JSON per Bag

## Note

1. **Legacy**: Molte patch risolvono bug di vecchie versioni Dojo
2. **Browser Compatibility**: Alcuni polyfill per browser datati
3. **Touch Support**: Patch per supporto touch aggiunte successivamente
4. **Performance**: Alcune patch ottimizzano performance rendering

## Possibili Problemi

- Dipendenza forte da internals Dojo (può rompersi con aggiornamenti)
- Monkey patching rende debugging difficile
- Alcune patch modificano prototipi nativi (Number, Array)
