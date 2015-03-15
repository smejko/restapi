var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var format = require('util');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(':date[web], :method, :remote-addr, :response-time, :status, :url'));

var db;
 
mongoClient.connect('mongodb://localhost:27017/rest', function(error, database) {
	if(error) throw error;
	db = database;
});

app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', '*');
	next();	
});

app.param('collectionName', function(req, res, next, collectionName){
	req.collection = db.collection(collectionName);
	return next();
});

app.get('/', function(req, res, next) {
	res.send('It\'s working');
});

app.get('/:collectionName', function(req, res, next) {
	req.collection.find().toArray(function(e, result) {
		if(e) return next(e);
		res.send(result);
	});
});

app.get('/:collectionName/:id', function(req, res, next) {
	var id = new ObjectID(req.params.id);
	req.collection.findOne({ _id: id }, function(e, result) {
		if(e) return next(e);
		res.send(result);
	});
});

app.post('/:collectionName', function(req, res, next) {
	req.collection.insert(req.body, { w: 1 }, function(e, result) {
		if(e) return next(e);
		res.send(result);
	});
});

app.put('/:collectionName/:id', function(req, res, next) {
	var id = new ObjectID(req.params.id);
	req.collection.update({ _id: id }, { $set: req.body }, { w: 1 }, function(e, result) {
		if(e) return next(e);
		if(result !== 1)
			res.status(404).send("Resource not found.");
		else
			res.send({ msg: 'success' });
	});
});

app.delete('/:collectionName/:id', function(req, res, next) {
	var id = new ObjectID(req.params.id);
	req.collection.remove({ _id: id }, { w: 1, single: true }, function(e, result) {
		if(e) return next(e);
		if(result !== 1)
			res.status(404).send("Resource not found.");
		else
			res.send({ msg: 'success' });
	});
});

app.options('/:collectionName/:id', function(req, res, next) {
	res.set("Access-Control-Allow-Methods", "PUT, DELETE");
	res.set("Access-Control-Allow-Headers", "Content-Type");
	res.end();
});

app.options('/:collectionName', function(req, res, next) {
	res.set("Access-Control-Allow-Methods", "POST");
	res.set("Access-Control-Allow-Headers", "Content-Type");
	res.end();
});

// Error handling
app.use(function(req, res){
	res.status(404).send('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).send(err.stack);
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function() {
	console.log('Express server listening on port 3000');
})