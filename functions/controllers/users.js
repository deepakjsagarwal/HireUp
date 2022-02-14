const { companies } = require('../public/javascripts/companies');
const { skills } = require('../public/javascripts/skills')

// Initialize Firebase config.
const firebase = require("firebase");
const { firebaseConfig } = require('../config');
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Database.
const db = firebase.firestore();
const usersRef = db.collection('users');

// ---------- HOME ----------
module.exports.renderHome = (req, res) => {
    res.render('home');
}

// ---------- HOME ----------
module.exports.renderFaq = (req, res) => {
    res.render('faq');
}

// ---------- REGISTER ----------
module.exports.renderBasicRegister = (req, res) => {
    res.render('users/basicRegister')
}
module.exports.renderRegister = (req, res) => {
    res.render('users/register', { companies, skills })
}
module.exports.basicRegister = async(req, res) => {
    const { name, email, password } = req.body;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async(userCredential) => {
            // Sign-In user and Add details about the user.
            var user = userCredential.user;

            user.updateProfile({
                displayName: name,
            }).then(() => {
                // Update successful
                user.sendEmailVerification()
                    .then(() => {
                        // Send verification link and log Out.
                        firebase.auth().signOut()
                            .then(() => {
                                // Sign-out successful.
                                req.flash('success', "Verification Link has been sent to your email. Please verify email and login on HireUp.")
                                res.redirect('/');
                            })
                    })
            })
        })
        .catch((error) => {
            // An error happened.
            req.flash('error', error.message);
            res.redirect('/basicRegister')
        });
}

module.exports.register = async(req, res) => {
    const { college, company, degree, title, linkedinURL, skills, dreamCompanies } = req.body;

    const user = req.session.currentUser;
    await usersRef.doc(user.uid).set({ college, company, degree, title, linkedinURL, dreamCompanies, name: user.name, email: user.email, referredByUsers: [], referralsProvidedToUsers: [] })
    for (let skill of skills)
        await usersRef.doc(user.uid).collection('skills').doc(skill).set({ user: [] });

    res.redirect(`/profile/${user.uid}`);
}

// ---------- LOGIN ----------
module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}


const admin = require("firebase-admin");

module.exports.login = (req, res) => {
    const { email, password } = req.body;
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // As httpOnly cookies are to be used, do not persist any state client side.
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sign-in successful.
            const user = userCredential.user;
            user.getIdToken().then((idToken)=>{
                admin.auth().createSessionCookie(idToken,{expiresIn})
                    .then((sessionCookie)=>{
                        const options = { maxAge: expiresIn, httpOnly: true };
                        res.cookie("session", sessionCookie, options);
                        const redirectUrl = req.session.returnTo || `/profile/${user.uid}`
                        delete req.session.returnTo;
                        firebase.auth().signOut();
                        res.redirect(redirectUrl)
                    },
                    (error)=>{
                        res.send(error.message);
                    })
            })
            
        })
        .catch((error) => {
            // An error happened.
            req.flash('error', error.message);
            res.redirect('/login')
        });
}

// ---------- LOGOUT ----------
module.exports.logout = (req, res) => {
    firebase.auth().signOut()
        .then(() => {
            // Sign-out successful.
            res.redirect('/');
        })
        .catch((error) => {
            // An error happened.
            req.flash('error', error.message);
        });
}

// ---------- LOOKUPS ----------
module.exports.profilePage = async(req, res, next) => {
    const uid = req.params.uid;
    const doc = await usersRef.doc(uid).get();
    if (!doc.exists) {
        next();
    } else {
        const user = await makeUser(doc,req);
        const interestedUsers = [];
        for (let interestedUser of user.referredByUsers) {
            const userDoc = await usersRef.doc(interestedUser.uid).get();
            interestedUsers.push(await makeUser(userDoc,req))
        }

        const referralsProvidedToUsers = [];
        for (let referralProvidedToUser of user.referralsProvidedToUsers) {
            const userDoc = await usersRef.doc(referralProvidedToUser.uid).get();
            referralsProvidedToUsers.push(await makeUser(userDoc,req))
        }

        res.render('users/profile', { user, interestedUsers, referralsProvidedToUsers })
    }
}

module.exports.showUsers = async(req, res, next) => {
    var currentUser = req.session.currentUser;
    await usersRef.doc(currentUser.uid).get()
        .then(async(doc) => {
            if (doc.exists) {

                currentUser = {...doc.data(), uid: currentUser.uid };
                const usersDoc = await usersRef.where('dreamCompanies', 'array-contains', currentUser.company).get();
                const allUsersWithCurrentUserCompany = await Promise.all(usersDoc.docs.map((doc) => makeUser(doc,req)));

                const allNonReferredUserWithCurrentUserCompany = allUsersWithCurrentUserCompany.filter(
                    user => user.referredByUsers.filter(u => u.company === currentUser.company).length === 0
                );

                res.render("users/all", { users: allNonReferredUserWithCurrentUserCompany, currentUser });

            } else {
                // doc.data() will be undefined in this case
                next();
            }
        })
        .catch((error) => {
            req.flash('error', error.message)
            res.redirect('/');
        });
}

async function makeUser(doc,req) {
    const skills = [];
    const skillsSnapshot = await usersRef.doc(doc.id).collection('skills').get();
    skillsSnapshot.forEach(doc => {
        const usersLiked = doc.data().user;
        skills.push({ name: doc.id, liked: usersLiked.includes(req.session.currentUser.uid), usersLikedLength: usersLiked.length });
    });
    const user = {...doc.data(), skills, uid: doc.id };
    return user;
}

module.exports.likeSkill = async(req, res) => {
    const { uid, skillId } = req.params;
    const { alreadyLiked, red } = req.query;
    if (req.session.currentUser.uid === uid) {
        req.flash("error", "That was smart! You can't like yourself. 😁")
        return res.redirect(`/profile/${req.session.currentUser.uid}`);
    }

    if (alreadyLiked === "true") {
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayRemove(req.session.currentUser.uid)
        });
    } else {
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayUnion(req.session.currentUser.uid)
        });
    }
    if (red) {
        return res.redirect(`/profile/${red}`)
    }
    res.redirect('/all');
}

// -------- Verifications ----------------
module.exports.verificationPage = (req, res) => {
    if (req.session.currentUser.email_verified) {
        res.redirect(`/profile/${req.session.currentUser.uid}`)
    } else {
        res.render('users/verification')
    }
}

module.exports.verificationSend = (req, res) => {
    req.session.currentUser.sendEmailVerification()
        .then(() => {
            // Send verification link and log Out.
            firebase.auth().signOut()
                .then(() => {
                    // Sign-out successful.
                    req.flash('success', "Verify your email and come back :)")
                    res.redirect('/');
                })
        })
        .catch((error) => {
            firebase.auth().signOut()
                .then(() => {
                    // Sign-out successful.
                })
            req.flash('error', error.message);
            res.redirect('/')
        })
}

// ---------- Editing Profile ----------------
module.exports.renderEditForm = async(req, res) => {
    const user = req.session.currentUser;
    const doc = await usersRef.doc(user.uid).get();
    if (!doc.exists) {
        next();
    } else {
        const user = await makeUser(doc,req);
        res.render('users/edit', { user, skills, companies })
    }
}

module.exports.editProfile = async(req, res) => {
    const { name, college, company, degree, title, linkedinURL, skills, dreamCompanies, presentSkills } = req.body;

    const user = req.session.currentUser;
    user.updateProfile({
        displayName: name,
    });

    await usersRef.doc(user.uid).update({ college, company, degree, title, linkedinURL, dreamCompanies, name })
    if (presentSkills) {
        for (let presentSkill of presentSkills) {
            await usersRef.doc(user.uid).collection('skills').doc(presentSkill).delete();
        }
    }
    if (skills) {
        for (let skill of skills)
            await usersRef.doc(user.uid).collection('skills').doc(skill).set({ user: [] });
    }
    res.redirect(`/profile/${user.uid}`);
}

// ---------- REFER -------------
module.exports.referUser = async(req, res) => {
    const currentUserDoc = await usersRef.doc(req.session.currentUser.uid).get();

    const currentUser = await makeUser(currentUserDoc,req);
    const { uid } = req.params;

    await usersRef.doc(uid).update({
        referredByUsers: firebase.firestore.FieldValue.arrayUnion({ uid: currentUser.uid, company: currentUser.company })
    });
    await usersRef.doc(req.session.currentUser.uid).update({
        referralsProvidedToUsers: firebase.firestore.FieldValue.arrayUnion({ uid, company: currentUser.company })
    })
    req.flash('success', 'Thanks for Referring! Please use the following details for the referral.');
    res.redirect(`/profile/${uid}`);
}


// --------- FORGOT PASSWORD --------

module.exports.renderForgotPassword = (req, res) => {
    res.render('users/forgotPassword');
}
module.exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            // Password reset email sent!
            req.flash('success', "Password Reset Link has been Sent.")
            res.redirect('/login');

        })
        .catch((error) => {
            req.flash('error', error.message)
            res.redirect('/forgotPassword');
        });
}

// -------- UPLOAD RESUME -----------

module.exports.renderUploadFile = async(req, res) => {
    const user = req.session.currentUser;
    const doc = await usersRef.doc(user.uid).get();
    if (doc.data().resume) {
        res.render('users/uploadResume', { edit: "true" });
    } else {
        res.render('users/uploadResume', { edit: "false" });
    }
}

module.exports.uploadFile = async(req, res) => {
    const { resume } = req.body;
    const user = req.session.currentUser;

    await usersRef.doc(user.uid).update({ resume });

    res.redirect(`/profile/${user.uid}`);
}