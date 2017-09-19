// This is the main JS for the ACR-CDR RESTFul server
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var clear = require('clear');
var fs = require('fs');
var nconf = require('nconf');
var log4js = require('log4js');
var https = require('https');
var cfile = null;

// Initialize log4js
log4js.loadAppender('file');
var logname = 'acr-cdr';
log4js.configure({
	appenders: [
		{
			type				: 'dateFile',
			filename			: 'logs/' + logname + '.log',
			alwaysIncludePattern: false,
			maxLogSize			: 20480,
			backups				: 10
		}
	]
});

var logger = log4js.getLogger(logname);

// Read this config file from the local directory
cfile = 'config.json';



// Verify that the config.json file is properly formatted
var fs = require('fs');
var ex;
try {
	var content = fs.readFileSync(cfile, 'utf8');
	var myjson = JSON.parse(content);
	console.log("Valid JSON config file");
} catch (ex) {
	console.log("Error in " + cfile);
	console.log('Exiting...');
	console.log(ex);
	process.exit(1);
}



// Read the params from the config file
nconf.file({file: cfile});

//the presence of the clearText field in config.json means that the file is in clear text
//remove the field if the file is encoded
var clearText = false;
if (typeof(nconf.get('clearText')) !== "undefined") {
    console.log('clearText field is in config.json. assuming file is in clear text');
    clearText = true;
}

// Set log4js level from the config file
logger.setLevel(decodeBase64(nconf.get('debuglevel')));
logger.trace('TRACE messages enabled.');
logger.debug('DEBUG messages enabled.');
logger.info('INFO messages enabled.');
logger.warn('WARN messages enabled.');
logger.error('ERROR messages enabled.');
logger.fatal('FATAL messages enabled.');
logger.info('Using config file: ' + cfile);


var listenPort	= parseInt(decodeBase64(nconf.get('https:port')));
var dbHost		= decodeBase64(nconf.get('mysql:dbhost'));
var dbUser		= decodeBase64(nconf.get('mysql:dbuser'));
var dbPassword	= decodeBase64(nconf.get('mysql:dbpassword'));
var dbName		= decodeBase64(nconf.get('mysql:dbname'));
var dbPort		= parseInt(decodeBase64(nconf.get('mysql:dbport')));
var cdrTable	= decodeBase64(nconf.get('mysql:cdrtable'));

clear(); // clear console

// Create MySQL connection and connect to the database
var connection = mysql.createConnection({
	host	: dbHost,
	user	: dbUser,
	password: dbPassword,
	database: dbName,
	port	: dbPort
});

connection.connect();

// Keeps connection from Inactivity Timeout
setInterval(function () {
        connection.ping();
}, 60000);

var credentials = {
	key		: fs.readFileSync(decodeBase64(nconf.get('https:private_key'))),
	cert	: fs.readFileSync(decodeBase64(nconf.get('https:certificate')))
};

// Start the server
app.use(express.static(__dirname + '/apidoc'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var routes = require('./routes/routes.js')(app, connection, logger, cdrTable);
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(parseInt(decodeBase64(nconf.get('https:port'))));
console.log('CDR listening on port=%s ...   (Ctrl+C to Quit)', parseInt(decodeBase64(nconf.get('https:port'))));



// Handle Ctrl-C (graceful shutdown)
process.on('SIGINT', function () {
	console.log('Exiting...');
	connection.end();
	process.exit(0);
});

/**
 * Function to decode the Base64 configuration file parameters.
 * @param {type} encodedString Base64 encoded string.
 * @returns {unresolved} Decoded readable string.
 */
function decodeBase64(encodedString) {
    var decodedString = null;
    if (clearText) {
        decodedString = encodedString;
    } else {
        decodedString = new Buffer(encodedString, 'base64');
    }
    return (decodedString.toString());
}
