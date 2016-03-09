import teoria from 'teoria';
import np from 'noteplayer';
const context = new AudioContext();
import Tock from 'tocktimer';
import Soundfont from 'soundfont-player';
import MarkovChain from 'markovchain-generate'; 
const soundFont = new Soundfont(context);
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

    /*if(this.note) {

      let n = np.buildFromName(this.note.name().toUpperCase() + this.octave, context);
      n.setDuration((duration)/1000);
      n.play();

    }*/

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

      //En timer som kanske fungerar bättre. Återstår att se.
      /*var timer = new Tock({
        countdown: true,
        complete: () => {
          note.play(duration, start);
        }
      });

      timer.start(start);*/

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
xhr.onreadystatechange = function() {
  if(xhr.readyState === 4 && xhr.status === 200) {
    var data = xhr.responseText;

    data = data.split('\n');

    data = data.map(function(d) { return d.split(' ')});

    data = data.map(function(d) { return {action: d[0], note: d[1], time: d[2]}});

    let section = [[]];    //section innerhåller bars.

    //console.log(data);

    var duration = 0;
    let noteNumber = 0;

    for(var i = 0; i < data.length; i++) {
      //console.log(duration);

      if(data[i].action === 'ON') {
        //console.log("ON!");
        let start = parseFloat(data[i].time);
        //Förutsätter att varannan är av.
        let stop = parseFloat(data[i+1].time);
        duration += Math.abs((start-stop));
        //console.log("duration: "+ duration);

        if(duration <= 1) {
          //console.log("Not placeras i bar nummer %s, duration: %s", section.length-1, duration);
          section[section.length-1].push(new Note(data[i].note, Math.abs(start-stop)));
        } else {
          section.push([]);
          duration = 0;
        }
      } /*else if(data[i].action === 'OFF' && i !== data.length-1) {
        console.log("OFF!");
        let start = parseFloat(data[i].time);
        //Förutsätter att varannan är av.
        let stop = parseFloat(data[i+1].time);
        duration += Math.abs((start-stop));

        if(duration <= 1) {
          console.log("Paus placeras i bar nummer %s, duration: %s", section.length-1, duration);
          section[section.length-1].push(new Note('', Math.abs(start-stop)));
        } else {
          section.push([]);
          duration = 0;
        }
      }*/
    }
    
    let notes = [];
    
    section = new Section(section.map(function(s) {
      return new Bar(s.map(function(n) {
        return n;
      }));
    }));

    section.bars.forEach(bar => {
      notes.push(...bar.notes);
      //console.log(bar.getTotalDuration());
    });

    //console.log(notes);
    let merged = ""; 

    notes.forEach((note)=>{
      merged += note.duration + "-" + note.note.name() + note.octave + " "; 
      console.log(note.note.name());
    });

    let chain = new MarkovChain(); 

    chain.generateChain(merged); 
    var probabilities = chain.dump();

    //console.log(merged);
    console.log(JSON.parse(probabilities));



    piano = soundFont.instrument('kalimba');

    piano.onready(() => {
      //section.play(105*2);

      let start = 0;
      notes.forEach((note) => {
        let duration = noteDuration(note.duration, 100);
        
        setTimeout(() => {
          
          note.play(duration, start);  
          
        }, start);

/*        var timer = new Tock({
          countdown: true,
          complete: () => {
            note.play(duration, start);
          }
        });

        timer.start(start);*/

        start += duration;
      });

      console.log("PLAY!");

    });

  }
} 

function noteDuration(note, bpm) {
  return 240000/bpm*note; 
}

function doTimer(length, resolution, oninstance, oncomplete)
{
    var steps = (length / 100) * (resolution / 10),
        speed = length / steps,
        count = 0,
        start = new Date().getTime();

    function instance()
    {
        if(count++ == steps)
        {
            oncomplete(steps, count);
        }
        else
        {
            oninstance(steps, count);

            var diff = (new Date().getTime() - start) - (count * speed);
            window.setTimeout(instance, (speed - diff));
        }
    }

    window.setTimeout(instance, speed);
}






xhr.open("GET", 'http://localhost:8080/assets/txt/supermario.txt');
xhr.send();