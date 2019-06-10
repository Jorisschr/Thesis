console.log("loaded loadSheet");
var oReq = new XMLHttpRequest();
oReq.addEventListener("load", processSheet);

var container = document.getElementById("osmdCanvas");
var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, { autoResize: true, drawingParameters: "compact", drawPartNames: false, disableCursor: false });
var loadedSheet = false;

document.getElementById("selectedSheet").addEventListener("change", handleSheetSelect, false);
document.getElementById("selectedSheetM").addEventListener("change", handleSheetSelect, false);

var measureBounds;
var measureDurs;
var measureWidths;

var debug = true;

var playButton = document.getElementById("playButton");
var playButtonM = document.getElementById("playButtonM");
var canvas = document.getElementById("osmdCanvas");
var playing = false;
playButton.addEventListener("click", scrollToMeasureLines, false);
playButtonM.addEventListener("click", playPause, false);

var startButton = document.getElementById("backButton");
var startButtonM = document.getElementById("backButtonM");
startButton.addEventListener("click", toStart, false);
startButtonM.addEventListener("click", toStart, false);

var tempo = 0;
var tempoSlider = document.getElementById("tempo");
var tempoSliderM = document.getElementById("tempoM");
tempoSlider.value = 92;
tempoSliderM.value = 92;
tempoSlider.addEventListener("change", setTempo, false);
tempoSliderM.addEventListener("change", setTempo, false);

setTempo();

var scrolled = 0;

/** var horizontalScroll = document.getElementById("horizontal");
horizontalScroll.addEventListener("change", setScroll, false);
var scrollHor = false;
setScroll();*/

var scrollButton = document.getElementById("scrollButton");
var scrollButtonM = document.getElementById("scrollButtonM");
var scrollMode = "down";
scrollButton.addEventListener("click", setScrollMode, false);
scrollButtonM.addEventListener("click", setScrollMode, false);


/*document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, options);
  });*/

function processSheet() {
    loadedSheet = true;
    var xmlDoc = toXML(this.responseText);
    initDocument(xmlDoc);

    /*if (scrollHor()) {
        initDocument(xmlDoc);
    } else {
        initDocument(xmlDoc);
        container.style.width = window.innerWidth;
    }*/

    /*if (!scrollHor()) {
        container.style.width = window.innerWidth;
    }*/

    openSheetMusicDisplay
    .load(this.responseText)
    .then(function () {
    openSheetMusicDisplay.render();
    //openSheetMusicDisplay.cursor.show();
    //openSheetMusicDisplay.cursor.next();
    });
    for (i = 0; i < 1; i++) {
        //console.log(openSheetMusicDisplay.GraphicSheet.MeasureList[i][0].PositionAndShape.BorderRight);
        console.log(openSheetMusicDisplay.GraphicSheet.MeasureList);
    }

}

function handleSheetSelect() {
    //console.log(loadedSheet);
    loadedSheet = document.getElementById("selectedSheet").value;
    //console.log(loadedSheet);
    oReq.open("GET", document.getElementById("selectedSheet").value);
    oReq.send();
}

function reloadSelectedSheet() {
    if (loadedSheet) {
        /*if (scrollHor()) {
            container.style.width = measureBounds[measureBounds.length - 1].toString() + "px";
        } else {
            container.style.width = window.innerWidth;
        }*/
        setCanvasWidth();
        openSheetMusicDisplay.render();
    }
}

function initDocument(doc) {
    var measures = doc.getElementsByTagName("measure");
    extractMeasureData(measures);
    /*var width = measureBounds[measureBounds.length - 1];
    if (scrollHor()) {
        container.style.width = width.toString() + "px";
    } else {
        container.style.width = window.innerWidth;
    }*/
    setCanvasWidth();
}

function setCanvasWidth() {
    if (scrollHor()) {
        container.style.width = measureBounds[measureBounds.length - 1].toString() + "px";
    } else {
        container.style.width = window.innerWidth - 17;
        console.log("height" + container.style.height);
    }
}

function toXML(responseText) {
    var parser = new DOMParser();
    return parser.parseFromString(responseText, "application/xml");
}

function extractMeasureData(measures) {
    measureBounds = [];
    measureDurs = [];
    measureWidths = [];
    var width = 0;

    for (i = 0; i < measures.length; i++) {
        measureWidths.push(parseFloat(measures[i].getAttribute("width")));


        if (measures[i].getElementsByTagName("staff-distance").length > 0 && i > 0) {
            measureWidths[i] -= parseFloat(measures[i].getElementsByTagName("staff-distance")[0].childNodes[0].nodeValue);
        }

        width += measureWidths[i];
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
    playButton.innerHTML = '<i class="material-icons">pause</i>';
    console.log("playbutton active")
    if (playing && scrollHor()) {
        scrolled = window.scrollX;
        setTimeout("pageScroll()", 3000);
        //setTimeout("scrollSmooth()",500);
    } else if (playing) {
        scrollVertical();
    } else {
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
    }
}

function scrollToMeasureLines() {
    playing = !playing;
    playButton.innerHTML = '<i class="material-icons">pause</i>';
    console.log("playbutton active")
    if (playing && scrollHor()) {
        scrolled = window.scrollX;
        //setTimeout("pageScroll()", 3000);
        setTimeout(scrollSmooth.bind(null, 0), 500);
    } else if (playing) {
        scrollVertical();
    } else {
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
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
            
            scrolled += measureWidths[index] / (measureDurs[index] * tempo) * 0.015;
            // TODO manual scrollen tijdens scroll door te checken of verschil met window.scrollX groot is.
            // Of automatisch stoppen wanneer user begint te scrollen.
            //scrolled += (measureWidths[index] + measureWidths[index + 1] + measureWidths[index + 2]) / (measureDurs[index] * tempo * 3) * 0.01;
            //window.scrollX + pxps * 0.025
            window.scroll(Math.round(scrolled),0);
            if (debug) {
                //console.log("pxps " + pxps * 0.025);
                //console.log("scrollX: " + window.scrollX);
                //console.log("scrolled would be: " + Math.floor(scrolled));
            }
            setTimeout('pageScroll()', 15);
        }
    }
}

function scrollSmooth(index) {
    if (playing) {
        if (canvas.clientWidth - window.innerWidth <= window.scrollX){
            playPause();
        } else {

            //
            //var index = getMeasureIndex();
            console.log("current measure index: " + index);
            var dur = measureDurs[index] * tempo;
            console.log("current measure durat: " + dur);
            var bound = measureBounds[index];
            var b = openSheetMusicDisplay.GraphicSheet.MeasureList[index][0].stave.end_x;


            $('body,html').animate({scrollLeft: b}, 1956);
            //$('body,html').animate({scrollLeft: 153}, dur*200);
            /*if (debug) {
                console.log(dur*000 + " milliseconds");
                console.log("index: " + index);
                console.log(window.scrollX);

            }*/
            setTimeout(scrollSmooth.bind(null, index+1), 1956);
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

function setTempo(normal) {
    if(normal) {
        console.log("normal");
        tempo = 4 * 60 / tempoSlider.value;
        tempoSliderM.value = tempoSlider.value;
        console.log(tempoSliderM.value);
    } else {
        console.log("mobile");
        tempo = 4 * 60 / tempoSliderM.value;
        tempoSlider.value = tempoSliderM.value;
        console.log(tempoSlider.value);
    }

}

function getMeasureIndex() {
    var index = 0;

    while (measureBounds[index] < window.scrollX + 1) {
        index++;
    }
    return index;
}

function scrollVertical() {
    if (playing) {
        if (canvas.clientHeight - window.innerHeight <= window.scrollY){
            playPause();
        } else {
            var nb = calcNbMeasuresInStaff();
            var timeout = nb * measureDurs[0] * tempo;

            setTimeout("scrollDown()", timeout*1000);
        }
    }
}

var staffHeight = 195;
var vertscrolled = 0
function scrollDown() {
    vertscrolled += staffHeight;
    $('body,html').animate({scrollTop: vertscrolled}, 1000);
    scrollVertical();
}

function calcNbMeasuresInStaff() {
    var w = window.innerWidth;
    var indices = 1;
    for (i = 0; i < measureBounds.length; i++) {
        if (measureBounds[i] > w*indices) {
            indices++;
        }
    }

    return measureDurs.length / indices;
}
    // measureBounds tellen tot ge een index hebt
    // voor elke tot ge aan de laatste index zitten en dan delen door het aantal gevonden indices... ofzoiets
    // dan hebt ge een gemiddeld getal aantal maten en dan kunnen we elke staff zolang laten duren.
function scrollHor() {
    return scrollMode === "forward";
}

function setScrollMode() {
    if (scrollMode === "down") {
        scrollButton.innerHTML = 'Scroll <i class="material-icons right">arrow_forward</i>';
        scrollMode = "forward";
    } else {
        scrollMode = "down"
        scrollButton.innerHTML = 'Scroll <i class="material-icons right">arrow_downward</i>';
    }
    reloadSelectedSheet();
}

/*var downb = document.getElementById("downButton");
downb.addEventListener("click", scrolld, false);

function scrolld() {
    window.scroll(window.scrollX + 197, 0);
}*/