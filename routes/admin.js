var express = require('express');
var router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('./model')

const { check, validationResult } = require('express-validator');

let adminSession;

/* GET home page. */
router.get('/', function (req, res) {
    adminSession = req.session
    console.log(adminSession)
    console.log(adminSession.adminid)
    if (adminSession.adminid) {
        res.redirect('/admin/adminHomepage');
    } else if (adminSession.incorrect) {
        req.session.destroy();
        const item = [{ message: 'Incorrect username or password' }]
        res.render('adminLogin', { item });
    } else {
        res.render('adminLogin');
    }
});



router.post('/adminHome', function (req, res) {
    if (req.body.username === 'admin' && req.body.password === 'Admin@123') {
        adminSession = req.session
        adminSession.adminid = true;
        res.redirect('/admin/adminHomepage');
    } else {
        adminSession = req.session
        adminSession.incorrect = true;
        res.redirect('/admin');
    }
});

router.get('/adminHomepage', function (req, res) {
    adminSession = req.session;
    User.find({}).sort({_id:-1})
        .then((result) => {
            if (adminSession.adminid) {
                
                res.render('adminHome', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminSearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminid) {
        User.find({ $or: [{ username: req.body.input }, { name: req.body.input }] })
            .then((result) => {
                if (adminSession.adminid && req.body.input) {
                    res.render('adminHome', { result })
                } else {
                    res.redirect('/admin');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin');
    }
});

router.get('/addNewUser', function (req, res) {
    adminSession = req.session
    if (adminSession.adminid) {
        if (adminSession.alreadyexist) {
            adminSession = req.session
            adminSession.adminid = true;
            res.render('addNewUser', { usernameMsg: 'Username already exist' });
            req.session.destroy();
        } else {
            res.render('addNewUser');
        }
    } else {
        res.redirect('/admin');
    }
});

router.post('/addNewUser',
    check('name').notEmpty().withMessage('Please enter a Name'),
    check('username').notEmpty().withMessage('Please enter a username'),
    check('name').notEmpty().withMessage('Please enter a Name'),
    check('username').notEmpty().withMessage('Please enter a username'),
    check('username').matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
    .withMessage("Username must be a valid email id"),
    check('password').matches(/[A-Za-z\d!@#$%^&*?]{8,}/)
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
        adminSession = req.session;
        if (!errors.isEmpty()) {
            res.render('addNewUser', { nameMsg: error1.msg, usernameMsg: error2.msg, pwdMsg: error3.msg });
        } else if (adminSession.adminid) {
            User.find({ username: req.body.username })
                .then((result) => {
                    let b = result.find(item => item.username)
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10).then(function (hash) {
                        hashPassword = hash
                        if (b) {
                            adminSession = req.session;
                            adminSession.alreadyexist = true;
                            res.redirect('/admin/addNewUser');
                        } else {
                            const user = new User({
                                name: req.body.name,
                                data: req.body.data,
                                username: req.body.username,
                                password: hashPassword
                            })
                            user.save()
                                .then((result) => {
                                    console.log(result)
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                            adminSession = req.session;
                            console.log(adminSession)
                            res.redirect('/admin');
                        }
                    })
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin');
        }
    });

router.get('/edit/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session;
    if (adminSession.adminid) {
        User.find({ _id: userId })
            .then((result) => {
                
                let current = result.find(item => item.username)
                
                res.render('editUser', current)
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin')
    }
});

router.post('/editUser/:id', function (req, res) {
    console.log(req.params);
    console.log(req.body);
    console.log(req.body.oldData);
    console.log(req.body.oldName);
    let newUserId = req.params.id;
    console.log(newUserId);
    let newData;
    adminSession = req.session;
    if (adminSession.adminid) {
        if (req.body.newData) {
            User.updateOne({ _id: newUserId }, { $set: { data: req.body.newData } })
                .then((result) => {
                    
                    res.redirect('/admin')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin')
        }
        if (req.body.newName) {
            User.updateOne({ _id: newUserId }, { $set: { name: req.body.newName } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin')
        }
    } else {
        res.redirect('/admin')
    }
})

router.get('/delete/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminid) {
        User.deleteOne({ _id: userId })
            .then((result) => {
                if (adminSession.adminid && req.body.input) {
                    res.render('adminHome', { result })
                } else {
                    res.redirect('/admin');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin');
    }
});



router.post('/adminLogout', function (req, res) {
    adminSession=req.session
    adminSession.adminid=false
    adminSession.incorrect=false
    adminSession.alreadyexist=false
    res.redirect('/admin');
});



module.exports = router;