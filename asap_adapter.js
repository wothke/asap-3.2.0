/*
 asap_adapter.js: Adapts ASAP backend to generic WebAudio/ScriptProcessor player.
 
 Note: instead of directly using the Emscripten generated backend the API of 
 the ASAP class from the original class is used here. This allows to use either
 the original or the new Emscripten bases implementation in this adapter.

 version 1.0
 
 	Copyright (C) 2015 Juergen Wothke

 LICENSE
 
 This library is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2.1 of the License, or (at
 your option) any later version. This library is distributed in the hope
 that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA
*/

ASAPArrayAccessor = function(array) {
	this.wrapped= array;
	this.idx= 0;
}
ASAPArrayAccessor.prototype = {
	writeFloat: function(val) {
		this.wrapped[this.idx++]= val;
	},
}

ASAPBackendAdapter = (function(){ var $this = function () { 
		$this.base.call(this, 2, 4);
		
		this.SAMPLES_PER_BUFFER = 8192;		// allowed: buffer sizes: 256, 512, 1024, 2048, 4096, 8192, 16384
		this._asapSampleRate= 44100;					// rate expected by ASAP
		
		// original input: 2 channels interleaved
		this._sourceBuffer = new Float32Array(this.SAMPLES_PER_BUFFER*2);

		this._asap = new ASAP();
		this._info;
		this._songInfo= new Object();
	}; 
	extend(AudioBackendAdapterBase, $this, {
		/* async emscripten init means that adapter may not immediately be ready - see async WASM compilation */
		isAdapterReady: function() { 
			if (typeof this._asap.Module.notReady === "undefined")	return true; // default for backward compatibility		
			return !this._asap.Module.notReady;
		},		
		readFloatSample: function(buffer, idx) {
			return buffer[idx];
		},
		/* try to speed-up copy operation by inlining the access logic (which does indeed 
		 * seem to make a difference) 
		 */
		getCopiedAudio: function(buffer, len) {		
			var i= 0;
			// just copy the rescaled values so there is no need for special handling in playback loop
			for(i= 0; i<len*this._channels; i++){
				this._resampleBuffer[i]= buffer[i];	// FIXME directly use the buffer?
			}		
			return len;	
		},
	
		getAudioBuffer: function() {
			return this._sourceBuffer;	
		},
		getAudioBufferLength: function() {
			return this._sourceBuffer.length>>1;
		},
		computeAudioSamples: function() {
			var len= this._asap.generate(new ASAPArrayAccessor(this._sourceBuffer), SAMPLES_PER_BUFFER, 0) <<1;	
			if (len <= 0) return 1; // <=0 means "end song"			
			return 0;	
		},
		getPathAndFilename: function(filename) {
			return ['/', filename];
		},
		registerFileData: function(pathFilenameArray, data) {
			return 0;	// FS not used in ASAP
		},
		loadMusicData: function(sampleRate, path, filename, data, options) {
			var module = new Uint8Array(data);

			try {
				this._asap.load(filename, module, module.length);
				this._info = this._asap.getInfo();
			} catch (ex) {
				alert(ex);
				return;
			}
			this._songInfo= new Object();
			this._songInfo.songName= this._info.getTitleOrFilename();
			this._songInfo.songAuthor= this._info.getAuthor();
			this._songInfo.songReleased= this._info.getDate();
			this._songInfo.maxSubsong= (this._info.getSongs() > 1) ? this._info.getSongs() : 1;
			this._songInfo.actualSubsong= this._info.getDefaultSong();		
		
			this.resetSampleRate(sampleRate, this._asapSampleRate); // ASAP sampleRate is fixed

			return 0;			
		},
		evalTrackOptions: function(options) {			
			if (typeof options.timeout != 'undefined') {
				ScriptNodePlayer.getInstance().setPlaybackTimeout(options.timeout*1000);
			}
			var id= (options.track<0) ? this._songInfo.actualSubsong : options.track;
			var boostVolume= (options.boostVolume) ? options.boostVolume : 0;
			var duration = this._info.getLoop(id) ? -1 : this._info.getDuration(id);
			this._asap.playSong(id, duration, boostVolume);
			
			return 0;
		},				
		teardown: function() {
			// nothing to do
		},
		getSongInfoMeta: function() {
			return {			
					songName: String,
					songAuthor: String,
					songReleased: String,
					maxSubsong: Number,
					actualSubsong: Number
					};
		},
		updateSongInfo: function(filename, result) {
			result.songName= this._songInfo.songName;
			result.songAuthor= this._songInfo.songAuthor;
			result.songReleased= this._songInfo.songReleased;
			result.maxSubsong= this._songInfo.maxSubsong;
			result.actualSubsong= this._songInfo.actualSubsong;		
		}
	});	return $this; })();
	