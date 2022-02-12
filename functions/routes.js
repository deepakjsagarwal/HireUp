const express = require("express");
const router = express.Router();
const catchAsync = require("./utils/catchAsync");

const users = require("./controllers/users");
const { isLoggedIn, isUserVerified, isProfileComplete } = require("./middleware");

router.route("/").get(users.renderHome);
router.route("/home").get(users.renderHome);

router.route("/faq").get(users.renderFaq);

router.route("/basicRegister")
    .get(users.renderBasicRegister)
    .post(catchAsync(users.basicRegister));

router.route("/register")
    .get(isLoggedIn, isUserVerified, users.renderRegister)
    .post(isLoggedIn, isUserVerified, catchAsync(users.register));

router.route("/edit")
    .get(isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.renderEditForm))
    .put(isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.editProfile));

router.route("/login")
    .get(users.renderLogin)
    .post(users.login);

router.get("/logout", users.logout);

router.get("/profile/:uid", isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.profilePage));

router.get("/all", isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.showUsers));

router.route("/verification")
    .get(isLoggedIn, users.verificationPage)
    .post(isLoggedIn, users.verificationSend);

router.get("/like/:uid/:skillId", isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.likeSkill));

router.get("/refer/:uid", isLoggedIn, isUserVerified, catchAsync(isProfileComplete), catchAsync(users.referUser));

router.route("/forgotPassword")
    .get(users.renderForgotPassword)
    .post(users.forgotPassword);

router.route('/uploadResume')
    .get(isLoggedIn, isUserVerified, catchAsync(isProfileComplete), users.renderUploadFile)
    .post(isLoggedIn, isUserVerified, catchAsync(isProfileComplete), users.uploadFile)

module.exports = router;