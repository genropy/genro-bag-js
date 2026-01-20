# 4. Widgets - Sistema Widget

Infrastruttura widget, definizioni e componenti.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [genro_wdg](genro_wdg/) | ~2300 | Widget handler base | ⭐⭐⭐ Alta |
| [genro_widgets](genro_widgets/) | ~5800 | Definizioni widget | ⭐⭐ Media |
| [genro_components](genro_components/) | ~8500 | Componenti complessi | ⭐⭐ Media |
| [genro_dom](genro_dom/) | ~2000 | DOM utilities | ⭐⭐ Media |
| [genro_extra](genro_extra/) | ~2300 | Widget librerie esterne | ⭐ Bassa |

## Dipendenze

```
genro_wdg.js        ← base handler, registra widget
    ↓
genro_widgets.js    ← definizioni widget singoli
    ↓
genro_components.js ← componenti composti da più widget

genro_dom.js        ← utilities DOM usate da tutti

genro_extra.js      ← integrazioni librerie esterne
```

## Classi Principali

### genro_wdg.js
- `gnr.GnrWdgHandler` - Registrazione e creazione widget
- `gnr.widgets.baseHtml` - Classe base per widget HTML
- `gnr.widgets.baseDojo` - Classe base per widget Dojo

### genro_widgets.js
- Definizioni per: textbox, button, checkbox, select, etc.
- Pattern `creating()`, `created()`, `mixin_*`

### genro_components.js
- Componenti complessi: PalettePane, FramePane, etc.
- Composizione di widget base

### genro_dom.js
- `gnr.GnrDomHandler` - Utilities DOM
- Manipolazione stili, eventi, posizionamento

### genro_extra.js
- Integrazioni: FullCalendar, Chart.js, CKEditor, CodeMirror, etc.

## Rilevanza per genro-bag-js

**genro_wdg.js è il riferimento per il DOMCompiler.**

- Pattern di registrazione widget
- Ciclo vita: creating → created → mixin
- Sistema attributi dinamici

## Pattern Chiave

1. **Widget Registration**: `gnr.widgets.xxx` per ogni tipo
2. **Lifecycle Hooks**: `creating()`, `created()`, `destroying()`
3. **Mixin System**: `mixin_gnr_*` per attributi reattivi
4. **Attribute Extraction**: `objectExtract` per prefissi
