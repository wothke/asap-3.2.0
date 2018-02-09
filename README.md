# webasap (Web plugin of ASAP - see live demo: http://www.wothke.ch/webasap/)

	Copyright (C) 2015 Juergen Wothke

	This program (i.e web extensions of ASAP) is free software: you can 
	redistribute it and/or modify it under the terms of the GNU General Public 
	License as published by the Free Software Foundation, either version 3 of 
	the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.


	Original C code of "ASAP" (see http://http://asap.sourceforge.net//).

This is a JavaScript/WebAudio plugin of ASAP. This plugin is designed to work with my 
generic WebAudio ScriptProcessor music player (see separate project). 

This project is based on ASAP version 3.2.0: The respective asap.h & asap.c files have been copied here (unchanged).


## How to build

You'll need Emscripten (http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html). The make script 
is designed for use of emscripten version 1.37.29 (unless you want to create WebAssembly output, older versions might 
also still work).

The below instructions assume that the asap-3.2.0 project folder has been moved into the main emscripten 
installation folder (maybe not necessary) and that a command prompt has been opened within the 
project's "emscripten" sub-folder, and that the Emscripten environment vars have been previously 
set (run emsdk_env.bat).

The Web version is then built using the makeEmscripten.bat that can be found in this folder. The 
script will compile directly into the "emscripten/htdocs" example web folder, were it will create 
the backend_asap.js library. The content of the "htdocs" can be tested by first copying into some 
document folder of a web server (this running example shows how the code is used). 

## Dependencies
The current version requires version 1.02 (older versions will not
support WebAssembly) of my https://github.com/wothke/webaudio-player.

