var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);

var container = document.getElementById("osmdCanvas");
//, drawingParameters: "compact"
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, { autoResize: false, drawingParameters: "compact", drawPartNames: false, disableCursor: false });

document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);

var measureBounds;
var measureDurs;
var measureWidths;

// TODO: betere default zetten...

var debug = true;


var playButton = document.getElementById("playButton");
var canvas = document.getElementById("osmdCanvas");
var playing = false;
playButton.addEventListener("click", playPause, false);

var startButton = document.getElementById("startButton");
startButton.addEventListener("click", toStart, false);

var tempoSlider = document.getElementById("tempo");
tempoSlider.addEventListener("change", setTempo, false);
tempoSlider.value = 92;
setTempo();

var scrolled = 0;

function processSheet() {
    var xmlDoc = toXML(this.responseText);
    setCanvasWidth(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () {
    openSheetMusicDisplay.render();
    //openSheetMusicDisplay.cursor.show();
    //openSheetMusicDisplay.cursor.next();
    });
}

function handleSheetSelect() {
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}

function setCanvasWidth(doc) {
    var measures = doc.getElementsByTagName("measure");
    calculateMeasureDuration(measures);
    var width = 0;
    for (i=0; i < measures.length; i++) {
        width += parseFloat(measures[i].getAttribute("width"));
    }
    container.style.width = width.toString() + "px";
}

function toXML(responseText) {
    var parser = new DOMParser();
    return parser.parseFromString(responseText, "application/xml");
}

function calculateMeasureDuration(measures) {
    measureBounds = [];
    measureDurs = [];
    measureWidths = [];
    var width = 0;

    for (i = 0; i < measures.length; i++) {
        measureWidths.push(parseFloat(measures[i].getAttribute("width")));
        width += parseFloat(measures[i].getAttribute("width"));
        measureBounds.push(width);

        if (measures[i].getElementsByTagName("beats").length > 0) {
            measureDurs.push(parseFloat(measures[i].getElementsByTagName("beats")[0].childNodes[0].nodeValue) / 
                            parseFloat(measures[i].getElementsByTagName("beat-type")[0].childNodes[0].nodeValue));
        } else if (measureDurs.length === 0) {
            measureDurs.push(1);
        } else {
            measureDurs.push(measureDurs[i-1]);
        }
    }

    if (debug) {
        console.log("measureWidths: " + measureWidths);
        console.log("measureBounds: " + measureBounds);
        console.log("scrollX: " + window.scrollX);
    }
}

function playPause() {
    playing = !playing;
    if (playing) {
        playButton.innerHTML = 'Pause <i class="material-icons left">pause_circle_filled</i>';
        scrolled = window.scrollX;
        setTimeout("pageScroll()", 3000);
        //setTimeout("scrollSmooth()",3000);
    } else {
        playButton.innerHTML = 'Play <i class="material-icons left">play_circle_filled</i>';
    }
}

// TODO: tempo setting
function pageScroll() {
    if (playing) {
        if (canvas.clientWidth - window.innerWidth <= window.scrollX){
            playPause();
        } else {

            //
            var index = getMeasureIndex();
            //var dur = measureDurs[index] * tempo;
            //var pxps = measureWidths[index] / (measureDurs[index] * tempo);
            //
            //scrolled += pxps*0.025;
            //console.log(index);
            //console.log(measureWidths[0] + measureWidths[1]);
            scrolled += (measureWidths[index] + measureWidths[index + 1] + measureWidths[index + 2]) / (measureDurs[index] * tempo * 3) * 0.025;
            //window.scrollX + pxps * 0.025
            window.scroll(Math.round(scrolled),0);
            if (debug) {
                //console.log("pxps " + pxps * 0.025);
                //console.log("scrollX: " + window.scrollX);
                //console.log("scrolled would be: " + Math.floor(scrolled));
            }
            setTimeout('pageScroll()', 25);
        }
    }
}

function scrollSmooth() {
    if (playing) {
        if (canvas.clientWidth - window.innerWidth <= window.scrollX){
            playPause();
        } else {

            //
            var index = getMeasureIndex();
            var dur = measureDurs[index] * tempo;
            var bound = measureBounds[index];

            $('body,html').animate({scrollLeft: measureBounds[index]}, dur*200);
            if (debug) {
                console.log(dur*1000 + " milliseconds");
                console.log("index: " + index);
                console.log(window.scrollX);

            }
            setTimeout('scrollSmooth()', dur*1000);
            /*var index = getMeasureIndex();
            var dur = measureDurs[index] * tempo;
            $('body,html').animate({scrollLeft: canvas.clientWidth - window.innerWidth}, dur*measureBounds.length*1000);*/

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

function getMeasureIndex() {
    var index = 0;

    while (measureBounds[index] < window.scrollX + 1) {
        index++;
    }
    return index;
}
