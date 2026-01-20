# 5. UI - Interfacce Specializzate

Widget UI complessi: form, grid, tree, dialog.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [genro_frm](genro_frm/) | ~3000 | Form handling | ⭐⭐ Media |
| [genro_grid](genro_grid/) | ~5000 | Grid system | ⭐⭐ Media |
| [genro_tree](genro_tree/) | ~970 | Tree widgets | ⭐⭐ Media |
| [genro_dlg](genro_dlg/) | ~1350 | Dialogs | ⭐⭐ Media |

## Dipendenze

```
genro_frm.js   ← form con validazione, field types

genro_grid.js  ← grid con virtualizzazione, editing

genro_tree.js  ← alberi con drag-drop, checkbox

genro_dlg.js   ← dialog, alert, prompt, palette
```

## Classi Principali

### genro_frm.js
- `gnr.GnrFormHandler` - Gestione form
- Validazione, field linking, dirty state
- FormBuilder per costruzione dinamica

### genro_grid.js
- `gnr.GnrGridHandler` - Gestione grid
- Virtualizzazione righe per performance
- Editing inline, selezione, sorting

### genro_tree.js
- `gnr.widgets.Tree` - Widget tree
- `gnr.GnrStoreBag` integrato
- Checkbox tree, lazy loading

### genro_dlg.js
- `gnr.GnrDlgHandler` - Dialog e messaggi
- Alert, confirm, prompt
- Palette, floating panes

## Rilevanza per genro-bag-js

**Pattern UI utili come riferimento per future estensioni.**

- Grid virtualization pattern
- Form validation pattern
- Tree data binding

## Pattern Chiave

1. **Virtual Scrolling**: Grid carica solo righe visibili
2. **Dirty Tracking**: Form traccia modifiche
3. **Lazy Loading**: Tree carica figli on-demand
4. **Modal System**: Dialog con stack e focus trap
