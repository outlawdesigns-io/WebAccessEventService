import mysql from 'mysql2';
import ZongJi from '@vlasky/zongji';
import autobahn from 'autobahn';
import config from './config.js';

const BINLOG_EVENTS = {
  INSERT:'WriteRows',
  UPDATE:'UpdateRows',
  DELETE:'DeleteRows'
};

const successCodes = [200,202,206,304];

const wampConn = new autobahn.Connection({
  url:process.env.WAMPURL,
  realm:process.env.WAMPREALM
});

const mysqlConn = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS
});

const zongji = new ZongJi(mysqlConn);

const zongOptions = {
    startAtEnd: true,
    excludeSchema: {
        mysql: true
    },
    includeEvents: ['tablemap', 'writerows'],
    includeSchema:{
      [process.env.DBDB]:true
    }
};

const triggers = [
  {
    expression:`${process.env.DBDB}.requests`,
    event:BINLOG_EVENTS.INSERT,
    handler: event => _mysqlEventHandler(event, wampConn)
  }
];

zongji.on('binlog', event => {
  const table = event.tableMap[event.tableId];
  if(!table){
    return;
  }
  const expression = `${table.parentSchema}.${table.tableName}`;
  const eventType = event.getTypeName();
  triggers.filter(trigger => trigger.expression === expression && trigger.event === eventType).forEach(trigger => trigger.handler(event));
});

function _mysqlEventHandler(event, wampConn){
  let newRow = event.rows[0];
  let responseCode = newRow.responseCode;
  let query = newRow.query;
  //console.log(query);
  if(successCodes.includes(responseCode)){
    for(let extension of config.EXTENSIONS){
      if(query.endsWith(extension)){
        if(wampConn.isOpen){
          wampConn.session.publish(process.env.WAMPEVENTNAME,[newRow]);
          console.log(newRow);
          console.log('Event published!');
        }else{
          console.error('WAMP connection is not open')
        }
        break;
      }
    }
  }
}

wampConn.onopen = async (session)=>{
  console.log('Connected to WAMP router...');
  zongji.start(zongOptions);
  console.log('Monitoring DB...');
}
wampConn.open();
