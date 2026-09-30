export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Naree VendTrack - Sanitary Napkin Vending Machine Management System API',
    version: '1.0.0',
    description:
      'Production-ready REST API for central monitoring, PhonePe/Razorpay webhook processing, IoT machine telemetrics, stock reconciliation, and reporting for sanitary napkin vending machines.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Admin login',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@naree.com' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Successful authentication returning JWT token' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Get dashboard KPI summary cards',
        tags: ['Dashboard & Analytics'],
        responses: { '200': { description: 'Metrics summary' } },
      },
    },
    '/dashboard/charts': {
      get: {
        summary: 'Get revenue, dispensing, and gateway distribution charts',
        tags: ['Dashboard & Analytics'],
        parameters: [{ name: 'period', in: 'query', schema: { type: 'string', default: '7d' } }],
        responses: { '200': { description: 'Chart timeseries data' } },
      },
    },
    '/machines': {
      get: {
        summary: 'List vending machines with filters and search',
        tags: ['Machines'],
        responses: { '200': { description: 'Paginated machines' } },
      },
      post: {
        summary: 'Register a new vending machine with existing PhonePe/Razorpay QR identifiers',
        tags: ['Machines'],
        responses: { '201': { description: 'Machine registered' } },
      },
    },
    '/machines/{id}': {
      get: {
        summary: 'Get detailed machine profile including hardware telemetry and financial history',
        tags: ['Machines'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Machine details' } },
      },
    },
    '/webhooks/phonepe': {
      post: {
        summary: 'Official PhonePe payment callback webhook endpoint (Idempotent)',
        tags: ['Webhooks & Payments'],
        security: [],
        responses: { '200': { description: 'Webhook processed' } },
      },
    },
    '/webhooks/razorpay': {
      post: {
        summary: 'Official Razorpay payment callback webhook endpoint (HMAC-SHA256 signature verified)',
        tags: ['Webhooks & Payments'],
        security: [],
        responses: { '200': { description: 'Webhook processed' } },
      },
    },
    '/iot/heartbeat': {
      post: {
        summary: 'Vending machine periodic telemetry heartbeat',
        tags: ['IoT Controller'],
        security: [],
        responses: { '200': { description: 'Heartbeat acknowledged' } },
      },
    },
    '/iot/dispense-result': {
      post: {
        summary: 'Physical motor dispense confirmation from IoT SIM controller',
        tags: ['IoT Controller'],
        security: [],
        responses: { '200': { description: 'Dispense confirmation processed' } },
      },
    },
    '/reconciliation': {
      get: {
        summary: 'Audit reconciliation exceptions (Payment success with dispense failure, stock mismatches)',
        tags: ['Reconciliation'],
        responses: { '200': { description: 'Reconciliation exceptions list' } },
      },
    },
  },
};
