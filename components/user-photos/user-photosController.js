'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$resource', '$mdDialog', '$route',
    function($scope, $routeParams, $resource, $mdDialog, $route) {



        $scope.like = function(photo) {
            if (photo.isliked) {
                --photo.numOfLikes;
            } else {
                ++photo.numOfLikes;
            }
            photo.isliked = !photo.isliked;
            var likeRes = $resource('/likeVotes/' + photo._id);
            likeRes.save();
        };

        $scope.favorite = function(photo) {
            var favoriteRes = $resource('/favorite/' + photo._id);
            favoriteRes.save();
            photo.isFavorited = true;
        }

        var userLikesPhoto = function(photoLikes) {
            if (photoLikes === undefined) {
                return false;
            }
            for (var i = 0; i < photoLikes.length; ++i) {
                if (photoLikes[i] === String($scope.main.login_id)) {
                    return true;
                }
            }
            return false;
        };
        
        var comparator = function(a, b) {
            if (a.numOfLikes != b.numOfLikes) {
                return b.numOfLikes - a.numOfLikes;
            } else {
                return Date.parse(b.date_time) - Date.parse(a.date_time);
            }
        }
              
        var user = $resource('/user/' + $scope.main.login_id);
        user.get($scope.main.login_id, function (model) {
            $scope.favorite_photos = model.favorite_photos;
        });


        var user = $resource('/user/' + $routeParams.userId);

        user.get($routeParams.userId, function (model) {
            $scope.currentUser = model;
            $scope.main.pagename = "Photos of " + $scope.currentUser.first_name + " " + $scope.currentUser.last_name;
            $scope.main.title = $scope.main.pagename;
        });

        var photos = $resource('/photosOfUser/' + $routeParams.userId);
        photos.query($routeParams.userId, function (model) {
            $scope.photos = model;
            // console.log(photos);
            for (var j = 0; j < $scope.photos.length; ++j) {
                $scope.photos[j].isliked = userLikesPhoto($scope.photos[j].likes);
                $scope.photos[j].numOfLikes = $scope.photos[j].likes.length;
                $scope.photos[j].isFavorited = false;
                for (var k = 0; k < $scope.favorite_photos.length; ++k) {
                    if (String($scope.favorite_photos[k]._id) === String($scope.photos[j]._id)) {
                        $scope.photos[j].isFavorited = true;
                        break;
                    }
                }
            }

            $scope.photos.sort(comparator);
        });




        $scope.newCommentDialog = function(event, photoId) {
            $mdDialog.show({
                controller: CommentController,
                templateUrl: 'components/user-photos/commentTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            }).then(function(newComment) {
                var commentRes = $resource('/commentsOfPhoto/' + photoId);
                commentRes.save({newComments: newComment}, function () {
                    $route.reload();
                }, function errorHandling(err) {
                    alert('Empty comment');
                    console.log(err);
                });
            });
        };

        $scope.deleteCommentDialog = function(event, photoId, commentId) {
            $mdDialog.show({
                controller: deleteController,
                templateUrl: 'components/user-photos/deleteTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            }).then(function(flag) {
                if (flag) {
                    var comments = $resource('/deleteComment/' + photoId + '/' + commentId);
                    comments.delete(function() {
                        $route.reload();
                    });
                }
            });
        };

        $scope.deletePhotoDialog = function(event, photoId) {
            $mdDialog.show({
                controller: deleteController,
                templateUrl: 'components/user-photos/deleteTemplate.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true
            }).then(function(flag) {
                if (flag) {
                    var photos = $resource('/deletePhoto/' + photoId);
                    photos.delete(function() {
                        $route.reload();
                    });
                }
            });
        };

        function CommentController($scope, $mdDialog) {
            $scope.postComment = function(newComment) {
                $mdDialog.hide(newComment);
            };
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        }


        function deleteController($scope, $mdDialog) {
            $scope.delete = function() {
                $mdDialog.hide(1);
            };
            $scope.hide = function() {
                $mdDialog.hide(0);
            };
            $scope.cancel = function() {
                $mdDialog.cancel(0);
            };
        }

    }]);




