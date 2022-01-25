const { companies } = require('../public/javascripts/companies');
const {skills} = require('../public/javascripts/skills')

// Initialize Firebase config.
const firebase = require("firebase");
const { firebaseConfig } = require('../config');
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Database.
const db = firebase.firestore();

// ---------- REGISTER ----------
module.exports.renderRegister = (req, res) => {
    res.render('users/register', { companies,skills })
}

module.exports.register = async (req, res) => {
    const { email, name, password,college, company, degree,title, linkedinURL, skills, dreamCompany } = req.body;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            // Sign-In user and Add details about the user.
            var user = userCredential.user;
            console.log("USERRRRRRRRRR")
            await db.collection('users').doc(user.uid).set({ name, college,company, degree,title, linkedinURL, skills, dreamCompany, email })
            res.redirect('/main')
        })
        .catch((error) => {
            // An error happened.
            console.log("ERROROROROROOR")
            console.log("MESSAGE",error.message);
            req.flash('error', error.message);
            res.redirect('/register')
        });
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

            const redirectUrl = req.session.returnTo || '/main'
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
module.exports.profilePage = async (req, res,next) => {
    const uid = req.params.uid;

    await db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const user = doc.data();
                res.render('users/profile', { user })

            } else {
                // doc.data() will be undefined in this case
                next();
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
            req.flash('error', error.message)
            res.redirect('/main');
        });
}

module.exports.showUsers = async (req, res,next) => {
    const currentUser = firebase.auth().currentUser;
    await db.collection('users').doc(currentUser.uid).get()
        .then(async (doc) => {
            if (doc.exists) {
                const user = doc.data();

                const usersDoc = await db.collection('users').where('dreamCompany', 'array-contains', user.company).get();
                const users = usersDoc.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
                res.render("users/all",{users});
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
                next();
            }
        })
        .catch((error) => {
            console.log("Error getting document:", error);
            req.flash('error', error.message)
            res.redirect('/main');
        });
}