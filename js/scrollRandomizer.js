var toBeTested = ["Vertical","VerticalWait", "Horizontal", "MultiHorizontal", "HorizontalWait"];
var currentInterface;

var nextButton = document.getElementById("nextButton");
nextButton.addEventListener("click", testNextInterface, false);

var played = true;

var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);
document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);

var sheetCanvas = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(sheetCanvas, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var sheetLoaded = false;
var sheetWidth = 0;
var scrollTimer = null;

var playing = false;
var playButton = document.getElementById("playButton");
playButton.addEventListener("click", playPause, false);

var tempo = 0;
var tempoSlider = document.getElementById("tempo");
tempoSlider.value = 92;
tempoSlider.addEventListener("change", setTempo, false);

var startButton = document.getElementById("backButton");
startButton.addEventListener("click", toStart, false);

var staffBounds = [];
var lastMeasOnStaff = [];
var curStaff = 0;
var measureDurs;
var nbBeats;

var measureBounds = [];

var curIndex = 0;

var interfaceText = document.getElementById("interface");

testNextInterface();
setTempo();

function testNextInterface() {
    if (played) {
        played = !played;
        if (toBeTested.length) {
            currentInterface = toBeTested.splice(Math.floor(Math.random()*toBeTested.length), 1)[0];
            interfaceToNum();
            if (!toBeTested.length) {
                nextButton.outerHTML = '';
            }
        } 
        console.log(currentInterface);
        loadInterface();
    } else {
        alert("Please test this interface first!");
    }
}

function interfaceToNum() {
    if (currentInterface == "Vertical") {
        interfaceText.innerHTML = "INTERFACE: 1";
    } else if (currentInterface == "VerticalWait") {
        interfaceText.innerHTML = "INTERFACE: 2";
    } else if (currentInterface == "Horizontal") {
        interfaceText.innerHTML = "INTERFACE: 3";
    } else if (currentInterface == "HorizontalWait") {
        interfaceText.innerHTML = "INTERFACE: 4";
    } else if (currentInterface == "MultiHorizontal") {
        interfaceText.innerHTML = "INTERFACE: 5";
    }
}

function loadInterface() {
    setCanvasWidth();
    if (sheetLoaded) {
        openSheetMusicDisplay.render();
        setMeasureBounds();
        fixSheetWidth();
    }
    if (currentInterface == "Vertical" || currentInterface == "VerticalWait") {
        startButton.innerHTML = '<i class="material-icons">arrow_upward</i>';
    } else {
        startButton.innerHTML = '<i class="material-icons">arrow_back</i>';
    }
}

function handleSheetSelect() {
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}

function processSheet() {
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () { openSheetMusicDisplay.render();
        sheetLoaded = true;
        setStaffBounds();
        setMeasureBounds();
        if (currentInterface != "Vertical" && currentInterface != "VerticalWait") {
            fixSheetWidth();
        }
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
    if (currentInterface == "Vertical" || currentInterface == "VerticalWait") 
        sheetCanvas.style.width = window.innerWidth;
    else 
        sheetCanvas.style.width = sheetWidth;
}

function setTempo() {
    tempo = 4 * 60 / tempoSlider.value;
}

function toStart() {
    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
}

function playPause() {
    playing = !playing;

    if (playing) {
        play();
        playButton.innerHTML = '<i class="material-icons">pause</i>';

        if (currentInterface == "Vertical") {
            calcCurStaff();
            scrollTimer = setTimeout("scrollVertical()", measureDurs[0] * 1000 * tempo);
        } if (currentInterface == "VerticalWait") {
            calcCurStaff();
            nbMeasures = calcVerWaitMeasures();
            scrollTimer = setTimeout("scrollVertical()", measureDurs[0] * 1000 * tempo * (1 + nbMeasures));
        } if (currentInterface == "Horizontal") {
            calcIndex();
            scrollTimer = setTimeout("scrollSmooth()", measureDurs[curIndex] * 1000 * tempo * 2);   
        } if (currentInterface == "HorizontalWait") {
            calcIndex();
            nbMeasures = calcHorWaitMeasures();
            console.log(nbMeasures);
            scrollTimer = setTimeout("scrollSmooth()", measureDurs[curIndex] * 1000 * tempo * (1 + nbMeasures));   
        } if (currentInterface == "MultiHorizontal") {
            calcIndex();
            nbMeasures = calcMultiHorMeasures();
            scrollTimer = setTimeout("scrollMultiSmooth()", measureDurs[curIndex] * 1000 * tempo * (1 + nbMeasures));   
        }
    
    } else {
        played = true;
        clearTimeout(scrollTimer);
        play();
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

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
        scrollTimer = setTimeout("playPause()", calcRestVertDuration());
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

function calcRestVertDuration() {
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

function setMeasureBounds() {
    measureBounds = new Array(1).fill(0);
    for (i = 0; i < measureDurs.length; i++) {
        measureBounds.push(parseInt(openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].stave.end_x));
    }
    console.log(measureBounds);
}

function fixSheetWidth() {
    var indexOfMaxValue = measureBounds.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    if (indexOfMaxValue < measureBounds.length - 1) {
        sheetWidth += measureBounds[measureBounds.length - 1];
        setCanvasWidth();
        openSheetMusicDisplay.render();
        setMeasureBounds();
    }
    console.log(indexOfMaxValue);
}

function scrollSmooth() {
    if (window.scrollX + window.innerWidth >= measureBounds[measureBounds.length - 1]) {
        scrollTimer = setTimeout("playPause()", calcRestHorDuration());
        beatsIndex--;
    } else {
        curIndex += 1;
        $('html, body').animate({scrollLeft: measureBounds[curIndex]}, measureDurs[curIndex - 1] * 1000 * tempo);
        scrollTimer = setTimeout('scrollSmooth()', measureDurs[curIndex - 1] * 1000 * tempo)
    }

}

function scrollMultiSmooth() {
    if (window.scrollX + window.innerWidth >= measureBounds[measureBounds.length - 1]) {
        scrollTimer = setTimeout("playPause()", calcRestHorDuration());
        beatsIndex--;
    } else {
        nbMeasures = calcMultiHorMeasures();
        console.log(measureDurs);
        console.log(curIndex);
        var duration = measureDurs.slice(curIndex, curIndex + nbMeasures).reduce((a,b) => a + b, 0)
        curIndex += nbMeasures;
        scrollDuration = duration;
        console.log("duration: " + duration);
        if (nbMeasures > 1) {
            scrollDuration = duration/2;
        }
        $('html, body').animate({scrollLeft: measureBounds[curIndex]}, scrollDuration * 1000 * tempo);

        scrollTimer = setTimeout('scrollMultiSmooth()', duration * 1000 * tempo)
    }
}

function calcRestHorDuration() {
    var dur = 0;
    for (i = beatsIndex - 1; i < measureDurs.length; i++) {
        dur += measureDurs[i];
    }
    return dur * tempo * 1000;
}

function calcIndex() {
    curIndex = 0;
    while (measureBounds[curIndex] < window.scrollX) {
        curIndex++;
    }
    beatsIndex = curIndex;
}

function calcHorWaitMeasures() {
    nbMeasures = Math.floor(measureDurs.length / Math.floor(sheetWidth / window.innerWidth) / 2);
    if (nbMeasures) {
        return nbMeasures;
    } return 1;
}

function calcMultiHorMeasures() {
    var index = curIndex;
    while (measureBounds[index] < window.scrollX + window.innerWidth && index < measureBounds.length) {
        index++;
    }
    nbMeasures = Math.floor((index - curIndex)/2);
    console.log(nbMeasures);
    if (nbMeasures) {
        return nbMeasures;
    }
    return 1;
}

function calcVerWaitMeasures() {
    var nbMeasures = Math.floor(measureDurs.length / staffBounds.length / 2);
    console.log(nbMeasures);
    if (nbMeasures) {
        return nbMeasures;
    }
    return 1;
}