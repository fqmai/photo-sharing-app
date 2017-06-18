/**
 * Created by Qian on 5/25/2016.
 */
'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$location', '$resource', '$rootScope', '$mdDialog', '$route',
    function ($scope, $location, $resource, $rootScope, $mdDialog, $route) {

        $scope.login = function () {
            var userLogin = $resource("/admin/login");
            userLogin.save({login_name: $scope.login_name, password: $scope.password}, function (user) {
                $scope.main.login = true;
                $rootScope.$broadcast('loginStatus');
                $scope.main.greet = 'Hello ' + user.first_name;
                $scope.main.button = "LOG OUT";
                $scope.main.login_id = user._id;
                $scope.main.login_name = user.first_name + ' ' + user.last_name;
                $location.path('/users/' + user._id);
            }, function errorHandling(err) {
                console.log(err);
                alert('Incorrect username or password');
                $scope.login_name = '';
                $scope.password = '';
            });
        };

        $scope.main.showRegister = "REGISTER";
        $scope.showRegister = function() {
            if ($scope.main.showRegister === "REGISTER") {
                $scope.main.showRegister = "HIDE REGISTER";
            } else {
                $scope.main.showRegister = "REGISTER";
            }
        };

        $scope.register = function(info) {
            var userRegister = $resource("/admin/register");
            userRegister.save(info, function() {
                $route.reload();
            }, function errorHandling(err) {
                alert("Registration failed");
                console.log(err);
            });
        };

    }]);

