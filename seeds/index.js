const mongoose = require('mongoose');
const User = require('../models/user')

mongoose.connect('mongodb://localhost:27017/hireup', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected")
})


const seedDB = async () => {
    await User.deleteMany({});
    console.log("Deleted users")
}

seedDB().then(()=>{
    mongoose.connection.close();
});