const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);
 
const chess = new Chess();
let players = {};
let currentplayer = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title : "Chess Game"});
})

io.on("connection",function(uniquesocket){
    console.log('connected');

    if(!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect",()=>{
        if(uniquesocket.id === players.white){
            delete players.white;
        }else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });   
//chess move
    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn() === "w" && uniquesocket.id !=players.white) return;
            if(chess.turn() === "b" && uniquesocket.id !=players.black) return;

            const result = chess.move(move);
            if(result){
                currentplayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }else{
                console.log("invalid move:",move);
                uniquesocket.emit("invalidMove",move);
            }
         }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid move:",move);
        }
    })

    //used for brodcasting
    // uniquesocket.on("ankan",()=>{
    //     io.emit("ankan samanta");
    // })
//used for disconnected.
        // uniquesocket.on("disconnect",()=>{
        // console.log("disconnected");
})

server.listen(3000,()=>{
    console.log("server is running on port 3000");
});