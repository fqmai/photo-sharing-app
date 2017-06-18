'use strict';

cs142App.controller('UserFavoriteController', ['$scope', '$routeParams', '$resource', '$mdDialog', '$route',
    function ($scope, $routeParams, $resource, $mdDialog, $route) {

        var user = $resource('/user/' + $scope.main.login_id);
        user.get($scope.main.login_id, function (model) {
            $scope.favorite_photos = model.favorite_photos;
            $scope.main.pagename = "Favorites Photos";
        	$scope.main.title = $scope.main.pagename;
        });


		$scope.deleteFavorite = function(photo) {
			var deleteFavoriteRes = $resource('/deleteFavorite/' + photo._id);
            deleteFavoriteRes.delete(function() {
                $route.reload();
            });
		};

        $scope.photoModalDialog = function(event, image) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
           			$scope.image = image;
		            $scope.hide = function() {
		                $mdDialog.hide();
		            };
		            $scope.cancel = function() {
		                $mdDialog.cancel();
		            };
		        },
		        controllerAs: 'modal',
                templateUrl: 'components/user-favorite/photo-modalTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            });
        };

	}]);





    

