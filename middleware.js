const firebase = require("firebase");
const db = firebase.firestore();
const usersRef = db.collection('users');

module.exports.isLoggedIn = (req,res,next)=>{
    if(!firebase.auth().currentUser){
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must be signed in');
        return res.redirect('/login')
    }
    next();
}

module.exports.isUserVerified = (req,res,next)=>{
    if(!firebase.auth().currentUser.emailVerified){
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must verify your email.');
        return res.redirect('/verification')
    }
    next();
}

module.exports.isProfileComplete = async (req,res,next)=>{
    const isProfileCom = await checkProfile();
    if(!isProfileCom){
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must complete your profile.');
        return res.redirect('/register')
    }
    next();
}

const checkProfile = async ()=>{
    const user = firebase.auth().currentUser;
    
    const doc = await usersRef.doc(user.uid).get();
    return doc.exists;
}
