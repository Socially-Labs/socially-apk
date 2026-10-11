import assert from 'node:assert/strict';
import { test } from 'node:test';
import { developmentOrigin } from '../src/api/development-origin.ts';

test('local API follows a changed Expo LAN address and retains the API port', () => {
  assert.equal(developmentOrigin('http://10.100.246.222:3000', '192.168.1.8:8081', true), 'http://192.168.1.8:3000');
  assert.equal(developmentOrigin('http://192.168.1.8:3000', 'exp://172.20.10.2:8081', true), 'http://192.168.1.8:3000');
  assert.equal(developmentOrigin('http://192.168.1.8:3000', '10.0.2.2:8081', true), 'http://10.0.2.2:3000');
  assert.equal(developmentOrigin('http://192.168.1.8:3000', 'localhost:8081', true), 'http://localhost:3000');
});

test('release/disabled, hosted APIs and tunnel addresses retain explicit configuration', () => {
  for (const [api, host, enabled] of [
    ['http://10.100.246.222:3000', '192.168.1.8:8081', false],
    ['https://api.example.com', '192.168.1.8:8081', true],
    ['http://api.example.com:3000', '192.168.1.8:8081', true],
    ['https://192.168.1.8:3000', '192.168.1.9:8081', true],
    ['http://192.168.1.8:3000', 'example.exp.direct', true],
    ['http://192.168.1.8:3000', '8.8.8.8:8081', true],
    ['http://192.168.1.8:3000', undefined, true],
  ]) assert.equal(developmentOrigin(api, host, enabled), api);
});

test('missing and invalid configuration stays invalid for the API validator', () => {
  for (const api of [undefined, '', 'invalid', 'http://user:secret@192.168.1.8:3000', 'http://192.168.1.8:3000/v0', 'http://192.168.1.8:3000?key=1']) {
    assert.equal(developmentOrigin(api, '192.168.1.9:8081', true), api);
  }
});
