var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');

var app = express();

const session = require('express-session')

const nocache = require("nocache");

const mongoose = require("mongoose")



//connect to MongoDB
const dbURI = "mongodb://0.0.0.0:27017/Mycollection"
mongoose.connect(dbURI)
  .then(() => console.log('connected to db'))
  .catch((err) => console.log(err))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// express-handlebars view engine setup

const hbs = require('express-handlebars')

app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: '../layout',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    addOne:function (value, options) {
      return parseInt(value) + 1;
    }
  }
}));



app.use(session({
  secret: "thisismysecretkey",
  saveUninitialized: true,
  cookie: { maxAge: 6000000 },
  resave: false
}));

app.use(nocache());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
