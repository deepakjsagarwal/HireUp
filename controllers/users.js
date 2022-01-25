const {companies} = require('../public/javascripts/companies');

const firebase = require("firebase");
const { firebaseConfig } = require('../config');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

module.exports.renderRegister = (req, res) => {
    res.render('users/register',{companies})
}

module.exports.register = async(req,res)=>{
    const {email,username,password,company,degree,linkedinURL,skills,dreamCompany} = req.body;
    // console.log("req.body is",req.body)

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(async(userCredential) => {
        // Signed in 
        var user = userCredential.user;
        
        await db.collection('users').doc(user.uid).set({name:username,company,degree,linkedinURL,skills,dreamCompany,email})
        req.flash('success', 'Welcome to HireUp')
        res.redirect('/main')
    })
    .catch((error) => {
        req.flash('error',error.message);
        res.redirect('/register')
    });
}

module.exports.renderLogin = (req,res)=>{
    res.render('users/login')
}

module.exports.login = (req,res)=>{

    const {email,password} = req.body;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCredential.user;

        req.flash('success', 'Welcome Back');
        const redirectUrl = req.session.returnTo || '/main'
        delete req.session.returnTo;
        res.redirect(redirectUrl)
    })
    .catch((error) => {       
        req.flash('error',error.message);
        res.redirect('/login')
    });
}

module.exports.logout = (req,res)=>{
    firebase.auth().signOut()
    .then(() => {
        // Sign-out successful.
        req.flash('success',"Goodbye!")
        res.redirect('/');
    })
    .catch((error) => {
        // An error happened.
        req.flash('error',error.message);
    });
}

module.exports.profilePage = async(req,res)=>{
    const uid = req.params.uid;

    await db.collection('users').doc(uid).get()
    .then((doc) => {
        if (doc.exists) {
            const user = doc.data();
            res.render('users/profile',{user})

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
        req.flash('error',error.message)
        res.redirect('/main');
    });

}

module.exports.showUsers = async(req,res)=>{
    const currentUser = firebase.auth().currentUser;
    await db.collection('users').doc(currentUser.uid).get()
    .then(async (doc)=>{
        if (doc.exists) {

            const user = doc.data();
            console.log("USERTRRRRRRRRRR",user);

            await db.collection('users').where('dreamCompany', 'array-contains', user.company).get()
            .then((doc1)=>{
                console.log("DOCCCCCCCCCCC",doc1)
                if(doc1.exists){
                    const users = doc1.data();
                    console.log("ALL USERS",users);
                    res.render('users/all',{users});
                } else {
                    console.log("No such document inside!");
                }
            })
            .catch((error) => {
                console.log("Error getting document inside:", error);
                req.flash('error',error.message)
                res.redirect('/main');
            });

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    })
    .catch((error) => {
        console.log("Error getting document:", error);
        req.flash('error',error.message)
        res.redirect('/main');
    });    
}