// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('./globalize');

/*!
 * DB2 iSeries connector for LoopBack
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
  ds.connector = new DB2iSeries(ds.settings);
  ds.connector.dataSource = ds;

  cb();
};

function DB2iSeries(settings) {
  IBMDB.call(this, 'db2iseries', settings);

  // This is less than ideal, better idea would be
  // to extend the propagation of the filter object
  // to executeSQL or pass the options obj around
  this.limitRE = /LIMIT (\d+)/;
  this.offsetRE = /OFFSET (\d+)/;
}

util.inherits(DB2iSeries, IBMDB);

DB2iSeries.prototype.ping = function(cb) {
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
DB2iSeries.prototype.create = function(model, data, options, callback) {
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
 * Update all instances that match the where clause with the given data
 *
 * @param {string} model The model name
 * @param {Object} where The where object
 * @param {Object} data The property/value object representing changes
 * to be made
 * @param {Object} options The options object
 * @param {Function} callback The callback function
 */
DB2iSeries.prototype.update = function(
  model, where, data, options, callback) {
  var self = this;
  var tableName = self.tableEscaped(model);
  var id = self.idName(model);
  var updateStmt = self.buildUpdate(model, where, data, options);
  var selectStmt = new ParameterizedSQL('SELECT ' + self.escapeName(id) +
                                        ' FROM ' + tableName);

  selectStmt.merge(self.buildWhere(model, where));
  selectStmt.merge(' FOR UPDATE');
  self.parameterize(selectStmt);

  var updateData;

  var executeTransaction = function(connection, cb) {
    connection.query(selectStmt.sql, selectStmt.params, function(err, data) {
      debug('DB2iSeries.prototype.update stmt: %j data: %j', selectStmt, data);
      if (err) {
        return cb(err);
      }

      connection.query(updateStmt.sql, updateStmt.params,
        function(err, updateData) {
          debug('DB2iSeries.prototype.update stmt: %j data: %j', updateStmt,
                updateData);
          if (err) {
            return cb(err);
          }

          return cb(null, data.length);
        });
    });
  };

  // If a transaction hasn't already been started, then start a local one now.
  // We will have to deal with cleaning this up in the event some error
  // occurs in the code below.
  if (options.transaction) {
    executeTransaction(options.transaction.connection, function(err, retVal) {
      if (err) {
        return callback(err);
      }
      return callback(null, {count: retVal});
    });
  } else {
    self.beginTransaction(Transaction.REPEATABLE_READ, function(err, conn) {
      if (err) {
        return callback(err);
      } else {
        executeTransaction(conn, function(err, retVal) {
          if (err) {
            self.rollback(conn, function() {
              process.nextTick(conn.close);
            });
            return callback(err);
          }
          self.commit(conn, function() {});
          return callback(null, {count: retVal});
        });
      }
    });
  }
};

/**
 * Build the `DELETE FROM` SQL statement
 *
 * @param {string} model The model name
 * @param {Object} where The where object
 * @param {Object} options Options object
 * @param {Function} callback function
 */
DB2iSeries.prototype.destroyAll = function(
  model, where, options, callback) {
  debug('DB2iSeries.prototype.destroyAll %j %j %j', model, where, options);
  var self = this;
  var tableName = self.tableEscaped(model);
  var id = self.idName(model);
  var deleteStmt = self.buildDelete(model, where, options);
  var selectStmt = new ParameterizedSQL('SELECT ' + self.escapeName(id) +
                                        ' FROM ' + tableName);
  selectStmt.merge(self.buildWhere(model, where));
  self.parameterize(selectStmt);

  var executeTransaction = function(connection, cb) {
    connection.query(selectStmt, function(err, selectData) {
      debug('DB2iSeries.prototype.destroyAll stmt: %j data: %j', selectStmt,
             selectData);
      if (err) {
        return cb(err);
      }

      connection.query(deleteStmt, null, function(err, deleteData) {
        debug('DB2iSeries.prototype.destroyAll stmt: %j data: %j', deleteStmt,
              deleteData);
        if (err) {
          return cb(err);
        }

        return cb(null, {'count': selectData.length});
      });
    });
  };

  // If a transaction hasn't already been started, then start a local one now.
  // We will have to deal with cleaning this up in the event some error
  // occurs in the code below.
  if (options.transaction) {
    executeTransaction(options.transaction.connection, function(err, retVal) {
      if (err) {
        return callback(err);
      }
      return callback(null, data);
    });
  } else {
    self.beginTransaction(Transaction.REPEATABLE_READ, function(err, conn) {
      if (err) {
        return callback(err);
      } else {
        executeTransaction(conn, function(err, data) {
          if (err) {
            self.rollback(conn, function() {
              process.nextTick(conn.close);
            });
            return callback(err);
          }

          self.commit(conn, function() {});
          return callback(null, data);
        });
      }
    });
  }
};

require('./transaction')(DB2iSeries);
require('./migration')(DB2iSeries);
require('./discovery')(DB2iSeries);
