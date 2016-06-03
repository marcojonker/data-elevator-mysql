/**
 * MysqlLevelController
 * Store and retrieve current level from mysql
**/

'use strict'

var util = require('util');
var async = require('async');
var Errors = require('data-elevator/lib/errors/elevator-errors');
var BaseLevelController = require('data-elevator/lib/level-controllers/base-level-controller.js');

/**
 * Constructor
 * @param config
 */
var MysqlLevelController = function(config) {
    this.database = null;
    
    MysqlLevelController.super_.apply(this, arguments);
};

util.inherits(MysqlLevelController, BaseLevelController);

/**
 * Save level
 * @param level
 * @param callback(error)
 */
MysqlLevelController.prototype.saveCurrentLevel = function(level, callback) {
    return callback(null);
};

/**
 * Retrieve the current level
 * @param callback(error, level)
 */
MysqlLevelController.prototype.retrieveCurrentLevel = function(callback) {
    return callback(null);
};

module.exports = MysqlLevelController;