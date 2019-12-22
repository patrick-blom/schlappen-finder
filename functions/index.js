'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {
    dialogflow,
    Permission,
    Suggestions,
    SimpleResponse,
} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('DefaultWelcomeIntent', (conv) => {
    verificationCheck(conv);

    if (conv.user.storage.userName) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Hi ${conv.user.storage.userName}, willkommen zurück! <break time="0.3" /></speak>`,
            text: `Hi ${conv.user.storage.userName}, willkommen zurück!`
        }));

        conv.ask(new SimpleResponse({
            speech: `<speak>Soll ich dir beim suchen helfen <break time="0.3" /> oder mir eine Stelle merken?</speak>`,
            text: 'Soll ich dir beim suchen helfen oder mir eine Stelle merken?'
        }));
    } else {
        conv.ask(new SimpleResponse({
            speech: '<speak>Hi! Ich bin dein Schlappen Finder. <break time="0.3" /> Ich kann dir helfen deine Hausschuhe' +
                ' zu finden, indem ich dir die Stelle nenne an der du sie ausgezogen hast.</speak>',
            text: 'Hi! Ich bin dein Schlappen Finder. Ich kann dir helfen deine Hausschuhe' +
                ' zu finden, indem ich dir die Stelle nenne an der du sie ausgezogen hast.'
        }));

        conv.ask(new SimpleResponse({
            speech: '<speak>Möchtest du, dass ich kurz erkläre wie alles funktioniert?</speak>',
            text: 'Möchtest du, dass ich kurz erkläre, wie alles funktioniert?'
        }));

        conv.ask(new Suggestions('Ja', 'Nein'));
    }
});

// Init the remember postion dialog and ask for the name if not set
app.intent('InitRememberIntent', (conv) => {
    verificationCheck(conv);

    if (conv.user.storage.slipperPosition) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Ich erinnere mich gerade, dass du mir vor kurzem schon eine Stelle genannt hast. ` +
                `Kann ich die Stelle vergessen ${conv.user.storage.slipperPosition} um Platz zu schaffen?</speak>`,
            text: `Ich erinnere mich gerade, dass du mir vor kurzem schon eine Stelle genannt hast. ` +
                `Kann ich die Stelle vergessen ${conv.user.storage.slipperPosition} um Platz zu schaffen?`
        }));

        conv.ask(new Suggestions('Ja', 'Nein'));
    } else {
        if (!conv.user.storage.userName) {
            conv.ask(new Permission({
                context: 'Damit es nächstes mal schneller geht',
                permissions: 'NAME'
            }));
        } else {
            conv.ask(new SimpleResponse({
                speech: `<speak>Okay, dann verrate mir kurz, wo sind deine Hausschuhe gerade?</speak>`,
                text: `Okay, dann verrate mir kurz, wo sind deine Hausschuhe gerade?`
            }));
        }
    }
});

// The actual saving process of the slipper postion
app.intent('RememberIntent', (conv, {raum}) => {
    verificationCheck(conv);

    conv.user.storage.slipperPosition = raum;

    conv.close(new SimpleResponse({
        speech: `<spreak>Alles klar! Ich habe mir die Stelle "${conv.user.storage.slipperPosition}" ` +
            `gemerkt.</spreak>`,
        text: `Alles klar! Ich habe mir die Stelle "${conv.user.storage.slipperPosition}" gemerkt`
    }));
});

// delete the old position and continue
app.intent('InitRememberIntent - yes', (conv) => {
    conv.user.storage.slipperPosition = false;
    conv.close(new SimpleResponse({
        speech: '<speak>Super, ich habe die alte Stelle gelöscht, jetzt kannst du mir die neue nennen.</speak>',
        text: 'Super, ich habe die alte Stelle gelöscht, jetzt kannst du mir die neue nennen.'
    }));

});

// Deep link remember intent
app.intent('RememberIntentDeepLink', (conv, {raum}) => {
    verificationCheck(conv);

    const savedPosition = conv.user.storage.slipperPosition;

    if (savedPosition && savedPosition !== raum) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Ich erinnere mich gerade, dass du mir vor kurzem schon eine Stelle genannt hast. ` +
                `Kann ich die Stelle ${savedPosition} vergessen und mir stattdessen ${raum} merken?</speak>`,
            text: `Ich erinnere mich gerade, dass du mir vor kurzem schon eine Stelle genannt hast. ` +
                `Kann ich die Stelle ${savedPosition} vergessen und mir stattdessen ${raum} merken?`
        }));

        conv.data.possibleSlipperPosition = raum;
        conv.ask(new Suggestions('Ja', 'Nein'));
    } else {
        conv.user.storage.slipperPosition = raum;

        conv.close(new SimpleResponse({
            speech: `<spreak>Alles Klar! Ich habe mir die Stelle "${conv.user.storage.slipperPosition}" ` +
                `gemerkt.</spreak>`,
            text: `Alles Klar! Ich habe mir die Stelle "${conv.user.storage.slipperPosition}" gemerkt`
        }));
    }
});

// Deep link remember follow intent yes
app.intent('RememberIntentDeepLink - yes', (conv) => {
    verificationCheck(conv);

    conv.user.storage.slipperPosition = conv.data.possibleSlipperPosition;

    conv.close(new SimpleResponse({
        speech: `<spreak>Alles klar! Ich habe die alte Stelle vergessen und mir stattdessen ` +
            ` "${conv.user.storage.slipperPosition}" gemerkt.</spreak>`,
        text: `Alles klar! Ich habe die alte Stelle vergessen und mir stattdessen ` +
            ` "${conv.user.storage.slipperPosition}" gemerkt.`,
    }));
});

// Handle the Dialogflow intent named 'actionsIntentPERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('ActionsIntentPERMISSION', (conv, params, permissionGranted) => {
    verificationCheck(conv);

    if (!permissionGranted) {
        conv.ask(new SimpleResponse({
            speech: '<speak>Kein Thema, ich helfe dir trotzdem gerne. Wo sind deine Hausschuhe gerade?</speak>',
            text: 'Kein Thema, ich helfe dir trotzdem gerne. Wo sind deine Hausschuhe gerade?'
        }));
    } else {
        conv.user.storage.userName = conv.user.name.given;

        conv.ask(new SimpleResponse({
            speech: `<speak>Danke dir, ${conv.user.storage.userName}! Zurück zum Thema: ` +
                `Wo sind deine Hausschuhe gerade?<speak>`,
            text: `Danke dir, ${conv.user.storage.userName}! Zurück zum Thema: Wo sind deine Hausschuhe gerade?`
        }));

        conv.ask(new Suggestions('im Büro', 'in der Küche', 'im Garten'));
    }
});

// responds the known position to the user
app.intent('SearchIntent', (conv) => {
    verificationCheck(conv);

    if (conv.user.storage.slipperPosition) {
        conv.close(new SimpleResponse({
            speech: `<speak>Lass mich kurz überlegen, ich glaube deine Hausschuhe sind im ${conv.user.storage.slipperPosition}</speak>`,
            text: `Lass mich kurz überlegen, ich glaube deine Hausschuhe sind im ${conv.user.storage.slipperPosition}`
        }));

        conv.user.storage.slipperPosition = false;
    } else {
        conv.close(new SimpleResponse({
            speech: `<speak>Tut mir leid, ich kann mich auch nicht erinnern sie gesehen zu haben. ` +
                `Sag mir doch einfach nächstes mal Bescheid wenn du sie ausziehst, dann merke ich es mir für dich </speak>`,
            text: 'Tut mir leid, ich kann mich auch nicht erinnern sie gesehen zu haben. ' +
                'Sag mir doch einfach nächstes mal Bescheid wenn du sie ausziehst, dann merke ich es mir für dich'
        }));
    }
});

// ensure the intent of deleting the known position
app.intent('DeletePositionIntent', (conv) => {
    verificationCheck(conv);

    conv.ask(new SimpleResponse({
        speech: `<speak>Bist du dir sicher, dass ich die alte Stelle vergessen kann ?</speak>`,
        text: `Bist du dir sicher, dass ich die alte Stelle vergessen kann ?`
    }));

    conv.ask(new Suggestions('Ja', 'Nein'));
});

// deletes the known position
app.intent('DeletePositionIntent - yes', (conv) => {
    verificationCheck(conv);

    conv.user.storage.slipperPosition = false;

    conv.close(new SimpleResponse({
        speech: `<speak>Kein Problem, ich habe die alte Stelle vergessen</speak>`,
        text: 'Kein Problem, ich habe die alte Stelle vergessen'
    }));
});

// reprompt if something is miss understood
app.intent('Reprompt', (conv) => {
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Tut mir leid, das habe ich nicht ganz verstanden.</speak>`,
            text: `Tut mir leid, das habe ich nicht ganz verstanden.`
        }));
    } else if (repromptCount === 1) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Sorry, ich habs schon wieder nicht verstanden, kannst du es noch mal sagen?</speak>`,
            text: `Sorry, ich habs schon wieder nicht verstanden, kannst du es noch mal sagen?`
        }));
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
        conv.ask(new SimpleResponse({
            speech: `<speak>Ok <break time="0.3" />, das wird nichts. Lass uns es später noch mal versuchen.</speak>`,
            text: `Ok, das wird nichts. Lass uns es später noch mal versuchen.`
        }));
    }
});

// custom method to reduce duplicated code
const verificationCheck = (conv) => {
    if (conv.user.verification !== 'VERIFIED') {
        conv.close(new SimpleResponse({
            speech: 'Tut mir leid, ich kenne dich nicht. Momentan kann ich nur denen helfen die hier Zuhause sind.',
            text: 'Tut mir leid, ich kenne dich nicht. Momentan kann ich nur denen helfen die hier Zuhause sind.'
        }));
    }
};

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.fulfillment = functions.https.onRequest(app);
