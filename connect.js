/**
 * Created by Harshil on 29-04-2017.
 */
//the callback for connecting to mongoDB, will be called by any of the callbacks...
module.exports = connect;

var operation, query, projection, data, reqCollection;

function connect(config, DB, callback) {
    operation = config.operation;
    query = config.query;
    projection = config.projection;
    data = config.data;
    reqCollection = config.reqCollection;

    // console.log("Entered connect with operation : " + operation + ", and query : " + query.toString());
    console.log("Entered connect with config params : " + JSON.stringify(config));

    var collection = DB.collection(reqCollection);

    // console.log("Connection object : " + JSON.stringify(collection));

    // var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    // var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    // var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    //switch to perform mongoDB operations, according to request 'operation' field...
    switch (operation) {

        //mongoDB logic for document insertion...
        case 'insert' :
            console.log("Entered 'insert'...");

            // return (callback) => {
                console.log("Entered 'insert' callback...");

                DB.collection(reqCollection).insert(query, function (err, result) {
                    if (err) {
                        console.log('______insertion error______');
                        console.log(err);

                        // callback(null, err);
                        // // return undefined
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // if (typeof callback === 'function')  callback(err, operation, undefined, response);
                    } else {
                        console.log('Inserted a document into ' + reqCollection + ' collection.');

                        data['result'] = result;
                        callback(null, data);
                        // // return result.insertedId;
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // if (typeof callback === 'function')  callback(undefined, operation, result, response);
                    }
                });
            break;
            // };

        //mongoDB logic for document retrieval...
        case 'retrieve' :

            // return (callback) => {
                //                     var result = collection.findOne({uIdentity : query.uIdentity});
                //
                //dynamically setting the query for fetching order & menu documents...
                // var fQuery;
                // //fetching only active orders from the orders collection...
                // if (reqCollection = 'orders')   fQuery = query;
                // else                        fQuery = {uIdentity: query.uIdentity};

                collection.find(query, projection).toArray((err, result) => {
                    if (err) {
                        console.log('______retrieval error______');
                        console.log(err);

                        // callback(null, {err : 1});
                    } else if (result.length == 0) {
                        console.log("No document retrieved...");

                        //status : 1 means the order is active, i.e. current order...
                        if (reqCollection = 'orders'){
                            data['insert'] = 1;
                            callback(null, data);
                        }else   callback(null, data);
                    } else {
                        console.log('Retrieved document ' + result["_id"] + ' from "workout" collection.');

                        data['result'] = result;
                        
                        callback(null, data);
                        // // return result;
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // //or the recordUpdate callback...
                        // if (typeof callback === 'function')  callback(undefined, operation, result, response);
                    }
                });
            break;
            // };

        //mongoDB logic for updating document...
        case 'update' :

            // return (callback) => {
                //update is only used for collection 'orders', so searching for only active orders and modifying them accordingly...
                collection.findAndModify(
                    query,
                    {$set: projection},
                    function (err, object) {
                        if (err) {
                            console.log('______retrieval error______');
                            console.log(err);

                            // callback(null, err);
                            // //call the fulfillmentGen callback to prepare fulfillment and return response...
                            // if (typeof callback === 'function')  callback(err, operation, undefined, response);
                        } else {
                            console.log("Successfully updated document...");

                            callback(null, data, object);
                            // //call the fulfillmentGen callback to prepare fulfillment and return response...
                            // if (typeof callback === 'function')  callback(undefined, operation, object, response);
                        }
                    });
            break;
            // };
    }
}
