'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        var socket = new SockJS('/chats');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);

    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.register",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    console.log(stompClient);
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function send(event) {
    var messageContent = messageInput.value.trim();

    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: cipher(messageInput.value.toString(),1),
            type: 'CHAT'
        };

        stompClient.send("/app/chat.send", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);


    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }
    console.log("message.content now: "+message.content);
    console.log("See if this works: ", message.content.includes("joined!")? (message.content):(cipher(message.content, 26-1)))
    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content.includes("joined!")? (message.content):(cipher(message.content, 26-1)));
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);
    console.log("textElement now: "+message.content);
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }

    var index = Math.abs(hash % colors.length);
    return colors[index];
}


//Encryption (Front end)
//check if letter is uppercase
function isUpperCase(str) {

    return str === str.toUpperCase();
}

//decipher the string
function cipher(str, key){
    console.log("CIPHER STRING :"+str)
    let decipher = '';

    //decipher each letter
    for(let i = 0; i < str.length; i++){
        if(str[i].includes(" ")){
            decipher+=str[i];
            continue;
        }
        //if letter is uppercase then add uppercase letters
        if(isUpperCase(str[i])){
            decipher += String.fromCharCode((str.charCodeAt(i) + key - 65) % 26 + 65);
        }else{
            //else add lowercase letters
            decipher += String.fromCharCode((str.charCodeAt(i) + key - 97) % 26 + 97);
        }
    }


    return decipher;
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', send, true);