const {getAllFilePathsWithExtension, readFile, getFileName} = require('./fileSystem');
const {readLine} = require('./console');

let comments = [];

let userMaxLength = 4;
let dateMaxLength = 4;
let textMaxLength = 7;
let fileNameMaxLength = 8;

app();

function app() {
    getAllComments();
    console.log('Please, write your command!');
    readLine(processCommand);
}

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => getFileName(path) + ':' + readFile(path));
}

function processCommand(command) {
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            show();
            break;
        case 'important':
            important();
            break;
        case (command.match(/user [\wа-яё]+/i) || {}).input:
            user(command.substring(5));
            break;
        case 'sort importance':
            sortImportance();
            break;
        case 'sort user':
            sortUser();
            break;
        case 'sort date':
            sortDate();
            break;
        case (command.match(/date \d+-\d+-\d+/i) || command.match(/date \d+-\d+/i) || command.match(/date \d+/i) || {}).input:
            date(new Date(command.substring(5)));
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function show() {
    writeComments(comments);
}

function important() {
    let importantComments = [];
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].important === '  !') importantComments.push(comments[i]);
    }
    writeComments(importantComments);
}

function user(user) {
    let userComments = [];
    for (let i = 0; i < comments.length; i++) {
        if (comments[i].user.substring(0, user.length).toLowerCase() === user.toLowerCase()) userComments.push(comments[i]);
    }
    writeComments(userComments);
}

function sortImportance() {
    let mapped = comments.map((el, i) => {
        return {index: i, value: el.text};
    });
    mapped.sort((a, b) => {
        if (a.value.split('!').length > b.value.split('!').length) {
            return -1;
        }
        if (a.value.split('!').length < b.value.split('!').length) {
            return 1;
        }
        return 0;
    });
    let sortedComments = mapped.map((el) => {
        return comments[el.index];
    });
    writeComments(sortedComments);
}


function sortUser() {
    let mapped = comments.map((el, i) => {
        return {index: i, value: el.user.toLowerCase()};
    });
    mapped.sort((a, b) => {
        if (a.value.length === 0 && b.value.length !== 0) return 1;
        if ((a.value.length !== 0 && b.value.length === 0)) return -1;
        if (a.value > b.value) {
            return 1;
        }
        if (a.value < b.value) {
            return -1;
        }
        return 0;
    });
    let sortedComments = mapped.map((el) => {
        return comments[el.index];
    });
    writeComments(sortedComments);
}

function sortDate() {
    let mapped = comments.map((el, i) => {
        return {index: i, value: new Date(el.date)};
    });
    mapped.sort((a, b) => {
        if (isNaN(a.value) && !isNaN(b.value)) return 1;
        if (!isNaN(a.value) && isNaN(b.value)) return -1;
        if (isNaN(a.value) && isNaN(b.value)) return 0;
        return b.value - a.value;
    });
    let sortedComments = mapped.map((el) => {
        return comments[el.index];
    });
    writeComments(sortedComments);
}

function date(date) {
    if (isNaN(date)) {
        console.log('Invalid Date');
        return;
    }
    let commentsByDate = [];
    for (let comment of comments) {
        if (new Date(comment.date) > date) commentsByDate.push(comment);
    }
    writeComments(commentsByDate);
}

function writeComments(comments) {
    getMaxSizeField(comments);
    let outputStr = '';
    outputStr += '  !  |  user' + charGenerator(' ', userMaxLength - 4) +
        '  |  date' + charGenerator(' ', dateMaxLength - 4) +
        '  |  comment' + charGenerator(' ', textMaxLength - 7) +
        '  |  fileName' + charGenerator(' ', fileNameMaxLength - 8) + '  \n';
    let separator = charGenerator('-');
    outputStr += separator;
    for (let comment of comments) {
        outputStr += '\n' + comment.important + '  |  ' +
            comment.user + charGenerator(' ', userMaxLength - comment.user.length) + '  |  ' +
            comment.date + charGenerator(' ', dateMaxLength - comment.date.length) + '  |  ' +
            comment.text + charGenerator(' ', textMaxLength - comment.text.length) + '  |  ' +
            comment.fileName + charGenerator(' ', fileNameMaxLength - comment.fileName.length) + '  ';
    }
    if (comments.length !== 0)
        outputStr += '\n' + separator;
    console.log(outputStr);
}

function charGenerator(char, quantity = userMaxLength + dateMaxLength + textMaxLength + fileNameMaxLength + 25) {
    let str = '';
    for (let i = 0; i < quantity; i++)
        str += char;
    return str;
}

function getAllComments() {
    const files = getFiles();
    for (let i = 0; i < files.length; i++) {
        comments = comments.concat(getCommentsFromFile(files[i]));
    }
}

function getCommentsFromFile(file) {
    let comments = [];
    let fileName = file.substring(0, file.indexOf(':'));
    let regexp = /\/\/ ?todo/ig;
    let str;
    let comment;
    while (str = regexp.exec(file)) {
        let posEnd = file.indexOf('\n', regexp.lastIndex);
        if (posEnd === -1) {
            comment = parceComment(file.substring(regexp.lastIndex).trim());
        } else {
            comment = parceComment(file.substring(regexp.lastIndex, posEnd).trim());
        }
        comment.fileName = fileName.length <= 15 ? fileName : fileName.substring(0, 12) + '...';
        comments.push(comment);
    }
    return comments;
}

function parceComment(str) {

    let comment = {};
    str = trimBeginning(str);
    let atr = str.split(';');
    if (atr.length >= 3) {
        comment.important = str.includes('!') ? '  !' : '   ';
        comment.user = atr[0].trim().length <= 10 ? atr[0].trim() : atr[0].trim().substring(0, 7) + '...';
        if (!isNaN(new Date(atr[1].trim())))
            comment.date = atr[1].trim().length <= 10 ? atr[1].trim() : atr[1].trim().substring(0, 7) + '...';
        else comment.date = '';
        let textComment = '';
        for (let i = 2; i < atr.length; i++) {
            if (i >= 3) textComment += ';';
            textComment += atr[i];
            if (textComment.length >= 50) break;
        }
        textComment = textComment.trim();
        comment.text = textComment.length <= 50 ? textComment : textComment.substring(0, 47) + '...';
    } else {
        comment.important = str.includes('!') ? '  !' : '   ';
        comment.user = '';
        comment.date = '';
        comment.text = str.length < 50 ? str : str.substring(0, 47) + '...';
    }
    return comment;
}

function getMaxSizeField(comments) {
    userMaxLength = 4;
    dateMaxLength = 4;
    textMaxLength = 7;
    fileNameMaxLength = 8;
    for (let comment of comments) {
        if (comment.fileName.length > fileNameMaxLength) fileNameMaxLength = comment.fileName.length;
        if (comment.user.length > userMaxLength) userMaxLength = comment.user.length;
        if (comment.date.length > dateMaxLength) dateMaxLength = comment.date.length;
        if (comment.text.length > textMaxLength) textMaxLength = comment.text.length;
    }
}

function trimBeginning(str) {
    while (str.charAt(0) === ':' || str.charAt(0) === ' ')
        str = str.substring(1);
    return str;
}

// TODO you can do it!
