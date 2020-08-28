var mysql = require("mysql")

var mysql_pool = mysql.createPool({
  connectionLimit: 100,
  host: "localhost",
  user: "elements",
  password: "sdfiasukas4d65a4sd64a6s4d64a6sda4sd6a45s6d4a6s546d9FG496SDF4G64SFDG78ADFGADJFKSADHFJLSADFVA",
  database: "elements"
})

function GetConnection (toDo) {
  mysql_pool.getConnection(function (err, connection) {
    if (err) {
      console.log(" Error getting mysql_pool connection: " + err)
      throw err
    }
    toDo(connection)
    connection.release()
  })
}
function escape (value) {
  return mysql.escape(value)
}
module.exports = {
  GetConnection,
  escape
}
