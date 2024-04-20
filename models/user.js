const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new mongoose.Schema({
    email:{
        type:String,
    },
    age:{
        type:Number,
    },
    hobbies:{
        type:String,
    },
    currentLocation:{
        type:String,
    },
    story:{
        type:String,
    },
    profilePic:{
        url:String,
        filename:String,
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);