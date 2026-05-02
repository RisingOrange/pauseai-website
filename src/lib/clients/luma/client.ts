import axios from 'axios'
import axiosRetry from 'axios-retry'
import snakecaseKeys from 'snakecase-keys'

const BASE_URL = 'https://api.lu.ma/'

const client = axios.create({
	baseURL: BASE_URL
})

axiosRetry(client, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
	retryCondition: (error) => {
		return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429
	}
})

client.interceptors.request.use((request) => {
	request.params = snakecaseKeys(request.params)
	return request
})

export default client
