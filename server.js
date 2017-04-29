const express = require('express');
const body_parser = require('body-parser');
const node_ssh = require('node-ssh');
const async = require('async');
const ssh = new node_ssh();
const app = express();
const execute = require('./server_modules/executeCommand');
const mongo = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const fs = require('fs');

app.use(express.static(__dirname));
app.use(body_parser.json());	
app.use(body_parser.urlencoded({
	extended: true
}));

app.use(fileUpload());

let DB;
mongo.connect('mongodb://' + process.argv[2] + ':27017/major', (err, db) => {
	if (err) {
		console.log('can\'t connect to the database');
	} else {
		app.listen(3000);
		console.log('server running at port 3000');
		DB = db;
	}
});

app.get('/', (req, res) => {
	res.redirect('/index.html');
})

app.post('/upload', (req, res) => {
	console.log(req.files);
	// fs.mkdirSync('./keys/' + req.body.alias);
	// req.files.serverKey.mv('./keys/' + req.body.alias);
	res.status(200).send('ok');
})

app.post('/selectServer', (req, res) => {
	console.log(req.connection.remoteAddress);
	DB.collection('serverInfo').find({
		alias: req.body.alias,
		passphrase: req.body.passphrase,
	}).toArray((err, result) => {
		if (err) {
			console.log('db error');
		} else {
			if (result.length == 0) {
				res.status(500).send('error');
			} else {
				res.send(result[0]['fields']);
			}
		}
	});
})

app.post('/client', (req, res) => {
	console.log(req.connection.remoteAddress);
	console.log(req.body.username);
	ssh.connect({
		host: req.connection.remoteAddress,
		username: 'root',
		password: req.body.password
	}).then(() => {
		let commands = req.body.commands, functions = [];
		for (let i = 0; i < req.body.commands.length; i++) {
			for (let j = 0; j < commands[i].length; ++j) {
				functions.push(execute(ssh, commands[i][j] + ' client.conf > client.conf1 ; mv client.conf1 client.conf', '/home/' + req.body.username));
			}
		}
		functions.push(execute(ssh, 'openvpn client.conf &', '/home/' + req.body.username));
		async.waterfall(functions, (err, result) => {
			if (err) {
				res.status(500).send('err');
			} else {
				res.status(200).send('ok');
			}	
		});
	});
});

app.post('/server', (req, res) => {
	console.log(req.connection.remoteAddress);

	if (req.body.alias.length != 0 && req.body.aliasPassword.length != 0) {
		DB.collection('serverInfo').insert({
			alias: req.body.alias,
			password: req.body.aliasPassword,
			passphrase: req.body.passphrase,
			fields: req.body.values
		}, (err, result) => {
			if (err) {
				console.log('db error');
			} else {
				console.log('done');
			}
		});
	}

	ssh.connect({
		host: req.connection.remoteAddress,
		username: 'root',
		password: req.body.password
	}).then(() => {
		let commands = req.body.commands, functions = [];
		for (let i = 0; i < Object.keys(req.body.commands).length; i++) {
			for (let j = 0; j < commands[i].length; ++j) {
				functions.push(execute(ssh, commands[i][j] + ' server.conf > server.conf1 ; mv server.conf1 server.conf', '/home/' + req.body.username));
			}
		}

		functions.push(execute(ssh, 'cp * /home/' + req.body.username, '/home/' + req.body.username + '/decentsa/keys'));

		functions.push(execute(ssh, 'openvpn server.conf &', '/home/' + req.body.username));

		async.waterfall(functions, (err, result) => {
			if (err) {
				res.status(500).send('err');
			} else {
				res.send('ok');
			}	
		});
	});
});

app.post('/vars', (req, res) => {
	let ip, password, dir;
	console.log('Request came from ' + req.connection.remoteAddress);
	if (req.body.commands[0] == undefined || req.body.commands[0].length != 0) {
		ip = req.body.commands[0][0], password = req.body.commands[0][1], dir = '';
	} else {
		ip = req.connection.remoteAddress, password = req.body.password, dir = req.body.username;
	}
	console.log('IP to be logged in ' + ip);
	console.log('Password to be logged in ' + password);

	ssh.connect({
		host: ip,
		username: 'root',
		password: password
	}).then(() => {
		let commands = req.body.commands, functions = [];
		let coms = 'source vars && ./clean-all && ./pkitool --batch --initca && ./pkitool --batch --server server && ./build-dh && ./pkitool --batch client';

		functions.push(execute(ssh, 'make-cadir decentsa', '/home/' + dir));

		for (let i = 1; i < commands.length; i++) {
			for (let j = 0; j < commands[i].length; ++j) {
				functions.push(execute(ssh, commands[i][j] + ' vars > vars1 ; mv vars1 vars', '/home/' + dir + '/decentsa'));
			}
		}

		functions.push(execute(ssh, coms, '/home/' + dir + '/decentsa'));
		
		async.waterfall(functions, (err, result) => {
			if (err) {
				res.status(500).send('err');
			} else {
				res.send('ok');
			}	
		});
	});
});