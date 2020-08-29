var express = require("express");
var startCase = require("startCase");

var app = express();

var logger = require("./logger");
var db = require("./db");

class User {
	constructor (name, author, color) {
		this.name = startCase(name);
		this.color = color;
		this.author = author;
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

	static GetAllElemets (result) {
		db.GetConnection((connection) => {
			connection.query("SELECT * FROM elements", [], function (err, res) {
				if (err) {
					logger.error("error: " + err)
					result(err, null)
				} else {
					result(null, res)
				}
			})
		})
	}

	static GetElementsFromIdList(theArray, result){
		if(Array.isArray(theArray) && theArray.length)
		{
			db.GetConnection((connection) => {
				connection.query("SELECT * FROM elements WHERE id IN (?)", [theArray], function (err, res) {
					if (err) {
						logger.error("error: " + err)
						result(err, null)
					} else {
						result(null, res)
					}
				})
			})
		}
		else{
			result({error: "not an array"}, null);
		}

	}
}

app.get("/elements", (req, res) => {
	logger.reqInfo(req)
	if(!req.userId){

	}
	else{

	}

	//return res.send(JSON.stringify(User.GetAllElemets()))
})

module.exports = {
	app,
	User
}
