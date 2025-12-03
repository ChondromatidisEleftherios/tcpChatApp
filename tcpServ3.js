//@ts-check

"use strict";

import * as net from "net";

(function main() {
	const chatGuide = `\nWelcome!\n- If you want to chat with a specific (online) user, just type their name and then the character /\nExample: Nick /Hey Nick! \n- If you want to message everyone who is online, type: everyone / \n- If you want to leave the chat, type: disconnect\n`;
	const clientsHashMap = new Map();
	const portNum = 6666;
	const loopbackAddress = "127.0.0.1";
	const server = net.createServer(communicate);
	server.maxConnections = 10;

	function communicate(socket) {
		console.log(`Incoming connection from ${socket.remoteAddress} \n`);
		socket.write(chatGuide);
		socket.once("data", getNewlyConnectedClientName);
		socket.on("end", removeDisconnectedUser);
		socket.on("error", handleError);

		//All following Functions are nested inside the communicate function
		function getNewlyConnectedClientName(name) {
			const nameToString = name.toString();
			clientsHashMap.set(nameToString, socket);
			socket.on("data", checkMessageForLogicErrors);
		}

		function checkMessageForLogicErrors(message) {
			const socketUndefinedError = "The receiver does not exist or is NOT connected at the moment!\n";
			const sendingMessageToYourselfError = "You cannot send messages to yourself!\n";
			const emptyMessageContentError = "You cannot send an empty message!\n";

			const messageSender = getSenderName(socket);
			const clientOriginalMessage = message.toString();
			const specialCharacterIndex = clientOriginalMessage.indexOf("/");
			const [receiverSocket, clientMessage] = configureMessageFormat(clientOriginalMessage, specialCharacterIndex);
			if (receiverSocket === undefined) {
				socket.write(socketUndefinedError);
			}
			else if (receiverSocket === socket) {
				socket.write(sendingMessageToYourselfError);
			}
			else if (clientMessage && clientMessage.trim() === "") { //clientMessage is checked to prevent a runtime error, so that it doesn;t try to trim a non string value
				socket.write(emptyMessageContentError);
			}
			else if (receiverSocket && receiverSocket !== "everyone") {
				forwardMessageToOneClient(messageSender, clientMessage, receiverSocket);
			}
			else if (receiverSocket && receiverSocket === "everyone") {
				forwardMessageToEveryClient(messageSender, clientMessage);
			}
		}

		function configureMessageFormat(clientOriginalMessage, specialCharacterIndex) {
			const missingSpecialCharacterError = "Error!!! Special character / or Receiver name not found!\n";

			if (specialCharacterIndex >= 1) {
				const clientMsg = clientOriginalMessage.slice(specialCharacterIndex + 1, clientOriginalMessage.length);
				let msgReceiver = clientOriginalMessage.slice(0, specialCharacterIndex);
				msgReceiver = msgReceiver.trim();
				const receiverSock = checkIfOneReceiver(msgReceiver);
				return [receiverSock, clientMsg];
			}
			else {
				socket.write(missingSpecialCharacterError)
				return [false, false];
			}
		}

		function checkIfOneReceiver(msgReceiver) {
			if (msgReceiver !== "everyone") {
				const receiverSock = clientsHashMap.get(msgReceiver);
				return receiverSock;
			}
			else {
				return "everyone";
			}
		}

		function forwardMessageToOneClient(messageSender, clientMessage, receiverSocket) {
			const formatMessage = `${messageSender}: ${clientMessage}`;
			receiverSocket.write(formatMessage);
		}

		function forwardMessageToEveryClient(messageSender, clientMessage) {
			const formatMessage = `${messageSender}: ${clientMessage}`;
			for (let [client, sock] of clientsHashMap) {
				if (client !== messageSender) {
					sock.write(formatMessage);
				}
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
			if (err["message"] === "read ECONNRESET") {
				removeDisconnectedUser();
			}
		}
	}

	//Outside of communicate Function

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
