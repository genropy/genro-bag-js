# genro_cordova.js - Summary

**File**: `genro_cordova.js`
**Linee**: ~132
**Dimensione**: 6 KB
**Ultima modifica**: Legacy code

## Scopo

Handler per integrazione con Apache Cordova. Fornisce supporto per app native ibride, gestione push notification, universal links, e informazioni dispositivo.

## Dipendenze

- Dojo framework (`dojo.declare`)
- `genro` (oggetto globale applicazione)
- Cordova framework (caricato dinamicamente)
- Plugin Cordova: `device`, `universalLinks`, `PushNotification`

## Classe Principale

### `gnr.GnrCordovaHandler`

```javascript
dojo.declare("gnr.GnrCordovaHandler", null, {
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
| `initialize()` | Carica Cordova JS in base alla piattaforma |
| `loadCounterpart()` | Carica JS nativo counterpart |
| `onDeviceReady()` | Callback quando Cordova è pronto |

## Inizializzazione

```javascript
initialize: function() {
    if(!this.application.getParentGenro()) {
        document.addEventListener('deviceready', function() {
            genro.cordova.onDeviceReady();
        }, false);

        let CORDOVA_JS_URL = "https://localhost/cordova.js";
        let COUNTERPART_JS_URL = "https://localhost/js/genro_app_counterpart.js";

        // iOS usa schema diverso
        if(navigator.userAgent.includes("GnriOS")) {
            CORDOVA_JS_URL = "/_cordova_asset/ios/cordova.js";
            COUNTERPART_JS_URL = '/_cordova_asset/ios/genro_app_counterpart.js';
        }

        genro.dom.loadResource(CORDOVA_JS_URL);
    }
}
```

## Device Ready Handler

```javascript
onDeviceReady: function() {
    console.log("CORDOVA JS LOAD COMPLETED");
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    genro.cordova_ready = true;
    genro.setData("gnr.cordova.platform", cordova.platformId);
    genro.setData("gnr.cordova.version", cordova.version);
    genro.setData("gnr.cordova.ready", true);

    // Device info
    if(device) {
        genro.setData("gnr.cordova.device.uuid", device.uuid);
        genro.setData("gnr.cordova.device.model", device.model);
        genro.setData("gnr.cordova.device.manufacturer", device.manufacturer);
    }

    // Universal Links
    if(universalLinks) {
        universalLinks.subscribe(null, function(eventData) {
            // Gestione deep links
        });
    }

    // Push Notifications
    if(PushNotification) {
        // Setup push notifications
    }
}
```

## Universal Links

Gestione dei deep links per aprire l'app da URL esterni:

```javascript
if(universalLinks) {
    universalLinks.subscribe(null, function(eventData) {
        if(genro.framedIndexManager && eventData.params.menucode) {
            let kw = {...eventData.params};
            if(kw.menucode) {
                let menucode = objectPop(kw, 'menucode');
                genro.framedIndexManager.handleExternalMenuCode(
                    menucode,
                    objectExtract(kw, `${menucode}_*`)
                );
                return;
            }
        } else {
            window.open(eventData.url);
        }
    });
}
```

## Push Notifications

Setup completo per Firebase Cloud Messaging:

```javascript
if(PushNotification) {
    genro.notification_obj = PushNotification.init({
        android: {},
        ios: {
            alert: 'true',
            badge: true,
            sound: 'false'
        }
    });

    PushNotification.hasPermission(function(status) {
        console.log("Push Notification Permission", status);
    });

    // Registration token
    genro.notification_obj.on("registration", (data) => {
        console.log("Push Notification registered: ", data);
        genro.setData("gnr.cordova.fcm_push_registration", data);
    });

    // Notification received
    genro.notification_obj.on('notification', (data) => {
        let on_click_url = data.additionalData.on_click_url;

        if(on_click_url) {
            // Invia POST al server per tracciare click
            let bodyData = {
                message_id: data.additionalData.message_id,
                page_id: genro.page_id
            };
            fetch(on_click_url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody
            });
        }

        // Gestione URL nella notifica
        let url = data.additionalData.url;
        if(url && genro.framedIndexManager) {
            let parsedUrl = parseURL(url);
            let kw = {...parsedUrl.params};
            if(kw.menucode) {
                let menucode = objectPop(kw, 'menucode');
                genro.framedIndexManager.handleExternalMenuCode(
                    menucode,
                    objectExtract(kw, `${menucode}_*`)
                );
                return;
            }
        }
        if(url) {
            window.open(url);
        }
    });
}
```

## Dati Disponibili nel DataStore

| Path | Contenuto |
|------|-----------|
| `gnr.cordova.platform` | ID piattaforma (android/ios) |
| `gnr.cordova.version` | Versione Cordova |
| `gnr.cordova.ready` | Boolean: Cordova pronto |
| `gnr.cordova.device.uuid` | UUID dispositivo |
| `gnr.cordova.device.model` | Modello dispositivo |
| `gnr.cordova.device.manufacturer` | Produttore |
| `gnr.cordova.fcm_push_registration` | Token FCM |

## Counterpart Loading

```javascript
loadCounterpart: function() {
    let COUNTERPART_JS_URL = "https://localhost/js/genro_app_counterpart.js";
    if(navigator.userAgent.includes("GnriOS")) {
        COUNTERPART_JS_URL = '/_cordova_asset/ios/genro_app_counterpart.js';
    }
    return genro.dom.loadResource(COUNTERPART_JS_URL).then(() => {
        console.log('COUNTERPART_JS_URL loaded');
        console.log('testmethod', window.counterpart_test());
    });
}
```

## Pattern Utilizzati

1. **Device Detection**: User-agent per iOS vs Android
2. **Event-Driven**: Callback su deviceready
3. **Plugin Integration**: Cordova plugins API
4. **Deep Linking**: Universal links handling

## Piattaforme Supportate

| Piattaforma | User Agent Check | URL Cordova |
|-------------|------------------|-------------|
| Android | default | `https://localhost/cordova.js` |
| iOS | `GnriOS` | `/_cordova_asset/ios/cordova.js` |

## Rilevanza per genro-bag-js

⭐ Bassa

**Motivazione**:
- Specifico per app native Cordova
- Non rilevante per applicazioni web pure
- Pattern di integrazione plugin utile come riferimento

**Da considerare**:
- Pattern per deep linking
- Gestione push notifications
- Device detection

## Note

1. **Firebase Cloud Messaging**: Supporto push notifications
2. **Universal Links**: Deep linking per iOS/Android
3. **Device Plugin**: Accesso a info hardware
4. **Counterpart JS**: Codice nativo JavaScript per funzionalità specifiche
5. **Platform-Specific URLs**: iOS richiede schema diverso per asset locali
