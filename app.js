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

var folders = [
	'modules',
	'services',
	'styles',
	'components',
	'views',
	'filters',
	'fonts',
	'images'
];

var files = [
	'app.js',
	'package.json',
	'static/styles/styles.css',
	'static/styles/bootstrap.min.css',
	'static/components/angular.js',
	'static/components/angular-ui-router.js',
];

app.post('/build', function (req, res) {
	var message = {error: [], success: []};
	if (req.body.appName)
		var appName = toCamelCase(req.body.appName);
	else
		var appName = 'newApp';
	
	// build the folder structure
	buildFolderStructure(appName);
	buildIndex(appName, req.body.modules, req.body.services);
	buildAppModule(appName, req.body.modules, req.body.views);
	buildAppController(appName);
	buildConfigJS(appName, req.body.modules);
	buildCommonService(appName);
	copyHelperFiles(appName);

	// build the views
	for (var key in req.body.views) {
		buildView(appName, req.body.views[key]);
	};

	// build the modules 
	for (var i = 0; i < req.body.modules.length; i++) {
		buildModule(appName, req.body.modules[i]);
	};

	// build the services
	var serviceName;
	for (var i = 0; i < req.body.services.length; i++) {
		serviceName = toCamelCase(req.body.services[i].name);
		buildService(appName, serviceName);
	};
	console.log('--------------------------------------------------------------------');
	console.log('- ' + appName + ' built');
	console.log('- In your terminal, go to the newApp directory and run "npm install"');
	console.log('- After running "npm install", run "node app" to serve your new app');
	console.log('- Lastly, visit http://localhost:3513');
	console.log('--------------------------------------------------------------------');
	res.status(200).json({messages: message});

});

// Static files
app.get('*', function(req, res){
	return res.redirect('/static/');
});

/*
// Build Functions
*/
function buildAppModule (appName, modules, views) {
	var firstView = '';
	var data = "(function() {\n" +
		"\t'use strict';\n" +
		"\tangular.module('module-" + appName + "', [\n" +
		"\t\t'ui.router',\n";
			for (var i = 0; i < modules.length; i++) {
				data += "\t\t'module-" + toCamelCase(modules[i].name)+ "',\n";
			};
		data += "\t])\n" +
		"\t.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {\n" +
			"\n" +
			"\t\t$stateProvider";
				for (var key in views) {
					if (!firstView)
						firstView = key;
					data += "\n\t\t\t.state('" + toDash(key) + "', {\n" +
						"\t\t\t\turl: '/" + toDash(key) + "',\n" +
						"\t\t\t\ttemplateUrl: 'views/" + toDash(key) + ".html'\n" +
					"\t\t\t})";
				};
				data += ";\n\n" +
				"\t\t$urlRouterProvider.otherwise('/" + firstView + "');\n" +
				"\n" +
		"\t}]);\n" +
	"})();";
	writeToFile(appName + '/static' + '/' + appName + '.module.js', data);
}

function buildIndex (appName, modules, services) {
	var moduleName;
	var serviceName;
	var data = '<!DOCTYPE html>\n' +
					'<html lang="en" xmlns:ng="http://angularjs.org" ng-app="module-' + appName + '">\n' +
						'\t<head>\n' +
							'\t\t<title></title>\n' +
							'\t\t<meta charset="utf-8">\n' +
							'\t\t<link rel="stylesheet" type="text/css" href="styles/bootstrap.min.css">\n' +
							'\t\t<link rel="stylesheet" type="text/css" href="styles/styles.css">\n' +
						'\t</head>\n' +
							'\n' +
						'\t<body ng-controller="mainCtrl as main" ng-cloak>\n' +
							'\t\t<div id="' + appName + '">\n' +
								'\t\t\t<div ui-view></div ui-view>\n' +
							'\t\t</div>\n' +
							'\n' +
							'\t\t<!-- Required libraries -->\n' +
							'\t\t<script src="components/angular.js"></script>\n' +
							'\t\t<script src="components/angular-ui-router.js"></script>\n' +
							'\n' +
							'\t\t<!-- Core App Components -->\n' +
							'\t\t<script src="' + appName + '.module.js"></script>\n' +
							'\t\t<script src="mainController.js"></script>\n' +
							'\t\t<script src="config.js"></script>\n' +
							'\n' +
							'\t\t<!-- modules -->\n';
							for (var i = 0; i < modules.length; i++) {
								moduleName = toCamelCase(modules[i].name);
								data += '\t\t<script src="modules/' + moduleName + '/' + moduleName + '.module.js"></script>\n' +
								'\t\t<script src="modules/' + moduleName + '/' + moduleName + 'Controller.js"></script>\n';
							};
							data += '\n' +
							'\t\t<!-- Global Factories, Service, Etc -->\n' +
							'\t\t<script src="services/commonService.js"></script>\n';
							for (var i = 0; i < services.length; i++) {
								serviceName = toCamelCase(services[i].name);
								data += '\t\t<script src="services/' + serviceName + 'Service.js"></script>\n';
							};
							data += '\n' +
						'\t</body>\n' +
					'</html>';
	writeToFile(appName + '/static' + '/index.html', data);
}

function buildCommonService (appName) {
	var data = "(function() {\n" +
				"\t'use strict';\n" +
				"\tangular.module('module-" + appName + "')\n" +
				"\t.service('commonService', ['CONFIG', '$q', '$rootScope', '$location', \n" +
				"\tfunction (CONFIG, $q, $rootScope, $location) {\n" +
				    "\t\t\n" +
					"\t\t/* Public Property and Method references go here */\n" +
				    "\t\tvar locale = 'en-us';\n" +
				    "\t\tvar service = {\n" +
				        "\t\t\tobservers: {},\n" +
				        "\t\t\tmemoryParameters: {},\n" +
				        "\t\t\tlocale: locale,\n" +
						"\t\t\t\n" +
				        "\t\t\tgetQueryStingParam: getQueryStingParam,\n" +
				        "\t\t\tgetText: getText, \n" +
				        "\t\t\t$q: $q,\n" +
				        "\t\t\tlisten: listen,\n" +
				        "\t\t\tlistenMemory: listenMemory,\n" +
				        "\t\t\tgetMemory: getMemory,\n" +
				        "\t\t\tnotify: notify\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\t$rootScope.$on('$locationChangeSuccess', function (event) {\n" +
				        "\t\t\tservice.route = $location.url();\n" +
				        "\t\t\tnotify('route_changed', $location.url());\n" +
				    "\t\t});\n" +
					"\t\t\n" +
				    "\t\treturn service;\n" +
					"\t\t\n" +
				    "\t\tfunction getText (module) {\n" +
				        "\t\t\treturn CONFIG[locale].text[module];\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\tfunction getQueryStingParam (param) {\n" +
				        "\t\t\tvar ret = null;\n" +
				        "\t\t\tvar query = window.location.search.substring(1);\n" +
				        "\t\t\tvar vars = query.split('&');\n" +
				        "\t\t\tvar l = vars.length;\n" +
				        "\t\t\tfor (var i = 0; i < l; i++) {\n" +
				            "\t\t\t\tvar pair = vars[i].split('=');\n" +
				            "\t\t\t\tif (pair[0] == param) {\n" +
				                "\t\t\t\t\tret = pair[1];\n" +
				            "\t\t\t\t}\n" +
				        "\t\t\t}\n" +
				        "\t\t\treturn ret;\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\t/* Using observer pattern over Angular's $emit/$on */\n" +
				    "\t\t/* Start listening now and disregard anything that has happend in the past */\n" +
				    "\t\tfunction listen (callback, event, id) {\n" +
				        "\t\t\tif(id) {\n" +
				            "\t\t\t\tif (!service.observers[event])\n" +
				                "\t\t\t\t\tservice.observers[event] = {};\n" +
				            "\t\t\t\tservice.observers[event][id] = [];\n" +
				            "\t\t\t\tservice.observers[event][id].push(callback);\n" +
				        "\t\t\t}\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\t/* Start listening now and update with the most recent past event data */\n" +
				    "\t\tfunction listenMemory (callback, event, id) {\n" +
				        "\t\t\tlisten(callback, event, id);\n" +
				        "\t\t\tif(service.memoryParameters[event])\n" +
				            "\t\t\t\tnotify(event, service.memoryParameters[event]);\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\tfunction getMemory (event) {\n" +
				        "\t\t\tif(service.memoryParameters[event])\n" +
				            "\t\t\t\treturn service.memoryParameters[event];\n" +
				        "\t\t\telse\n" +
				            "\t\t\t\treturn false;\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				    "\t\tfunction notify (event, parameters) {\n" +
				        "\t\t\tconsole.log('Event Notification: ' + event);\n" +
				        "\t\t\tif (arguments.length > 1)\n" +
				            "\t\t\t\tservice.memoryParameters[event] = parameters;\n" +
				        "\t\t\tfor (var id in service.observers[event]) {\n" +
				            "\t\t\t\tangular.forEach(service.observers[event][id], function (callback) {\n" +
				                "\t\t\t\t\tcallback(parameters);\n" +
				            "\t\t\t\t});\n" +
				        "\t\t\t};\n" +
				    "\t\t};\n" +
					"\t\t\n" +
				"\t}]);\n" +
			"})();";
	writeToFile(appName + '/static' + '/services/commonService.js', data);
}

function buildView (appName, view) {
	var viewName = toDash(view.name);
	var data = '<div id="' + appName + '-' + viewName + '">\n';
	for (var i = 0; i < view.modules.length; i++) {
		data += '\t<' + toDash(view.modules[i]).toLowerCase() + '></' + toDash(view.modules[i]).toLowerCase() + '>\n';
	};
	data += '</div>';
	writeToFile(appName + '/static' + '/views/' + viewName + '.html', data);
}

function buildService (appName, serviceName) {
	var data = "(function() {\n" +
				"\t'use strict';\n" +
				"\tangular.module('module-" + appName + "')\n" +
				"\t.service('" + serviceName + "Service', ['commonService', \n" +
				"\tfunction (commonService) {\n" +
					"\n" +
				    "\t\tvar service = {\n" +
				    "\t\t};\n" +
					"\n" +
				    "\t\treturn service;\n" +
					"\n" +
				"\t}]);\n" +
			"})();";
	writeToFile(appName + '/static' + '/services/' + serviceName + 'Service.js', data);
}

function buildConfigJS (appName, modules) {
	var moduleName;
	var data = "angular.module('module-" + appName + "').constant('CONFIG', {\n" +
					"\t'en-us': {\n" +
						"\t\ttext: {\n" +
						"\t\t\tmain: {},\n";
							for (var i = 0; i < modules.length; i++) {
								moduleName = toCamelCase(modules[i].name);
								data += '\t\t\t' + toUnderscore(moduleName) + ': {},\n';
							};
						data += "\t\t}\n" +
					"\t}\n" +
				"});";
	writeToFile(appName + '/static' + '/config.js', data);
}

function buildAppController (appName) {
	var data = "(function() {\n" +
					"\t'use strict';\n" +
					"\tangular.module('module-" + appName + "')\n" +
					"\t.controller('mainCtrl', ['commonService', \n" +
						"\tfunction (commonService) {\n" +
						"\t\tvar vm = this;\n" +
					    "\t\tvm.id = 'mainCtrl';\n" +
						"\t\tvm.text = commonService.getText('main');\n" +
						"\n" +
					"\t}]);\n" +
				"})();";
	writeToFile(appName + '/static' + '/mainController.js', data);
}

/* 
// Build Module Functions
*/
function buildModule (appName, module) {
	var moduleName = toCamelCase(module.name);
	makeDirectory(appName + '/static/modules/' + moduleName);
	buildModuleFile(appName, moduleName);
	buildController(appName, moduleName, module);
	buildTemplate(appName, moduleName);
}

function buildModuleFile (appName, moduleName) {
	var data = "angular.module('module-" + moduleName + "', [])\n" +
				".directive('" + moduleName + "', function () {\n" +
				    "\treturn {\n" +
				        "\t\trestrict: 'E',\n" +
				        "\t\treplace: false,\n" +
				        "\t\ttemplateUrl: '" + appName + "/modules/" + moduleName + "/" + moduleName + ".tmpl.html',\n" +
				        "\t\tcontroller: '" + moduleName + "Ctrl',\n" +
				        "\t\tcontrollerAs: '" + moduleName + "'\n" +
				    "\t};\n" +
				"});";
	writeToFile(appName + '/static' + '/modules/' + moduleName + '/' + moduleName + '.module.js', data);
}

function buildController (appName, moduleName, module) {
	var data = "(function() {\n" +
					"\t'use strict';\n" +
					"\tangular.module('module-" + moduleName + "')\n" +
					"\t.controller('" + moduleName + "Ctrl', ['commonService', ";
					for (var i = 0; i < module.services.length; i++) {
						data += "'" + toCamelCase(module.services[i]) + "Service', "
					};
					data += "\n\tfunction (commonService";
					for (var i = 0; i < module.services.length; i++) {
						data += ', ' + toCamelCase(module.services[i]);
					};
					data += ") {\n\t\tvar vm = this;\n" +
					    "\t\tvm.id = '" + moduleName + "Ctrl';\n" +
						"\t\tvm.text = commonService.getText('" + toUnderscore(moduleName) + "');\n" +
						"\n" +
					"\t}]);\n" +
				"})();";
	writeToFile(appName + '/static' + '/modules/' + moduleName + '/' + moduleName + 'Controller.js', data);
}

function buildTemplate (appName, moduleName) {
	var data = '<div id="' + appName + '-' + moduleName + '">\n\n</div>';
	writeToFile(appName + '/static' + '/modules/' + moduleName + '/' + moduleName + '.tmpl.html', data);
}


/*
// Utility Functions
*/
function puts(error, stdout, stderr) {
	console.log(stdout);
}

function copyHelperFiles (appName) {
	for (var i = 0; i < files.length; i++) {
		fs.createReadStream('filesToCopy/' + files[i]).pipe(fs.createWriteStream(appName + '/' + files[i]));
	};
}

function buildFolderStructure (appName) {
	makeDirectory(appName);
	makeDirectory(appName + '/static');
	for (var i = 0; i < folders.length; i++) {
		makeDirectory(appName + '/static/' + folders[i]);
	};
}

function makeDirectory (path) {
	try {
		fs.mkdirSync(path);
	} catch(e) {
		if (e.code != 'EEXIST')
			throw e;
	}
}

function writeToFile (path, data) {
	fs.writeFile(path, data, function(err) {
	    if (err) {
	        return console.log(err);
	    }
	}); 
}

function toCamelCase (str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
		return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
	}).replace(/\s+/g, '');
}

function toUnderscore (str){
	return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};

function toDash (str) {
	return str.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};


//Create a server
var server = app.listen(3521, function () {
	console.log('Server listening on', 3521)
});