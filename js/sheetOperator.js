var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);
// TODO horizontal scroll stop criterium, niet te ver generaten, en niet te ver scrollen.
// Metronome?
// Split into separate pages to unclutter UI (UI moet er hetzelfde uitzien op elke page i guess.)
// Fix mobile sidenav...
document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);
document.getElementById("selectedSheetM").addEventListener("change", handleSheetSelect, false);

var sheetCanvas = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(sheetCanvas, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var sheetLoaded = false;
var sheetWidth = 0;

var scrollButton = document.getElementById("scrollButton");
var scrollButtonM = document.getElementById("scrollButtonM");
var scrollMode = "down";
scrollButton.addEventListener("click", setScrollMode, false);
scrollButtonM.addEventListener("click", setScrollMode, false);

function processSheet() {
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () { openSheetMusicDisplay.render();
                        sheetLoaded = true;
                        if (!scrollHor()){
                            setStaffBounds();
                            sheetCanvas.style.height = staffBounds[staffBounds.length - 1] + 300;
                        }});
}

function toXML(responseText) {
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
    sheetWidth = 0;

    for (i = 0; i < measures.length; i++) {
        sheetWidth += parseFloat(measures[i].getAttribute("width"));
        /*if (measures[i].getElementsByTagName("staff-distance").length > 0 && i > 0) {
            sheetWidth -= parseFloat(measures[i].getElementsByTagName("staff-distance")[0].childNodes[0].nodeValue);
        }*/

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

function setCanvasWidth() {
    if (scrollHor()) {
        sheetCanvas.style.width = sheetWidth;
        sheetCanvas.style.height = window.visualViewport.height - 200;
    } else {
        sheetCanvas.style.width = window.visualViewport.width - 17;
    }
}

function scrollHor() {
    return scrollMode === "forward";
}

function handleSheetSelect() {
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}

function setScrollMode() {
    if (scrollHor()) {
        scrollButton.innerHTML = 'Scroll <i class="material-icons right">arrow_downward</i>';
        scrollMode = "down"
    } else {
        scrollButton.innerHTML = 'Scroll <i class="material-icons right">arrow_forward</i>';
        scrollMode = "forward";
    }
    reloadSelectedSheet();
}

function reloadSelectedSheet() {
    if (sheetLoaded) {
        setCanvasWidth();
        openSheetMusicDisplay.render();
        if (!scrollHor()) {
            setStaffBounds();
        }
    }

}

var playing = false;
var scrolled = 0;
var playButton = document.getElementById("playButton");
playButton.addEventListener("click", playPause, false);

var tempo = 0;
var tempoSlider = document.getElementById("tempo");
var tempoSliderM = document.getElementById("tempoM");
tempoSlider.value = 92;
tempoSliderM.value = 92;
tempoSlider.addEventListener("change", setTempo, false);
tempoSliderM.addEventListener("change", setTempo, false);

setTempo();

function playPause() {
    playing = !playing;
    if (playing) {
        playButton.innerHTML = '<i class="material-icons">pause</i>';
        if (scrollHor()) {
            setMeasureBounds();
            calcScrollParams();
            setTimeout("scrollSmooth()", 3000);
        } else {
            scrollVertical();
        }     
    } else {
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

var measureBounds = [];

function setMeasureBounds() {
    measureBounds = new Array(1).fill(0);
    for (i = 0; i < measureDurs.length; i++) {
        measureBounds.push(openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].stave.end_x);
    }
}

var curIndex = 0;
var curLowBound = 0;
var curUppBound = 0;
var curIncrement = 0;
var scrolled = 0;
var frameDelay = 15;

function pageScroll() {
    if (playing) {
        if (sheetCanvas.clientWidth - window.innerWidth <= window.scrollX) {
            playPause();
        } else {
            if (window.scrollX < curLowBound || window.scrollX > curUppBound) {
                calcScrollParams();
            }
            scrolled += curIncrement;
            window.scroll(Math.round(scrolled), 0);
            setTimeout('pageScroll()', frameDelay);
        }
    }
}

function scrollSmooth() {
    if (playing) {
        if (sheetCanvas.clientWidth - window.visualViewport.width <= window.scrollX) {
            playPause();
        } else {
            curIndex += 1;
            $('html, body').animate({scrollLeft: measureBounds[curIndex]}, measureDurs[curIndex - 1] * 1000 * tempo);
            setTimeout('scrollSmooth()', measureDurs[curIndex - 1] * 1000 * tempo)
        }
    }
}

function calcScrollParams() {
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
}

function calcIndex() {
    curIndex = 0;
    while (measureBounds[curIndex + 1] < window.scrollX) {
        curIndex++;
    }
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
    tempoSliderM.value = tempoSlider.value;
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
var startButtonM = document.getElementById("backButtonM");
startButton.addEventListener("click", toStart, false);
startButtonM.addEventListener("click", toStart, false);

function toStart() {
    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}