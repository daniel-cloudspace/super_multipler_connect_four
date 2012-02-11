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

var players = {};
var current_color = 'blue'

function create_player() {
  current_color = current_color == 'blue' ? 'red' : 'blue'
  return { 
    column_center: 5,
    color: current_color,
    points: 0
  }
}




io.sockets.on('connection', function(socket) {
  players[socket.id] = create_player()
  var me = players[socket.id]
  var my_id = socket.id

  socket.emit('init_data', { 
      my_id: socket.id,
      player: me,
      players: players
  })

  io.sockets.emit('add_player', { player_id: my_id, player_data: me })

  function add_to_column(column_id, color, callback) {
    get_column(column_id, function(column) {
      if (column.length == 8) return // keep column sizes at 8, for now

      column.push(me.color)
      client.set(column_id, JSON.stringify(column), function(err, resp) {
        console.log("updated column ", column_id, " to ", column)

        // check if a connect-four
        var column_ids = [ column_id-3, column_id-2, column_id-1, column_id, column_id+1, column_id+2, column_id+3 ]

        get_columns(column_ids, function(columns) {
          if (connect_four(columns)) { 
            console.log("CONNECT FOUR!!!")

            var points_lost = 0
            for (var i in columns) for (var j=0; j<columns[i].length; j++) if(columns[i][j] == me.color) points_lost++

            for (var i=0; i<column_ids.length; i++) {
              client.set(column_ids[i], "[]")
             
              io.sockets.emit('column_change', { 
                column_id: column_ids[i], 
                column_data: []
              })

              me.score -= points_lost
              io.sockets.emit('points_change', {
                player_id: my_id,
                points: me.points
              })
            }
          } else {
            me.score++
            callback(column_id, column)
          }
        })
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
    io.sockets.emit('column_change', {
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
    if (c.lengthi == 0) return false

    for (var i=3; ; i++) {
      if (c[i-3] == c[i-2] && c[i-2]==c[i-1] && c[i-1] == c[i]) {
        if (typeof c[i] == 'undefined') {
          return false
        } else {
          return true 
        }
      }
    }
  }
  function wins_horizontally(columns) {
    var ids = []
    for(var i in columns) { ids.push(i) }

    if (ids.length < 4) return false

    // for each row (increasing infinitely)
    for (var i=0; ; i++) {
      // for each column id
      for (var j=3; j<ids.length; j++) {
        // get a list of columns you want to check for
        var a = ids[j-3], b=ids[j-2], c=ids[j-1], d=ids[j]
        // check if those columns are the same
        if ( columns[a][i] == columns[b][i] && columns[b][i] == columns[c][i] && columns[c][i] == columns[d][i] ) {
          // if they are the the same AND undefined, then we have reached a level with no pieces and there has been no match
          if (typeof columns[a][i] == 'undefined') {
            return false
          // otherwise, we have a match and this was a win
          } else {
            return true
          }
        }
      }
    }
    return false
  }
  function connect_four(columns) {
    return wins_horizontally(columns) || wins_vertically(columns)
  }


  // when a client chooses a column to drop their piece into
  socket.on('choose_column', function(column_id) {
    add_to_column(column_id, me.color, notify_players)
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
    delete players[socket.id] // remove the player from the list
    io.sockets.emit('player_exit', socket.id)
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
  _.each(players, function(player) {
    
  })

  /**
   * Animation
   */

}, 50)
