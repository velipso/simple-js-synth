Simple JS Synth
===============

Simple JavaScript synthesizer using Web Audio.

[Play with the demo.](https://sean.cm/m/simple-js-synth/demo.html)

Design
------

![Design](https://github.com/velipso/simple-js-synth/raw/master/design.png)

There are three oscillators which output to a basic attack/decay/sustain envelope, followed by an
optional lowpass filter.

Usage
-----

There's only one function, `SimpleJSSynth`, and it creates an `AudioNode` and connects it to the
destination with the given synth options:

```javascript
// where <type> can be one of: 'sine' | 'square' | 'triangle' | 'sawtooth'
var node = SimpleJSSynth(
  audioContext.destination,  // the destination
  {
    // oscillator 1
    osc1type: <type>,        // type of wave
    osc1vol : 0 to 1,        // oscillator volume (linear)
    osc1tune: 0,             // relative tuning (semitones)

    // oscillator 2
    osc2type: <type>,        // type of wave
    osc2vol : 0 to 1,        // oscillator volume (linear)
    osc2tune: 0,             // relative tuning (semitones)

    // oscillator 3
    osc3type: <type>,        // type of wave
    osc3vol : 0 to 1,        // oscillator volume (linear)
    osc3tune: 0,             // relative tuning (semitones)

    // envelope
    attack  : 0 to inf,      // attack time (seconds)
    decay   : 0 to inf,      // decay time (seconds)
    sustain : 0 to 1         // sustain (fraction of max vol)
    susdecay: 0 to inf,      // decay during sustain (seconds)

    // filter
    cutoff  : 0,             // lowpass cutoff (relative semitones to root)
  }
);
```

The returned `AudioNode` object has a few extra methods for triggering the note:

```javascript
// start playing the synth at frequency `freq` and volume `vol`
node.noteOn(freq, vol);

// while the synth is playing, bend the note +- `semitones`
node.bend(semitones);

// turn the note off
node.noteOff();

// see if the synth is silent and ready for a new note to play
node.isReady();

// stop all sound immediately
node.stop();

// destroy a synth permanently (disconnect and stop all sound)
node.destroy();
```

Example
-------

Look at the [source code of the demo](https://github.com/velipso/simple-js-synth/blob/master/demo.html).
I've tried to keep it well commented.
