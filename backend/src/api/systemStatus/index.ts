import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/system-status`, safeWrap(require('./systemStatus').default))
  app.get(`/health`, safeWrap(require('./health').default))
}
