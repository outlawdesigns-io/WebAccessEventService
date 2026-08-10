import mysql from 'mysql2';
import ZongJi from '@vlasky/zongji';
import autobahn from 'autobahn';
import config from './config.js';

const mysqlConn = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS
});

const zongji = new ZongJi(mysqlConn);

const wampConn = new autobahn.Connection({
  url:process.env.WAMPURL,
  realm:process.env.WAMPREALM
});

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

zongji.on('binlog', event => {
  const eType = event.getTypeName();
  if(eType === 'WriteRows'){
    _mysqlEventHandler(event,wampConn);
  }
});

const successCodes = [200,202,206,304];

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
