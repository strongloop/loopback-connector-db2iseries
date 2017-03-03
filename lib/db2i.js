// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('./globalize');

/*!
 * DB2 connector for LoopBack
 */
var IBMDB = require('loopback-ibmdb').IBMDB;
var util = require('util');
var debug = require('debug')('loopback:connector:db2iseries');

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

  cb();
};

function DB2(settings) {
  debug('DB2 constructor settings: %j', settings);
  IBMDB.call(this, 'db2iseries', settings);

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
      return cb && cb(Error(g.f('Failed to use connection')));
    }
    if (cb) cb();
  } else {
    self.connect(function(err, conn) {
      if (err) {
        if (cb) cb(Error(err));
      } else if (!self.testConnection(conn, sql)) {
        if (cb) cb(Error(g.f('Failed to use connection')));
      } else {
        if (cb) cb();
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
  var id = self.idColumn(model);
  var sql = 'SELECT \"' + id + '\" FROM FINAL TABLE (' + stmt.sql + ')';

  if (!options.transaction) {
    sql += ' WITH NC';
  }

  self.execute(sql, stmt.params, options, function(err, info) {
    if (err) {
      callback(err);
    } else {
      callback(err, info[0][id]);
    }
  });
};

/**
 * replaceById the model based on the Where clause
 *
 * @param {string} model The model name
 * @param {Object} where The where clause contents
 * @param {Object} data The model instance data
 * @param {Object} options to be used to check if a transaction is needed.
 * @param {Function} [callback] The callback function
 */
DB2.prototype.replaceById = function(model, where, data, options, callback) {
  debug('DB2.prototype.replaceById (enter): ' +
    'model=%j, where=%j, data=%j, options=%j\n',
    model, where, data, options);
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
    countStmt.merge(self.buildWhere(model, where));
    countStmt.noResults = false;

    connection.query(countStmt, function(err, countData) {
      debug('DB2.prototype.replaceById (data): sql %j, countData=%j\n',
            countStmt, countData);

      if (err) {
        debug('DB2.prototype.replaceById (ERR): %j', err);
        return cb(err);
      }

      if (countData[0]['CNT'] > 0) {
        stmt = self.buildReplace(model, where, data, options);
      } else {
        data.count = 0;
        return cb(err, data);
      }

      stmt.noResults = true;

      connection.query(stmt, function(err, sData) {
        if (err) {
          debug('DB2.prototype.replaceById (ERR): %j', err);
          return cb(err);
        }

        data.count = countData[0]['CNT'];
        cb(null, data);
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
 * Update if the model based on the Where clause
 *
 * @param {string} model The model name
 * @param {Object} where The where clause contents
 * @param {Object} data The model instance data
 * @param {Object} options to be used to check if a transaction is needed.
 * @param {Function} [callback] The callback function
 */
DB2.prototype.update = function(model, where, data, options, callback) {
  debug('DB2.prototype.update (enter): ' +
    'model=%j, where=%j, data=%j options=%j\n',
    model, where, data, options);
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
    countStmt.merge(self.buildWhere(model, where));
    countStmt.noResults = false;

    connection.query(countStmt, function(err, countData) {
      debug('DB2.prototype.update (data): sql %j, countData=%j\n',
            countStmt, countData);

      if (err) {
        debug('DB2.prototype.update (ERR): %j', err);
        return cb(err);
      }

      if (countData[0]['CNT'] > 0) {
        stmt = self.buildUpdate(model, where, data, options);
      } else {
        data.count = 0;
        return cb(err, data);
      }

      stmt.noResults = true;

      connection.query(stmt, function(err, sData) {
        if (err) {
          debug('DB2.prototype.update (ERR): %j', err);
          return cb(err);
        }

        data.count = countData[0]['CNT'];
        cb(null, data);
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
  debug('DB2.prototype.destroyAll (enter): where=%j; options=%j\n',
        where, options);
  var self = this;

  function executeWithConnection(connection, cb) {
    var stmt;
    var tableName = self.tableEscaped(model);
    var countStmt = new ParameterizedSQL('SELECT COUNT(*) AS CNT FROM ');
    countStmt.merge(tableName);
    countStmt.merge(self.buildWhere(model, where));
    countStmt.noResults = false;

    connection.query(countStmt, function(err, countData) {
      var data = {};
      if (err) {
        return cb(err);
      }

      if (countData[0]['CNT'] > 0) {
        stmt = self.buildDelete(model, where, options);
      } else {
        data.count = 0;
        return cb(null, data);
      }

      stmt.noResults = true;

      debug('DB2.prototype.destroyAll (data)', stmt.sql, stmt.params);
      connection.query(stmt, function(err, sData) {
        if (err) {
          debug('DB2.prototype.destroyAll (ERR): %j', err);
          return cb(err);
        }
        data.count = countData[0]['CNT'];
        cb(null, data);
      });
    });
  };

  if (options.transaction) {
    executeWithConnection(options.transaction.connection,
      function(err, data) {
        if (err) {
          return callback && callback(err);
        } else {
          return callback && callback(null, data);
        }
      });
  } else {
    self.beginTransaction(Transaction.READ_COMMITTED, function(err, conn) {
      if (err) {
        return callback && callback(err);
      }
      executeWithConnection(conn, function(err, data) {
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
            return callback && callback(null, data);
          });
        }
      });
    });
  }
};

require('./transaction')(DB2);
require('./migration')(DB2);
