const util = require('util');
const mysql = require('mysql2');
const pool = mysql.createPool({
  connectionLimit: 10,
	host     : 'localhost',
  user     : 'root',   
  password : '',  
  database : 'nusatech'  
});

//connection : S#g=qGHo7i<t5
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
  }

  if (connection) connection.release();

  return;
});

pool.query = util.promisify(pool.query);

const executeQuery = (query, arraParms) => {
  return new Promise((resolve, reject) => {
    try {
      pool.query(query, arraParms, (err, data) => {
        if (err) {
          console.log("error in executing the query");
          reject(err);
        }
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
};

 module.exports = { executeQuery };
