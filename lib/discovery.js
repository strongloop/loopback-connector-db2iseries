// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('./globalize');

module.exports = mixinDiscovery;

/**
* @param {DB2} DB2 connector class
* @param {Object} db2
*/
function mixinDiscovery(DB2, db2) {
  DB2.prototype.buildQuerySchemas = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQuerySchemas}} not supported'));
    });
  };

  DB2.prototype.paginateSQL = function(sql, orderBy, options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{paginateSQL}} not supported'));
    });
  };

  DB2.prototype.discoverDatabasesSchemas = function(options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverDatabasesSchemas}}' +
        ' not supported')));
    });
  };

  DB2.prototype.buildQueryTables = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryTables}} not supported'));
    });
  };

  DB2.prototype.buildQueryViews = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryViews}} not supported'));
    });
  };

  DB2.prototype.discoverModelDefinitions = function(options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverModelDefinitions}}' +
        ' not supported')));
    });
  };

  DB2.prototype.buildQueryColumns = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryColumns}} not supported'));
    });
  };

  DB2.prototype.buildPropertyType = function(columnDefinition, options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildPropertyType}} not supported'));
    });
  };

  DB2.prototype.getArgs = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{getArgs}} not supported')));
    });
  };

  DB2.prototype.discoverModelProperties = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverModelProperties}}' +
        ' not supported')));
    });
  };

  DB2.prototype.buildQueryPrimaryKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryPrimaryKeys}} not supported'));
    });
  };

  DB2.prototype.buildQueryForeignKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryForeignKeys}} not supported'));
    });
  };

  DB2.prototype.discoverPrimaryKeys = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverPrimaryKeys}} not supported')));
    });
  };

  DB2.prototype.discoverForeignKeys = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverForeignKeys}} not supported')));
    });
  };

  DB2.prototype.buildQueryExportedForeignKeys = function(schema, table) {
    process.nextTick(function() {
      throw Error(g.f('Function {{buildQueryExportedForeignKeys}}' +
        ' not supported'));
    });
  };

  DB2.prototype.discoverExportedForeignKeys = function(table, options, cb) {
    process.nextTick(function() {
      return cb(Error(g.f('Function {{discoverExportedForeignKeys}}' +
        ' not supported')));
    });
  };

  DB2.prototype.getDefaultSchema = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{getDefaultSchema}} not supported'));
    });
  };

  DB2.prototype.setDefaultOptions = function(options) {
    process.nextTick(function() {
      throw Error(g.f('Function {{setDefaultOptions}} not supported'));
    });
  };

  DB2.prototype.setNullableProperty = function(property) {
    process.nextTick(function() {
      throw Error(g.f('Function {{setNullableProperty}} not supported'));
    });
  };
}
