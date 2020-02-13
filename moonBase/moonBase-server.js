class MoonBase {

    constructor(uuid, mp){
        this.uuid = uuid;
        this.mp = mp;
    }

    connectToMoon(){
        let socket = io.connect('https://moon-base.herokuapp.com/');
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

    slect(query){
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
        this.socket.on('getSelection', callBack, this.uuid, this.mp);
    }

    connected(callBack){
        this.socket.on('connected', callBack, this.uuid, this.mp);
    }  

    updated(callBack){
        this.socket.on('updated', callBack, this.uuid, this.mp);
    }   

}
