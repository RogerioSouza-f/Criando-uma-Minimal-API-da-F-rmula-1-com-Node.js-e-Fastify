import test from 'node:test';
import assert from 'node:assert/strict';

import { buildServer } from './server';

test('GET /health returns status ok', async () => {
  const app = buildServer();
  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok', service: 'formula1-minimal-api' });
});

test('GET /drivers accepts filter by team', async () => {
  const app = buildServer();
  const response = await app.inject({ method: 'GET', url: '/drivers?team=Ferrari' });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.length, 1);
  assert.equal(body[0].name, 'Charles Leclerc');
});
