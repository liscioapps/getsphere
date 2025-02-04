import path from 'path'

import { NativeConnection, Worker as TemporalWorker, bundleWorkflowCode } from '@temporalio/worker'

import { Config, Service } from '@crowd/archetype-standard'
import { getDbConnection, DbStore } from '@crowd/database'
import { OpenSearchService } from '@crowd/opensearch'
import { getDataConverter } from '@crowd/temporal'
import { IS_DEV_ENV, IS_TEST_ENV } from '@crowd/common'
import { SqsClient, getSqsClient } from '@crowd/sqs'

// List all required environment variables, grouped per "component".
// They are in addition to the ones required by the "standard" archetype.
const envvars = {
  worker: [
    'CROWD_TEMPORAL_SERVER_URL',
    'CROWD_TEMPORAL_NAMESPACE',
    'CROWD_TEMPORAL_TASKQUEUE',
    'CROWD_TEMPORAL_ENCRYPTION_KEY_ID',
    'CROWD_TEMPORAL_ENCRYPTION_KEY',
  ],
  postgres: [
    'CROWD_DB_READ_HOST',
    'CROWD_DB_WRITE_HOST',
    'CROWD_DB_PORT',
    'CROWD_DB_USERNAME',
    'CROWD_DB_PASSWORD',
    'CROWD_DB_SSL',
    'CROWD_DB_DATABASE',
  ],
  opensearch:
    IS_DEV_ENV || IS_TEST_ENV
      ? ['CROWD_OPENSEARCH_NODE']
      : [
          'CROWD_OPENSEARCH_AWS_REGION',
          'CROWD_OPENSEARCH_AWS_ACCESS_KEY_ID',
          'CROWD_OPENSEARCH_AWS_SECRET_ACCESS_KEY',
          'CROWD_OPENSEARCH_NODE',
        ],
  sqs:
    IS_DEV_ENV || IS_TEST_ENV
      ? [
          'CROWD_SQS_AWS_REGION',
          'CROWD_SQS_HOST',
          'CROWD_SQS_PORT',
          'CROWD_SQS_AWS_ACCESS_KEY_ID',
          'CROWD_SQS_AWS_SECRET_ACCESS_KEY',
        ]
      : ['CROWD_SQS_AWS_REGION', 'CROWD_SQS_AWS_ACCESS_KEY_ID', 'CROWD_SQS_AWS_SECRET_ACCESS_KEY'],
}

/*
Options is used to configure the worker service.
*/
export interface Options {
  maxTaskQueueActivitiesPerSecond?: number
  maxConcurrentActivityTaskExecutions?: number
  postgres?: {
    enabled: boolean
  }
  opensearch?: {
    enabled: boolean
  }
  sqs?: {
    enabled: boolean
  }
}

/*
ServiceWorker holds all details and methods to run a worker services at crowd.dev.
*/
export class ServiceWorker extends Service {
  readonly options: Options

  protected _worker: TemporalWorker

  protected _postgresReader: DbStore
  protected _postgresWriter: DbStore

  protected _opensearchService: OpenSearchService

  protected _sqsClient: SqsClient

  constructor(config: Config, opts: Options) {
    super(config)

    this.options = opts
  }

  get postgres(): { reader: DbStore; writer: DbStore } | null {
    if (!this.options.postgres?.enabled) {
      return null
    }

    return {
      reader: this._postgresReader,
      writer: this._postgresWriter,
    }
  }

  get opensearch(): OpenSearchService {
    if (!this.options.opensearch?.enabled) {
      return null
    }

    return this._opensearchService
  }

  get sqs(): SqsClient {
    if (!this.options.sqs?.enabled) {
      return null
    }

    return this._sqsClient
  }

  // We first need to ensure a standard service can be initialized given the config
  // and environment variables.
  override async init() {
    try {
      await super.init()
    } catch (err) {
      throw new Error(err)
    }

    // We can now init tasks specific to a consumer service. Before actually
    // starting the service, we need to ensure required environment variables
    // are set.
    const missing = []
    envvars.worker.forEach((envvar) => {
      if (!process.env[envvar]) {
        missing.push(envvar)
      }
    })

    // Only validate PostgreSQL-related environment variables if enabled.
    if (this.options.postgres?.enabled) {
      envvars.postgres.forEach((envvar) => {
        if (!process.env[envvar]) {
          missing.push(envvar)
        }
      })
    }

    // Only validate OpenSearch-related environment variables if enabled.
    if (this.options.opensearch?.enabled) {
      envvars.opensearch.forEach((envvar) => {
        if (!process.env[envvar]) {
          missing.push(envvar)
        }
      })
    }

    // Only validate Sqs related environment variables if enabled
    if (this.options.sqs?.enabled) {
      envvars.sqs.forEach((envvar) => {
        if (!process.env[envvar]) {
          missing.push(envvar)
        }
      })
    }

    // There's no point in continuing if a variable is missing.
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }

    if (this.options.postgres?.enabled) {
      try {
        const dbConnection = await getDbConnection({
          host: process.env['CROWD_DB_READ_HOST'],
          port: Number(process.env['CROWD_DB_PORT']),
          user: process.env['CROWD_DB_USERNAME'],
          password: process.env['CROWD_DB_PASSWORD'],
          database: process.env['CROWD_DB_DATABASE'],
          ssl: process.env['CROWD_DB_SSL'],
        })

        this._postgresReader = new DbStore(this.log, dbConnection)
      } catch (err) {
        throw new Error(err)
      }

      try {
        const dbConnection = await getDbConnection({
          host: process.env['CROWD_DB_WRITE_HOST'],
          port: Number(process.env['CROWD_DB_PORT']),
          user: process.env['CROWD_DB_USERNAME'],
          password: process.env['CROWD_DB_PASSWORD'],
          database: process.env['CROWD_DB_DATABASE'],
          ssl: process.env['CROWD_DB_SSL'],
        })

        this._postgresWriter = new DbStore(this.log, dbConnection)
      } catch (err) {
        throw new Error(err)
      }
    }

    if (this.options.opensearch?.enabled) {
      try {
        this._opensearchService = new OpenSearchService(this.log, {
          region: process.env['CROWD_OPENSEARCH_AWS_REGION'],
          accessKeyId: process.env['CROWD_OPENSEARCH_AWS_ACCESS_KEY_ID'],
          secretAccessKey: process.env['CROWD_OPENSEARCH_AWS_SECRET_ACCESS_KEY'],
          node: process.env['CROWD_OPENSEARCH_NODE'],
        })
      } catch (err) {
        throw new Error(err)
      }
    }

    if (this.options.sqs?.enabled) {
      try {
        this._sqsClient = getSqsClient({
          region: process.env['CROWD_SQS_AWS_REGION'],
          host: process.env['CROWD_SQS_HOST'] ? process.env['CROWD_SQS_HOST'] : undefined,
          port: process.env['CROWD_SQS_PORT'] ? Number(process.env['CROWD_SQS_PORT']) : undefined,
          accessKeyId: process.env['CROWD_SQS_AWS_ACCESS_KEY_ID'],
          secretAccessKey: process.env['CROWD_SQS_AWS_SECRET_ACCESS_KEY'],
        })
      } catch (err) {
        throw new Error(err)
      }
    }

    try {
      const certificate = process.env['CROWD_TEMPORAL_CERTIFICATE']
      const privateKey = process.env['CROWD_TEMPORAL_PRIVATE_KEY']

      this.log.info(
        {
          address: process.env['CROWD_TEMPORAL_SERVER_URL'],
          certificate: certificate ? 'yes' : 'no',
          privateKey: privateKey ? 'yes' : 'no',
        },
        'Connecting to Temporal server as a worker!',
      )

      const connection = await NativeConnection.connect({
        address: process.env['CROWD_TEMPORAL_SERVER_URL'],
        tls:
          certificate && privateKey
            ? {
                clientCertPair: {
                  crt: Buffer.from(certificate, 'base64'),
                  key: Buffer.from(privateKey, 'base64'),
                },
              }
            : undefined,
      })

      const workflowBundle = await bundleWorkflowCode({
        workflowsPath: path.resolve('./src/workflows'),
      })

      this._worker = await TemporalWorker.create({
        connection: connection,
        identity: this.name,
        namespace: process.env['CROWD_TEMPORAL_NAMESPACE'],
        taskQueue: process.env['CROWD_TEMPORAL_TASKQUEUE'],
        enableSDKTracing: true,
        showStackTraceSources: true,
        workflowBundle: workflowBundle,
        activities: require(path.resolve('./src/activities')),
        dataConverter: await getDataConverter(),
        maxTaskQueueActivitiesPerSecond: this.options.maxTaskQueueActivitiesPerSecond,
        maxConcurrentActivityTaskExecutions: this.options.maxConcurrentActivityTaskExecutions,
      })
    } catch (err) {
      throw new Error(err)
    }
  }

  // Actually start the Temporal worker.
  async start() {
    try {
      await this._worker.run()
    } catch (err) {
      throw new Error(err)
    }
  }

  // Stop allows to gracefully stop the service. Order for closing connections
  // matters. We need to stop the Temporal worker before closing other connections.
  protected override async stop() {
    if (this.options.opensearch?.enabled) {
      await this._opensearchService.client.close()
    }

    if (this.options.postgres?.enabled) {
      this._postgresWriter.dbInstance.end()
      this._postgresReader.dbInstance.end()
    }

    await super.stop()
  }
}
