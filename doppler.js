/*

Original work Copyright (C) 2015 by Daniel Rapp
Modified work Copyright (C) 2015 by Harrison Green

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

window.doppler = (function() {
  var AuContext = (window.AudioContext ||
                   window.webkitAudioContext ||
                   window.mozAudioContext ||
                   window.oAudioContext ||
                   window.msAudioContext);

  var ctx = new AuContext();
  var osc = ctx.createOscillator();
  // This is just preliminary, we'll actually do a quick scan
  // (as suggested in the paper) to optimize this.
  var freq = 20000;

  // See paper for this particular choice of frequencies
  var relevantFreqWindow = 33;

  var getBandwidth = function(analyser, freqs) {
    var primaryTone = freqToIndex(analyser, freq);
    var primaryVolume = freqs[primaryTone];
    // This ratio is totally empirical (aka trial-and-error).
    var maxVolumeRatio = 0.001;

    var leftBandwidth = 0;
    do {
      leftBandwidth++;
      var volume = freqs[primaryTone-leftBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && leftBandwidth < relevantFreqWindow);

    var rightBandwidth = 0;
    do {
      rightBandwidth++;
      var volume = freqs[primaryTone+rightBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && rightBandwidth < relevantFreqWindow);

    return { left: leftBandwidth, right: rightBandwidth };
  };

  var freqToIndex = function(analyser, freq) {
    var nyquist = ctx.sampleRate / 2;
    return Math.round( freq/nyquist * analyser.fftSize/2 );
  };

  var indexToFreq = function(analyser, index) {
    var nyquist = ctx.sampleRate / 2;
    return nyquist/(analyser.fftSize/2) * index;
  };

  var optimizeFrequency = function(osc, analyser, freqSweepStart, freqSweepEnd) {
    var oldFreq = osc.frequency.value;

    var audioData = new Uint8Array(analyser.frequencyBinCount);
    var maxAmp = 0;
    var maxAmpIndex = 0;

    var from = freqToIndex(analyser, freqSweepStart);
    var to   = freqToIndex(analyser, freqSweepEnd);
    for (var i = from; i < to; i++) {
      osc.frequency.value = indexToFreq(analyser, i);
      analyser.getByteFrequencyData(audioData);

      if (audioData[i] > maxAmp) {
        maxAmp = audioData[i];
        maxAmpIndex = i;
      }
    }
    // Sometimes the above procedure seems to fail, not sure why.
    // If that happends, just use the old value.
    if (maxAmpIndex == 0) {
      return oldFreq;
    }
    else {
      return indexToFreq(analyser, maxAmpIndex);
    }
  };

  var readMicInterval = 0;
  var readMic = function(analyser, userCallback) {
    var audioData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(audioData);

    var band = getBandwidth(analyser, audioData);
    userCallback(band);

    readMicInterval = setTimeout(readMic, 1, analyser, userCallback);
  };

  var handleMic = function(stream, callback, userCallback) {
    // Mic
    var mic = ctx.createMediaStreamSource(stream);
    var analyser = ctx.createAnalyser();

    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 2048;

    mic.connect(analyser);

    // Doppler tone
    osc.frequency.value = freq;
    osc.type = osc.SINE;
    osc.start(0);
    osc.connect(ctx.destination);

    // There seems to be some initial "warm-up" period
    // where all frequencies are significantly louder.
    // A quick timeout will hopefully decrease that bias effect.
    setTimeout(function() {
      // Optimize doppler tone
      freq = optimizeFrequency(osc, analyser, 19000, 22000);
      osc.frequency.value = freq;

      clearInterval(readMicInterval);
      callback(analyser, userCallback);
    });
  };

  return {
    init: function(callback) {
      navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
      navigator.getUserMedia_({ audio: { optional: [{ echoCancellation: false }] } }, function(stream) {
        handleMic(stream, readMic, callback);
      }, function() { console.log('Error!') });
    },
    stop: function () {
      clearInterval(readMicInterval);
      osc.stop();
      osc = ctx.createOscillator();
    }
  }
})(window, document);

