function makeSnowflake(){
    const min_duration = 15;
    const body = document.querySelector('.section');
    const snowFlake = document.createElement("div");
    const delay = Math.random()*10;
    const initialOpacity = Math.random();
    const duration = Math.random()*50+min_duration;

    snowFlake.classList.add("snowFlake");
    snowFlake.style.left = `${(Math.random()*(750))}px`
    snowFlake.style.animationDelay = `${delay}s`;
    snowFlake.style.animation = `fall ${duration}s linear`;
    snowFlake.style.opacity = initialOpacity;
    snowFlake.style.zIndex = -1;
    body.appendChild(snowFlake);

    setTimeout(()=>{
        body.removeChild(snowFlake);
        makeSnowflake();
    }, (duration + delay) * 800);
}
function makeSnowflake2(){
    const min_duration = 15;
    const body = document.querySelector('.section2');
    const snowFlake = document.createElement("div");
    const delay = Math.random()*10;
    const initialOpacity = Math.random();
    const duration = Math.random()*50+min_duration;

    snowFlake.classList.add("snowFlake");
    snowFlake.style.left = `${(Math.random()*(780))}px`
    snowFlake.style.animationDelay = `${delay}s`;
    snowFlake.style.animation = `fall ${duration}s linear`;
    snowFlake.style.opacity = initialOpacity;
    snowFlake.style.zIndex = -1;
    body.appendChild(snowFlake);

    setTimeout(()=>{
        body.removeChild(snowFlake);
        makeSnowflake2();
    }, (duration + delay) * 800);
}
export {makeSnowflake,makeSnowflake2};