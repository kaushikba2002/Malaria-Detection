const express=require('express')
const router=express.Router();
const Admin=require('../models/admin');
const passport=require('passport')
const LocalStrategy=require('passport-local');
var mysql = require('mysql');

passport.use(new LocalStrategy(Admin.authenticate()))

 //This has to be called for passport.session() to work
passport.serializeUser(Admin.serializeUser());//This has to be called for passport.session() to work
passport.deserializeUser(Admin.deserializeUser()); //This has to be called for passport.session() to work

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

router.get('/adminlogin', (req, res)=>{
    res.render('Adminlogin.ejs')
})


router.post('/adminlogin', passport.authenticate('local', {failureFlash:true, failureRedirect:'/home'}), async (req, res, next)=>{
    console.log(req.body.username)
    const ad=await Admin.find({username:`${req.body.username}`})
    console.log(ad)
    var sql=`SELECT*FROM Doctor where email="${ad[0].email}"`;
    con.query(sql, function (err, result) 
    {
        if (err) throw err;
        console.log(result)
        Object.keys(result).forEach(function(key)
        {
           var row = result[key];
           console.log(row.did);
           res.redirect(`/adminhome/${row.did}`)

        });

    });
})


module.exports=router;