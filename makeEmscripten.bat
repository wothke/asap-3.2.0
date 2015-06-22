rem unfortunately the closure compiler removes code that is actually needed and only the LINKABLE=1 hack so far is a viable workaround 

emcc.bat  -s VERBOSE=0 -Wno-pointer-sign -I./src -Os -O3  --closure 1 --llvm-lto 1   -s NO_FILESYSTEM=1 asap.c interface.c -s EXPORTED_FUNCTIONS="['_alloc', '_asap_getInfo', '_asap_load', '_asap_playSong', '_asap_generate', '_asapinfo_GetTitleOrFilename', '_asapinfo_GetDate', '_asapinfo_GetAuthor', '_asapinfo_GetDefaultSong', '_asapinfo_GetSongs', '_asapinfo_GetDuration', '_asapinfo_GetChannels', '_asapinfo_GetLoop']" -o htdocs/asap2.html && copy /b shell-pre.js + htdocs\asap2.js + shell-post.js +adapter.js htdocs\asap.js && del htdocs\asap2.html && del htdocs\asap2.js && copy /b htdocs\asap.js + asap_adapter.js htdocs\backend_asap.js
