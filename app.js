// This is the main JS for the USERVER RESTFul server
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var clear = require('clear');
var fs = require('fs');
var nconf = require('nconf');
var cfile = null;
var listenPort = 0;
var dbHost = 'localhost';
var dbUser = 'user';
var dbPassword = 'password';
var dbName = 'cdr';
var dbPort = '3306';

// Read this config file from the local directory
cfile = 'config.json';

// Verify that the config.json file is properly formatted
var fs = require('fs');
var ex;
try {
    var content = fs.readFileSync(cfile, 'utf8');
    var myjson = JSON.parse(content);
    console.log("Valid JSON config file");
}catch(ex){
    console.log("Error in " + cfile);
    console.log('Exiting...');
    console.log(ex);
    process.exit(1);
}

// Read the params from the config file
nconf.file({ file: cfile});
listenPort = parseInt(nconf.get('http:port'));
dbHost = nconf.get('mysql:dbhost');
dbUser = nconf.get('mysql:dbuser');
dbPassword = nconf.get('mysql:dbpassword');
dbName = nconf.get('mysql:dbname');
dbPort = parseInt(nconf.get('mysql:dbport'));

clear(); // clear console

// Create MySQL connection and connect to the database
var connection = mysql.createConnection({
  host     : dbHost,
  user     : dbUser,
  password : dbPassword,
  database : dbName,
  port     : dbPort
});

connection.connect();

// Start the server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var routes = require('./routes/routes.js')(app,connection);
var server = app.listen(listenPort, function () {
  console.log('CDR listening on port=%s ...   (Ctrl+C to Quit)', server.address().port);
});

// Handle Ctrl-C (graceful shutdown)
process.on('SIGINT', function() {
  console.log('Exiting...');
  connection.end();
  process.exit(0);
});
