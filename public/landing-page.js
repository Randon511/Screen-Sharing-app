var $ = require('jquery')
//vars for the loign page
var usernameInput = document.getElementById('username-input')
var passwordInput = document.getElementById('password-input')
var loginButton = document.getElementById('login-button')
var signUpButton = document.getElementById('sign-up-button')

///////////////////////////////////////////
/****Event listeners on the login page****/
///////////////////////////////////////////
loginButton.addEventListener('click', e=> {
	//Prevents page from refreshing
	e.preventDefault()
	if(usernameInput.value === "" || passwordInput.value === ""){
		alert("You must enter a username and password")
	}else{
		const url = "/login"
		const data = JSON.stringify({
			username: usernameInput.value,
			passowrd: passwordInput.value
		})
		console.log(data)
		$.post(url,data)
	}
})

signUpButton.addEventListener('click', e=> {
	//Prevents page from refreshing
	e.preventDefault()
	if(usernameInput.value === "" || passwordInput.value === ""){
		alert("You must enter a username and password")
	}
})


function createLoginRequest(){

}

function createSignUpRequest(){
    
}