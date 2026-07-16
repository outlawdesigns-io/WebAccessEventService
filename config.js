process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DBHOST = process.env.DBHOST || 'localhost';
process.env.DBUSER = process.env.DBUSER || 'root';
process.env.DBPASS = process.env.DBPASS || '';
process.env.DBDB = process.env.DBDB || 'web_access';
process.env.DBTABLE = process.env.DBTABLE || 'requests';
process.env.WAMPURL = process.env.WAMPURL || 'ws://localhost:8080';
process.env.WAMPREALM = process.env.WAMPREALM || 'realm1';
process.env.WAMPEVENTNAME = process.env.WAMPEVENTNAME || 'io.outlawdesigns.webaccess.fileDownloaded';
process.env.EXTENSIONS = process.env.EXTENSIONS.split(",") || ['.mp4',
  '.avi',
  '.mkv',
  '.mp3',
  '.cbz',
  '.cbr',
  '.pdf',
  '.chm',
  '.txt',
  '.epub',
  '.log'
];
