# genro_dom.js - Summary

**File**: `genro_dom.js`
**Linee**: 2081
**Dimensione**: 82 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per operazioni DOM: manipolazione stili, classi CSS, drag & drop, caricamento risorse esterne (CSS/JS), effetti visuali, clipboard, stampa, e utility varie per il DOM.

**Classe definita:**
- `gnr.GnrDomHandler` - DOM utility handler (`genro.dom`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.style`, `dojo.addClass`, `dojo.removeClass`, `dojo.coords`, `dojo.fx`, `dijit.getEnclosingWidget`
- **gnr.GnrBag**: Per conversione stili in Bag
- **genro**: Global application object
- **gnrlang.js**: Utility functions

## Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento a genro |
| `pendingHeaders` | Header in attesa di caricamento |
| `css3AttrNames` | Attributi CSS3 supportati |
| `styleAttrNames` | Attributi stile riconosciuti |
| `css_selectors` | Cache selettori CSS |

## Categorie di Metodi

### Resource Loading

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `loadCss` | `(url, title, cb, avoidCache)` | Carica stylesheet |
| `loadJs` | `(url, cb, avoidCache)` | Carica JavaScript |
| `loadResource` | `async (url, noCache)` | Carica risorsa (async/Promise) |
| `addPlugin` | `async (plugin, cb)` | Carica plugin Genro |
| `loadExternal` | `(urlList, avoidCache)` | Carica lista risorse |
| `addHeaders` | `(headers, cb)` | Aggiunge header (script/link) |
| `addStyleSheet` | `(cssText, title)` | Aggiunge CSS inline |

### Class Manipulation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `addClass` | `(where, cls)` | Aggiunge classe(i) |
| `removeClass` | `(where, cls)` | Rimuove classe(i) |
| `setClass` | `(where, cls, set)` | Add/remove/toggle |
| `toggleClass` | `(where, cls)` | Toggle classe |
| `bodyClass` | `(cls, set)` | Classe su body |

### Style Manipulation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `style` | `(where, attr, value)` | Imposta stile |
| `getStyleDict` | `(attributes, noConvert)` | Estrae stili da attributi |
| `dojoStyleAttrName` | `(attr)` | Converte nome (under_score → camelCase) |
| `isStyleAttr` | `(name)` | Verifica se è attributo stile |
| `css3style_*` | `(value, dict, styledict)` | Gestori CSS3 specifici |
| `normalizedRoundedCorners` | `(rounded, dict)` | Normalizza border-radius |

### CSS3 Style Handlers

| Metodo | Descrizione |
|--------|-------------|
| `css3style_rounded` | Border radius |
| `css3style_gradient` | Gradienti |
| `css3style_shadow` | Box shadow |
| `css3style_transform` | Trasformazioni |
| `css3style_transition` | Transizioni |
| `css3style_zoom` | Zoom |
| `css3style_filter` | Filtri CSS |

### DOM Navigation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getDomNode` | `(where)` | Ottiene DOM node da varie sorgenti |
| `getSourceNode` | `(domnode)` | Ottiene sourceNode |
| `getBaseSourceNode` | `(domnode)` | Risale fino a sourceNode |
| `getBaseWidget` | `(domnode)` | Ottiene widget base |
| `getEventInfo` | `(event)` | Info complete su evento |

### Drag & Drop

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `onDragStart` | `(event)` | Handler inizio drag |
| `onDragOver` | `(event)` | Handler drag over |
| `onDragEnter` | `(event)` | Handler enter |
| `onDragLeave` | `(event)` | Handler leave |
| `onDrop` | `(event)` | Handler drop |
| `onDragEnd` | `(event)` | Handler fine drag |
| `canBeDropped` | `(dataTransfer, sourceNode)` | Verifica drop valido |
| `getDragDropInfo` | `(event)` | Info complete drag/drop |
| `setDragSourceInfo` | `(dragInfo, dragValues, tags)` | Imposta info sorgente |
| `getDragSourceInfo` | `(dataTransfer)` | Ottiene info sorgente |
| `dataTransferTypes` | `(dataTransfer)` | Tipi in dataTransfer |
| `setInDataTransfer` | `(dt, k, v)` | Imposta valore in dt |
| `getFromDataTransfer` | `(dt, k)` | Ottiene valore da dt |
| `outlineShape` | `(shape, canDrop)` | Evidenzia target |
| `onDetach` | `(sourceNode, dropInfo)` | Gestisce detach in floating |
| `onDrop_files` | `(...)` | Handler drop file |
| `onDrop_standard` | `(...)` | Handler drop standard |

### Visual Effects

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `effect` | `(where, effect, kw)` | Applica effetto (fadeIn/Out, wipeIn/Out) |
| `hide` | `(where)` | Nasconde elemento |
| `show` | `(where)` | Mostra elemento |
| `toggleVisible` | `(where, visible)` | Toggle visibilità |
| `disable` | `(where)` | Disabilita |
| `enable` | `(where)` | Abilita |
| `cursorWait` | `(flag)` | Cursore attesa |

### Positioning

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `centerOn` | `(what, where, xRatio, yRatio)` | Centra elemento |
| `sizedOn` | `(what, where)` | Dimensiona come altro elemento |
| `autoSize` | `(widget)` | Auto-dimensiona widget |
| `setAutoScale` | `(domNode, zoomToFit)` | Scala automatica |
| `autoScaleWrapper` | `(newobj, zoomToFit)` | Wrapper con scala auto |

### Visibility Checks

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `isVisible` | `(what)` | Verifica visibilità |
| `isWindowVisible` | `()` | Finestra visibile |
| `isActiveLayer` | `(what)` | Verifica se layer attivo |
| `isElementOverflowing` | `(element)` | Verifica overflow |
| `isDisabled` | `(domNode, inherited)` | Verifica disabled |

### IFrame Utilities

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `iFramePrint` | `(iframe)` | Stampa iframe |
| `iframeContentWindow` | `(iframe)` | Ottiene window iframe |
| `iframeContentDocument` | `(iframe)` | Ottiene document iframe |

### CSS Management

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `addCssRule` | `(rule)` | Aggiunge regola CSS |
| `cssRulesToBag` | `(rules)` | Converte regole in Bag |
| `cssStyleRulesToBag` | `(styleRules)` | Converte style rules in Bag |
| `styleToBag` | `(style)` | Converte style in Bag |
| `styleSheetsToBag` | `(src)` | Tutti fogli stile in Bag |
| `setSelectorStyle` | `(selector, kw, path)` | Modifica stile selettore |
| `getSelectorBag` | `(selector)` | Ottiene Bag selettore |
| `styleTrigger` | `(kw)` | Trigger cambio stile |

### HTML Generation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `html_maker` | `(kw, bagnode)` | Factory HTML |
| `html_checkbox` | `(kw, bagnode)` | Genera checkbox |
| `html_select` | `(kw)` | Genera select |
| `scrollableTable` | `(where, gridbag, kw)` | Tabella scrollabile |
| `jsonTable` | `(data, kw)` | Tabella da JSON |
| `microchart` | `(data, kw, where, clickcb)` | Mini grafico a barre |

### Clipboard

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `copyInClipboard` | `(what)` | Copia in clipboard |
| `setTextInSelection` | `(sourceNode, value)` | Inserisce testo in selezione |

### Printing & Export

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `printElementContent` | `(where, title)` | Stampa contenuto elemento |
| `htmlToCanvas` | `(where, kw)` | Converte HTML in canvas |
| `exportNodeAsPdf` | `(nodeIds, kw)` | Esporta nodi come PDF |
| `detectPdfViewer` | `(src, jsPdfViewer)` | Rileva viewer PDF |

### Miscellaneous

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `windowTitle` | `(title)` | Imposta titolo finestra |
| `parseXmlString` | `(txt)` | Parse XML string |
| `dispatchKey` | `(keycode, domnode)` | Simula tasto |
| `makeHiderLayer` | `(parentId, kw)` | Crea layer di copertura |
| `getEventModifiers` | `(e)` | Ottiene modificatori evento |
| `setDomNodeDisabled` | `(domNode, disabled)` | Imposta disabled |
| `windowMessage` | `(w, message)` | postMessage |
| `setAutoSizer` | `(sourceNode, domNode, cb)` | Monitor dimensioni |
| `preventGestureBackForward` | `(pane)` | Previene gesture swipe |
| `themeAttribute` | `(topic, property, dflt)` | Attributo tema |

## Pattern Importanti

### Style Extraction

```javascript
// Estrae attributi stile da kwargs
var styledict = genro.dom.getStyleDict(attributes);
// attributes: {width: '100px', border: '1px solid', onclick: ...}
// styledict: {width: '100px', border: '1px solid'}
// attributes modificato: {onclick: ...}
```

### CSS3 Style Pattern

```javascript
// Supporto vendor prefix automatico
css3style_transform: function(value, valuedict, styledict, noConvertStyle) {
    var key = dojo.isSafari ? '-webkit-transform' : '-moz-transform';
    var result = '';
    if ('rotate' in valuedict) {
        result += 'rotate(' + valuedict['rotate'] + 'deg) ';
    }
    // ...
    styledict[key] = result;
}
```

### Drag & Drop System

```javascript
// Inizio drag
onDragStart(event) {
    var dragInfo = this.getDragDropInfo(event);
    var dragValues = dragInfo.handler.onDragStart(dragInfo);
    genro.dom.setDragSourceInfo(dragInfo, dragValues, dragTags);
    // ...
}

// Drop
onDrop(event) {
    var dropInfo = this.getDragDropInfo(event);
    if (this.canBeDropped(dataTransfer, sourceNode)) {
        // onDrop_files o onDrop_standard
    }
}
```

### Resource Loading (Promise-based)

```javascript
loadResource: async function(url, noCache) {
    let element;
    const isJs = url.endsWith('.js');
    // ...
    return new Promise((resolve, reject) => {
        element.onload = () => resolve(`Resource loaded: ${url}`);
        element.onerror = () => reject(new Error(`Failed to load`));
        document.head.appendChild(element);
    });
}
```

### Hider Layer Pattern

```javascript
// Crea layer di copertura semi-trasparente
genro.dom.makeHiderLayer('myPane', {
    message: 'Loading...',
    background_color: 'rgba(255,255,255,0.5)'
});
```

## Style Attribute Names

```javascript
styleAttrNames = [
    'height', 'width', 'top', 'left', 'right', 'bottom', 'resize',
    'visibility', 'opacity', 'overflow', 'float', 'clear', 'display',
    'line_height', 'z_index', 'border', 'position', 'padding', 'margin',
    'cursor', 'color', 'white_space', 'vertical_align', 'background',
    'font', 'text', 'gap', 'row_gap', 'column_gap', 'flex', 'grid',
    'grid_template_columns', 'align_content', 'justify_content',
    'align_items', 'justify_items'
    // + css3AttrNames
];

css3AttrNames = [
    'rounded', 'gradient', 'shadow', 'transform',
    'transition', 'zoom', 'filter'
];
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo è un modulo utility DOM specifico per Genro UI, non direttamente rilevante per la libreria Bag core.

### Concetti Utili

- Pattern di estrazione stili da attributi
- Gestione vendor prefix CSS3
- Sistema drag & drop completo
- Resource loading con Promise

### Da NON Portare

- Dipendenza Dojo
- Integrazione con genro global
- Specifiche UI (hider layer, microchart)
- CSS management (specifico browser)

## Note

1. **getDomNode**: Accetta string (nodeId), GnrDomSourceNode, GnrDomSource, o widget
2. **Style conversion**: `under_score` → `camelCase` per Dojo
3. **Vendor prefixes**: Gestiti automaticamente per Safari/Firefox
4. **Async loading**: `loadResource` usa Promise native

## File Correlati

- `gnrdomsource.js` - GnrDomSourceNode usa genro.dom
- `genro_wdg.js` - Widget handler usa getStyleDict
- `genro_dlg.js` - Dialog usa makeHiderLayer
- `genro.js` - Application crea GnrDomHandler
