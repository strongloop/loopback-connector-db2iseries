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
  DB2iSeries.prototype.getAddModifyColumns = function(model, fields) {
    process.nextTick(function() {
      throw new Error(g.f('{{getAddModifyColumns()}} is ' +
      'not currently supported.'));
    });
  };

  DB2iSeries.prototype.getDropColumns = function(model, fields) {
    process.nextTick(function() {
      throw new Error(g.f('{{getDropColumns()}} is not currently supported.'));
    });
  };

  DB2iSeries.prototype.getColumnsToDrop = function(model, fields) {
    process.nextTick(function() {
      throw new Error(g.f('{{getColumnsToDrop()}} is not ' +
      'currently supported.'));
    });
  };

  DB2iSeries.prototype.searchForPropertyInActual =
  function(model, propName, actualFields) {
    process.nextTick(function() {
      throw new Error(g.f('{{searchForPropertyInActual()}} is ' +
      'not currently supported.'));
    });
  };

  DB2iSeries.prototype.addPropertyToActual = function(model, propName) {
    process.nextTick(function() {
      throw new Error(g.f('{{addPropertyToActual()}} is ' +
      'not currently supported.'));
    });
  };

  DB2iSeries.prototype.columnDataType = function(model, property) {
    process.nextTick(function() {
      throw new Error(g.f('{{columnDataType()}} is not currently supported.'));
    });
  };

  DB2iSeries.prototype.buildColumnType = function(property) {
    process.nextTick(function() {
      throw new Error(g.f('{{buildColumnType()}} is not currently supported.'));
    });
  };

  DB2iSeries.prototype.propertyHasNotBeenDeleted = function(model, propName) {
    process.nextTick(function() {
      throw new Error(g.f('{{propertyHasNotBeenDeleted()}} is ' +
      'not currently supported.'));
    });
  };

  DB2iSeries.prototype.applySqlChanges =
  function(model, pendingChanges, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{applySqlChanges()}} is not ' +
      'currently supported.')));
    });
  };

  DB2iSeries.prototype.showFields = function(model, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{showFields()}} is not currently supported.')));
    });
  };

  DB2iSeries.prototype.showIndexes = function(model, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{showIndexes()}} is not currently supported.')));
    });
  };

  DB2iSeries.prototype.autoupdate = function(models, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{autoupdate()}} is not currently supported.')));
    });
  };

  DB2iSeries.prototype.isActual = function(models, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{isActual()}} is not currently supported.')));
    });
  };

  DB2iSeries.prototype.alterTable = function(model, fields, indexes, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{alterTable()}} is not currently supported.')));
    });
  };

  DB2iSeries.prototype.getTableStatus = function(model, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('{{getTableStatus()}} is not currently supported.')));
    });
  };
};
