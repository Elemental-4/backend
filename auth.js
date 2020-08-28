var express = require("express");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");
var nanoid = require("nanoid");
var fs = require("fs");

var app = express();

var logger = require("./logger");

var key = fs.readFileSync('crt/jwt.key');
var pem = fs.readFileSync('crt/jwt.pem');

var accounts = {};

function Register(name, password){
    if(name.length > 32){
        return {status: "error", error: "name too long"};
    }
    if(name in accounts){
        return {status: "error", error: "name already used"};
    }
    var acc = {id: nanoid.nanoid(), name: name, password: crypto.createHash("sha256").update(password).digest("hex")};
    accounts[name] = acc;
    logger.success("Registered new user: " + name);
    return {status: "ok", description: "registration successfull"};
}
function Login(name, password){
    if(name in accounts){
        if(accounts[name].password == crypto.createHash("sha256").update(password).digest("hex")){
            var payload = { sub: accounts[name].id, name: name};
            var token = jwt.sign(payload, key);
            logger.info("Logged in user: " + name);
            return {status: "ok", token: token};
        }
    }
    else{
        return {status: "error", error: "username or email not found not found"};
    }
}
function Authorized(theToken){
    jwt.verify(theToken, pem, (err, decoded) => {
        if(err){
            return {status: "error", error: "token invalid"}
        }
        return {status: "ok", id: decoded.id, name: decoded.name};

    });
}

app.post("/login", (req, res) => {
    logger.reqInfo(req);

    if(!req.body.name || !req.body.password){
        return res.send(JSON.stringify({status: "error", error: "password or name not provided"}));
    }
    return res.send(JSON.stringify(Login(req.body.name, req.body.password)));
});
app.post("/register", (req, res) => {
    logger.reqInfo(req);
    if(!req.body.name || !req.body.password){
        return res.send(JSON.stringify({status: "error", error: "password or name not provided"}));
    }
    return res.send(JSON.stringify(Register(req.body.name, req.body.password)));
});

var authMid = function (req, res, next) {
    logger.reqInfo(req);

    if(!req.headers.authorization){
        return res.send(JSON.stringify({status: "error", error: "password or name not provided"}));
    }
    authed = Authorized(req.headers.authorization);
    if(authed.status == "ok"){
        return res.send(JSON.stringify(authed));
    }
    else{
        req.token = req.headers.authorization;
        req.userId = authed.id;
        req.userName = authed.name;
        next();
    }
  }

module.exports = {
    authMid,
    Authorized,
	app
};