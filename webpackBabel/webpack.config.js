module.exports = {
  entry:{
    main:'./app/entry.js'
  },
  output:{
    path:'./dist',
    filename:'[name].js'
  },
  module:{
    loaders:[{
      test:/\.js$/,
      loaders:['babel']
    },{
      test:/\.css$/,
      loader:'style!css'
    }]
  }
}
