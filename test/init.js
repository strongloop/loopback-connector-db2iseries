// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = {
  username: process.env.DB2I_USERNAME,
  password: process.env.DB2I_PASSWORD,
  hostname: process.env.DB2I_HOSTNAME || 'localhost',
  port: process.env.DB2I_PORTNUM || 60000,
  database: process.env.DB2I_DATABASE || 'testdb',
  schema: process.env.DB2I_SCHEMA || 'STRONGLOOP',
};

global.config = config;

global.getDataSource = global.getSchema = function(options) {
  var db = new DataSource(require('../'), config);
  return db;
};

global.sinon = require('sinon');
