var express = require("express");

var app = express();

var auth = require("./auth");
var element = require("./element");
var logger = require("./logger");
var db = require("./db");
var notification = require("./notifications");
var config = require("./config.json");

class Recipe {
	constructor (iA, iB, output, author) {
		var {inputA, inputB} = Recipe.parseInputs(iA, iB);
		this.inputA = inputA;
		this.inputB = inputB;

		this.output = output;
		this.author = author;
	}

	static parseInputs(iA, iB){
		let inputA = iA <= iB ? iA : iB;
		let inputB = iB >= iA ? iB : iA;
        
		return {inputA, inputB};
	}

		return { inputA, inputB };
	}

	static insert(newTask, result) {
		db.GetConnection((connection) => {
			connection.query("INSERT INTO recipes SET ?", newTask, (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			})
		})
	}
    
	static GetRecipeByInputs (iA, iB, result) {        
		var {inputA, inputB} = Recipe.parseInputs(iA, iB);

	static GetRecipeByInputs(iA, iB, result) {
		var { inputA, inputB } = Recipe.parseInputs(iA, iB);

		db.GetConnection((connection) => {
			connection.query("SELECT * FROM recipes WHERE inputA = ? AND inputB = ?", [inputA, inputB], (err, res) => {
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
class Suggestion {
	constructor (iA, iB, output, output_col, author) {
		var {inputA, inputB} = Recipe.parseInputs(iA, iB);
		this.inputA = inputA;
		this.inputB = inputB;

		this.output = output;
		this.output_col = output_col;
        
		this.author = author;
	}

	static insert (newTask, result) {
		db.GetConnection((connection) => {
			connection.query("INSERT INTO suggestions SET ?", newTask, (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			})
		})
	}
    
	static voteFor (suggId, userId, negative, result) {
		db.GetConnection((connection) => {
			connection.query("REPLACE INTO suggestion_user_votes SET suggestion = ?, user = ?, negative = ?", [suggId, userId, negative], (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			})
		})
	}
    
	static GetSuggestionsByInputs (iA, iB, result) {        
		var {inputA, inputB} = Recipe.parseInputs(iA, iB);

	static GetSuggestionsByInputs(iA, iB, result) {
		var { inputA, inputB } = Recipe.parseInputs(iA, iB);

		db.GetConnection((connection) => {
			connection.query("SELECT * FROM suggestions WHERE inputA = ? AND inputB = ?", [inputA, inputB], (err, res) => {
				if (err) {
					logger.error("error: " + err);
					result(err, null);
				} else {
					result(null, res);
				}
			})
		})
	}
    
	static GetSuggestionByInputsAndOutput (iA, iB, output, result) {        
		var {inputA, inputB} = Recipe.parseInputs(iA, iB);

	static GetSuggestionByInputsAndOutput(iA, iB, output, result) {
		var { inputA, inputB } = Recipe.parseInputs(iA, iB);

		db.GetConnection((connection) => {
			connection.query("SELECT * FROM suggestions WHERE inputA = ? AND inputB = ? AND output = ?", [inputA, inputB, output], (err, res) => {
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

app.post("/recipe", (req, res) => {
	logger.reqInfo(req)
    
	var {inputA, inputB} = Recipe.parseInputs(req.body.inputA, req.body.inputB);
	if(!inputA || !inputB){
		return res.send({ status: "error", error: "inputs not given"});
	}
	Recipe.GetRecipeByInputs(inputA, inputB, (err, theRes) => {
		if(err){
			return res.send({ status: "error", error: err});
		}
		if(theRes.length > 0){
			var theOut = theRes[0];
			element.Element.GetElementById(theRes[0].output, (err, theElRes) => {
				if(err){
					return res.send({ status: "error", error: err});
				}
				theOut.output = theElRes[0];
				return res.send({ recipe: theOut});
			});
		}
		else{
			Suggestion.GetSuggestionsByInputs(inputA, inputB, (err, theRes) => {
				if(err){
					return res.send({ status: "error", error: err});
				}
				return res.send({suggestions: theRes});
			})
		}
	})

	//return res.send(JSON.stringify(User.GetAllElemets()))
});

function TakeWalidSuggestionsAndPromoteThemToRecipe() {

}

app.post("/recipe/new", auth.authMid(), (req, res) => {
	logger.reqInfo(req)

	var {inputA, inputB} = Recipe.parseInputs(req.body.inputA, req.body.inputB);
	var output = req.body.output;
	var output_col = req.body.output_col;
	var negative = req.body.negative || false;

	if (!inputA || !inputB || !output) {
		return res.send({ status: "error", error: "not everything required was given" });
	}
	Recipe.GetRecipeByInputs(inputA, inputB, (err, theRes) => {
		if(err){
			return res.send({ status: "error", error: err});
		}
		if(theRes.length > 0){
			return res.send({ status: "error", error: "recipe with those inputs already exists, please update your db"});
		}
		else{
			Suggestion.GetSuggestionByInputsAndOutput(inputA, inputB, output, (err, theRes) => {
				if(err){
					return res.send({ status: "error", error: err});
				}
				if(theRes.length > 0){//vote for it
					Suggestion.voteFor(theRes[0].id, req.userId, negative, (err, theVoteRes)=>{
						if(err){
							return res.send({ status: "error", error: err});
						}
						console.log(theVoteRes);
						res.send({ status: "ok", description: "vote sent for suggestion: " + theRes[0].id });

						//should calculate stuff
						TakeWalidSuggestionsAndPromoteThemToRecipe();
						return;
					});
				}
				else // add it
				{
					if(!output_col){
						return res.send({ status: "error", error: "not everything required was given"});
					}
					sugg = new Suggestion(inputA,inputB, output, output_col, req.userId);
					Suggestion.insert(sugg, (err, theRes) =>{
						if(err){
							return res.send({ status: "error", error: err});
						}
						Suggestion.voteFor(theRes.insertId, req.userId, false, (err, theVoteRes)=>{
							if(err){
								return res.send({ status: "error", error: err});
							}
							return res.send({ status: "ok", description: "created new suggestion and voted for it " + theRes[0].id });
						});
					});
				}
			})
		}
	})

	//return res.send(JSON.stringify(User.GetAllElemets()))
});

module.exports = {
	app,
	Recipe
};
