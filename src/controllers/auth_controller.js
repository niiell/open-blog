const User = require('../models/user');
const showAlert = require('../helpers/alert.js');
const passport = require('passport');


exports.getLogin = async (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/admin/dashboard');
    }

    try {
        const foundUser = await User.findOne();
        if (!foundUser) {
            try {
                await User.register({
                    username: "admin",
                    img: "",
                    created_at: Date(),
                    updated_at: Date()
                }, "1234");
                return res.render("login", {title: "Login", alert: ""});
            } catch (err) {
                console.log(err);
                return res.render("login", {title: "Login", alert: ""});
            }
        }
        return res.render("login", {title: "Login", alert: ""});
    } catch (err) {
        console.log(err);
        return res.render("login", {title: "Login", alert: ""});
    }
}

exports.postLogin = async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    try {
        const foundUser = await User.findOne({username: user.username});
        if (!foundUser) {
            return res.render("login", {title: "Login", alert: showAlert("alert-danger", "username tidak terdaftar, silahkan coba lagi.")});
        }

        req.login(user, (err) => {
            if (err) {
                console.log(err);
                return res.redirect("/auth/login");
            }
            passport.authenticate('local')(req, res, function() {
                res.redirect('/admin/dashboard');
            });
        });
    } catch (err) {
        console.log(err);
        res.redirect("/auth/login");
    }
}

exports.getRegister = (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/admin/dashboard');
    } else {
        res.render("register", {title:"Register", alert: ""});
    }
}

exports.postRegister = async (req, res) => {
    const regUsername = req.body.username;
    const regPassword = req.body.password;
    const regConfirm_password = req.body.confirm_password;

    try {
        const foundUser = await User.findOne({username: regUsername});
        
        if (foundUser) {
            return res.render("register", {
                title: "Register", 
                alert: showAlert("alert-danger", "sudah pernah ada akun dengan username tersebut!")
            });
        }

        if (regPassword !== regConfirm_password) {
            return res.render("register", {
                title: "Register", 
                alert: showAlert("alert-danger", "password tidak cocok dengan confirm_password!")
            });
        }

        const user = await User.register({
            username: regUsername,
            img: "",
            created_at: Date(),
            updated_at: Date()
        }, regPassword);

        passport.authenticate('local')(req, res, () => {
            res.redirect('/admin/dashboard');
        });
    } catch (err) {
        console.log(err);
        res.redirect('/register');
    }
}

exports.postLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/admin/dashboard');
        }
        res.redirect('/auth/login');
    });
}

exports.getResetPassword = (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/auth/login');
    }
}

exports.getUpdatePassword = (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/auth/login');
    }
}