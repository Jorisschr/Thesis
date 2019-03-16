var playButton = document.getElementById("playButton");
var canvas = document.getElementById("osmdCanvas");
var playing = false;
playButton.addEventListener("click", playPause, false);

var startButton = document.getElementById("startButton");
startButton.addEventListener("click", toStart, false);

var tempoSlider = document.getElementById("tempo");
tempoSlider.addEventListener("change", setTempo, false);

// TODO: betere default zetten...
var tempo = 170;

function playPause() {
    playing = !playing;
    if (playing) {
        playButton.innerHTML = 'Pause <i class="material-icons left">pause_circle_filled</i>';
        pageScroll();
    } else {
        playButton.innerHTML = 'Play <i class="material-icons left">play_circle_filled</i>';
    }
}

// TODO: tempo setting
function pageScroll() {
    if (playing) {
        if (canvas.clientWidth - window.innerWidth === window.scrollX){
            playPause();
        } else {
            window.scroll(window.scrollX + 10,0);
            setTimeout('pageScroll()', 17);
        }
    }
}

function toStart() {
    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
}