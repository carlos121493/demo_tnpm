import './ceshib';

const Ceshi = {
  warn(){
    alert(require('./ceshib').warn || 'helloworld');
  },
  init(){
    this.warn();
  }
}
export default Ceshi;

