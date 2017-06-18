'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource',
    function ($scope, $routeParams, $resource) {
        var user = $resource('/user/' + $routeParams.userId);
        user.get($routeParams.userId, function (model) {
            $scope.currentUser = model;
            $scope.main.pagename = $scope.currentUser.first_name + ' ' + $scope.currentUser.last_name + "'s Page";
            $scope.main.title = $scope.main.pagename;
        });

        $scope.findPhoto = false;

	    var mostRecentPhoto = $resource('/mostRecentPhoto/:id', {id: $routeParams.userId});
	    mostRecentPhoto.get($routeParams.userId, function (model) {
		    if (model._id === undefined) {
		        $scope.findPhoto = false;
		    } else {
		        $scope.mostRecentPhoto = model;
		        $scope.findPhoto = true;
		    }
	    });

	    $scope.numOfComments = 0;
	    var mostCommentsPhoto = $resource('/mostCommentsPhoto/:id', {id: $routeParams.userId});
	    mostCommentsPhoto.get($routeParams.userId, function (model) {
		    if (model._id !== undefined) {
		        $scope.mostCommentsPhoto = model;
		        $scope.numOfComments = model.comments.length;
		    }
	    });


    }]);

