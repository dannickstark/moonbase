//We are using Heroku

//require express
const express = require('express');
const app = express();

//require fs for File System
const fs = require('fs');

//require path for path resolution
const path = require("path");

// Port for connection
const PORT = process.env.PORT || 3000;

//require some utility funtion for server action
let utils = require('./moonBase/utils');

app.get('/', (eq, res) => {
    res.send('Hi0');
});

let server = app.listen(PORT);
console.log('Server started on: ', PORT);

const io = require('socket.io')(server);

io.on('connect', (socket) => {
    console.log('New User!');
    
    socket.on('connectToDB', function(uuid, mp){
      let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');
      
      let data = fs.readFileSync(pth, 'utf8');
      data = JSON.parse(data);

      if(data.secretKey == mp){
        socket.join(uuid);
        console.log('New User connected!');
        io.in(uuid).emit('connected', data);
      } else {      
        console.log('New User not allowed!');
        io.in(uuid).emit('connected', null);
      }
    });
    
    // Event to get pushSignal from user---------------------------------------------------------------------
    socket.on('pushDataBase', function(data){
      pth = path.resolve(__dirname, './dataBases/' + data.uuid + '/dataBase.mb');

      fs.writeFileSync(pth, JSON.stringify(data, null, 2));
        
      io.in(data.uuid).emit('getSelection', data);
    });
    
    
    // Event to get pullSignal from user-----------------------------------------------------------------------
    socket.on('pullDataBase', function(uuid){
      let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');
      
      let data = fs.readFileSync(pth, 'utf8');
      
      io.in(uuid).emit('pullDataBase', data);
      console.log(data.name + ' was pulled successfully!');
    });
    
    
    /**--------------------------------------------------------------------------------------------------------
     * {
     *  select: "tableName",
     *  where: {
     *    age: '<5'
     *  },
     *  limit: 10,
     *  orderBy: 'index'
     * }
     */
    socket.on('select', function(query, uuid, mp){
      let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

      let data = fs.readFileSync(pth, 'utf8'); 

      let db = JSON.parse(data);

      if(db.secretKey != mp)
        return;

      let datas = db.datas;
      let where = query.where;
      let kayList = utils.getKeyArray(where);


      if(query.select !== undefined){
        if(query.select !== "*"){
          datas = datas.filter( (e) => {return e.name == query.select});            
        }
      } else {
        return ({});
      }

      datas = datas[0].rowList;

      if(where !== undefined){
          for(let i = 0; i < kayList.length; i++){
            let currentKay = kayList[i]
            datas = datas.filter( (e) => {
              let funk = ( new Function('e', "return e."+ currentKay + where[currentKay])) ;
              return funk(e);
            });              
          }
      }

      if(query.limit !== undefined){
        let collector = []
        for(let k=0; (k<query.limit & k<datas.length); k++){
          collector.push(datas[k]);
        }
        datas = collector;
      }

      if(query.orderBy !== undefined){
        datas.sort((a, b) => utils.order(a, b, query.orderBy, query.descendent))
      }

      io.in(uuid).emit('getSelection', datas);
    });
    

    /**-------------------------------------------------------------------------------------------------------------
     * {
     *  insert: {},
     *  into: "TabelName",
     * }
     */
    socket.on('insert', function(query, uuid, mp){
      if(query.insert !== undefined & query.into !== undefined & uuid !== undefined){
        let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        let data = fs.readFileSync(pth, 'utf8');
  
        let db = JSON.parse(data);

        if(db.secretKey != mp)
          return;

        let datas = db.datas;

        for(let i=0; i < datas.length; i++){
          if(query.into == datas[i].name){
            let colList = datas[i].colList;
            let toPush = {};

            for(let j=0; j<colList.length; j++){
              let current = query.insert[colList[j].name];
              console.log("----------------", colList[j], current)

              if(current !== undefined){
                toPush[colList[j].name] = current;
              }
            }

            datas[i].rowList.push(toPush);
            break;
          }
        }
        db.datas = datas;

        let pth2 = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        fs.writeFileSync(pth2, JSON.stringify(db, null, 2));

        io.in(uuid).emit('updated', db);
      }
    });
    

    /**-----------------------------------------------------------------------------------------------------------------------------------------------
     * {
     *  delete: "tabelName",
     *  where: {
     *    age: "=50"
     *  }
     * }
     */
    socket.on('delete', function(query, uuid, mp){
      if(query.delete !== undefined & uuid !== undefined & query.where !== undefined){
        let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        let data = fs.readFileSync(pth, 'utf8');

        let db = JSON.parse(data);

        if(db.secretKey != mp)
          return;
          
        let datas = db.datas;
        let kayList = utils.getKeyArray(query.where);

        for(let i=0; i < datas.length; i++){
          if(query.delete == datas[i].name){
            let querySyn = "return !("

            if(query.where !== undefined){
                for(let i = 0; i < kayList.length; i++){
                  let currentKay = kayList[i]
                  querySyn += " (e."+ currentKay + query.where[currentKay] + ") &";              
                }
                querySyn += "true)"
            }

            datas[i].rowList = datas[i].rowList.filter( (e) => {
              let funk = new Function('e', querySyn);
              return funk(e);
            } );
            break;
          }
        }
        db.datas = datas;

        let pth2 = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        fs.writeFileSync(pth2, JSON.stringify(db, null, 2));

        io.in(uuid).emit('updated', db);
      }
    });
    

    
    /**------------------------------------------------------------------------------------------------------------------------------------------------------
     * {
     *  update: "tabelName",
     *  where: {
     *    age: "=50"
     *  },
     *  with: {
     *    ecole: "Forward"
     *  }
     * }
     */
    socket.on('update', function(query, uuid, mp){
      if(query.update !== undefined & uuid !== undefined & query.where !== undefined & query.with !== undefined){
        let pth = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        let data = fs.readFileSync(pth, 'utf8');
    
        let db = JSON.parse(data);

        if(db.secretKey != mp)
          return;
          
        let datas = db.datas;
        let kayList = utils.getKeyArray(query.where);
        let withList = utils.getKeyArray(query.with);

        for(let i=0; i < datas.length; i++){
          if(query.update == datas[i].name){
            let querySyn = "return";

            if(query.where !== undefined){
                for(let i = 0; i < kayList.length; i++){
                  let currentKay = kayList[i]
                  querySyn += " (e."+ currentKay + query.where[currentKay] + ") &";              
                }
                querySyn += "true";
            }

            datas[i].rowList = datas[i].rowList.map( (e) => {
              let funk = new Function('e', querySyn);

              if(funk(e)){
                for(let j=0; j<withList.length; j++){
                  e[withList[j]] = query.with[withList[j]];
                }
              }
              return e;
            } );
            break;
          }
        }
        db.datas = datas;

        let pth2 = path.resolve(__dirname, './dataBases/' + uuid + '/dataBase.mb');

        fs.writeFileSync(pth2, JSON.stringify(db, null, 2));

        io.in(uuid).emit('updated', db);
      }
    });

});

