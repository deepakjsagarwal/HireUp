const functions = require('firebase-functions');
const firebase = require("firebase");
const admin = require("firebase-admin");
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const cors = require('cors')({ origin: true });

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hireupworks-d9868.firebaseio.com'
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors);
app.use(cookieParser('hireuptothemoon'));
app.use(session({
    name: '__session',
    secret: 'hireuptothemoon',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
        secure: false,
        httpOnly: true
    }
}));

app.use(flash());

app.use(async(req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')

    res.locals.currentUser = null;
    const currentUser = req.session.currentUser || "";
    const uid = currentUser.uid;
    if(uid){
        if(!res.locals.currentUser)
            res.locals.currentUser = await admin.auth().getUser(uid)
    }
    next();
});

const routes = require('./routes');
app.use('/', routes);

const ExpressError = require('./utils/ExpressError');
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something went wrong';
    res.status(statusCode).render('error', { err });
});

app.listen(6060, () => {
    console.log(`Listening on http://localhost:6060`);
});

exports.app = functions.https.onRequest(app);