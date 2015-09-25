'use strict';
angular.module('AngularBuilderApp')
.controller('builderController', ['$http'
function ($http) {

    var vm = this;
    vm.newViewName = '';
    vm.currentView = {};
    vm.views = {};
	vm.services = [];
	vm.modules = [];
	vm.addView = addView;
	vm.addModuleToView = addModuleToView;
	vm.addServiceToModule = addServiceToModule;
	vm.loadView = loadView;
	vm.loadModule = loadModule;

	function addView () {
		vm.views[vm.newViewName] = {
			name: vm.newViewName,
			modules: []
		};
	}

	function addModuleToView () {
		addModule(vm.newModuleName);
		if (vm.views[vm.currentView.name].modules.indexOf(vm.newModuleName) == -1)
			vm.views[vm.currentView.name].modules.push(vm.newModuleName);
		vm.newModuleName = '';
	}

	function addModule (moduleName) {
		vm.modules.push({
			name: moduleName,
			services: []
		});
	}

	function addServiceToModule () {
		addService(vm.newServiceName);
		if (!hasService(vm.currentModule, vm.newServiceName))
			vm.currentModule.services.push(vm.newServiceName);
		vm.newServiceName = '';
	}

	function addService (serviceName) {
		vm.services.push({
			name: serviceName,
			dependancies: [],
			methods: {},
		});
	}

	function addServiceDependancy (serviceName, dependancyName) {
		if (vm.services[serviceName].dependancies.indexOf(dependancyName) == -1)
			vm.services[serviceName].dependancies.push(dependancyName);
	}

	function addServiceMethod (serviceName, methodName, isPublic) {
		if (!vm.services[serviceName].methods[methodName])
			vm.services[serviceName].methods[methodName] = {
				name: methodName,
				isPublic: isPublic
			};
	}

	function removeServiceDependancy (serviceName, dependancyName) {
		var index = vm.services[serviceName].dependancies.indexOf(dependancyName);
		if (index > -1)
			vm.services[serviceName].dependancies.splice(index, 1);
	}

	function loadView (viewName) {
		vm.currentView = vm.views[viewName];
	}

	function loadModule (moduleName) {
		vm.currentModule = vm.modules.filter(function (module) {
			return module.name == moduleName;
		})[0];
		console.log(vm.modules)
		console.log(vm.currentModule)
	}

	function hasService (entity, serviceName) {
		var services = entity.services.filter(function (service) {
			return service.name == serviceName;
		});
		return services.length > 0;
	}

	function createApp () {
		var data = {
			views: vm.views,
			services: vm.services,
			modules: vm.modules
		};
		$http.post('/build', data).success(function (response) {
			vm.messageSuccess = response.message;
		}).error(function (response) {
			vm.messageError = response;		
		});
	}


}]);