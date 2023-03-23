const express =require('express');
const app=express();
const ejsMate=require('ejs-mate');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Vasanthi75@",
    database: "malaria"
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


  con.query("Create table Report(rid int primary key auto_increment, pid int, date DATE, result varchar(30), calcium decimal(5, 2), glucose decimal(5, 2), cholesterol decimal(5, 2), uric_acid decimal(5, 2), foreign key(pid) references patient(pid) )", function (err, result) {
    if (err) throw err;
    console.log("Report created");
  });

  con.query("Create table Feedback(pid int, did int, comments varchar(500), foreign key(pid) references patient(pid), foreign key(did) references doctor(did))", function (err, result) {
    if (err) throw err;
    console.log("Feedback created");
  });
