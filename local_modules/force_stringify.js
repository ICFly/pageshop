var dig_depth = 100;

module.exports = function(){
    var objsPool = [];
    var keysPool = [];

    try{
        return result = JSON.stringify.apply(JSON, arguments);
    }catch(e){
        return [JSON.stringify.call(JSON, uncircleCopy(arguments[0],dig_depth)), objsPool, keysPool][0];
    }

    function uncircleCopy(obj,depth,key){
        var copyObj = {};
        var index = -1;
        key = key || 'top';
        switch(typeof obj){
            case 'object':
                if( (index = objsPool.indexOf(obj))<0 && depth>0 && objsPool.push(obj) && keysPool.push(key) ){
                    for(var i in obj) copyObj[i] = uncircleCopy(obj[i],depth-1,key + '.' + i);
                }else{
                    copyObj = depth>0 ? '[Circular] ' + keysPool[index] : 'Depth is not enough';
                }
                break;
            default:
                copyObj = obj;
                break;
        }
        return copyObj;
    }
}