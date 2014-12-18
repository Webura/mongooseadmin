MongooseAdmin
=============

Minimalist admin page for Node.js projects using Mongoose and Express.js.


Why
---
Main usage will be for small projects where you need an admin page for CRUD operations.
Just add it as a middleware and use it.
When your project grows and you have spent days to develop you own admin page, you can remove MongooseAdmin.

Screenshots
-----------
![Screenshot](https://raw.githubusercontent.com/Webura/mongooseadmin/master/screenshots/login.png "Screenshot")
![Screenshot](https://raw.githubusercontent.com/Webura/mongooseadmin/master/screenshots/mongooseadmin.png "Screenshot")

What to expect
--------------
1. Create CRUD operations on the models defined in Mongoose
2. Hook it in as a Express.js middleware.
3. Options to change authentication etc.


Install
-------
`npm install mongooseadmin`

How to use
----------
Basic usage
```
var mongooseadmin = require('mongooseadmin');
app.use(mongooseadmin('/admin'));
```



Options
-------
You can extend with options:

```
var options = {
    title: 'My awesome admin page';
    }
app.use(mongooseadmin('/admin', options));
```

###title
Changes the page title. Default is 'mongooseadmin'.

###authentication
A function that takes the parameters username, password and callback.
The callback expects to receive a boolean value for if the username and password is valid. Example
```
var options = {
    authentication:
        function (username, password, callback) {
            callback(username == 'johndoe' && password == 'supersecret');
        }
    };
```

###css
Add your own css file. Example:
```
var options = {
    css: '/public/myown.css'
    };
```

###js
Add your own javascript file. Example:
```
var options = {
    css: '/public/myown.js'
    };
```

###login
Add your own login url. Just add a FORM that post to your admin url with username and password. Example:
```
var options = {
    css: '/login'
    };
```



Next steps
----------
- Options for title, layout, etc
- Add search filters
- Better support for references by ObjectId
- Support for sub documents

License
-------

(The MIT License)

Copyright (c) 2014 Johnny Tsang

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.