import axios from 'axios'
import cheerio from 'cheerio'
import url from 'url'
import querystring from 'querystring'
import randomstring from 'randomstring'
import Config from './Config';
import md5 from 'md5'
import Util from './Util';

export default class SteamRegistrator {
    STEAM_HEADERS = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
        // 'Connection': 'keep-alive'
    }

    constructor(domainMail: string[]) {
        let domain = '';
        if (domainMail.length > 0)
            domain = domainMail[Math.round(Math.random() * (domainMail.length - 1))].trim()
        this.user = {
            captchagid: '',
            captcha_text: '',
            mail: `${randomstring.generate(Config.MAIL_LENGTH).toLowerCase()}@${domain}`,
            count: 0,
            createsessionid: '',
            login: `${randomstring.generate(Config.LOGIN_LENGTH).toLowerCase()}`,
            password: `${randomstring.generate(Config.PASSWORD_LENGTH)}`,
            srcImg: '',
            domainMail: domainMail
        }
    }

    user = {
        captchagid: '',
        captcha_text: '',
        mail: '',
        count: 0,
        createsessionid: '',
        login: '',
        password: '',
        srcImg: '',
        domainMail: ['']
    }

    async waitCaptcha() {
        let pageRaw = (await axios.get('https://store.steampowered.com/join/')).data
        let $ = cheerio.load(pageRaw)
        let srcImg = $('#captchaImg').attr('src')
        this.user.srcImg = srcImg
        let captchaUrl = url.parse(srcImg)
        if (captchaUrl && captchaUrl.query)
            this.user.captchagid = captchaUrl.query.split('=')[1]

        return this
    }

    setCaptchaText(captcha: string) {
        captcha = captcha ? captcha.toUpperCase() : ''
        if (captcha.match(/.{6}/)) {
            this.user.captcha_text = captcha
            return true
        } else { return false }
    }

    async checkCaptcha() {
        let data = {
            captchagid: this.user.captchagid,
            captcha_text: this.user.captcha_text,
            email: this.user.mail,
            count: this.user.count
        }

        let qs_ = querystring.stringify(data)
        let verifyCaptchaResult = await axios.post('https://store.steampowered.com/join/verifycaptcha/', qs_, {
            headers: this.STEAM_HEADERS
        })

        if (verifyCaptchaResult.data.bCaptchaMatches === false) {
            console.log(verifyCaptchaResult)
            throw 'Captcha invalid'
        }
        else if (verifyCaptchaResult.data.bEmailAvail === false)
            throw 'email not avail'

        let t = {
            captchagid: this.user.captchagid,
            captcha_text: this.user.captcha_text,
            email: this.user.mail
        }
        qs_ = querystring.stringify(t)
        let result = await axios.post('https://store.steampowered.com/join/ajaxverifyemail', qs_, {
            headers: this.STEAM_HEADERS
        })

        if (result.data.success !== 1) {
            // console.log(r)
            throw 'email not avail\n' + result.data.details
        }
        this.user.createsessionid = result.data.sessionid
    }

    async approveMail() {
        await Util.sleep(2000)
        let mails: any = (await axios.get('http://movierate.info/api/getMails/' + md5(this.user.mail), { headers: { 'x-api-key': Config.TEMP_MAIL_KEY } })).data
        let steamLink: string;
        if (!mails.isError && mails.data.length > 0) {
            let match = /https:\/\/[^\r\n]+/.exec(mails.data[mails.data.length - 1].text)
            if (match)
                steamLink = match[0]
            else
                throw 'api mail match error'
        } else {
            throw 'api mail error'
        }

        // console.log(mails)
        await axios.get(steamLink)

        let tt = {
            accountname: this.user.login,
            password: this.user.password,
            count: 3,
            lt: 0,
            creation_sessionid: this.user.createsessionid
        }
        let qs_ = querystring.stringify(tt)
        let result = await axios.post('https://store.steampowered.com/join/createaccount/', qs_, {
            headers: this.STEAM_HEADERS
        })

        if (result.data.bSuccess) {
            console.log(this.user.mail + ' registration succeed')
            return true
        }
        else
            throw 'err registration'
    }


}

/*


function registerNewUser(user) {
    return new Promise((resolve, reject) => {
        console.log('registration ' + user.login + ' start...')
        let imageName = ''
        axios.get('https://store.steampowered.com/join/')
            .then(r => {
                // return fs.writeFile('out.html', r.data)
                let $ = cheerio.load(r.data)
                let s = $('#captchaImg').attr('src')
                let captchaUrl = url.parse(s)
                user.captchagid = captchaUrl.query.split('=')[1]
                imageName = user.captchagid + '.png'
                return axios.get(s, { responseType: 'arraybuffer' })
            })
            .then(r => {
                return fs.writeFile(CAPTCHA_FOLDER + '/' + imageName, r.data, 'binary',
                    e => {
                        if (e)
                            throw e
                    })
            })
            .then(r => {
                return consoleWait('write captcha from image ' + imageName + ':')
            })
            .then(r => {
                user.captcha_text = r
                let data = {
                    captchagid: user.captchagid,
                    captcha_text: user.captcha_text,
                    email: user.mail,
                    count: user.count
                }
                let qs_ = querystring.stringify(data)
                return axios.post('https://store.steampowered.com/join/verifycaptcha/', qs_, {
                    headers: STEAM_HEADERS
                })
            })
            .then(r => {
                if (r.data.bCaptchaMatches === false)
                    throw 'Captcha invalid'
                else if (r.data.bEmailAvail === false)
                    throw 'email not avail'
                else
                    return true
            })
            .then(r => {
                let data = {
                    captchagid: user.captchagid,
                    captcha_text: user.captcha_text,
                    email: user.mail
                }
                let qs_ = querystring.stringify(data)
                return axios.post('https://store.steampowered.com/join/ajaxverifyemail', qs_, {
                    headers: STEAM_HEADERS
                })
            })
            .then(r => {
                if (r.data.success !== 1) {
                    // console.log(r)
                    throw 'email not avail\n' + r.data.details
                }
                user.createsessionid = r.data.sessionid
                return true
            })
            .then(r => {
                return waitPostMail()
            })
            .then(r => {
                let item = null
                if (Array.isArray(r))
                    item = r[r.length - 1]['mail_text_only']
                else
                    throw 'err mail no get'

                let $ = cheerio.load(item)
                let steamUrl = $('tbody>tr>td>a').attr('href')
                return axios.get(steamUrl)
            })
            .then(r => {
                let data = {
                    accountname: user.login,
                    password: user.password,
                    count: 3,
                    lt: 0,
                    creation_sessionid: user.createsessionid
                }
                let qs_ = querystring.stringify(data)
                return axios.post('https://store.steampowered.com/join/createaccount/', qs_, {
                    headers: STEAM_HEADERS
                })
            })
            .then(r => {
                if (r.data.bSuccess) {
                    console.log(user.mail + ' registration succeed')
                    resolve()
                }
                else
                    throw 'err registration'
            })
            .catch(e => {
                console.log('login:' + user.login + ' pass:' + user.password)
                reject(e)
            })
        //https://store.steampowered.com/join/completesignup?redir=%3Fl%3Drussian&creationid=268360830877304032
    })
}
function downloadCaptcha(downloadFolder) {
    return new Promise((resolve, reject) => {
        let imageName = ''
        axios.get('https://store.steampowered.com/join/')
            .then(r => {
                let $ = cheerio.load(r.data)
                let s = $('#captchaImg').attr('src')
                let captchaUrl = url.parse(s)
                imageName = captchaUrl.query.split('=')[1] + '.png'
                return axios.get(s, { responseType: 'arraybuffer' })
            })
            .then(r => {
                return fs.writeFile(downloadFolder + '/' + imageName, r.data, 'binary',
                    e => {
                        if (e) throw e
                        else resolve(1)
                    })
            })
            .catch(e => { reject(e) })
    })
}
*/