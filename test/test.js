var express = require('express');
var app = express();
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var mongooseadmin = require('../index');
var bodyParser = require('body-parser');
var models = require('./models');

mongoose.connect('mongodb://localhost:27017/mongooseadmin', function () {
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  app.use(cookieParser());

  app.use('/admin', mongooseadmin({
    authentication: function (username, password, callback) {
      callback(username == 'test' && password == 'test');
    },
    title: 'Mongooseadmin Test'
  }));

  app.get('/', function (req, res) {
    res.send('<a href="/admin">to admin</a>');
  });

  app.listen(3000, function () {
    console.log('EXPRESS: server listening on port ' + 3000);
  });
});
