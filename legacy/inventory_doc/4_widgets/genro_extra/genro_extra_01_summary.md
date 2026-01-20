# genro_extra.js - Summary

**File**: `genro_extra.js`
**Linee**: 2336
**Dimensione**: 96 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Raccolta di widget handler per librerie esterne integrate in Genro. Include wrapper per Google Maps Geocoder, FullCalendar, QR Scanner, editor markdown/WYSIWYG (Toast UI, CKEditor, TinyMCE), CodeMirror, Chart.js, e Dygraph.

**Classi definite:**
- `gnr.widgets.GoogleLoader` - Loader asincrono per Google APIs
- `gnr.widgets.fullcalendar` - FullCalendar integration
- `gnr.widgets.qrscanner` - QR Scanner widget
- `gnr.widgets.MDEditor` - Toast UI Markdown Editor
- `gnr.widgets.codemirror` - CodeMirror code editor
- `gnr.widgets.chartjs` - Chart.js charting
- `gnr.widgets.dygraph` - Dygraph time-series charts
- `gnr.widgets.CkEditor` - CKEditor 4 WYSIWYG
- `gnr.widgets.TinyMCE` - TinyMCE WYSIWYG editor

## Dipendenze Esterne

| Libreria | URL/CDN | Scopo |
|----------|---------|-------|
| Google APIs | google.com/jsapi | Maps, Geocoding |
| FullCalendar | /_rsrc/js_libs/fullcalendar/premium | Calendario eventi |
| QR Scanner | /_rsrc/js_libs/qr-scanner | Scansione QR code |
| Toast UI Editor | toast.com CDN | Editor markdown |
| CodeMirror | /_rsrc/js_libs/codemirror | Code editor |
| Chart.js | /_rsrc/js_libs/Chart.js | Grafici |
| Dygraph | /_rsrc/js_libs/dygraph-combined.js | Grafici time-series |
| CKEditor | /_rsrc/js_libs/ckeditor | WYSIWYG editor |
| TinyMCE | /_rsrc/js_libs/tinymce | WYSIWYG editor |

## Widget per Categoria

### Google APIs

#### GoogleLoader

```javascript
dojo.declare("gnr.widgets.GoogleLoader", null, {
    geocoder: {module_name:'maps', version:'3.26', language:navigator.language},

    runCommand: function(module, cb) {
        // Carica modulo Google API se non presente
        if (handler._loaded) {
            cb.call(this);
        } else {
            google.load(module_name, version, {callback: ...});
        }
    },

    setGeocoder: function(widget, cb) {
        // Inizializza geocoder per widget mappa
        this.runCommand(this.geocoder, function(){
            obj.geocoder = new google.maps.Geocoder();
            cb();
        });
    }
});
```

### Calendario

#### fullcalendar

| Metodo | Descrizione |
|--------|-------------|
| `creating` | Estrae attributi calendario |
| `created` | Carica libreria e inizializza |
| `initialize` | Crea FullCalendar.Calendar |
| `readEventStore` | Converte Bag in eventi |
| `mixin_gnr_storepath` | Ricarica eventi su cambio store |

### QR Scanner

#### qrscanner

| Metodo | Descrizione |
|--------|-------------|
| `created` | Import dinamico modulo QR |
| `initialize` | Crea QrScanner con callback |
| `mixin_gnr_start/stop/toggle` | Controllo scanner |

### Editor Markdown

#### MDEditor (Toast UI)

| Metodo | Descrizione |
|--------|-------------|
| `created` | Carica CSS/JS Toast UI |
| `initialize` | Crea editor con plugins |
| `createViewer` | Crea viewer read-only |
| `createEditor` | Crea editor con toolbar |
| `configureToolbar` | Configura toolbar custom |
| `attachHooks` | Collega eventi blur/keydown |
| `setInDatastore` | Salva markdown in datastore |
| `checkMaxLength` | Limita lunghezza contenuto |

**Supporto Bag Mode:**
```javascript
// Se value punta a Bag con text/html:
if (v instanceof gnr.GnrBag) {
    var hasText = (v.getItem('text') !== undefined);
    var hasHtml = (v.getItem('html') !== undefined);
    if (hasText || hasHtml) {
        sourceNode._mdBagPath = valuePath;
        sourceNode._mdInternalHtmlPath = valuePath + '.html';
    }
}
```

### Code Editor

#### codemirror

| Metodo | Descrizione |
|--------|-------------|
| `loadCodeMirror` | Carica libreria base |
| `load_mode` | Carica syntax mode dinamicamente |
| `load_theme` | Carica tema CSS |
| `load_addon` | Carica addon (search, lint) |
| `initialize` | Crea istanza CodeMirror |
| `mixin_gnr_value` | Sync con datastore |
| `mixin_gnr_quoteSelection` | Helper per quote selection |

**Addon Dictionary:**
```javascript
getAddOnDict: function(key) {
    return {
        search: {
            command: 'find',
            js: ['addon/search/search.js', 'addon/search/searchcursor.js'],
            css: ['addon/dialog/dialog.css']
        },
        lint: {
            command: 'lint',
            js: ['jshint.js', 'addon/lint/lint.js', 'addon/lint/javascript-lint.js'],
            css: ['addon/lint/lint.css']
        }
    }[key];
}
```

### Grafici

#### chartjs

| Metodo | Descrizione |
|--------|-------------|
| `creating` | Estrae config grafico |
| `created` | Carica Chart.js e inizializza |
| `makeDataset` | Crea dataset da Bag |
| `autoColors` | Genera colori automatici |
| `mixin_gnr_updateChart` | Aggiorna grafico |
| `mixin_gnr_updateOptionsObject` | Aggiorna opzioni dinamiche |

**Auto-Colors Pattern:**
```javascript
autoColors: function(dataset) {
    var colorParNames = ['backgroundColor:0.7', 'borderColor:1', ...];
    colorParNames.forEach(function(n) {
        if(dataset[n[0]] == '*') {
            dataset[n[0]] = [];
            result[n[0]] = n[1];  // alpha
        }
    });
    // Durante makeDataset:
    var autocol = chroma(stringToColour(caption));
    dataset[k].push(chroma(autocol).alpha(autoColorsDict[k]).css());
}
```

#### dygraph

| Metodo | Descrizione |
|--------|-------------|
| `created` | Carica Dygraph e inizializza |
| `getDataFromBag` | Converte Bag in array dati |
| `mixin_gnr_data` | Aggiorna dati |
| `mixin_gnr_options` | Aggiorna opzioni |

### Editor WYSIWYG

#### CkEditor (CKEditor 4)

| Metodo | Descrizione |
|--------|-------------|
| `creating` | Configura toolbar, stili |
| `created` | Carica CKEditor e inizializza |
| `makeEditor` | Crea istanza CKEDITOR |
| `dialog_table` | Customizza dialog tabella |
| `mixin_gnr_value` | Sync con datastore |
| `mixin_gnr_setReadOnly` | Toggle read-only mode |
| `mixin_gnr_highlightChild` | Evidenzia elemento nel editor |

**Toolbar Presets:**
```javascript
toolbar_dict: {
    'simple': [['Source','-','Bold','Italic','-','NumberedList','BulletedList'],...],
    'standard': [['Source','-','Bold','Italic','...'],['Image','Table',...],...]
}
```

#### TinyMCE (TinyMCE 6)

| Metodo | Descrizione |
|--------|-------------|
| `creating` | Configura opzioni editor |
| `created` | Inizializza con queue globale |
| `queueTinyMCEInit` | Gestisce caricamento seriale |
| `processTinyMCEQueue` | Processa coda inizializzazione |
| `makeEditor` | Configura e crea editor |
| `mixin_gnr_value` | Sync con datastore |
| `mixin_gnr_setDisabled` | Toggle disabled state |

**Global Queue Pattern:**
```javascript
// Evita conflitti inizializzazione multipla
if (!window._gnr_tinymce_init_queue) {
    window._gnr_tinymce_init_queue = [];
    window._gnr_tinymce_loading = false;
    window._gnr_tinymce_processing = false;
}

processTinyMCEQueue: function() {
    if (window._gnr_tinymce_processing) return;
    window._gnr_tinymce_processing = true;
    var callback = window._gnr_tinymce_init_queue.shift();
    try { callback(); } catch(e) {}
    setTimeout(function() {
        window._gnr_tinymce_processing = false;
        this.processTinyMCEQueue();
    }.bind(this), 50);
}
```

## Pattern Comuni

### Lazy Loading Librerie

```javascript
created: function(widget, savedAttrs, sourceNode) {
    var that = this;
    var cb = function() {
        that.initialize(widget, savedAttrs, sourceNode);
    };
    if (!window.ExternalLibrary) {
        genro.dom.loadJs('path/to/library.js', cb);
    } else {
        cb();
    }
}
```

### External Widget Integration

```javascript
initialize: function(widget, attrs, sourceNode) {
    var externalWidget = new ExternalLibrary(widget, attrs);

    // Collega a sourceNode
    sourceNode.externalWidget = externalWidget;
    externalWidget.sourceNode = sourceNode;
    externalWidget.gnr = this;

    // Copia mixin methods
    for (var prop in this) {
        if (prop.indexOf('mixin_') === 0) {
            externalWidget[prop.replace('mixin_', '')] = this[prop];
        }
    }
}
```

### Change Detection Pattern

```javascript
// Per evitare salvataggio su caricamento iniziale:
var changeListenerActive = false;
var originalNormalizedContent = null;

// Dopo inizializzazione:
setTimeout(function() {
    originalNormalizedContent = normalizeContent(editor.getContent());

    // Attiva listener solo su interazione utente
    editor.once('keydown', function() {
        changeListenerActive = true;
    });
}, 100);

// Su blur:
if (changeListenerActive) {
    var current = normalizeContent(editor.getContent());
    if (current !== originalNormalizedContent) {
        saveToDatastore();
        originalNormalizedContent = current;
    }
}
```

### Bag to Data Conversion

```javascript
// FullCalendar events
readEventStore: function(sourceNode, info, successCallback) {
    var store = sourceNode.getRelativeData(sourceNode.attr.storepath);
    var events = [];
    store.getNodes().forEach(function(n) {
        let row = objectUpdate({}, n.attr);
        let v = n.getValue();
        if (v) { objectUpdate(row, v.asDict()); }
        if (row.start && row.end) { events.push(row); }
    });
    successCallback(events);
}

// Chart.js dataset
store.walk(function(n) {
    var row = isBagMode ? n.getValue('static').asDict() : n.attr;
    dataset.data.push(row[field]);
}, 'static');
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è specifico per integrazione librerie esterne UI, non rilevante per genro-bag-js core.

### Concetti Utili

- Pattern caricamento lazy librerie esterne
- Conversione Bag → formati specifici libreria (eventi, dati chart)
- Pattern externalWidget per widget non-Dojo
- Change detection per evitare false modifiche

### Da NON Portare

- Integrazione specifica con librerie (FullCalendar, Chart.js, ecc.)
- Google APIs integration
- WYSIWYG editors (CKEditor, TinyMCE)
- CodeMirror integration

### Pattern Interessanti

- **Lazy Loading**: Caricamento on-demand librerie pesanti
- **Queue Pattern**: Serializzazione inizializzazione (TinyMCE)
- **External Widget**: Pattern per widget non-Dojo
- **Bag Conversion**: Metodi per convertire Bag in formati specifici

## Note

1. **GoogleLoader**: Singleton per caricare API Google
2. **externalWidget**: Convenzione per widget esterni (non Dojo)
3. **Bag Mode**: Alcuni editor supportano storage Bag con text/html separate
4. **maxLength**: Supporto limite caratteri con counter visuale
5. **Upload Handler**: TinyMCE/CKEditor supportano upload immagini

## File Correlati

- `genro_widgets.js` - Widget Dojo standard
- `genro_wdg.js` - Widget factory
- `gnrbag.js` - GnrBag per dati
- `genro_dom.js` - loadJs, loadCss utilities
