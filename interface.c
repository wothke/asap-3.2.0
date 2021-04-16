/*
* This is the interface exposed by Emscripten to the JavaScript world..
*
* Copyright (C) 2015 Juergen Wothke
*
* LICENSE
* 
* This library is free software; you can redistribute it and/or modify it
* under the terms of the GNU Lesser General Public License as published by
* the Free Software Foundation; either version 2.1 of the License, or (at
* your option) any later version. This library is distributed in the hope
* that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
* warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Lesser General Public License for more details.
* 
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA
*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h> 


#include "asap.h"

#ifdef EMSCRIPTEN
#define EMSCRIPTEN_KEEPALIVE __attribute__((used))
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

extern void set_boost_volume(unsigned char b);

static ASAP* _asap= 0; 
static const ASAPInfo* _info= 0;


#define MAX_SCOPE_BUFFERS 2								// left/right
short _scope_enabled = 0;
unsigned char* _scope_buffers[MAX_SCOPE_BUFFERS];		// actually used for shorts; output "scope" streams corresponding to final audio buffer


ASAP* get_ASAP() {
	if (_asap == 0)
		_asap= ASAP_New();
	return _asap;
}

int asap_getInfo() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_getInfo() {
    _info= ASAP_GetInfo(get_ASAP());
	return 0;
}

cibool asap_load(const char *filename, unsigned char *buf, long len, int scope_enabled) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asap_load(const char *filename, unsigned char *buf, long len, int scope_enabled) {
	if (_asap != 0) {
		ASAP_Delete(_asap);
		_asap= 0;
	}
	_scope_enabled= scope_enabled;
	
	if (_scope_enabled) {					// for some reason allocating this dynamically from asap_generate() introduced noise/clicks..
		if (_scope_buffers[0] == 0) {
			for (int i= 0; i<MAX_SCOPE_BUFFERS; i++) {
				_scope_buffers[i]= (unsigned char*) calloc(sizeof(short), 16384); 	// just alloc enough for the possible maximum
			}
		}
	}
	
	return ASAP_Load(get_ASAP(), filename, buf, len);
}

cibool asap_playSong(int song, int duration, int boost_volume) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asap_playSong(int song, int duration, int boost_volume) {
	set_boost_volume(boost_volume & 0xff);
		
	return ASAP_PlaySong(get_ASAP(), song, duration);
}

int asap_generate(unsigned char *buffer, int bytes_to_fill, int format, int samples_per_channel) __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_generate(unsigned char *buffer, int bytes_to_fill, int format_id, int samples_per_channel) {
	// 	bytes_to_fill= samples_per_channel * channels * sampleSize;
	
	ASAPSampleFormat format;
	switch(format_id) {
		case 1:
			format= ASAPSampleFormat_S16_L_E;
			break;
		case 2:
			format= ASAPSampleFormat_S16_B_E;
			break;
		default:
			format= ASAPSampleFormat_U8;
			break;
	}
			
	return ASAP_Generate(get_ASAP(), buffer, bytes_to_fill, format, _scope_enabled ? _scope_buffers : 0);
}

const char *asap_get_title() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asap_get_title() {
	return ASAPInfo_GetTitleOrFilename(_info);
}

const char *asap_get_date() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asap_get_date() {
	return ASAPInfo_GetDate(_info);
}

const char *asap_get_author() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asap_get_author() {
	return ASAPInfo_GetAuthor(_info);
}

int asap_get_default_song() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_get_default_song() {
	return ASAPInfo_GetDefaultSong(_info);
}

int asap_get_songs() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_get_songs() {
	return ASAPInfo_GetSongs(_info);
}

int asap_get_channels() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_get_channels() {
	return ASAPInfo_GetChannels(_info);
}

int asap_get_duration(int song) __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_get_duration(int song) {
	return ASAPInfo_GetDuration(_info, song);
}

cibool asap_get_loop(int song) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asap_get_loop(int song) {
	return ASAPInfo_GetLoop(_info, song);
}

// note: one POKEY chip supposedly has 4 voices/channels each of which can
// output a configurable rectangle-wave, voices can then be pair-wise combined..
// via CPU digi-samples can be played.. i.e. respectice voice streams could be
// shown to provide more detailed output

int asap_number_trace_streams() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_number_trace_streams() {
	return _scope_enabled ? asap_get_channels() : 0;
}
const char** asap_trace_streams() __attribute__((noinline));
const char** EMSCRIPTEN_KEEPALIVE asap_trace_streams() {
	return (const char**)_scope_buffers;	// ugly cast to make emscripten happy
}

