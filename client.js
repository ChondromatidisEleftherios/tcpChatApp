//@ts-check

"use strict";

import * as net from "net";

(function main() {
	const portNum = 6666;
	const loopbackAddress = "127.0.0.1";
	const username = process.argv[2];
	if (username === undefined) {
		console.error("No Username inserted!!! Terminating...");
		return 1;
	}
	const client = net.createConnection({ port: portNum, host: loopbackAddress }, communicate);
	client.on("data", receiveServerMessage);
	client.on("error", handleError);
	client.on("end", endCommunication);

	function communicate() {
		console.log("\nSuccessfully Connected to Server! \n");
		console.log("----- Chat area ----- \n");
		client.write(username.toString());
		process.stdin.on("data", getInput);
		function getInput(input) {
			const inputToString = input.toString();
			if (inputToString.trim() === "" || inputToString.trim() === undefined) {
				console.error("Empty Message! Try again! \n")
			}
			else {
				client.write(inputToString);
				console.log("");
			}
		}
	}

	function receiveServerMessage(message) {
		const messageToString = message.toString();
		console.log(`Server: ${messageToString}`);
	}

	function endCommunication() {
		console.log("GoodBye!");
	}

	function handleError(err) {
		console.log(`Connection could not be made, error message: ${err["message"]}`);
	}


}());