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
  if (!options) options = {};
  return function adminMiddleware(req, res, next) {
    console.log(req.cookies.admintoken);
    if (req.path.indexOf(path) === 0) {
      //STATIC FILES
      if (req.path == path + '/bootstrap.min.css')
        res.sendFile(__dirname + '/static/bootstrap.min.css');
      else if (req.path == path + '/jquery.min.js')
        res.sendFile(__dirname + '/static/jquery.min.js');
      else if (req.path == path + '/bootstrap.min.js')
        res.sendFile(__dirname + '/static/bootstrap.min.js');
      else if (!options.authentication || (req.cookies && req.cookies.admintoken && tokens.indexOf(req.cookies.admintoken) >= 0)) {
        //PAGE
        if (req.path == path)
          fs.readFile(__dirname + '/static/admin.html', 'utf8', function (err, data) {
            if (err) console.error(err);
            res.end(data.replace(/\{\{path\}\}/g, path));
          });
        //GET MODELS AND SCHEMAS
        else if (req.path == path + '/models') {
          var models = {};
          for (var key in mongoose.models)
            if (mongoose.models.hasOwnProperty(key))
              models[key] = mongoose.models[key].schema.paths;
          res.send(models);
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
          console.log(req.param('username'), req.param('password'));
          options.authentication(req.param('username'), req.param('password'), function (authenticated) {
            if (authenticated)
              fs.readFile(__dirname + '/static/admin.html', 'utf8', function (err, data) {
                var token = Math.random().toString();
                res.cookie('admintoken', token);
                tokens.push(token);
                if (err) console.error(err);
                res.end(data.replace(/\{\{path\}\}/g, path));
              });
            else
              fs.readFile(__dirname + '/static/login.html', 'utf8', function (err, data) {
                if (err) console.error(err);
                res.end(data.replace(/\{\{path\}\}/g, path));
              });
          });
        } else fs.readFile(__dirname + '/static/login.html', 'utf8', function (err, data) {
          if (err) console.error(err);
          res.end(data.replace(/\{\{path\}\}/g, path));
        });
      } else
        res.status(404).send('Page not found');
    } else
      next();
  };
};