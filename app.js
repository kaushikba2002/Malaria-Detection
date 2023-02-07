const express =require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const methodOverride=require('method-override');
const ejsMate=require('ejs-mate');
const session=require('express-session');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy=require('passport-local');
var mysql = require('mysql');
const Admin=require('./models/admin.js')
const User=require('./models/user.js')
//yet to require('passport-local-mongoose')


mongoose.connect('mongodb://127.0.0.1:27017/malaria-detection', {
})
.then(()=>{
    console.log("Database connected")
})
.catch((err)=>{
    console.log("Connection unable to open")
})

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


mongoose.set('strictQuery', true);
// const db=mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", ()=>{
//     console.log("Database connected");
// });

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({extended:true})); //add this command to let express know to parse the req.body in a POST request
app.use(methodOverride('_method')); //used to override the default GET/POST request sent by a form to a PATCH/PUT/DELETE/ any other type of request
app.use(express.static(path.join(__dirname, 'public')))//static assets, stylesheets etc

const sessionConfig={
    secret:'thisshouldbeabettersecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true, //Default is also true. An HttpOnly Cookie is a tag added to a browser cookie that prevents client-side scripts from accessing data. It provides a gate that prevents the specialized cookie from being accessed by anything other than the server.  Using the HttpOnly tag when generating a cookie helps mitigate the risk of client-side scripts accessing the protected cookie, thus making these cookies more secure.
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize()) //middle-ware that initialises Passport
app.use(passport.session()); //call this only after calling session middleware sessionConfig. acts as a middleware to alter the req object and change the 'user' value that is currently the session id (from the client cookie) into the true deserialized user object
passport.use(new LocalStrategy(User.authenticate()))
passport.use(new LocalStrategy(Admin.authenticate()))

passport.serializeUser(User.serializeUser());//This has to be called for passport.session() to work
passport.deserializeUser(User.deserializeUser()); //This has to be called for passport.session() to work
passport.serializeUser(Admin.serializeUser());//This has to be called for passport.session() to work
passport.deserializeUser(Admin.deserializeUser()); //This has to be called for passport.session() to work

app.use((req, res, next)=>{
    res.locals.currentUser=req.user; //passport user object
    res.locals.success=req.flash('success') //In every request, the 'success' key under flash is checked and if it contains anything, is assigned to the locals.success variable in response res so that it can be used in the response template.
    res.locals.error=req.flash('error')
    next();
})

app.get('/home', (req, res)=>{
    res.send('hello')
})

app.get('/adminlogin', (req, res)=>{
    res.render('Adminlogin.ejs')
})

app.post('/adminlogin', passport.authenticate('local', {failureFlash:true, failureRedirect:'/adminlogin'}), (req, res, next)=>{
    res.render('Adminlogin.ejs')
})

app.get('/userlogin', (req, res)=>{
    res.render('Userlogin.ejs')
})

app.post('/userlogin', passport.authenticate('local', {failureFlash:true, failureRedirect:'/userlogin'}), (req, res)=>{
    const x=req.body.user;
    console.log(x)
    res.render('adminhome.ejs')
})

app.get('/adminregister', (req, res, next)=>{
    try{
    var sql="SELECT*FROM Lab"
        con.query(sql, function (err, rows) {
            if (err)
                throw err;
            res.render('Adminregister.ejs', {rows})
          });
        }
        catch(e)
        {
           req.flash('error', `${e.message}!`);
            res.redirect('/home')
        }
})

app.post('/adminregister', async (req, res, next)=>{
    try{

    const {email, username, passwd, fname, mname, lname, ap, street, city, state, code, age, gender, spec1, spec2, spec3, edu, contact, lab}=req.body.admin;
    const admin=new Admin({email, username})
    const registeredAdmin=await Admin.register(admin, passwd);
    console.log("1 record inserted");
    console.log(registeredAdmin);

    req.login(registeredAdmin, err=>
    {
        if(err) throw err; //doubt
        req.flash('success', 'Welcome');
        var sql=`INSERT INTO Doctor(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, spec1, spec2, spec3, education, contact) values("${fname}", "${mname}", "${lname}", "${ap}", "${street}", "${city}", "${state}", "${code}", "${age}", "${gender}", "${spec1}", "${spec2}", "${spec3}", "${edu}", "${contact}")`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("2 record inserted");
          });

          var sql=`SELECT*from Doctor WHERE first_name="${fname}"`  //This has to be modified later when you have time
        con.query(sql, function (err, result) {

            if (err) throw err;
            Object.keys(result).forEach(function(key) {
                var row = result[key];
                console.log(row.did);
                con.query(`INSERT INTO works_for(did, lid) values("${row.did}", "${lab}")`, function (err, result) {
                    if (err) throw err;
                     res.redirect(`/admin/${row.did}/${lab}`)
                  });
            });
             //Change this also later
            
          });
        // res.send('hengappo')

    })
}
    catch(e)
    {
        req.flash('error', `${e.message}!`);
        res.redirect('/userregister');
    }
})



app.get('/userregister/:did/:lid', (req, res)=>{
    const {did, lid}=req.params;
    res.render('Userregister.ejs', {did, lid})
})

app.post('/userregister/:did/:lid',async (req, res)=>{
    const {did, lid}=req.params;
    var wid;
    try{
        var sql=`SELECT*from Works_for WHERE did="${did}" and lid="${lid}"`  //This has to be modified later when you have time
            con.query(sql, function (err, result) {
    
                if (err) throw err;
                Object.keys(result).forEach(function(key) {
                    var row = result[key];
                    console.log(row.wid);
                    wid=row.wid;
                });
                 //Change this also later
                
              });


        const {email, username, passwd, fname, mname, lname, ap, street, city, state, code, age, gender, dob, marital, contact}=req.body.user;
        const user=new User({email, username})
        const registeredUser=await User.register(user, passwd);
        req.login(registeredUser, err=>{
            if(err) return next(err); //doubt
            req.flash('success', 'Welcome');
            var sql=`INSERT INTO Patient(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, contact, dob, marital, reg_date, wid) values("${fname}", "${mname}", "${lname}", "${ap}", "${street}", "${city}", "${state}", "${code}", "${age}", "${gender}", "${contact}", "${dob}", "${marital}", CURDATE(), "${wid}" )`
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
              });

            var sql=`SELECT*from Patient WHERE first_name="${fname}"`  //This has to be modified later when you have time
            con.query(sql, function (err, result) {
    
                if (err) throw err;
                Object.keys(result).forEach(function(key) {
                    var row = result[key];
                    console.log(row.pid);
                    res.redirect(`/user/${row.pid}`)
                });
                 //Change this also later
                
              });
        })
        }
        catch(e)
        {
            req.flash('error', `${e.message}!`);
            res.redirect('/userregister');
        }
    
})

app.get('/admin/home', (req, res)=>{
    res.render('adminhome.ejs')
})

app.get('/admin/:did/:lid', (req, res)=>{
    var arr=[];
    const {did, lid}=req.params;
    var sql=`SELECT*from Works_for WHERE did="${did}"`  //This has to be modified later when you have time
            con.query(sql, function (err, result) {
    
                if (err) throw err;
                Object.keys(result).forEach(function(key) {
                    var row = result[key];
                    console.log(row.wid)
                    var sql=`SELECT*from Patient WHERE wid="${row.wid}"`
                    console.log(sql)
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        Object.keys(result).forEach(function(key) {

                            var row = result[key];
                            console.log(row)
                            arr.push(row);
                            console.log(arr)
                        });
                        res.render('adminhome.ejs', {arr})

                });
                 //Change this also later
                 
                
              });
})
});

app.get('/user/:id', (req, res)=>{
    const id=req.params.id;
    res.render('userhome.ejs', {id})

})

app.get('/adminpatient/:id', (req, res)=>{
    const id=req.params.id;
    var sql=`SELECT*from Patient WHERE pid="${id}"`  //This has to be modified later when you have time
            con.query(sql, function (err, result) {
    
                if (err) throw err;
                Object.keys(result).forEach(function(key) {
                    var row = result[key];
                    res.render('adminpatient.ejs', {row})

                });
                 //Change this also later
                
              });

})



app.listen(3000, ()=>{
    console.log('Serving on port 3000')
})