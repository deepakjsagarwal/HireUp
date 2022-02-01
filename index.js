const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session')
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError');
const userRoutes = require('./routes/users')
const {companies} = require('./public/javascripts/companies');
var cookieParser = require('cookie-parser');


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser());

const firebase = require("firebase");
const db = firebase.firestore();
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sessionConfig = {
    name: 'session',
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
    //  secure: true,
        expires: Date.now()+1000*60*60*24*7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())

app.use(async(req,res,next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    res.locals.currentUser = firebase.auth().currentUser;
    // console.log("CUREENT USER",firebase.auth().currentUser);
    next();   
})


app.use('/',userRoutes)
app.get('/',(req,res)=>{
    res.render('home',{companies});
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something went wrong';
    res.status(statusCode).render('error',{err});
})

app.listen(6060, () => {
    console.log("Listening on 6060")
})