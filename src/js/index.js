import teoria from 'teoria';
import Soundfont from 'soundfont-player';
import MarkovChain from 'markovchain-generate'; 
import markov from 'markov';
import {JaroWinklerDistance} from 'natural';
import {shuffle} from 'shuffle'
import srand from 'random-seed';
import {randomBytes} from 'crypto';
const context = new AudioContext();
const soundFont = new Soundfont(context);
let song = [];
let numberOfMoves = 0;
let instrument = 'gunshot';
let inputSongString = '';
let songString = '';
let lanes = [];

/*Class note. A note contains a note, frequency, the duration of the note, chordwill and placement.*/
class Note {
  constructor (note, duration, chordwill, placement) {
    if(note !== '') {
      this.note = new teoria.note(note);
      this.octave = note.match(/\d/)[0]-3;
      this.freq = this.note.fq();
    }
    this.rules;
    this.coupleRules;
    this.duration = duration; 
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

  giveRules(rules, order) {
    if(order === 1) {
      this.rules = rules;
    } else if(order === 2) {
      this.coupleRules = rules;
    }
  }

  move() {
    let currentPos = this.position;
    this.lastPosition = currentPos;

    let newPosition = currentPos;
    let foundCouple = false;
    let doOrder2 = document.querySelector('#Order2').checked;

    if(doOrder2 && this.coupleRules && this.coupleRules.length === 2) {
      let rule = this.coupleRules;
      foundCouple = this.fieldOfView.some((note, i, notes) => {
        if(i < this.fieldOfView.length - 1 && i > 0) {
          if(rule[0].note.name() === note.note.name() && rule[1].note.name() === notes[i+1].note.name() &&
            rule[0].duration === note.duration && rule[1].duration === notes[i+1].duration) {
            //console.log(note.note.name(), notes[i+1].note.name());


            if((currentPos + 1) === note.position) {
              newPosition = currentPos
            } else if(note.position < currentPos) {
              newPosition = note.position;
            } else if(note.position > currentPos) {
              newPosition = note.position-1;
            }
            return true;
          }
        } else {
          return false;
        }
      });
    }

    if(!foundCouple) {
      this.rules.some(rule => this.fieldOfView.some(note => {
        if(rule.note.name() === note.note.name() && rule.duration === note.duration) {
          if((currentPos + 1) === note.position) {
            newPosition = currentPos
          } else if(note.position < currentPos) {
            newPosition = note.position;
          } else if(note.position > currentPos) {
            newPosition = note.position-1;
          }
          return true;
        } else return false;
      }));
    }


    if(newPosition !== currentPos) {
      song.some(n => {
        //Push all notes backwards from the favourite notes position to this notes position
        if(n.position >= newPosition && n.position < currentPos) {
          n.givePosition(n.position+1);
          return true;
        }

        //Push all notes forward from the favourite notes position to this notes position
        if(n.position <= newPosition && n.position > currentPos) {
          n.givePosition(n.position-1);
          return true;
        }
        return false;
      });
    }

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

var xhr2 = new XMLHttpRequest();
xhr2.open("GET",'http://localhost:8080/assets/txt/instruments.txt');
xhr2.send();

document.addEventListener('DOMContentLoaded', () => {
  xhr2.onreadystatechange = function() {
    if(xhr2.readyState === 4 && xhr2.status === 200) {
      let data = xhr2.responseText;
      let select = document.querySelector('#instrumentDrop');
      data.split('\n').forEach(d => {

        let option = document.createElement('option');
        option.value = d;
        let prettyText = d.replace(/\_/g, ' ');
        option.text = prettyText.charAt(0).toUpperCase() + prettyText.slice(1);
        console.log({element: select});
        select.add(option, select.length);
      });
      let option = document.createElement('option');
      option.value = 'acoustic_grand_piano';
      option.text = 'Acoustic grand piano (default)';
      select.add(option, 0);
      select.selectedIndex = 0;
    }

  }
});

var xhr = new XMLHttpRequest();

function getSong() {

  let songName = document.querySelector('#songSelect').value;
  xhr.open("GET",'http://localhost:8080/assets/txt/' + songName + ".txt");

  xhr.send();
}

xhr.onreadystatechange = function() {
  if(xhr.readyState === 4 && xhr.status === 200) {

    document.querySelector('#iterate').disabled = false;
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

    song = song.filter(n => n.note);

    setGraphLanes();

    //Merge all notes to sentences
    inputSongString = song.filter(n => n.duration > 0)
                 .map(n => n.duration + "-" + n.note.name() + n.octave)
                 .join(' ');


    merged = inputSongString.replace(/\./g, 'q');

    let chain = new MarkovChain(); 
    chain.generateChain(merged); 
    let m = markov(2);

    m.seed(merged);

    let coupleProb = m.db();

    let tempProb = {};
    for(var key in coupleProb) {
      let formatedKey = key.match(/\dq\d*_.\d_(\dq\d*_.\d)/) ? key.match(/\dq\d*_.\d_(\dq\d*_.\d)/)[1] : '';
      if(formatedKey) {
        for(var notes in coupleProb[key].next) {
          if(notes.match(/\dq\d*_.\d/g)) {
            notes = notes.match(/\dq\d*_.\d/g).map(note => note.replace('_', '-'));
            tempProb[formatedKey.replace('_', '-')] = notes
          }
        }
      }
    }

    coupleProb = tempProb;

    //Markov probabilites for all notes
    const probabilities = JSON.parse(chain.dump());

    //Give the rules for all notes
    song.forEach(n => setNoteRules(probabilities, n, 1));
    song.forEach(n => setNoteRules(coupleProb, n, 2));

    song = song.filter(n => n.duration > 0);

  }
}

document.addEventListener('DOMContentLoaded', () => {
  readyPiano();
})

/*Function to choose instrument from the dropdown list*/
function instrumental() {
  let selectID = document.getElementById("instrumentDrop");
  let instrument = selectID.options[selectID.selectedIndex].value;
  readyPiano(instrument);
}

function calculateDistance(input) {
  songString = '';
  if(input) {
    songString = input.map(n => n.duration + "-" + n.note.name() + n.octave).join(' ');
  }
  return JaroWinklerDistance(songString, inputSongString);
}

/*Function to set up the piano*/
function readyPiano(instrument){

  piano = soundFont.instrument(instrument || 'acoustic_grand_piano');
}

function iteration() {

  song = shuffleSong();
  //Give the notes their current position
  let iterations = document.querySelector('#NoOfIterations').value || 100;
  setVision();
  setPosition();

  let graphData = [];
  let songDistance = [];

  iterate(iterations, (iteration) => {
    song.forEach(n => {
      setFieldOfView(n);
      n.move();
    });
    song.sort((n1, n2) => (n1.position < n2.position) ? -1 : 1);
    graphData.push({iteration, data: numberOfMoves});
    if(song) {
      songDistance.push({iteration, data: parseFloat(calculateDistance(song))});
    }
    numberOfMoves = 0;
  });

  document.querySelector('#play').disabled = false;

  console.log("Start");
  calculateDistance();

  window.graph('Number of moves', graphData);
  window.graph('Song similarity', songDistance);
  window.graphTimeline(lanes, getDuration(song));

}

function play() {

  let bpm = document.querySelector('#speedInput').value;
  let start = 0;

  //Iterate through all notes
  song.forEach((note) => {
    //Duration for current note
    let duration = noteDuration(note.duration, bpm);  //note measure, bpm
    //Play the note after a certain amount of time
    //console.log(note.duration + note.note.name());

    setTimeout(() => note.play(duration, start), start);

    start += duration;
  });
}

function shuffleSong() {
  let seedElement = document.querySelector('#seed');
  
  if(!seedElement.value) {
    seedElement.value = randomBytes(8).toString('hex');
  }
  let seed = seedElement.value;
  let rand = srand.create(seed);

  return shuffle({deck: song, random: () => { return rand.random(); }}).cards;

}

function getDuration(input) {
  let speed = document.querySelector('#speedInput').value
  let start = 0;
  let data = [];

  input.forEach((note) => {

    //Duration for current note
    let duration = noteDuration(note.duration, speed);

    data.push({y: note.note.name() + note.octave, x0: start, x1: start+duration});

    start += duration;

  });
  return data;
}

function iterate(numberOfTimes, cb) {
  for(let i = 0; i < numberOfTimes; i++) {
    cb(i);
  }
}

function setVision() {
  let v = parseInt(document.querySelector('#vision').value) || 2;
  song.forEach(n => n.giveVision(v));
}

function setFieldOfView(n) {
  let vision = n.vision;
  let pos = n.position;

  let fieldOfView = song.filter(f => {
    if(f.position >= (pos-vision) && f.position <= (pos+vision) && f.position !== pos) {
      return true;
    } else return false;
  });

  n.giveNotesInVision(fieldOfView);
}

function setPosition() {
  song.forEach((n, i) => n.givePosition(i));
}

function setNoteRules(probabilities, n, order) {
  let objKey = (n.duration + "-" + n.note.name() + n.octave).replace(/\./g, 'q');
  if(order === 1) {
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

    keys = keys.map(n => new Note(n.note.match(/([a-g]-?\d)/g)[0], parseFloat(n.note.match(/(\d\.\d*)/g)[0])));
    n.giveRules(keys, 1);
  } else if(order === 2 && probabilities[objKey]) {

    let keys = probabilities[objKey].map(n => n.replace('q', '.'));

    keys = keys.map(n => {
      //console.log(n);
      if(n.match(/([a-g]\d)/g)[0]) {

        return new Note(n.match(/([a-g]\d)/g)[0], parseFloat(n.match(/(\d\.\d*)/g)[0]))
      } else return;
    });

    keys = keys.filter(n => n);
    n.giveRules(keys, 2);

  }
}

function setGraphLanes() {
  song.forEach(n => {
    let exists = lanes.some(lane => {
      if(lane.toLowerCase() === n.note.name().toLowerCase() + n.octave) {
        return true;
      } else return false;
    });
    if(!exists) {
      lanes.push(n.note.name() + n.octave);
    }
  });
    
  lanes.sort((l1, l2) => (parseInt(l1.match(/-?\d/)[0]) > parseInt(l2.match(/-?\d/)[0])) ? -1 : 1);

  let laneTemp = [[]];

  lanes.map(lane => {
    for(let i = 0; i < laneTemp.length; i++) {
      if(laneTemp[laneTemp.length-1].length === 0 || laneTemp[laneTemp.length-1][0].match(/\d/)[0] === lane.match(/\d/)[0]) {
        laneTemp[laneTemp.length-1].push(lane);
      } else {
        laneTemp.push([]);
      }
    }
  });

  lanes = laneTemp.map(octave => {
    return [...(new Set(octave))].sort((l1, l2) => l1.match(/./)[0] > l2.match(/./)[0]);
  });

  lanes = [].concat.apply([],lanes);
} 

function noteDuration(note, bpm) {
  return 240000/bpm*note; 
}