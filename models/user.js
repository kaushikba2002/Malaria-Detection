const mongoose=require('mongoose')
const passportLocalMongoose=require('passport-local-mongoose')

const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email']
    }
});

UserSchema.plugin(passportLocalMongoose); //this function uses passport to add username, password, salting etc to UserSchema.

module.exports=mongoose.model('User', UserSchema);