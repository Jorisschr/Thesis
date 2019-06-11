var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);
document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);

var sheetCanvas = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(sheetCanvas, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var sheetLoaded = false;

function processSheet() {
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () { openSheetMusicDisplay.render();
                        sheetLoaded = true;
                        setStaffBounds();
                        sheetCanvas.style.height = staffBounds[staffBounds.length - 1] + 300;
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

    for (i = 0; i < measures.length; i++) {
        if (measures[i].getElementsByTagName("beats").length > 0) {
            measureDurs.push(parseFloat(measures[i].getElementsByTagName("beats")[0].childNodes[0].nodeValue) / 
                            parseFloat(measures[i].getElementsByTagName("beat-type")[0].childNodes[0].nodeValue));
        } else if (measureDurs.length === 0) {
            measureDurs.push(1);
        } else {
            measureDurs.push(measureDurs[i-1]);
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
        playButton.innerHTML = '<i class="material-icons">pause</i>';
        setTimeout("scrollVertical()", measureDurs[0] * 1000 * tempo);    
        //scrollVertical();   
    } else {
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
}

var staffBounds = [];
var lastMeasOnStaff = [];
var curStaff = 0;

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
    if (playing) {
        if (sheetCanvas.clientHeight - window.innerHeight <= window.scrollY){
            playPause();
        } else {
            var dur = calcStaffDuration();
            setTimeout("scrollDown()", dur);
        }
    }
}

function calcCurStaff() {
    curStaff = 0;
    for (i = 0; i < staffBounds.length; i++) {
        if (staffBounds[i] > window.scrollY + 1) {
            curStaff = i;
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

function scrollDown() {
    if (playing) {
        curStaff++;
        $('body,html').animate({scrollTop: staffBounds[curStaff]}, 1000);
        scrollVertical();
    }
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