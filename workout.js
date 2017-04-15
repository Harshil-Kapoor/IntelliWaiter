/**
 * Created by Harshil on 6/6/2016.
 */

//require the required modules...
var http = require('http');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

//initialize the MongoClient, and specify the connection url...
var MongoClient = mongodb.MongoClient;

var url = 'mongodb://admin:123456@ds149040.mlab.com:49040/intelli-waiter';

//initialize the express app...
var app = express();


var port = process.env.PORT || 8000;
app.set('port', port);

var server = http.createServer(app);

server.listen(port);


//declare the commom variables...
var  uIdentity;
// var runTarget, unitTarget, pullupsTarget, pushupsTarget, dateTarget;
// var ran, unit, pullups, pushups, date;
// var response;
// var reqRan, reqPullups, reqPushups;

var reqStarter, reqDish, reqDessert, reqSupplement;
var reqStarterCount, reqDishCount, reqDessertCount, reqSupplementCount;
reqStarter = reqDish = reqDessert = reqSupplement = '';
starterCount = dishCount = dessertCount = supplementCount = 0;
//write the middleware...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//define callback for /webhook endpoint...
app.post('/webhook', backWebhook);

// the webhook...
function backWebhook(req, res, next) {

    console.log(JSON.stringify(req.body));

    var action = req.body.result.action;
    uIdentity = req.body.result.parameters.uIdentity;

    //redirect to appropriate callbacks acc. to the request action...
    if (action == 'sendMenu')                sendMenu(req, res, next);
    else if (action == 'updateStarter')      updateStarter(req, res, next);
    else if (action == 'updateDish')         updateDish(req, res, next);
    else if (action == 'updateDish')         updateDish(req, res, next);
    else if (action == 'updateDessert')      updateDessert(req, res, next);
    else if (action == 'updateSupplement')   updateSupplement(req, res, next);
    else if (action == 'sendBill')           sendBill(req, res, next);
    // else if (action == 'get_target')   get_target(req, res);
    // else

    next();
};

//the callback for connecting to mongoDB, will be called by any of the callbacks...
function connect(operation, data, callback, reqCollection, next) {
    
    MongoClient.connect(url, function (err, db) {
        if (err || reqCollection == undefined){
            console.log("Error connecting to database : ",err);

            return true;
        }else{
            console.log("Successfully connected to database...");

            var collection = db.collection(reqCollection);

            // var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
            // var user2 = {name: 'modulus user', age: 22, roles: ['user']};
            // var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

            //switch to perform mongoDB operations, according to request 'operation' field...
            switch (operation) {

                //mongoDB logic for document insertion...
                case 'insert' :
                    collection.insertOne(data, function (err, result) {
                        if (err) {
                            console.log('______insertion error______');
                            console.log(err);

                            // return undefined
                            //call the fulfillmentGen callback to prepare fulfillment and return response...
                            if(typeof callback === 'function')  callback(err, operation, undefined, response, next);
                        } else {
                            console.log('Inserted a document into "workout" collection.');

                            // return result.insertedId;
                            //call the fulfillmentGen callback to prepare fulfillment and return response...
                            if(typeof callback === 'function')  callback(undefined, operation, result, response, next);
                        }
                        db.close();
                    });

                //mongoDB logic for document retrieval...
                case 'retrieve' :
//                     var result = collection.findOne({uIdentity : data.uIdentity});
//
                    //dynamically setting the query for fetching order & menu documents...
                    var query;
                    //fetching only active orders from the orders collection...
                    if(reqCollection = 'orders')   query = {uIdentity : data.uIdentity, status : 1};
                    else                        query = {uIdentity : data.uIdentity};

                    collection.findOne(query, function (err, result) {
                        if (err) {
                            console.log('______retrieval error______');
                            console.log(err);

                            // result = undefined;
                            //call the fulfillmentGen callback to prepare fulfillment and return response...
                            //or the recordUpdate callback...
                            // if(typeof callback === 'function'){
                            //     //status : 1 means the order is active, i.e. current order...
                            //     if(reqCollection = 'orders')   callback(err, operation, {insert : 1}, response, next);
                            //     else                        callback(err, operation, undefined, response, next);
                            // }
                        } else if(result == null || result == undefined) {
                            console.log(result + " document retrieved as 'item'...");
                            if(typeof callback === 'function'){
                                //status : 1 means the order is active, i.e. current order...
                                if(reqCollection = 'orders')   callback(err, operation, {insert : 1}, response, next);
                                else                        callback(err, operation, undefined, response, next);
                            }
                        } else {
                            console.log('Retrieved document '+ result._id +' from "workout" collection.');

                            // return result;
                            //call the fulfillmentGen callback to prepare fulfillment and return response...
                            //or the recordUpdate callback...
                            if(typeof callback === 'function')  callback(undefined, operation, result, response, next);
                        }
                        db.close();
                    });

                //mongoDB logic for updating document...
                case 'update' :
                    //update is only used for collection 'orders', so searching for only active orders and modifying them accordingly...
                    collection.findAndModify(
                        {uIdentity : data.uIdentity, status : 1},
                        {$set: data},
                        function (err, object) {
                            if (err){
                                console.log('______retrieval error______');
                                console.log(err);

                                //call the fulfillmentGen callback to prepare fulfillment and return response...
                                if(typeof callback === 'function')  callback(err, operation, undefined, response, next);
                            }else{
                                console.log("Successfully updated document...");

                                //call the fulfillmentGen callback to prepare fulfillment and return response...
                                if(typeof callback === 'function')  callback(undefined, operation, object, response, next);
                            }
                        db.close();
                        //
                        // return true;
                    });
            }
        }
    });

    if(typeof next === 'function')  next();
}

// //targetCreator for creating json target...
// function targetCreator(ran, unit, pushups, pullups) {
//
//     var targetKeys=[];
//     if(ran !='')        targetKeys.push('ran');
//     if(unit !='')       targetKeys.push('unit');
//     if(pullups !='')    targetKeys.push('pullups');
//     if(pushups !='')    targetKeys.push('pushups');
//
//     var target={};
//     for(key in targetKeys){
//         var property = targetKeys[key];
//         target[property] = eval(property);
//     }
//     return target;
// }

//record update processing callback...
function recordUpdate(err, operation, findRes, response, collection, next) {

    var starter, dish, dessert, supplement;
    var starterCount, dishCount, dessertCount, supplementCount;

    //check if the document is found...
    if(err){
        //check if a new order has to be created, => no order found in collection 'orders'...
        if(findRes.insert == 1){
            console.log("Inserting new document into 'orders'...");

            //set the target variables as received in request from FBM...
            starter = reqStarter;
            dish = reqDish;
            dessert = reqDessert;
            supplement = reqSupplement;

            starterCount = reqStarterCount;
            dishCount = reqDishCount;
            dessertCount = reqDessertCount;
            supplementCount = reqSupplementCount;

            var targetKeysIns=[];
            if(reqStarter !='')         {targetKeysIns.push('starter');targetKeysIns.push('starterCount');}
            if(reqDish !='')            {targetKeysIns.push('dish');targetKeysIns.push('dishCount');}
            if(reqDessert !='')         {targetKeysIns.push('dessert');targetKeysIns.push('dessertCount');}
            if(reqSupplement!='')       {targetKeysIns.push('supplement');targetKeysIns.push('supplementCount');}

            //while creating document for new order in 'orders', set the order as active by setting status : 1...
            var targetIns={uIdentity: uIdentity, status : 1};
            for(key in targetKeysIns){
                var property = targetKeysIns[key];
                targetIns[property] = eval(property);
            }

            connect('insert', targetIns, fulfillmentGen, 'orders', next);
        }
        else    fulfillmentGen(err, '', undefined, response, collection, next);
    }else{

        //logic for preparing data to update the document fields in mongoDB...
        // var reqRan, reqPullups, reqPushups;
        //
        // reqRan = req.result.parameters.ran;
        // reqPullups = req.result.parameters.pullups;
        // reqPushups = req.result.parameters.pushups;

        //set the target variables as received in request from FBM...
        var foundStarterCount = findRes.starterCount;
        var foundDishCount = findRes.dishCount;
        var foundDessertCount = findRes.dessertCount;
        var foundSupplementCount = findRes.supplementCount;

        starter = findRes.starter;
        dish = findRes.dish;
        dessert = findRes.dessert;
        supplement = findRes.supplement;

        //while updating order, increase/decrease order quantities...
        starterCount = foundStarterCount + reqStarterCount;
        dishCount = foundDishCount + reqDishCount;
        dessertCount = foundDessertCount + reqDessertCount;
        supplementCount = foundSupplementCount + reqSupplementCount;

        var targetKeys=[];
        if(starter !='')         {targetKeys.push('starter');targetKeys.push('starterCount');}
        if(dish !='')            {targetKeys.push('dish');targetKeys.push('dishCount');}
        if(dessert !='')         {targetKeys.push('dessert');targetKeys.push('dessertCount');}
        if(supplement !='')       {targetKeys.push('supplement');targetKeys.push('supplementCount');}


        // if(reqRan !='')        targetKeys.push('ran');
        // if(reqPullups !='')    targetKeys.push('pullups');
        // if(reqPushups !='')    targetKeys.push('pushups');

        //no key set by default while updating orders...
        var target={};
        for(key in targetKeys){
            var property = targetKeys[key];
            target[property] = eval(property);
        }

        //finally, update the document, and pass the appropriate callback for preparing the response...
        connect('update', target, fulfillmentGen, 'orders', next);
    }

    if(typeof next === 'function')  next();
}

//response generation callback...
function fulfillmentGen(err, operation, result, response, collection, next) {

    //check if error is generated, or we have the response...
    if(result == undefined){

        //format error response...
        var errResp = {
            speech: "Sorry, I can't find the details, give it another try...",
            displayText: "Sorry, I can't find the details, give it another try...",
            source: "Workout Tracker Service @heroku",

            status: "not found"
        };

        //send the json formatted response to api.ai...
        response.json(errResp);
    }else{

        //format fulfillment response according to the 'operation' field in the function scope (closure)...
        switch (operation){
            case 'menu':
                console.log("Entered 'menu' case for fulfillmentGen");

                var name = result.name, price = result.price;

                console.log("Received data : name : " + name + ", price : " + price);

                var menuResp = {
                    speech: "Hey There!, here's your Menu : \n" + name + ", Price : " + price,
                    displayText: "Hey There!, here's your Menu : \n" + name + ", Price : " + price,
                    source: "IntelliWaiter Service @heroku"
                };

            // function sendFBMessage(sender, messageData, callback) {
            //     request({
            //         url: 'https://graph.facebook.com/v2.6/me/messages',
            //         qs: {access_token: FB_PAGE_ACCESS_TOKEN},
            //         method: 'POST',
            //         json: {
            //             recipient: {id: uIdentity},
            //             message: menuResp
            //         }
            //     }, function (error, response, body) {
            //         if (error) {
            //             console.log('Error sending message: ', error);
            //         } else if (response.body.error) {
            //             console.log('Error: ', response.body.error);
            //         }
            //
            //         if (callback) {
            //             callback();
            //         }
            //     });
            // }

                //send the json formatted response to api.ai...
                console.log("MenuResp sent as : "+menuResp);
                response.json(menuResp);

                break;
            case 'insert':

                var insResp = {
                    speech: "Voila, now with the target set, we can concentrate on achieving it",
                    displayText: "Voila, now with the target set, we can concentrate on achieving it",
                    source: "Workout Tracker Service @heroku"
                };

                //send the json formatted response to api.ai...
                response.json(insResp);

                break;
            case 'retrieve':

                var ranRes = result.ran;
                var unitRes = result.unit;
                var pushupsRes = result.pushups;
                var pullupsRes = result.pullups;

                //Here's what you're looking for :

                var textRes = "Distance ran: " + ranRes + " " + unitRes + "\n" +
                              "Push-ups : " + pushupsRes + "\n" +
                              "Pull-ups : " + pullupsRes;

                var findResp = {
                    speech: textRes,
                    displayText: textRes,
                    source: "Workout Tracker Service @heroku",

                    status: "found"
                };

                //send the json formatted response to api.ai...
                response.json(findResp);

                break;
            case 'update':

                var updateResp = {
                    speech: "Sure, let me jot it down...",
                    displayText: "Sure, let me jot it down...",
                    source: "Workout Tracker Service @heroku"
                };

                //send the json formatted response to api.ai...
                response.json(updateResp);

                break;
        }

    }

    next();
}

// set starter as provided by the user...
function updateStarter(req, res, next) {
    reqStarter = req.body.result.parameters.starter;
    reqStarterCount = req.body.result.parameters.starterCount;

//    // var target = {uIdentity: uIdentity, starter: starter, starterCount: starterCount};

    response = res;
    // collection = 'starters';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    // connect('retrieve', retTarget, recordUpdate, collection, next);
    connect('retrieve', retTarget, recordUpdate, collection, next);

    next();
}

// set dish as provided by the user...
function updateDish(req, res, next) {
    reqDish = req.body.result.parameters.dish;
    reqDishCount = req.body.result.parameters.dishCount;

//    // var target = {uIdentity: uIdentity, dish: dish, dishCount: dishCount};

    response =res;
    // collection = 'dishes';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection, next);

    next();
}

// set dessert as provided by the user...
function updateDessert(req, res, next) {
    reqDessert = req.body.result.parameters.dessert;
    reqDessertCount = req.body.result.parameters.dessertCount;

//    // var target = {uIdentity: uIdentity, dessert: dessert, dessertCount: dessertCount};

    response =res;
    // collection = 'desserts';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection, next);

    next();
}

// set supplement as provided by the user...
function updateSupplement(req, res, next) {
    reqSupplement = req.body.result.parameters.supplement;
    reqSupplementCount = req.body.result.parameters.supplementCount;

//    // var target = {uIdentity: uIdentity, supplement: supplement, supplementCount: supplementCount};

    response =res;
    // collection = 'supplements';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection, next);

    next();
}

// get menu to be sent to the user...
function sendMenu(req, res, next) {
    var menuTarget=[], name='', price;

    response =res;
    reqCollection = req.body.result.parameters.collection;
    console.log("reqCollection received as : " + reqCollection);

    //call connect() with appropriate arguements...
    // var DBResult = connect('retrieve', target);

    // connect('retrieve', target, fulfillmentGen, collection, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @show_status');

    MongoClient.connect(url, function (err, db) {
        if (err || reqCollection == undefined){
            console.log("Error connecting to database : ",err);

            return true;
        }else{
            console.log("Successfully connected to database @ sendMenu...");

            var collection = db.collection(reqCollection);

            var cursor = collection.find({}, {"_id":false, "name":true, "price":true});
            cursor.each(function (err, item) {
                if (err) {
                    console.log('______retrieval error______');
                    console.log(err);

                    //call the fulfillmentGen callback to prepare fulfillment and return response...
                    // fulfillmentGen(err, 'retrieve', undefined, response, next);
                } else if(item == null || item == undefined) {
                    console.log(item + " document retrieved as 'item'...");
                }else{
                    console.log('Retrieved document '+ item._id +' from "workout" collection.');
                    name = item.name;
                    price = item.price;
                    console.log(name+'\n');

                    //format the generic template / card response, using the documents fetched from the collection ''
                    // for(key in targetKeys){
                    //     var property = targetKeys[key];
                    //     target[property] = eval(property);
                    // }
                    //
                    // menuTarget+=item.name+'\n'+item.price+'\n';
                    
                    menuItemTarget = {"name" : name, "price" : price};

                    //call the fulfillmentGen callback to prepare fulfillment and return response...
                    fulfillmentGen(err, 'menu', menuItemTarget, response, next);
                }
                db.close();
            });
        }
    });

    // fulfillmentGen(err, 'menu', undefined, response, next);

    next();
}

// get bill to be sent to the user...
function sendBill(req, res, next) {
    var target = {uIdentity: uIdentity};

    response =res;
    // collection = 'orders';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('retrieve', target);
    connect('order', target, fulfillmentGen, collection, next);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @show_status');

    next();
}

// function record(req, res, next) {
//
//
//     reqRan = req.body.result.parameters.ran;
//     reqPullups = req.body.result.parameters.pullups;
//     reqPushups = req.body.result.parameters.pushups;
//
//
//     // ran = req.body.result.parameters.ran;
//     // unit = req.body.result.parameters.unit;
//     // pullups = req.body.result.parameters.pullups;
//     // pushups = req.body.result.parameters.pushups;
//     // date = req.body.result.parameters.date;
//     //
//     // targetCreator(ran, unit, pushups, pullups);
//     //
//     // var targetKeys=[];
//     // if(ran !='')        targetKeys.push('ran');
//     // if(unit !='')       targetKeys.push('unit');
//     // if(pullups !='')    targetKeys.push('pullups');
//     // if(pushups !='')    targetKeys.push('pushups');
//     //
//     // var target={};
//     // for(key in targetKeys){
//     //     var property = targetKeys[key];
//     //     target[property] = eval(property);
//     // }
//
//     response =res;
//
//
//     //call connect() with appropriate arguements...
//     // var DBResult = connect('update', target);
//     var retTarget = {uIdentity: uIdentity};
//
//     connect('retrieve', retTarget, recordUpdate, next);
//
//     // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
//     // else                       console.log(DBResult + ' @record');
//
//     next();
// }