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

{
    const roomW = document.getElementById('room-w');
    const roomH = document.getElementById('room-h');
    size.w = Number(roomW.value);
    size.h = Number(roomH.value);

    updateRoomCanvas();

    roomW.addEventListener('change', () => { size.w = Number(roomW.value); updateRoomCanvas() })
    roomH.addEventListener('change', () => { size.h = Number(roomH.value); updateRoomCanvas() })
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
}




