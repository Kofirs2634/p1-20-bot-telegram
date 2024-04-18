import { readFileSync, writeFileSync } from 'fs'

/**
 * Получает сцену пользователя
 * @param {number} id идентификатор пользователя
 * @returns идентификатор активной сцены
 */
export function get(id) {
  const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
  return user_scenes[id]
}
/**
 * Изменяет сцену пользователя
 * @param {number} id идентификатор пользователя
 * @param {string} scene идентификатор новой сцены
 */
export function set(id, scene) {
  const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
  user_scenes[id] = scene
  writeFileSync('./data/user_scenes.json', JSON.stringify(user_scenes), 'utf8')
}
/**
 * Подсчитывает количество активных пользователей
 * @returns количество активных пользователей
 */
export function count() {
  const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
  return Object.keys(user_scenes).length
}
