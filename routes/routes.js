// Define the different REST service routes in this file.
var json2csv = require('json2csv');
var csvFields = ['calldate', 'clid', 'src',
              'dst', 'dcontext', 'channel',
              'dstchannel', 'lastapp', 'lastdata',
              'duration', 'billsec', 'disposition',
              'amaflags', 'accountcode', 'userfield',
              'uniqueid', 'linkedid', 'sequence',
              'peeraccount'];
var appRouter = function(app,connection) {

    // This is just for testing to make sure the server is accessible
    // GET request; e.g. http://localhost:8086/
    app.get('/', function(req, res) {
        return res.status(200).send({'message': 'Welcome to the CDR report portal.'});
    });

    // GETALLCDRRECS - Returns all records in the table
    //GET request; e.g. http://localhost:8086/getallcdrrecs
    app.get('/getallcdrrecs', function(req, res) {
        console.log("CALL: /getallcdrrecs");
	var query = 'SELECT * FROM bit_cdr ORDER BY calldate';
        if(req.query.start && req.query.end){
            query = 'SELECT * FROM bit_cdr WHERE (calldate BETWEEN ' + connection.escape(req.query.start) + ' AND ' + connection.escape(req.query.end) + ')';           
        }
	console.log("Query: " + query);        
        // Query for all records sorted by the id
        connection.query(query, function(err, rows, fields) {
            if (err) {
                console.log("ERROR: "+err);
                return res.status(500).send({'message': 'MySQL error'});
            }
            else if (rows.length >= 0) {            	
		    //success           
		console.log("Results returned");     
                if(req.query.format == 'csv'){
                    JSON.stringify(rows);
                    var csv = json2csv({data: rows, fields: csvFields});
                    res.setHeader('Content-disposition', 'attachment; filename=cdr.csv');
                    res.set('Content-Type', 'text/csv');
                    res.status(200).send(csv);
                }else{
                    res.status(200).send({'message': 'Success', 'data':rows});
                }
            }
            else if (rows.length === 0) {
                return res.status(200).send({'message': 'No cdr records', 'data':rows});
            }
        });
    });

    // CDRFILTER - Returns all records within the specified time period
    //GET request; e.g. http://localhost:8086/cdrfilter/?start=2016-08-17 12:21:31&end=2016-08-17 17:00:00
    app.get('/cdrfilter', function(req, res) {

        if (!req.query.start || !req.query.end) {
            return res.status(400).send({'message': 'Missing required start or end time(s)'});
        }
        else {
            // Note, use connection.escape to avoid SQL injection attacks
            var sql = 'SELECT * FROM bit_cdr WHERE (calldate BETWEEN ' + connection.escape(req.query.start) + ' AND ' + connection.escape(req.query.end) + ')';
            connection.query(sql, function(err, rows, fields)  {

                // Working uglier alternative
                // connection.query('SELECT * FROM cdr_log WHERE (calldate BETWEEN "' + req.query.start + '" AND "' + req.query.end + '")', function(err, rows, fields)  {

                if (err) {
                    console.log(err);
                    return res.status(500).send({'message': 'MySQL error'});
                }
                else if (rows.length >= 1) {
                    //success
                    // json = JSON.stringify(rows);
                    res.status(200).send({'message': 'Success', 'data':rows});
                }
                else if (rows.length === 0) {
                    return res.status(404).send({'message': 'CDR records not found'});
                }
                else {
                    return res.status(501).send({'message': 'Unknown error'});
                }
            });
        }
    });
};

module.exports = appRouter;
