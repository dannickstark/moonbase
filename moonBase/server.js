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
let utils = require('./utils');

app.get('/', (eq, res) => {
    res.send('Hi0');
});

let server = app.listen(PORT);
console.log('Server started on: ', PORT);

const io = require('socket.io')(server);

io.on('connect', (socket) => {
    console.log('New User!');
    
    // Set the connection to the dataBase-----------------------------------------------------------------------
    socket.on('connectToDB', function(uuid, pw){
      let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');
      
      fs.access(pth, (err) => {
        if(!err){
          fs.readFile(pth, 'utf8', (err, data) =>{   
            if (err) throw err4;

             data = JSON.parse(data);
     
             if(data.pw == pw){
               socket.join(uuid);
               console.log('New User connected!');
               io.in(uuid).emit('connected', data);
             } else {      
               console.log('New User not allowed!');
               io.in(uuid).emit('connected', null);
             }
          });
        } else {
          socket.join(uuid);
        }
      })
    });

    
    // Event to get pushSignal from user---------------------------------------------------------------------
    socket.on('push', function(data, uuid, pw){
      let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

      fs.access(pth, (err) => {
        if(!err){
          fs.readFile(pth, 'utf8', (err2, data2) => { 
            if (err2) throw err4;

            let db2 = JSON.parse(data2);

            if(db2.pw != pw)
              return;

            let finded = false;
            for(let i=0; i < db2.datas.length; i++){

              if(db2.datas[i].name == data.datas[0].name){
                db2.datas[i] = data.datas[0];
                fs.writeFile(pth, JSON.stringify(db2), (err3) => {
                  if (err3) throw err3;
                  console.log('The file has been saved!');
                  io.in(uuid).emit('pushed');
                });
                finded = true;
                return;
              }
            }

            if(!finded){
              db2.datas.push(data.datas[0]);
              fs.writeFile(pth, JSON.stringify(db2), (err3) => {
                if (err3) throw err3;
                console.log('The file has been saved!');
                io.in(uuid).emit('pushed');
              });
            }
          
            io.in(uuid).emit('updated', db2);
          }); 
        } else {
          let dirPth = path.resolve(__dirname, '../dataBases/' + uuid); 
    
          fs.mkdir(dirPth, { recursive: true }, (err4) => {
            if (err4) throw err4;
          
            fs.writeFile(pth, JSON.stringify(data), (err5) => {
              if (err5) throw err5;
              console.log('The file has been saved!');
              io.in(uuid).emit('pushed');
            }); 
    
            io.in(uuid).emit('updated', data);
          });
        } 
      })
    });
    
    
    // Event to get pullSignal from user-----------------------------------------------------------------------
    socket.on('pull', function(name, uuid, pw){
      let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');
      
      fs.readFile(pth, 'utf8', (err, data) => {  
        if (err) {
          io.in(uuid).emit('getPull', 404);
          throw err;
        }

        let db = JSON.parse(data);

        if(db.pw != pw){
          io.in(uuid).emit('getPull', 404);
          return;
        }

        for(let i=0; i<db.datas.length; i++){
          if(db.datas[i].name == name){
            io.in(uuid).emit('getPull', db.datas[i]);
          }
        }
        
        console.log(name + ' was pulled successfully!');
      });
    });
    
    
    // Event to get pullSignal from user-----------------------------------------------------------------------
    socket.on('clone', function(uuid, pw){
      let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

      console.log('-------------------------------------')
      
      fs.readFile(pth, 'utf8', (err, data) => {  
        if (err) {
          io.in(uuid).emit('getClone', 404);
          throw err;
        }

        let db = JSON.parse(data);

        if(db.pw != pw){
          io.in(uuid).emit('getClone', 404);
          return;
        }

        io.in(uuid).emit('getClone', db);
        
        console.log(uuid + ' was clonned successfully!');
      });
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
    socket.on('select', function(query, uuid, pw){
      let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

      fs.readFile(pth, 'utf8', (err, data) => {
        if (err) throw err;

        let db = JSON.parse(data);
  
        if(db.pw != pw)
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
    });
    

    /**-------------------------------------------------------------------------------------------------------------
     * {
     *  insert: {},
     *  into: "TabelName",
     * }
     */
    socket.on('insert', function(query, uuid, pw){
      if(query.insert !== undefined & query.into !== undefined & uuid !== undefined){
        let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

        fs.readFile(pth, 'utf8', (err, data) => {
          if (err) throw err;
  
          let db = JSON.parse(data);
  
          if(db.pw != pw)
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
  
          let pth2 = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');
  
          fs.writeFile(pth2, JSON.stringify(db), (err2) => {
            if (err2) throw err2;
            console.log('The file has been saved!');
          });
  
          io.in(uuid).emit('updated', db);
        });
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
    socket.on('delete', function(query, uuid, pw){
      if(query.delete !== undefined & uuid !== undefined & query.where !== undefined){
        let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

        fs.readFile(pth, 'utf8', (err, data) => {
          if (err) throw err;

          let db = JSON.parse(data);
  
          if(db.pw != pw)
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
  
          let pth2 = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');
  
          fs.writeFile(pth2, JSON.stringify(db), (err2) => {
            if (err2) throw err2;
            console.log('The file has been saved!');
          });
  
          io.in(uuid).emit('updated', db);
        });
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
    socket.on('update', function(query, uuid, pw){
      if(query.update !== undefined & uuid !== undefined & query.where !== undefined & query.with !== undefined){
        let pth = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');

        fs.readFile(pth, 'utf8', (err, data) => {
          if (err) throw err;
    
          let db = JSON.parse(data);
  
          if(db.pw != pw)
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
  
          let pth2 = path.resolve(__dirname, '../dataBases/' + uuid + '/dataBase.mb');
  
          fs.writeFile(pth2, JSON.stringify(db), (err2) => {
            if (err2) throw err2;
            console.log('The file has been saved!');
          });
  
          io.in(uuid).emit('updated', db);
        });
      }
    });

});

