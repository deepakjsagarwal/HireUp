const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    skills: [{
        name: {
            type: String
        },
        users: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    company: {
        type: String
    },
    linkedinURL: {
        type: String
    },
    degree: {
        type: String
    },
    dreamCompany: [{
        type: String
    }]
})

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);