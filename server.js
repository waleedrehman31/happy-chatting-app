const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formateMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//? Set Static Folder.
    app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat Bot';

//* Run when client connect.
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //* When User Connect
        socket.emit('message', formateMessage(botName, 'Welcome to my chat'));

        //* Broadcast when user connects.
        socket.broadcast.to(user.room).emit(
            'message', 
            formateMessage(botName, `A ${user.username} has join the chat`
            ));

        //* Sent user and room info.
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

//*Listen for chatMessage.
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formateMessage(user.username, msg));
    });

//! This run when client disconnect.
    socket.on('disconnect', ()=> {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message', 
                formateMessage(botName, `A ${user.username} have left the chatt`)
            );

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`listening on http://localhost:${port}`))