require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./src/models/user.js');
const dbConnect = require('./src/database/db_connect');
const PORT = 4000;

const apiRouter = require('./src/routes/api');

const app = express();

// Serve documentation as static files
const docPath = path.join(__dirname, 'documentation');
console.log('Documentation directory path:', docPath);

// Verify documentation directory exists
fs.access(docPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('Documentation directory does not exist:', err);
  } else {
    console.log('Documentation directory verified');
  }
});

app.get('/documentation', (req, res) => {
  const filePath = path.resolve(docPath, 'index.html');
  console.log('Attempting to serve documentation from:', filePath);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Documentation file access error:', err);
      return res.status(404).send('Documentation file not found');
    }
    
    res.type('html');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending documentation file:', {
          error: err,
          path: filePath,
          exists: fs.existsSync(filePath)
        });
        if (!res.headersSent) {
          res.status(500).send('Error loading documentation');
        }
      }
    });
  });
});

// Cookie and Session
const session = require('express-session');
const passport = require('passport');

app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

// connection database
dbConnect();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// API routes
app.use(apiRouter);

app.listen(process.env.PORT || 4000, () => {
    console.log(`http://localhost:4000`);
});
