var express = require('express');
var router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('./model')

const { check, validationResult } = require('express-validator');

let session;

let currentUser;
let userData;

/* GET home page. */
router.get('/', function (req, res) {
  session = req.session
  if (session.userid) {
    res.redirect('/homepage');
  } else if (session.incorrectid) {
    const item = [{ message: 'Username does not exist' }]
    res.render('index', { item });
    req.session.destroy();
  } else if (session.incorrectpwd) {
    const item = [{ message: 'Incorrect password' }]
    res.render('index', { item });
    req.session.destroy();
  } else {
    res.render('index');
  }
});

router.get('/homepage', function (req, res) {
  session = req.session
  if (session.userid) {
    res.render('home', { title: 'Homepage', name: currentUser, data: userData })
  } else {
    res.redirect('/');
  }
});

router.post('/home', function (req, res) {
  let temp;
  User.find({ username: req.body.username })
    .then((result) => {
      temp = result.find(item => item.username)
      currentUser = temp.name
      userData = temp.data
      bcrypt.compare(req.body.password, temp.password)
        .then(function (result) {
          if (result) {
            session = req.session
            session.userid = true;
            res.redirect('/homepage');
            console.log(currentUser + '2')
          } else {
            session = req.session
            session.incorrectpwd = true;
            res.redirect('/');
          }
        });
    })
    .catch((err) => {
      console.log(err)
      session = req.session
      session.incorrectid = true;
      res.redirect('/');
    })
});

router.get('/signup', function (req, res) {
  session = req.session
  if (session.useralreadyexist) {
    res.render('signup', { usernameMsg: 'Username already exist' });
    req.session.destroy();
  } else {
    res.render('signup');
  }
});

router.post('/signup',
  check('name').notEmpty()
    .withMessage('Please enter a Name'),
  check('username').notEmpty()
    .withMessage('Please enter a username'),
  check('username').matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
    .withMessage("Username must be a valid email id"),
  check('password').matches(/[\w\d!@#$%^&*?]{8,}/)
    .withMessage("Password must contain at least eight characters"),
  check('password').matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter"),
  check('password').matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
  check('password').matches(/\d/)
    .withMessage("Password must contain at least one number"),
  check('password').matches(/[!@#$%^&*?]/)
    .withMessage("Password must contain at least one special character"),
  function (req, res) {
    const errors = validationResult(req);
    console.log(errors)
    var error1 = errors.errors.find(item => item.param === 'name') || '';
    var error2 = errors.errors.find(item => item.param === 'username') || '';
    var error3 = errors.errors.find(item => item.param === 'password') || '';
    console.log(error3.msg);
    if (!errors.isEmpty()) {
      res.render('signup', { nameMsg: error1.msg, usernameMsg: error2.msg, pwdMsg: error3.msg });
    } else {
      User.find({ username: req.body.username })
        .then((result) => {
          let b = result.find(item => item.username)
          let hashPassword;
          bcrypt.hash(req.body.password, 10)
            .then(function (hash) {
              hashPassword = hash
              if (b) {
                session = req.session;
                session.useralreadyexist = true;
                res.redirect('/signup');
              } else {
                const user = new User({
                  name: req.body.name,
                  data: req.body.data,
                  username: req.body.username,
                  password: hashPassword
                })
                user.save()
                  .then((result) => {
                    console.log('success')
                  })
                  .catch((err) => {
                    console.log(err)
                  })
                res.redirect('/');
              }
            })
            .catch((err) => {
              console.log(err)
            })
        })
        .catch((err) => {
          console.log(err)
        })
    }
  });

router.post('/logout', function (req, res) {
  session=req.session
  session.userid=false
  session.incorrectid=false
  session.incorrectpwd=false
  session.useralreadyexist=false
  res.redirect('/');
});

module.exports = router;
