//Lets require/import the HTTP module
var http = require('http');
var express = require('express');
var exec = require('child_process').exec;
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

var branch;
var pwd;

var the_pwd = exec('pwd');
the_pwd.stdout.on('data', function (data) {
  pwd = data;
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));


var suffixes = {
	module: '.module.js',
	factory: 'Factory.js',
	service: 'Service.js',
	controller: 'Controller.js',
	directive: '.js',
	template: '.tpl.html',
	less: '.less',
}

app.post('/build', function (req, res) {
	console.log(req)
	var dest = req.body.path;
	var name = req.body.module;
	var message = {error: [], success: []};
	var fileName, path;

	if (Array.isArray(req.body.component))
		for (var i = 0; i < req.body.component.length; i++)
			createFile(req.body.component[i]);
	else
		createFile(req.body.component);

	if(req.body.finder)
			exec('open ' + dest, puts);

	function createFile (component) {
		// fileName = name + suffixes[component];
		// path = dest + '/' + fileName;
		// console.log(path);
		// console.log(fs.existsSync(path));
		// if(fs.existsSync(path)) {
		//   	console.log(fileName + ' not created, ' + fileName + ' already exists');
	 //    	message.error.push(fileName + ' not created, ' + fileName + ' already exists');
		// } else {
		// 	exec('gulp mkModule --name ' + name + ' --dest ' + dest + ' --comp ' + component, puts);
		// 	if(req.body.editor && req.body.open)
		// 		exec('sublime ' + path, puts);
		//   	console.log(fileName + ' created');
	 //    	message.success.push(fileName + ' created');
		// }
	}

	res.status(200).json({messages: message});

});

// Static files
app.get('*', function(req, res){
	return res.redirect('/static/');
});

function puts(error, stdout, stderr) {
	console.log(stdout);
}

//Create a server
var server = app.listen(3521, function () {
	console.log('Server listening on', 3521)
});