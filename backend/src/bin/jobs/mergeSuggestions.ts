import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { timeout } from '../../utils/timing'

const job: CrowdJob = {
  name: 'Merge suggestions',
  // every hour
  // cronTime: '0 * * * *',
  // every 10 minutes
  cronTime: '*/10 * * * *',
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})
    for (const tenant of tenants.rows) {
      await sendNodeWorkerMessage(tenant.id, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        tenant: tenant.id,
        service: 'merge-suggestions',
      } as NodeWorkerMessageBase)

      // Wait 1 second between messages to potentially reduce spike load on cube between each tenant runs
      await timeout(1000)
    }
  },
}

export default job
