// Adapter: Hide the Emscripten specific implementation and provide the same kind of API
// that is used in the old version from the AIR project (so that the two implementations
// can be directly compared)

Info = function() {
	this.Module= backend_ASAP.Module;
	this.Module.ccall('asap_getInfo', 'number');
}
Info.prototype = {
	getTitleOrFilename: function() {
		var ret= this.Module.ccall('asap_get_title', 'number');
		return this.Module.Pointer_stringify(ret);
	},
	getAuthor: function() {
		var ret= this.Module.ccall('asap_get_author', 'number');
		return this.Module.Pointer_stringify(ret);
	},
	getDate: function() {
		var ret= this.Module.ccall('asap_get_date', 'number');
		return this.Module.Pointer_stringify(ret);
	},
	getSongs: function() {
		var ret= this.Module.ccall('asap_get_songs', 'number');
		return ret;
	},
	getDefaultSong: function() {
		var ret= this.Module.ccall('asap_get_default_song', 'number');
		return ret;
	},
	getLoop: function(id) {
		var ret = this.Module.ccall('asap_get_loop', 'number', ['number'], [id]);
		return ret;
	},
	getDuration: function(id) {
		var ret = this.Module.ccall('asap_get_duration', 'number', ['number'], [id]);
		return ret;
	},
	getChannels: function(id) {
		var ret = this.Module.ccall('asap_get_channels', 'number', ['number'], [id]);
		return ret;
	},
}

ASAP = function() {
	this.Module= backend_ASAP.Module;
}
ASAP.prototype = {
	load: function(name, module, moduleLen, scopeEnabled) {	
		var byteArray = new Uint8Array(module);

		var buf = this.Module._malloc(byteArray.length);
		this.Module.HEAPU8.set(byteArray, buf);
		var ret = this.Module.ccall('asap_load', 'number', ['string', 'number', 'number', 'number'], [name, buf, byteArray.length, scopeEnabled]);
		
		this.Module._free(buf);
	},
	getInfo: function() {
		return new Info();
	},
	playSong: function(id, duration, boostVolume) {
		var ret = this.Module.ccall('asap_playSong', 'number', ['number', 'number', 'number'], [id, duration, boostVolume]);
		return ret;

	},
	generate: function(buffer, samplesPerChannel, format) {
		format= 1; 		// always force 2 byte per sample

		// the caller always expects a 2 channel response even if the actual producer (below) only 
		// supplies samples for 1 channel ('buffer' is wrapped Float32Array and is large enough for 
		// data of 2 channels)
		
		var channels= this.getInfo().getChannels();
		var sampleSize= (format == 0) ? 1 : 2;		// in bytes

		var numOfBytesToFill= samplesPerChannel * channels * sampleSize;
		var buf = this.Module._malloc(numOfBytesToFill);		// alloc buffer for C code to use..
			
		var retLenBytes = this.Module.ccall('asap_generate', 'number', ['number', 'number', 'number', 'number'], [buf, numOfBytesToFill, format, samplesPerChannel]);
		
		var result = (format==0) ?	this.Module.HEAPU8.subarray(buf, (buf+retLenBytes)): 
									this.Module.HEAP16.subarray(buf>>1, (buf+retLenBytes)>>1 );
							
		this.Module._free(buf);
		
		if (format == 0) {
			// unsigned 1 byte samples
			for (i= 0; i< result.length; i++) {
				var v= (result[i] - 0x7f) / 0x80;
				buffer.writeFloat(v);
				if (channels == 1) 
					buffer.writeFloat(v);
			}			
		} else {
			// signed 2 byte samples
			for (i= 0; i< result.length; i++) {
				var v= result[i] / 0x8000;
				buffer.writeFloat(v);
				if (channels == 1)
					buffer.writeFloat(v);
			}			
		}
		return retLenBytes / channels / sampleSize;
	},
}

