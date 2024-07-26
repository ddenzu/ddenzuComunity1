// 메인페이지의 socket 채팅창을 옮기는 로직
const draggableElement = document.getElementById('draggableElement');
let offsetX, offsetY;
let isDragging = false;
draggableElement.addEventListener('mousedown', onMouseDown);
draggableElement.addEventListener('touchstart', onTouchStart);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('touchmove', onTouchMove);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('touchend', onTouchEnd);
function onMouseDown(event) {
    isDragging = true;
    const rect = draggableElement.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
}
function onTouchStart(event) {
    isDragging = true;
    const touch = event.touches[0];
    const rect = draggableElement.getBoundingClientRect();
    offsetX = touch.clientX - rect.left;
    offsetY = touch.clientY - rect.top;
}
function onMouseMove(event) {
    if (isDragging) {
        event.preventDefault();
        moveElement(event.clientX, event.clientY);
    }
}
function onTouchMove(event) {
    if (isDragging) {
        event.preventDefault();
        const touch = event.touches[0];
        moveElement(touch.clientX, touch.clientY);
    }
}
function moveElement(clientX, clientY) {
    const parentRect = document.querySelector('.section2').getBoundingClientRect();
    const maxX = parentRect.width - draggableElement.offsetWidth;
    const maxY = parentRect.height - draggableElement.offsetHeight;
    let x = clientX - offsetX - parentRect.left;
    let y = clientY - offsetY - parentRect.top;
    // 요소가 부모 요소 바깥으로 나가지 않도록 제한
    x = Math.min(Math.max(x, 0), maxX);
    y = Math.min(Math.max(y, 0), maxY);
    draggableElement.style.left = x + 'px';
    draggableElement.style.top = y + 'px';
}
function onMouseUp() {
    isDragging = false;
}
function onTouchEnd() {
    isDragging = false;
}

