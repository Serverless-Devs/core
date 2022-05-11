import { WriteStream } from 'fs-extra';
class Store {
  createWriteStreamInstacne: WriteStream;
  setCreateWriteStreamInstacne(val: WriteStream) {
    this.createWriteStreamInstacne = val;
  }
}

export default new Store();
