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

var url = 'mongodb://admin:123456@ds149040.mlab.com:49040/intelli-waiter';

//initialize the express app...
var app = express();


var port = process.env.PORT || 8000;
app.set('port', port);

// var server = http.createServer(app);
//
// server.listen(port);


//declare the commom variables...
var  uIdentity;
// var runTarget, unitTarget, pullupsTarget, pushupsTarget, dateTarget;
// var ran, unit, pullups, pushups, date;
// var response;3
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
function backWebhook(req, res) {

    console.log(JSON.stringify(req.body));

    var action = req.body.result.action;
    uIdentity = req.body.result.parameters.uIdentity;
    uIdentity = "Harshil Kapoor";

    //redirect to appropriate callbacks acc. to the request action...
    if (action == 'sendMenu')                sendMenu(req, res);
    else if (action == 'updateStarter')      updateStarter(req, res);
    else if (action == 'updateDish')         updateDish(req, res);
    else if (action == 'updateDessert')      updateDessert(req, res);
    else if (action == 'updateSupplement')   updateSupplement(req, res);
    else if (action == 'sendBill')           sendBill(req, res);
}

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

function retrOrderWrapper(retTarget, data, projection) {
    var config = {
        operation : 'retrieve',
        query : retTarget,
        projection : projection,
        data : {
            retTarget : retTarget,
            data : data
        },
        reqCollection : 'order'
    };
    return  connect(config, DB);
}

function retrPriceWrapper(retTarget, data, collection) {
    var config = {
        operation : 'retrieve',
        query : retTarget,
        data : data,
        reqCollection : collection
    };
    return  connect(config, DB);
}

function insertWrapper(retTarget, data) {
    var config = {
        operation : 'retrieve',
        query : retTarget,
        data : data,
        collection : 'order'
    };
    return  connect(config, DB);
}

function updateWrapper(retTarget, data) {
    var config = {
        operation : 'retrieve',
        query : retTarget,
        data : data,
        collection : 'order'
    };
    return  connect(config, DB);
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
function recordUpdate(data, collection) {

    var err = data.err;
    var insertFlag = data.insert;

    //check if a new order has to be created, => no order found in collection 'orders'...
    if (insertFlag != undefined) {
        console.log("Inserting new document into 'orders'...");

        var targetIns = {};

        targetIns.uIdentity = data.retTarget.uIdentity;
        targetIns.status = data.retTarget.status;
        // targetIns['type'] = collection;
        // targetIns[collection] = data.name;
        // targetIns[collection + 'Count'] = data.count;
        targetIns[collection] = [{
            name : data.data.name[0],
            count : data.data.count[0]
        }];

        var config = {
            operation: 'insert',
            query: targetIns,
            data: data,
            reqCollection: 'orders'
        };

        return connect(config, DB);
    } else {
        console.log("Found a document in 'orders'...");

        var updQuery = {uIdentity: data.retTarget.uIdentity, status: 1};
        var targetUpd = {};
        var newCount;

        var projection = {};
        projection[collection] = 1;

        var flag=0;
        for(let obj of data.result){
            if(obj.name == data.data.name){
                flag=1;
                obj.count += data.data.count;
                newCount = obj.count;
            }
        }

        if(flag==0){
            data.result.push({
                name : data.data.name,
                count : data.data.count
            });
            targetUpd[eval(collection)] = data.result;
            // targetUpd = {
            //     name : data.data.name,
            //     count : data.data.count
            // };
        }else   targetUpd = data.result;

        var updConfig = {
            operation: 'update',
            query: updQuery,
            projection : targetUpd,
            data: data,
            reqCollection: 'orders'
        };

        return connect(updConfig);
    }
}

//response generation callback...
// function fulfillmentGen(err, operation, result, response, collection) {
function fulfillmentGen(data, response) {

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

        var name = data.data.name, count = data.data.count;
        var insResp = {
            speech: count + " plates of " + name + " confirmed",
            displayText: count + " plates of " + name + " confirmed",
            source: "IntelliWaiter Service @heroku"
        };

        //send the json formatted response to api.ai...
        response.json(insResp);

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

    }
}

// set starter as provided by the user...
function updateStarter(req, res) {
    reqStarter = req.body.result.parameters.starter;
    reqStarterCount = req.body.result.parameters.starterCount;

//    // var target = {uIdentity: uIdentity, starter: starter, starterCount: starterCount};

    response = res;
    collection = 'starters';
    // collection = 'orders';

    var strTarget = {name : reqStarter};

    var data = {name : reqStarter, count : reqStarterCount};
    
    var retTarget = {uIdentity: uIdentity, status : 1};

    var projection = {};
    projection[collection] = 1;

    let fArray =[];
    // fArray.push(connect('retrieve', strTarget, 'starters', updateData, retTarget));
    fArray.push(retrOrderWrapper(retTarget, data, projection));
    fArray.push((data) => {return recordUpdate(data, 'starters')});

    // fArray.push((callback) => {DB.close();callback(null)});
    async.waterfall(fArray, (err, result) => {
        if(!err)    fulfillmentGen(result, res);
        else    res.status(500);
    });
}

// set dish as provided by the user...
function updateDish(req, res) {
    reqDish = req.body.result.parameters.dish;
    reqDishCount = req.body.result.parameters.dishCount;

//    // var target = {uIdentity: uIdentity, dish: dish, dishCount: dishCount};

    response =res;
    // collection = 'dishes';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection);
}

// set dessert as provided by the user...
function updateDessert(req, res) {
    reqDessert = req.body.result.parameters.dessert;
    reqDessertCount = req.body.result.parameters.dessertCount;

//    // var target = {uIdentity: uIdentity, dessert: dessert, dessertCount: dessertCount};

    response =res;
    // collection = 'desserts';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection);

    
}

// set supplement as provided by the user...
function updateSupplement(req, res) {
    reqSupplement = req.body.result.parameters.supplement;
    reqSupplementCount = req.body.result.parameters.supplementCount;

//    // var target = {uIdentity: uIdentity, supplement: supplement, supplementCount: supplementCount};

    response =res;
    // collection = 'supplements';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('insert', target);

//    // connect('insert', target, fulfillmentGen);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @set_target');

    var retTarget = {uIdentity: uIdentity};

    connect('retrieve', retTarget, recordUpdate, collection);
}

// get menu to be sent to the user...
function sendMenu(req, res) {
    var menuTarget=[], name='', price;

    response =res;
    reqCollection = req.body.result.parameters.collection;
    console.log("reqCollection received as : " + reqCollection);

    //call connect() with appropriate arguements...
    // var DBResult = connect('retrieve', target);

    // connect('retrieve', target, fulfillmentGen, collection);

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
                    // fulfillmentGen(err, 'retrieve', undefined, response);
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
                    fulfillmentGen(err, 'menu', menuItemTarget, response);
                }
                db.close();
            });
        }
    });
}

// get bill to be sent to the user...
function sendBill(req, res) {
    var target = {uIdentity: uIdentity};

    response =res;
    // collection = 'orders';
    collection = 'orders';

    //call connect() with appropriate arguements...
    // var DBResult = connect('retrieve', target);
    connect('order', target, fulfillmentGen, collection);

    // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
    // else                       console.log(DBResult + ' @show_status');
}

// function record(req, res) {
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
//     connect('retrieve', retTarget, recordUpdate);
//
//     // if(DBResult == undefined)  console.log('----------Error in either MongoDB connection, or operations----------');
//     // else                       console.log(DBResult + ' @record');
//
//     
// }