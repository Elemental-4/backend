var logger = require("./logger");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");
var nanoid = require("nanoid");
const { ok } = require("assert");

var key = fs.readFileSync('crt/jwt.key');
var pem = fs.readFileSync('crt/jwt.pem');

var accounts = {};

function Register(name, password){
    if(name.length < 32){
        return {status: "error", error: "name too long"};
    }
    if(name in accounts){
        return {status: "error", error: "name already used"};
    }
    var acc = {id: nanoid(), name: name, password: crypto.createHash("sha256").update(password).digest("hex")};
    accounts[name] = acc;
    return {status: "ok", description: "registration successfull"};
}
function Login(name, password){
    if(name in accounts){
        if(accounts[name].password == crypto.createHash("sha256").update(password).digest("hex")){
            var payload = { sub: accounts[name].id, name: name};
            var token = await jwt.sign(payload, key, {expiresIn: "12h"});
            return {status: "ok", token: token};
        }
    }
    else{
        return {status: "error", error: "user not found"};
    }
}
function Authorized(theToken){
    await jwt.verify(theToken, pem, (err, decoded) => {
        if(err){
            return {status: "error", error: "token invalid"}
        }
        return {status: "ok", id: decoded.id, name: decoded.name};

    });
}

module.exports = {
	Authorized,
	Register,
	Login,
};