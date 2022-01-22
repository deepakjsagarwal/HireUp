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

    const user = new User({email:"a@gmail.com",username:"a",company:"Google",degree:"B.Tech",linkedinURL:"Link",skills:[{name:"Java"},{name:"Python"},{name:"C++"},{name:"ML"}],dreamCompany:["Meta","Apple","Twitter"]});
    const registeredUser = await User.register(user, "a");
    const user1 = new User({email:"b@gmail.com",username:"b",company:"Meta",degree:"B.Sc.",linkedinURL:"Link",skills:[{name:"Java"},{name:"C"},{name:"C++"},{name:"Web"}],dreamCompany:["Google","Apple","Twitter"]});
    const registeredUser1 = await User.register(user1, "a");
    const user2 = new User({email:"c@gmail.com",username:"c",company:"Meta",degree:"M.Tech",linkedinURL:"Link",skills:[{name:"Java"},{name:"Python"},{name:"C++"},{name:"Android"}],dreamCompany:["Google","Apple","Twitter"]});
    const registeredUser2 = await User.register(user2, "a");
    const user3 = new User({email:"d@gmail.com",username:"d",company:"Google",degree:"M.Sc.",linkedinURL:"Link",skills:[{name:"Java"},{name:"Android"},{name:"C++"},{name:"C"}],dreamCompany:["Meta","Apple","Twitter"]});
    const registeredUser3 = await User.register(user3, "a");
    const user4 = new User({email:"e@gmail.com",username:"e",company:"Google",degree:"B.A.",linkedinURL:"Link",skills:[{name:"Java"},{name:"Python"},{name:"C++"},{name:"C#"}],dreamCompany:["Meta","Apple","Twitter"]});
    const registeredUser4 = await User.register(user4, "a");
    const user5 = new User({email:"f@gmail.com",username:"f",company:"Google",degree:"B.Com.",linkedinURL:"Link",skills:[{name:"Java"}],dreamCompany:["Meta","Apple","Twitter"]});
    const registeredUser5 = await User.register(user5, "a");
    const user6 = new User({email:"g@gmail.com",username:"g",company:"Apple",degree:"MBA",linkedinURL:"Link",skills:[{name:"Java"},{name:"JSP"},{name:"C++"}],dreamCompany:["Meta","Google","Twitter"]});
    const registeredUser6 = await User.register(user6, "a");
    console.log("Created users");
}

seedDB().then(()=>{
    mongoose.connection.close();
});