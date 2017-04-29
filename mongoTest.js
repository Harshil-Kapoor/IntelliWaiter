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

        var collection = db.collection('supplements');


        // collection.find({}, {"_id":false, "name":true, "price":true}).toArray(function (err, results) {
        //     console.log(results); // output all records
        //     db.close();
        // });

        var cursor = collection.find({}, {"_id":false, "name":true, "price":true});
        // async.waterfall([
            cursor.each(function (err, item) {
                if (err) {
                    // console.log('______retrieval error______');
                    console.log(err);
                } else {
                    // console.log('Retrieved document '+ result._id +' from "workout" collection.');
                    if (item != null) {
                        name = item.name;
                        price = item.price;
                    }
                    // console.log(name+'\n'+price+'\n');

                    //format the generic template / card response, using the documents fetched from the collection ''
                    console.log(name+'\t'+price);
                    // menuTarget = menuTarget + name;
                    menuTarget = menuTarget + name +' : '+price+'\n';
                    // menuTarget += (name + '\n' + price + '\n');
                    // console.log(menuTarget);
                }
                //
                //         // console.log(cursor);
                //         // async.each(cursor, function (item, callback) {
                //         //     if(item != null)    console.log(item.name+'\n');
                //         //     // if(item != null)    menuTarget += (item.name + '\n' + item.price+ '\n');
                //         //     callback();
                //         // }, function (err) {
                //         //     if(err) console.log(err);
                //         //     else    console.log("menuTarget : "+ menuTarget);
                //         // });
                //     }, callback(null, menuTarget)),
                //     printInfo(menuTarget, callback(null))
                // ], function (err, result) {
                //     if(err) console.log(err);
                // });
            });
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