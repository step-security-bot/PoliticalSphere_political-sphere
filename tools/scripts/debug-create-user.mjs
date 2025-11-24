#!/usr/bin/env node
import express from 'express';
import request from 'supertest';

import usersRouter from '../../apps/api/src/routes/users.js';
import { closeDatabase, getDatabase } from '../../apps/api/src/stores/index.js';

(async function run() {
  try {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    // Ensure database connection is initialised the same way tests do
    getDatabase();

    const app = express();
    app.use(express.text({ type: '*/*' }));
    app.use((req, _res, next) => {
      try {
        if (typeof req.body === 'string' && req.body.length > 0) {
          req.body = JSON.parse(req.body);
        }
        return next();
      } catch (err) {
        return next(err);
      }
    });
    app.use('/api', usersRouter);

    const payload = { username: 'testuser', email: 'test@example.com' };

    console.log('\n=== Debug: POST /api/users payload ===');
    console.log(payload);

    const res = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(payload)
      .buffer(true)
      .parse((res, cb) => {
        res.setEncoding('utf8');
        res.on('data', () => {});
        cb(null, res);
      });

    console.log('\n=== Raw response status ===');
    console.log(res.status);
    console.log('\n=== Raw response headers ===');
    console.log(res.headers);
    console.log('\n=== Raw response body (text) ===');
    console.log(res.text);
    console.log('\n=== Raw response body (body) ===');
    console.log(res.body);

    // Close DB
    closeDatabase();

    process.exit(res.status === 201 ? 0 : 2);
  } catch (err) {
    console.error('Debug script caught error:', err);
    try {
      closeDatabase();
    } catch {}
    process.exit(3);
  }
})();
