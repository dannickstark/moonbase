let io = require('socket.io-client');

module.exports = class MoonBase {

    constructor(uuid, mp, url){
        this.uuid = uuid;
        this.mp = mp;
        this.url = url;
    }

    connectToMoon(){
        // let socket = io('http://localhost:3000');
        let socket = io(this.url);
        socket.emit('connectToDB', this.uuid, this.mp);
        this.socket = socket;
    }
    
    getTabel(data,tabelName){
        for(let i=0; i<data.datas.length; i++){
            if(data.datas[i].name == tabelName){
                return data.datas[i].rowList;
            }
        }
    }

    select(query){
        this.socket.emit('select', query, this.uuid, this.mp);
    }

    insert(query){
        this.socket.emit('insert', query, this.uuid, this.mp);
    }

    delete(query){
        this.socket.emit('delete', query, this.uuid, this.mp);
    }

    update(query){
        this.socket.emit('update', query, this.uuid, this.mp);
    }

    getSelection(callBack){
        this.socket.on('getSelection', callBack);
    }

    connected(callBack){
        this.socket.on('connected', callBack);
    }  

    updated(callBack){
        this.socket.on('updated', callBack);
    }     

    push(data, callBack){
        this.socket.emit('push', data, this.uuid, this.mp);
        this.socket.on('pushed', callBack);
    }  

    pull(name){
        this.socket.emit('pull', name, this.uuid, this.mp);
    }

    getPull(callBack){
        this.socket.on('getPull', callBack);
    } 

    clone(){
        this.socket.emit('clone', this.uuid, this.mp);
    }

    getPull(callBack){
        this.socket.on('getPull', callBack);
    }

}