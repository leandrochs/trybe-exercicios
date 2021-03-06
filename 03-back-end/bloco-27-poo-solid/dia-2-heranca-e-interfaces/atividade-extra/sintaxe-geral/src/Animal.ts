export default class Animal {
  constructor(public name: string, private birthDate: Date) {}

  get age() {
    const timeDiff = Math.abs(Date.now() - new Date(this.birthDate).getTime());

    return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
  }
}
