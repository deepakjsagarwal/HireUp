const firebase = require("firebase");

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
