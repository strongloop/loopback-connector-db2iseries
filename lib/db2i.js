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

DB2.prototype.executeSQL = function(sql, params, options, callback) {
  debug('DB2.prototype.executeSQL (enter) sql=%j, params=%j, options=%j',
        sql, params, options);
  var self = this;
  var conn = self.connection;
  var noResultSet = false;

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

  // if (!options.transaction) {
  //   debug('DB2.prototype.executeSQL; options=%j', options);
  //   //sql += ' FOR READ ONLY';
  // }

  if (options.noResultSet) {
    debug('DB2.prototype.executeSQL: options=%j', options);
    noResultSet = options.noResultSet;
  }

  conn.query({'sql': sql, 'params': params, 'noResults': noResultSet},
    function(err, data, more) {
      debug('DB2.prototype.executeSQL (exit)' +
            ' sql=%j params=%j noResultSet = %j err=%j data=%j more=%j',
            sql, params, noResultSet, err, data, more);
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
 * Update if the model based on the Where clause
 *
 * @param {string} model The model name
 * @param {Object} where The where clause contents
 * @param {Object} data The model instance data
 * @param {Object} options to be used to check if a transaction is needed.
 * @param {Function} [callback] The callback function
 */
DB2.prototype.update = function(model, where, data, options, callback) {
  debug('DB2.prototype.update (enter): '
        + 'model=%j, where=%j, data=%j options=%j\n',
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

    self.executeSQL(countStmt.sql, countStmt.params, options,
      function(err, countData) {
        debug('DB2.prototype.update (data): sql %j, err %j, countData=%j\n',
              countStmt, err, countData);

        if (err) {
          return cb(err);
        }

        if (countData[0]['CNT'] > 0) {
          stmt = self.buildUpdate(model, where, data, options);
        } else {
          data.count = 0;
          return cb(err, data);
        }

        connection.query({'sql': stmt.sql,
                          'params': stmt.params, 'noResults': true},
          function(err, sData) {
            if (err) {
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

    self.executeSQL(countStmt.sql, countStmt.params, options,
      function(err, countData) {
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

        debug('DB2.prototype.destroyAll (data)', stmt.sql, stmt.params);
        connection.query({'sql': stmt.sql, 'params': stmt.params,
          'noResults': true},
          function(err, sData) {
            debug('DB2.prototype.destroyAll (exit)', err, sData);
            if (err) {
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
