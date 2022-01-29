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
module.exports.renderBasicRegister = (req,res)=>{
    res.render('users/basicRegister')
}
module.exports.renderRegister = (req, res) => {
    res.render('users/register', { companies,skills })
}
module.exports.basicRegister = async (req,res)=>{
    const {name,email,password} = req.body;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
        // Sign-In user and Add details about the user.
        var user = userCredential.user;
                
        user.updateProfile({
            displayName: name,
        }).then(() => {
            // Update successful
            user.sendEmailVerification()
            .then(() => {
                // Email verification sent!
                console.log("Verification sent");

                //Logging out
                firebase.auth().signOut()
                .then(() => {
                    // Sign-out successful.
                    req.flash('success',"Verify your email and come back :)")
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

module.exports.register = async (req, res) => {
    const { college, company, degree,title, linkedinURL, skills, dreamCompanies } = req.body;

    const user = firebase.auth().currentUser;
    await db.collection('users').doc(user.uid).set({college,company, degree,title,linkedinURL, dreamCompanies,name:user.displayName,email:user.email})
    for(let skill of skills)
        await db.collection('users').doc(user.uid).collection('skills').doc(skill).set({user:[]});
      
    res.redirect('/main');
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
        const usersLiked = doc.data().user;
        skills.push({name:doc.id,liked:usersLiked.includes(firebase.auth().currentUser.uid),usersLikedlength:usersLiked.length});
    });
    const user = {...doc.data(),skills,uid:doc.id};
    // console.log(user);
    return user;
}

module.exports.likeSkill = async(req,res)=>{
    const {uid,skillId} = req.params;
    const {alreadyLiked} = req.query;
    if(alreadyLiked==="true"){
        console.log("If ")
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayRemove(firebase.auth().currentUser.uid)
        });
    }else{
        console.log("Else ")
        await usersRef.doc(uid).collection('skills').doc(skillId).update({
            user: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid)
        });
    }
    res.redirect('/all');
}

// -------- Verifications ----------------
module.exports.verificationPage = (req,res)=>{
    if(firebase.auth().currentUser.emailVerified){
        res.redirect('/main')
    }else{
        res.render('main/verification')
    }
}

module.exports.verificationSend = (req,res)=>{
    firebase.auth().currentUser.sendEmailVerification()
    .then(() => {
        // Email verification sent!
        console.log("Verification sent");

        //Logging out
        firebase.auth().signOut()
        .then(() => {
            // Sign-out successful.
            req.flash('success',"Verify your email and come back :)")
            res.redirect('/');
        })
    })
    .catch((error)=>{
        firebase.auth().signOut()
        .then(() => {
            // Sign-out successful.
        })
        req.flash('error',error.message);
        res.redirect('/')
    })
}