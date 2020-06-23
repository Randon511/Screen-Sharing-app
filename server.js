const io = require('socket.io')(8000)
const users = {}

io.on('connection', socket => {
	//When a new user joins:
	//Send them a list of all other users in the room
	//Send every other user the information of the new user
	socket.on('new-user', payload =>
	{
		users[socket.id] = {socketId: socket.id, name: payload.name}
		const list = []
		const entries = Object.entries(users)
		entries.forEach(user => {
			if(socket.id != user[1].socketId){
				list.push(user)
			}
		})

		if(list.length != 0)
		{
			socket.emit("all-users", list)
			socket.broadcast.emit("user-joined-room", users[socket.id])
		}
	})

	socket.on('sending-signal', payload =>
	{
		io.to(payload.userToSignal).emit('recieving-signal', {signal: payload.signal, callerId: payload.callerId})
	})

	socket.on('returning-signal', payload =>
	{
		io.to(payload.callerId).emit('recieving-returned-signal', {signal: payload.signal, id: socket.id})
	})

	socket.on('disconnect', () =>
	{
		delete users[socket.id]
		socket.broadcast.emit('user-left-room', socket.id)
	})
	
	//When a new message recieved, sent it to all users
	socket.on('send-chat-message', message => {
		//Broadcasts the chat message as well as the users name to all other sockets
		socket.emit('chat-message', {message: message, name: users[socket.id].name})
		socket.broadcast.emit('chat-message', {message: message, name: users[socket.id].name})
	})
})

