Repository for IntelliWaiter, a smart AI powered chat-bot for placing hassle-free orders in fast-food chains n restaurants.

#file descriptions :

Procfile : File used by heroku (server code hosting platform), specifies which process to be executed first, like in package.json

README.md : You are reading this

mongoTest.js, objTest.js : File for testing mLab connection, MongoDB logics, and other offline testing performed using these files

package.json : File specifying nexessary project details like : 
				1) Name,
				2) Version Information,
				3) Execution Information,
				4) Project Dependencies.

workout.js : The original implementation used for the service code, included to demonstrate fallbacks of the native asynchronous flow of Node.js, in certain use-cases.

intelliWaiter.js : The final updated implementation used for the service code, including 'async.js' for introducing synchronous flow, instead of the native asynchronous flow of Node.js. The brain behind the chat-bot, includes logic for placing orders, updating orders, generating bill, and sending response to the user, routed via api.ai, and Facebook Messenger.

connect.js : MongoDB logic, including implementations for insertion, retrieval, and updation of documents in appropriate collections, in appropriate Databases.