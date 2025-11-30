//@ts-check

"use strict";

import * as net from "net";

(function main() {
	const chatGuide = `Welcome! If you want to chat with a specific (online) user, just type their name and then the character /\nExample: Nick /Hey Nick! \nType: Disconnect to leave the chat\n`;
	const clientsHashMap = new Map();
	const portNum = 6666;
	const loopbackAddress = "127.0.0.1";
	const server = net.createServer(communicate);
	server.maxConnections = 10;

	function communicate(socket) {
		console.log(`Incoming connection from ${socket.remoteAddress} \n`);
		socket.write(chatGuide);
		socket.once("data", getClientName);
		socket.on("end", removeDisconnectedUser);
		socket.on("error", handleError);

		function getClientName(name) {
			const nameToString = name.toString();
			clientsHashMap.set(nameToString, socket);
			socket.on("data", forwardMessageToOneClient);
		}


		function forwardMessageToOneClient(message) {
			const messageSender = getSenderName(socket);
			const clientOriginalMessage = message.toString();
			const specialCharacterIndex = clientOriginalMessage.indexOf("/");
			if (specialCharacterIndex >= 1) {
				const clientMessage = clientOriginalMessage.slice(specialCharacterIndex + 1, clientOriginalMessage.length);
				let messageReciever = clientOriginalMessage.slice(0, specialCharacterIndex);
				messageReciever = messageReciever.trim();
				const recieverSocket = clientsHashMap.get(messageReciever);
				if (recieverSocket === undefined) {
					socket.write("User does not exist or is NOT connected at the moment!\n");
				}
				else if (recieverSocket === socket) {
					socket.write("You cannot send messages to youself!\n");
				}
				else {
					const formatMessage = `${messageSender}: ${clientMessage}`;
					recieverSocket.write(formatMessage);
				}
			}
			else {
				socket.write("Error! No special character / found!\n");
			}
		}

		function removeDisconnectedUser() {
			console.log(clientsHashMap);
			const messageSender = getSenderName(socket);
			clientsHashMap.delete(messageSender);
			console.log(clientsHashMap);
		}

		function handleError(err) {
			console.log(`Connection could not be made, error message: ${err["message"]}`);
			if (err["message"] == "read ECONNRESET") {
				removeDisconnectedUser();
			}
		}
	}

	server.listen({ port: portNum, host: loopbackAddress }, portAndIpInfo(portNum, loopbackAddress));

	function getSenderName(senderSocket) {
		for (let [sender, sock] of clientsHashMap) {
			if (sock === senderSocket) {
				return sender;
			}
		}
	}


	function portAndIpInfo(portNum, loopbackAddress) {
		console.log(`Server is Listening on port: ${portNum} and is connected to host: ${loopbackAddress}`);
	}

}());
