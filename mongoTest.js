/**
 * Created by Harshil on 6/8/2016.
 */
var mongodb = require('mongodb');
var async = require('async');

var MongoClient = mongodb.MongoClient;
var menuTarget='', name='', price;

var url = 'mongodb://admin:123456@ds149040.mlab.com:49040/intelli-waiter';

MongoClient.connect(url, function (err, db) {
    if (err){
        console.log("Error connecting to database : ",err);
    }else{
        console.log("Successfully connected to database...");

        var collection = db.collection('starters');


        // collection.find({}, {"_id":false, "name":true, "price":true}).toArray(function (err, results) {
        //     console.log(results); // output all records
        //     db.close();
        // });

        var query = {"$or":[{"name":"veg kothey"},{"name":"chilli paneer"}]};
        var projection = {"price":1,"count":1,"_id":0};

        collection.find(query, projection).toArray((err, result) => {
            if (err) {
                console.log('______retrieval error @retrieve______');
                console.log(err);
            }else {
                console.log(JSON.stringify(result));
            }
        });
        // async.waterfall([
        db.close();

        // console.log("menuTarget : "+menuTarget);

        // collection.insert([user1, user2, user3], function (err, result) {
        //     if(err){
        //         console.log(err);
        //     }else{
        //         console.log('Inserted %d documents into "users" collection. The documents inserted with "_id" are:', result.length, result);
        //     }
        //     db.close();
        // });
    }
});
function printInfo(menuTarget){
    console.log("menuTarget : "+ menuTarget)
};