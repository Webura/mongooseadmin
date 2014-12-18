var mongoose = require('mongoose');
var fs = require('fs');

var tokens = [];
function getTitleFields(modelName) {
  var fields = '';
  var maxFields = 3;
  var schema = mongoose.models[modelName].schema.tree;
  for (var field in schema) {
    if (schema.hasOwnProperty(field) && maxFields > 0) {
      fields += field + ' ';
      maxFields--;
    }
  }
  return fields;
}


module.exports = function (path, options) {
  var Token = require('./token');
  Token.find(function (err, data) {
    if (err) console.error(err);
    data.forEach(function (token) {
      if (token.created < Date.now() - 1000 * 60 * 60 * 25 * 7)//1 week
        token.remove();
      else
        tokens.push(token.token);
    });
  });
  if (!options)
    options = {};

  function getAdminPage(callback) {
    fs.readFile(__dirname + '/views/admin.html', 'utf8', function (err, data) {
      if (err) console.error(err);
      var html = data.replace(/\{\{path\}\}/g, path);
      html = html.replace('{{css}}', options.css ? '<link rel="stylesheet" href="' + options.css + '">' : '');
      html = html.replace('{{js}}', options.js ? '<script src="' + options.js + '"></script>' : '');
      html = html.replace(/\{\{title\}\}/g, options.title || 'mongooseadmin');
      callback(html);
    });
  }

  return function adminMiddleware(req, res, next) {
    if (req.path.indexOf(path) === 0) {
      //STATIC FILES
      if (req.path == path + '/bootstrap.min.css')
        res.sendFile(__dirname + '/static/bootstrap.min.css');
      else if (req.path == path + '/jquery.min.js')
        res.sendFile(__dirname + '/static/jquery.min.js');
      else if (req.path == path + '/bootstrap.min.js')
        res.sendFile(__dirname + '/static/bootstrap.min.js');
      else if (req.path == (path + '/logout')) {
        res.cookie('admintoken', null);
        res.redirect(path);
      } else if (!options.authentication || (req.cookies && req.cookies.admintoken && tokens.indexOf(req.cookies.admintoken) >= 0)) {
        //PAGE
        if (req.path == path)
          getAdminPage(function (html) {
            res.end(html);
          });
        //GET MODELS AND SCHEMAS
        else if (req.path == path + '/models') {
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
                if (tree[field].ref)
                  schema[field].ref = tree[field].ref;
              }

              schemas[key] = schema;
            }
          res.send(schemas);
          //GET ROWS FROM MODEL
        } else if (req.path.indexOf(path + '/models/') === 0) {
          var modelName = req.path.replace(path + '/models/', '');
          var fields = getTitleFields(modelName);
          mongoose.models[modelName].find().select(fields + '_id').exec(function (err, data) {
            if (err) throw err;
            res.send({data: data, fields: fields.trim().split(' ')});
          });
          //GET DATA FROM MODEL AND ID
        } else if (req.path.indexOf(path + '/data/') === 0) {
          var modelName = req.path.replace(path + '/data/', '');
          modelName = modelName.substring(0, modelName.indexOf('/'));
          var id = req.path.replace(path + '/data/' + modelName + '/', '');
          mongoose.models[modelName].findOne({_id: id}, function (err, data) {
            if (err) throw err;
            res.send(data);
          })
        } else if (req.path == (path + '/insert')) {
          var modelName = req.param('modelName');
          var data = JSON.parse(req.param('data'));
          mongoose.models[modelName].create(data, function (err) {
            if (err)
              res.send(JSON.stringify(err));
            else
              res.send('OK');
          });
        } else if (req.path == (path + '/update')) {
          var modelName = req.param('modelName');
          var data = JSON.parse(req.param('data'));
          var id = data._id;
          delete data._id;
          mongoose.models[modelName].update({_id: mongoose.Types.ObjectId(id)}, data, function (err) {
            if (err)
              res.send(JSON.stringify(err));
            else
              res.send('OK');
          });

        } else if (req.path == (path + '/delete')) {
          var modelName = req.param('modelName');
          var data = JSON.parse(req.param('data'));
          mongoose.models[modelName].findOne({_id: mongoose.Types.ObjectId(data._id)}, function (err, model) {
            model.remove(function (err) {
              if (err)
                res.send(JSON.stringify(err));
              else
                res.send('OK');
            });
          });
        } else
          next();

      } else if (req.path == path) {
        if (req.method == 'POST') {
          options.authentication(req.param('username'), req.param('password'), function (authenticated) {
            if (authenticated)
              getAdminPage(function (html) {
                var token = Math.random().toString();
                res.cookie('admintoken', token);
                tokens.push(token);
                Token.create({token: token});
                res.end(html);
              });
            else
              fs.readFile(__dirname + '/views/login.html', 'utf8', function (err, data) {
                if (err) console.error(err);
                res.end(data.replace(/\{\{path\}\}/g, path));
              });
          });
        } else {
          if (options.login)
            res.redirect(options.login);
          else
            fs.readFile(__dirname + '/views/login.html', 'utf8', function (err, data) {
              if (err) console.error(err);
              res.end(data.replace(/\{\{path\}\}/g, path));
            });
        }
      } else
        res.status(404).send('Page not found');
    } else
      next();
  };
};