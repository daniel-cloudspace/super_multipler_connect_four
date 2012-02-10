var express = require('express')
  , socketio = require('socket.io')
  , eyes = require('eyes')
  , _ = require('underscore')
  , keys = require('./public/lib/keys.js')
  , redis = require('redis')
  , client = redis.createClient()


var app = express.createServer(express.logger(), express.bodyParser())
app.use(app.router)
app.use(express.static(__dirname + '/public'))
app.listen(8000)
var io = socketio.listen(app)

var users = {};

function create_user() {
  return { 
    column_center: 5,
    color: 'blue'
  }
}




io.sockets.on('connection', function(socket) {
  users[socket.id] = create_user()
  var me = users[socket.id]

  socket.emit('init_data', { 
      my_id: socket.id,
      user: me
  })

  function add_to_column(column_id, color, callback) {
    get_column(column_id, function(column) {
      column.push(me.color)
      client.set(column_id, JSON.stringify(column), function(err, resp) {
        console.log("updated column ", column_id, " to ", column)
        callback(column_id, column)
      })
    })
  }

  function get_column(column_id, callback) {
    if (typeof column_id == "undefined") {
      console.log("get_column(undefined, ...)"); return
    }
    client.get(column_id, function(err, resp) {
      console.log("column_id: ", column_id, ", err: ", err, ", resp: ", resp)
      var column = JSON.parse(resp)
      callback(column ? column : [])
    })
  }

  function get_columns(column_ids, callback) {
    client.mget(column_ids, function(err, resp) {
      for (var columns={}, i=0; i < resp.length; i++) {
        var column = JSON.parse(resp[i])
        columns[column_ids[i]] = column ? column : []
      }
      callback(columns)
    })
  }

  function notify_players(column_id, column_data) {
    socket.emit('column_change', {
      column_id: column_id,
      column_data: column_data
    })
  }

  function wins_vertically(columns) {
    for (var i in columns) 
      if (check_vertical_for_connect_four(columns[i])) 
        return true 
    return false
  }
  function check_vertical_for_connect_four(c) {
    for (var i=3; i<8; i++) 
      if (c[i-3] == c[i-2] && c[i-2]==c[i-1] && c[i-1] == c[i]) 
        return true 
    return false
  }
  function wins_horizontally(columns) {
    var horizs = {} // rotate the matrix and test it for verticals again
    for (var i in columns) {
      horizs[i] = []
      for (var j=0; j<8; j++) 
         horizs[i].push(columns[j][i]) 
    }
    for (var i in horizs) 
      if (check_vertircal_for_connect_for(columns[i])) 
        return true 
    return false
  }


  // when a client chooses a column to drop their piece into
  socket.on('choose_column', function(column_id) {
    add_to_column(column_id, me.color, notify_players)
    // check if a connect-four
    var column_ids = [ column_id-3, column_id-2, column_id-1, column_id, column_id+1, column_id+2, column_id+3 ]
    get_columns(column_ids, function(columns) {
        
    })
      
  })

  socket.on('get_column', function(column_id) {
    console.log('get_column action: ', column_id)
    get_column(column_id, function(column) {
      socket.emit('get_column', column)
    })
  })

  socket.on('get_columns', function(column_ids) {
    get_columns(column_ids, function(columns) {
      socket.emit('get_columns', columns)
    })
  })

  socket.on('disconnect', function(){
    delete users[socket.id] // remove the user from the list
  })
})














/**
 * Game Loop
 *
 * The game simulation is run on each client as well as on the server. The 
 * server holds the master game loop, and updates the clients semi-frequently. 
 * The client and server should share this code. The client should include 
 * drawing functions. 
 */
setInterval(function() {
  /**
   * Move elements based on keystrokes
   */
  _.each(users, function(user) {
    
  })

  /**
   * Animation
   */

}, 50)