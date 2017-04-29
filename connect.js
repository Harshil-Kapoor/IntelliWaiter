/**
 * Created by Harshil on 29-04-2017.
 */
//the callback for connecting to mongoDB, will be called by any of the callbacks...
module.exports = connect;

function connect(config) {

    operation = config.operation;
    query = config.query;
    data = config.data;
    reqCollection = config.reqCollection;

    var collection = DB.collection(reqCollection);

    // var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    // var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    // var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    //switch to perform mongoDB operations, according to request 'operation' field...
    switch (operation) {

        //mongoDB logic for document insertion...
        case 'insert' :

            return (callback) => {
                collection.insertOne(query, function (err, result) {
                    if (err) {
                        console.log('______insertion error______');
                        console.log(err);

                        callback(null, err);
                        // // return undefined
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // if (typeof callback === 'function')  callback(err, operation, undefined, response);
                    } else {
                        console.log('Inserted a document into "workout" collection.');

                        callback(null, data, result);
                        // // return result.insertedId;
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // if (typeof callback === 'function')  callback(undefined, operation, result, response);
                    }
                });
            };

        //mongoDB logic for document retrieval...
        case 'retrieve' :

            return (callback) => {
                //                     var result = collection.findOne({uIdentity : query.uIdentity});
                //
                //dynamically setting the query for fetching order & menu documents...
                var query;
                //fetching only active orders from the orders collection...
                if (reqCollection = 'orders')   query = {uIdentity: query.uIdentity, status: 1};
                else                        query = {uIdentity: query.uIdentity};

                collection.findOne(query).toArray((err, result) => {
                    if (err) {
                        console.log('______retrieval error______');
                        console.log(err);

                        callback(null, err);
                    } else if (result.length == 0) {
                        console.log("No document retrieved...");
                        //status : 1 means the order is active, i.e. current order...
                        if (reqCollection = 'orders')   callback(null, {insert: 1});
                        else                            callback(null, undefined);
                    } else {
                        console.log('Retrieved document ' + result._id + ' from "workout" collection.');

                        data['result'] = result;
                        
                        callback(null, data);
                        // // return result;
                        // //call the fulfillmentGen callback to prepare fulfillment and return response...
                        // //or the recordUpdate callback...
                        // if (typeof callback === 'function')  callback(undefined, operation, result, response);
                    }
                });
            };

        //mongoDB logic for updating document...
        case 'update' :

            return (callback) => {
                //update is only used for collection 'orders', so searching for only active orders and modifying them accordingly...
                collection.findAndModify(
                    {uIdentity: query.uIdentity, status: 1},
                    {$set: query},
                    function (err, object) {
                        if (err) {
                            console.log('______retrieval error______');
                            console.log(err);

                            callback(null, err);
                            // //call the fulfillmentGen callback to prepare fulfillment and return response...
                            // if (typeof callback === 'function')  callback(err, operation, undefined, response);
                        } else {
                            console.log("Successfully updated document...");

                            callback(null, data, object);
                            // //call the fulfillmentGen callback to prepare fulfillment and return response...
                            // if (typeof callback === 'function')  callback(undefined, operation, object, response);
                        }
                    });
            };
    }
}
