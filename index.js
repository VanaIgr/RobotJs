const roomCanvas = document.getElementById('room-canvas');
const context = roomCanvas.getContext('2d');

const prevSize = { w: 0, h: 0 };
const size = { w: 0, h: 0 };
var room = [];
const doorPos = { x: 0, y: 1 };

const roomEmpty = 0;
const roomWall = 1;
const roomDoor = 2;

//https://stackoverflow.com/a/42769683/18704284
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)// doesn't recalculate when font size changes :/
const squareSize = 3 * rem;

{
    const roomW = document.getElementById('room-w');
    const roomH = document.getElementById('room-h');
    size.w = Number(roomW.value);
    size.h = Number(roomH.value);

    roomW.addEventListener('change', () => { size.w = Number(roomW.value); updateRoomCanvas() })
    roomH.addEventListener('change', () => { size.h = Number(roomH.value); updateRoomCanvas() })
}

const robotHistory = [];
var robotPosI = 0;
var algorithm;

{
    const beg  = document.getElementById('robot-beg' );
    const prev = document.getElementById('robot-prev');
    const next = document.getElementById('robot-next');
    const end  = document.getElementById('robot-end' );

    beg.addEventListener('click', () => {
        robotPosI = 0;
        updateRoomCanvas();
    });
    prev.addEventListener('click', () => {
        if(robotPosI === 0) return;
        robotPosI--;
        updateRoomCanvas();
    });
    next.addEventListener('click', () => {
        moveNextState();
        updateRoomCanvas();
    });
    end.addEventListener('click', () => {
        robotPosI = robotHistory.length-1;
        let i = 0;
        while(i < 10000 && moveNextState()) i++;
        if(i === 10000) console.error('too much iterations');
        updateRoomCanvas();
    });
}


updateRoomCanvas();

function moveNextState() {
    if(robotPosI+1 < robotHistory.length-1) {
        robotPosI++;
        return true;
    }

    const res = algorithm.next();
    if(res.done) return false;

    robotPosI = robotHistory.length;
    robotHistory.push(res.value);
    return true;
}

function* robotAlgorithm(x, y, cellAt) {
    yield { x, y };
    while(cellAt(x, y-1) === roomEmpty) {
        y--
        yield { x, y };
    }
}

roomCanvas.addEventListener('mouseup', function(e) {
    const rect = roomCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    updateCell(Math.floor(x/squareSize), Math.floor(y/squareSize), getCellType());
})

function getCellType() {
    const radioButtons = document.getElementsByName("cell-type");
    for(let i = 0; i < radioButtons.length; i++) {
        if(radioButtons[i].checked) {
            return Number(radioButtons[i].value);
        }
    }
}

function updateCell(x, y, cellType) {
    console.log(x, y, cellType);
    if(cellType == roomDoor) {
        room[doorPos.y*size.w+doorPos.x] = roomWall;
        room[y*size.w+x] = roomDoor;
        doorPos.x = x;
        doorPos.y = y;
    }
    else {
        room[y*size.w+x] = cellType;
    }
    updateRoomCanvas();
}

function updateRoomCanvas() {
    const { w, h } = size;

    if(prevSize.w !== w || prevSize.h !== h) resizeBoard(w, h);

    roomCanvas.width = w * squareSize;
    roomCanvas.height = h * squareSize;

    // context.strokeStyle = 'red';
    // context.strokeWidth = 2;

    context.fillStyle = 'white';
    context.clearRect(0, 0, roomCanvas.width, roomCanvas.height);
    for (var j = 0; j < h; j++) {
        for (var i = 0; i < w; i++) {
            var x = i * squareSize;
            var y = j * squareSize;

            const cell = room[j*w+i];
            if(cell === roomWall) {
                context.fillStyle = "green";
            }
            else if(cell === roomDoor) {
                context.fillStyle = "blue";
            }
            else continue;

            context.fillRect(x, y, squareSize, squareSize);
            // context.strokeRect(x, y, squareSize, squareSize);
        }
    }

    {
        const pos = robotHistory[robotPosI];
        const x = pos.x * squareSize, y = pos.y * squareSize;
        const r = squareSize*0.5;

        context.fillStyle = 'red';
        context.beginPath();
        context.arc(x+r, y+r, r, 0, 2 * Math.PI);
        context.fill();
    }
}

function clamp(num, a, b) { return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b)); }

function resizeBoard(newW, newH) {
    const prevW = prevSize.w, prevH = prevSize.h;
    const newRoom = Array(newW * newH);
    newRoom.fill(roomEmpty);

    const minW = Math.min(prevW, newW);
    const minH = Math.min(prevH, newH);

    for(var y = 1; y < minH-1; y++)
    for(var x = 1; x < minW-1; x++) {
        newRoom[y*newW+x] = room[y*prevW+x];
    }

    for(let x = 0; x < newW; x++) newRoom[x] = newRoom[(newH-1)*newW+x] = roomWall;
    for(let y = 0; y < newH; y++) newRoom[y*newW] = newRoom[y*newW+newW-1] = roomWall;


    const newDoorX = clamp(doorPos.x, 0, newH);
    const newDoorY = clamp(doorPos.y, 0, newW);

    doorPos.x = newDoorX;
    doorPos.y = newDoorY;

    newRoom[newDoorY*newW+newDoorX] = roomDoor;
    room = newRoom;

    prevSize.w = newW;
    prevSize.h = newH;

    resetRobot(newW, newH);
}

function resetRobot(w, h) {
    robotHistory.length = 0;
    algorithm = robotAlgorithm(Math.floor(w/2), Math.floor(h/2), (x, y) => room[y*w+x] ?? roomWall);
    robotHistory.push(algorithm.next().value);
    robotPosI = 0;
}




