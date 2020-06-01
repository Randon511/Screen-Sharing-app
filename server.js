const io = require('socket.io')(8000)
const users = {}

io.on('connection', socket => {
	//When a new user joins, save their name and notify other users
	socket.on('new-user', name =>
	{
		users[socket.id] = name
		socket.broadcast.emit('user-connected', name)
	})

	//When a new message is recieved, sent it to all users
	socket.on('send-chat-message', data => {
		//Broadcasts the chat message as well as the users name to all other sockets
		socket.emit('chat-message', {message: data, name: users[socket.id]})
		socket.broadcast.emit('chat-message', {message: data, name: users[socket.id]})
		//socket.broadcast.emit('chat-message', {message: data, name: users[socket.id]})
	})
})


