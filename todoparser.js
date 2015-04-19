'use strict';

var stream = require('stream'),
    fs = require("fs"),
    replace = require('replace'),
    Trello = require('node-trello'),
    config = require('../../todo.json'),
    appKey = config.appKey,
    userToken = config.userToken,
    listid = config.listid,
    t = new Trello(appKey, userToken),
    commentRegex = /\/\/.-TODO((?!.*trello\.com))/;


function processLine(line, file, number) {
    var cardDesc = '',
        indexOfRegex,
        code,
        comment,
        username;

    if (commentRegex.test(line)) {
        indexOfRegex = line.search(commentRegex);
        line = line.slice(indexOfRegex + 2);
        code = line[0];
        line = line.slice(line.indexOf('(') + 1);
        username = line.slice(0, line.indexOf(')'));
        comment = line.slice(line.indexOf(')') + 1).trim();

        
        cardDesc += 'Filed by ' + username + '\n';
        cardDesc += 'Code: ' + code + '\n';
        cardDesc += 'Location: ' + file + ':' + number + '\n';

        t.post("/1/cards", {
            name: comment,
            desc: cardDesc,
            idList: listid
        }, function (err, data) {
            if (err) throw err;

            replace({
                regex: "([ \t]*\/\/.-TODO[^\n\r\n]*" + comment + ")([\r\n\n])",
                replacement: "$1 " + data.shortUrl + "$2",
                paths: [file],
                recursive: true,
                silent: true,
            });
        });



    }
}

function processFile(file) {
    var liner = new stream.Transform({
            objectMode: true
        }),
        source = fs.createReadStream(file),
        number = 0;

    liner._transform = function (chunk, encoding, done) {
        var data = chunk.toString();
        if (this._lastLineData) {
            data = this._lastLineData + data;
        }

        var lines = data.split('\n');
        this._lastLineData = lines.splice(lines.length - 1, 1)[0];

        lines.forEach(this.push.bind(this));
        done();
    };

    liner._flush = function (done) {
        if (this._lastLineData) {
            this.push(this._lastLineData);
        }
        this._lastLineData = null;
        done();
    };

    source.pipe(liner);

    liner.on('readable', function () {
        var line;

        //Proccess file line by line
        while (line = liner.read()) {
            number++;
            processLine(line, file, number);
        }
    });
}

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name)
            .isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

process.argv.slice(2)
    .forEach(function (directory) {
        getFiles(directory)
            .forEach(function (d) {
                processFile(d);
            });
    });