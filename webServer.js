"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var fs = require("fs");

var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
var app = express();

// XXX - Your submission should work without this line
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

app.post('/admin/login', function (request, response) {
    User.findOne({login_name: request.body.login_name, password: request.body.password}, function (err, user) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
        } else if (user === null) {
            response.status(400).send('Not a valid username or incorrect password');
        } else {
            request.session.login_name = user.login_name;
            request.session.user_id = user._id;
            response.status(200).send(JSON.parse(JSON.stringify(user)));
        }
    });
});

app.post('/admin/logout', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    } 
    delete request.session.login_name;
    delete request.session.user_id;
    request.session.destroy(function (err) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
        } else {
            response.end();
        }
    });
    response.status(200).send('Successfully Logged out');

});


app.post('/admin/register', function (request, response) {
    function callback(error, newUser) {
        if (error) {
            response.status(500).send(JSON.stringify(error));
        } else {
            response.status(200).send(JSON.parse(JSON.stringify(newUser)));
        }
    }

    User.findOne({login_name: request.body.login_name}, function (err, user) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
        } else if (user !== null) {
            response.status(400).send('Username already exists');
        } else {
            User.create({first_name: request.body.first_name,
                            last_name: request.body.last_name,
                            location: request.body.location,
                            description: request.body.description,
                            occupation: request.body.occupation,
                            login_name: request.body.login_name,
                            password: request.body.password
                        }, callback);
            console.log('Successfully registered');
        }
    });
});

app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
    } else if (request.body.newComments === undefined) {
        response.status(400).send('Empty comment');
    } else {
        Photo.findById(request.params.photo_id, function (err, photo) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var newComment = {
                    comment: request.body.newComments,
                    date_time: Date.now(),
                    user_id: request.session.user_id
                };
                photo.comments.push(newComment);
                photo.save(function (error) {
                    if (error) {
                        response.status(400).send(JSON.stringify(error));
                    } else {
                        response.status(200).send(JSON.parse(JSON.stringify(photo)));
                    }
                });
            }
        });
    }
});

//adding new photos 
app.post('/photos/new', function(request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send();
    } else {
        processFormBody(request, response, function (err) {
            if (err || !request.file) {
                // XXX -  Insert error handling code here.
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log(request.file);
            // request.file has the following properties of interest
            //      fieldname      - Should be 'uploadedphoto' since that is what we sent
            //      originalname:  - The name of the file the user uploaded
            //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
            //      buffer:        - A node Buffer containing the contents of the file
            //      size:          - The size of the file in bytes

            // XXX - Do some validation here.
            // We need to create the file in the directory "images" under an unique name. We make
            // the original file name unique by adding a unique prefix with a timestamp.
            var timestamp = new Date().valueOf();
            var filename = 'U' +  String(timestamp) + request.file.originalname;

            fs.writeFile("./images/" + filename, request.file.buffer, function (err) { 
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                Photo.create({file_name: filename, date_time: timestamp, user_id: request.session.user_id}, function(error, newPhoto) { 
                    if (error) {
                        response.status(500).send(JSON.stringify(error));
                    } else {
                        response.status(200).send(JSON.parse(JSON.stringify(newPhoto)));
                    }
                });
            }

              // XXX - Once you have the file written into your images directory under the name
              // filename you can create the Photo object in the database
            });
        });
    }
});


app.get('/mostRecentPhoto/:id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    } 

    var id = request.params.id;
    Photo.find({'user_id': id}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        } else if (photos === null) {
            console.log('This user has no photo');
            response.status(200).send(null);
        } else {
            var photos_copy = JSON.parse(JSON.stringify(photos));
            delete photos_copy._id;
            delete photos_copy.comments;
            var target = photos_copy[0];
            for (var i = 1; i < photos_copy.length; i++) {
                if (photos_copy[i].date_time > target.date_time) {
                    target = photos_copy[i];
                }
            }
            response.status(200).send(target);
        }
    });
});

app.get('/mostCommentsPhoto/:id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    } 

    var id = request.params.id;
    Photo.find({'user_id': id}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photos === null) {
            console.log('This user has no photo');
            response.status(200).send(null);
        } else {
            var photos_copy = JSON.parse(JSON.stringify(photos));
            delete photos_copy._id;
            var target = photos_copy[0];
            for (var i = 1; i < photos_copy.length; ++i) {
                if (photos_copy[i].comments.length > target.comments.length) {
                    target = photos_copy[i];
                }
            }
            response.status(200).send(target);
        }
    });
});

app.delete('/deletePhoto/:photo_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }
    var photo_id = request.params.photo_id;
    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (!photo || photo.length === 0) {
            response.status(400).send('Photo with id ' + photo_id + 'not found');
            return;
        }
        if (String(photo.user_id) === request.session.user_id) {
            Photo.remove({_id: photo_id}, function(err) {
                if(err){
                    response.status(400).send(JSON.stringify(err));
                    return;
                } else {
                    response.status(200).send('Photo successfully deleted');
                }
            });
        } else {
            response.status(401).send('Failed to delete photo');
        }
    });
});

app.delete('/deleteComment/:photo_id/:comment_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }
    Photo.findOne({_id: request.params.photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
        } else {
            var i = 0;
            for (i; i < photo.comments.length; i++) {
                if (String(photo.comments[i]._id) === request.params.comment_id) {

                    photo.comments.splice(i, 1);
                    photo.save(function (error) {
                        if (error) {
                            response.status(400).send(JSON.stringify(error));
                        } else {
                            response.status(200).send('Comment successfully deleted');
                            return;
                        }
                    });
                }
            }
        }
    });
});

app.delete('/deleteUser', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }

    User.remove({_id: request.session.user_id}, function (err) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
        } else {

            Photo.find({user_id: request.session.user_id}, function (err, photos) {
                if (err) {
                    response.status(400).send(JSON.stringify(err));
                    return;
                  }
                for (var i = 0; i < photos.length; i++) {
                    delete photos[i];
                }
            });


            Photo.find({}, function (err, photos) {
                async.each(photos, function (photo, callback) {    
                    for (var i = 0; i < photo.comments.length; i++) {
                        if (String(photo.comments[i].user_id) === request.session.user_id) {
                            photo.comments.splice(i, 1);
                            photo.save(function (err) {
                                if (err) {
                                    response.status(400).send(JSON.stringify(err));
                                }
                            });
                        }
                    }
                    callback();
                }, function (err) {
                    if (err) {
                        response.status(400).send(JSON.stringify(err));
                    } else {
                        response.status(200).send('User successfully deleted');
                    }
                });
            });
        }
    });

});

// need modification
app.post('/likeVotes/:photo_id', function(request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }

    var photo_id = request.params.photo_id;
    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            response.status(500).send('Failed to like');
            return;
        }
        if (photo === undefined) {
            response.status(401).send('Invalid photo id');
        }
        var user_id = request.session.user_id;
            var i = photo.likes.indexOf(user_id);
            if(i < 0) {
                photo.likes.push(user_id);
                // console.log("like");
            } else {
                photo.likes.splice(i,1);
                // console.log("dislike");
            }
        photo.save();
        response.status(200).send('Successfully like or dislike');
        // console.log(photo_id);
    });
});


app.post('/favorite/:photo_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }
    var photo_id = request.params.photo_id;
    var user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        User.findOne({_id: user_id}, function(err, user) {
            if (err) {
                response.status(400).send(err);
                return;
            }
            User.findOne({_id: photo.user_id}, function(err, poster) {
                if (err) {
                    response.status(400).send(err);
                    return;
                }
                for(var i = 0; i < user.favorite_photos.length; i++) {
                    if(String(user.favorite_photos[i]._id) === String(photo._id)) {
                        response.end('Photo already in favorite.');
                        return;
                    }
                }

                user.favorite_photos.push({
                        _id: photo._id,
                        date_time: photo.date_time,
                        user_id: photo.user_id,
                        file_name: photo.file_name,
                        user_name: poster.first_name + ' ' + poster.last_name
                    });
                user.save();
                response.status(200).send('Successfully add favorite');
            });
        });
    });
});

app.delete('/deleteFavorite/:photo_id', function(request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet log in');
        return;
    }

    var photo_id = request.params.photo_id;
    var user_id = request.session.user_id;

    User.findOne({_id: user_id}, function(err, user) {
        if (err) {
            response.status(400).send(err);
            return;
        }
        for (var i = 0; i < user.favorite_photos.length; i++) {
            if (String(user.favorite_photos[i]._id) === String(photo_id)) {
                user.favorite_photos.splice(i, 1);
                user.save();
                response.status(200).send('Successfully delete favorite');
            }
        }
    });
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {

    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet logged in');
        return;
    }

    User.find({}, '_id first_name last_name', function (err, users) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
        } else {
            response.status(200).send(JSON.parse(JSON.stringify(users)));
        }
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    
    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet logged in');
        return;
    }

    var id = request.params.id;
    User.findOne({_id: id}, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
        } else if (user === undefined) {
            // User of this id not found
            console.log('User with _id:' + id + ' not found.');
            response.status(400).send('Not found');
        } else {
            // User found, and send the used object
            var userProperty = JSON.stringify(user);
            delete userProperty.login_name;
            delete userProperty.password;
            response.status(200).send(JSON.parse(JSON.stringify(userProperty)));
        }
    });
});




/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {

    if (!request.session || !request.session.login_name) {
        response.status(401).send('Not yet logged in');
        return;
    }

    var id = request.params.id;

    // Fetch all the photos created by the user with id.
    Photo.find({'user_id': id}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        // console.log(photos);
        // copy the photos array to add new properties to its items
        var photos_copy = JSON.parse(JSON.stringify(photos));

        // Do an async call to each photo from the photos of this user
        async.each(photos_copy, function (photo, done_callback) {
                
            // Do an async call to each comment of one photo
            async.each(photo.comments, function (comment, callback) {
                User.findById(comment.user_id, function (err, user) {
                    if (err) {
                        response.status(400).send(JSON.stringify(err));
                        return;
                    } else {
                        comment.user = {
                            '_id': comment.user_id,
                            'first_name': user.first_name,
                            'last_name': user.last_name
                        };
                        callback(err);
                    }
                });
            // handling error of comment processing
            }, function (err) {
                if (err) {
                    response.status(500).send(JSON.stringify(err));
                } else {
                    done_callback();
                }
            });
        // handling error of photo processing
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                response.status(200).send(photos_copy);
            }
        });
    });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


