import * as Sentry from '@sentry/nestjs';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
  tracesSampleRate: 0.1,
//   sendDefaultPii: false,
  beforeSend(e) { delete e.request?.cookies; if (e.request?.headers) delete e.request.headers.authorization; return e; },
});