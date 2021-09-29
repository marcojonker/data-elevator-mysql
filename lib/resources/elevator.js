/**
 * Elevator
 * Data elevator
**/
const ElevatorBase = require('data-elevator/lib/elevator-engine/elevator-base');
const ConsoleLogger = require('data-elevator/lib/logger/console-logger');
const MysqlLevelController = require('data-elevator-mysql/lib/level-controllers/mysql-level-controller');

/**
 * Constructor
 * @param logger
 * @param LevelController
 */
class Elevator extends ElevatorBase {
  constructor(logger, LevelController) {
    super(logger, LevelController)
  }
}


const elevator = new Elevator(new ConsoleLogger(false), MysqlLevelController);

//Run the elevator
elevator.run(function(error) { });