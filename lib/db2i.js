// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2i
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

/*!
 * DB2 connector for LoopBack
 */
var IBMDB = require('loopback-ibmdb').IBMDB;
var util = require('util');
var debug = require('debug')('loopback:connector:db2i');

var Transaction = IBMDB.Transaction;
var ParameterizedSQL = IBMDB.ParameterizedSQL;

/**
 * Initialize the IBMDB connector for the given data source
 *
 * @param {DataSource} ds The data source instance
 * @param {Function} [cb] The cb function
 */
exports.initialize = function(ds, cb) {
  ds.connector = new DB2(ds.settings);
  ds.connector.dataSource = ds;
  if (cb) {
    if (ds.settings.lazyConnect) {
      process.nextTick(function() {
        cb();
      });
    } else {
      ds.connector.connect(cb);
    }
  }
};

function DB2(settings) {
  debug('DB2 constructor settings: %j', settings);
  IBMDB.call(this, 'db2i', settings);

  // This is less than ideal, better idea would be
  // to extend the propagation of the filter object
  // to executeSQL or pass the options obj around
  this.limitRE = /LIMIT (\d+)/;
  this.offsetRE = /OFFSET (\d+)/;
}

util.inherits(DB2, IBMDB);

DB2.prototype.ping = function(cb) {
  var self = this;
  var sql = 'SELECT COUNT(*) AS COUNT FROM QIWS.QCUSTCDT';

  if (self.dataSource.connection) {
    if (!self.testConnection(self.dataSource.connection, sql)) {
      return cb && cb(Error('Failed to use connection'));
    }
    cb && cb();
  } else {
    self.connect(function(err, conn) {
      if (err) {
        cb && cb(Error(err));
      } else if (!self.testConnection(conn, sql)) {
        cb && cb(Error('Failed to use connection'));
      } else {
        cb && cb();
      }
    });
  }

  return;
};

/**
 * Create the data model in DB2
 *
 * @param {string} model The model name
 * @param {Object} data The model instance data
 * @param {Object} options Options object
 * @param {Function} [callback] The callback function
 */
DB2.prototype.create = function(model, data, options, callback) {
  var self = this;
  var stmt = self.buildInsert(model, data, options);
  var id = self.idName(model);
  var sql = 'SELECT \"' + id + '\" FROM FINAL TABLE (' + stmt.sql + ') WITH NC';

  self.execute(sql, stmt.params, options, function(err, info) {
    if (err) {
      callback(err);
    } else {
      callback(err, info[0][id]);
    }
  });
};

/**
 * Update all instances that match the where clause with the given data
 *
 * @param {string} model The model name
 * @param {Object} where The where object
 * @param {Object} data The property/value object representing changes
 * to be made
 * @param {Object} options The options object
 * @param {Function} cb The callback function
 */
// DB2.prototype.update = function(model, where, data, options, cb) {
//   var self = this;
//   var stmt = self.buildUpdate(model, where, data, options);
//   var id = self.idName(model);
//   var sql = 'SELECT \"' + id + '\" FROM FINAL TABLE (' + stmt.sql + ')';
//   self.execute(sql, stmt.params, options, function(err, info) {
//     if (cb) {
//       cb(err, {count: info.length});
//     }
//   });
// };

/**
 * Delete all matching model instances
 *
 * @param {string} model The model name
 * @param {Object} where The where object
 * @param {Object} options The options object
 * @param {Function} cb The callback function
 */
// DB2.prototype.destroyAll = function(model, where, options, cb) {
//   var self = this;
//   var stmt = self.buildDelete(model, where, options);
//   var id = self.idName(model);
//   var sql = 'SELECT \"' + id + '\" FROM OLD TABLE (' + stmt.sql + ')';
//   self.execute(sql, stmt.params, options, function(err, info) {
//     if (cb) {
//       cb(err, {count: info.length});
//     }
//   });
// };

DB2.prototype.executeSQL = function(sql, params, options, callback) {
  debug('DB2.prototype.executeSQL (enter)',
        sql, params, options);
  var self = this;
  var conn = self.connection;

  if (options.transaction) {
    conn = options.transaction.connection;
  }

  var limit = 0;
  var offset = 0;
  // This is standard DB2 syntax. LIMIT and OFFSET
  // are configured off by default. Enable these to
  // leverage LIMIT and OFFSET.
  if (!this.useLimitOffset) {
    var res = sql.match(self.limitRE);
    if (res) {
      limit = Number(res[1]);
      sql = sql.replace(self.limitRE, '');
    }
    res = sql.match(this.offsetRE);
    if (res) {
      offset = Number(res[1]);
      sql = sql.replace(self.offsetRE, '');
    }
  }

  sql.concat(' WITH NC');

  conn.query(sql, params, function(err, data, more) {
    debug('DB2i.prototype.executeSQL (exit)' +
          ' sql=%j params=%j err=%j data=%j more=%j',
          sql, params, err, data, more);
    // schedule callback as there is more code to
    // execute in the db2 driver to cleanup the current query
    if (offset || limit) {
      data = data.slice(offset, offset + limit);
    }

    if (!err) {
      if (more) {
        process.nextTick(function() {
          return callback(err, data);
        });
      }
    }

    callback && callback(err, data);
  });
};

/**
 * Update if the model instance exists with the same id or create a new instance
 *
 * @param {string} model The model name
 * @param {Object} where The where clause contents
 * @param {Object} data The model instance data
 * @param {Object} options to be used to check if a transaction is needed.
 * @param {Function} [callback] The callback function
 */
DB2.prototype.update = function(model, where, data, options, callback) {
  var self = this;
  var id = self.idName(model);
  var stmt;
  var tableName = self.tableEscaped(model);
  var meta = {};

  function executeWithConnection(connection, cb) {
    // Execution for update requires running two
    // separate SQL statements.  The second depends on the
    // result of the first.
    var countStmt = new ParameterizedSQL('SELECT COUNT(*) AS CNT FROM ');
    countStmt.merge(tableName);
    countStmt.merge(self.buildWhere(where));

    connection.query(countStmt.sql, countStmt.params,
      function(err, countData) {
        if (err) {
          return cb(err);
        }

        if (countData[0]['CNT'] > 0) {
          var where = {};
          where[id] = data[id];
          stmt = self.buildUpdate(model, where, data, options);
        } else {
          return cb(Error('Row does not exist'));
          //stmt = self.buildInsert(model, data);
        }

        connection.query(stmt.sql, stmt.params, function(err, sData) {
          if (err) {
            return cb(err);
          }
          meta.isNewInstance = countData[0]['CNT'] === 0;
          cb(null, data, meta);
        });
      });
  };

  if (options.transaction) {
    executeWithConnection(options.transaction.connection,
      function(err, data, meta) {
        if (err) {
          return callback && callback(err);
        } else {
          return callback && callback(null, data, meta);
        }
      });
  } else {
    self.beginTransaction(Transaction.READ_COMMITTED, function(err, conn) {
      if (err) {
        return callback && callback(err);
      }
      executeWithConnection(conn, function(err, data, meta) {
        if (err) {
          conn.rollbackTransaction(function(err) {
            conn.close(function() {});
            return callback && callback(err);
          });
        } else {
          options.transaction = undefined;
          conn.commitTransaction(function(err) {
            if (err) {
              return callback && callback(err);
            }

            conn.close(function() {});
            return callback && callback(null, data, meta);
          });
        }
      });
    });
  }
};

/**
 * Delete if the model instance exists with the same id or create a new instance
 *
 * @param {string} model The model name
 * @param {Object} where The where clause contents
 * @param {Object} options to be used to check if a transaction is needed.
 * @param {Function} [callback] The callback function
 */
DB2.prototype.destroyAll = function(model, where, options, callback) {
  debug('DB2.prototype.destroyAll (enter)', where, options);
  var self = this;
  var id = self.idName(model);
  var stmt;
  var tableName = self.tableEscaped(model);
  var meta = {};

  function executeWithConnection(connection, cb) {
    // Execution for update requires running two
    // separate SQL statements.  The second depends on the
    // result of the first.
    var countStmt = new ParameterizedSQL('SELECT COUNT(*) AS CNT FROM ');
    countStmt.merge(tableName);
    countStmt.merge(self.buildWhere(where));

    connection.query(countStmt.sql, countStmt.params,
      function(err, countData) {
        if (err) {
          return cb(err);
        }

        if (countData[0]['CNT'] > 0) {
          stmt = self.buildDelete(model, where, options);
          stmt.sql += ' WITH NC';
        } else {
          return cb();
        }

        debug('DB2.prototype.destroyAll (data)', stmt.sql, stmt.params);
        connection.query(stmt.sql, stmt.params, function(err, sData) {
          debug('DB2.prototype.executeSQL (exit)', err, sData);
          if (err) {
            return cb(err);
          }
          meta.isNewInstance = countData[0]['CNT'] === 0;
          cb(null, where, meta);
        });
      });
  };

  if (options.transaction) {
    executeWithConnection(options.transaction.connection,
      function(err, data, meta) {
        if (err) {
          return callback && callback(err);
        } else {
          return callback && callback(null, data, meta);
        }
      });
  } else {
    self.beginTransaction(Transaction.READ_COMMITTED, function(err, conn) {
      if (err) {
        return callback && callback(err);
      }
      executeWithConnection(conn, function(err, where, meta) {
        if (err) {
          conn.rollbackTransaction(function(err) {
            conn.close(function() {});
            return callback && callback(err);
          });
        } else {
          options.transaction = undefined;
          conn.commitTransaction(function(err) {
            if (err) {
              return callback && callback(err);
            }

            conn.close(function() {});
            return callback && callback(null, where, meta);
          });
        }
      });
    });
  }
};

require('./migration')(DB2);
require('./discovery')(DB2);
require('./transaction')(DB2);
