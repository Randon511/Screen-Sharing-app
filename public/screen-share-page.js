var Peer = require('simple-peer')
const socket = io()
var videoStream = null
var streamHost = false; 

//Vars for the share screen page
var messageContainer = document.getElementById('message-container')
var messageForm = document.getElementById('send-container')
var messageInput = document.getElementById('message-input')
var shareButton = document.getElementById('start-sharing-button')
var stopButton = document.getElementById('stop-button')
var video = document.getElementById('video')
var numberOfUsers = document.getElementById('number-of-users')

//keeps a reference of every peer and its socket id {peerId, peer}
peersRef = []
//Get user to enter their name and add them to the user list
var roomName = ""
var userName = ""

userName = prompt("Enter your name")
while(userName == ""){
    userName = prompt("Please enter a name")
}

socket.emit("join-room", userName)

socket.on("room-name", name => {
	roomName = name
	socket.emit("new-user", roomName)
})

//A new user has joined the room so we neer to make peer connections with all other users in the room
socket.on('all-users', users => {
	if(users.length != 0){
		users.forEach(user => {
			const peer = createPeer(user[1].socketId, socket.id)
			peersRef.push({
				peerId: user[1].socketId,
				peer
			})
		})
	}
	setNumberOfUsers()
})

socket.on('user-joined-room', user => {
	const peer = createPeer(user, socket.id)
	peersRef.push({
		peerId: user,
		peer
	})
	setNumberOfUsers()
})

socket.on('user-left-room', userId => {
	peersRef.forEach(user => {
		if(user.peerId == userId){
			user.peer.destroy()
		}
	})

	peersRef = peersRef.filter(elem => elem.peerId != userId)
	setNumberOfUsers()
})

//When a user has joined, create a peer for them and add them to the list
socket.on("recieving-signal", payload => {
	const peer = addPeer(payload.signal, payload.callerId)
})

socket.on("recieving-returned-signal", payload => {
	const item = peersRef.find(p => p.peerId === payload.id)
	item.peer.signal(payload.signal)
})

socket.on("chat-message", payload => {
	appendMessage(`${payload.message}`,`${payload.sender}`)
})

///////////////////////////////////////////
/*Event listeners                        */
///////////////////////////////////////////
messageForm.addEventListener('submit', e=> {
	//Prevents page from refreshing when we click send
	e.preventDefault()
	//Sends the message typed in the input form to the server
	if(messageInput.value != "")
	{
		socket.emit('send-chat-message', {message: messageInput.value, roomname: roomName, sender: userName})
		messageInput.value = ""
	}
})

//listens for when the user clicks the share button
shareButton.addEventListener('click', e=> {
	//Prevents page from refreshing
	e.preventDefault()
	getVideoStream()
})

stopButton.addEventListener('click', e=> {
	//Prevents page from refreshing
	e.preventDefault()
	stopStreaming()
})

///////////////////////////////////////////
/**************Functions******************/
///////////////////////////////////////////
function createPeer(userToSignal, callerId){
	const peer = new Peer({
		initiator: true
	})
	
	peer.on("signal", signal => {
		socket.emit("sending-signal", {userToSignal, callerId, signal})
	})

	peer.on("stream", stream => {
		video.srcObject = stream
		video.play()
		toggleShareButton()
	})

	peer.on("connect", () => {
		console.log("Connect in create")
	})

	peer.on("error", err => {
		console.log(err)
	})

	return peer
}

function addPeer(incomingSignal, callerId){
	const peer = new Peer({
		initiator: false
	})

	peer.on("signal", signal => {
		socket.emit("returning-signal", {signal, callerId})
	})
	
	peer.on("stream", stream => {
		video.srcObject = stream
		video.play()
		toggleShareButton()
	})

	peer.on("connect", () => {
		console.log("Connect in add")
	})

	peer.on("error", err => {
		console.log(err)
	})

	peer.signal(incomingSignal)
	return peer
}

//Add messages to the chat
function appendMessage(message,sender){
	//Create a new div
	const messageElement = document.createElement('div')

	const messageContent = document.createElement('div')
	messageContent.classList.add('messageContent')

	const messageAuthor = document.createElement('div')
	messageAuthor.classList.add('messageAuthor')
	
	if(sender == userName){
		messageElement.classList.add('myMessage')
	}
	else{
		messageElement.classList.add('otherMessage')
	}
	
	//Set the text in the div to the message
	messageContent.innerText = message
	messageAuthor.innerText = sender
	messageElement.append(messageAuthor)
	messageElement.append(messageContent)
	messageContainer.append(messageElement)
	//scroll to the bottom when a new message is added
	messageContainer.scrollTop = messageContainer.scrollHeight
}


//Screen share start function
async function getVideoStream() {
	displayMediaOptions = {
		video:{
			//Cursor only visible when moved
			cursor:"motion"
		},
		audio:{
			autoGainControl: false,
    		channelCount: 2,
    		echoCancellation: false,
   	 		latency: 0,
    		noiseSuppression: false,
    		sampleRate: 48000,
    		sampleSize: 16,
			volume: 1.0
		}
	}

	try {
		videoStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
	} catch(err) {
	  console.error("Error: " + err);
	}
	video.srcObject = videoStream
	streamHost = true
	streamVideo()
	toggleShareButton()
	toggleStopButton()
}

function streamVideo(){	
	console.log(peersRef)
	if (peersRef.length != 0){
		peersRef.forEach(user => {
			user.peer.addStream(videoStream)
		})
	}
}

function stopStreaming(){	
	if(streamHost){
		video.srcObject = null
		toggleShareButton()
		toggleStopButton()
	}
	else{
		toggleShareButton()
	}

	if (peersRef.length != 0){
		peersRef.forEach(user => {
			user.peer.removeStream(videoStream)
		})
	}
}


function toggleShareButton(){	 
	if(shareButton.style.display == "none"){
		shareButton.style.display = "initial"
	}
	else{
		shareButton.style.display = "none"
	}
}

function toggleStopButton(){	 
	if(stopButton.style.display == "none"){
		stopButton.style.display = "initial"
	}
	else{
		stopButton.style.display = "none"
	}
}

function setNumberOfUsers(){
	numberOfUsers.innerText = 1 + peersRef.length
}