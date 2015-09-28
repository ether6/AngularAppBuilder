var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));

// CRUD
app.get('*', function(req, res){
	return res.redirect('/static/');
});

// Create a server
var server = app.listen(3513, function () {
	console.log('Server listening on', 3513)
});