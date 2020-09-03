var express = require("express");
var startCase = require("startCase");

var app = express();

var logger = require("./logger");
var db = require("./db");

class Element {
	constructor(name, author, color) {
		this.name = startCase(name);
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

	static GetElementByName(name, result) {
		db.GetConnection((connection) => {
			connection.query("SELECT * FROM elements WHERE name = ?", [name], (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			});
		});
	}

	static GetElementById(id, result) {
		db.GetConnection((connection) => {
			connection.query("SELECT * FROM elements WHERE id = ?", [id], (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			});
		});
	}

	static GetElementsFromIdList(theArray, result) {
		if (Array.isArray(theArray) && theArray.length) {
			db.GetConnection((connection) => {
				connection.query("SELECT * FROM elements WHERE id IN (?)", [theArray], (err, res) => {
					if (err) {
						logger.error("error: " + err);
						result(err, null);
					} else {
						result(null, res);
					}
				});
			});
		}
		else {
			result({ error: "not an array" }, null);
		}

	}

	static GetUserOwned(userId, result) {
		db.GetConnection((connection) => {
			connection.query("SELECT element_id FROM user_element WHERE user_id = ?", [userId], (err, res) => {
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

var defaultElements = [];
Element.GetElementsFromIdList([1, 2, 3, 4], (error, theRes) => {
	if (error) {
		logger.error("Couldn't get default elements at 1 2 3 4");
		process.exit();
	}
	defaultElements = theRes;
});

app.get("/elements", (req, res) => {
	logger.reqInfo(req);
	if (!req.userId) {
		return res.send(JSON.stringify(defaultElements));
	}
	Element.GetUserOwned(req.userId, (error, theRes) => {
		if (error)
			return res.send({ status: "error", error: error });

		if (theRes.length > 0) {
			Element.GetElementsFromIdList(theRes, (error, theRes) => {
				if (error) {
					return res.send({ status: "error", error: error });
				}
				return res.send([...defaultElements, ...theRes]);
			});
		}
		else {
			return res.send(defaultElements);
		}
	});
});

module.exports = {
	app,
	Element
};
