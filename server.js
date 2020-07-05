const morgan = require('morgan')
const helmet = require('helmet')
const express = require('express')

const app = express()
const PORT = process.env.PORT || 8080
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)

server.listen(PORT, () => {
	console.log("Listenting on port " + PORT)
})

app.use(morgan('common'))
app.use(helmet())

//Setting up webpage rendering
app.set('view engine','ejs')
app.set('views', './views')
app.use(express.static('public'))
app.use(express.json())


//Routes
app.get('/', (req, res) =>{
	res.render('rooms-page') 
})

app.get('/landing-page', (req, res) => {
	res.render('landing-page')
})

app.get('/rooms-page', (req, res) =>{
	res.render('rooms-page')
})

app.get('/screen-share-page', (req, res) =>{
	res.render('screen-share-page')
})

var rooms = {}

var tempRoomName = []

io.on('connection', socket => {
	//When someone goes to the room page, send them the list of rooms
	socket.on('room-query', () => {
		var roomList = Object.values(rooms)
		socket.emit("room-list", roomList)
	})

	//When someone creates a room, send everyone else the new room list
	socket.on("creating-new-room", roomname => {
		var users = {}
		rooms[roomname] = {name:roomname, users: users}
		var roomsList = Object.values(rooms)
		socket.emit("room-list", roomsList)
		socket.broadcast.emit("room-list", roomsList)
	})

	socket.on("check-room", roomname => {
		if(Object.values(rooms[roomname].users).length > 3){
			socket.emit("room-full")
		}
		else {
			tempRoomName.push(roomname)
			socket.emit("room-not-full")
		}
	})

	socket.on("join-room", username => {
		roomname = tempRoomName.pop()
		rooms[roomname].users[username] = {socketId: socket.id, name: username}
		var roomsList = Object.values(rooms)
		socket.emit("room-name", roomname)
		socket.broadcast.emit("room-list", roomsList)
	})

	//When a new user joins Send them a list of all other users in the room
	//Send every other user the information of the new user
	socket.on('new-user', roomname =>
	{
		const list = []
		const entries = Object.entries(rooms[roomname].users)
		entries.forEach(user => {
			if(socket.id != user[1].socketId){
				list.push(user)
			}
		})

		if(list.length != 0)
		{
			socket.emit("all-users", list)
			socket.broadcast.emit("user-joined-room", rooms[roomname].users[socket.id])
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
		var onScreenShare = false;
		var roomName
		var roomlist = Object.values(rooms)
		roomlist.forEach(room => {
			var userlist = Object.values(room.users)
			userlist.forEach(user => {
				if(user.socketId == socket.id){
					onScreenShare = true
					roomName = room.name
					delete rooms[room.name].users[user.name]
				}
			})
		})
		if(onScreenShare){
			var roomsList = Object.values(rooms)
			socket.broadcast.emit("room-list", roomsList)
			var userlist = Object.values(rooms[roomName].users)
			userlist.forEach(user => {
				io.to(user.socketId).emit('user-left-room', socket.id)
			})
		}
	})
	
	//When a new message recieved, sent it to all users
	socket.on('send-chat-message', payload => {
		//Broadcasts the chat message as well as the users name to all other sockets
		var userList = Object.values(rooms[payload.roomname].users)
		userList.forEach(user => {
			io.to(user.socketId).emit('chat-message', {message: payload.message, sender: payload.sender})
		})
	})
})

