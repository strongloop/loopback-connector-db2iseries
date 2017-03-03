// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback-connector-db2i
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var path = require('path');
var SG = require('strong-globalize');

SG.SetRootDir(path.join(__dirname, '..'), {autonomousMsgLoading: 'all'});
module.exports = SG();
