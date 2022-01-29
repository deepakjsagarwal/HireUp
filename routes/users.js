const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');

const users = require('../controllers/users');
const { isLoggedIn,isUserVerified,isProfileComplete } = require('../middleware');


router.route('/basicRegister')
    .get(users.renderBasicRegister)
    .post(catchAsync(users.basicRegister))

router.route('/register',isLoggedIn,isUserVerified)
    .get(users.renderRegister)
    .post(catchAsync(users.register))

router.route('/edit',isLoggedIn,isUserVerified,isProfileComplete)
    .get(catchAsync(users.renderEditForm))
    .put(catchAsync(users.editProfile))

router.route('/login')
    .get(users.renderLogin)
    .post(users.login)

router.get('/logout', users.logout)

router.get('/profile/:uid', isLoggedIn,isUserVerified,catchAsync(isProfileComplete), catchAsync(users.profilePage))

router.get('/all', isLoggedIn, isUserVerified,catchAsync(isProfileComplete),catchAsync(users.showUsers))

router.get('/main', isLoggedIn,isUserVerified,catchAsync(isProfileComplete), (req, res) => {
    res.render('main/index');
})

router.route('/verification',isLoggedIn)
    .get(users.verificationPage)
    .post(users.verificationSend)

router.get('/like/:uid/:skillId',isLoggedIn,isUserVerified,catchAsync(isProfileComplete),catchAsync(users.likeSkill))

module.exports = router;