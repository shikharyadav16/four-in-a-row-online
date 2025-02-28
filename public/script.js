const socket = io();

let container = document.getElementsByClassName('container')[0];
let containerBtn = document.getElementsByClassName('container_btn')[0];

let playingArray = new Array(42).fill(null);
let clickRemBtn = new Array(7).fill(null);

function updateSize() {
    if (window.innerHeight - 160 > window.innerWidth) {
        container.classList.remove('long')
        containerBtn.classList.remove('btn_long')
        container.classList.add('wide')
        containerBtn.classList.add('btn_wide')
    } else {
        container.classList.remove('wide')
        containerBtn.classList.remove('btn_wide')
        container.classList.add('long')
        containerBtn.classList.add('btn_long')
    }
}

updateSize();
window.addEventListener('resize', () => {
    updateSize()
});


let flag = null;
let chance = null;
let myId = null;
let partnerId = null;
let myUsername = null;
let partnerUsername = null;

function setUsername() {
    myUsername = document.getElementsByClassName('username')[0].value;
    socket.emit("setUsername", myUsername);
}

function findMatch() {
    setUsername();
    document.getElementsByClassName('loader-bg')[0].style.display = 'flex'
    socket.emit("findMatch"); // Send request to start pairing
}
socket.on("paired", (data) => {
    myId = data.yourId;
    partnerId = data.partnerId;
    myUsername = data.yourUsername;
    partnerUsername = data.partnerUsername;

    if (myId > partnerId) {
        chance = 1;
    } else {
        chance = 0;
    }

    document.getElementsByClassName('loader-bg')[0].style.display = 'none';
    document.getElementsByClassName("players")[0].style.display = 'grid';
    document.getElementsByClassName('game')[0].hidden = false;
    document.getElementsByClassName('start')[0].hidden = true;

    document.getElementsByClassName('myself')[0].innerHTML = `<i class="fa fa-user" aria-hidden="true" style="color: white;">&nbsp;&nbsp;</i>${myUsername}`
    document.getElementsByClassName('opponent')[0].innerHTML = `<i class="fa fa-user" aria-hidden="true" style="color: white;">&nbsp;&nbsp;</i>${partnerUsername}`
});

function createNodes() {
    for (let i = 0; i < 7; i++) {
        let div = document.createElement('div');
        div.classList.add('btn');
        div.dataset.id = i
        div.innerHTML = '&downarrow;'
        containerBtn.appendChild(div);
    }

    for (let i = 0; i < 42; i++) {
        let div = document.createElement('div');
        div.classList.add('box');
        container.appendChild(div);
    }
    Array.from(document.querySelectorAll('.btn')).forEach((e) => {
        e.setAttribute('onclick', 'addOnclick(event)')
    })
}

function deleteNodes() {
    document.getElementsByClassName('container')[0].innerHTML = ''
    document.getElementsByClassName('container_btn')[0].innerHTML = ''
}

createNodes();

function startGame() {
    let username = document.getElementsByClassName('username')[0].value;
    if (username === null || username === '') {
        document.getElementsByClassName('info')[0].innerHTML = 'Invalid username 🙂'
        return;
    }
    findMatch();
}

let playTurn = 1;

function disableButton() {
    Array.from(document.querySelectorAll('.btn')).forEach((e) => {
        e.removeAttribute('onclick');
    })
}
function enableButton() {
    for (let i = 0; i < 7; i++) {
        if (!clickRemBtn[i]) {
            document.getElementsByClassName('btn')[i].setAttribute('onclick', 'addOnclick(event)')
        }
    }
}

// opponent button message 

socket.on('message', (message) => {
    if (chance) {
        displayBall(message, 'radial-gradient(rgb(90, 255, 90), green)')
        Array.from(document.querySelectorAll('.btn')).forEach((e) => {
            e.classList.add('red');
            e.classList.remove('green');
        })
        if (!flag) {
            enableButton();
            document.getElementsByClassName('token')[0].style.display = 'flex';
            setTimeout(()=> {
                document.getElementsByClassName('token')[0].style.display = 'none';
            },1500)
        }
    } else {
        displayBall(message, 'radial-gradient(rgb(255, 105, 105), rgb(224, 0, 0))')
        Array.from(document.querySelectorAll('.btn')).forEach((e) => {
            e.classList.remove('red');
            e.classList.add('green');
        })
        if (!flag) {
            enableButton();
            document.getElementsByClassName('token')[0].style.display = 'flex';
            document.getElementsByClassName('token')[0].style.backgroundColor = 'green';
            setTimeout(()=> {
                document.getElementsByClassName('token')[0].style.display = 'none';
            },1500)
        }
    }
    playTurn++;
});

function addOnclick(event) {

    if (chance) {

        if (playTurn % 2 === 0) {
            return;

        } else {
            (Array.from(document.querySelectorAll('.btn'))).forEach((e) => {
                e.classList.remove('red');
                e.classList.add('green');
            })
            displayBall(parseInt(event.target.dataset.id), 'radial-gradient(rgb(255, 105, 105), rgb(224, 0, 0))')
            socket.emit("message", parseInt(event.target.dataset.id));
            disableButton();
        }
        playTurn++;

    } else {

        if (playTurn % 2 === 0) {
            (Array.from(document.querySelectorAll('.btn'))).forEach((e) => {
                e.classList.add('red');
                e.classList.remove('green');
            })
            displayBall(parseInt(event.target.dataset.id), 'radial-gradient(rgb(90, 255, 90), green)')
            socket.emit("message", parseInt(event.target.dataset.id));
            disableButton();

        } else {
            return;
        }
        playTurn++;
    }
}

let countNodes = 0;

function displayBall(e, color) {
    for (let i = e; i < 42; i += 7) {
        if (i + 7 >= 42 || playingArray[i + 7] !== null) {
            playingArray[i] = color;
            document.getElementsByClassName('box')[i].style.background = 'none'
            document.getElementsByClassName('box')[i].style.background = color;
            checkWin(color);
            if (i < 7) {
                document.getElementsByClassName('btn')[i].removeAttribute('onclick');
                clickRemBtn[i] = 1;
                countNodes++;
            }
            if (countNodes === 7) {
                displayDrawResult()
            }
            break;
        }
    }
}

function displayDrawResult() {
    setTimeout(() => {
        document.getElementsByClassName('win_sec')[0].hidden = false;
        Array.from(document.querySelectorAll('.btn')).forEach((element) => {
            element.removeAttribute('onclick')
        })
        document.getElementsByClassName('winner')[0].innerHTML = 'Draw! 🤝'
    }, 1000)
}

function displayResult(winner) {
    let choice = 'yellow';
    let intervalId = setInterval(() => {
        if (choice === 'yellow') {
            for (let i = 1; i <= 4; i++) {
                document.getElementsByClassName('box')[winner[i]].style.background = 'none';
                document.getElementsByClassName('box')[winner[i]].style.backgroundColor = 'yellow';
                choice = 'color';
            }
        } else {
            for (let i = 1; i <= 4; i++) {
                document.getElementsByClassName('box')[winner[i]].style.backgroundColor = 'none';
                document.getElementsByClassName('box')[winner[i]].style.background = winner[0];
                choice = 'yellow';
            }
        }
    }, 100)


    flag = 1;

    setTimeout(() => {
        clearInterval(intervalId);
        document.getElementsByClassName('win_sec')[0].hidden = false;

        if (winner[0] === 'radial-gradient(rgb(255, 105, 105), rgb(224, 0, 0))' && chance) {
            document.getElementsByClassName('winner')[0].innerHTML = `🎉 Congratulations! You are the Champion! 🏆`
        } else if (winner[0] === 'radial-gradient(rgb(255, 105, 105), rgb(224, 0, 0))' && choice) {
            document.getElementsByClassName('winner')[0].innerHTML = `❌ Game Over! You Lost! 😞`
        } else if (winner[0] === 'radial-gradient(rgb(90, 255, 90), green)' && !chance) {
            document.getElementsByClassName('winner')[0].innerHTML = `🎉 Congratulations! You are the Champion! 🏆`
        } else {
            document.getElementsByClassName('winner')[0].innerHTML = `❌ Game Over! You Lost! 😞`
        }
    }, 1000)
}

function restart() {
    // playingArray.fill(null);
    // document.getElementsByClassName('win_sec')[0].hidden = true;
    // deleteNodes();
    // createNodes();
    // playTurn = 1;
    // countNodes = 0;
    location.reload();
}

function checkWin(color) {
    let winner = []
    winner = verticalSearch(color);
    if (winner) {
        displayResult(winner);
        Array.from(document.querySelectorAll('.btn')).forEach((element) => {
            element.removeAttribute('onclick')
        })
    }
}

function verticalSearch(color) {
    for (let i = 0; i < 21; i++) {
        if (playingArray[i] === color && playingArray[i + 7] === color && playingArray[i + 14] === color && playingArray[i + 21] === color) {
            return [color, i, i + 7, i + 14, i + 21]
        }
    }
    return linearSearch(color);
}

function linearSearch(color) {
    for (let i = 0; i < 42; i++) {
        if ((i - 4) % 7 === 0) {
            i += 3;
        }
        if (playingArray[i] === color && playingArray[i + 1] === color && playingArray[i + 2] === color && playingArray[i + 3] === color) {
            return [color, i, i + 1, i + 2, i + 3];
        }
    }
    return diagonalSearch(color);
}

function diagonalSearch(color) {
    const rows = 6, cols = 7;

    for (let r = 0; r <= rows - 4; r++) {
        for (let c = 0; c <= cols - 4; c++) {
            let i = r * cols + c;
            if (playingArray[i] === color && playingArray[i + 8] === color &&
                playingArray[i + 16] === color && playingArray[i + 24] === color) {
                return [color, i, i + 8, i + 16, i + 24]
            }
        }
    }

    for (let r = 0; r <= rows - 4; r++) {
        for (let c = 3; c < cols; c++) {
            let i = r * cols + c;
            if (playingArray[i] === color && playingArray[i + 6] === color &&
                playingArray[i + 12] === color && playingArray[i + 18] === color) {
                return [color, i, i + 6, i + 12, i + 18]
            }
        }
    }
}
