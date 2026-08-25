"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const server_1 = require("./server");
(0, node_test_1.default)('GET /health returns status ok', async () => {
    const app = (0, server_1.buildServer)();
    const response = await app.inject({ method: 'GET', url: '/health' });
    strict_1.default.equal(response.statusCode, 200);
    strict_1.default.deepEqual(response.json(), { status: 'ok', service: 'formula1-minimal-api' });
});
(0, node_test_1.default)('GET /drivers accepts filter by team', async () => {
    const app = (0, server_1.buildServer)();
    const response = await app.inject({ method: 'GET', url: '/drivers?team=Ferrari' });
    strict_1.default.equal(response.statusCode, 200);
    const body = response.json();
    strict_1.default.equal(body.length, 1);
    strict_1.default.equal(body[0].name, 'Charles Leclerc');
});
