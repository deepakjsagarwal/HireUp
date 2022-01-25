const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');

const users = require('../controllers/users');
const { isLoggedIn } = require('../middleware');

router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register))

router.route('/login')
    .get(users.renderLogin)
    .post(users.login)

router.get('/logout', users.logout)

router.get('/profile/:uid', isLoggedIn, catchAsync(users.profilePage))

router.get('/all', isLoggedIn, catchAsync(users.showUsers))

router.get('/main', isLoggedIn, (req, res) => {
    res.render('main/index');
})

module.exports = router;