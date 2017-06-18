'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/favorites', {
                templateUrl: 'components/user-favorite/user-favoriteTemplate.html',
                controller: 'UserFavoriteController'
            }).
            when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
            otherwise({
                redirectTo: '/users'
            });
    }]);

cs142App.controller('MainController', ['$scope', '$rootScope', '$location', '$http', '$resource', '$routeParams', '$mdDialog','$route',
    function ($scope, $rootScope, $location, $http, $resource, $routeParams, $mdDialog, $route) {
        $scope.main = {};
        $scope.main.title = 'Users';
        $scope.main.myName = "Fengqing's Photo App";
        $scope.main.pagename = 'Users';
        $scope.main.login = false;
        $scope.main.greet = "Please Login";
        $scope.main.button = "LOG IN";
        $scope.main.showRegister = "REGISTER";

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if (!$scope.main.login) {
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
        });



        $scope.main.logout = function () {
            console.log("Successfully log out");
            $scope.main.login = false;
            $rootScope.$broadcast('loginStatus');
            var logoutRes = $resource("/admin/logout");
            logoutRes.save({}, function () {
                $scope.main.greet = 'Please Login';
                $location.path('/login-register');
            }, function errorHandling(err) {
                console.log(err);
                alert(err);
            });
        };

        $scope.main.newPostDialog = function(event) {
            $mdDialog.show({
                controller: PostController,
                templateUrl: 'components/user-photos/postTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            });
        };

        $scope.main.deleteUserDialog = function(event) {
            console.log("deleteUser");
            $mdDialog.show({
                controller: deleteController,
                templateUrl: 'components/user-photos/deleteTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            }).then(function(flag) {
                if (flag) {
                    var user = $resource('/deleteUser');
                    user.delete(function () {
                        $scope.main.login = false;
                        var userLogin = $resource("/admin/logout");
                        userLogin.save({}, function () {
                            $scope.main.login = false;
                            $scope.main.greet = 'Please Login';
                            $scope.main.pagename = 'Users';
                            $location.path('/login-register');
                        }, function errorHandling(err) {
                            console.log(err);
                            alert(err);
                        });
                    });
                }
            });
        };

        function deleteController($scope, $mdDialog) {
            $scope.hide = function() {
                $mdDialog.hide(0);
            };
            $scope.cancel = function() {
                $mdDialog.cancel(0);
            };
            $scope.delete = function() {
                $mdDialog.hide(1);
            };
        }

        function PostController($scope, $mdDialog) {
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            $scope.uploadPhoto = function() {
                if (!$scope.inputFileNameSelected()) {
                    console.error("uploadPhoto called will no selected file");
                    return;
                }
                console.log('fileSubmitted', selectedPhotoFile);

                // Create a DOM form and add the file to it under the name uploadedphoto
                var domForm = new FormData();
                domForm.append('uploadedphoto', selectedPhotoFile);

                // Using $http to POST the form
                $http.post('/photos/new', domForm, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                }).then(function successCallback(response){
                    $route.reload();
                    $mdDialog.hide();

                    // The photo was successfully uploaded. XXX - Do whatever you want on success.
                }, function errorCallback(response){
                    // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                    console.error('ERROR uploading photo', response);
                });

                
            };
            // Called on file selection - we simply save a reference to the file in selectedPhotoFile
            var selectedPhotoFile;   // Holds the last file selected by the user

            $scope.inputFileNameChanged = function (element) {
                selectedPhotoFile = element.files[0];
            };

            // Has the user selected a file?
            $scope.inputFileNameSelected = function () {
                return !!selectedPhotoFile;
            };
        }

    }]);
