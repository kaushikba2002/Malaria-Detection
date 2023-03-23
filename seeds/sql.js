const express =require('express');
const app=express();
const ejsMate=require('ejs-mate');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Vasanthi75@"
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

  // con.query("Create database Malaria", function (err, result) {
  //   if (err) throw err;
  //   console.log("Database created");
  // });

  con.query("Use Malaria", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });

con.query("Create table Doctor(did int primary key auto_increment, first_name varchar(20), middle_name varchar(20), last_name varchar(20), ap int, street varchar(100), city varchar(20), state varchar(20), postal_code int, age int, gender varchar(7), spec1 varchar(20), spec2 varchar(20), spec3 varchar(20), education varchar(30), contact varchar(15), email varchar(30))", function (err, result) {
    if (err) throw err;
    console.log("Doctor created");
  });

  con.query("Create table Lab(lid int primary key auto_increment, name varchar(20), addrline varchar(100), city varchar(20), state varchar(20), postal_code int)", function (err, result) {
    if (err) throw err;
    console.log("Lab created");
  });

  con.query("Create table Works_for(did int, lid int, primary key(did, lid), foreign key(did) references doctor(did), foreign key(lid) references Lab(lid))", function (err, result) {
    if (err) throw err;
    console.log("Works_for created");
  });

con.query("Create table Patient(pid int primary key auto_increment, first_name varchar(20), middle_name varchar(20), last_name varchar(20), ap int, street varchar(100), city varchar(20), state varchar(20), postal_code int, age int, gender varchar(7), contact varchar(15), dob date, marital varchar(10), reg_date date, did int, lid int, email varchar(30), foreign key(did) references Doctor(did), foreign key(lid) references Lab(lid))", function (err, result) {
    if (err) throw err;
    console.log("Patient created");
  });

  var sql="INSERT INTO Lab(name, addrline, city, state, postal_code) values('Abhinav Hospital', '1st block, 7, Magadi road', 'Bengaluru', 'Karnataka', 560023), ('Tanmay Hospital', 'Pipeline main road, 7th block', 'Bengaluru', 'Karnataka', 560045), ('Sevabhai Hospital', '573, 63rd cross, 12th main road, Rajajinagar', 'Bengaluru', 'Karnataka', 560010)"
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
          });

  // var sql="INSERT INTO Patient(first_name, middle_name, last_name, ap, street, city, state, postal_code, age, gender, contact, dob, marital, reg_date, wid) values('Jadhav', 'Mani', 'Verma', 4, '1st block, 7, Magadi road', 'Bengaluru', 'Karnataka', 560023, 45, 'male', 9740298544, '2003-12-12','married','2021-11-12', 1), ('Tanich', 'Bahu', 'Bagchi', 3, 'Pipeline main road, 7th block', 'Bengaluru', 'Karnataka', 560045, 67, 'male', 5182937361, '1982-10-10','single', '2021-02-09', 3)"
  //       con.query(sql, function (err, result) {
  //           if (err) throw err;
  //           console.log("1 record inserted");
  //         });



 