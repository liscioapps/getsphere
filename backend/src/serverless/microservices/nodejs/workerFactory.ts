/* eslint-disable no-case-declarations */
import {
  CsvExportMessage,
  NodeMicroserviceMessage,
  IntegrationDataCheckerMessage,
} from './messageTypes'
import { csvExportWorker } from './csv-export/csvExportWorker'
import { processStripeWebhook } from '../../integrations/workers/stripeWebhookWorker'
import { processSendgridWebhook } from '../../integrations/workers/sendgridWebhookWorker'
import { integrationDataCheckerWorker } from './integration-data-checker/integrationDataCheckerWorker'
import { refreshSampleDataWorker } from './integration-data-checker/refreshSampleDataWorker'
import { mergeSuggestionsWorker } from './merge-suggestions/mergeSuggestionsWorker'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<any> {
  const { service, tenant } = event as any
  switch (service.toLowerCase()) {
    case 'stripe-webhooks':
      return processStripeWebhook(event)
    case 'sendgrid-webhooks':
      return processSendgridWebhook(event)

    case 'integration-data-checker':
      const integrationDataCheckerMessage = event as IntegrationDataCheckerMessage
      return integrationDataCheckerWorker(
        integrationDataCheckerMessage.integrationId,
        integrationDataCheckerMessage.tenantId,
      )
    case 'merge-suggestions':
      return mergeSuggestionsWorker(tenant)

    case 'refresh-sample-data':
      return refreshSampleDataWorker()

    case 'csv-export':
      const csvExportMessage = event as CsvExportMessage
      return csvExportWorker(
        csvExportMessage.entity,
        csvExportMessage.user,
        tenant,
        csvExportMessage.segmentIds,
        csvExportMessage.criteria,
      )

    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
