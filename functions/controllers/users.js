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
    res.render('home', { companies })
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

    const user = firebase.auth().currentUser;
    await usersRef.doc(user.uid).set({ college, company, degree, title, linkedinURL, dreamCompanies, name: user.displayName, email: user.email, referredByUsers: [] })
    for (let skill of skills)
        await usersRef.doc(user.uid).collection('skills').doc(skill).set({ user: [] });

    res.redirect(`/profile/${user.uid}`);
}

// ---------- LOGIN ----------
module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    const { email, password } = req.body;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sign-in successful.
            const user = userCredential.user;

            const redirectUrl = req.session.returnTo || `/profile/${user.uid}`
            delete req.session.returnTo;
            res.redirect(redirectUrl)
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
        const user = await makeUser(doc);
        const interestedUsers = [];
        for (let interestedUser of user.referredByUsers) {
            const userDoc = await usersRef.doc(interestedUser).get();
            interestedUsers.push(await makeUser(userDoc))
        }
        res.render('users/profile', { user, interestedUsers })
    }
}

module.exports.showUsers = async(req, res, next) => {
    var currentUser = firebase.auth().currentUser;
    await usersRef.doc(currentUser.uid).get()
        .then(async(doc) => {
            if (doc.exists) {

                currentUser = {...doc.data(), uid: currentUser.uid };
                const usersDoc = await usersRef.where('dreamCompanies', 'array-contains', currentUser.company).get();
                const allUsersWithCurrentUserCompany = await Promise.all(usersDoc.docs.map((doc) => makeUser(doc)));

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

async function makeUser(doc) {
    const skills = [];
    const skillsSnapshot = await usersRef.doc(doc.id).collection('skills').get();
    skillsSnapshot.forEach(doc => {
        const usersLiked = doc.data().user;
        skills.push({ name: doc.id, liked: usersLiked.includes(firebase.auth().currentUser.uid), usersLikedLength: usersLiked.length });
    });
    const user = {...doc.data(), skills, uid: doc.id };
    return user;
}

module.exports.likeSkill = async(req, res) => {
    const { uid, skillId } = req.params;
    const { alreadyLiked } = req.query;
    if (alreadyLiked === "true") {
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayRemove(firebase.auth().currentUser.uid)
        });
    } else {
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid)
        });
    }
    res.redirect('/all');
}

// -------- Verifications ----------------
module.exports.verificationPage = (req, res) => {
    if (firebase.auth().currentUser.emailVerified) {
        res.redirect(`/profile/${firebase.auth().currentUser.uid}`)
    } else {
        res.render('users/verification')
    }
}

module.exports.verificationSend = (req, res) => {
    firebase.auth().currentUser.sendEmailVerification()
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
    const user = firebase.auth().currentUser;
    const doc = await usersRef.doc(user.uid).get();
    if (!doc.exists) {
        next();
    } else {
        const user = await makeUser(doc);
        res.render('users/edit', { user, skills, companies })
    }
}

module.exports.editProfile = async(req, res) => {
    const { name, college, company, degree, title, linkedinURL, skills, dreamCompanies, presentSkills } = req.body;

    const user = firebase.auth().currentUser;
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
    const currentUserDoc = await usersRef.doc(firebase.auth().currentUser.uid).get();
    const currentUser = await makeUser(currentUserDoc);
    const { uid } = req.params;

    await usersRef.doc(uid).update({
        referredByUsers: firebase.firestore.FieldValue.arrayUnion({ uid: currentUser.uid, company: currentUser.company })
    });

    req.flash('success', 'Referred Successfully');
    res.redirect('/all');
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