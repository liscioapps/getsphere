import { SERVICE } from '@crowd/common'
import { getUnleashClient } from '@crowd/feature-flags'
import { getServiceLogger } from '@crowd/logging'
import { getOpensearchClient } from '@crowd/opensearch'
import { getRedisClient, getRedisPubSubPair, RedisPubSubReceiver } from '@crowd/redis'
import { getServiceTracer } from '@crowd/tracing'
import { ApiWebsocketMessage, Edition } from '@crowd/types'
import bodyParser from 'body-parser'
import bunyanMiddleware from 'bunyan-middleware'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import * as http from 'http'
import { getTemporalClient, Client as TemporalClient } from '@crowd/temporal'
import { QueryTypes, Sequelize } from 'sequelize'
import { telemetryExpressMiddleware } from '@crowd/telemetry'
import {
  API_CONFIG,
  OPENSEARCH_CONFIG,
  REDIS_CONFIG,
  TEMPORAL_CONFIG,
  UNLEASH_CONFIG,
} from '../conf'
import { authMiddleware } from '../middlewares/authMiddleware'
import { databaseMiddleware } from '../middlewares/databaseMiddleware'
import { errorMiddleware } from '../middlewares/errorMiddleware'
import { languageMiddleware } from '../middlewares/languageMiddleware'
import { opensearchMiddleware } from '../middlewares/opensearchMiddleware'
import { passportStrategyMiddleware } from '../middlewares/passportStrategyMiddleware'
import { redisMiddleware } from '../middlewares/redisMiddleware'
import { responseHandlerMiddleware } from '../middlewares/responseHandlerMiddleware'
import { segmentMiddleware } from '../middlewares/segmentMiddleware'
import { tenantMiddleware } from '../middlewares/tenantMiddleware'
import setupSwaggerUI from './apiDocumentation'
import { createRateLimiter } from './apiRateLimiter'
import authSocial from './auth/authSocial'
import WebSockets from './websockets'
import { databaseInit } from '@/database/databaseConnection'

const serviceLogger = getServiceLogger()
getServiceTracer()

const app = express()

const server = http.createServer(app)

setImmediate(async () => {
  const redis = await getRedisClient(REDIS_CONFIG, true)

  const opensearch = getOpensearchClient(OPENSEARCH_CONFIG)

  const redisPubSubPair = await getRedisPubSubPair(REDIS_CONFIG)
  const userNamespace = await WebSockets.initialize(server)

  const pubSubReceiver = new RedisPubSubReceiver(
    'api-pubsub',
    redisPubSubPair.subClient,
    (err) => {
      serviceLogger.error(err, 'Error while listening to Redis Pub/Sub api-ws channel!')
      process.exit(1)
    },
    serviceLogger,
  )

  pubSubReceiver.subscribe('user', async (message) => {
    const data = message as ApiWebsocketMessage

    if (data.tenantId) {
      await userNamespace.emitForTenant(data.tenantId, data.event, data.data)
    } else if (data.userId) {
      userNamespace.emitToUserRoom(data.userId, data.event, data.data)
    } else {
      serviceLogger.error({ type: data.type }, 'Received invalid websocket message!')
    }
  })

  app.use(telemetryExpressMiddleware('api.request.duration'))

  // Enables CORS
  app.use(cors({ origin: true }))

  // Logging middleware
  app.use(
    bunyanMiddleware({
      headerName: 'x-request-id',
      propertyName: 'requestId',
      logName: `requestId`,
      logger: serviceLogger,
      level: 'trace',
    }),
  )

  // Initializes and adds the database middleware.
  app.use(databaseMiddleware)

  // Bind redis to request
  app.use(redisMiddleware(redis))

  // bind opensearch
  app.use(opensearchMiddleware(opensearch))

  // Bind unleash to request
  if (UNLEASH_CONFIG.url && API_CONFIG.edition === Edition.CROWD_HOSTED) {
    const unleash = await getUnleashClient({
      url: UNLEASH_CONFIG.url,
      apiKey: UNLEASH_CONFIG.backendApiKey,
      appName: SERVICE,
    })

    app.use((req: any, res, next) => {
      req.unleash = unleash
      next()
    })
  }

  // temp check for production
  if (TEMPORAL_CONFIG.serverUrl) {
    // Bind temporal to request
    const temporal = await getTemporalClient(TEMPORAL_CONFIG)
    app.use((req: any, res, next) => {
      req.temporal = temporal
      next()
    })
  }

  // initialize passport strategies
  app.use(passportStrategyMiddleware)

  // Sets the current language of the request
  app.use(languageMiddleware)

  // adds our ApiResponseHandler instance to the req object as responseHandler
  app.use(responseHandlerMiddleware)

  // Configures the authentication middleware
  // to set the currentUser to the requests
  app.use(authMiddleware)

  // Setup the Documentation
  setupSwaggerUI(app)

  // Default rate limiter
  const defaultRateLimiter = createRateLimiter({
    max: 200,
    windowMs: 60 * 1000,
    message: 'errors.429',
  })
  app.use(defaultRateLimiter)

  // Enables Helmet, a set of tools to
  // increase security.
  app.use(helmet())

  app.use(
    bodyParser.json({
      limit: '5mb',
      verify(req, res, buf) {
        const url = (<any>req).originalUrl
        if (url.startsWith('/webhooks/stripe') || url.startsWith('/webhooks/sendgrid')) {
          // Stripe and sendgrid webhooks needs the body raw
          // for verifying the webhook with signing secret
          ;(<any>req).rawBody = buf.toString()
        }
      },
    }),
  )

  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }))

  app.use((req, res, next) => {
    req.userData = {
      ip: req.ip,
      userAgent: req.headers ? req.headers['user-agent'] : null,
    }

    next()
  })

  // Configure the Entity routes
  const routes = express.Router()

  // Enable Passport for Social Sign-in
  authSocial(app, routes)

  const loadRoute = async (route: string) => {
    const module = await import(`./${route}`)
    module.default(routes)
  }

  await loadRoute('./auditLog')
  await loadRoute('./auth')
  await loadRoute('./plan')
  await loadRoute('./tenant')
  await loadRoute('./user')
  await loadRoute('./settings')
  await loadRoute('./member')
  await loadRoute('./widget')
  await loadRoute('./activity')
  await loadRoute('./tag')
  await loadRoute('./widget')
  await loadRoute('./cubejs')
  await loadRoute('./report')
  await loadRoute('./integration')
  await loadRoute('./microservice')
  await loadRoute('./conversation')
  await loadRoute('./eagleEyeContent')
  await loadRoute('./automation')
  await loadRoute('./task')
  await loadRoute('./note')
  await loadRoute('./organization')
  await loadRoute('./quickstart-guide')
  await loadRoute('./slack')
  await loadRoute('./segment')
  await loadRoute('./systemStatus')
  await loadRoute('./eventTracking')
  await loadRoute('./customViews')
  await loadRoute('./dashboard')
  await loadRoute('./premium/enrichment')
  // Loads the Tenant if the :tenantId param is passed
  routes.param('tenantId', tenantMiddleware)
  routes.param('tenantId', segmentMiddleware)

  app.use('/', routes)

  const webhookRoutes = express.Router()
  const module = await import('./webhooks')
  module.default(webhookRoutes)

  const seq = (await databaseInit()).sequelize as Sequelize

  app.use('/health', async (req: any, res) => {
    try {
      const [osPingRes, redisPingRes, dbPingRes, temporalPingRes] = await Promise.all([
        // ping opensearch
        opensearch.ping().then((res) => res.body),
        // ping redis,
        redis.ping().then((res) => res === 'PONG'),
        // ping database
        seq.query('select 1', { type: QueryTypes.SELECT }).then((rows) => rows.length === 1),
        // ping temporal
        req.temporal
          ? (req.temporal as TemporalClient).workflowService.getSystemInfo({}).then(() => true)
          : Promise.resolve(true),
      ])

      if (osPingRes && redisPingRes && dbPingRes && temporalPingRes) {
        res.sendStatus(200)
      } else {
        res.status(500).json({
          opensearch: osPingRes,
          redis: redisPingRes,
          database: dbPingRes,
          temporal: temporalPingRes,
        })
      }
    } catch (err) {
      res.status(500).json({ error: err })
    }
  })

  app.use('/webhooks', webhookRoutes)

  const io = await import('@pm2/io')

  app.use(errorMiddleware)

  app.use(io.default.expressErrorHandler())
})

export default server
