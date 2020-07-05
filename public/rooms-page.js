const socket = io()
const $ = require('jquery')

var roomContainer = document.getElementById('rooms-page')
var createRoomButton = document.getElementById('create-room-button')
var roomList = []
var username = ""

socket.emit("room-query")
socket.on("room-list", rooms => {
    $("div.rooms").remove()
    roomList = rooms
    roomList.forEach(room => {
        createRoom(room.name)
        updateUsers(room)
    })
})

socket.on("room-full", () => {
    Alert("This room is full")
})

socket.on("room-not-full", () => {
    var currentPage = window.location
    window.location = currentPage + "screen-share-page"
})

createRoomButton.addEventListener('click', e =>{
    e.preventDefault;
    roomName = prompt("Enter a name for the room")
    socket.emit("creating-new-room", roomName)
})

function createRoom(roomName){
    room = document.createElement('div')
    btn = document.createElement('BUTTON')
    room.setAttribute("id",roomName)
    room.setAttribute("class","rooms")
    room.innerText = roomName
    room.insertAdjacentHTML('beforeend',`
        <div class="room-users"><i class="material-icons">person</i>
            <span id="number-of-users-in-`+roomName+`">0</span>
        </div>
    `)
    btn.setAttribute("title","Join room")
    btn.setAttribute("type","submit")
    btn.setAttribute("id","join-room-button")
    btn.insertAdjacentHTML('beforeend',`<i class="material-icons">forward</i>`)
    btn.addEventListener('click', joinRoom)

    room.appendChild(btn)
    createRoomButton.before(room)
}

function updateUsers(room){
    var numUsersInRoom = document.getElementById("number-of-users-in-" + room.name)
    var num_users = Object.keys(room.users).length 
    numUsersInRoom.innerText = num_users
}

function joinRoom(){
    socket.emit("check-room", this.parentNode.id)
}
