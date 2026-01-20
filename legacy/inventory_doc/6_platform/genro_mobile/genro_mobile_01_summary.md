# genro_mobile.js - Summary

**File**: `genro_mobile.js`
**Linee**: ~245
**Dimensione**: 10 KB
**Ultima modifica**: Legacy code

## Scopo

Handler per dispositivi mobili/touch. Fornisce supporto per gesture touch, adattamenti UI per schermi piccoli, e patch per widget Dojo per funzionare con eventi touch.

## Dipendenze

- Dojo framework (`dojo.declare`, `dojo.addClass`, `dojo.connect`)
- `genro` (oggetto globale applicazione)
- Hammer.js (libreria gesture opzionale)
- Cordova (opzionale, per app native)

## Classe Principale

### `gnr.GnrMobileHandler`

```javascript
dojo.declare("gnr.GnrMobileHandler", null, {
    constructor: function(application) {
        this.application = application;
        // Applica patch automaticamente
        for(var k in this) {
            if(stringStartsWith(k, 'patch_')) {
                this[k]();
            }
        }
        this.initialize();
    }
});
```

## Metodi Principali

| Metodo | Descrizione |
|--------|-------------|
| `initialize()` | Setup iniziale, classi CSS, event listeners |
| `startHammer(domNode)` | Inizializza Hammer.js per gesture |
| `handleMobileEvent(ev)` | Handler centrale per eventi touch |
| `touchEventString(e)` | Debug: converte evento in stringa |
| `patch_splitter()` | Patch BorderContainer splitter per touch |
| `patch_moveable()` | Patch dojo.dnd.Moveable per touch |

## Inizializzazione

```javascript
initialize: function() {
    // Aggiunge classi CSS per styling mobile
    dojo.addClass(document.body, 'touchDevice');
    dojo.addClass(document.body, 'bodySize_' + genro.deviceScreenSize);

    // Previene double-tap zoom
    this.lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        var now = (new Date()).getTime();
        if (now - genro.mobile.lastTouchEnd <= 300) {
            event.preventDefault();
        }
        genro.mobile.lastTouchEnd = now;
    }, false);

    // Cordova InAppBrowser override
    if(window.cordova) {
        document.addEventListener("deviceready", onDeviceReady, false);
        function onDeviceReady() {
            window.open = cordova.InAppBrowser.open;
        }
    }

    // Gestione orientamento
    document.body.onorientationchange = function(e) {
        genro.setData('touch.orientation', window.orientation);
    };
}
```

## Integrazione Hammer.js

```javascript
startHammer: function(domNode) {
    this.hammertime = new Hammer(domNode);

    this.hammertime.on('tap', function(ev) {
        genro.mobile.handleMobileEvent(ev);
    });
    this.hammertime.on('doubletap', function(ev) {
        genro.mobile.handleMobileEvent(ev);
    });
    this.hammertime.on('press', function(ev) {
        genro.mobile.handleMobileEvent(ev);
    });
    this.hammertime.on('swipe', function(ev) {
        genro.mobile.handleMobileEvent(ev);
    });
}
```

## Gestione Eventi Mobile

```javascript
handleMobileEvent: function(ev) {
    var info = genro.dom.getEventInfo(ev);
    if(!info || !info.sourceNode) {
        return;
    }
    // Pubblica evento sul nodo sorgente
    info.sourceNode.publish(info.event.type, info);
    // Pubblica evento globale
    genro.publish('mobile_' + info.event.type, info);
}
```

## Patch Splitter (Touch)

Patch complessa per rendere il BorderContainer splitter funzionante con touch:

```javascript
patch_splitter: function() {
    dojo.require("dijit.layout.BorderContainer");

    // Sostituisce onmousedown con ontouchstart
    dijit.layout._Splitter.prototype.templateString =
        dijit.layout._Splitter.prototype.templateString
            .replace('onmousedown', 'ontouchstart');

    // Override _startDrag per touch events
    dijit.layout._Splitter.prototype._startDrag = function(e) {
        // ... gestione drag con touch
        this._handlers = (this._handlers || []).concat([
            dojo.connect(de, "ontouchmove", this._drag = function(e, forceResize) {
                // ... calcolo movimento
            }),
            dojo.connect(de, "ontouchend", this, "_stopDrag")
        ]);
    };
}
```

## Patch Moveable (Touch)

Patch per rendere dojo.dnd.Moveable funzionante con touch:

```javascript
patch_moveable: function() {
    dojo.require("dojo.dnd.Moveable");
    var pr = dojo.dnd.Moveable.prototype;

    pr._constructor = function(node, params) {
        // Sostituisce mouse events con touch events
        this.events = [
            dojo.connect(this.handle, "ontouchstart", this, "onMouseDown"),
            // ...
        ];
    };

    pr.onMouseDown = function(e) {
        if(this.delay) {
            this.events.push(dojo.connect(this.handle, "ontouchmove", this, "onMouseMove"));
            this.events.push(dojo.connect(this.handle, "ontouchend", this, "onMouseUp"));
        }
        // ...
    };

    // Patch anche per Mover
    dojo.require("dojo.dnd.Mover");
    var pr = dojo.dnd.Mover.prototype;
    pr._constructor = function(node, e, host) {
        this.events = [
            dojo.connect(d, "ontouchmove", this, "onMouseMove"),
            dojo.connect(d, "ontouchend", this, "onMouseUp"),
            // ...
        ];
    };
}
```

## Gesture Supportate (Hammer.js)

| Gesture | Evento | Descrizione |
|---------|--------|-------------|
| `tap` | `mobile_tap` | Tocco singolo |
| `doubletap` | `mobile_doubletap` | Doppio tocco |
| `press` | `mobile_press` | Pressione prolungata |
| `swipe` | `mobile_swipe` | Swipe in qualsiasi direzione |

## CSS Classes Aggiunte

| Classe | Condizione |
|--------|------------|
| `touchDevice` | Sempre su dispositivi touch |
| `bodySize_phone` | Schermo piccolo |
| `bodySize_tablet` | Schermo medio |
| `bodySize_desktop` | Schermo grande |

## Pattern Utilizzati

1. **Monkey Patching**: Override metodi Dojo per touch
2. **Event Delegation**: Handler centrale per tutti gli eventi
3. **Pub/Sub**: Eventi pubblicati per consumo da widget
4. **Feature Detection**: Controllo Cordova/touch disponibili

## Rilevanza per genro-bag-js

⭐ Bassa

**Motivazione**:
- Specifico per Dojo widget patching
- Hammer.js è una scelta valida ma non core
- Pattern di gestione eventi utile come riferimento

**Da considerare**:
- Pattern pub/sub per eventi touch
- Gestione orientamento schermo
- Prevenzione double-tap zoom

## Note

1. **Hammer.js**: Libreria esterna per gesture recognition
2. **Cordova Integration**: Supporto per app ibride
3. **Double-tap Prevention**: Fix per zoom accidentale su mobile
4. **Orientation Handling**: Reattività a cambi orientamento
