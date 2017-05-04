/**
 * Created by Harshil on 6/6/2016.
 */

//require the required modules...
var http = require('http');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var async = require('async');
var connect = require('./connect');

//initialize the MongoClient, and specify the connection url...
var MongoClient = mongodb.MongoClient;

//the MongoDB url for Database 'intelli-waiter'...
var url = 'mongodb://admin:123456@ds149040.mlab.com:49040/intelli-waiter';

//initialize the express app...
var app = express();

var port = process.env.PORT || 8000;

//declare the commom variables...
var  uIdentity;

var reqStarter, reqDish, reqDessert, reqSupplement;
var reqStarterCount, reqDishCount, reqDessertCount, reqSupplementCount;
reqStarter = reqDish = reqDessert = reqSupplement = '';
starterCount = dishCount = dessertCount = supplementCount = 0;

//write the middleware...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//define callback for /webhook endpoint...
app.post('/webhook', backWebhook);

//instantiate mongoDB connection, and the DB object to be used to transactions in 'connect'...
let DB;
MongoClient.connect(url, (err, db) => {
    if (err){
        console.log("Can't connect to database...");
    }else{
        app.listen(port);
        console.log("Server running at heroku environment port...");
        DB=db;
    }
});

// the webhook...
function backWebhook(req, res) {

    console.log(JSON.stringify(req.body));

    var action = req.body.result.action;
    uIdentity = req.body.sessionId;
    uIdentity = "Harshil Kapoor";

    //redirect to appropriate callbacks acc. to the request action...
    if (action == 'updateStarter')           updateStarter(req, res);
    else if (action == 'updateDish')         updateDish(req, res);
    else if (action == 'updateDessert')      updateDessert(req, res);
    else if (action == 'updateSupplement')   updateSupplement(req, res);
    else if (action == 'sendBill')           sendBill(req, res);
}

//wrapper for retrieving order details using 'connect'...
function retrOrderWrapper(retTarget, data, projection, callback) {
    var config = {
        operation : 'retrieve',
        query : retTarget,
        projection : projection,
        data : {
            retTarget : retTarget,
            data : data
        },
        reqCollection : 'orders'
    };
    // return  connect(config, DB);
    connect(config, DB, callback);
}

//function which iterates through the order, calling 'retrOrderWrapper' for each collection in the order...
function orderIterator(order, callback) {
    console.log("Entered 'orderIterator' with order : " + JSON.stringify(order));

    var starters = order.result[0].starters;
    var dishes = order.result[0].dishes;
    var desserts = order.result[0].desserts;
    var supplements = order.result[0].supplements;

    console.log("Starters in order : " + JSON.stringify(starters));
    console.log("Dishes in order : " + JSON.stringify(dishes));
    console.log("Desserts in order : " + JSON.stringify(desserts));
    console.log("Supplements in order : " + JSON.stringify(supplements));

    var data = undefined;

    var prevDetails = undefined;

    // var strFlag, dishFlag, desFlag, supFlag;
    // strFlag = dishFlag = desFlag = supFlag = 0;

    //generate function array for synchronous exection using 'async'...
    let itArray =[];

    if(starters != undefined)      itArray.push((call) =>       {retrPriceWrapper(undefined, 'starters', starters, prevDetails, call)});
    if(dishes != undefined)        itArray.push((data, call) => {retrPriceWrapper(data, 'dishes', dishes, prevDetails, call)});
    if(desserts != undefined)      itArray.push((data, call) => {retrPriceWrapper(data, 'desserts', desserts, prevDetails, call)});
    if(supplements != undefined)   itArray.push((data, call) => {retrPriceWrapper(data, 'supplements', supplements, prevDetails, call)});

    // if(starters != undefined){
    //     itArray.push((call) =>       {retrPriceWrapper(undefined, 'starters', starters, prevDetails, call)});
    //     strFlag = 1;
    // }
    // if(dishes != undefined){
    //     if(strFlag == 1){
    //         itArray.push((data, call) => {retrPriceWrapper(data, 'dishes', dishes, prevDetails, call)});
    //         dishFlag = 1;
    //     }else   itArray.push((data, call) => {retrPriceWrapper(data, 'dishes', dishes, prevDetails, call)});
    // }
    // if(desserts != undefined)      itArray.push((data, call) => {retrPriceWrapper(data, 'desserts', desserts, prevDetails, call)});
    // if(supplements != undefined)   itArray.push((data, call) => {retrPriceWrapper(data, 'supplements', supplements, prevDetails, call)});


    async.waterfall(itArray, (err, result) => {
        if(!err){
            var collBill = 0, bill = 0;
            var i = 0;

            //processing price details retrieved from collection given by collName
            if(result != undefined){
                for (let obj of result.result) {

                    var name = result.prevDetails[i].name, count = result.prevDetails[i].count;

                    console.log("Record details :  Name : " + name + ", Price : " + obj.price + " & Count : " + count);

                    collBill = collBill + obj.price * count;

                    console.log("Previous Iteration bill : " + collBill);

                    i++;
                }

                if (data.bill != undefined) {
                    console.log("Billing partially done : Bill : " + result.bill);

                    result['bill'] = parseInt(result.bill) + collBill;
                }
                else {
                    console.log("Billing started...");

                    // data['bill'] = collBill;
                    result['bill'] = collBill;
                }
            }

            callback(null, result);
        }
    });
}

//wrapper for retrieving price details using 'connect'...
function retrPriceWrapper(data, collName, collection, prevDetails, call) {
    console.log("Entered 'retrPriceWrapper' with params : data : " + JSON.stringify(data) + ", collName : " + collName + ", and collection : " + JSON.stringify(collection));

    var collBill = 0, bill = 0;
    var i = 0;

    //processing price details retrieved from collection given by collName
    if(data != undefined){
        for (let obj of data.result) {

            var name = data.prevDetails[i].name, count = data.prevDetails[i].count;

            console.log("Record details :  Name : " + name + ", Price : " + obj.price + " & Count : " + count);

            collBill = collBill + obj.price * count;

            console.log("Previous Iteration bill : " + collBill);

            i++;
        }

        if (data.bill != undefined) {
            console.log("Billing partially done : Bill : " + data.bill);

            bill = parseInt(data.bill) + collBill;
        }
        else {
            console.log("Billing started...");

            // data['bill'] = collBill;
            bill = collBill;
        }
    }else   bill = undefined;

    //query preparation...
    var orArray = [];
    var retTarget;

    for(let obj of collection){
        orArray.push({name: obj.name})
    }

    retTarget ={
        $or : orArray
    };

    var projection = {};
    projection["price"] = 1;
    projection["count"] = 1;
    projection["_id"] = 0;

    //defining config params for 'connect'...
    var config = {
        operation : 'retrieve',
        query : retTarget,
        projection : projection,
        data : {
            retTarget : retTarget,
            data : {billing : 1},
            bill : bill,
            prevDetails : collection
        },
        reqCollection : collName
    };
    connect(config, DB, call);
}

//wrapper for processing info retrieved using 'retrOrderWrapper', and accordingly use 'connect' to :
//1)insert, or
//3)update,
function recordUpdate(data, collection, callback) {

    console.log("Params rec'd @recordUpdate : data = " + JSON.stringify(data) + ", collection = " + collection);

    //collect the flags...
    var err = data.err;
    var insertFlag = data.insert;
    var insertCollFlag = data.insert_coll;

    //check if a new order has to be created, => no order found in collection 'orders'...
    if (insertFlag != undefined) {
        console.log("Inserting new document into 'orders'...");

        var targetIns = {};

        targetIns.uIdentity = data.retTarget.uIdentity;
        targetIns.status = data.retTarget.status;

        targetIns[collection] = [{
            name : data.data.name,
            count : data.data.count
        }];

        //prepare 'connect' configuration 'config'...
        var config = {
            operation: 'insert',
            query: targetIns,
            data: data,
            reqCollection: 'orders'
        };

        connect(config, DB, callback);
    } else if (insertCollFlag != undefined) { //check if the order exists, but a new category needs to be inserted...
        console.log("Inserting new category " + collection + " into existing record in 'orders'...");

        var updCatQuery = {uIdentity: data.retTarget.uIdentity, status: 1};
        var targetCatIns = {};

        targetCatIns[collection] = [{
            name : data.data.name,
            count : data.data.count
        }];

        //prepare 'connect' configuration 'config'...
        var catConfig = {
            operation: 'update',
            query: updCatQuery,
            projection: targetCatIns,
            data: data,
            reqCollection: 'orders'
        };

        connect(catConfig, DB, callback);
    } else { //document found in orders => update the document accordingly...
        console.log("Found a document in 'orders'...");

        var updQuery = {uIdentity: data.retTarget.uIdentity, status: 1};
        var targetUpd = {};
        var newCount;

        //check if the order property, i.e. the particular [collection] ordered already exists in the order, using a 'flag'...
        var flag=0;
        for(let obj of data.result[0][collection]){
            if(obj.name == data.data.name){

                console.log("Property " + data.data.name + " found a document in " + collection + " in 'orders'...");

                //update the property count in the result retrieved only...
                flag=1;
                newCount = parseInt(obj.count, 10) + parseInt(data.data.count, 10);
                obj.count = newCount;
            }
        }

        //checking the flag...
        if(flag==0){
            //Pushing property if the item is not in existing order...

            console.log("Pushing property " + data.data.name + " into " + JSON.stringify(collection) + " in 'orders'...");

            data.result[0][collection].push({
                name : data.data.name,
                count : data.data.count
            });
            targetUpd[collection] = data.result[0][collection];
        }else{
            //forwarding updated record count, when the item already exists in the existing order...

            targetUpd = data.result[0];
        }

        //prepare 'connect' configuration 'config'...
        var updConfig = {
            operation: 'update',
            query: updQuery,
            projection : targetUpd,
            data: data,
            reqCollection: 'orders'
        };

        connect(updConfig, DB, callback);
    }
}

//response generation callback...
// function fulfillmentGen(err, operation, result, response, collection) {
function fulfillmentGen(data, response) {

    //check if error is generated, or we have the response...
    // if(result == undefined){
    //
    //     //format error response...
    //     var errResp = {
    //         speech: "Sorry, I can't find the details, give it another try...",
    //         displayText: "Sorry, I can't find the details, give it another try...",
    //         source: "Workout Tracker Service @heroku",
    //
    //         status: "not found"
    //     };
    //
    //     //send the json formatted response to api.ai...
    //     response.json(errResp);
    // }else{

    if(data.data.billing != undefined){
        console.log("result obtained @billing, FINAL BILL : " + JSON.stringify(data.result.bill));

        //close the bill...
        console.log("Closing the active order in 'orders'...");

        var closeQuery = {uIdentity: data.retTarget.uIdentity, status: 1};
        var targetClose = {status : 0};

        //prepare 'connect' configuration 'config'...
        var closeConfig = {
            operation: 'update',
            query: closeQuery,
            projection: targetClose,
            data: data,
            reqCollection: 'orders'
        };

        connect(closeConfig, DB, function (err, result) {
            if(err == null) console.log("Some error occured when closing order...");
            else            console.log("Order closed, result obtained : " + JSON.stringify(result));
        });

        //generate the api.ai response, containing the bill details...
        var bill = data.bill;
        var billResp = {
            speech: "Your bill is : Rs." + bill + "/- only.",
            displayText: "Your bill is : Rs." + bill + "/- only.",
            source: "IntelliWaiter Service @heroku"
        };

        //send the json formatted response to api.ai...
        response.json(billResp);

    } else {
        var name = data.data.name, count = data.data.count;
        var insResp = {
            speech: count + " plates of " + name + " confirmed",
            displayText: count + " plates of " + name + " confirmed",
            source: "IntelliWaiter Service @heroku"
        };

        //send the json formatted response to api.ai...
        response.json(insResp);
    }
        //format fulfillment response according to the 'operation' field in the function scope (closure)...
        // switch (operation){
        //     // case 'menu':
        //     //     console.log("Entered 'menu' case for fulfillmentGen");
        //     //
        //     //     var name = result.name, price = result.price;
        //     //
        //     //     console.log("Received data : name : " + name + ", price : " + price);
        //     //
        //     //     var menuResp = {
        //     //         speech: "Hey There!, here's your Menu : \n" + name + ", Price : " + price,
        //     //         displayText: "Hey There!, here's your Menu : \n" + name + ", Price : " + price,
        //     //         source: "IntelliWaiter Service @heroku"
        //     //     };
        //     //
        //     // // function sendFBMessage(sender, messageData, callback) {
        //     // //     request({
        //     // //         url: 'https://graph.facebook.com/v2.6/me/messages',
        //     // //         qs: {access_token: FB_PAGE_ACCESS_TOKEN},
        //     // //         method: 'POST',
        //     // //         json: {
        //     // //             recipient: {id: uIdentity},
        //     // //             message: menuResp
        //     // //         }
        //     // //     }, function (error, response, body) {
        //     // //         if (error) {
        //     // //             console.log('Error sending message: ', error);
        //     // //         } else if (response.body.error) {
        //     // //             console.log('Error: ', response.body.error);
        //     // //         }
        //     // //
        //     // //         if (callback) {
        //     // //             callback();
        //     // //         }
        //     // //     });
        //     // // }
        //     //
        //     //     //send the json formatted response to api.ai...
        //     //     console.log("MenuResp sent as : "+menuResp);
        //     //     response.json(menuResp);
        //     //
        //     //     break;
        //
        //
        //     case 'insert':
        //
        //         var name = data.data.name, count = data.data.count;
        //         var insResp = {
        //             speech: count + " plates of " + name + " confirmed",
        //             displayText: count + " plates of " + name + " confirmed",
        //             source: "IntelliWaiter Service @heroku"
        //         };
        //
        //         //send the json formatted response to api.ai...
        //         response.json(insResp);
        //
        //         break;
        //     case 'retrieve':
        //
        //         var ranRes = result.ran;
        //         var unitRes = result.unit;
        //         var pushupsRes = result.pushups;
        //         var pullupsRes = result.pullups;
        //
        //         //Here's what you're looking for :
        //
        //         var textRes = "Distance ran: " + ranRes + " " + unitRes + "\n" +
        //                       "Push-ups : " + pushupsRes + "\n" +
        //                       "Pull-ups : " + pullupsRes;
        //
        //         var findResp = {
        //             speech: textRes,
        //             displayText: textRes,
        //             source: "Workout Tracker Service @heroku",
        //
        //             status: "found"
        //         };
        //
        //         //send the json formatted response to api.ai...
        //         response.json(findResp);
        //
        //         break;
        //     case 'update':
        //
        //         var updateResp = {
        //             speech: "Sure, let me jot it down...",
        //             displayText: "Sure, let me jot it down...",
        //             source: "Workout Tracker Service @heroku"
        //         };
        //
        //         //send the json formatted response to api.ai...
        //         response.json(updateResp);
        //
        //         break;
        // }

    // }
}

// set starter as provided by the user...
function updateStarter(req, res) {
    reqStarter = req.body.result.parameters.starter;
    reqStarterCount = req.body.result.parameters.starterCount;

//    // var target = {uIdentity: uIdentity, starter: starter, starterCount: starterCount};

    collection = 'starters';

    var data = {name : reqStarter, count : reqStarterCount};
    
    var retTarget = {uIdentity: uIdentity, status : 1};

    var projection = {};
    projection[collection] = 1;
    projection["_id"] = 0;

    let fArray =[];

    fArray.push((callback) => {retrOrderWrapper(retTarget, data, projection, callback)});
    fArray.push((data, callback) => {recordUpdate(data, 'starters', callback)});

    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}

// set dish as provided by the user...
function updateDish(req, res) {
    reqDish = req.body.result.parameters.dish;
    reqDishCount = req.body.result.parameters.dishCount;

    collection = 'dishes';

    var data = {name : reqDish, count : reqDishCount};

    var retTarget = {uIdentity: uIdentity, status : 1};

    var projection = {};
    projection[collection] = 1;
    projection["_id"] = 0;

    let fArray =[];

    fArray.push((callback) => {retrOrderWrapper(retTarget, data, projection, callback)});
    fArray.push((data, callback) => {recordUpdate(data, 'dishes', callback)});

    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}

// set dessert as provided by the user...
function updateDessert(req, res) {
    reqDessert = req.body.result.parameters.dessert;
    reqDessertCount = req.body.result.parameters.dessertCount;

    collection = 'desserts';

    var data = {name : reqDessert, count : reqDessertCount};

    var retTarget = {uIdentity: uIdentity, status : 1};

    var projection = {};
    projection[collection] = 1;
    projection["_id"] = 0;

    let fArray =[];

    fArray.push((callback) => {retrOrderWrapper(retTarget, data, projection, callback)});
    fArray.push((data, callback) => {recordUpdate(data, 'desserts', callback)});

    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}

// set supplement as provided by the user...
function updateSupplement(req, res) {
    reqSupplement = req.body.result.parameters.supplement;
    reqSupplementCount = req.body.result.parameters.supplementCount;

    collection = 'supplements';

    var data = {name : reqSupplement, count : reqSupplementCount};

    var retTarget = {uIdentity: uIdentity, status : 1};

    var projection = {};
    projection[collection] = 1;
    projection["_id"] = 0;

    let fArray =[];

    fArray.push((callback) => {retrOrderWrapper(retTarget, data, projection, callback)});
    fArray.push((data, callback) => {recordUpdate(data, 'supplements', callback)});

    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}

// // get menu to be sent to the user...
// function sendMenu(req, res) {
//     var menuTarget=[], name='', price;
//
//     response =res;
//     reqCollection = req.body.result.parameters.collection;
//     console.log("reqCollection received as : " + reqCollection);
//
//     //call connect() with appropriate arguements...
//     // var DBResult = connect('retrieve', target);
//
//     // connect('retrieve', target, fulfillmentGen, collection);
//
//     // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
//     // else                       console.log(DBResult + ' @show_status');
//
//     MongoClient.connect(url, function (err, db) {
//         if (err || reqCollection == undefined){
//             console.log("Error connecting to database : ",err);
//
//             return true;
//         }else{
//             console.log("Successfully connected to database @ sendMenu...");
//
//             var collection = db.collection(reqCollection);
//
//             var cursor = collection.find({}, {"_id":false, "name":true, "price":true});
//             cursor.each(function (err, item) {
//                 if (err) {
//                     console.log('______retrieval error______');
//                     console.log(err);
//
//                     //call the fulfillmentGen callback to prepare fulfillment and return response...
//                     // fulfillmentGen(err, 'retrieve', undefined, response);
//                 } else if(item == null || item == undefined) {
//                     console.log(item + " document retrieved as 'item'...");
//                 }else{
//                     console.log('Retrieved document '+ item._id +' from "workout" collection.');
//                     name = item.name;
//                     price = item.price;
//                     console.log(name+'\n');
//
//                     //format the generic template / card response, using the documents fetched from the collection ''
//                     // for(key in targetKeys){
//                     //     var property = targetKeys[key];
//                     //     target[property] = eval(property);
//                     // }
//                     //
//                     // menuTarget+=item.name+'\n'+item.price+'\n';
//
//                     menuItemTarget = {"name" : name, "price" : price};
//
//                     //call the fulfillmentGen callback to prepare fulfillment and return response...
//                     fulfillmentGen(err, 'menu', menuItemTarget, response);
//                 }
//                 db.close();
//             });
//         }
//     });
// }

// get bill to be sent to the user...
function sendBill(req, res) {
    var retTarget = {uIdentity: uIdentity, status : 1};

    var data = {billing : 1};

    var projection = {};
    // projection[collection] = 1;
    projection["_id"] = 0;

    let fArray =[];

    fArray.push((callback) => {retrOrderWrapper(retTarget, data, projection, callback)});
    fArray.push((data, callback) => {orderIterator(data, callback)});

    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}