var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var author = new Schema({
  name: {type: String, required: 'Name is required', index: {unique: true}},
  isAlive: Boolean,
  age: {type: Number, default: 0}
});
exports.Author = mongoose.model('Author', author);


var book = new Schema({
  title: {type: String, required: 'Title is required'},
  published: {type: Date},
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Author',
    required: 'Author is required',
    index: {unique: false}
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: 'Category is required',
    index: {unique: false}
  },
  created: {type: Number, default: Date.now}
});
book.index({title: 1, published: -1}, {unique: false});
exports.Book = mongoose.model('Book', book);

var category = new Schema({
  title: {type: String, required: 'Title is required'}
});
exports.Category = mongoose.model('Category', category);

var user = new mongoose.Schema({
  email: {type: String, unique: true, lowercase: true},
  profile: {
    name: {type: String, default: ''},
    age: {type: Number, default: 0}
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
exports.User = mongoose.model('User', user);

