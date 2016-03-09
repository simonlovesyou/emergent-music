import teoria from 'teoria';
import np from 'noteplayer';
import Tock from 'tocktimer';
import Soundfont from 'soundfont-player';
import MarkovChain from 'markovchain-generate'; 
const soundFont = new Soundfont(context);
const context = new AudioContext();
let piano;


/*Class note. A note contains a note, frequency, the duration of the note, chordwill and placement.*/
class Note {
  constructor (note, duration, chordwill, placement) {
    if(note !== '') {
      this.note = new teoria.note(note);
      this.octave = note.match(/\d/)[0]-3;
      this.freq = this.note.fq();
    }
    
    this.duration = duration; 
    this.chordwill = chordwill;  
    this.placement = placement;
  }

  noteDuration(note, bpm) {
    return 240000/bpm*note; 
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
    
    let notes = [];


    //Create bars out of all notes into the section array
    section = new Section(
      section.map(s => 
        new Bar(s.map(n => n))
      ));

    //Push all notes from all bars to notes array
    section.bars.forEach(bar => notes.push(...bar.notes));

    //Merge all notes to sentences
    let merged = notes.map(n => n.duration + "-" + n.note.name() + n.octave)
                 .join(' ');

    let chain = new MarkovChain(); 
    chain.generateChain(merged); 

    //Markov probabilites for all notes
    const probabilities = JSON.parse(chain.dump());

    //Load instrument as a soundfount
    piano = soundFont.instrument('kalimba');

    //When instrument is ready
    piano.onready(() => {

      let start = 0;
      //Iterate through all notes
      notes.forEach((note) => {
        //Duration for current note
        let duration = noteDuration(note.duration, 100);  //note measure, bpm
        //Play the note after a certain amount of time
        setTimeout(() => note.play(duration, start), start);

        start += duration;

      });
    });

  }
}

function noteDuration(note, bpm) {
  return 240000/bpm*note; 
}