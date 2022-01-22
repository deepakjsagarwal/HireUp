const User = require('../models/user');
const {companies} = require('../public/javascripts/companies');
module.exports.renderRegister = (req, res) => {
    res.render('users/register',{companies})
}

module.exports.register = async(req,res)=>{
    res.send(req.body)
    // try{
    //     const {email,username,password,company,degree,linkedinURL} = req.body;
    //     const user = new User({email,username,company,degree,linkedinURL});
    //     const registeredUser = await User.register(user, password)
    //     //console.log(registeredUser)
    //     req.login(registeredUser,err=>{
    //         if (err) return next(err);
    //         req.flash('success', 'Welcome to HireUp')
    //         res.redirect('/main')
    //     })
        
    // }catch(e){
    //     req.flash('error',e.message)
    //     res.redirect('register')
    // }
    
}

module.exports.renderLogin = (req,res)=>{
    res.render('users/login')
}
module.exports.login = (req, res) => {
    req.flash('success', 'Welcome Back');
    const redirectUrl = req.session.returnTo || '/main'
    delete req.session.returnTo;
    res.redirect(redirectUrl)
}
module.exports.logout = (req,res)=>{
    req.logout();
    req.flash('success',"Goodbye!")
    res.redirect('/');
}

module.exports.profilePage = async(req,res)=>{
    const username = req.params.username;
    const user = await User.findOne({username});
    console.log(user);
    res.render('users/profile',{user})
}

module.exports.showUsers = async(req,res)=>{
    const users = await User.find({dreamCompany: `${req.user.company}`});
    res.render('users/all',{users});
}