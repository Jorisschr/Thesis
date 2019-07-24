/*var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);
document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);*/

/*var sheetCanvas = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(sheetCanvas, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var sheetLoaded = false;*/
var sheetWidth = 0;
//
var scrollTimer = null;

/*function processSheet() {
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () { 
        openSheetMusicDisplay.render();
        sheetLoaded = true;
        toStart();
    });
}*/

/*function toXML(responseText) {
    var parser = new DOMParser();
    return parser.parseFromString(responseText, "application/xml");
}

function initDocument(doc) {
    var measures = doc.getElementsByTagName("measure");
    extractMeasureData(measures);
    setCanvasWidth();
}

function extractMeasureData(measures) {
    measureDurs = [];
    nbBeats = [];
    sheetWidth = 0;

    for (i = 0; i < measures.length; i++) {
        sheetWidth += parseFloat(measures[i].getAttribute("width"));

        if (measures[i].getElementsByTagName("beats").length > 0) {
            var beats = parseInt(measures[i].getElementsByTagName("beats")[0].childNodes[0].nodeValue)
            var beatType = parseInt(measures[i].getElementsByTagName("beat-type")[0].childNodes[0].nodeValue)
            if (beats === 6 && beatType === 8) {
                measureDurs.push(0.5);
                nbBeats.push(2)
            } else {
                measureDurs.push(beats/beatType);
                nbBeats.push(beats);
            }
        } else if (measureDurs.length === 0) {
            measureDurs.push(1);
            nbBeats.push(1);
        } else {
            measureDurs.push(measureDurs[i-1]);
            nbBeats.push(nbBeats[i-1])
        }
    }
}

function setCanvasWidth() {
    sheetCanvas.style.width = sheetWidth;
}*/

/*function handleSheetSelect() {
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}*/

/*var playing = false;
var playButton = document.getElementById("playButton");
playButton.addEventListener("click", playPause, false);

var tempo = 0;
var tempoSlider = document.getElementById("tempo");
tempoSlider.value = 92;
tempoSlider.addEventListener("change", setTempo, false);

setTempo();*/

function playPause() {
    playing = !playing;
    if (playing) {
        playButton.innerHTML = '<i class="material-icons">pause</i>';
        setMeasureBounds();
        calcIndex();
        play();
        scrollTimer = setTimeout("scrollSmooth()", measureDurs[curIndex] * 1000 * tempo * 2);    
    } else {
        clearTimeout(scrollTimer);
        play();
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

var measureBounds = [];

function setMeasureBounds() {
    measureBounds = new Array(1).fill(0);
    for (i = 0; i < measureDurs.length; i++) {
        measureBounds.push(parseInt(openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].stave.end_x));
    }
}

var curIndex = 0;
//var curLowBound = 0;
//var curUppBound = 0;
//var curIncrement = 0;
//var frameDelay = 15;

/*function pageScroll() {
    if (sheetCanvas.clientWidth - window.innerWidth <= window.scrollX) {
        playPause();
    } else {
        if (window.scrollX < curLowBound || window.scrollX > curUppBound) {
            calcScrollParams();
        }
        scrolled += curIncrement;
        window.scroll(Math.round(scrolled), 0);
        scrollTimer = setTimeout('pageScroll()', frameDelay);
        }
}*/

function scrollSmooth() {
    if (window.scrollX + window.innerWidth >= measureBounds[measureBounds.length - 1]) {
        scrollTimer = setTimeout("playPause()", calcRestDuration());
        beatsIndex--;
    } else {
        curIndex += 1;
        $('html, body').animate({scrollLeft: measureBounds[curIndex]}, measureDurs[curIndex - 1] * 1000 * tempo);
        scrollTimer = setTimeout('scrollSmooth()', measureDurs[curIndex - 1] * 1000 * tempo)
    }
}

function calcRestDuration() {
    var dur = 0;
    for (i = beatsIndex - 1; i < measureDurs.length; i++) {
        dur += measureDurs[i];
    }
    return dur * tempo * 1000;
}

/*function calcScrollParams() {
   if (curLowBound < scrolled && scrolled < curUppBound + curIncrement) {
        curIndex++;
        curLowBound = curUppBound;
        curUppBound = measureBounds[curIndex + 1];
    } else {
        calcIndex();
        curLowBound = measureBounds[curIndex];
        curUppBound = measureBounds[curIndex + 1];
    }
    curIncrement = (curUppBound - curLowBound) / (measureDurs[curIndex] * tempo) * 0.015;
    scrolled = window.scrollX;
}*/

function calcIndex() {
    curIndex = 0;
    while (measureBounds[curIndex] < window.scrollX) {
        curIndex++;
    }
    beatsIndex = curIndex;
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
}

/*var staffBounds = [];
var lastMeasOnStaff = [];
var curStaff = 0;*/

var startButton = document.getElementById("backButton");
startButton.addEventListener("click", toStart, false);

function toStart() {
    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}