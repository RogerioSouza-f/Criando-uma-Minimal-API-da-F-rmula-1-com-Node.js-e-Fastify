import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';

type Driver = {
  id: number;
  name: string;
  team: string;
  nationality: string;
  wins: number;
  championships: number;
};

type Team = {
  id: number;
  name: string;
  country: string;
  headquarters: string;
};

const drivers: Driver[] = [
  { id: 1, name: 'Max Verstappen', team: 'Red Bull Racing', nationality: 'Dutch', wins: 54, championships: 2 },
  { id: 2, name: 'Charles Leclerc', team: 'Ferrari', nationality: 'Monégasque', wins: 5, championships: 0 },
  { id: 3, name: 'Lewis Hamilton', team: 'Mercedes', nationality: 'British', wins: 103, championships: 7 },
  { id: 4, name: 'Lando Norris', team: 'McLaren', nationality: 'British', wins: 0, championships: 0 },
];

const teams: Team[] = [
  { id: 1, name: 'Red Bull Racing', country: 'Austria', headquarters: 'Milton Keynes' },
  { id: 2, name: 'Ferrari', country: 'Italy', headquarters: 'Maranello' },
  { id: 3, name: 'Mercedes', country: 'Germany', headquarters: 'Brackley' },
  { id: 4, name: 'McLaren', country: 'United Kingdom', headquarters: 'Woking' },
];

const driverSchema = {
  type: 'object',
  required: ['name', 'team', 'nationality'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    team: { type: 'string' },
    nationality: { type: 'string' },
    wins: { type: 'number', minimum: 0 },
    championships: { type: 'number', minimum: 0 },
  },
} as const;

const teamSchema = {
  type: 'object',
  required: ['name', 'country', 'headquarters'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    country: { type: 'string' },
    headquarters: { type: 'string' },
  },
} as const;

const notFoundResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
} as const;

function buildServer(): FastifyInstance {
  const app = Fastify({ logger: false });

  void app.register(cors, {
    origin: true,
  });

  app.get('/', async () => ({
    title: 'Formula 1 Minimal API',
    description: 'A lightweight CRUD API for managing Formula 1 drivers and teams.',
    endpoints: [
      'GET /health',
      'GET /drivers',
      'POST /drivers',
      'GET /drivers/:id',
      'PUT /drivers/:id',
      'DELETE /drivers/:id',
      'GET /teams',
      'POST /teams',
      'GET /teams/:id',
      'PUT /teams/:id',
      'DELETE /teams/:id',
    ],
  }));

  app.get('/health', async () => ({ status: 'ok', service: 'formula1-minimal-api' }));

  function registerCollection<T extends { id: number }>(
    resourceName: string,
    aliases: string[],
    store: T[],
    schema: typeof driverSchema | typeof teamSchema,
    filterValue: (item: T) => string = (item) => String(item.id),
  ) {
    const paths = [...new Set([resourceName, ...aliases])];

    for (const path of paths) {
      app.get(
        `/${path}`,
        {
          schema: {
            response: {
              200: { type: 'array', items: schema },
            },
          },
        },
        async (request: FastifyRequest<{ Querystring: { team?: string } }>) => {
          const teamName = request.query.team?.trim();
          const filtered = teamName
            ? store.filter((item) => filterValue(item).toLowerCase() === teamName.toLowerCase())
            : store;

          return filtered;
        },
      );

      app.post(
        `/${path}`,
        {
          schema: {
            body: schema,
            response: {
              201: schema,
            },
          },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
          const payload = request.body as Record<string, unknown>;
          const created = {
            ...payload,
            id: Date.now() + Math.floor(Math.random() * 1000),
          } as T;

          store.push(created);
          return reply.code(201).send(created);
        },
      );

      app.get(
        `/${path}/:id`,
        {
          schema: {
            response: {
              200: schema,
              404: notFoundResponse,
            },
          },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
          const item = store.find((entry) => entry.id === Number(request.params.id));

          if (!item) {
            return reply.code(404).send({ message: `${resourceName.slice(0, -1)} not found` });
          }

          return item;
        },
      );

      app.put(
        `/${path}/:id`,
        {
          schema: {
            body: schema,
            response: {
              200: schema,
              404: notFoundResponse,
            },
          },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
          const payload = request.body as Partial<T>;
          const index = store.findIndex((entry) => entry.id === Number(request.params.id));

          if (index === -1) {
            return reply.code(404).send({ message: `${resourceName.slice(0, -1)} not found` });
          }

          const updated = { ...store[index], ...payload, id: store[index].id } as T;
          store[index] = updated;
          return updated;
        },
      );

      app.delete(
        `/${path}/:id`,
        {
          schema: {
            response: {
              200: {
                type: 'object',
                properties: {
                  deleted: schema,
                },
              },
              404: notFoundResponse,
            },
          },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
          const index = store.findIndex((entry) => entry.id === Number(request.params.id));

          if (index === -1) {
            return reply.code(404).send({ message: `${resourceName.slice(0, -1)} not found` });
          }

          const [deleted] = store.splice(index, 1);
          return { deleted };
        },
      );
    }
  }

  registerCollection<Driver>('drivers', ['pilotos'], drivers, driverSchema, (item) => item.team);
  registerCollection<Team>('teams', ['constructors', 'equipes'], teams, teamSchema, (item) => item.name);

  return app;
}

if (require.main === module) {
  const server = buildServer();

  void server.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log('Server listening on http://localhost:3000');
  });
}

export { buildServer };
