# Architettura Builder → Expander → Compiler

## Concetti Fondamentali

Il sistema si basa su tre componenti distinti che trasformano progressivamente una descrizione dichiarativa in output concreto:

```
BUILDER          EXPANDER           COMPILER
(cosa)    →     (espande)    →     (come)
ricetta         ingredienti         piatto finale
```

---

## 1. Builder - La Ricetta

Il **Builder** crea una descrizione dichiarativa ("ricetta") di COSA vogliamo, senza preoccuparsi di COME realizzarlo.

```python
# Python - Server side
class GUIBuilder(BagBuilderBase):

    @element(sub_tags='button,textfield,panel')
    def window(self, title: str): ...

    @element()
    def button(self, label: str, action: str = None): ...

    @element()
    def besciamella(self, quantità: str): ...  # macro!

# Uso
gui = Bag(builder=GUIBuilder)
win = gui.window('Settings', _name='main')
win.button('Save', action='doSave')
win.button('Cancel', action='doCancel')
win.besciamella('500ml')  # è una macro, non un widget reale
```

**Output del Builder**: Una Bag strutturata (la "ricetta")

```xml
<window title="Settings">
    <button label="Save" action="doSave"/>
    <button label="Cancel" action="doCancel"/>
    <besciamella quantità="500ml"/>
</window>
```

**Caratteristiche del Builder**:
- Definisce il vocabolario (`@element`)
- Valida la struttura (`sub_tags`)
- NON sa come realizzare l'output
- Può essere eseguito ovunque (server Python, browser JS)

---

## 2. Expander - Espansione Macro

L'**Expander** trasforma nodi "macro" o "astratti" in nodi concreti. È opzionale - non tutti i sistemi lo richiedono.

```python
class GUICompiler(BagCompilerBase):

    @expander
    def besciamella(self, node):
        """Espande 'besciamella' nei suoi ingredienti reali."""
        expanded = Bag()
        expanded.farina(quantità="50g")
        expanded.burro(quantità="50g")
        expanded.latte(quantità=node.attr['quantità'])
        return expanded
```

**Prima dell'espansione**:
```xml
<window title="Settings">
    <button label="Save"/>
    <besciamella quantità="500ml"/>
</window>
```

**Dopo l'espansione**:
```xml
<window title="Settings">
    <button label="Save"/>
    <farina quantità="50g"/>
    <burro quantità="50g"/>
    <latte quantità="500ml"/>
</window>
```

**Caratteristiche dell'Expander**:
- Trasforma nodi macro in nodi primitivi
- Crea una NUOVA Bag (non modifica l'originale)
- Può essere ricorsivo (macro che generano macro)
- Tipicamente eseguito lato client (browser)

---

## 3. Compiler - La Realizzazione

Il **Compiler** trasforma i nodi in output concreto. Può produrre:
- **Oggetti** (DOM, widget, connessioni DB)
- **Stringhe** (HTML, Markdown, SQL)

```python
class DOMCompiler(BagCompilerBase):

    @compiler
    def window(self, node, children) -> HTMLElement:
        div = document.createElement('div')
        div.className = 'window'
        div.innerHTML = f'<h1>{node.attr["title"]}</h1>'
        for child in children:
            div.appendChild(child)
        return div

    @compiler
    def button(self, node, children) -> HTMLElement:
        btn = document.createElement('button')
        btn.textContent = node.attr['label']
        btn.onclick = lambda: self.dispatch(node.attr['action'])
        return btn
```

**Caratteristiche del Compiler**:
- Produce output concreto (DOM, HTML, oggetti)
- Riceve i figli già compilati (`children`)
- Conosce il target (PyQt, DOM, Textual, HTML...)
- Eseguito dove serve l'output (browser per DOM)

---

## 4. Flusso Completo: Python + JavaScript

Il caso d'uso principale è: **ricetta in Python, build in browser**.

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Python)                            │
│                                                                 │
│   1. BUILDER                                                    │
│      gui = Bag(builder=GUIBuilder)                             │
│      gui.window('App').button('Click me')                      │
│                                                                 │
│   2. SERIALIZZA                                                 │
│      xml_recipe = gui.to_xml()                                 │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │  HTTP Response / WebSocket
                           │  (XML o JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (JavaScript)                       │
│                                                                 │
│   3. DESERIALIZZA                                               │
│      const bag = Bag.fromXml(xmlRecipe);                       │
│                                                                 │
│   4. EXPANDER (opzionale)                                       │
│      const expanded = compiler.expand(bag);                    │
│      // macro → nodi concreti                                  │
│                                                                 │
│   5. COMPILER                                                   │
│      const dom = compiler.compile(expanded);                   │
│      // nodi → DOM elements                                    │
│                                                                 │
│   6. MOUNT                                                      │
│      document.body.appendChild(dom);                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Perché questa divisione?

| Fase | Dove | Perché |
|------|------|--------|
| **Builder** | Server Python | Logica business, accesso DB, validazione |
| **Serializza** | Server | Trasporto rete |
| **Deserializza** | Browser | Ricostruisce struttura |
| **Expander** | Browser | Espansione context-aware (viewport, device, user prefs) |
| **Compiler** | Browser | Accesso al DOM, eventi, interattività |

---

## 5. Esempio Concreto: Form Dinamico

### Server Python (crea la ricetta)

```python
class FormBuilder(BagBuilderBase):
    @element(sub_tags='field,fieldset,submit')
    def form(self, action: str): ...

    @element(sub_tags='field')
    def fieldset(self, legend: str): ...

    @element()
    def field(self, name: str, type: str = 'text', required: bool = False): ...

    @element()
    def submit(self, label: str): ...

# Controller Python
def user_form():
    form = Bag(builder=FormBuilder)
    f = form.form('/api/users', _name='userForm')

    personal = f.fieldset('Dati Personali')
    personal.field('nome', required=True)
    personal.field('cognome', required=True)
    personal.field('email', type='email', required=True)

    f.submit('Salva')

    return form.to_xml()
```

### Trasporto (XML)

```xml
<form action="/api/users">
    <fieldset legend="Dati Personali">
        <field name="nome" type="text" required="true"/>
        <field name="cognome" type="text" required="true"/>
        <field name="email" type="email" required="true"/>
    </fieldset>
    <submit label="Salva"/>
</form>
```

### Browser JavaScript (build DOM)

```typescript
class FormCompiler extends BagCompilerBase {

    @compiler
    form(node: BagNode, children: HTMLElement[]): HTMLFormElement {
        const form = document.createElement('form');
        form.action = node.attr.action;
        form.method = 'POST';
        children.forEach(child => form.appendChild(child));
        return form;
    }

    @compiler
    fieldset(node: BagNode, children: HTMLElement[]): HTMLFieldSetElement {
        const fs = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = node.attr.legend;
        fs.appendChild(legend);
        children.forEach(child => fs.appendChild(child));
        return fs;
    }

    @compiler
    field(node: BagNode, children: HTMLElement[]): HTMLDivElement {
        const div = document.createElement('div');
        div.className = 'form-field';

        const label = document.createElement('label');
        label.textContent = node.attr.name;
        label.htmlFor = node.attr.name;

        const input = document.createElement('input');
        input.type = node.attr.type || 'text';
        input.name = node.attr.name;
        input.id = node.attr.name;
        input.required = node.attr.required === 'true';

        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    @compiler
    submit(node: BagNode, children: HTMLElement[]): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.textContent = node.attr.label;
        return btn;
    }
}

// Uso nel browser
const bag = Bag.fromXml(xmlFromServer);
const compiler = new FormCompiler(bag);
const formElement = compiler.compile();
document.getElementById('app').appendChild(formElement);
```

---

## 6. Expander: Casi d'Uso

L'Expander è utile quando:

### 6.1 Componenti Riutilizzabili

```python
# Builder definisce componente astratto
gui.address_widget(prefix='shipping')

# Expander lo espande in campi concreti
@expander
def address_widget(self, node):
    prefix = node.attr['prefix']
    expanded = Bag()
    expanded.field(f'{prefix}_street', label='Via')
    expanded.field(f'{prefix}_city', label='Città')
    expanded.field(f'{prefix}_zip', label='CAP')
    expanded.field(f'{prefix}_country', label='Paese')
    return expanded
```

### 6.2 Espansione Context-Aware (Browser)

```typescript
@expander
responsiveLayout(node: BagNode): Bag {
    const expanded = new Bag();

    if (window.innerWidth < 768) {
        // Mobile: layout verticale
        expanded.vbox();
    } else {
        // Desktop: layout orizzontale
        expanded.hbox();
    }

    return expanded;
}
```

### 6.3 Lazy Loading

```typescript
@expander
async lazyPanel(node: BagNode): Promise<Bag> {
    // Carica contenuto da server
    const content = await fetch(node.attr.src);
    const xml = await content.text();
    return Bag.fromXml(xml);
}
```

---

## 7. Fallback Chain

Quando si compila un nodo, il sistema cerca un handler in ordine:

```
1. @compiler nel Compiler     → metodo specifico per il tag
2. compile_callback           → callback nel decoratore @element (legacy)
3. compile_template           → template string nel decoratore @element
4. _default_compile()         → fallback (es. to_xml del nodo)
```

Esempio:

```python
@element(compile_template='<div class="{tag}">{value}</div>')
def panel(self, title: str): ...
```

Se non c'è `@compiler` per `panel`, usa il template.

---

## 8. Riepilogo

| Componente | Responsabilità | Dove | Output |
|------------|----------------|------|--------|
| **Builder** | Definisce COSA | Server (Python) | Bag (ricetta) |
| **Expander** | Espande macro | Client (JS) | Bag (espansa) |
| **Compiler** | Realizza COME | Client (JS) | DOM/HTML/Oggetti |

```
Builder (Python)     Expander (JS)      Compiler (JS)
     │                    │                   │
     ▼                    ▼                   ▼
  Ricetta    ───►    Ingredienti   ───►   Piatto
  (astratta)         (concreti)           (finale)
```

---

## 9. Vantaggi dell'Architettura

1. **Separazione concerns**: Builder non sa del DOM, Compiler non sa del business
2. **Riusabilità**: Stessa ricetta Python → diversi Compiler (DOM, React, PDF)
3. **Testabilità**: Ogni componente testabile isolatamente
4. **Flessibilità**: Expander può adattare al contesto runtime
5. **Performance**: Solo la ricetta viaggia sulla rete, build locale
6. **Type safety**: TypeScript per Compiler, validazione Python per Builder

---

**Ultimo aggiornamento**: 2025-01-20
