const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('./app');

test('GET /health returns status ok', async () => {
  const app = buildApp();
  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');
});

test('CRUD flow for drivers works', async () => {
  const app = buildApp();

  const createResponse = await app.inject({
    method: 'POST',
    url: '/drivers',
    payload: {
      name: 'Fernando Alonso',
      team: 'Aston Martin',
      nationality: 'Spanish',
      wins: 32,
      championships: 2,
    },
  });

  assert.equal(createResponse.statusCode, 201);
  const driver = createResponse.json();
  assert.equal(driver.name, 'Fernando Alonso');

  const listResponse = await app.inject({ method: 'GET', url: '/drivers' });
  assert.equal(listResponse.statusCode, 200);
  assert.ok(Array.isArray(listResponse.json()));

  const detailResponse = await app.inject({ method: 'GET', url: `/drivers/${driver.id}` });
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.json().team, 'Aston Martin');

  const updateResponse = await app.inject({
    method: 'PUT',
    url: `/drivers/${driver.id}`,
    payload: {
      name: 'Fernando Alonso',
      team: 'Aston Martin Aramco',
      nationality: 'Spanish',
      wins: 32,
      championships: 2,
    },
  });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().team, 'Aston Martin Aramco');

  const deleteResponse = await app.inject({ method: 'DELETE', url: `/drivers/${driver.id}` });
  assert.equal(deleteResponse.statusCode, 200);
  assert.equal(deleteResponse.json().deleted.team, 'Aston Martin Aramco');
});
