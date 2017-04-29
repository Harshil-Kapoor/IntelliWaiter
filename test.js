/**
 * Created by Harshil on 29-04-2017.
 */
/**
 * Created by Harshil on 6/8/2016.
 */
var mongodb = require('mongodb');
var async = require('async');
var express = require('express');

var app = express();

var MongoClient = mongodb.MongoClient;
var menuTarget='', name='', price;

var url = 'mongodb://admin:123456@ds149040.mlab.com:49040/intelli-waiter';

let DB;
MongoClient.connect(url, (err, db) => {
    if (err) {
        console.log("Error connecting to database : ", err);
    } else {
        app.listen(27017);
        console.log("Server running at heroku environment port...");
        DB=db;
    }
});

//app.use()

function connect(operation, data, reqCollection) {

    var collection = DB.collection(reqCollection);

    // var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    // var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    // var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    //switch to perform mongoDB operations, according to request 'operation' field...
    switch (operation) {

        //mongoDB logic for document insertion...
        case 'insert' :

            return  (callback) => {
                collection.insertOne(data, function (err, result) {
                    if (err) {
                        console.log('______insertion error______');
                        console.log(err);
                    } else {
                        console.log('Inserted a document into "workout" collection.');
                        callback(null, result);
                    }
                });
            };

        //mongoDB logic for document retrieval...
        case 'retrieve' :

            return (callback) => {
                //dynamically setting the query for fetching order & menu documents...
                var query;

                collection.findOne(data, function (err, result) {
                    if (err) {
                        console.log('______retrieval error______');
                        console.log(err);
                    } else if (result == null || result == undefined) {
                        console.log(result + " document retrieved as 'item'...");
                    } else {
                        console.log('Retrieved document ' + result._id + ' from "workout" collection.');
                        callback(null, result);
                    }
                });
            }

        //mongoDB logic for updating document...
        case 'update' :

            return (callback) => {
                //update is only used for collection 'orders', so searching for only active orders and modifying them accordingly...
                collection.findAndModify(
                    {uIdentity: data.uIdentity, status: 1},
                    {$set: data},
                    function (err, object) {
                        if (err) {
                            console.log('______retrieval error______');
                            console.log(err);
                        } else {
                            console.log("Successfully updated document...");
                            callback(null, object);
                        }
                    });
            }
    }
};

app.get('/', (req, res) => {
    let fArray =[];
    fArray.push(connect('retrieve', {}, 'desserts'));
    fArray.push((res, callback) => {console.log(res);callback(null)});
    // fArray.push((callback) => {DB.close();callback(null)});
    async.waterfall(fArray, (err,result) => {
        if(!err)    res.status(200).send("ok");
        else    res.status(500);
    });
});

function printInfo(menuTarget){
    console.log("menuTarget : "+ menuTarget)
};