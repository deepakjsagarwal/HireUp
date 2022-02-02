const functions = require('firebase-functions');
const firebase = require("firebase");
const admin = require("firebase-admin");
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

const ExpressError = require('./utils/ExpressError');
const routes = require('./routes');
const serviceAccount = require("./serviceAccountKey.json");

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sessionConfig = {
    name: '_session',
    secret: 'thisshouldbeabettersecret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        secure: false,
        httpOnly: false
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(async(req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    res.locals.currentUser = firebase.auth().currentUser;
    next();
});

app.use('/', routes);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something went wrong';
    res.status(statusCode).render('error', { err });
});

app.listen(6060, () => {
    console.log("Server is running on 6060")
});

exports.app = functions.https.onRequest(app);