import teoria from 'teoria';

const lol = () => 'lol';

console.log(lol());

console.log("Hej!");


class Note {

  constructor (note, octave, duration, chordwill, placement) {
    this.note = note;
    this.octave = octave;
    this.duration = duration; 
    this.chordwill = chordwill;
    this.placement = placement;
  }

}

class Environment {

  constructor(key, scale, numberOfNotes) {

    const notesscale = teoria.note(key).scale(scale).simple().map((note) => new Note(note, 0, 0.5, 0.1, 'B4'));

    console.log(notesscale);

  }

}

var Slot = require('audio-slot')

var context = {
  audio: new AudioContext(),
  nodes: {
    oscillator: require('audio-slot/sources/oscillator'),
    filter: require('audio-slot/processors/filter'),
    envelope: require('audio-slot/params/envelope'),
    lfo: require('audio-slot/params/lfo')
  }
}



var synth = Slot(context)
synth.set({
  sources: [
    { 
      node: 'oscillator', 
      shape: 'sawtooth', 
      amp: {
        node: 'envelope',
        value: 0.6,
        attack: 0.1,
        release: 1
      },
      octave: 2,
      detune: {
        value: 0,
        node: 'lfo',
        amp: 40,
        rate: 5,
        mode: 'add'
      }
    }
  ], //awefadfawef
  processors: [
    {
      node: 'filter',
      type: 'lowpass',
      frequency: {
        node: 'envelope',
        value: 440,
        decay: 0.9,
        sustain: 0.5,
        release: 0.9
      }
    }
  ]
})

synth.connect(context.audio.destination)

// trigger! serkgn sljkngrsljenrglsjengljs nergljsrh 
console.log("Trigger!");
setTimeout(function() {
  synth.triggerOn(1)
  synth.triggerOff(2)
  synth.triggerOn(3)
  synth.triggerOff(4)
  synth.triggerOn(5)
  synth.triggerOff(7)
}, 0.2)


