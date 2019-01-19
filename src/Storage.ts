import {BrowserWindow} from 'electron'

export default class Storage {
    private static instance: Storage
    private constructor() { }
    static getInstance() {
        if (!this.instance) this.instance = new Storage()
        return this.instance
    }

    // window: BrowserWindow | null = null
}