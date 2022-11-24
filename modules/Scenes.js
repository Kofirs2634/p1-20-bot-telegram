import { readFileSync, writeFileSync } from 'fs'

export function get(id) {
    const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
    return user_scenes[id]
}
export function set(id, scene) {
    const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
    user_scenes[id] = scene
    writeFileSync('./data/user_scenes.json', JSON.stringify(user_scenes), 'utf8')
}
export function count() {
    const user_scenes = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
    return Object.keys(user_scenes).length
}

export default {
    get,
    set,
    count
}