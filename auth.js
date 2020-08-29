var express = require("express")
var jwt = require("jsonwebtoken")
var crypto = require("crypto")
var fs = require("fs")

var app = express()

var logger = require("./logger")
var db = require("./db")

var key = fs.readFileSync("crt/jwt.key")
var pem = fs.readFileSync("crt/jwt.pem")

class User {
	constructor (name, email, passwordHash) {
		this.name = name.toLowerCase();
		this.email = email.toLowerCase();
		this.password = passwordHash
	}

	static insert (newTask, result) {
		db.GetConnection((connection) => {
			connection.query("INSERT INTO users SET ?", newTask, function (err, res) {
				if (err) {
					logger.error("error: " + err)
					result(err, null)
				} else {
					result(null, res)
				}
			})
		})
	}

	static tryLogin (email, passwordHash, result) {
    
		email = email.toLowerCase();

		db.GetConnection((connection) => {
			connection.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, passwordHash], function (err, res) {
				if (err) {
					logger.error("error: " + err)
					result(err, null)
				} else {
					result(null, res)
				}
			})
		})
	}
}
function Register (name, email, password, cb) {
	if (name.length > 32) {
		return cb({ status: "error", error: "name too long" })
	}
	var account = new User(name, email, crypto.createHash("sha512").update(password).digest("hex"))
	User.insert(account, (err) => {
		if (err) {
			return cb({ status: "error", error: err })
		}
		logger.success("Registered new user: " + name)
		return cb({ status: "ok", description: "registration successfull" })
	})
}
function Login (email, password, cb) {
	User.tryLogin(email, crypto.createHash("sha512").update(password).digest("hex"), (err, res) => {
		if (err) {
			return cb({ status: "error", error: err })
		}
		var dbRes = res[0]
		if (!dbRes) {
			return cb({ status: "error", error: "account not found" })
		}

		var payload = { sub: dbRes.id, name: dbRes.name, email: dbRes.email }
		var token = jwt.sign(payload, key)
		logger.success("Logged in user: " + dbRes.name)
		return cb({ status: "ok", token: token })
	})
}
function Authorized (theToken) {
	jwt.verify(theToken, pem, (err, decoded) => {
		if (err) {
			return { status: "error", error: "token invalid" }
		}
		return { status: "ok", id: decoded.id, name: decoded.name }
	})
}

app.post("/login", (req, res) => {
	logger.reqInfo(req)

	if (!req.body.email || !req.body.password) {
		return res.send(JSON.stringify({ status: "error", error: "password and/or email not provided" }))
	}
	Login(req.body.email, req.body.password, (threRes) => {
		return res.send(JSON.stringify(threRes))
	})
})
app.post("/register", (req, res) => {
	logger.reqInfo(req)
	if (!req.body.name || !req.body.password || !req.body.email) {
		return res.send(JSON.stringify({ status: "error", error: "password or name or email name not provided" }))
	}
	Register(req.body.name, req.body.email, req.body.password, (threRes) => {
		return res.send(JSON.stringify(threRes))
	})
})

var authMid = function(errorOnNotAuthed = true){
	return function (req, res, next) {
		logger.reqInfo(req)
  
		if (!req.headers.authorization) {
			if(errorOnNotAuthed){        
				return res.send(JSON.stringify({ status: "error", error: "token not provided" }))
			}
			else{
				return next();
			}
		}
		var authed = Authorized(req.headers.authorization)
		if (authed.status == "ok") {
			if(errorOnNotAuthed){
				return res.send(JSON.stringify(authed))
			}
			else{
				return next();
			}
		} else {
			req.token = req.headers.authorization
			req.userId = authed.id
			req.userName = authed.name
			return next()
		}
	}
}

module.exports = {
	authMid,
	Authorized,
	app,
	User
}
