import express from "express"
import socketIO from "socket.io"
import http from "http"


const PORT = 5000

const app = express()
const server = http.createServer(app)

const io = new socketIO.Server(server)

io.on("connection", socket => {
    socket.on("USER_JOINT", (roomId: string) => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit("USER_JOINT", socket.id)
    })

    socket.on("MOVE_MOUSE", ({roomId, mousePos}) => {
        socket.broadcast.to(roomId).emit("MOVE_MOUSE", {
            socketId: socket.id,
            mousePos
        })
    })

    socket.on("SEND_CONTENT", (content: string) => {
        socket.broadcast.emit("SEND_CONTENT", content)
    })
})

server.listen(PORT, () => console.log(`Server started on port ${PORT}`))