const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const autobahn = require('autobahn');
const config = require('./config');

const mysqlConn = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS
});

const mysqlEvents = new MySQLEvents(mysqlConn,{
  startAtEnd:true,
  excludeSchemas:{
    mysql:true
  }
});

const wampConn = new autobahn.Connection({
  url:process.env.WAMPURL,
  realm:process.env.WAMPREALM
});

mysqlEvents.addTrigger({
  name:'FILE_TRIGGER',
  expression:`${process.env.DBDB}.${process.env.DBTABLE}`,
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
  console.log(query);
  if(successCodes.includes(responseCode)){
    config.EXTENSIONS.forEach((e)=>{
      //can't break out of a foreach. different loop would be better.
      if(query.endsWith(e)){
        if(wampConn.isOpen){
          wampConn.session.publish(process.env.WAMPEVENTNAME,[newRow]);
          console.log(newRow);
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
