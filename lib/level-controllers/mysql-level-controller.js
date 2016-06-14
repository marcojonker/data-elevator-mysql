/**
 * MysqlLevelController
 * Store and retrieve current level from mysql
**/

'use strict'

var util = require('util');
var async = require('async');
var mysql = require('mysql');
var Errors = require('data-elevator/lib/errors/elevator-errors');
var BaseLevelController = require('data-elevator/lib/level-controllers/base-level-controller');
var Level = require('data-elevator/lib/level-controllers/level');

/**
 * Constructor
 * @param config
 */
var MysqlLevelController = function(config) {
    this.database = null;
    
    MysqlLevelController.super_.apply(this, arguments);
    
    if(!config.levelControllerConfig.connectionOptions || typeof config.levelControllerConfig.connectionOptions !== 'object') {
        throw Errors.invalidConfig('Mysql connection options missing in configuration file');
    }
    
     if(!config.levelControllerConfig.tableName || typeof config.levelControllerConfig.tableName !== 'string' && config.levelControllerConfig.tableName.length === 0) {
        throw Errors.invalidConfig('Mysql tableName missing in configuration file');
    }
   
};

util.inherits(MysqlLevelController, BaseLevelController);

/**
 * Get connection
 * @param callback(error, connection)
 */
MysqlLevelController.prototype.getConnection = function(callback) {
    var connection = mysql.createConnection(this.config.levelControllerConfig.connectionOptions);
    var tableName = this.config.levelControllerConfig.tableName;

    connection.connect(function(error) {
        if (error) {
            return callback(Errors.generalError('Mysql connection error', error)); 
        } else {
           //Create table if it is not available
           var query = "CREATE TABLE IF NOT EXISTS " + tableName  + " (" + 
                            "identifier integer, " + 
                            "timestamp bigint);";
           connection.query(query, function(error) {
                if(error) {
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
MysqlLevelController.prototype.saveCurrentLevel = function(level, callback) {
    var self = this;
    var tableName = this.config.levelControllerConfig.tableName;
  
    async.waterfall([
        //Get database connection
        function(callback) {
            self.getConnection(function(error, connection) {
                return callback(error, connection);
            });            
        }, 
        //Check if there are already migrations
        function(connection, callback) {
            var query = "SELECT count(*) AS rowcount FROM " + tableName;
            connection.query(query, function(error, rows, fields) {
                if(error) {
                    connection.end();
                    return callback(Errors.generalError("Mysql failed to query table '" + tableName + "'", error));
                } else {
                    return callback(null, connection, (parseInt(rows[0].rowcount) !== 0));
                }
            });
        },
        //Insert or update current migration
        function(connection, rowsFound, callback) {
            var query = null;

            if(rowsFound === false) {
                query = "INSERT INTO " + tableName + "(identifier, timestamp) VALUES (" + level.identifier + ", " + level.timestamp + ")";
            } else {
                query = "UPDATE " + tableName + " SET identifier=" + level.identifier +  ", timestamp=" + level.timestamp;
            }

            connection.query(query, function(error, rows, fields) {
                connection.end();
                
                if(error) {
                    return callback(Errors.generalError("Mysql failed to update table '" + tableName + "'", error));
                } else {
                    return callback(null);
                }
            });
        }], 
        function(error) {
            return callback(error);
        }
    );
};

/**
 * Retrieve the current level
 * @param callback(error, level)
 */
MysqlLevelController.prototype.retrieveCurrentLevel = function(callback) {
    var self = this;
    var tableName = this.config.levelControllerConfig.tableName;

    async.waterfall([
        //Get mysql connection
        function(callback) {
            self.getConnection(function(error, connection) {
                return callback(error, connection);
            });            
        }, 
        //Retrieve level
        function(connection, callback) {
            var query = "SELECT * FROM " + tableName + " LIMIT 1";
            connection.query(query, function(error, rows, fields) {
                connection.end();
    
                if(error) {
                    return callback(Errors.generalError("Mysql failed to query table '" + tableName + "'", error));
                } else {
                    var level = null;
                    
                    if(rows.length > 0) {
                        level = new Level();
                        level.identifier = rows[0].identifier;
                        level.timestamp = rows[0].timestamp;
                    } 
                    return callback(null, level);
                }
            });
        }], callback); 
};

module.exports = MysqlLevelController;