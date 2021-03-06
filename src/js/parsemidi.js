'use strict';
var midi = require('midi-node');
var fs = require('fs');
var path = require('path');
var noteOff = new Buffer('803c00', 'hex'); // Channel 0, middle C4, 0 velocity 
var message = midi.Message.fromBuffer(noteOff);
let hexToMidi = {};


fs.readFile(path.join(process.cwd(), '/src/table.txt'), 'utf8', (err, data) => {
  let temp = [];
  data.split('\n').forEach((d, index) => {
    if(index < 156) {
      temp.push([d]);
      hexToMidi[d] = undefined;
    } else {
      temp[(index % 156)].push(d);
    }
  });
  console.log(temp);
  temp.forEach((child) => {
    hexToMidi[child[0]] = child[1].split(' ').join('');
  });
  console.log(hexToMidi['00']);
});



console.log(midi.Track);

let notes = [];

midi.Sequence.fromFile(path.join(process.cwd(), '/src/for_elise.mid'), (err, sequence) => {
  if(err) {
    console.log(err);
  }

  console.log(sequence.getTracks());
  console.log(hexToMidi);

  console.log(sequence.getTracks()[0].events);

  sequence.getTracks()[1].events.forEach((event) => {
    //console.log(event.message.getCommand());
    if(event.message.getCommand() === 'META_MESSAGE') {
      //console.log(event.message);
    }


    if(event.message.getCommand().match(/NOTE_(ON|OFF)/)) {
      console.log(event.message.getCommand().match(/NOTE_(ON|OFF)/)[0] + ": " + hexToMidi[event.message.getData()[0]] + " (" + event.message.getData()[0] + ")");
      //console.log("Duration: " + (Math.pow(2, 7) / event.delta));

      //console.log(event.message);

      if(event.message.getCommand().match(/(ON|OFF)/)[0] === 'ON') {
        notes.push(['ON', hexToMidi[event.message.getData()[0]], 1/(Math.pow(2, 8) / event.delta)]);
      } else {
        notes.push(['OFF', hexToMidi[event.message.getData()[0]], 1/(Math.pow(2, 8) / event.delta)]);
      }

    }
  });
  
  notes = notes.map((note) => {
    console.log(note);
    return note.join(' ');
  });


  fs.writeFile(path.join(process.cwd(), '/src/assets/txt/for_elise.txt'), notes.join('\n'), (err) => {
    if(err) console.log("Fel!: " +err);
    console.log("Saved!");
  });
});


