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
var squareSize;

{
    const roomW = document.getElementById('room-w');
    const roomH = document.getElementById('room-h');
    const cellS = document.getElementById('cell-s');
    size.w = Number(roomW.value);
    size.h = Number(roomH.value);
    squareSize = Number(cellS.value)

    roomW.addEventListener('change', () => { size.w = Number(roomW.value); updateRoomCanvas() });
    roomH.addEventListener('change', () => { size.h = Number(roomH.value); updateRoomCanvas() });
    cellS.addEventListener('change', () => { squareSize = Number(cellS.value); updateRoomCanvas() });
}

const robotHistory = [];
var robotPosI = 0;
var algorithm;

{
    const beg  = document.getElementById('robot-beg' );
    const prev = document.getElementById('robot-prev');
    const next = document.getElementById('robot-next');
    const end  = document.getElementById('robot-end' );

    const toBeg = () => {
        robotPosI = 0;
        updateRoomCanvas();
    };
    const toPrev = () => {
        if(robotPosI === 0) return;
        robotPosI--;
        updateRoomCanvas();
    };
    const toNext = () => {
        moveNextState();
        updateRoomCanvas();
    };
    const toEnd = () => {
        robotPosI = robotHistory.length-1;
        let i = 0;
        while(i < 10000 && moveNextState()) i++;
        if(i === 10000) console.error('too much iterations');
        updateRoomCanvas();
    };

    beg.addEventListener('click', toBeg);
    prev.addEventListener('click', toPrev);
    next.addEventListener('click', toNext);
    end.addEventListener('click', toEnd);

    //source: google AI
    window.addEventListener("keydown", function(event) {
        var key = event.keyCode;
        if(key === 37) toPrev(); //left arrow
        else if(key === 38) toEnd(); //up arrow
        else if(key === 39) toNext(); //right arrow
        else if(key === 40) toBeg(); //down arrow
    });
}


updateRoomCanvas();

function moveNextState() {
    console.log(robotPosI, robotHistory.length);
    if(robotPosI+1 < robotHistory.length) {
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

    var dir = 0;
    const dirOffsets = [ 0,-1, 1,0, 0,1, -1,0 ];
    const turn90 = function*() { dir = dir === 3 ? 0 : dir+1; /*yield { x, y, dir }*/ }; //clockwise
    const turn_90 = function*() { dir = dir === 0 ? 3 : dir-1; /*yield { x, y, dir }*/ }; //counterclockwise
    const checkFront = () => cellAt(x + dirOffsets[dir*2], y + dirOffsets[dir*2+1]); 
    const moveFront = function() { x += dirOffsets[dir*2]; y += dirOffsets[dir*2+1]; return { x, y, dir } };

    while(true) {
        //find wall above
        dir = 0;
        yield { x, y, dir };
        while(true) {
            const above = checkFront();
            if(above === roomDoor) { yield moveFront(); return }
            else if(above === roomEmpty) yield moveFront();
            else break;
        }

        yield *turn90();

        var minY = y, minYX = x, minYDir = dir;
        var different = false;

        while(!(different && minY === y && minYX === x && minYDir === dir)) {
            different = false;

            if(y < minY) {
                minY = y;
                minYX = x;
                minYDir = dir;
            }

            const side = checkFront();
            if(side === roomDoor) { yield moveFront(); return }
            else if(side == roomEmpty) {
                yield moveFront();
                different = true;
                yield *turn_90();
                const angle = checkFront();
                if(angle === roomDoor) { yield moveFront(); return }
                else if(angle === roomEmpty) {
                    yield moveFront();
                    different = true;
                }
                else yield *turn90();
            }
            else yield *turn90();
        }
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
        const dir = pos.dir;
        const r = squareSize*0.5;

        context.fillStyle = 'red';
        context.beginPath();
        context.arc(x+r, y+r, r, 0, 2 * Math.PI);
        context.fill();
        context.fillStyle = 'orange';

        context.save();
        context.translate(x+r, y+r);
        context.rotate(dir * Math.PI*0.5);
        const width = r*0.1;
        context.fillRect(-width*0.5, 0, width, -r);
        context.restore();
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




