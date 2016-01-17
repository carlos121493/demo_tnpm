define(function(require, exports, module){
  var Ceshi = {
    warn:function(){
      alert(require('ceshib').warn || 'helloworld');
    },
    init:function(){
      this.warn();
    }
  }

  module.exports = Ceshi;
});
