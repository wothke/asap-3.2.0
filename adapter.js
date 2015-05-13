// Adapter: Hide the Emscripten specific implementation and provide the same kind of API
// that is used in the old version from the AIR project

Module= Emscripten.Module;

Info = function() {
	Module.ccall('asap_getInfo', 'number');
}
Info.prototype = {
	getTitleOrFilename: function() {
		var ret= Module.ccall('asapinfo_GetTitleOrFilename', 'number');
		return Module.Pointer_stringify(ret);
	},
	getAuthor: function() {
		var ret= Module.ccall('asapinfo_GetAuthor', 'number');
		return Module.Pointer_stringify(ret);
	},
	getDate: function() {
		var ret= Module.ccall('asapinfo_GetDate', 'number');
		return Module.Pointer_stringify(ret);
	},
	getSongs: function() {
		var ret= Module.ccall('asapinfo_GetSongs', 'number');
		return ret;
	},
	getDefaultSong: function() {
		var ret= Module.ccall('asapinfo_GetDefaultSong', 'number');
		return ret;
	},
	getLoop: function(id) {
		var ret = Module.ccall('asapinfo_GetLoop', 'number', ['number'], [id]);
		return ret;
	},
	getDuration: function(id) {
		var ret = Module.ccall('asapinfo_GetDuration', 'number', ['number'], [id]);
		return ret;
	},
	getChannels: function(id) {
		var ret = Module.ccall('asapinfo_GetChannels', 'number', ['number'], [id]);
		return ret;
	},
}

ASAP = function() {
}
ASAP.prototype = {
	load: function(name, module, moduleLen) {	
		var byteArray = new Uint8Array(module);

		var buf = Module._malloc(byteArray.length);
		Module.HEAPU8.set(byteArray, buf);
		var ret = Module.ccall('asap_load', 'number', ['string', 'number', 'number'], [name, buf, byteArray.length]);
		
		Module._free(buf);
	},
	getInfo: function() {
		return new Info();
	},
	playSong: function(id, duration) {
		var ret = Module.ccall('asap_playSong', 'number', ['number', 'number'], [id, duration]);
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
		var buf = Module._malloc(numOfBytesToFill);		// alloc buffer for C code to use..
			
		var retLenBytes = Module.ccall('asap_generate', 'number', ['number', 'number', 'number'], [buf, numOfBytesToFill, format]);
		
		var result = (format==0) ?	Module.HEAPU8.subarray(buf, (buf+retLenBytes)): 
									Module.HEAP16.subarray(buf>>1, (buf+retLenBytes)>>1 );
							
		Module._free(buf);
		
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
		return samplesPerChannel;
	},
}

