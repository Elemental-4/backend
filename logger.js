require("colors");
var fs = require("fs");

var log = fs.createWriteStream(__dirname + "/server.log");

function info(data, req = null) {
	if (req) {
		data += "   by " + (req.steamID ? req.steamID : req.connection.remoteAddress);
	}
	const time = new Date();
	log.write("[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] (INFO) " + data + "\n");
	console.log(data.cyan.bold);
}
function reqInfo(req) {
	info(req.method + " " + req.originalUrl, req);
}
function error(data, req = null) {
	if (req != null) {
		data += "   by " + (req.steamID ? req.steamID : req.connection.remoteAddress);
	}
	const time = new Date();
	log.write("[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] (ERROR) " + data + "\n");
	console.log(data.red.bold);
}
function success(data, req = null) {
	if (req) {
		data += "   by " + (req.steamID ? req.steamID : req.connection.remoteAddress);
	}
	const time = new Date();
	log.write("[" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "]  (SUCCESS) " + data + "\n");
	console.log(data.green.bold);
}
module.exports = {
	info,
	error,
	success,
	reqInfo
};
