// This is the main JS for the USERVER RESTFul server
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var clear = require('clear');
var cors = require('cors');
// process arguments - user supplied port number?
var PORT;
var myArgs = process.argv.slice(2);
if (myArgs.length >= 1) {
  PORT = myArgs[0];
}
PORT = PORT || 8086;

clear(); // clear console

// Create MySQL connection and connect to it
var connection = mysql.createConnection({
  host     : 'insert mysql server hostname',
  user     : 'insert mysql username',
  password : 'insert mysql password',
  database : 'insert database name'
});
connection.connect();

// Start the server
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var routes = require('./routes/routes.js')(app,connection);
var server = app.listen(PORT, function () {
  console.log('CDR listening on port=%s ...   (Ctrl+C to Quit)', server.address().port);
});

// Handle Ctrl-C (graceful shutdown)
process.on('SIGINT', function() {
  console.log('Exiting...');
  connection.end();
  process.exit(0);
});
