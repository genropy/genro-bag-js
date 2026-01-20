# 1. Core - Fondamenta

Strutture dati e utilities di base su cui si costruisce tutto il sistema Genropy.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [gnrbag](gnrbag/) | ~2000 | Bag e BagNode - contenitore dati gerarchico | ⭐⭐⭐ Alta |
| [gnrlang](gnrlang/) | ~1700 | Utilities linguaggio JavaScript | ⭐⭐⭐ Alta |
| [gnrdomsource](gnrdomsource/) | ~2000 | GnrDomSource - estensione DOM per Bag | ⭐⭐⭐ Alta |

## Dipendenze

```
gnrlang.js      ← nessuna dipendenza (utilities pure)
    ↓
gnrbag.js       ← usa gnrlang utilities
    ↓
gnrdomsource.js ← estende gnrbag con DOM binding
```

## Classi Principali

### gnrbag.js
- `gnr.GnrBag` - Contenitore dati gerarchico
- `gnr.GnrBagNode` - Nodo singolo della Bag

### gnrlang.js
- Funzioni globali: `objectUpdate`, `objectExtract`, `objectPop`, `funcApply`
- Estensioni String, Array, Date
- Utilities: `convertFromText`, `asTypedValue`

### gnrdomsource.js
- `gnr.GnrDomSource` - Nodo DOM reattivo legato a Bag
- Sistema di trigger e subscription
- Data binding bidirezionale

## Rilevanza per genro-bag-js

**Questi sono i moduli fondamentali da portare in TypeScript.**

- `gnrbag.js` → `src/bag.ts`, `src/bagnode.ts`
- `gnrlang.js` → `src/utils/` (funzioni selezionate)
- `gnrdomsource.js` → `src/domsource.ts` (pattern di binding)

## Pattern Chiave

1. **Hierarchical Data**: Struttura ad albero con path navigation
2. **Reactive Binding**: Trigger su modifiche dati
3. **Attribute System**: Metadata su ogni nodo
4. **XML Serialization**: Import/export XML nativo
