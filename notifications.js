var express = require("express");
var expressWs = require("express-ws")(express());

var app = expressWs.app;

app.ws("/notifications", (ws, req) => {
	ws.on("close", () => {
		console.log("WebSocket was closed");
	});
});

// Let all dashboard clients know.
function NotifyDashboard(data) {
	expressWs.getWss("/notifications").clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
}

module.exports = {
	app,
	NotifyDashboard
};
