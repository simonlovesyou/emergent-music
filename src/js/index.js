import teoria from 'teoria';
import np from 'noteplayer';
import Tock from 'tocktimer';
import Soundfont from 'soundfont-player';
import MarkovChain from 'markovchain-generate'; 
import shuffle from 'shuffle-array';
const context = new AudioContext();
const soundFont = new Soundfont(context);
let piano;
let song = [];
let numberOfMoves = 0;
let instrument = 'gunshot';


/*Class note. A note contains a note, frequency, the duration of the note, chordwill and placement.*/
class Note {
  constructor (note, duration, chordwill, placement) {
    if(note !== '') {
      this.note = new teoria.note(note);
      this.octave = note.match(/\d/)[0]-3;
      this.freq = this.note.fq();
    }
    this.rules;
    this.duration = duration; 
    this.chordwill = chordwill;  
    this.position = placement;
    this.fieldOfView = [];
    this.lastPosition = this.position;
  }

  noteDuration(note, bpm) {
    return 240000/bpm*note; 
  }

  giveVision(length) {
    this.vision = length;
  }

  giveNotesInVision(notesInVision) {
    this.fieldOfView = notesInVision;
  }

  givePosition(pos) {
    this.position = pos;
  }

  giveRules(rules) {
    this.rules = rules;
  }

  move() {
    let currentPos = this.position;
    this.lastPosition = currentPos;

    let newPosition = currentPos;

    //console.log("I, %s,  can see these notes:", this.note.name());
    //console.log(this.fieldOfView.map(n => n.note.name() + " " + n.position).join(' '));

    this.rules.some(rule => {
      return this.fieldOfView.some(note => {


        if(rule.note.name() === note.note.name() && rule.duration === note.duration) {
          //console.log(this.note.name() +": " + note.note.name() + " is my favourite");
          //console.log(note.note.name() +"s position is " +note.position);
          if((currentPos + 1) === note.position) {
            newPosition = currentPos
          } else if(note.position < currentPos) {
            newPosition = note.position;
          } else if(note.position > currentPos) {
            //console.log("Hej :)");
            newPosition = note.position-1;
            //console.log("I want to position myself at " + (note.position-1));
          }
          
          return true;
        } else return false;
      });
    });


    if(newPosition !== currentPos) {
      song.some(n => {
        //Push all notes backwards from the favourite notes position to this notes position
        if(n.position >= newPosition && n.position < currentPos) {
          //console.log("%s is giving %s new position from %s to %s", this.note.name(), n.note.name(), n.position+1, currentPos);
          n.givePosition(n.position+1);
          return true;
        }

        //Push all notes forward from the favourite notes position to this notes position
        //console.log("%s %s %s", n.position, newPosition, currentPos);
        if(n.position <= newPosition && n.position > currentPos) {
          //console.log("%s is giving %s new position from %s to %s", this.note.name(), n.note.name(), n.position, currentPos);
          n.givePosition(n.position-1);
          return true;
        }
        return false;
      });
    }

    //console.log(currentPos, newPosition);
    //console.log('\n');

    if(currentPos !== newPosition) {
      numberOfMoves++;
    }

    this.position = newPosition;



  }

  play(duration, start) {

    if(this.note) {
      piano.play(this.note.name() + this.octave, 0, duration);
    }
  }
}

/*A bar contains a set of notes.*/
class Bar {
  constructor(notes) {
    this.notes = notes;
  }

  /*Plays a bar containing a set of different notes*/
  play(bpm) {
    let start = 0;
    this.notes.forEach((note) => {

      let duration = this.noteDuration(note.duration, bpm);

      setTimeout(() => {
        note.play(duration, start);
      }, start);

      start += duration;
    });
  }

  /*Returns the total duration all the notes*/
  getTotalDuration() {
    let duration = 0;
    this.notes.forEach((note) => {
      duration += note.duration;
    });
    return duration;
  }

  noteDuration(note, bpm) {
    return 240000/bpm*note; 
  }
}


class Section {
  constructor(bars) {
    this.bars = bars
  }

  play(bpm) {
    let start = 0;
    this.bars.forEach((bar) => {
      let duration = this.barDuration(bpm);

      setTimeout(() => {
        bar.play(bpm);
      }, start);
      start += duration;
    })
  }

  barDuration(bpm) {
    return 240000/bpm
  }
}

//Visar hur vi annars skapar notes, bars och sections.

/*const n = new Note('c4', 0.5); 
const n3 = new Note('d4', 0.25);
const n4 = new Note('b4', 0.25);
const n5 = new Note('g4', 1);

const b = new Bar([n, n3, n4]);
const b2 = new Bar([n5]);
const b3 = new Bar([n4, n, n3]);

const m1 = new Section([b, b2, b3]);
const m2 = new Section([b2, b, b2]);
*/
//m1.play(120);
//m2.play(120);

var xhr = new XMLHttpRequest();
xhr.open("GET", 'http://localhost:8080/assets/txt/supermario.txt');

xhr.send();
xhr.onreadystatechange = function() {
  if(xhr.readyState === 4 && xhr.status === 200) {

    var data = xhr.responseText;

    data = data.split('\n').map(d => d.split(' '));

    data = data.map(d => ({action: d[0], note: d[1], time: d[2]}));

    let section = [[]];    

    let duration = 0;

    for(let i = 0; i < data.length; i++) {
      if(data[i].action === 'ON') {
        let start = parseFloat(data[i].time);
        //Assumes that every other note is off
        let stop = parseFloat(data[i+1].time);
        duration += Math.abs((start-stop));

        if(duration <= 1) {
          section[section.length-1].push(new Note(data[i].note, Math.abs(start-stop)));
        } else {
          section.push([]);
          duration = 0;
        }
      } 
    }

    //Create bars out of all notes into the section array
    section = new Section(
      section.map(s => 
        new Bar(s.map(n => n))
      )
    );

    //Push all notes from all bars to notes array
    section.bars.forEach(bar => song.push(...bar.notes));

    /*song.forEach((n) => {
      console.log(n.duration);
    });*/

    console.log(song.length);

    song = song.filter(n => n.note);

    //Merge all notes to sentences
    let merged = song.filter(n => n.duration > 0)
                 .map(n => n.duration + "-" + n.note.name() + n.octave)
                 .join(' ');

    merged = merged.replace(/\./g, 'q');

    let chain = new MarkovChain(); 
    chain.generateChain(merged); 

    //Markov probabilites for all notes
    const probabilities = JSON.parse(chain.dump());

    //Give the rules for all notes
    song.forEach(n => setNoteRules(probabilities, n));

    song = song.filter(n => n.duration > 0);

    shuffle(song);

    //Give the notes their current position
    song.forEach((n, i) => n.givePosition(i));

    //Give the notes their vision
    song.forEach(n => n.giveVision(5));

    /*song = [];

    c = new Note('c4', 1/4);
    c.giveRules([new Note('e4', 1/4)]);

    d = new Note('d4', 1/4);
    d.giveRules([new Note('f#4', 1/4)]);

    e = new Note('e4', 1/4);
    e.giveRules([new Note('f4', 1/4)]);

    f = new Note('f4', 1/4);
    f.giveRules([new Note('g4', 1/4)]);

    g = new Note('g4', 1/4);
    g.giveRules([new Note('a4', 1/4)]);

    a = new Note('a4', 1/4);
    a.giveRules([new Note('b4', 1/4)]);

    b = new Note('b4', 1/4);
    b.giveRules([new Note('c4', 1/4)]);

    song = [a,b,c,d,e,f,g];

    //shuffle(song);



    song.forEach((n, i) => {
      n.givePosition(i);
      n.giveVision(2);
      console.log(n.note.name() + " " + n.position);
    });*/

    console.log(song);

    //instrument = instrumental(); 

    readyPiano(instrument);

  }
}

/*Function to choose instrument from the dropdown list*/
function instrumental(){
  let selectID = document.getElementById("instrumentDrop");
  let instrument = selectID.options[selectID.selectedIndex].value;
  readyPiano(instrument);
}


/*Function to set up the piano*/
function readyPiano(instrument){

  console.log(instrument);
  song.sort((n1, n2) => (n1.position < n2.position) ? -1 : 1);

  console.log(song.map(n => n.note.name() + n.position).join(' '));

  //Load instrument as a soundfount
  piano = soundFont.instrument(instrument);
  document.querySelector('#play').innerHTML = 'Loading...';
  document.querySelector('#play').disabled = true;
  piano.onready(() => {
    document.querySelector('#play').innerHTML = 'Play';
    document.querySelector('#play').disabled = false;
  });
}

function iteration() {

  let iterations = document.querySelector('#NoOfIterations').value || 100;

  let graphData = [];

  iterate(iterations, function(iteration) {
    song.forEach(n => {
      setFieldOfView(n);
      n.move();
    });
    song.sort((n1, n2) => (n1.position < n2.position) ? -1 : 1);
    graphData.push({iteration, numberOfMoves});

    numberOfMoves = 0;
  });

  

  console.log("Start");

  window.graph(graphData);

}

let playing = false;

function play() {

  let speed = document.querySelector('#speedInput').value;
  let start = 0;

  console.log(speed);
  //Iterate through all notes
  song.forEach((note) => {

    //Duration for current note
    let duration = noteDuration(note.duration, speed);  //note measure, bpm
    //Play the note after a certain amount of time
    //console.log(note.duration + note.note.name());

    setTimeout(() => note.play(duration, start), start);
    
    

    start += duration;

  });

}

function iterate(numberOfTimes, cb) {
  for(let i = 0; i < numberOfTimes; i++) {
    cb(i);
  }
}

function setFieldOfView(n) {
  let vision = n.vision;
  let pos = n.position;

  //console.log("Vision: " + vision);
  //console.log("Position: " + pos);

  let fieldOfView = song.filter(f => {
    if(f.position >= (pos-vision) && f.position <= (pos+vision) && f.position !== pos) {
      //console.log("f.position: %s, (pos-vision): %s, (pos+vision): %s", f.position, (pos-vision), (pos+vision));
      return true;
    } else return false;
  });

  n.giveNotesInVision(fieldOfView);
}

function setNoteRules(probabilities, n) {
  let objKey = (n.duration + "-" + n.note.name() + n.octave).replace(/\./g, 'q');
  let ruleNotes = probabilities[objKey];
  let keys = [];
  for(let ruleKey in ruleNotes) {
    if(ruleNotes.hasOwnProperty(ruleKey)) {
      if(ruleKey !== '<ENDSTR>') {
        keys.push({note: ruleKey.replace(/q/g, '.'), prob: ruleNotes[ruleKey]});
      } 
    }
  }
  keys.sort((n1, n2) => (n1.prob > n2.prob) ? -1 : 1);

  keys = keys.map(n => new Note(n.note.match(/([a-g]\d)/g)[0], parseFloat(n.note.match(/(\d\.\d*)/g)[0])));
  n.giveRules(keys);
}

function noteDuration(note, bpm) {
  return 240000/bpm*note; 
}