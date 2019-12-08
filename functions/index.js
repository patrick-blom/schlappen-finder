'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {
    dialogflow,
    Permission,
    Suggestions,
} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('DefaultWelcomeIntent', (conv) => {
    if (conv.user.storage.userName) {
        conv.ask(`<speak>Hi ${conv.user.storage.userName}, schön dich zu hören.</speak>`);
    } else {
        conv.ask('<speak>Hi! Ich bin dein Schlappen Finder. Ich kann dir helfen deine Hausschuhe' +
            ' zu finden indem ich dir die Stelle nenne an der du sie ausgezogen hast.</speak>'
        );
    }
    conv.ask('<speak>Möchtest du das ich mir eine Stelle merke oder dir bei deiner Hausschuh-Suche helfe?</speak>');
    conv.ask(new Suggestions('Ja', 'Nein'));
});

// Init the remember postion dialog and ask for the name if not set
app.intent('InitRememberIntent', (conv) => {
    if (conv.user.storage.slipperPosition) {
        conv.ask('<speak>Ich merke gerade, dass du mir vor kurzem schon eine Stelle genannt hast, ' +
            'kann ich die vergessen um Platz zu schaffen?</speak>');
        conv.ask(new Suggestions('Ja', 'Nein'));
    } else {
        if (!conv.user.storage.userName) {
            conv.ask(new Permission({
                context: 'Damit es nächstes mal schneller geht',
                permissions: 'NAME'
            }));
        } else {
            conv.ask('<speak>Okay, dann verrate mir kurz, wo sind deine Hausschuhe gerade?</speak>');
        }
    }
});

// The actual saving process of the slipper postion
app.intent('RememberIntent', (conv, {raum}) => {
    conv.user.storage.slipperPosition = raum;
    conv.close(`<spreak>Das war's auch schon, ich habe mir die Stelle "${conv.user.storage.slipperPosition}" gemerkt.</spreak>`);
});

// delete the old position and continue
app.intent('InitRememberIntent - yes', (conv) => {
    conv.user.storage.slipperPosition = false;
    conv.ask('<speak>Super, ich habe die alte Stelle gelöscht, jetzt kannst du mir die neue nennen.</speak>');

});

// Handle the Dialogflow intent named 'actionsIntentPERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('ActionsIntentPERMISSION', (conv, params, permissionGranted) => {
    if (!permissionGranted) {
        conv.ask('<speak>Kein Thema, ich helfe dir trotzdem gerne. Wo sind deine Hausschuhe gerade?</speak>');
    } else {
        conv.user.storage.userName = conv.user.name.given;
        conv.ask(`Danke dir, ${conv.user.storage.userName}! Zurück zum Thema: Wo sind deine Hausschuhe gerade?`);
        conv.ask(new Suggestions('im Büro', 'in der Küche', 'im Garten'));
    }
});


// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
