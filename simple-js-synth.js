// (c) Copyright 2017, Sean Connelly (@voidqk), http://syntheti.cc
// MIT License
// Project Home: https://github.com/voidqk/simple-js-synth

(function(){

function SimpleJSSynth(dest, opts){
	// `dest` is the AudioNode destination
	// `opts` is an object; see notes further down for meaning and range of values.
	// {
	//   osc1type : 'sine'|'square'|'sawtooth'|'triangle', // type of wave
	//   osc1vol  : 0 to 1,                                // oscillator volume (linear)
	//   osc1tune : 0,                                     // relative tuning (semitones)
	//   osc2type, osc2vol, osc2tune,                      // settings for osc2
	//   osc3type, osc3vol, osc3tune,                      // settings for osc3
	//   attack   : 0 to inf,                              // attack time (seconds)
	//   decay    : 0 to inf,                              // decay time (seconds)
	//   sustain  : 0 to 1,                                // sustain (fraction of max vol)
	//   cutoff   : -inf to inf                            // filter cutoff (relative semitones)
	// }

	var ctx = dest.context; // get the WebAudio context

	//
	//   Osc1 ---> Osc1 Gain ---+
	//                          |
	//   Osc2 ---> Osc2 Gain ---+---> Envelope Gain ---> Filter --> Destination
	//                          |
	//   Osc3 ---> Osc3 Gain ---+
	//

	var filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.setValueAtTime(22050, ctx.currentTime);
	filter.Q.setValueAtTime(0.5, ctx.currentTime);

	var my = filter; // the returned object is the filter

	var gain = ctx.createGain();
	gain.gain.setValueAtTime(0, ctx.currentTime);
	gain.connect(filter);

	function oscgain(v, def){
		var g = ctx.createGain();
		v = typeof v === 'number' ? v : def;
		g.gain.value = 0;
		g.connect(gain);
		return { node: g, base: v };
	}
	var osc1gain = oscgain(opts.osc1vol, 0.8);
	var osc2gain = oscgain(opts.osc2vol, 0.6);
	var osc3gain = oscgain(opts.osc3vol, 0.4);

	function osctype(type, g){
		var osc = ctx.createOscillator();
		osc.type = typeof type === 'string' ? type : 'sine';
		osc.connect(g);
		return osc;
	}
	var osc1 = osctype(opts.osc1type, osc1gain.node);
	var osc2 = osctype(opts.osc2type, osc2gain.node);
	var osc3 = osctype(opts.osc3type, osc3gain.node);

	function calctune(t){
		if (typeof t !== 'number')
			return 1;
		return Math.pow(2, t / 12);
	}
	var tune1 = calctune(opts.osc1tune);
	var tune2 = calctune(opts.osc2tune);
	var tune3 = calctune(opts.osc3tune);
	var cutoff = calctune(opts.cutoff);

	var attack  = typeof opts.attack  == 'number' ? opts.attack  : 0.1;
	var decay   = typeof opts.decay   == 'number' ? opts.decay   : 0.2;
	var sustain = typeof opts.sustain == 'number' ? opts.sustain : 0.5;

	// clamp the values a bit
	var eps = 0.001;
	if (attack < eps)
		attack = eps;
	if (decay < eps)
		decay = eps;
	if (sustain < eps)
		sustain = eps;

	var basefreq = 0;
	var silent = 0;

	osc1.start();
	osc2.start();
	osc3.start();

	my.connect(dest);

	my.noteOn = function(freq, vol){
		my.stop();
		basefreq = freq;
		var now = ctx.currentTime;
		osc1.frequency.setValueAtTime(freq * tune1, now);
		osc2.frequency.setValueAtTime(freq * tune2, now);
		osc3.frequency.setValueAtTime(freq * tune3, now);
		filter.frequency.setValueAtTime(Math.min(freq * cutoff, 22050), now);
		osc1gain.node.gain.setValueAtTime(vol * osc1gain.base, now);
		osc2gain.node.gain.setValueAtTime(vol * osc2gain.base, now);
		osc3gain.node.gain.setValueAtTime(vol * osc3gain.base, now);
		var v = gain.gain.value;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(v, now);
		gain.gain.linearRampToValueAtTime(1, now + attack);
		gain.gain.linearRampToValueAtTime(sustain, now + attack + decay * (1 - sustain));
		silent = -1;
	};

	my.bend = function(semitones){
		var b = basefreq * Math.pow(2, semitones / 12);
		var now = ctx.currentTime;
		osc1.frequency.setTargetAtTime(b * tune1, now, 0.1);
		osc2.frequency.setTargetAtTime(b * tune2, now, 0.1);
		osc3.frequency.setTargetAtTime(b * tune3, now, 0.1);
	};

	my.noteOff = function(){
		var now = ctx.currentTime;
		var v = gain.gain.value;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(v, now);
		silent = now + decay * v;
		gain.gain.linearRampToValueAtTime(0.000001, silent);
	};

	my.isSilent = function(){
		return silent >= 0 && ctx.currentTime >= silent;
	};

	my.stop = function(){
		var now = ctx.currentTime;
		osc1gain.node.gain.setValueAtTime(0.000001, now);
		osc2gain.node.gain.setValueAtTime(0.000001, now);
		osc3gain.node.gain.setValueAtTime(0.000001, now);
		silent = 0;
	};

	my.destroy = function(){
		osc1.stop();
		osc2.stop();
		osc3.stop();
		my.disconnect();
	};

	return my;
}

if (typeof window !== 'undefined')
	window.SimpleJSSynth = SimpleJSSynth;
else
	module.exports = SimpleJSSynth;
})();
