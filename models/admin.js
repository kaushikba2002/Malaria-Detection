const mongoose=require('mongoose')
const passportLocalMongoose=require('passport-local-mongoose')

const AdminSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
});

AdminSchema.plugin(passportLocalMongoose); //this function uses passport to add username, password, salting etc to UserSchema.

module.exports=mongoose.model('Admin', AdminSchema);