function getCounterparts(chatrooms, username) {
    return chatrooms.flatMap(chatroom =>
        chatroom.name.filter(name => name !== username)
    );
}

module.exports = getCounterparts;