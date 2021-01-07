const path=require('path')
const http=require('http')
const express =require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
// const { deepStrictEqual } = require('assert')
const {generateMessage, generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser, getUser,getUsersInRoom}=require('./utils/users')


const app=express()
//to create new web server (refactoring) without changing behaviour
const server=http.createServer(app)
//configuring socket to work with server(stored in 'server' variable)
const io=socketio(server) //calling socketio as function

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))



//socket is an object which contains information about connection(newly connected client)
io.on('connection', (socket) => {
    console.log('New Websocket Connection')

    socket.on('join',(options,callback)=>{
        const {error,user}=addUser({ id:socket.id, ...options })

        if(error){
           return callback(error)
        }

        socket.join(user.room)
    
    //single client
    socket.emit('message',generateMessage('Admin','Welcome!'))        
    socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
    io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
    })

       //socket.emit(specific client), io.emit(every connected client), socket.broadcast.emit(every connected client except this)
       //io.to.emit(emits to everybody in a room),socket.broadcast.to.emit(to everybody in chatroom except this client)

       callback()

    })

   socket.on('sendMessage',(message,callback)=>{
       const user=getUser(socket.id)
        const filter=new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

      io.to(user.room).emit('message',generateMessage(user.username,message))    
      callback()
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback() 
    })

    socket.on('disconnect',()=>{
        const user =removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    }) 
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

