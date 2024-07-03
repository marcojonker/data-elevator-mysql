/**
 * MysqlLevelController
 * Store and retrieve current level from mysql
**/
const async = require('async');
const mysql2 = require('mysql2');
const Errors = require('data-elevator/lib/errors/elevator-errors');
const BaseLevelController = require('data-elevator/lib/level-controllers/base-level-controller');
const Level = require('data-elevator/lib/level-controllers/level');

/**
 * Constructor
 * @param config
 */
class MysqlLevelController extends BaseLevelController {

  constructor(config) {
    super(config)
    this.database = null;

    if (!config.levelControllerConfig.connectionOptions || typeof config.levelControllerConfig.connectionOptions !== 'object') {
      throw Errors.invalidConfig('Mysql connection options missing in configuration file');
    }

    if (!config.levelControllerConfig.tableName || typeof config.levelControllerConfig.tableName !== 'string' && config.levelControllerConfig.tableName.length === 0) {
      throw Errors.invalidConfig('Mysql tableName missing in configuration file');
    }
  }

  /**
     * Get connection
     * @param callback(error, connection)
     */
  getConnection(callback) {
    const connection = mysql2.createConnection(this.config.levelControllerConfig.connectionOptions);
    const tableName = this.config.levelControllerConfig.tableName;

    connection.connect((error) => {
      if (error) {
        return callback(Errors.generalError('Mysql connection error', error));
      } else {
        //Create table if it is not available
        const query = "CREATE TABLE IF NOT EXISTS " + tableName + " (" +
                    "identifier integer, " +
                    "timestamp bigint);";
        connection.query(query, (error) => {
          if (error) {
            connection.end();
            return callback(Errors.generalError("Mysql failed to create table '" + tableName + "'", error));
          } else {
            return callback(error, connection);
          }
        });
      }
    });
  }

  /**
     * Save level
     * @param level
     * @param callback(error)
     */
  saveCurrentLevel(level, callback) {
    const tableName = this.config.levelControllerConfig.tableName;

    async.waterfall([
      //Get database connection
      (callback) => {
        this.getConnection((error, connection) => {
          return callback(error, connection);
        });
      },
      //Check if there are already migrations
      (connection, callback) => {
        const query = "SELECT count(*) AS rowcount FROM " + tableName;
        connection.query(query, (error, rows, fields) => {
          if (error) {
            connection.end();
            return callback(Errors.generalError("Mysql failed to query table '" + tableName + "'", error));
          } else {
            return callback(null, connection, (parseInt(rows[0].rowcount) !== 0));
          }
        });
      },
      //Insert or update current migration
      (connection, rowsFound, callback) => {
        let query = null;

        if (rowsFound === false) {
          query = "INSERT INTO " + tableName + "(identifier, timestamp) VALUES (" + level.identifier + ", " + level.timestamp + ")";
        } else {
          query = "UPDATE " + tableName + " SET identifier=" + level.identifier + ", timestamp=" + level.timestamp;
        }

        connection.query(query, (error, rows, fields) => {
          connection.end();

          if (error) {
            return callback(Errors.generalError("Mysql failed to update table '" + tableName + "'", error));
          } else {
            return callback(null);
          }
        });
      }],
    (error) => {
      return callback(error);
    }
    );
  }

  /**
     * Retrieve the current level
     * @param callback(error, level)
     */
  retrieveCurrentLevel(callback) {
    const tableName = this.config.levelControllerConfig.tableName;

    async.waterfall([
      //Get mysql connection
      (callback) => {
        this.getConnection((error, connection) => {
          return callback(error, connection);
        });
      },
      //Retrieve level
      (connection, callback) => {
        const query = "SELECT * FROM " + tableName + " LIMIT 1";
        connection.query(query, (error, rows, fields) => {
          connection.end();

          if (error) {
            return callback(Errors.generalError("Mysql failed to query table '" + tableName + "'", error));
          } else {
            let level = null;

            if (rows.length > 0) {
              level = new Level();
              level.identifier = rows[0].identifier;
              level.timestamp = rows[0].timestamp;
            }
            return callback(null, level);
          }
        });
      }], callback);
  }
}

module.exports = MysqlLevelController;