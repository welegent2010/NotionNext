import fs from 'fs'

const path = require('path')
// 文件缓存持续10秒
const cacheInvalidSeconds = 1000000000 * 1000
// 文件名
const jsonFile = path.resolve('./data.json')

export function getCache(key) {
  const exist = fs.existsSync(jsonFile)
  if (!exist) return null
  const data = fs.readFileSync(jsonFile)
  let json = null
  if (!data) return null
  try {
    json = JSON.parse(data)
  } catch (error) {
    console.error('读取JSON缓存文件失败', data)
    return null
  }
  // 缓存超过有效期就作废
  const cacheValidTime = new Date(
    parseInt(json[key + '_expire_time']) + cacheInvalidSeconds
  )
  const currentTime = new Date()
  if (!cacheValidTime || cacheValidTime < currentTime) {
    return null
  }
  return json[key]
}

/**
 * 并发请求写文件异常； Vercel生产环境不支持写文件。
 * @param key
 * @param data
 * @returns {Promise<null>}
 */
export function setCache(key, data) {
  // Vercel生产环境文件系统是只读的，跳过文件缓存
  if (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production') {
    console.log('[Cache] Skipping file cache in Vercel production environment')
    return
  }
  try {
    const exist = fs.existsSync(jsonFile)
    const json = exist ? JSON.parse(fs.readFileSync(jsonFile)) : {}
    json[key] = data
    json[key + '_expire_time'] = new Date().getTime()
    fs.writeFileSync(jsonFile, JSON.stringify(json))
  } catch (error) {
    console.warn('[Cache] Unable to write cache file:', error.message)
  }
}

export function delCache(key) {
  // Vercel生产环境文件系统是只读的，跳过文件缓存
  if (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production') {
    return
  }
  try {
    const exist = fs.existsSync(jsonFile)
    const json = exist ? JSON.parse(fs.readFileSync(jsonFile)) : {}
    delete json.key
    json[key + '_expire_time'] = new Date().getTime()
    fs.writeFileSync(jsonFile, JSON.stringify(json))
  } catch (error) {
    console.warn('[Cache] Unable to delete cache:', error.message)
  }
}

/**
 * 清理缓存
 */
export function cleanCache() {
  // Vercel生产环境文件系统是只读的，跳过文件缓存
  if (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production') {
    return
  }
  try {
    const json = {}
    fs.writeFileSync(jsonFile, JSON.stringify(json))
  } catch (error) {
    console.warn('[Cache] Unable to clean cache:', error.message)
  }
}

export default { getCache, setCache, delCache }
