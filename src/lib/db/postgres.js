'use strict';

const config = require('../../config.js');

const pgpInit = {};

const pgp = require('pg-promise')(pgpInit);
const pgm = require('pg-monitor');
const db = pgp(config.postgres);

pgp.pg.types.setTypeParser(1082, val => val);

if (config.env !== 'production' && !pgm.isAttached()) {
  pgm.attach(pgpInit);
}

module.exports = {
  any: (q, v) => db.any(q, v),
  none: (q, v) => db.none(q, v),
  one: (q, v, cb) => db.one(q, v, cb),
  oneOrNone: (q, v, cb) => db.oneOrNone(q, v, cb),
  manyOrNone: db.manyOrNone
};
