const express=require('express')
const router=express.Router();
const User=require('../models/user');
const passport=require('passport')
const LocalStrategy=require('passport-local');
var mysql = require('mysql');


passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());//This has to be called for passport.session() to work
passport.deserializeUser(User.deserializeUser());


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Vasanthi75@",
    database:"malaria"
  });
  
  con.connect(function(err) {
    try{
        if (err) throw err;
        console.log("Connected!");
    }
    catch(e)
    {
        console.log(e)
    }
  });

router.get('/userlogin', (req, res)=>{
    res.render('Userlogin.ejs')
})

router.post('/userlogin', passport.authenticate('local', {failureFlash:true, failureRedirect:'/userlogin'}),async (req, res)=>{
    const x=req.body.user;
    console.log(req.body.username)
    const ad=await User.find({username:`${req.body.username}`})
    console.log(ad)
    var sql=`SELECT*FROM Patient where email="${ad[0].email}"`;
    con.query(sql, function (err, result) 
    {
        if (err) throw err;
        console.log(result)
        Object.keys(result).forEach(function(key)
        {
           var row = result[key];
           console.log(row.pid);
           res.redirect(`/userhome/${row.pid}`)

        });

    });
})

module.exports=router;
