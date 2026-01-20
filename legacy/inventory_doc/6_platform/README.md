# 6. Platform - Supporto Piattaforme

Adattamenti per mobile, app native e servizi esterni.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [genro_mobile](genro_mobile/) | ~245 | Touch/mobile support | ⭐ Bassa |
| [genro_cordova](genro_cordova/) | ~132 | App native Cordova | ⭐ Bassa |
| [genro_google](genro_google/) | ~197 | Google Charts integration | ⭐⭐ Media |

## Dipendenze

```
genro_mobile.js   ← patch touch per widget Dojo
    ↓
genro_cordova.js  ← estende mobile per app native

genro_google.js   ← integrazione Google Visualization
```

## Classi Principali

### genro_mobile.js
- `gnr.GnrMobileHandler` - Supporto touch
- Hammer.js per gesture
- Patch splitter/moveable per touch

### genro_cordova.js
- `gnr.GnrCordovaHandler` - Integrazione Cordova
- Push notifications, universal links
- Device info

### genro_google.js
- `gnr.widgets.GoogleChart` - Widget Google Charts
- Conversione Bag → DataTable
- Supporto vari tipi chart

## Rilevanza per genro-bag-js

**Bassa rilevanza per il core, ma pattern utili.**

- `genro_google.js` mostra conversione Bag → formato esterno
- Pattern di lazy loading librerie esterne

## Pattern Chiave

1. **Feature Detection**: Controllo capabilities device
2. **Polyfill Pattern**: Patch per compatibilità
3. **Lazy Loading**: Caricamento librerie on-demand
4. **Data Conversion**: Bag → formato libreria esterna
