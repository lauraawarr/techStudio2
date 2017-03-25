"use strict";

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/* 
GLOBAL VARIABLES
*/
var countTotal = 0;
var clients = [];
var colors = ["#FF3E96", "#BA55D3", "#AB82FF", "#4876FF", "#1E90FF", "#00BFFF", "#00E5EE", "#00C78C", "#00EE76", "#7CFC00", "#C0FF3E", "#FFD700", "#FFC125", "#FFA500", "#FF9912", "#FF7F00", "#FF6103", "#FF4500", "#FF6347", "#FF6A6A", "#FF0000"];

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for this
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});


// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    connection.index = index;

    var clientColor = colors[Math.floor(Math.random()*colors.length)];
    connection.sendUTF(JSON.stringify( { type: 'color', data: clientColor} ));

    console.log((new Date()) + ' Connection accepted.');

    // send back count countTotal
    if (countTotal > 0) {
        connection.sendUTF(JSON.stringify( { type: 'count', data: countTotal} ));
    }

    // user successfully answered riddle
    connection.on('message', function(input) {
         var obj = {
                'count': countTotal,
                'end': {x: 250 - Math.random()*500, y: Math.random()*500, z: 250 - Math.random()*500},
                'color': clientColor
            }

        if (Number.isInteger(parseInt(input.utf8Data))) { 
        	countTotal++;
            obj.drop = false;
            obj.score = input.utf8Data;

        } else { //incorrectly answered riddle 
            obj.drop = true;
        }

        var json = JSON.stringify({ type:'newSphere', data: obj });
        for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(json);
            console.log(clients[i].index, "connection: " + clients[i].connected); //for debugging
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer "
            + connection.remoteAddress + " disconnected.");
        // remove user from the list of connected clients
        // clients.splice(index, 1);
        for (var i=0; i < clients.length; i++) {
            if ( clients[i].connected == false ){
                clients.splice(i, 1);
                for (var j = i; j < clients.length; j++){
                    clients[j].index--;
                }
                return;
            }
        }
        console.log('connection closed')
    });

});