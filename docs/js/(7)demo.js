// initialization
let scene = new Grid(gridHeight, gridWidth);
showView(document.getElementById("clarinet-btn"), "clarinet");
update();

if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.getElementById("next-btn").onclick = () => {
    transitionDown();
};

window.addEventListener('wheel', (event) => {
    console.log("scroll");
    if (event.deltaY > 0 && !document.getElementById('page-wrapper').classList.contains('down')) {
        transitionDown();
    }
    if (event.deltaY < 0 && 
        document.getElementById('page-wrapper').classList.contains('down') && 
        document.getElementById('about-page').style.display == "none") {
        transitionUp();
    }
});

function transitionDown () {
    document.getElementById('page-wrapper').classList.add('down');
    setTimeout(() => {
            canvas.focus();
    }, 1200);
}

function transitionUp () {
    document.getElementById('page-wrapper').classList.remove('down');
}

// main page
// top bar navigation
function showView(button, tab) {
    document.querySelectorAll(".instrument-selector button").forEach(b => b.classList.remove("active"));

    const highlight = document.getElementById("nav-highlight");

    if (tab == "about") {
        document.querySelector(".instrument-page").style.display = "none";
        document.getElementById("about-page").style.display = "flex";
        highlight.style.display = "none";
        return;
    }
    highlight.style.display = "flex";
    button.classList.add("active");

    // rectangle animation
    if (button && highlight) {
        highlight.style.width = `${button.offsetWidth}px`;
        highlight.style.transform = `translateX(${button.offsetLeft}px)`
    }
    document.getElementById("about-page").style.display = "none";
    document.querySelector(".instrument-page").style.display = "flex";
    changeInstrument(tab);
    canvas.focus();
}

document.getElementById("clarinet-btn").onclick = (e) => showView(e.target, "clarinet");
document.getElementById("recorder-btn").onclick = (e) => showView(e.target, "recorder");
document.getElementById("blank-btn").onclick = (e) => showView(e.target, "blank");

document.getElementById("about-btn").onclick = (e) => showView(e.target, "about");



// demo videos in ABOUT page

const aboutVideos = document.querySelectorAll(".demo-about");

aboutVideos.forEach(v => {
    v.addEventListener("mouseenter", function() {
        this.play().catch(error => {
            // Browsers sometimes block play() if not interacted with first
            console.log("Playback prevented:", error);
        });
    });

    v.addEventListener("mouseleave", function() {
        this.pause();
    });
});