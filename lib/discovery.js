// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('./globalize');

module.exports = mixinDiscovery;

/**
* @param {DB2iSeries} DB2iSeries connector class
* @param {Object} db2i
*/
function mixinDiscovery(DB2iSeries, db2i) {
  DB2iSeries.prototype.buildQuerySchemas = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQuerySchemas}} not supported'));
    });
  };

  DB2iSeries.prototype.paginateSQL = function(sql, orderBy, options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{paginateSQL}} not supported'));
    });
  };

  DB2iSeries.prototype.discoverDatabasesSchemas = function(options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverDatabasesSchemas}}' +
        ' not supported')));
    });
  };

  DB2iSeries.prototype.buildQueryTables = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryTables}} not supported'));
    });
  };

  DB2iSeries.prototype.buildQueryViews = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryViews}} not supported'));
    });
  };

  DB2iSeries.prototype.discoverModelDefinitions = function(options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverModelDefinitions}}' +
        ' not supported')));
    });
  };

  DB2iSeries.prototype.buildQueryColumns = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryColumns}} not supported'));
    });
  };

  DB2iSeries.prototype.buildPropertyType = function(columnDefinition, options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildPropertyType}} not supported'));
    });
  };

  DB2iSeries.prototype.getArgs = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{getArgs}} not supported')));
    });
  };

  DB2iSeries.prototype.discoverModelProperties = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverModelProperties}}' +
        ' not supported')));
    });
  };

  DB2iSeries.prototype.buildQueryPrimaryKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryPrimaryKeys}} not supported'));
    });
  };

  DB2iSeries.prototype.buildQueryForeignKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryForeignKeys}} not supported'));
    });
  };

  DB2iSeries.prototype.discoverPrimaryKeys = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverPrimaryKeys}} not supported')));
    });
  };

  DB2iSeries.prototype.discoverForeignKeys = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverForeignKeys}} not supported')));
    });
  };

  DB2iSeries.prototype.buildQueryExportedForeignKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryExportedForeignKeys}}' +
        ' not supported'));
    });
  };

  DB2iSeries.prototype.discoverExportedForeignKeys = function(table,
     options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverExportedForeignKeys}}' +
        ' not supported')));
    });
  };

  DB2iSeries.prototype.getDefaultSchema = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{getDefaultSchema}} not supported'));
    });
  };

  DB2iSeries.prototype.setDefaultOptions = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{setDefaultOptions}} not supported'));
    });
  };

  DB2iSeries.prototype.setNullableProperty = function(property) {
    process.nextTick(function() {
      throw Error(g.f('Function {{setNullableProperty}} not supported'));
    });
  };
}
