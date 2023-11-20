import axios, { AxiosRequestConfig } from 'axios'
import { handleDiscordError } from './errorHandler'
import { DiscordApiChannel } from '../types'
import { IProcessStreamContext } from '../../../types'
import { retryWrapper } from './handleRateLimit'

export const getChannel = async (
  channelId: string,
  token: string,
  ctx: IProcessStreamContext,
): Promise<DiscordApiChannel> => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `https://discord.com/api/v10/channels/${channelId}`,
    headers: {
      Authorization: token,
    },
  }

  return await retryWrapper(5, async () => {
    try {
      const response = await axios(config)
      return response.data
    } catch (err) {
      const newErr = handleDiscordError(err, config, { channelId }, ctx)
      if (newErr) {
        throw newErr
      }
    }
  })
}
