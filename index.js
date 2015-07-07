var mongoose = require('mongoose');
var mongooserest = require('mongooserest');
var express = require('express');
var fs = require('fs');
var Token = require('./token');

var tokens = [];

Token.find(function (err, data) {
  if (err) console.error(err);
  data.forEach(function (token) {
    if (token.created < Date.now() - 1000 * 60 * 60 * 25 * 7 * 2)//2 weeks
      token.remove();
    else
      tokens.push(token.token);
  });
});

module.exports = function (options) {
  options = options || {};
  var router = express.Router();

  function authorize(req, res, next) {
    if (!options.authentication || (req.cookies && req.cookies.admintoken && tokens.indexOf(req.cookies.admintoken) >= 0)) {
      next();
    } else {
      if (options.login)
        res.redirect(options.login);
      else
        fs.readFile(__dirname + '/views/login.html', 'utf8', function (err, data) {
          if (err) console.error(err);
          res.end(data.replace(/\{\{path\}\}/g, req.baseUrl));
        });
    }
  }

  router.get('/bootstrap.min.css', function (req, res) {
    res.sendFile(__dirname + '/static/bootstrap.min.css');
  });
  router.get('/jquery.min.js', function (req, res) {
    res.sendFile(__dirname + '/static/jquery.min.js');
  });
  router.get('/bootstrap.min.js', function (req, res) {
    res.sendFile(__dirname + '/static/bootstrap.min.js');
  });
  router.get('/logout', function (req, res) {
    res.cookie('admintoken', null);
    res.redirect(req.baseUrl);
  });

  router.post('/', function (req, res) {
    options.authentication(req.body['username'], req.body['password'], function (authenticated) {
      if (authenticated) {
        var token = Math.random().toString();
        res.cookie('admintoken', token);
        tokens.push(token);
        Token.create({token: token});
        res.redirect(req.baseUrl);
      } else
        fs.readFile(__dirname + '/views/login.html', 'utf8', function (err, data) {
          if (err) console.error(err);
          res.end(data.replace(/\{\{path\}\}/g, req.baseUrl));
        });
    });
  });
  router.use(authorize);
  router.get('/', function (req, res) {
    fs.readFile(__dirname + '/views/admin.html', 'utf8', function (err, data) {
      if (err) console.error(err);
      var html = data.replace(/\{\{path\}\}/g, req.baseUrl);
      html = html.replace('{{css}}', options.css ? '<link rel="stylesheet" href="' + options.css + '">' : '');
      html = html.replace('{{js}}', options.js ? '<script src="' + options.js + '"></script>' : '');
      html = html.replace(/\{\{title\}\}/g, options.title || 'mongooseadmin');
      res.send(html);
    });
  });
  router.use('/api', mongooserest(mongoose));


  router.get('/models', function (req, res) {
    var schemas = {};
    for (var key in mongoose.models)
      if (mongoose.models.hasOwnProperty(key) && key != 'MongooseadminToken') {
        var schema = JSON.parse(JSON.stringify(mongoose.models[key].schema.paths));
        var tree = mongoose.models[key].schema.tree;
        for (var field in schema) {
          if (!schema[field].instance) {
            if (typeof tree[field] == 'object')
              schema[field].instance = tree[field].type.name;
            else
              schema[field].instance = tree[field].name;
          }
          if (tree[field] && tree[field].ref)
            schema[field].ref = tree[field].ref;
        }
        schema._indexes = mongoose.models[key].schema._indexes;
        schemas[key] = schema;
      }
    res.send(schemas);
  });
  return router;
};