const socket = io('http://127.0.0.1:8000')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')
const messageContainer = document.getElementById('message-container')
const popupContainer = document.getElementById('popup-container')

//Get user to enter their name and add them to the user list
const name = prompt("Enter a name")
socket.emit('new-user', name)

//Inform other users that new user has joined
//socket.on('user-connected', name => {
//	appendMessage(`${name} joined`)
//})

socket.on('chat-message', data => {
	appendMessage(`${data.name}:\n${data.message}`, data.name)
})

//listens for when the user clicks the submit button
messageForm.addEventListener('submit', e=> {
	//Prevents page from refreshing when we click send
	e.preventDefault()
	const message = messageInput.value
	//Sends the message typed in the input form to the server
	if(message != "")
	{
		socket.emit('send-chat-message', message)
		messageInput.value = ''
	}
})

//Add recieved messages to the chat
function appendMessage(message,sender){
	//Create a new div
	const messageElement = document.createElement('div')
	if(sender == name){
		messageElement.classList.add('myMessage')
	}
	else{
		messageElement.classList.add('otherMessage')
	}
	//Set the text in the div to the message
	messageElement.innerText = message
	messageContainer.append(messageElement)
	//scroll to the bottom when a new message is added
	messageContainer.scrollTop = messageContainer.scrollHeight
}

