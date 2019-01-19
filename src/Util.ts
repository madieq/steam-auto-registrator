export default class Util {
    static sleep(ms: number) { return new Promise((resolve) => { setTimeout(() => { resolve() }, ms) }) }
}