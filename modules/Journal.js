/**
 * @typedef User Объект данных пользователя на портале
 * @prop {number} id ID на портале
 * @prop {string} first_name Имя пользователя
 * @prop {string} last_name Фамилия пользователя
 * @prop {string} birthday Дата рождения в формате `YYYY-MM-DD`
 * @prop {string} group Обозначение группы, в которой обучается пользователь
 * @prop {string} avatar Ссылка на изображение аватара
 * @prop {number} rating Рейтинг на портале (от 0 до 100)
 */
/**
 * @typedef Subject Объект, описывающий учебный предмет для некой группы
 * @prop {[number,string]} subject Идентификатор и название предмета
 * @prop {[(number|null),string]} teacher Идентификатор и полное имя преподавателя
 * @prop {number} semester Номер семестра
 * @prop {string} group Обозначение группы
 * @prop {number} lesson_count Количество прошедших пар
 * @prop {Mark[]} marks Массив оценок всей группы
 */
/**
 * @typedef Mark Объект, описывающий одну оценку в журнале
 * @prop {string} date Дата выставления оценки в формате `DD.MM`
 * @prop {number} stud Идентификатор связанного студента
 * @prop {'audit'|'lecture'|'practice'|'unknown'|'attest'|'exam'} type Тип занятия
 * @prop {number|'Н'} mark Значение оценки. При пропуске занятия ставится `"Н"`
 */
/**
 * @typedef EditedMark Объект, описывающий измененную оценку в журнале (см. {@link compareMarks|`compareMarks`})
 * @prop {string} date Дата выставления оценки в формате `DD.MM`
 * @prop {number} stud Идентификатор связанного студента
 * @prop {'audit'|'lecture'|'practice'|'unknown'|'attest'|'exam'} type Тип занятия
 * @prop {{before:(number|'Н'),after:(number|'Н')}} mark Значение оценки до и после изменения. При пропуске занятия ставится `"Н"`
 */
/**
 * @typedef MarksComparison Объект с результатом сравнения оценок (см. {@link compareMarks|`compareMarks`})
 * @prop {Mark[]} added Новые оценки
 * @prop {Mark[]} removed Удаленные оценки
 * @prop {EditedMark[]} edited Измененные оценки
 */
/**
 * @typedef Schedule Объект с расписанием занятий
 * @prop {string} date Дата, на которую актуально расписание, в формате `DD.MM.YYYY`
 * @prop {(Lesson|Holiday)[]} lessons Список пар на данную дату
 */
/**
 * @typedef Lesson Объект с данными занятия в расписании
 * @prop {number} lesson Номер пары от начала дня (от 1 до 8)
 * @prop {string} time Время начала и конца пары *(не используется)*
 * @prop {string} subject Название предмета
 * @prop {string} teacher Фамилия и инициалы преподавателя
 * @prop {string} auditory Место и номер аудитории
 * @prop {string} note Примечание к занятию
 */
/**
 * @typedef Holiday Объект, описывающий праздничный день
 * @prop {'holiday'} type Тип события
 * @prop {string} name Название праздника
 */
/**
 * @typedef Absence Объект с данными о пропусках одного студента
 * @prop {number} id Идентификатор студента
 * @prop {number} percent Показатель посещаемости (в процентах)
 * @prop {[number,number]} totals Количество пропусков и общее число пар
 * @prop {number} place Место в групповом зачете по посещаемости (от 1)
 */
/**
 * @typedef News Объект, описывающий одну новостную запись
 * @prop {number} id Идентификатор поста
 * @prop {string} author Фамилия и инициалы автора поста
 * @prop {number} author_id Идентификатор автора поста
 * @prop {string} title Название поста
 * @prop {string} date Дата публикации поста в формате `DD.MM.YYYY`
 * @prop {number} views Количество просмотров
 * @prop {number} likes Количество отметок "Нравится"
 * @prop {number} comments Количество комментариев
 */
/**
 * Объект с дистанционными парами на один день
 * @typedef {{[subject:string]:ProvisionLesson[]}} Provision
 */
/**
 * @typedef ProvisionLesson Объект, содержащий данные об одной дистанционной паре
 * @prop {string} hash Уникальный идентификатор занятия
 * @prop {string} theme Тема занятия
 */
/**
 * @typedef Credentials Объект с данными для входа на портал
 * @prop {string} login Логин пользователя
 * @prop {string} password Пароль пользователя
 */
/**
 * @typedef Attachment Объект с данными файла
 * @prop {string} name Оригинальное название файла
 * @prop {string} type Формат (расширение) файла
 * @prop {string} hash Название файла в кеше
 * @prop {string|null} file_id Идентификатор файла в хранилище Telegram
 * @prop {number} cached_at Таймштамп занесения в кеш
 */

import { readFileSync, writeFileSync } from 'fs'
import fetch from 'node-fetch'
import parser from 'node-html-parser'
import * as Static from './Static.js'
import * as Util from './Util.js'

const CookieManager = {}
CookieManager.get = function(id) {
  const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
  return linked.find(f => f.tg == id).cookie
}
CookieManager.set = function(id, cookie) {
  const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
  linked.find(f => f.tg == id).cookie = cookie
  writeFileSync('./data/linked.json', JSON.stringify(linked), 'utf8')
}

/** Собственный ID на портале */
export const SELF_ID = parseInt(Util.getConfig('SELF_ID_UN'))

/** Главная кука для всех запросов */
export let COOKIE = null

/** Типы пар */
export const WORK_TYPES = {
  audit: ['занятие', '📝'],
  lecture: ['лекцию', '📚'],
  practice: ['практику', '🛠'],
  unknown: ['[неизвестно]', '❓'],
  attest: ['аттестацию', '🧮'],
  exam: ['экзамен', '💮']
}

/** Расшифровка оценок */
export const MARK_TYPES = {
  1: ['❤️', 'плохо'],
  2: ['🧡', 'неудовлетворительно'],
  3: ['💛', 'удовлетворительно'],
  4: ['💚', 'хорошо'],
  5: ['💙', 'отлично'],
  Н: ['🌚', 'неявка'],
  UNK: ['🖤', '?']
}

/**
 * Вычисляет семестр по году поступления
 * @param {number} first_year Год поступления
 * @returns Текущий семестр
 */
export function getSemester(first_year) {
  const today = new Date()
  let sem = (today.getUTCFullYear() - first_year) * 2
  if (today.getUTCMonth() >= 7) sem++
  if (sem > 7) sem = 7
  return sem
}

/**
 * Вычисляет текущий семестр по обозначению группы
 * @param {string} group Обозначение группы
 * @returns Текущий семестр
 */
export function getSemesterByGroup(group) {
  return getSemester(`20${group.match(/[а-я0-9]+-(\d+)/i)[1]}`)
}

/**
 * Шифрует логин и пароль пользователя от портала
 * @param {string} login Логин пользователя
 * @param {string} password Пароль пользователя
 * @returns {string} Зашифрованная строка ("секрет")
 */
export function encodeCredentials(login, password) {
  const key_buffer = Buffer.from(login)
  const pass_buffer = Buffer.from(password)
  const input = Buffer.concat([pass_buffer, key_buffer])
  const encoded = Buffer.from(input.map((m, n) => m ^ key_buffer.at(n % key_buffer.length)))
  const encoded_key = Buffer.from(key_buffer.map(m => m ^ 42))
  return encoded_key.reverse().toString('base64url') + '.' + encoded.toString('base64url')
}

/**
 * Дешифрует логин и пароль пользователя от портала
 * @param {string} secret Секрет логина и пароля
 * @returns {Credentials} Объект с логином и паролем
 */
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

/**
 * Проверяет состояние куки указанного пользователя и при необходимости сразу ее обновляет
 * @param {number} id Идентификатор пользователя в Telegram
 * @returns {Promise<boolean>} Промис, который резолвится в `false`, если кука жива, и в `true`, если она была успешно обновлена
 */
export function checkCookie(id) {
  return new Promise(async (res, rej) => {
    const user = JSON.parse(readFileSync('./data/linked.json', 'utf8')).find(f => f.tg === id)
    let cookie = CookieManager.get(id)
    const request = await fetch(Util.urlWithParams('https://ies.unitech-mo.ru/user', { userid: user.id }), {
      method: 'get',
      headers: { cookie }
    }).catch(err => Util.error(`Cookie check for ${id} was failed:`, err))
    if (!request) return rej('unavailable')
    if (request.status == 200) {
      Util.log(`${id}'s cookie is alive`)
      res(false)
      return
    }
    cookie = await doLogin(decodeCredentials(user.secret)).catch(err => Util.error('Failed to login in `checkCookie`:', err))
    if (!cookie) return rej('unavailable')
    Util.log(`Got new ${id}'s cookie:`, cookie)
    CookieManager.set(id, cookie)
    res(true)
  })
}

/**
 * Проверяет состояние главной куки (см. {@link COOKIE|`COOKIE`}) и при необходимости ее обновляет (см. {@link updateMasterCookie|`updateMasterCookie`})
 * @returns {Promise<string>} Промис, который резолвится в `"ok"`, если кука жива или ее возможно обновить
 */
export function checkMasterCookie() {
  return new Promise(async (res, rej) => {
    const cookie = CookieManager.get(Static.MASTER_ID)
    COOKIE = cookie
    const request = await fetch(Util.urlWithParams('https://ies.unitech-mo.ru/user', { userid: SELF_ID }), {
      method: 'get',
      headers: { cookie: COOKIE }
    }).catch(err => Util.error('Master cookie check was failed', err))
    if (!request) return rej('unavailable')

    if (request.status == 200) {
      Util.log('Master cookie is alive')
      res('ok')
      return
    }
    Util.log('Cookie is dead, trying to get the new one')
    await updateMasterCookie()
    res('ok')
  })
}

/**
 * Выполняет вход в портал
 * @param {Credentials} credentials Данные учетной записи пользователя
 * @returns {Promise<string>} Промис, который резолвится в куку пользователя
 */
export function doLogin(credentials) {
  return new Promise(async (res, rej) => {
    const request = await fetch('https://ies.unitech-mo.ru/auth', {
      method: 'post',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        login: credentials.login,
        pass: credentials.password,
        auth: 1,
        ajax: 1,
        stay_in_system: 1
      })
    }).catch(err => Util.error('Login to journal failed', err))
    if (request?.status != 200) {
      Util.error('Login to journal failed; status', request.status, request.statusText)
      rej('unavailable')
      return
    }
    const response = await request.json()
    if (typeof response.success === 'undefined') {
      Util.error('Login to journal failed; reason', response.error)
      rej('failed')
      return
    }
    const cookie = request.headers.get('set-cookie').match(/ft_sess_common=[a-z\d]+;/i)[0]
    res(cookie)
  })
}

/**
 * Производит выход из учетной записи на портале
 * @param {string} cookie Кука целевого пользователя
 * @returns {Promise<boolean>} Промис, который резолвится в `true`, если выход был успешен
 */
export function doLogout(cookie) {
  return new Promise(async (res, rej) => {
    const request = await fetch('https://ies.unitech-mo.ru/auth?action=logout', {
      method: 'get',
      headers: { cookie }
    }).catch(err => Util.error('Failed to logout from journal', err))
    if (!request || request?.status !== 200) {
      Util.error('Failed to logout from journal; status', request.status, request.statusText)
      rej('unavailable')
      return
    }
    const response = await request.text()
    const dom = parser.parse(response)
    const is_logout = dom.querySelector('.log_in_link') !== null
    res(is_logout)
  })
}

/**
 * Асинхронно обновляет главную куку (см. {@link checkMasterCookie|`checkMasterCookie`})
 */
export async function updateMasterCookie() {
  const credentials = {
    login: Util.getConfig('JOURNAL_LOGIN'),
    password: Util.getConfig('JOURNAL_PASSWORD')
  }
  const cookie = await doLogin(credentials).catch(err => console.error('Getting cookie failed:', err))
  if (!cookie) {
    Util.error('Getting cookie failed. Next try in 10 seconds')
    setTimeout(() => checkMasterCookie(), 10000)
    return
  }
  CookieManager.set(Static.MASTER_ID, cookie)
  COOKIE = cookie
  Util.log('Got new cookie:', cookie)
}

/**
 * Получает данные профиля пользователя на портале
 * @param {number} id ID пользователя
 * @returns {Promise<User>} Промис с данными пользователя
 */
export function getProfile(id) {
  function handleEntry(element) {
    return element.innerText.split(/\s*:\s+/)[1]
  }
  return new Promise(async (res, rej) => {
    const is_available = await checkMasterCookie().catch(err => Util.error('Failed to check cookie in `getProfile`:', err))
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

/**
 * Получает оценки указанной группы по данному предмету в данном семестре
 * @param {string} group Обозначение группы
 * @param {number} subject Идентификатор предмета
 * @param {number} semester Номер семестра
 * @returns {Promise<Subject>} Промис с данными по предмету
 */
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
/**
 * Сравнивает два массива оценок
 * @param {Mark[]} before Старый массив
 * @param {Mark[]} after Новый массив
 * @returns {MarksComparison} Объект с новыми, удаленными и измененными оценками
 */
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

/**
 * Получает расписание с точки зрения главной куки
 * @returns {Promise<Schedule>} Промис с расписанием
 */
export function getSchedule() {
  function parseNote(raw) {
    if (!raw) return ''
    const text = parser.parse(raw).innerText
    if (text.match(/дистанцион/i)) return 'Дистант'
    else if (text.match(/самостоятельн/i)) return 'Самостоятельное обучение'
    else if (text.match(/переносится|перенесено/)) return `Перенос в ауд. ${text.match(/([\d\/б]+)\s?$/i)?.[1]}`
    else if (text.match(/преподаватель/i) && text.match('в аудитории')) return `Заменяет ${text.match(/([а-яё]+\s(?:[а-яё]+\.\s?){1,2})\s/i)?.[1]} в ауд. ${text.match(/([\d\/б]+)\s?$/i)?.[1]}`
    else if (text.match(/преподаватель/i)) return `Заменяет ${text.match(/([а-яё]+\s([а-яё]+\.\s?){1,2})$/i)?.[1]}`
  }

  return new Promise(async (res, rej) => {
    const is_available = await checkMasterCookie().catch(err => Util.error('Failed to check cookie in `getSchedule`:', err))
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
      const description_raw = description.innerText
      const [, teacher, subject] = description_raw.match(/^([а-яё\s]+)\. ([а-яё\s]+)/i)
      const [, teacher_2] = description_raw.match(/материалы занятия\s/i)
        ? description_raw.match(/(?<=занятия\s)([а-яё\s]+)\./i)
        : [,]
      result.push({
        lesson: e.timenum,
        time: e.time,
        subject,
        teacher: [teacher, teacher_2].filter(f => f).map(Util.formatName).join(', '),
        auditory: description.querySelector('a')?.innerText,
        note: parseNote(e.note)
      })
    })
    res({ date, lessons: result })
  })
}
/**
 * Получает данные для отчета по пропускам
 * @param {string} group Обозначение группы
 * @param {number} semester Номер семестра
 * @returns {Absence[]} Массив отчетов, отсортированный по уменьшению посещаемости
 */
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
/**
 * Получает новости с главной страницы портала
 * @returns {Promise<News[]>} Промис с новостями
 */
export function getNews() {
  return new Promise(async (res, rej) => {
    const is_available = await checkMasterCookie().catch(err => Util.error('Failed to check cookie in `getNews`:', err))
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
/**
 * Получает список дистанционных пар на сегодня с точки зрения главной куки
 * @returns {Promise<Provision>} Промис со объектом пар "предмет - данные"
 */
export function getRemoteProvision() {
  return new Promise(async (res, rej) => {
    const is_available = await checkMasterCookie().catch(err => Util.error('Failed to check cookie in `getRemoteProvision`:', err))
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
      return rej('unavailable')
    }

    const dom = parser.parse(await request.text())
    const table = dom.querySelector('.teacherstufftable')
    const subjects = table.querySelectorAll('td:has(span)')
    const data = {}
    let expecting = subjects.length
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
      if (lessons.length === 0) return expecting--

      const name = lessons[0].subjtext
      if (!data[name]) data[name] = []
      data[name].push(...lessons.map(m => ({
        hash: m.code,
        theme: m.tname.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(code))
      })))
    })
    const waiting_timer = setInterval(() => {
      if (Object.keys(data).length !== expecting) return
      res(data)
      clearInterval(waiting_timer)
    }, 1000)
  })
}

/**
 * Скачивает приложенные в расписании файлы для указанной пары, если они есть
 * @param {number} subject Идентификатор предмета
 * @param {string} date Дата пары в формате `DD.MM.YYYY`
 * @param {number} lesson Номер пары (от 1)
 * @returns {Promise<Attachment[]>} Промис со списком скачанных файлов
 * @deprecated не используется
 */
export function downloadAttachments(subject, date, lesson) {
  return new Promise(async (res, rej) => {
    const is_available = await checkMasterCookie().catch(err => Util.error('Failed to check cookie in `downloadAttachments`:', err))
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

/**
 * Обходит дистанционные пары от лица указанного пользователя
 * @param {number} id Идентификатор пользователя в Telegram
 * @param {string[]} hashes Список хешей дистанционных пар (см. {@link getRemoteProvision|`getRemoteProvision`})
 * @returns {Promise<{hash:string,ok:boolean}[]>} Промис с массивом результатов обхода
 */
export function visitProvision(id, hashes) {
  return new Promise(async (res, rej) => {
    const cookie = CookieManager.get(id)
    const result = []
    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i]
      const request = await fetch(`https://ies.unitech-mo.ru/translation_show?edu=${hash}`, {
        method: 'get',
        headers: { cookie }
      }).catch(err => Util.error(`Failed to autovisit ${hash} as ${id}:`, err))
      if (!request || request?.status !== 200) {
        Util.error(`Failed to autovisit ${hash} as ${id}; status ${request.status} ${request.statusText}`)
        result.push({ hash, ok: false })
        continue
      }
      const response = await request.text()
      const dom = parser.parse(response)
      const header = dom.querySelector('.translation_content_wrp h2')
      const is_available = header === null
      if (!is_available) Util.error(`Failed to autovisit ${hash} as ${id}; blocked by system with message "${header.innerText}"`)
      result.push({ hash, ok: is_available })
    }
    res(result)
  })
}
