exports.getKeyArray = function (data){
    let keys = []
    for(var key in data){
      keys.push(key)
    } 
    return keys;
}

exports.order = function(a, b, prop, desc){
    if(desc === undefined)
        desc = false;

    if(desc){
        if (a[prop] > b[prop]) {
            return -1;
        }
        if (b[prop] > a[prop]) {
            return 1;
        }
    } else {
        if (a[prop] < b[prop]) {
            return -1;
        }
        if (b[prop] < a[prop]) {
            return 1;
        }
    }

    return 0;
}