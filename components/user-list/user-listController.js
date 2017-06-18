'use strict';

cs142App.controller('UserListController', ['$scope', '$resource',
    function ($scope, $resource) {

    	$scope.$on("loginStatus", function() {
    		if ($scope.main.login) {
    			var users = $resource('/user/list');
		        users.query({}, function (model) {
		            $scope.userList = model;
		        });
    		} else {
    			$scope.userList = [];
    		}
	    });



    }]);

