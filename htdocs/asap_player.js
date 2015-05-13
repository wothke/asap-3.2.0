/*
 * WebAudio based ASAP
 *
 * Copyright (C) 2015 Juergen Wothke
 *
 * This file is based on ASAP (Another Slight Atari Player),
 * see http://asap.sourceforge.net. 
 *
 * It provides the necessary WebAudio wiring so that the existing
 * asap.js from asap-3.2.0-air.air can be used to play music directly within 
 * a web browser.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * ASAP is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ASAP; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

var asap = new ASAP();
var info;

const SAMPLES_PER_BUFFER = 8192;	// allowed: buffer sizes: 256, 512, 1024, 2048, 4096, 8192, 16384
var freq= 44100/2;					// rate expected by ASAP


var fetchSamples= function(e) { 	
	// it seems that it is necessary to keep this explicit reference to the event-handler
	// in order to pervent the dumbshit Chrome GC from detroying it eventually
	
	var f= window.player['generateSamples'].bind(window.player); // need to re-bind the instance.. after all this 
																	// joke language has no real concept of OO	
	f(e);
}

ArrayAdaptor = function(array) {
	this.wrapped= array;
	this.idx= 0;
}
ArrayAdaptor.prototype = {
	writeFloat: function(val) {
		this.wrapped[this.idx++]= val;
	//	console.log(val+" "); 
	},
}
	
SamplePlayer = function(onEnd) {
	this.onEnd= onEnd;
	
	try {
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		this.sampleRate = new AudioContext().sampleRate;		// e.g. 48000 in Chrome
	} catch(e) {
		alert('Web Audio API is not supported in this browser (get Chrome 18 or Firefox 26)');
	}	
	this.playSpeed;
	this.maxSubsong;
	this.actualSubsong;
	this.songName;
	this.songAuthor;
	this.songReleased;
	
	// original input: 2 channels interleaved
	this.sourceBuffer = new Float32Array(SAMPLES_PER_BUFFER*2);	// 2 channels interleaved
	// separate channel data resampled
	this.resampleBufferL= new Float32Array((SAMPLES_PER_BUFFER) *this.sampleRate/freq);
	this.resampleBufferR= new Float32Array((SAMPLES_PER_BUFFER) *this.sampleRate/freq);
	this.numberOfSamplesRendered= 0;
	this.numberOfSamplesToRender= 0;
	this.sourceBufferIdx=0;

	this.isPaused= false;
	this.currentTimeout= -1;
	this.newSampleRate= -1;

	window.player= this;
};

SamplePlayer.prototype = {
	getDefaultSampleRate: function() {
		return new AudioContext().sampleRate;
	},
	setSampleRate: function(s) {
		this.newSampleRate= s;
	},
	playSong: function(name, data, track, timeout) {
		this.isPaused= true;
		this.loadData(name, data);  
		this.selectSong(track<0?this.actualSubsong: track);
		this.currentTimeout= timeout;
		this.currentPlaytime= 0;
		
		this.isPaused= 0;
	},
	setPauseMode: function (pauseOn) {
		this.isPaused= pauseOn;
	},
	createScriptProcessor: function(audioCtx) {
		var scriptNode = audioCtx.createScriptProcessor(SAMPLES_PER_BUFFER, 0, 2);	// ASAP uses 2 channel output
		scriptNode.onaudioprocess = fetchSamples;
		return scriptNode;
	},
	loadData: function(name, arrayBuffer) {
	  if (arrayBuffer) {
		var module = new Uint8Array(arrayBuffer);

		try {
			asap.load(name, module, module.length);
			info = asap.getInfo();
		} catch (ex) {
			alert(ex);
			return;
		}
		this.songName= info.getTitleOrFilename();
		this.songAuthor= info.getAuthor();
		this.songReleased= info.getDate();
		this.maxSubsong= (info.getSongs() > 1) ? info.getSongs() : 1;
		this.actualSubsong= info.getDefaultSong();		
	  }
	},
	selectSong: function(id) {	
		var duration = info.getLoop(id) ? -1 : info.getDuration(id);
		asap.playSong(id, duration);	
	},
	getResampledAudio: function(len) {
		// separate 2 channels and resample for custom playback speed
		var resampleLen= Math.floor((len>>1) *this.sampleRate/freq);

		this.resampleAudio(len, resampleLen, 0);	// left channel
		this.resampleAudio(len, resampleLen, 1);	// right channel
		
		return resampleLen;
	},
	resampleAudio: function(len, resampleLen, channel) {	
		if ((resampleLen > this.resampleBufferR.length) || (resampleLen > this.resampleBufferL.length) ) {
			this.resampleBufferR= new Float32Array(resampleLen);
			this.resampleBufferL= new Float32Array(resampleLen);
		}
		// Bresenham algorithm based resampling
		var x0= 0;
		var y0= 0;
		var x1= resampleLen;
		var y1= len*2;			// interleaved buffer len

		var dx =  Math.abs(x1-x0), sx = x0<x1 ? 1 : -1;
		var dy = -Math.abs(y1-y0), sy = y0<y1 ? 1 : -1;
		var err = dx+dy, e2;

		var buf= (channel>0) ? this.resampleBufferR : this.resampleBufferL;
				
		for(;;){	
			// channel 0= even indices.. channel 1= odd indices
			var idx= (Math.floor(y0/2)<<1) + channel;;
						
			buf[x0]= this.sourceBuffer[idx]
		
			if (x0>=x1 && y0>=y1) break;
			e2 = 2*err;
			if (e2 > dy) { err += dy; x0 += sx; }
			if (e2 < dx) { err += dx; y0 += sy; }
		}
		return resampleLen;
	},
	resetSampleRate: function() {
		if (this.newSampleRate > 0) {
			this.sampleRate= this.newSampleRate;
						
			var s= (SAMPLES_PER_BUFFER) *this.sampleRate/freq;
			
			if (s > this.resampleBufferL.length) {
				this.resampleBufferL= new Float32Array(s);
				this.resampleBufferR= new Float32Array(s);
			}
			this.numberOfSamplesRendered= 0;
			this.numberOfSamplesToRender= 0;
			this.sourceBufferIdx=0;
			
			this.newSampleRate= -1;
		}
	},
	generateSamples: function(event) {
		this.resetSampleRate();	// perform here to avoid "concurrency" issues
		
		var outputL = event.outputBuffer.getChannelData(0);
		var outputR = event.outputBuffer.getChannelData(1);

		if (this.isPaused) {
			var i;
			for (i= 0; i<outputL.length; i++) {
				outputL[i]= 0;
				outputR[i]= 0;
			}		
		} else {
			var outSize= outputL.length;			// same for left/right channel
			this.numberOfSamplesRendered = 0;		
			
			while (this.numberOfSamplesRendered < outSize)
			{
				if (this.numberOfSamplesToRender == 0) {				
					// asap.generate() returns the total number of samples in both channels
					var len= asap.generate(new ArrayAdaptor(this.sourceBuffer), this.sourceBuffer.length>>1, 0);	

					this.numberOfSamplesToRender = this.getResampledAudio(len);	// per channel		
					this.sourceBufferIdx=0;			
					
					this.currentPlaytime+= len;
					
					if ((this.currentTimeout>0) && this.currentPlaytime/freq > this.currentTimeout) {
						this.isPaused= true;
						if (this.onEnd) this.onEnd();
						break;
					}					
				}

				if (this.numberOfSamplesRendered + this.numberOfSamplesToRender > outSize) {
					var availableSpace = outSize-this.numberOfSamplesRendered;
					
					var i;
					for (i= 0; i<availableSpace; i++, this.sourceBufferIdx++) {
						outputL[i+this.numberOfSamplesRendered]= this.resampleBufferL[this.sourceBufferIdx];
						outputR[i+this.numberOfSamplesRendered]= this.resampleBufferR[this.sourceBufferIdx];
					}				
					this.numberOfSamplesToRender -= availableSpace;
					this.numberOfSamplesRendered = outSize;
				} else {
					var i;
					for (i= 0; i<this.numberOfSamplesToRender; i++, this.sourceBufferIdx++) {
						outputL[i+this.numberOfSamplesRendered]= this.resampleBufferL[this.sourceBufferIdx];
						outputR[i+this.numberOfSamplesRendered]= this.resampleBufferR[this.sourceBufferIdx];
					}						
					this.numberOfSamplesRendered += this.numberOfSamplesToRender;
					this.numberOfSamplesToRender = 0;
				} 
			}
			
			var x= 0;
		}	
	}	
};




