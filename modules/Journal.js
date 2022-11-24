import { readFileSync, writeFileSync } from 'fs'
import fetch from 'node-fetch'
import parser from 'node-html-parser'
import Util from './Util.js'

export const SELF_ID = '[УДАЛЕНО]'
export let COOKIE = null
export const WORK_TYPES = {
    audit: ['занятие', '📝'],
    lecture: ['лекцию', '📚'],
    practice: ['практику', '🛠'],
    unknown: ['[неизвестно]', '❓'],
    attest: ['аттестацию', '🧮'],
    exam: ['экзамен', '💮']
}
export const MARK_TYPES = {
    1: ['❤️', 'плохо'],
    2: ['🧡', 'неудовлетворительно'],
    3: ['💛', 'удовлетворительно'],
    4: ['💚', 'хорошо'],
    5: ['💙', 'отлично'],
    Н: ['🌚', 'неявка'],
    UNK: ['🖤', '?']
}

export function getSemester(first_year) {
    const today = new Date()
    let sem = (today.getUTCFullYear() - first_year) * 2
    if (today.getUTCMonth() >= 7) sem++
    return sem
}
export function getSemesterByGroup(group) {
    return getSemester(`20${group.match(/[а-я0-9]+-(\d+)/i)[1]}`)
}
export function encodeCredentials(login, password) {
    const key_buffer = Buffer.from(login)
    const pass_buffer = Buffer.from(password)
    const input = Buffer.concat([pass_buffer, key_buffer])
    const encoded = Buffer.from(input.map((m, n) => m ^ key_buffer.at(n % key_buffer.length)))
    const encoded_key = Buffer.from(key_buffer.map(m => m ^ 42))
    return encoded_key.reverse().toString('base64url') + '.' + encoded.toString('base64url')
}
export function decodeCredentials(secret) {
    const [key, encd] = secret.split('.')
    const encoded_key = Buffer.from(key, 'base64url').reverse()
    const key_buffer = Buffer.from(encoded_key.map(m => m ^ 42))
    const decoded = Buffer.from(encd, 'base64url')
    const output = Buffer.from(decoded.map((m, n) => m ^ key_buffer.at(n % key_buffer.length)))
    return {
        login: key_buffer.toString('utf8'),
        password: output.subarray(0, -key_buffer.length).toString('utf8')
    }
}
export function checkCookie() {
    return new Promise(async (res, rej) => {
        const cookie = readFileSync('./data/cookie.txt', 'utf8')
        COOKIE = cookie
        const request = await fetch(Util.urlWithParams('https://ies.unitech-mo.ru/user', { userid: SELF_ID }), {
            method: 'get',
            headers: { cookie: COOKIE }
        }).catch(err => Util.error('Cookie check was failed', err))
        if (!request) return rej('unavailable')

        if (request.status == 200) {
            Util.log('Cookie is alive')
            res('ok')
            return
        }
        Util.log('Cookie is dead, trying to get the new one')
        await updateCookie()
        res('ok')
    })
}
export async function updateCookie() {
    const request = await fetch('https://ies.unitech-mo.ru/auth', {
        method: 'post',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            login: '[УДАЛЕНО]',
            pass: '[УДАЛЕНО]',
            auth: 1,
            ajax: 1
        })
    }).catch(err => Util.error('Login to journal failed', err))
    if (request?.status != 200) {
        Util.error('Login to journal failed; status', request.status, request.statusText, 'Next try in 10 seconds')
        setTimeout(() => checkCookie(), 10000)
        return
    }
    const cookie = request.headers.get('set-cookie').match(/ft_sess_common=[a-z\d]+;/i)[0]
    COOKIE = cookie
    Util.log('Got new cookie:', cookie)
    writeFileSync('./data/cookie.txt', cookie)
}
export function getProfile(id) {
    function handleEntry(element) {
        return element.innerText.split(/\s*:\s+/)[1]
    }
    return new Promise(async (res, rej) => {
        const is_available = await checkCookie().catch(err => Util.error('Failed to check cookie in `getProfile`:', err))
        if (!is_available) return rej('not available')

        const request_main = await fetch(Util.urlWithParams('https://ies.unitech-mo.ru/user', { userid: id }), {
            method: 'get',
            headers: {
                cookie: COOKIE
            }
        }).catch(err => Util.error('Profile request in `getProfile` failed:', err))
        const request_rating = await fetch('https://ies.unitech-mo.ru/get_user_rating', {
            method: 'post',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ rating_user: id, get_only_final_rating: 1 })
        }).catch(err => Util.error('Rating request in `getProfile` failed:', err))

        if (!request_main || !request_rating) return rej('unavailable')
        if (request_main.status != 200 || request_rating.status != 200) {
            Util.error('Failed to `getProfile`; status', request_main.status, request_rating.status)
            rej('Failed to load profile')
            return
        }

        const page = await request_main.text()
        const rating = await request_rating.text()
        const dom = parser.parse(page)
        const self_info = dom.querySelectorAll('.userpage_block_wrap:nth-child(1) > .info')
        const corp_info = dom.querySelectorAll('.userpage_block_wrap:nth-child(2) > .info')
        const avatar = dom.querySelector('.user_rating .users_avatar_wrap').getAttribute('style').match(/url\(([a-z0-9_/.]+)\)/i)[1]
        const data = {
            id: parseInt(id),
            first_name: handleEntry(self_info[1]),
            last_name: handleEntry(self_info[0]),
            birthday: handleEntry(self_info[3]).slice(0, 10).split('.').reverse().join('-'),
            group: handleEntry(corp_info[3]),
            avatar,
            rating: parseFloat(rating)
        }
        res(data)
    })
}
export function getMarks(group, subject, semester) {
    const cell_types = ['audit', 'lecture', 'practice', 'unknown', 'attest', 'exam']
    return new Promise(async (res, rej) => {
        const request = await fetch(Util.urlWithParams('https://ies.unitech-mo.ru/journal', { group, subj: subject, sem: semester }), {
            method: 'get',
            headers: {
                cookie: COOKIE
            }
        }).catch(err => Util.error('Journal request in `getMarks` failed:', err))
        if (!request) return rej('unavailable')
        if (request.status != 200) {
            Util.error('Journal request in `getMarks` failed; status', request.status, request.statusText)
            rej('unavailable')
            return
        }

        const page = await request.text()
        const dom = parser.parse(page)
        const table = dom.querySelector('.journal_scores_wrp > .fl_left')
        const header = table.querySelectorAll('thead th')
        const title = dom.querySelector('.journal_title')
        const teacher = title.querySelector('a')
        const data = {
            subject: [subject, Util.trim(title.querySelectorAll('strong')[1].innerText)],
            teacher: [Number(teacher?.getAttribute('href')?.match(/\d+$/)[0]), Util.trim(teacher?.innerText || '')],
            semester, group,
            lesson_count: header.slice(1, -5).map(m => m.querySelector('a').innerText).filter(f => f.match(/\d{2}\.\d{2}/)).length,
            marks: []
        }
        table.querySelectorAll('tbody tr').forEach(row => {
            const stud = row.querySelector('td:first-child a')
            const cells = row.querySelectorAll('td')
            cells.forEach((cell, n) => {
                if (n == 0 || n >= cells.length - 5) return
                const mark = Util.trim(cell.innerText)
                if (mark == '') return
                const type = cell_types[cell.classNames.match(/journal_ltype_(\d)/)[1]]
                const obj = {
                    date: Util.trim(header[n].querySelector('a').innerText),
                    stud: Number(stud?.getAttribute('href')?.match(/\((\d+),/)?.[1]) || SELF_ID,
                    type,
                    mark: isNaN(Number(mark)) ? mark : Number(mark)
                }
                data.marks.push(obj)
            })
        })
        res(data)
    })
}
export function compareMarks(before, after) {
    let removed = before.filter(fl => !after.find(fi => Util.objEqual(fl, fi)))
    let added = after.filter(fl => !before.find(fi => Util.objEqual(fl, fi)))
    const edited = []
    const iterator = removed.slice()
    iterator.forEach(fl => {
        const added_index = added.findIndex(fi => fl.date == fi.date && fl.stud == fi.stud && fl.type == fi.type)
        const removed_index = removed.findIndex(fi => fl.date == fi.date && fl.stud == fi.stud && fl.type == fi.type)
        const entry = added[added_index]
        if (entry) {
            edited.push({
                date: entry.date,
                stud: entry.stud,
                type: entry.type,
                mark: { before: fl.mark, after: entry.mark }
            })
            added.splice(added_index, 1)
            removed.splice(removed_index, 1)
        }
    })
    return { removed, added, edited }
}
export function getSchedule() {
    function parseNote(raw) {
        if (!raw) return ''
        const text = parser.parse(raw).innerText
        if (text.match('дистанционном')) return 'Дистант'
        else if (text.match('переносится')) return `Перенос в ауд. ${text.match(/([\d\/б]+)\s?$/)?.[1]}`
	else if (text.match('преподаватель') && text.match('в аудитории')) return `Заменяет ${text.match(/([а-яё]+\s(?:[а-яё]+\.\s?){1,2})\s/i)?.[1]} в ауд. ${text.match(/([\d\/б]+)\s?$/)?.[1]}`
	else if (text.match('преподаватель')) return `Заменяет ${text.match(/([а-яё]+\s([а-яё]+\.\s?){1,2})$/i)?.[1]}`
    }

    return new Promise(async (res, rej) => {
        const is_available = await checkCookie().catch(err => Util.error('Failed to check cookie in `getSchedule`:', err))
        if (!is_available) return rej('not available')

        const hour = new Date().getHours()
        const target = hour >= 0 && hour < 15 // до 3 часов дня постим сегодняшнее расписание, после - завтрашнее
            ? new Date()
            : new Date(Date.now() + 86.4e6)
        const date = target.toLocaleString('ru').slice(0, 10)
        const params = target.getDay() === 1 ? `?d=${date}` : ''

        const request = await fetch(`https://ies.unitech-mo.ru/schedule${params}`, {
            method: 'post',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: COOKIE
            },
            body: new URLSearchParams({ load: 1 })
        }).catch(err => Util.error('Failed to get schedule in `getSchedule`:', err))
        if (!request || request?.status != 200) {
            Util.error('Failed to get schedule in `getSchedule`; status', request?.status, request?.statusText)
            rej('unavailable')
            return
        }

        const data = await request.json()
        const result = []
        data.filter(f => f.daynum == target.getDay()).forEach(e => {
            if (e.data_type == 'holiday' && !result.find(f => f.type != 'holiday'))
                return result.push({
                    type: 'holiday',
                    name: e.note
                })
    
            const description = parser.parse(e.lparam)
            const [, teacher, subject] = description.innerText.match(/^([а-яё\s]+)\. ([а-яё\s]+)/i)
	    result.push({
                lesson: e.timenum,
                time: e.time,
                subject,
                teacher: Util.formatName(teacher),
                auditory: description.querySelector('a')?.innerText,
                note: parseNote(e.note)
            })
        })
        res({ date, lessons: result })
    })
}
export function getAbsences(group, semester) {
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const marks = JSON.parse(readFileSync('./data/marks.json', 'utf8'))
    const data = []
    linked.forEach(s => {
        const totals = [0, 0]
        marks[group][semester].forEach(e => {
            const misses = e.marks.filter(f => f.stud == s.id && f.mark == 'Н').length
            totals[0] += misses
            totals[1] += e.lesson_count
        })
        data.push({
            id: s.id,
            percent: 100 - totals[0] / totals[1] * 100,
            totals
        })
    })
    data.sort((a, b) => b.percent - a.percent)
    const rating = data.map(m => m.percent)
    for (let i = 1; i < rating.length; i++) {
        if (rating[i - 1] == rating[i]) {
            rating.splice(i, 1)
            i--
        }
    }
    data.forEach(e => {
        e.place = rating.findIndex(f => f == e.percent) + 1
    })
    return data
}
export function getNews() {
    return new Promise(async (res, rej) => {
        const is_available = await checkCookie().catch(err => Util.error('Failed to check cookie in `getNews`:', err))
        if (!is_available) return rej('not available')

        const request = await fetch('https://ies.unitech-mo.ru/posts', {
            method: 'post',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: COOKIE
            },
            body: new URLSearchParams({
                dynamic: 1,
                offset: 0,
                limit: 5
            })
        }).catch(err => Util.error('Failed to load the feed in `getNews`:', err))
        if (!request || request?.status != 200) {
            Util.error('Failed to load the feed in `getSchedule`; status', request?.status, request?.statusText)
            rej('unavailable')
            return
        }
        const data = await request.json()
        const posts = data.map(m => ({
            id: m.id,
            author: Util.formatName(m.ofio),
            author_id: m.powner,
            title: Util.trim(m.title) || '_без названия_',
            date: m.date,
            views: m.p_views,
            likes: m.p_likes,
            comments: m.num_comments
        }))
        res(posts)
    })
}
export function getRemoteProvision() {
    return new Promise(async (res, rej) => {
        const is_available = await checkCookie().catch(err => Util.error('Failed to check cookie in `getNews`:', err))
        if (!is_available) return rej('not available')

        const today = new Date().toLocaleString('ru').slice(0, 10)
        const group = 'П1-20'
        const semester = getSemesterByGroup(group)
        const request = await fetch(`https://ies.unitech-mo.ru/remote_provision?st_semester=${semester}`, {
            method: 'get',
            headers: { cookie: COOKIE }
        }).catch(err => Util.error('Failed to load subjects in `getRemoteProvision`:', err))
        if (!request || request?.status != 200) {
            Util.error('Failed to load the feed in `getSchedule`; status', request?.status, request?.statusText)
            rej('unavailable')
            return
        }

        const dom = parser.parse(await request.text())
        const table = dom.querySelector('.teacherstufftable')
        const subjects = table.querySelectorAll('td:has(span)')
        const data = {}
        subjects.forEach(async cell => {
            const id = cell.querySelector('a').getAttribute('onclick').split(',')[1].slice(1)
            const request = await fetch('https://ies.unitech-mo.ru/remote_provision', {
                method: 'post',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    cookie: COOKIE
                },
                body: new URLSearchParams({
                    getLessons: 1,
                    sem: semester,
                    group,
                    subj: id
                })
            })
            const lessons = (await request.json()).filter(f => f.realtime == today)
            const name = lessons[0].subjtext
            if (!data[name]) data[name] = []
            data[name].push(...lessons.map(m => ({
                hash: m.code,
                theme: m.tname.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(code))
            })))
        })
        const waiting_timer = setInterval(() => {
            if (Object.keys(data).length !== subjects.length) return
            res(data)
            clearInterval(waiting_timer)
        }, 1000)
    })
}
export function downloadAttachments(subject, date, lesson) {
    return new Promise(async (res, rej) => {
        const is_available = await checkCookie().catch(err => Util.error('Failed to check cookie in `downloadAttachments`:', err))
        if (!is_available) return rej('not available')

        const request = await fetch('https://ies.unitech-mo.ru/schedule', {
            method: 'post',
            headers: {
                cookie: COOKIE,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                load_materials: 1,
                subj: subject,
                date,
                time: lesson
            })
        }).catch(err => Util.error('Failed to load subjects in `downloadAttachments`:', err))
        if (!request || request?.status !== 200) {
            Util.error('Failed to load the feed in `downloadAttachments`; status', request?.status, request?.statusText)
            rej('unavailable')
            return
        }
        const data = await request.json()
        const files = JSON.parse(data.map(m => m.files))
        const cache = JSON.parse(readFileSync('./data/files.json', 'utf8'))
        const result = []
        let done = 0
        files.forEach(async e => {
            if (cache.find(f => f.name == e.name)) return done++
            const download = await fetch('https://ies.unitech-mo.ru' + e.path, {
                method: 'get',
                headers: { cookie: COOKIE }
            })
            const buffer = await download.arrayBuffer()
            const type = e.name.match(/\.(\w+)$/i)?.[1]
            const hash = makeHash()
            writeFileSync(`./files/${hash}.${type}`, Buffer.from(buffer), 'binary')
            const obj = {
                name: e.name,
                type,
                hash,
                file_id: null,
                cached_at: Date.now()
            }
            result.push(obj)
            done++
            console.log(`Downloaded ${e.name} and saved to ${hash}.${type}`)
        })
        const waiting_timer = setInterval(() => {
            if (done !== files.length) return
            clearInterval(waiting_timer)
            writeFileSync('./data/files.json', JSON.stringify([...cache, ...result]), 'utf8')
            res(result)
        })
    })
}

export default {
    SELF_ID,
    COOKIE,
    WORK_TYPES,
    MARK_TYPES,
    getSemester,
    getSemesterByGroup,
    encodeCredentials,
    decodeCredentials,
    checkCookie,
    updateCookie,
    getProfile,
    getMarks,
    compareMarks,
    getSchedule,
    getAbsences,
    getNews,
    getRemoteProvision,
    downloadAttachments
}
