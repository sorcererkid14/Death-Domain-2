var socketio = require('socket.io');
var express = require('express');
var sql = require('sqlite3').verbose();

var exp = express();
exp.use(express.static('webroot'));
var webapp = exp.listen(process.env.PORT, function() {
  console.log('Running');
})

var io = socketio(webapp);

var db = new sql.Database('Highscores.db');

db.run("CREATE TABLE Scores (playerName char(30) DEFAULT NULL, score int(11) DEFAULT 0, dateachieved timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)", (err) => {
  if(err) {
    console.log("oops");
  }
})

io.on('connection', function(socket) {
  console.log('connected to ' + socket.id);

    socket.on('submitScore', function(data) {
    db.run('INSERT INTO Scores (playerName, score) VALUES (?, ?)', [data.playerName, Number(data.score)], function(err) {
      if(!err) {
        console.log(data.playerName + " Submitted " + data.score);
        io.emit('newScore', data);
      } else {
        console.log("Error adding " + data.score + " for " + data.playerName);
      }
    });
  })


  socket.on('getHighScores', function() {
    db.all('SELECT playerName, score FROM Scores ORDER BY score DESC LIMIT 10 ', [], (err, rows) => {
      if (err) {
        throw err;
      }
      var t = tabulate(rows, ['playerName', 'score'])

      socket.emit('highScores', t)
    })
  })

  
  socket.on('disconnect', function() {
    console.log(socket.id + " disconnected")
  })
})