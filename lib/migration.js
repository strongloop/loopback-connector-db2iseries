// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-DB2iSeries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('./globalize');

/*!
 * DB2iSeries connector for LoopBack
 */
var async = require('async');

module.exports = function(DB2iSeries) {
  // DB2iSeries.prototype.getAddModifyColumns = function(model, fields) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{getAddModifyColumns()}} is ' +
  //     'not currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.getColumnsToAdd = function(model, fields) {
  //   throw new Error(g.f('{{getColumnsToAdd()}} is not ' +
  //   'currently supported.'));
  // };

  // DB2iSeries.prototype.getDropColumns = function(model, fields) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{getDropColumns()}} is not currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.getColumnsToDrop = function(model, fields) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{getColumnsToDrop()}} is not ' +
  //     'currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.searchForPropertyInActual =
  // function(model, propName, actualFields) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{searchForPropertyInActual()}} is ' +
  //     'not currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.addPropertyToActual = function(model, propName) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{addPropertyToActual()}} is ' +
  //     'not currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.propertyHasNotBeenDeleted = function(model, propName) {
  //   process.nextTick(function() {
  //     throw new Error(g.f('{{propertyHasNotBeenDeleted()}} is ' +
  //     'not currently supported.'));
  //   });
  // };

  // DB2iSeries.prototype.applySqlChanges =
  // function(model, pendingChanges, cb) {
  //   process.nextTick(function() {
  //     return cb(Error(g.f('{{applySqlChanges()}} is not ' +
  //     'currently supported.')));
  //   });
  // };

  DB2iSeries.prototype.showFields = function(model, cb) {
    var self = this;
    var sql = 'SELECT COLUMN_NAME AS NAME, DATA_TYPE AS DATATYPE, ' +
              'ORDINAL_POSITION AS COLNO,' +
              'IS_NULLABLE AS NULLS ' +
              'FROM QSYS2.COLUMNS ' +
              'WHERE TRIM(TABLE_NAME) LIKE \'' +
              self.table(model) + '\' ' +
              'AND TRIM(TABLE_SCHEMA) LIKE \'' +
              self.schema.toUpperCase() + '\'' +
              ' ORDER BY COLNO';

    this.execute(sql, function(err, fields) {
      if (err) {
        return cb(err);
      } else {
        cb(err, fields);
      }
    });
  };

  DB2iSeries.prototype.showIndexes = function(model, cb) {
    var self = this;
    var sql = 'SELECT INDEX_NAME as INDNAME ' +
              'FROM QSYS2.SYSINDEXES ' +
              'WHERE TRIM(TABLE_NAME) = \'' + self.table(model) + '\' ' +
              'AND TRIM(TABLE_SCHEMA) = \'' + self.schema.toUpperCase() + '\'';

    this.execute(sql, function(err, indexes) {
      if (err) {
        return cb(err);
      } else {
        cb(err, indexes);
      }
    });
  };

  // DB2iSeries.prototype.isActual = function(models, cb) {
  //   process.nextTick(function() {
  //     return cb(Error(g.f('{{isActual()}} is not currently supported.')));
  //   });
  // };
};
