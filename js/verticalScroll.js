var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);
document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);

var sheetCanvas = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(sheetCanvas, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var sheetLoaded = false;
var scrollTimer = null;

function processSheet() {
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () { openSheetMusicDisplay.render();
        sheetLoaded = true;
        setStaffBounds();
        toStart();
    });
}

function toXML(responseText) {
    var parser = new DOMParser();
    return parser.parseFromString(responseText, "application/xml");
}

function initDocument(doc) {
    var measures = doc.getElementsByTagName("measure");
    extractMeasureData(measures);
}

function extractMeasureData(measures) {
    measureDurs = [];
    nbBeats = [];

    for (i = 0; i < measures.length; i++) {
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

function handleSheetSelect() {
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}

var playing = false;
var playButton = document.getElementById("playButton");
playButton.addEventListener("click", playPause, false);

var tempo = 0;
var tempoSlider = document.getElementById("tempo");
tempoSlider.value = 92;
tempoSlider.addEventListener("change", setTempo, false);

setTempo();

function playPause() {
    playing = !playing;

    if (playing) {
        calcCurStaff();
        play();
        playButton.innerHTML = '<i class="material-icons">pause</i>';
        scrollTimer = setTimeout("scrollVertical()", measureDurs[0] * 1000 * tempo);
  
    } else {
        clearTimeout(scrollTimer);
        play();
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
}

var staffBounds = [];
var lastMeasOnStaff = [];
var curStaff = 0;
var measureDurs;
var nbBeats;

function setStaffBounds() {
    staffBounds = [];
    lastMeasOnStaff = [];
    curStaff = 0;
    var index = -1;
    for (i = 0; i < openSheetMusicDisplay.GraphicSheet.MeasureList.length; i++) {
        if (openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].stave.y !== staffBounds[index]) {
            index++;
            staffBounds.push(openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].stave.y);
            lastMeasOnStaff.push(i);
        }
    }
}

function scrollVertical() {
    if (sheetCanvas.clientHeight - window.innerHeight <= window.scrollY){
        scrollTimer = setTimeout("playPause()", calcRestDuration());
    } else {
        var dur = calcStaffDuration();
        scrollTimer = setTimeout("scrollDown()", dur);
    }
}

function calcCurStaff() {
    curStaff = 0;
    for (i = 0; i < staffBounds.length; i++) {
        if (staffBounds[i] > window.scrollY) {
            curStaff = i;
            beatsIndex = lastMeasOnStaff[i];
            break;
        }
    }
}

function calcStaffDuration() {
    var dur = 0;
    for (i = lastMeasOnStaff[curStaff]; i < lastMeasOnStaff[curStaff + 1]; i++) {
        dur += measureDurs[i];
    }
    return dur * tempo * 1000;
}

function calcRestDuration() {
    var dur = 0;
    for (i = beatsIndex - 1; i < measureDurs.length; i++) {
        dur += measureDurs[i];
    }
    beatsIndex--;
    return dur * tempo * 1000;
}

function scrollDown() {
    curStaff++;
    $('body,html').animate({scrollTop: staffBounds[curStaff]}, 1000);
    scrollVertical();
}

var startButton = document.getElementById("backButton");
startButton.addEventListener("click", toStart, false);

function toStart() {
    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}