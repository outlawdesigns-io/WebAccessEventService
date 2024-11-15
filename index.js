const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const autobahn = require('autobahn');

global.config = require('./config');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const mysqlConn = mysql.createConnection({
  host: global.config[process.env.NODE_ENV].DBHOST,
  user: global.config[process.env.NODE_ENV].DBUSER,
  password: global.config[process.env.NODE_ENV].DBPASS
});

const mysqlEvents = new MySQLEvents(mysqlConn,{
  startAtEnd:true,
  excludeSchemas:{
    mysql:true
  }
});

const wampConn = new autobahn.Connection({
  url:global.config[process.env.NODE_ENV].WAMPURL,
  realm:global.config[process.env.NODE_ENV].WAMPREALM
});

mysqlEvents.addTrigger({
  name:'FILE_TRIGGER',
  expression:'web_access.requests',
  statement: MySQLEvents.STATEMENTS.INSERT,
  onEvent: (event) => _mysqlEventHandler(event,wampConn)
});
mysqlEvents.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
mysqlEvents.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);


const successCodes = [200,202,206,304];

function _mysqlEventHandler(event, wampConn){
  let newRow = event.affectedRows[0].after;
  let responseCode = newRow.responseCode;
  let query = newRow.query;
  if(successCodes.includes(responseCode)){
    global.config[process.env.NODE_ENV].EXTENSIONS.forEach((e)=>{
      //can't break out of a foreach. different loop would be better.
      if(query.endsWith(e)){
        if(wampConn.isOpen){
          wampConn.session.publish('io.outlawdesigns.webaccess.fileDownloaded',[newRow]);
          console.log('Event published!');
        }else{
          console.error('WAMP connection is not open')
        }
      }
    });
  }
}

wampConn.onopen = async (session)=>{
  console.log('Connected to WAMP router...');
  await mysqlEvents.start();
  console.log('Monitoring DB...');
}
wampConn.open();
