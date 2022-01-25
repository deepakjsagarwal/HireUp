const { companies } = require('../public/javascripts/companies');
const {skills} = require('../public/javascripts/skills')

// Initialize Firebase config.
const firebase = require("firebase");
const { firebaseConfig } = require('../config');
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Database.
const db = firebase.firestore();

const usersRef = db.collection('users');

// ---------- REGISTER ----------
module.exports.renderRegister = (req, res) => {
    res.render('users/register', { companies,skills })
}

module.exports.register = async (req, res) => {
    const { email, name, password,college, company, degree,title, linkedinURL, skills, dreamCompanies } = req.body;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            // Sign-In user and Add details about the user.
            var user = userCredential.user;
            
            await db.collection('users').doc(user.uid).set({ name, college,company, degree,title,linkedinURL, dreamCompanies, email })
            for(let skill of skills)
                await db.collection('users').doc(user.uid).collection('skills').doc(skill).set({});
            
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

    const doc = await usersRef.doc(uid).get();
    if (!doc.exists) {
        console.log('No such document!');
        next();
    } else {
        const user = await makeUser(doc);
        console.log(user);
        res.render('users/profile', { user })
    }
}

module.exports.showUsers = async (req, res,next) => {
    const currentUser = firebase.auth().currentUser;
    await usersRef.doc(currentUser.uid).get()
        .then(async (doc) => {
            if (doc.exists) {

                const user = doc.data();
                const usersDoc = await usersRef.where('dreamCompanies', 'array-contains', user.company).get();
                const users = await Promise.all(usersDoc.docs.map((doc)=> makeUser(doc)));                
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

async function makeUser (doc){
    const skills = [];
    const skillsSnapshot = await usersRef.doc(doc.id).collection('skills').get();
    skillsSnapshot.forEach(doc => {
        skills.push(doc.id);
    });
    
    const user = {...doc.data(),skills,uid:doc.id};
    return user;
}