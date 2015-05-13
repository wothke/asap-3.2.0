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


static ASAP* asap= 0; 
static const ASAPInfo* info= 0;


ASAP* getAsap() {
	if (asap == 0)
		asap= ASAP_New();
	return asap;
}

int asap_getInfo() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_getInfo() {
    info= ASAP_GetInfo(getAsap());
	return 0;
}

cibool asap_load(const char *filename, unsigned char *buf, long len) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asap_load(const char *filename, unsigned char *buf, long len) {
	if (asap != 0) {
		ASAP_Delete(asap);
		asap= 0;
	}
	return ASAP_Load(getAsap(), filename, buf, len);
}

cibool asap_playSong(int song, int duration) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asap_playSong(int song, int duration) {
	return ASAP_PlaySong(getAsap(), song, duration);
}

int asap_generate(unsigned char *buffer, int bufferLen, int format) __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asap_generate(unsigned char *buffer, int bufferLen, int format) {
	ASAPSampleFormat f;
	switch(format) {
		case 1:
			f= ASAPSampleFormat_S16_L_E;
			break;
		case 2:
			f= ASAPSampleFormat_S16_B_E;
			break;
		default:
			f= ASAPSampleFormat_U8;
			break;
	}
	return ASAP_Generate(getAsap(), buffer, bufferLen, f);
}

const char *asapinfo_GetTitleOrFilename() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asapinfo_GetTitleOrFilename() {
	return ASAPInfo_GetTitleOrFilename(info);
}

const char *asapinfo_GetDate() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asapinfo_GetDate() {
	return ASAPInfo_GetDate(info);
}

const char *asapinfo_GetAuthor() __attribute__((noinline));
const char *EMSCRIPTEN_KEEPALIVE asapinfo_GetAuthor() {
	return ASAPInfo_GetAuthor(info);
}

int asapinfo_GetDefaultSong() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asapinfo_GetDefaultSong() {
	return ASAPInfo_GetDefaultSong(info);
}

int asapinfo_GetSongs() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asapinfo_GetSongs() {
	return ASAPInfo_GetSongs(info);
}

int asapinfo_GetChannels() __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asapinfo_GetChannels() {
	return ASAPInfo_GetChannels(info);
}

int asapinfo_GetDuration(int song) __attribute__((noinline));
int EMSCRIPTEN_KEEPALIVE asapinfo_GetDuration(int song) {
	return ASAPInfo_GetDuration(info, song);
}

cibool asapinfo_GetLoop(int song) __attribute__((noinline));
cibool EMSCRIPTEN_KEEPALIVE asapinfo_GetLoop(int song) {
	return ASAPInfo_GetLoop(info, song);
}

