const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');

const users = require('../controllers/users');
const { isLoggedIn,isUserVerified } = require('../middleware');

router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register))

router.route('/login')
    .get(users.renderLogin)
    .post(users.login)

router.get('/logout', users.logout)

router.get('/profile/:uid', isLoggedIn,isUserVerified, catchAsync(users.profilePage))

router.get('/all', isLoggedIn, isUserVerified,catchAsync(users.showUsers))

router.get('/main', isLoggedIn,isUserVerified, (req, res) => {
    res.render('main/index');
})

router.get('/verification',isLoggedIn,users.verificationPage)

router.get('/like/:uid/:skillId',isLoggedIn,isUserVerified,catchAsync(users.likeSkill))

module.exports = router;