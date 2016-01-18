function getVarName(what) {
    var temp
    if (Meteor.isClient)
        temp = window
    else
        temp = global
    for (var name in temp) {
        if (temp[name] == what)
            return (name);
    }
    return ("");
}

function getStackTrace() {

    var stack;

    try {
        throw new Error('');
    }
    catch (error) {
        stack = error.stack || '';
    }

    stack = stack.split('\n').map(function (line) {
        return line.trim();
    });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
}


log = function (args) {
    if (Meteor.isClient)
        console.log('**********************' + /(\/[a-zA-z0-9\-_]*\.js\?)/.exec(getStackTrace()[1])[1] + '   ' +  /:(\d*):\d*/.exec(getStackTrace()[1])[1], '**********************')
    else
        console.log('**********************' + getStackTrace()[1] + '**********************')

    var args = Array.prototype.slice.call(arguments);
    for (a in args) {
        console.log(args[a])
        //console.log('xxxx', getVarName(args[a]))
    }

    console.log('******************************************************************')
}

_.hasChained=function(object,string){
    string=string.split('.')
    self=this
    this.result=true;
    string.forEach(function(property,i){
        if (!_.has(object,property)){
            self.result=false;
            return;
        }
        object=object[property]
    })
    return this.result
}

_.set=function (obj, prop, value) {
    if (typeof prop === "string")
        prop = prop.split(".");

    if (prop.length > 1) {
        var e = prop.shift();
        _.set(obj[e] =
                Object.prototype.toString.call(obj[e]) === "[object Object]"
                    ? obj[e]
                    : {},
            prop,
            value);
    } else
        obj[prop[0]] = value;
}