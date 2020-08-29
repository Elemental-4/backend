var express = require("express");

var app = express();

var logger = require("./logger");
var db = require("./db");

class User {
	constructor(name, author, color) {
		this.name = name;
		this.color = color;
		this.author = author;
	}

	static insert(newTask, result) {
		db.GetConnection((connection) => {
			connection.query("INSERT INTO users SET ?", newTask, (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			});
		});
	}

	static GetAllElemets(result) {
		db.GetConnection((connection) => {
			connection.query("SELECT * FROM elements", [], (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			});
		});
	}
}

app.get("/elements", (req, res) => {
	logger.reqInfo(req);

	return res.send(JSON.stringify(User.GetAllElemets()));
});

module.exports = {
	app,
	User
};
