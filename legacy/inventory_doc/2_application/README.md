# 2. Application - Bootstrap e Ciclo Vita

Entry point dell'applicazione, gestione sorgenti e comunicazione server.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [genro](genro/) | ~2100 | Entry point, inizializzazione app | ⭐⭐⭐ Alta |
| [genro_src](genro_src/) | ~600 | Source handler (costruzione albero) | ⭐⭐⭐ Alta |
| [genro_rpc](genro_rpc/) | ~1000 | Comunicazione RPC con server | ⭐⭐ Media |

## Dipendenze

```
genro.js        ← root application, crea tutti gli handler
    ↓
genro_src.js    ← gestisce sourceNode e costruzione DOM
    ↓
genro_rpc.js    ← comunicazione asincrona con server
```

## Classi Principali

### genro.js
- `gnr.GenroClient` - Applicazione principale
- Gestisce: `genro.src`, `genro.rpc`, `genro.dom`, `genro.wdg`, etc.
- DataStore principale: `genro._data`

### genro_src.js
- `gnr.GnrSrcHandler` - Gestione sorgenti
- Costruzione albero DOM da Bag
- Gestione ciclo vita sourceNode

### genro_rpc.js
- `gnr.GnrRpcHandler` - Chiamate RPC
- `genro.serverCall()` - Chiamata sincrona/asincrona
- Resolvers per dati lazy-loaded

## Rilevanza per genro-bag-js

**genro.js e genro_src.js sono riferimenti architetturali importanti.**

- Pattern di inizializzazione applicazione
- Ciclo vita dei sourceNode
- Sistema di costruzione DOM da Bag

## Pattern Chiave

1. **Handler Pattern**: Ogni area funzionale ha un handler dedicato
2. **DataStore Centrale**: `genro._data` come single source of truth
3. **Source Tree**: Albero di sourceNode parallelo al DOM
4. **Lazy Resolution**: Dati caricati on-demand via resolver
