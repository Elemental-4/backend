var express = require("express");
var startCase = require("startCase");

var app = express();

var logger = require("./logger");
var db = require("./db");

class Element {
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

	static GetUserOwned(userId, result){
		db.GetConnection((connection) => {
			connection.query("SELECT element_id FROM user_element WHERE user_id = ?", [userId], function (err, res) {
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

var defaultElements = [];
Element.GetElementsFromIdList([1, 2, 3, 4], (error, theRes) =>{
	if(error){
		logger.error("Couldnt get default elemets at 1 2 3 4");
		process.exit();
	}
	defaultElements = theRes;
})

app.get("/elements", (req, res) => {
	logger.reqInfo(req)
	if(!req.userId){
		return res.send(JSON.stringify(defaultElements));
	}
	else{
		Element.GetUserOwned(req.userId, (error, theRes) =>{
			if(error)
				return res.send(JSON.stringify({ status: "error", error: error }));
			
			if(theRes.length > 0){
				Element.GetElementsFromIdList(theRes, (error, theRes) =>{
					if(error){
						return res.send(JSON.stringify({ status: "error", error: error }));
					}
					return res.send(JSON.stringify([...defaultElements, ...theRes]));
				})
			}
			else
			{
				return res.send(JSON.stringify(defaultElements));
			}
		})
	}

	//return res.send(JSON.stringify(User.GetAllElemets()))
})

module.exports = {
	app,
	Element
}
