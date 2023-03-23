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
const User=require('./models/user.js')
const Admin=require('./models/admin.js')

const {adminisLoggedIn}=require('./adminMiddleware.js')
const {userisLoggedIn}=require('./userMiddleware.js')
const fileUpload = require('express-fileupload');
const axios=require('axios')
var bodyParser = require('body-parser')
const fs=require('fs')
const puppeteer = require('puppeteer');
const userRoutes=require('./routes/users.js')
const adminRoutes=require('./routes/admins.js')
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
app.use(bodyParser.json())
app.use(fileUpload());
app.use(express.json())

app.use(passport.initialize()) //middle-ware that initialises Passport
app.use(passport.session()); //call this only after calling session middleware sessionConfig. acts as a middleware to alter the req object and change the 'user' value that is currently the session id (from the client cookie) into the true deserialized user object

app.use((req, res, next)=>{
    res.locals.upload=true; //passport user object
    res.locals.generate=true; //passport user object
    res.locals.success=req.flash('success') //In every request, the 'success' key under flash is checked and if it contains anything, is assigned to the locals.success variable in response res so that it can be used in the response template.
    res.locals.error=req.flash('error')
    next();
})


app.use('/', adminRoutes)
app.use('/', userRoutes)

app.get('/home', (req, res)=>{
    res.send('hello')
})
app.get('/', (req, res)=>{
    res.send('hello')
})


app.get('/adminregister', (req, res, next)=>{
    res.render('Adminregister.ejs')

    // try{
    // var sql="SELECT*FROM Lab"
    //     con.query(sql, function (err, rows) {
    //         if (err)
    //             throw err;
    //         res.render('Adminregister.ejs', {rows})
    //       });
    //     }
    //     catch(e)
    //     {
    //        req.flash('error', `${e.message}!`);
    //         res.redirect('/home')
    //     }
})

app.get('/adminhome/:did', (req, res)=>{
    const {did}=req.params;
    var sql=`SELECT patient.first_name, patient.last_name, patient.middle_name, patient.pid, report.calcium FROM patient left join report on patient.pid=report.pid where patient.did=${did}`;
    con.query(sql, function (err, result) 
    {
        if (err) throw err;
        console.log(result)
        res.render('adminhome.ejs', {did, result}) //does result have the patient record?

    });
})

app.post('/adminregister', async (req, res, next)=>{
    try{

    const {email, username, passwd, fname, mname, lname, ap, street, city, state, code, age, gender, spec1, spec2, spec3, edu, contact}=req.body.admin;
    const admin=new Admin({email, username})
    const registeredAdmin=await Admin.register(admin, passwd);
    console.log("Mongo record inserted");
    console.log(registeredAdmin);

    req.login(registeredAdmin, err=>
    {
        if(err) throw err; //doubt
        req.flash('success', 'Welcome');
        var sql=`INSERT INTO Doctor(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, spec1, spec2, spec3, education, contact, email) values("${fname}", "${mname}", "${lname}", "${ap}", "${street}", "${city}", "${state}", "${code}", "${age}", "${gender}", "${spec1}", "${spec2}", "${spec3}", "${edu}", "${contact}", "${email}")`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("SQL record inserted");
          });

          var sql=`SELECT did from Doctor WHERE first_name="${fname}" AND middle_name="${mname}" AND last_name="${lname}"`  //This has to be modified later when you have time
        con.query(sql, function (err, result) 
        {

            if (err) throw err;
            console.log(result)
            console.log(result.did)
            console.log(typeof(result))
             Object.keys(result).forEach(function(key)
             {
                var row = result[key];
                console.log(row.did);
                res.redirect(`/adminhome/${row.did}`)

             });

        });

    })
}
    catch(e)
    {
        req.flash('error', `${e.message}!`);
        res.redirect('/adminregister');
    }
})

app.get('/userhome/:pid', (req, res)=>{
    const {pid}=req.params;
    var sql=`SELECT*FROM Patient where pid=${pid}`;
    con.query(sql, function (err, result) 
    {
        if (err) throw err;
        console.log(result)
        Object.keys(result).forEach(function(key)
             {
                var row1 = result[key];
                console.log(row1.pid);
                sql=`SELECT*FROM report where pid=${pid}`;
                con.query(sql, function (err, result2) 
                {
                    if (err) throw err;
                    if(result2.length!=0)
                    {
                    Object.keys(result2).forEach(function(key)
                         {
                            var row2 = result2[key];
                            console.log(row2.pid);
                            var sql=`SELECT*FROM Feedback where pid=${pid}`  //This has to be modified later when you have time
        con.query(sql, function (err, result3) 
        {

            if (err) throw err;
            if(result3.length!=0)
            {
             Object.keys(result3).forEach(function(key)
             {
                var row3 = result3[key];
                console.log(row3.did);
                res.render('userhome.ejs', {pid, row1, row2, row3})

             });
            }
            else{ res.render('userhome.ejs', {pid, row1, row2, row3:[]})}

        });
                         });
                        }
                    else{
                        res.render('userhome.ejs', {pid, row1, row2:[]})
                    }
             });

    });
})
})


app.get('/userregister/:did', (req, res)=>{
    const {did}=req.params;

    var sql="SELECT*from Lab"
            con.query(sql, function (err, result) {
    
                if (err) throw err;
                res.render('Userregister.ejs', {did, result})
                 //Change this also later
                
              });

})

app.post('/userregister/:did',async (req, res)=>{
    const {did}=req.params;
    const lid=req.body.user.lab;
    try{
        var sql=`SELECT*FROM Works_for WHERE did=${did} and lid=${lid}`
            con.query(sql, function (err, result) {
                if (err) throw err;
                if(result.length==0)
                {
                var sql=`INSERT INTO Works_for(did, lid) values("${did}", "${lid}")`
                 con.query(sql, function (err, result) {
    
                if (err) throw err;
                   });

                }
              });


        const {email, username, passwd, fname, mname, lname, ap, street, city, state, code, age, gender, dob, marital, contact}=req.body.user;
        const user=new User({email, username})
        const registeredUser=await User.register(user, passwd);
        const creds={email:`${email}`, username:`${username}`, password:`${passwd}`}
        console.log(creds)
        try{
        const resp= await axios.post('http://192.168.43.206:5000/adduser', creds);
        console.log(resp)
        }
        catch(e)
        {
            console.log(e)
        }



        console.log("Mongo record inserted");
        console.log(registeredUser);

            var sql=`INSERT INTO Patient(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, contact, dob, marital, reg_date, lid, did, email) values("${fname}", "${mname}", "${lname}", "${ap}", "${street}", "${city}", "${state}", "${code}", "${age}", "${gender}", "${contact}", "${dob}", "${marital}", CURDATE(), "${lid}", "${did}", "${email}")`
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("patient sql record inserted");
              });
        const admin=new Admin({email, username})
        const registeredAdmin=await Admin.register(admin, passwd);

        console.log("Mongo record inserted");
        console.log(registeredAdmin);
            sql=`INSERT INTO Doctor(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, email) values("${fname}", "${mname}", "${lname}", "${ap}", "${street}", "${city}", "${state}", "${code}", "${age}", "${gender}", "${email}")`
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("doctor sql record inserted");
              });
            
            res.redirect(`/adminhome/${did}`)


        
        }
        catch(e)
        {
            req.flash('error', `${e.message}!`);
            res.redirect(`/userregister/${did}`);
        }
    
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

                });
                 //Change this also later
                 
                
              });
              console.log(arr)
    res.render('adminhome.ejs', {arr})
})
});

app.get('/user/:id', (req, res)=>{
    const id=req.params.id;
    res.render('userhome.ejs', {id})

})

app.get('/userdetails/:did/:pid', (req, res)=>{
    const {pid, did}=req.params;
    var sql=`SELECT*from report WHERE pid="${pid}"`  //This has to be modified later when you have time
    con.query(sql, function (err, result) {
        console.log(result)

        if (err) throw err;
        if(result.length!=0)
        res.locals.upload=false;
        Object.keys(result).forEach(function(key) {
            var row = result[key];
            if(row.calcium!=null)
            res.locals.generate=false

        });

        
      });
    console.log(req.session[1])
    var sql=`SELECT*from Patient WHERE pid="${pid}"`  //This has to be modified later when you have time
            con.query(sql, function (err, resultp) {
                console.log(resultp)
    
                if (err) throw err;
                Object.keys(resultp).forEach(function(key) {
                    var rowp = resultp[key];
                    var sql=`SELECT*from feedback WHERE pid="${pid}"`  //This has to be modified later when you have time
                    con.query(sql, function (err, resultf) {
                        console.log(resultf)
                
                        if (err) throw err
                        if(resultf.length!=0){
                        Object.keys(resultf).forEach(function(key) {
                            var rowf = resultf[key];
                            console.log(rowf.comments)
                            res.render('userdetails.ejs', {rowp, did, rowf})

                
                        });
                    }
                    else{
                        res.render('userdetails.ejs', {rowp, did, rowf:[]})
                    }
                
                        
                      })

                });
                 //Change this also later
                
              });

})



const f1=async function(image){
    try{
        console.log(image.data.length)
   const resp= await axios.post('http://192.168.43.206:5000/custom_predict', image);
   console.log(resp)
   return resp.data
    }
    catch(e)
    {
        console.log(e)
    }
    //   console.log(res.data)
    //   return res.data
}



app.post('/route1', (req, res)=>{
    console.log(req.body)
    console.log('haavi')
    res.send({success:"Kaushik"})
})


app.post('/upload/:did/:pid', async (req, res) => 
{
    const {pid, did}=req.params
    console.log(req.files)
    console.log(req.files)

    const { image } = req.files;
    
    
    if (!image) console.log('jsjsk')

    console.log(image.data.length)
    const result=await f1(image);
    console.log(result)
    var sql=`INSERT INTO Report(pid, date, result) values("${pid}", CURDATE(), "${result.success}")`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Report record inserted");
          });
          res.locals.upload=false;

    console.log(image.name)
    image.mv(__dirname + '/public/images/' + image.name);
   res.redirect(`/userdetails/${did}/${pid}`)
});

app.post('/generate/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    const {calcium, cholesterol, glucose, uric}=req.body;
    var sql=`UPDATE Report set calcium=${calcium}, cholesterol=${cholesterol}, glucose=${glucose}, uric_acid=${uric} where pid=${pid}`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Report record updated");
            res.locals.generate=false;
            res.redirect(`/userdetails/${did}/${pid}`)
          });

})

app.get('/viewreport/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    var sql=`SELECT*from report WHERE pid="${pid}"`  //This has to be modified later when you have time
    con.query(sql, function (err, resultr) {
        if (err) throw err;
        Object.keys(resultr).forEach(function(key) {
            var rowr = resultr[key];
            sql=`SELECT*from patient where pid=${pid}`
            con.query(sql, function (err, resultp) {
                if (err) throw err;
                Object.keys(resultp).forEach(function(key) {
                    var rowp = resultp[key];
                    var sql=`Select*from doctor where did=${did}`
                    con.query(sql, function (err, resultd) {
                    if (err) throw err;
                    Object.keys(resultd).forEach(function(key) {
                        var rowd = resultd[key];
                        var sql=`Select*from lab join patient on patient.lid=lab.lid where pid=${pid}`
                        con.query(sql, function (err, resultl) {
                        if (err) throw err;
                        Object.keys(resultl).forEach(function(key) {
                            var rowl = resultl[key];
                        res.render('viewreport.ejs', {rowr, rowp, rowd, rowl})
                        });
                        
                      });
                    
                    });
              });

                });
          });

        });
})
});

app.get('/viewreportd/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    var sql=`SELECT*from report WHERE pid="${pid}"`  //This has to be modified later when you have time
    con.query(sql, function (err, resultr) {
        if (err) throw err;
        Object.keys(resultr).forEach(function(key) {
            var rowr = resultr[key];
            sql=`SELECT*from patient where pid=${pid}`
            con.query(sql, function (err, resultp) {
                if (err) throw err;
                Object.keys(resultp).forEach(function(key) {
                    var rowp = resultp[key];
                    var sql=`Select*from doctor where did=${did}`
                    con.query(sql, function (err, resultd) {
                    if (err) throw err;
                    Object.keys(resultd).forEach(function(key) {
                        var rowd = resultd[key];
                        var sql=`Select*from lab join patient on patient.lid=lab.lid where pid=${pid}`
                        con.query(sql, function (err, resultl) {
                        if (err) throw err;
                        Object.keys(resultl).forEach(function(key) {
                            var rowl = resultl[key];
                        res.render('viewreportd.ejs', {rowr, rowp, rowd, rowl})
                        });
                        
                      });
                    
                    });
              });

                });
          });

        });
})
});

app.get('/viewreportuser/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    var sql=`SELECT*from report WHERE pid=${pid}`  //This has to be modified later when you have time
    con.query(sql, function (err, resultr) {
        if (err) throw err;
        Object.keys(resultr).forEach(function(key) {
            var rowr = resultr[key];
            sql=`SELECT*from patient where pid=${pid}`
            con.query(sql, function (err, resultp) {
                if (err) throw err;
                Object.keys(resultp).forEach(function(key) {
                    var rowp = resultp[key];
                    var sql=`Select*from doctor where did=${did}`
                    con.query(sql, function (err, resultd) {
                    if (err) throw err;
                    Object.keys(resultd).forEach(function(key) {
                        var rowd = resultd[key];
                        var sql=`Select*from lab join patient on patient.lid=lab.lid where pid=${pid}`
                        con.query(sql, function (err, resultl) {
                        if (err) throw err;
                        Object.keys(resultl).forEach(function(key) {
                            var rowl = resultl[key];
                        res.render('viewreportuser.ejs', {rowr, rowp, rowd, rowl})
                        });
                        
                      });
                    
                    });
              });

                });
          });

        });
})
});

app.get('/download/:did/:pid', async (req, res)=>{
    const {did, pid}=req.params;
    const browser = await puppeteer.launch();
  
    // Create a new page
    const page = await browser.newPage();
  
    // Website URL to export as pdf
    const website_url = `http://localhost:3000/viewreportd/${did}/${pid}`; 
  
    // Open URL in current page
    await page.goto(website_url, { waitUntil: 'networkidle0' }); 
  
    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');
  
  // Downlaod the PDF
    const pdf = await page.pdf({
      path: 'result.pdf',
      margin: { top: '50px', right: '50px', left: '50px' },
      printBackground: true,
      format: 'A4',
    });
  
    // Close the browser instance
    await browser.close();
    res.download('result.pdf');

})

app.get('/feedback/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    res.render('feedback.ejs', {did, pid})
})

app.post('/feedback/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    const {message}=req.body;
    var sql=`INSERT INTO Feedback(pid, did, comments) values("${pid}",  "${did}", "${message}")`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Feedback record inserted");
            res.redirect(`/userhome/${pid}`)
          });
})


app.get('/delete/:did/:pid', (req, res)=>{
    const {did, pid}=req.params;
    const {message}=req.body;
    var sql=`DELETE FROM Feedback where pid=${pid}`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Feedback record deleted");
          });

    var sql=`DELETE FROM report where pid=${pid}`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Report record deleted");
          });
        //   const x=User.deleteOne({email:})

          var sql=`SELECT*from patient WHERE pid=${pid}`  //This has to be modified later when you have time
            con.query(sql, function (err, resultf) {
            console.log(resultf)
                
                if (err) throw err
            
                 Object.keys(resultf).forEach(function(key) {
                 var rowf = resultf[key];
                console.log(rowf.pid)
                 var sql=`DELETE FROM Doctor where email="${rowf.email}" and first_name="${rowf.first_name}"`
                   con.query(sql, function (err, result) {
                     if (err) throw err;
                       console.log("Doctor record deleted");
          });
                 
            });
                        
            })

        var sql=`DELETE FROM Patient where pid=${pid}`
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Patient record deleted");
            res.redirect(`/adminhome/${did}`)
          });
})

app.get('/adminlogout', (req, res)=>{
   
        res.redirect('/adminlogin');

})
app.get('/userlogout', (req, res)=>{
   
        res.redirect('/userlogin');

})


app.listen(3000, ()=>
{
    console.log('Serving on port 3000')
})

/* <div class="mt-5 pb-2">
<select class="select" name="admin[lab]">
 
  <%for(let lab of rows){%>
  <option value="<%=lab.lid%>"><%=lab.name%></option>
  <%}%>
</select>
</div> */