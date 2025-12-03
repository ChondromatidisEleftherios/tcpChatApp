//@ts-check

"use strict";

import * as net from "net";

(function main() {
	let clientName;
	const portNum = 6666;
	const loopbackAddress = "127.0.0.1";
	const server = net.createServer(communicate);
	server.maxConnections = 10;

	function communicate(socket) {
		console.log(`Incoming connection from ${socket.remoteAddress} \n`);
		console.log("----- Chat area ----- \n");
		socket.once("data", getClientName);
		socket.on("error", handleError);
		process.stdin.on("data", sendMessage);

		function sendMessage(input) {
			const inputToString = input.toString();
			if (inputToString.trim() === "" || inputToString.trim() === undefined) {
				console.error("Empty Message! Try again! \n")
			}
			else {
				socket.write(inputToString);
				console.log("");
			}
		}

		function getClientName(name) {
			const nameToString = name.toString();
			clientName = nameToString;
			socket.on("data", showMessage);
		}
	}

	function showMessage(message) {
		const clientMessage = message.toString();
		console.log(`${clientName}: ${clientMessage}`);
	}

	server.listen({ port: portNum, host: loopbackAddress }, portAndIpInfo(portNum, loopbackAddress));

	function handleError(err) {
		console.log(`Connection could not be made, error message: ${err["message"]}`);
	}

	function portAndIpInfo(portNum, loopbackAddress) {
		console.log(`Server is Listening on port: ${portNum} and is connected to host: ${loopbackAddress}`);
	}

}());
