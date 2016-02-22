import teoria from 'teoria';
import np from 'noteplayer';
const context = new AudioContext();

class Note {

  constructor (note, octave, duration, chordwill, placement) {
    this.note = new teoria.note(note);
    this.freq = this.note.fq();
    this.octave = octave;
    this.duration = duration; 
    this.chordwill = chordwill;
    this.placement = placement;
  }

  play(duration, start) {

    let n = np.buildFromName(this.note.name().toUpperCase() + this.octave, context);
    n.setDuration((duration-5)/1000);
    n.play();
  }
}

class Bar {
  constructor(notes) {
    this.notes = notes;
  }

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

  noteDuration(note, bpm) {
    let whole = 240000/bpm;
    return whole*note; 
  }
}

class Measure {
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

const n = new Note('c4', 4, 0.5); 
const n3 = new Note('d4', 4, 0.25);
const n4 = new Note('b4', 3, 0.25);
const n5 = new Note('g4', 4, 1);

const b = new Bar([n, n3, n4]);
const b2 = new Bar([n5]);
const b3 = new Bar([n4, n, n3]);

const m = new Measure([b, b2, b3]);

m.play(90);


