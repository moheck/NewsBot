var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});  

// Create Chat bot, provide appId and pw of registered bot.
// while testing locally appId and pw can be blank  
var connector = new builder.ChatConnector({
    appId: "",
    appPassword: ""
});

// Construct a UniversalBot with the connector to our app service.
// bot is the brains of our bot, uses dialogs to handle all conversations
var bot = new builder.UniversalBot(connector);

// Post anything picked up by the connector to /api/messages
server.post('/api/messages', connector.listen());

// Create LUIS recognizer
var model = 'https://api.projectoxford.ai/luis/v2.0/apps/8efc0c51-299c-4010-adf5-1b167212e464?subscription-key=98b4937961ee4283bd60816df0e9f8f9&verbose=true';
var recognizer = new builder.LuisRecognizer(model);
// Create IntentDialog, passing in recognizer
var intents = new builder.IntentDialog({ recognizers: [recognizer]});


//=========================================================
// Bots Dialogs
//=========================================================


// Root Dialog, goes to our IntentDialog "intents"
bot.dialog('/', intents);

// when intent matches with LUIS TopHeadlines, get top headlines for entity type "NewsSource"
intents.matches('TopHeadlines',
    function(session, args){
        //use builder's EntityRecognizer to findEntity(args.entities, EntityType)
        var source = builder.EntityRecognizer.findEntity(args.entities, 'NewsSource');
        var sourceName = source.entity;
        console.log("News source: " +sourceName);
        var type = "top";
        makeRequest(session, sourceName, type);
    }
);

// when intent matches with LUIS LatestHeadlines, get latest headlines for entity type "NewsSource"
intents.matches('LatestHeadlines',
    function(session, args){
        //use builder's EntityRecognizer to findEntity(args.entities, EntityType)
        var source = builder.EntityRecognizer.findEntity(args.entities, 'NewsSource');
        console.log(source);
        var sourceName = source.entity;
        console.log("News source: " + sourceName);
        var type = "latest";
        makeRequest(session, sourceName, type);
    }
);

function makeRequest(session, sourceName, type){
    if(sourceName.includes('reddit')){
        sourceName = 'reddit-r-all';
    }
    else if(sourceName.includes('aljazeera')){
        sourceName = 'al-jazeera-english';
    }
    else if(sourceName.includes('abc')){
        sourceName = 'abc-news-au';
    }
    else if(sourceName.includes('bbc')){
        sourceName = 'bbc-news';
    }
    else if(sourceName.includes('bloomberg')){
        sourceName = 'bloomberg';
    }
    else if(sourceName.includes('buzzfeed')){
        sourceName = 'buzzfeed';
    }
    else if(sourceName.includes('cnn')){
        sourceName = 'cnn';
    }
    else if(sourceName.includes('espn')){
        sourceName = 'espn';
    }
    else if(sourceName.includes('fortune')){
        sourceName = 'fortune';
    }
    else if(sourceName.includes('reuters')){
        sourceName = 'reuters';
    }
    else if(sourceName.includes('national geographic')){
        sourceName = 'national-geographic';
    }
    else if(sourceName.includes('techcrunch')){
        sourceName = 'techcrunch';
    }
    else if(sourceName.includes("economist")){
        sourceName = 'the-economist';
    }
    else if(sourceName.includes('guardian')){
        sourceName = 'the-guardian-au';
    }
    else if(sourceName.includes('new york times')){
        sourceName = 'the-new-york-times';
    }
    else if(sourceName.includes('huffington post')){
        sourceName = 'the-huffington-post';
    }
    else if(sourceName.includes('wall street journal')){
        sourceName = 'the-wall-street-journal';
    }
    else if(sourceName.includes('washington post')){
        sourceName = 'the-washington-post';
    }
    else if(sourceName.includes('time')){
        sourceName = 'time';
    }
    else if(sourceName.includes('wired')){
        sourceName = 'wired-de';
    }

    if(sourceName !== null){
        var url = 'https://newsapi.org/v1/articles?source=' + sourceName + '&sortBy=' + type + '&apiKey=5dc4762d4bb74e37902a33675ac897e3';
        request(url, function(error, response, body){
            if(!error && response.statusCode == 200){
                var body = JSON.parse(body);
                console.log(body);
                for(var i=0; i<body.articles.length; i++){
                    articleTitle = body.articles[i].title;
                    url = body.articles[i].url;
                    session.send("Title: %s \n\n URL: %s", articleTitle, url);
                    session.endDialog();
                }
            }
            else{
                session.send("I couldn't find any headlines for that. Try asking for top headlines");
                session.endDialog();
            }
        });
    }
    else{
        session.send("Sorry, I don't recognize that source");
        session.endDialog();
    }
}

// when intent matches regular expression, "Hello", run Greeting Dialog
intents.matches(/^Hello/i, function(session){
    session.beginDialog('/greeting');
});

// if intent doesn't match anything, send failure message
intents.onDefault(function(session){
    session.send("Sorry, I don't know how to handle your request.");
    session.endDialog();
});

// Greeting Dialog
bot.dialog('/greeting', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
        session.endDialog();
    }
]);

// Profile Setup Dialog
bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);