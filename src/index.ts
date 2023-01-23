import express from "express"
import socketIO from "socket.io"
import http from "http"


const PORT = 5000

const app = express()
const server = http.createServer(app)

const io = new socketIO.Server(server)


interface RoomsType {
    [roomId: string]: {
        contentHistory: string[],
        users: {
            [socketId: string]: {
                cursorPos: [number, number]
            }
        }
    }
}

const rooms: RoomsType = {}

io.sockets.on("connection", socket => {
    socket.on("USER_JOINT", (roomId: string) => {
        socket.join(roomId)

        if (!rooms[roomId]) {
            rooms[roomId] = {
                contentHistory: [],
                users: {
                    [socket.id]: {
                        cursorPos: [0, 0]
                    }
                }
            }
        } else {
            rooms[roomId].users[socket.id] = {
                cursorPos: [0, 0]
            }
            io.to(socket.id).emit("UPDATE_CANVAS_CONTENT", {
                contentHistory: rooms[roomId].contentHistory,
                content: rooms[roomId].contentHistory[rooms[roomId].contentHistory.length - 1]
            })
            io.to(roomId).emit("USER_JOINT", rooms[roomId].users)
        }
    })

    socket.on("MOVE_CURSOR", ({roomId, cursorPos}) => {
        if (rooms[roomId]) {
            if (rooms[roomId].users[socket.id]) {
                rooms[roomId].users[socket.id].cursorPos = cursorPos
                socket.broadcast.to(roomId).emit("MOVE_CURSOR", rooms[roomId].users)
            }
        }
    })

    socket.on("UPDATE_CANVAS_CONTENT", ({roomId, content, contentHistory}) => {
        rooms[roomId].contentHistory = contentHistory
        socket.broadcast.to(roomId).emit("UPDATE_CANVAS_CONTENT", {content, contentHistory})
    })
    
    socket.on("CLEAR_CANVAS", ({roomId}) => {
        rooms[roomId].contentHistory = []
        socket.broadcast.to(roomId).emit("CLEAR_CANVAS")
    })

    socket.on("disconnect", () => {
        Object.entries(rooms).forEach(([roomId, roomData]) => {
            if (roomData.users[socket.id]) {
                delete roomData.users[socket.id]
            }

            io.to(roomId).emit("USER_LEFT", roomData.users)
        })
    })
})

server.listen(PORT, () => console.log(`Server started on port ${PORT}`))