var audioContext = null;
var unlocked = false;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var current16thNote;        // What note is currently last scheduled?
var speed = 92.0;          // speed (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteResolution = 0;     // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;      // length of "beep" (in seconds)
var canvas,                 // the canvas element
    canvasContext;          // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages

var firstSample = null;
var otherSample = null;
//var nbBeats = null;
var beatsIndex = 0;
var sound = true;
var muted = false;
var muteButton = document.getElementById("muteButton");
muteButton.addEventListener("click", mute, false);

function mute() {
    muted = !muted;
    if (!muted) {
        muteButton.innerHTML =  "<i class='material-icons'>volume_up</i>";
    } else {
        muteButton.innerHTML =  "<i class='material-icons'>volume_mute</i>";
    }
}

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / speed;    // Notice this picks up the CURRENT 
                                          // speed value to calculate beat length.
    nextNoteTime += secondsPerBeat;    // Add beat length to last beat time

    current16thNote++;    // Advance the beat number, wrap to zero
    if (current16thNote == nbBeats[beatsIndex]) {
        current16thNote = 0;
        beatsIndex++;
    }
}

function scheduleNote( beatNumber, time ) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if (beatNumber % nbBeats[beatsIndex] === 0)
        playSample(audioContext, firstSample, time);
    else if (beatsIndex >= nbBeats.length) {
        return;
    } else {
        playSample(audioContext, otherSample, time);
    }
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( current16thNote, nextNoteTime );
        nextNote();
    }
}

function play() {
    if (sound) {
        if (!unlocked) {
            // play silent buffer to unlock the audio
            var buffer = audioContext.createBuffer(1, 1, 22050);
            var node = audioContext.createBufferSource();
            node.buffer = buffer;
            if ('webkitAudioContext' in window) {
                node.noteOn(0);
            }
              else {
                  node.start(0);
              }
            unlocked = true;
          }
      
          isPlaying = !isPlaying;
      
          if (isPlaying) { // start playing
              current16thNote = 0;
              nextNoteTime = audioContext.currentTime;
              timerWorker.postMessage("start");
              return "stop";
          } else {
              timerWorker.postMessage("stop");
              return "play";
          }
    }
}

async function getFile(audioContext, filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

async function setupSample(filePath) {
    const sample = await getFile(audioContext, filePath);
    return sample;
}

function playSample(audioContext, audioBuffer, time) {
    const sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = audioBuffer;
    sampleSource.connect(audioContext.destination)
    if ('webkitAudioContext' in window) {
        sampleSource.noteOn(time);
        sampleSource.noteOff(time + noteLength);
    }
    else if (!muted) {
        sampleSource.start(time);
        sampleSource.stop(time + noteLength);
    }
    return sampleSource;
}

function getSoundSafari(filePath, beat) {
    var request = new XMLHttpRequest();
    request.open('GET', filePath);
    request.responseType = "arraybuffer";
    request.addEventListener('load', beat, false);
    request.send();
}

function setupFirstSafari(event) {
    var request = event.target;
    firstSample = audioContext.decodeAudioData(request.response);
}

function setupOtherSafari(event) {
    var request = event.target;
    otherSample = audioContext.decodeAudioData(request.response);
}

function init(){
    // NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
    // Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
    // TO WORK ON CURRENT CHROME!!  But this means our code can be properly
    // spec-compliant, and work on Chrome, Safari and Firefox.
    if ('webkitAudioContext' in window) {
        sound = false;
        muteButton.parentNode.removeChild(muteButton);
        return;
    } else {
        audioContext = new AudioContext();        
        setupSample("/js/metronomeup.wav").then(sample => firstSample = sample);
        setupSample("/js/metronome.wav").then(sample => otherSample = sample);
    }

    timerWorker = new Worker("js/metronomeworker.js");

    timerWorker.onmessage = function(e) {
        if (e.data == "tick") {
            scheduler();
        }
    };
    timerWorker.postMessage({"interval":lookahead});
}

window.addEventListener("load", init );
