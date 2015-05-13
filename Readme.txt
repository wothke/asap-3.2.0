
webasap (Web version of ASAP - see live demo: http://www.wothke.ch/webasap/)
=======

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



This project is based on ASAP version 3.2.0: The respective asap.h & asap.c files have been copied here (unchanged).


How to build:

You'll need emscripten to build the web version (I used the win installer: emsdk-1.13.0-full-32bit.exe 
which (at the time) could be found here: http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
I did not need to perform ANY manual changes on the installation. 

I assume that the asap-3.2.0 project folder has been moved into the main emscripten folder (maybe not necessary) and 
that a command prompt has been opened within that folder and the Emscripten environment vars have been 
set (i.e. emsdk_env.bat has been called).


Running the makeEmscripten.bat in the project folder will generate the asap.js emulator file in the 'htdocs' sub-folder.
The content of the respective folder can be deployed in some arbitrary folder under the document root of your web server 
for testing.

