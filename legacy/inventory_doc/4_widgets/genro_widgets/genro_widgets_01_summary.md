# genro_widgets.js - Summary

**File**: `genro_widgets.js`
**Linee**: 6030
**Dimensione**: 240 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Definisce tutti gli handler dei widget usati dal sistema Genro. Ogni widget è un handler che definisce come creare, inizializzare e gestire un tipo specifico di elemento UI. Include widget HTML base, wrapper per widget Dojo, e widget specializzati Genro.

**Classi base:**
- `gnr.widgets.baseHtml` - Base per elementi HTML puri
- `gnr.widgets.baseDojo` - Base per widget Dojo/Dijit

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dojo.require`, `dijit.*`, `dojox.*`
- **gnr.GnrBag**: Container dati
- **genro**: Global application object
- **gnrlang.js**: Utility functions

## Classi Base

### gnr.widgets.baseHtml

Base per elementi HTML semplici (div, span, input, ecc.).

| Proprietà | Descrizione |
|-----------|-------------|
| `_domtag` | Tag DOM da creare |
| `_defaultEvent` | Evento default ('onclick') |
| `_defaultValue` | Valore default ('') |

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `creating` | `(attributes, sourceNode)` | Pre-processing attributi |
| `created` | `(newobj, savedAttrs, sourceNode)` | Post-creazione |
| `onBuilding` | `(sourceNode)` | Hook pre-build |
| `setDisabled` | `(domnode, v)` | Imposta disabled |
| `setReadonly` | `(domnode, v)` | Imposta readonly |
| `setValue` | `(domnode, v)` | Imposta value |

### gnr.widgets.baseDojo

Base per widget Dojo/Dijit.

| Proprietà | Descrizione |
|-----------|-------------|
| `_domtag` | Tag DOM container |
| `_dojotag` | Widget Dojo da istanziare |
| `_attachTo` | Dove collegare il widget |

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `creating` | `(attributes, sourceNode)` | Pre-processing |
| `created` | `(widget, savedAttrs, sourceNode)` | Post-creazione |
| `_afterCreation` | `(widget, savedAttrs, sourceNode)` | Hook finale |
| `mixin_*` | `(...)` | Metodi aggiunti al widget |
| `patch_*` | `(...)` | Metodi che sostituiscono originali |

## Widget Definiti (Selezione)

### Container e Layout

| Widget | Base | Descrizione |
|--------|------|-------------|
| `iframe` | baseHtml | IFrame con comunicazione parent |
| `flexbox` | baseHtml | CSS Flexbox container |
| `gridbox` | baseHtml | CSS Grid container |
| `labeledBox` | baseHtml | Box con label |
| `FloatingPane` | baseDojo | Finestra floating |

### Form Elements

| Widget | Base | Descrizione |
|--------|------|-------------|
| `TextBox` | baseDojo | Input testo |
| `NumberTextBox` | baseDojo | Input numerico |
| `DateTextBox` | baseDojo | Picker data |
| `TimeTextBox` | baseDojo | Picker ora |
| `CheckBox` | baseDojo | Checkbox |
| `RadioButton` | baseDojo | Radio button |
| `SimpleTextarea` | baseHtml | Textarea semplice |
| `Textarea` | baseDojo | Textarea Dijit |

### Selection Widgets

| Widget | Base | Descrizione |
|--------|------|-------------|
| `Select` | baseDojo | Select dropdown |
| `FilteringSelect` | baseDojo | Select con autocomplete |
| `ComboBox` | baseDojo | Combo editabile |
| `dbSelect` | FilteringSelect | Select da database |
| `dbComboBox` | ComboBox | Combo da database |

### Menu e Navigazione

| Widget | Base | Descrizione |
|--------|------|-------------|
| `Menu` | baseDojo | Menu contestuale |
| `PopupMenu` | baseDojo | Menu popup |
| `MenuBar` | baseDojo | Barra menu |
| `DropDownButton` | baseDojo | Button con dropdown |
| `Tooltip` | baseDojo | Tooltip |
| `TooltipDialog` | baseDojo | Dialog in tooltip |

### Button e Actions

| Widget | Base | Descrizione |
|--------|------|-------------|
| `Button` | baseDojo | Button standard |
| `ToggleButton` | baseDojo | Button toggle |
| `ComboButton` | baseDojo | Button con dropdown |

### Tree e List

| Widget | Base | Descrizione |
|--------|------|-------------|
| `Tree` | baseDojo | Albero navigabile |
| `treeContextMenu` | - | Menu contestuale tree |
| `virtualTreeStore` | - | Store virtuale per tree |

### Special Widgets

| Widget | Base | Descrizione |
|--------|------|-------------|
| `Calendar` | baseDojo | Calendario |
| `ColorPalette` | baseDojo | Palette colori |
| `Editor` | baseDojo | Editor WYSIWYG |
| `ProgressBar` | baseDojo | Barra progresso |
| `Slider` | baseDojo | Slider value |
| `TitlePane` | baseDojo | Pannello collassabile |

### Media e Upload

| Widget | Base | Descrizione |
|--------|------|-------------|
| `img` | uploadable | Immagine con upload |
| `uploadable` | baseHtml | Base per upload |
| `fileInput` | baseDojo | Input file |
| `fileUploader` | baseDojo | Uploader con progress |

### Maps

| Widget | Base | Descrizione |
|--------|------|-------------|
| `StaticMap` | baseHtml | Google Static Map |
| `GoogleMap` | baseHtml | Google Maps interattiva |

## Pattern Importanti

### Widget Handler Pattern

```javascript
dojo.declare("gnr.widgets.MyWidget", gnr.widgets.baseDojo, {
    constructor: function(application) {
        this._domtag = 'div';
        this._dojotag = 'dijit.MyWidget';
    },

    creating: function(attributes, sourceNode) {
        // Pre-processing: estrai e salva attributi speciali
        var savedAttrs = objectExtract(attributes, 'special_*');
        // Modifica attributes per Dojo
        return savedAttrs;
    },

    created: function(widget, savedAttrs, sourceNode) {
        // Post-processing: usa savedAttrs
        widget.specialHandler = savedAttrs.handler;
    },

    // Mixin aggiunge metodo al widget
    mixin_myMethod: function() {
        // 'this' è il widget Dojo
    },

    // Setter per attributi dinamici
    setMyAttr: function(domnode, value) {
        // Gestisce cambio attributo
    }
});
```

### Data Binding in Creating

```javascript
creating: function(attributes, sourceNode) {
    // Estrai attributi con ^ prefix (binding)
    if (attributes.value && attributes.value.slice(0,1) == '^') {
        this._default_binding_path = attributes.value.slice(1);
    }

    // Estrai attributi per uso futuro
    var savedAttrs = objectExtract(attributes, 'remote_*,action_*');

    return savedAttrs;
}
```

### Remote Store Pattern (dbSelect)

```javascript
dojo.declare("gnr.widgets.dbSelect", gnr.widgets.FilteringSelect, {
    creating: function(attributes, sourceNode) {
        var savedAttrs = objectExtract(attributes, 'dbtable,columns,auxColumns,...');

        // Crea resolver per caricamento dati
        var resolverKw = {
            method: '_table.recordCaption',
            dbtable: savedAttrs.dbtable,
            // ...
        };

        // Store bag con resolver remoto
        sourceNode._dbSelectStore = new gnr.GnrBag();
        sourceNode._dbSelectResolver = resolverKw;

        return savedAttrs;
    }
});
```

### Iframe Communication

```javascript
// Parent → Child
var childGenro = sourceNode.domNode.contentWindow.genro;
childGenro.setData('path', value);

// Child → Parent
var parentGenro = window.parent.genro;
parentGenro.publish('myEvent', {data: value});

// In iframe widget:
mixin_externalPublish: function(topic, kw) {
    genro.getParentGenro().publish(topic, kw);
}
```

### Uploadable Image Pattern

```javascript
dojo.declare("gnr.widgets.uploadable", gnr.widgets.baseHtml, {
    // Gestisce drag&drop, paste, upload button
    // Supporta crop, zoom, rotate tramite URL params
    // v_x, v_y: offset
    // v_z: zoom
    // v_r: rotate

    decodeUrl: function(sourceNode, url) {
        // Estrae parametri immagine da URL
    },

    encodeUrl: function(parsedUrl, dropFormatters) {
        // Ricostruisce URL con parametri
    },

    onEditImage: function(sourceNode, e) {
        // Gestisce editing mouse (drag per move, shift+drag per zoom)
    }
});
```

### Flexbox/Gridbox CSS

```javascript
dojo.declare("gnr.widgets.flexbox", gnr.widgets.baseHtml, {
    constructor: function() {
        this._domtag = 'div';
    },
    creating: function(attributes, sourceNode) {
        // Converte attributi in CSS flex
        // fb_direction → flex-direction
        // fb_wrap → flex-wrap
        // fb_justify → justify-content
        // ecc.
    }
});
```

## Attribute Setters

I widget definiscono setter per attributi dinamici:

```javascript
// Pattern: set[AttrName]
setDisabled: function(domnode, v) { ... }
setValue: function(domnode, v) { ... }
setSrc: function(domnode, v) { ... }
setInnerHTML: function(domnode, v) { ... }

// Per widget Dojo con attr prefix
setMap_center: function(domnode, v) { ... }
setMap_zoom: function(domnode, v) { ... }
```

## Widget-Specific Features

### ComboBox/FilteringSelect

- `hasDownArrow`: mostra/nascondi freccia dropdown
- `autocomplete`: abilita autocompletamento
- `store`: Bag per opzioni
- Remote search con `method` + `searchDelay`

### dbSelect/dbComboBox

- `dbtable`: tabella database
- `columns`: colonne da visualizzare
- `auxColumns`: colonne aggiuntive
- `condition`: filtro SQL
- `hasDownArrow`: sempre false, usa popup
- Integrazione con validation

### GoogleMap

- `map_center`: centro mappa (coordinate o indirizzo)
- `map_zoom`: livello zoom
- `map_type`: roadmap/satellite/hybrid/terrain
- `markers`: Bag di marker
- `centerMarker`: marker al centro
- Geocoding automatico indirizzi

## Rilevanza per genro-bag-js

⭐⭐ **MEDIA** - Contiene pattern utili per capire come i widget vengono gestiti, ma il codice specifico non va portato direttamente.

### Da Studiare per Architettura

- Pattern `creating`/`created` per lifecycle widget
- Sistema di mixin/patch per estendere Dojo
- Attribute setters per reattività
- Remote store pattern per dati da server

### Concetti da Portare

- **Widget Handler Registry**: Mapping tag → handler
- **Lifecycle hooks**: creating/created pattern
- **Dynamic attribute setters**: set[AttrName] pattern
- **Store abstraction**: Per data-driven widgets

### Da NON Portare Direttamente

- Dipendenza Dojo/Dijit
- Widget UI specifici
- Google Maps integration
- File upload handling (specifico browser)

## Widget per Categoria

### HTML Pure (baseHtml)
`a`, `div`, `span`, `table`, `tr`, `td`, `th`, `tbody`, `thead`, `form`, `input`, `button`, `img`, `iframe`, `canvas`, `embed`, `audio`, `video`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `fieldset`, `legend`, `label`, `pre`, `code`, `hr`, `br`

### Dojo Layout (baseDojo)
`ContentPane`, `BorderContainer`, `TabContainer`, `StackContainer`, `AccordionContainer`, `SplitContainer`, `LayoutContainer`

### Dojo Form (baseDojo)
`TextBox`, `ValidationTextBox`, `NumberTextBox`, `CurrencyTextBox`, `DateTextBox`, `TimeTextBox`, `NumberSpinner`, `Textarea`, `CheckBox`, `RadioButton`, `Select`, `FilteringSelect`, `ComboBox`, `MultiSelect`

### Genro Specializzati
`dbSelect`, `dbComboBox`, `checkBoxText`, `radioButtonText`, `uploadable`, `img`, `fileInput`, `fileUploader`, `StaticMap`, `GoogleMap`, `flexbox`, `gridbox`

## Note

1. **Registration**: Widget registrati via `gnr.widgets.tagName`
2. **_domtag vs _dojotag**: Elementi HTML vs Widget Dijit
3. **savedAttrs**: Attributi estratti in creating, usati in created
4. **sourceNode**: Riferimento sempre disponibile per context
5. **Dynamic require**: Molti widget fanno `dojo.require()` in creating

## File Correlati

- `genro_wdg.js` - GnrWdgHandler che usa questi handler
- `genro_components.js` - Widget compositi (SlotBar, Frame, ecc.)
- `gnrdomsource.js` - GnrDomSourceNode.build() chiama wdg.create()
- `gnrbag.js` - GnrBag usato per store e dati
