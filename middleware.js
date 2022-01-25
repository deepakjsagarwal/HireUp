const firebase = require("firebase");

module.exports.isLoggedIn = (req,res,next)=>{
    if(!firebase.auth().currentUser){
        req.session.returnTo = req.originalUrl;
        req.flash('error','You must be signed in');
        return res.redirect('/login')
    }
    next();
}