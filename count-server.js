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
var spheres = [];

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

    console.log((new Date()) + ' Connection accepted.');

    // send back count countTotal
    if (countTotal > 0) {
        connection.sendUTF(JSON.stringify( { type: 'count', data: countTotal} ));
    }

    if (spheres.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: spheres} ));
    }

    // user successfully answered riddle
    connection.on('message', function(input) {
        console.log(input)
         var obj = {
                'angleS' : Math.random()*Math.PI*2,
                'angleT' : Math.random()*Math.PI*2,
                'count': countTotal
            }

        if (Number.isInteger(parseInt(input.utf8Data))) { 
        	countTotal++;
            obj.drop = false;
            obj.score = input.utf8Data;
            spheres.push(obj);

            var json = JSON.stringify({ type:'newSphere', data: obj });
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            }

        } else { //incorrectly answered riddle 
            //countTotal++;
            obj.drop = false;
            //spheres.push(obj)

            var json = JSON.stringify({ type:'dropSphere', data: obj });
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            };

        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        // if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        // }
        console.log('connection closed')
    });

});